const gpio = require('raspi-gpio')
const rx = require('rxjs/Rx')

const Indicator = require('./indicator.js')

let startSequence = [
  {delay: 0, source: 'GREEN', type: 'ENABLE'},
  {delay: 500, source: 'GREEN', type: 'DISABLE'},
  {delay: 0, source: 'YELLOW', type: 'ENABLE'},
  {delay: 500, source: 'YELLOW', type: 'DISABLE'},
  {delay: 0, source: 'RED', type: 'ENABLE'},
  {delay: 500, source: 'YELLOW', type: 'ENABLE'},
  {delay: 0, source: 'GREEN', type: 'ENABLE'},
  {delay: 0, source: 'ALARM', type: 'ENABLE'},
  {delay: 3000, source: 'ALARM', type: 'DISABLE'},
  {delay: 0, source: 'GREEN', type: 'DISABLE'},
  {delay: 0, source: 'YELLOW', type: 'DISABLE'},
  {delay: 0, source: 'RED', type: 'DISABLE'}
]

module.exports = class Stoplight {
  constructor (config, muted, startup = true) {
    this.alarmEnabled = false
    this.muteEnabled = muted

    this.green = new Indicator('Green Stoplight', config.nGreen)
    this.yellow = new Indicator('Yellow Stoplight', config.nYellow)
    this.red = new Indicator('Red Stoplight', config.nRed)

    // Create an Observable Sequence to play indicator sequences
    this.eventSubject = new rx.Subject()

    // Send events through the stand concatMap, then only handle
    // ALARM events
    let alarmHandler = {
      TOGGLE: () => { this.toggleAlarm() },
      ENABLE: () => { this.alarm() },
      DISABLE: () => { this.steady() }
    }

    this.alarmSub = this.eventSubject
      .concatMap(event => {
        return rx.Observable.from([event]).delay(event.delay)
      })
      .filter(event => event.source === 'ALARM')
      .subscribe((event) => {
        if (event.type in alarmHandler) {
          alarmHandler[event.type](event)
        } else {
          console.error('ERROR: Invalid Event type')
        }
      })

    // Pass through indicator events
    let indicatorHandler = {
      GREEN: (e) => { this.green.next(e) },
      YELLOW: (e) => { this.yellow.next(e) },
      RED: (e) => { this.red.next(e) }
    }

    this.indicatorSub = this.eventSubject
      .filter(event => event.source !== 'ALARM')
      .subscribe((event) => {
        if (event.source in indicatorHandler) {
          indicatorHandler[event.type](event)
        } else {
          console.error('ERROR: Invalid Event source')
        }
      })

    this.nEnableOut = new gpio.DigitalOutput(config.nEnable)
    this.nAlarmOut = new gpio.DigitalOutput(config.nAlarm)

    this.nEnableOut.write(gpio.HIGH)
    this.nAlarmOut.write(gpio.HIGH)

    // Play startup sequence if enabled
    if (startup) {
      startSequence.map(e => this.next(e))
    }
  }

  get enabled () {
    return this.nEnableOut.value === gpio.LOW
  }

  enable () {
    this.nEnableOut.write(gpio.LOW)
  }

  disable () {
    this.green.disable()
    this.yellow.disable()
    this.red.disable()
    this.nEnableOut.write(gpio.HIGH)
  }

  get muted () {
    return this.muteEnabled
  }

  mute () {
    this.muteEnabled = true
    if (this.alarmed) {
      this.nAlarmOut.write(gpio.HIGH)
      this.green.flash()
      this.yellow.flash()
      this.red.flash()
    }
  }

  unmute () {
    this.muteEnabled = false
    if (this.alarmed) {
      this.nAlarmOut.write(gpio.LOW)
      this.green.steady()
      this.yellow.steady()
      this.red.steady()
    }
  }

  get alarmed () {
    this.alarmEnabled = true
  }

  alarm () {
    this.alarmEnabled = true
    if (this.muted) {
      this.green.flash()
      this.yellow.flash()
      this.red.flash()
    } else {
      this.nAlarmOut.write(gpio.LOW)
      this.green.steady()
      this.yellow.steady()
      this.red.steady()
    }
  }

  extinguish () {
    this.alarmEnabled = false
    if (this.muted) {
      this.green.steady()
      this.yellow.steady()
      this.red.steady()
    } else {
      this.nAlarmOut.write(gpio.HIGH)
      this.green.flash()
      this.yellow.flash()
      this.red.flash()
    }
  }

  toggleAlarm () {
    this.alarmed ? this.extinguish() : this.alarm()
  }

  next (e) {
    this.eventSubject.next(e)
  }
}
