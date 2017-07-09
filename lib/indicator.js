const gpio = require('raspi-gpio')
const EventEmitter = require('events')

// Common flash EventEmitter
let flashEmitter = new EventEmitter()
setInterval(() => {
  flashEmitter.emit('flash')
}, 1000)

module.exports = class Indicator {
  constructor (pin) {
    this.isFlashing = false
    this.isEnabled = false

    this.nOutputPin = new gpio.DigitalOutput(pin)
    this.nOutputPin.write(gpio.HIGH)

    // Setup flash handler common to all Indicator instances
    flashEmitter.on('flash', this._flashHandler.bind(this))
  }

  // PUBLIC ENABLE INTERFACE

  get enabled () {
    return this.isEnabled
  }

  enable () {
    this.isEnabled = true
    this.nOutputPin.write(gpio.LOW)
  }

  disable () {
    this.isEnabled = false
    this.nOutputPin.write(gpio.HIGH)
  }

  toggleEnable () {
    this.isEnabled = !this.isEnabled
    this._togglePin()
  }

  // PUBLIC FLASHING INTERFACE

  get flashing () {
    return this.isFlashing
  }

  flash () {
    this.isFlashing = true
  }

  steady () {
    this.isFlashing = false

    // Restore state if the indicator is already enabled
    if (this.isEnabled) {
      this.nOutputPin.write(gpio.LOW)
    }
  }

  toggleFlash () {
    this.isFlashing = !this.isFlashing

    // Restore state if the indicator is already enabled
    if (this.isEnabled) {
      this.nOutputPin.write(gpio.LOW)
    }
  }

  // TODO: pulse (duration) {}

  // "PRIVATE METHODS"

  _flashHandler () {
    if (this.isEnabled && this.isFlashing) {
      this._togglePin()
    }
  }

  _togglePin () {
    this.nOutputPin.value === gpio.HIGH ? this.nOutputPin.write(gpio.LOW) : this.nOutputPin.write(gpio.HIGH)
  }
}
