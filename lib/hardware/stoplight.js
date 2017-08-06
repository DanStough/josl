const debug = require('debug')('hardware:stoplight')
const gpio = require('raspi-gpio')
const rx = require('rxjs/Rx')

const Indicator = require('./indicator.js').Indicator

module.exports = class Stoplight {
  constructor (config, muted, startup = true) {
    this.alarmEnabled = false
    this.muteEnabled = muted
    this.startup = startup

    // ALARM-specifc events (behavior is instant an overrides
    // other indicators)
    let alarmHandler = {
      TOGGLE: () => { this._toggleAlarm() },
      ENABLE: () => { this._alarm() },
      DISABLE: () => { this._extinguish() }
    }

    this._green = new Indicator('Green Stoplight', config.nGreen)
    this._yellow = new Indicator('Yellow Stoplight', config.nYellow)
    this._red = new Indicator('Red Stoplight', config.nRed)
    this._alarm = new Indicator('Stoplight Alarm', config.nAlarm, false, alarmHandler)

    // Create an Observable Sequence to play indicator sequences
    this.eventSubject = new rx.Subject()

    // Map event destinations to rx methods
    this.destHandler = {
      GREEN: (e) => { this._green.next(e) },
      YELLOW: (e) => { this._yellow.next(e) },
      RED: (e) => { this._red.next(e) },
      ALARM: (e) => { this._alarm.next(e) }
    }

    this.nEnableOut = new gpio.DigitalOutput(config.nEnable)
    this.nEnableOut.write(gpio.HIGH)
  }

  get enabled () {
    return this.nEnableOut.value === gpio.LOW
  }

  enable () {
    // Play startup sequence if enabled
    if (this.startup) {
      debug('Playing stoplight startup sequence')
      this.nextSeries(startSequence)
    }

    this.nEnableOut.write(gpio.LOW)
  }

  disable () {
    this._green.disable()
    this._yellow.disable()
    this._red.disable()
    this.nEnableOut.write(gpio.HIGH)
  }

  get muted () {
    return this.muteEnabled
  }

  mute () {
    this.muteEnabled = true
    if (this.alarmEnabled) {
      this._alarm.disable()
      this._green.flash()
      this._yellow.flash()
      this._red.flash()
    }
  }

  unmute () {
    this.muteEnabled = false
    if (this.alarmEnabled) {
      this._alarm.enable()
      this._green.steady()
      this._yellow.steady()
      this._red.steady()
    }
  }

  get alarmed () {
    return this.alarmEnabled
  }

  nextSeries (events) {
    // Need to convert delays to dates here because the raspi takes too long b/n
    // processing observables to send them in series.
    let beginDate = new Date()
    this.eventSub = rx.Observable.from(events)
      .scan((acc, event) => {
        event.delay = new Date(acc.delay.getTime() + event.delay)
        return event
      }, {delay: beginDate})
      .subscribe(
        (event) => {
          if (event.dest in this.destHandler) {
            this.destHandler[event.dest](event)
          } else {
            console.error('ERROR: Invalid event destination')
          }
        }
      )
  }

  // "Private" methods
  _alarm () {
    this.alarmEnabled = true
    if (this.muted) {
      this._green.flash()
      this._yellow.flash()
      this._red.flash()
    } else {
      this._alarm.enable()
      this._green.steady()
      this._yellow.steady()
      this._red.steady()
    }
  }

  _extinguish () {
    this.alarmEnabled = false
    if (this.muted) {
      this._green.steady()
      this._yellow.steady()
      this._red.steady()
    } else {
      this._alarm.disable()
    }
  }

  _toggleAlarm () {
    this.alarmEnabled ? this._extinguish() : this._alarm()
  }
}

// Razzle-dazzle for startup
const startSequence = [
  {delay: 1000, dest: 'GREEN', type: 'ENABLE'},

  {delay: 100, dest: 'GREEN', type: 'DISABLE'},
  {delay: 0, dest: 'YELLOW', type: 'ENABLE'},

  {delay: 100, dest: 'YELLOW', type: 'DISABLE'},
  {delay: 0, dest: 'RED', type: 'ENABLE'},

  {delay: 500, dest: 'RED', type: 'DISABLE'},
  {delay: 0, dest: 'YELLOW', type: 'ENABLE'},

  {delay: 100, dest: 'YELLOW', type: 'DISABLE'},
  {delay: 0, dest: 'GREEN', type: 'ENABLE'},

  {delay: 500, dest: 'GREEN', type: 'DISABLE'},
  {delay: 0, dest: 'YELLOW', type: 'ENABLE'},

  {delay: 100, dest: 'YELLOW', type: 'DISABLE'},
  {delay: 0, dest: 'RED', type: 'ENABLE'},

  {delay: 500, dest: 'RED', type: 'DISABLE'},
  {delay: 0, dest: 'YELLOW', type: 'ENABLE'},

  {delay: 100, dest: 'YELLOW', type: 'DISABLE'},
  {delay: 0, dest: 'GREEN', type: 'ENABLE'},

  {delay: 500, dest: 'YELLOW', type: 'ENABLE'},
  {delay: 0, dest: 'RED', type: 'ENABLE'},
  {delay: 0, dest: 'ALARM', type: 'ENABLE'},

  {delay: 3000, dest: 'ALARM', type: 'DISABLE'},
  {delay: 0, dest: 'GREEN', type: 'DISABLE'},
  {delay: 0, dest: 'YELLOW', type: 'DISABLE'},
  {delay: 0, dest: 'RED', type: 'DISABLE'}
]
