const debug = require('debug')('service:jenkins')
const EventEmitter = require('events')
const isOnline = require('is-online')  // TODO: Currently there is no outside DNS
const isReachable = require('is-reachable')
const Jenkins = require('jenkins')

// Constants
const msecPerMinute = 1000 * 60
const msecPerHour = msecPerMinute * 60
const msecPerDay = msecPerHour * 24

const statusCodes = {
  FAILED: 0,
  NONE: 1,
  STABLE: 2,
  SUCCESS: 3
}

const statusEvents = {
  FAILED: 'failed-notification',
  NONE: 'none-notification',
  STABLE: 'stable-notification',
  SUCCESS: 'success-notification'
}

module.exports = class JenkinsService {
  constructor (config, period, liveUpdate = false) {
    this.period = period

    if (!config.url || !config.token || !config.jobs) {
      throw new Error('Must provide Jenkins URL, API token and Jobs in local.json')
    }
    if (!(config.jobs instanceof Array)) {
      throw new Error('Jenkins jobs must be provided as array in local.json')
    }
    debug('Constructing new Jenkins service at : ' + config.url)

    this.liveUpdate = liveUpdate

    this.jobs = config.jobs
    this.token = config.token
    this.url = config.url

    // Setup Jenkins to use promises
    this.jenkins = Jenkins({
      baseUrl: config.url,
      promisify: true
    })

    this.state = statusCodes.NONE
    this.daysWithoutFailure = 0

    // This will be needed for live updates
    this.recentBuildMap = {}
    this.jobs.map(job => {
      this.recentBuildMap[job] = 0
    })

    this._eventEmitter = new EventEmitter()

    debug('Jenkins service created.')
  }

  // Valid events
  // 'connection-error'
  // 'reachable-error'
  // 'jenkins-error'
  // 'success-notification'
  // TODO: 'build-notification'
  // 'stable-notification'
  // 'failed-notification'
  // 'none-notification'
  // 'days-only-notification'
  get eventEmitter () {
    debug('Return event emitter.')
    return this._eventEmitter
  }

  start () {
    if (!this.pollInterval) {
      this.pollInterval = setInterval(this._pollRoutine, this.period)
      this._pollRoutine()  // Poll immediately
      debug('Jenkins service polling at ' + this.period / 1000 + ' seconds.')
    }
  }

  stop () {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = undefined
      debug('Jenkins service polling stopped.')
    }
  }

  setPollPeriod (period) {
    this.period = period

    // Restart if already started
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = setInterval(this._pollRoutine, period)
      this._pollRoutine()  // Poll immediately
      debug('Jenkins service polling at ' + period / 1000 + ' seconds.')
    }
  }

  // Bulid
  async buildAll () {
    // Code to build all projects; Probably not a good idea to call this
    debug('Building all Jenkins jobs.')
    let results = await Promise.all(this.jobs.map(async (job) => {
      return this.jenkins.job.build(job, undefined, this.token)
    }))
    return results
  }

  async _pollRoutine () {
    debug('\nBEGINNING POLLING ROUTINE')
    debug('***************************')
    // ****************************
    // ERROR CHECKING
    // ****************************

    // Check for network
    let online = await isOnline()
    debug('Network status: ' + online)
    if (!online) {
      this.state = statusCodes.NONE
      this._eventEmitter.emit('connection-error', {message: 'JOSL has no network connectivity.'})
      return
    }

    // Check for Jenkins server
    let reachable = await isReachable(this.url)
    debug('Jenkins reachable status: ' + reachable)
    if (!reachable) {
      this.state = statusCodes.NONE
      this._eventEmitter.emit('reachable-error', {message: 'Jenkins server ' + this.url + ' cannot be reached.'})
      return
    }

    // TODO: Check the Jenkins info for additional errors, like shutdown
    let info = await this.jenkins.info()
    debug('Jenkins master status: \n' + info + '\n\n')

    // if (!info.something) {
    //   this.state = statusCodes.NONE
    //   this._eventEmitter.emit('jenkins-error', {message: 'Details HERE.'})
    //   return
    // }

    // ****************************
    // POLL JOBS
    // ****************************
    let results = await Promise.all(this.jobs.map(async (job) => {
      debug('Polling Jenkins job: ' + job)
      let jobStatus = await this.jenkins.job.get(job)

      // Check if there are ANY completed builds
      if (jobStatus.lastCompletedBuild) {
        // Check the status of the last completed build.
        if (jobStatus.lastCompletedBuild.number === jobStatus.lastSuccessfulBuild.number) {
          debug('\tJob\'s last build successful')
          return this._findOldestPassingBuild(job, jobStatus, statusCodes.SUCCESS)
        } else if (jobStatus.lastCompletedBuild.number === jobStatus.lastStableBuild.number) {
          debug('\tJob\'s last build stable')
          return this._findOldestPassingBuild(job, jobStatus, statusCodes.STABLE)
        } else {
          debug('\tJob\'s last build failed')
          return {
            job: job,
            lastCompletedBuild: jobStatus.lastCompletedBuild.number,
            newState: statusCodes.FAILED,
            oldestSuccessDate: new Date()
          }
        }
      } else {
        debug('\tNo completed builds for the job')
        return {
          job: job,
          lastCompletedBuild: 0,
          newState: statusCodes.NONE,
          oldestSuccessDate: new Date()
        }
      }
    }))

    // Collect Results
    let newState = Math.min(...results.map((result) => { return result.newState }))
    debug('Current computed state: ' + newState)

    let oldestSuccessTime = Math.max(...results.map((result) => { return result.oldestSuccessDate.getTime() }))
    debug('Old successful state computed: ' + new Date(oldestSuccessTime))

    // Effect state transitions
    let pushUpdate = false
    if (this.liveUpdate) {
      // Check if there was a new build
      results.map((result) => {
        if (this.lastBuildMap[result.job] !== result.lastCompletedBuild) {
          this.lastBuildMap[result.job] = result.lastCompletedBuild
          pushUpdate = true
        }
      })
    } else {
      pushUpdate = this.state !== newState
    }

    // Set days without failure property
    let daysWithoutFailure = Math.floor((Date.now() - oldestSuccessTime) / msecPerDay)
    debug('Setting days without failure to: ' + daysWithoutFailure)
    this.daysWithoutFailure = daysWithoutFailure

    // Update new service state
    this.state = newState

    if (pushUpdate) {
      debug('Emitting event: ' + statusEvents[this.state])
      this._eventEmitter.emit(statusEvents[this.state])
    } else {
      debug('Emitting event: days-only-update')
      this._eventEmitter.emit('days-only-notification')
    }
  }

  async _findOldestPassingBuild (job, jobStatus, code) {
    // Grab the oldest successful or stable date
    let oldestSuccessNumber
    if (jobStatus.lastFailedBuild) {
      oldestSuccessNumber = jobStatus.lastFailedBuild.number + 1
    } else {
      oldestSuccessNumber = jobStatus.builds[0]
    }

    let oldestSuccessfulBuildStatus = await this.jenkins.build.get(job, oldestSuccessNumber)

    return {
      job: job,
      lastCompletedBuild: jobStatus.lastCompletedBuild.number,
      newState: code,
      oldestSuccessDate: new Date(oldestSuccessfulBuildStatus.timestamp)
    }
  }
}
