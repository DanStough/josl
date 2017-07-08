const gpio = require('raspi-gpio')

module.exports = class Indicator {
  constructor (pin) {
    this.flashing = false
    this.enabled = false

    this.nOutputPin = new gpio.DigitalOutput(pin)
    this.nOutputPin.write(gpio.HIGH)
  }

  toggle () {
    this.enabled = !this.enabled
    this.enabled ? this.nOutputPin.write(gpio.LOW) : this.nOutputPin.write(gpio.HIGH)
  }

  toggleFlash () {
    this.flashing = !this.flashing
  }

  enabled () {
    return this.enabled
  }

  enable () {
    this.enabled = true
    this.nOutputPin.write(gpio.LOW)
  }

  disable () {
    this.enabled = false
    this.nOutputPin.write(gpio.HIGH)
  }

  // flash () {  }
}
