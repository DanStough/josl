const debug = require('debug')('hardware:indicator')
const EventEmitter = require('events')
const gpio = require('raspi-gpio')
const rx = require('rxjs/Rx')

// Common flash EventEmitter
let flashEmitter = new EventEmitter()
setInterval(() => {
  flashEmitter.emit('flash')
}, 500)

module.exports = class Indicator {
  constructor (name, pinId) {
    this.name = name
    this.pinId = pinId
    this.isFlashing = false
    this.isEnabled = false

    // Create an Observable Sequence to play indicator sequences
    let rxHandler = {
      TOGGLE: () => { this.toggleEnable() },
      ENABLE: () => { this.enable() },
      DISABLE: () => { this.disable() },
      TOGGLE_FLASH: (e) => { this.toggleFlash() },
      FLASH: () => { this.flash() },
      STEADY: () => { this.steady() }
    }

    this.subject = new rx.Subject()

    this.subscription = this.subject
      .concatMap(event => {
        return rx.Observable.from([event]).delay(event.delay)
      })
      .subscribe((event) => {
        if (event.type in rxHandler) {
          rxHandler[event.type](event)
        } else {
          console.error('ERROR: Invalid Event Type')
        }
      })

    // Setup Output
    this.nOutputPin = new gpio.DigitalOutput(this.pinId)
    this.nOutputPin.write(gpio.HIGH)

    // Setup flash handler common to all Indicator instances
    flashEmitter.on('flash', () => { this._flashHandler() })
    debug(this.name + ' indicator output constructed on pin ID ' + this.pinId)
  }

  // PUBLIC ENABLE INTERFACE

  get enabled () {
    return this.isEnabled
  }

  enable () {
    this.isEnabled = true
    this.nOutputPin.write(gpio.LOW)
    debug(this.name + ' indicator output enabled on pin ID ' + this.pinId)
  }

  disable () {
    this.isEnabled = false
    this.nOutputPin.write(gpio.HIGH)
    debug(this.name + ' indicator output disabled on pin ID ' + this.pinId)
  }

  toggleEnable () {
    this.isEnabled = !this.isEnabled
    this._togglePin()
    debug(this.name + ' indicator output toggled to ' + (this.enabled ? 'enabled' : 'disabled') + ' on pin ID ' + this.pinId)
  }

  // PUBLIC FLASHING INTERFACE

  get flashing () {
    return this.isFlashing
  }

  flash () {
    this.isFlashing = true
    debug(this.name + ' indicator flashing enabled for pin ID ' + this.pinId)
  }

  steady () {
    this.isFlashing = false

    // Restore state if the indicator is already enabled
    if (this.isEnabled) {
      this.nOutputPin.write(gpio.LOW)
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

  // PUBLIC EVENT METHODS
  next (event) {
    this.subject.next(event)
  }

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
