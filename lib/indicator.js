const gpio = require('raspi-gpio')
const EventEmitter = require('events')

let flashEmitter = new EventEmitter()
setInterval(() => {
  flashEmitter.emit('flash')
}, 1000)

module.exports = class Indicator {
  constructor (pin) {
    this.flashing = false
    this.enabled = false

    this.nOutputPin = new gpio.DigitalOutput(pin)
    this.nOutputPin.write(gpio.HIGH)

    // Setup flash handler common to all Indicator instances
    flashEmitter.on('flash', this._flashHandler())
  }

  toggleEnable () {
    this.enabled = !this.enabled
    this._togglePin()
  }

  toggleFlash () {
    this.flashing = !this.flashing

    // Restore state if the indicator is already enabled
    if (this.enabled) {
      this.nOutputPin.write(gpio.LOW)
    }
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

  // TODO: pulse (duration) {}

  _flashHandler () {
    if (this.enabled && this.flashing) {
      this._togglePin()
    }
  }

  _togglePin () {
    this.nOutputPin.value === gpio.HIGH ? this.nOutputPin.write(gpio.LOW) : this.nOutputPin.write(gpio.HIGH)
  }
}
