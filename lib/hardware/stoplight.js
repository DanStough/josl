const gpio = require('raspi-gpio')
const Indicator = require('./indicator.js')

module.exports = class Stoplight {
  constructor (config, muted) {
    this.flashing = false
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

  // TODO: mute()
}
