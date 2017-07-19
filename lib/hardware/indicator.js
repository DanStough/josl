const debug = require('debug')('hardware:indicator')
const gpio = require('raspi-gpio')
const EventEmitter = require('events')

// Common flash EventEmitter
let flashEmitter = new EventEmitter()
let flashOn = false

setInterval(() => {
  flashOn = !flashOn
  flashEmitter.emit('flash')
}, 500)

module.exports = class Indicator {
  constructor (name, pinId) {
    this.name = name
    this.pinId = pinId
    this.isFlashing = false
    this.isEnabled = false

    // The indicator is clipped if flashing is (en/dis)abled
    // when flashing is already active; prevents sudden relay pulses
    this.frontClipped = false
    this.backClipped = false

    this.nOutputPin = new gpio.DigitalOutput(this.pinId)
    this.nOutputPin.write(gpio.HIGH)

    // Setup flash handler common to all Indicator instances
    flashEmitter.on('flash', this._flashHandler.bind(this))
    debug(this.name + ' indicator output constructed on pin ID ' + this.pinId)
  }

  // PUBLIC ENABLE INTERFACE

  get enabled () {
    return this.isEnabled
  }

  enable () {
    this.isEnabled = true
    if (this.flashing) {
      this.frontClipped = true
    } else {
      this.nOutputPin.write(gpio.LOW)
    }
    debug(this.name + ' indicator output enabled on pin ID ' + this.pinId)
  }

  disable () {
    this.isEnabled = false
    if (this.flashing) {
      this.backClipped = true
    } else {
      this.nOutputPin.write(gpio.HIGH)
    }
    debug(this.name + ' indicator output disabled on pin ID ' + this.pinId)
  }

  toggleEnable () {
    this.isEnabled ? this.disable() : this.enable()
    debug(this.name + ' indicator output toggled to ' + (this.enabled ? 'enabled' : 'disabled') + ' on pin ID ' + this.pinId)
  }

  // PUBLIC FLASHING INTERFACE

  get flashing () {
    return this.isFlashing
  }

  flash () {
    this.isFlashing = true
    this.frontClipped = true

    debug(this.name + ' indicator flashing enabled for pin ID ' + this.pinId)
  }

  steady () {
    this.isFlashing = false

    // Restore state if the indicator is already enabled
    if (this.isEnabled && !flashOn) {
      this.backClipped = true
    }
    debug(this.name + ' indicator flashing disabled for pin ID ' + this.pinId)
  }

  toggleFlash () {
    this.isFlashing = !this.isFlashing

    // Restore state if the indicator is already enabled
    if (this.isEnabled) {
      this.nOutputPin.write(gpio.LOW)
    }
    debug(this.name + ' indicator flashing toggled to ' + (this.flashing ? 'enabled' : 'disabled') + ' on pin ID ' + this.pinId)
  }

  // TODO: pulse (duration) {}

  // "PRIVATE METHODS"

  _flashHandler () {
    if ((this.isEnabled && this.isFlashing && !this.frontClipped) || this.backClipped) {
      this._togglePin()
    }
    // Reset clipping
    this.frontClipped = false
    this.backClipped = false
  }

  _togglePin () {
    this.nOutputPin.value === gpio.HIGH ? this.nOutputPin.write(gpio.LOW) : this.nOutputPin.write(gpio.HIGH)
  }
}
