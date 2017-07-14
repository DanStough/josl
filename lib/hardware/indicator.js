const debug = require('debug')('hardware:indicator')
const gpio = require('raspi-gpio')
const EventEmitter = require('events')

// Common flash EventEmitter
let flashEmitter = new EventEmitter()
setInterval(() => {
  flashEmitter.emit('flash')
}, 500)

module.exports = class Indicator {
  constructor (pinId) {
    this.isFlashing = false
    this.isEnabled = false

    this.nOutputPin = new gpio.DigitalOutput(pinId)
    this.nOutputPin.write(gpio.HIGH)

    // Setup flash handler common to all Indicator instances
    flashEmitter.on('flash', this._flashHandler.bind(this))
    debug('Indicator output constructed on pin ID ' + this.pinId)
  }

  // PUBLIC ENABLE INTERFACE

  get enabled () {
    return this.isEnabled
  }

  enable () {
    this.isEnabled = true
    this.nOutputPin.write(gpio.LOW)
    debug('Indicator output enabled on pin ID ' + this.pinId)
  }

  disable () {
    this.isEnabled = false
    this.nOutputPin.write(gpio.HIGH)
    debug('Indicator output disabled on pin ID ' + this.pinId)
  }

  toggleEnable () {
    this.isEnabled = !this.isEnabled
    this._togglePin()
    debug('Indicator output toggled to ' + (this.enabled ? 'enabled' : 'disabled') + ' on pin ID ' + this.pinId)
  }

  // PUBLIC FLASHING INTERFACE

  get flashing () {
    return this.isFlashing
  }

  flash () {
    this.isFlashing = true
    debug('Indicator flashing enabled for pin ID ' + this.pinId)
  }

  steady () {
    this.isFlashing = false

    // Restore state if the indicator is already enabled
    if (this.isEnabled) {
      this.nOutputPin.write(gpio.LOW)
    }
    debug('Indicator flashing disabled for pin ID ' + this.pinId)
  }

  toggleFlash () {
    this.isFlashing = !this.isFlashing

    // Restore state if the indicator is already enabled
    if (this.isEnabled) {
      this.nOutputPin.write(gpio.LOW)
    }
    debug('Indicator flashing toggled to ' + (this.flashing ? 'enabled' : 'disabled') + ' on pin ID ' + this.pinId)
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
