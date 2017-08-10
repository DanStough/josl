// application.js
//
// This is the JOSl application entry point. The app
// code is exported as a closure so that is can be executed
// through command line arguments.
//
// The application code uses the event emitter from the provided
// service to register listeners on jenkins events. The service
// polls Jenkins every 5 minutes by default.

const config = require('config')
const death = require('death')({uncaughtException: true})
const debug = require('debug')('application')

const Indicator = require('./hardware/indicator.js').Indicator
const Jenkins = require('./service/jenkins.js')
const SevenSegment = require('./hardware/sevenSegment.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js').Switch
const sState = require('./hardware/switch.js').switchState

const statusCodes = {
  FAILED: 0,
  NONE: 1,
  STABLE: 2,
  SUCCESS: 3,
  ERROR_1: 4,
  ERROR_2: 5,
  ERROR_3: 6
}

module.exports = () => {
  debug('Initiating JOSL application..')

  // Unhandled Promise rejections
  process.on('unhandledRejection', (reason) => {
    console.log('Reason: ' + reason)
  })

  // Input devices (switches)
  debug('Initializing hardware inputs.')
  const keyswitch = new Switch('Arm Keyswitch', config.get('Pinout.nKeyswitch'))
  const pushbutton = new Switch('Mushroom Button', config.get('Pinout.nPushbutton'))

  // Output Devices
  debug('Initializing hardware outputs.')
  const stoplight = new Stoplight(config.get('Pinout.stoplight'), keyswitch.value === sState.LOW)
  const armLed = new Indicator('Arm Status LED', config.get('Pinout.nLed'), keyswitch.value !== sState.LOW)
  const daysDisplay = new SevenSegment('Days Display')

  stoplight.enable()

  // Initialize Jenkins service
  debug('Initializing Jenkins service.')
  const jenkins = new Jenkins(config.get('Jenkins'))

  let appState = statusCodes.NONE

  // Service events
  jenkins.eventEmitter.on('connection-error', () => {
    if (appState !== statusCodes.ERROR_1) {
      appState = statusCodes.ERROR_1
      daysDisplay.showError(1)
      stoplight.nextSeries([
        {dest: 'RED', type: 'FLASH', delay: 0},
        {dest: 'RED', type: 'DISABLE', delay: 3000}
      ])
    }
  })

  jenkins.eventEmitter.on('reachable-error', () => {
    if (appState !== statusCodes.ERROR_2) {
      appState = statusCodes.ERROR_2
      daysDisplay.showError(2)
      stoplight.nextSeries([
        {dest: 'RED', type: 'FLASH', delay: 0},
        {dest: 'RED', type: 'DISABLE', delay: 3000}
      ])
    }
  })

  jenkins.eventEmitter.on('jenkins-error', () => {
    if (appState !== statusCodes.ERROR_3) {
      appState = statusCodes.ERROR_3
      daysDisplay.showError(3)
      stoplight.nextSeries([
        {dest: 'RED', type: 'FLASH', delay: 0},
        {dest: 'RED', type: 'DISABLE', delay: 3000}
      ])
    }
  })

  jenkins.eventEmitter.on('success-notification', () => {
    appState = statusCodes.SUCCESS
    daysDisplay.showSmile()

    // Give ten seconds for the smile
    setTimeout(() => { daysDisplay.showNumber(jenkins.daysWithoutFailure) }, 10000)

    stoplight.nextSeries([
      {dest: 'GREEN', type: 'FLASH', delay: 0},
      {dest: 'GREEN', type: 'DISABLE', delay: 5000}
    ])
  })

  jenkins.eventEmitter.on('stable-notification', () => {
    appState = statusCodes.STABLE
    daysDisplay.showNumber(jenkins.daysWithoutFailure)

    stoplight.nextSeries([
      {dest: 'YELLOW', type: 'FLASH', delay: 0},
      {dest: 'YELLOW', type: 'DISABLE', delay: 5000}
    ])
  })

  jenkins.eventEmitter.on('failed-notification', () => {
    appState = statusCodes.FAILED
    daysDisplay.showFrown()
    stoplight.nextSeries([
      {dest: 'ALARM', type: 'ENABLE', delay: 0},
      {dest: 'RED', type: 'ENABLE', delay: 0},
      {dest: 'ALARM', type: 'DISABLE', delay: 5000},
      {dest: 'RED', type: 'DISABLE', delay: 0}
    ])
  })

  jenkins.eventEmitter.on('none-notification', () => {
    appState = statusCodes.NONE
    daysDisplay.showNumber(jenkins.daysWithoutFailure)
  })

  // days-only-notification
  jenkins.eventEmitter.on('days-only-notification', () => {
    if (appState !== statusCodes.NONE || appState !== statusCodes.FAILED) {
      daysDisplay.showNumber(jenkins.daysWithoutFailure)
    }
  })

  // ******************************
  // Hook Inputs to Outputs
  // ******************************
  debug('Configuring I/O behavior')
  const keyswitchListener = (value) => {
    armLed.toggleEnable()
    value === sState.LOW ? stoplight.mute() : stoplight.unmute()
  }
  const keySubscription = keyswitch.subscribe(keyswitchListener)

  const pushbuttonListener = (value) => {
    if (value === sState.LOW) {
      // Flash the alarm
      stoplight.nextSeries([
        {dest: `ALARM`, type: 'ENABLE', delay: 0},
        {dest: `GREEN`, type: 'ENABLE', delay: 0},
        {dest: `YELLOW`, type: 'ENABLE', delay: 0},
        {dest: `RED`, type: 'ENABLE', delay: 0},

        {dest: `ALARM`, type: 'DISABLE', delay: 5000},
        {dest: `GREEN`, type: 'DISABLE', delay: 0},
        {dest: `YELLOW`, type: 'DISABLE', delay: 0},
        {dest: `RED`, type: 'DISABLE', delay: 0}
      ])

      // Probably a good idea never to do this
      // jenkins.buildAll()
    }
  }
  const pushSubscription = pushbutton.subscribe(pushbuttonListener)

  // ******************************
  // MAIN PROGRAM LOOP
  // ******************************
  debug('Running JOSL application.')

  // Allow ten seconds for startup
  setTimeout(() => {
    jenkins.start(300000)  // five minutes
  }, 10000)

  // ******************************
  // EXIT GRACEFULLY...
  // ******************************
  death((signal, err) => {
    debug('Preparing to exit.')

    // Dispose of subscriptions
    keySubscription.unsubscribe()
    pushSubscription.unsubscribe()

    // Reset IO
    debug('Resetting hardware I/O.')
    armLed.disable()
    stoplight.disable()
    daysDisplay._clearSync()

    // le fin (Exit needed to release GPIO)
    debug('Exiting process. Goodbye, Felicia!')
    process.exit()
  })
}
/*
         .,ad88888ba,.
     .,ad8888888888888a,
    d8P"""98888P"""98888b,
    9b    d8888,    `9888B
  ,d88aaa8888888b,,,d888P'
 d8888888888888888888888b
d888888P""98888888888888P
88888P'    9888888888888
`98P'       9888888888P'
             `"9888P"'
                `"'
 */
