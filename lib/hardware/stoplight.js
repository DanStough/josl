const gpio = require('raspi-gpio')
const Indicator = require('./indicator.js')

module.exports = class Stoplight {
  constructor (config, muted) {
    this.alarmed = false
    this.muted = false

    this.green = new Indicator('Green Stoplight', config.nGreen)
    this.yellow = new Indicator('Yellow Stoplight', config.nYellow)
    this.red = new Indicator('Red Stoplight', config.nRed)

    this.nEnableOut = new gpio.DigitalOutput(config.nEnable)
    this.nAlarmOut = new gpio.DigitalOutput(config.nAlarm)

    this.nEnableOut.write(gpio.HIGH)
    this.nAlarmOut.write(gpio.HIGH)
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
    return this.muted
  }

  mute () {
    this.muted = true
    if (this.alarming) {
      this.nAlarmOut.write(gpio.HIGH)
      this.green.flash()
      this.yellow.flash()
      this.red.flash()
    }
  }

  unmute () {
    this.muted = false
    if (this.alarming) {
      this.nAlarmOut.write(gpio.LOW)
      this.green.steady()
      this.yellow.steady()
      this.red.steady()
    }
  }

  get alarmed () {
    this.alarmed = true
  }

  alarm () {
    this.alarmed = true
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
    this.alarmed = false
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
}
