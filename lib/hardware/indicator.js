const debug = require('debug')('hardware:indicator')
const gpio = require('raspi-gpio')
const rx = require('rxjs/Rx')

module.exports.indicatorState = {
  HIGH: gpio.HIGH,
  LOW: gpio.LOW
}

module.exports.Indicator = class Indicator {
  constructor (name, pinId, enabled, handler) {
    this.name = name
    this.pinId = pinId
    this.isFlashing = false
    this.isEnabled = enabled || false

    // Create an Observable Sequence to play indicator sequences
    let rxHandler = handler || {
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
      },
      (err) => { console.error(err) })

    // Setup Output
    this.nOutputPin = new gpio.DigitalOutput(this.pinId)
    this.isEnabled ? this.nOutputPin.write(gpio.LOW) : this.nOutputPin.write(gpio.HIGH)

    debug(this.name + ' indicator output constructed on pin ID ' + this.pinId)
  }

  // PUBLIC ENABLE INTERFACE

  get enabled () {
    return this.isEnabled
  }

  enable () {
    if (!this.isEnabled) {
      this.isEnabled = true
      this.nOutputPin.write(gpio.LOW)
      debug(this.name + ' indicator output enabled on pin ID ' + this.pinId)
    } else {
      debug(this.name + ' indicator output already enabled on pin ID ' + this.pinId)
    }
  }

  disable () {
    this.isEnabled = false

    // Turn off immediately if it is not flashing, otherwise is will be canceled automatically
    if (!this.flashing) {
      this.nOutputPin.write(gpio.HIGH)
    }

    debug(this.name + ' indicator output disabled on pin ID ' + this.pinId)
  }

  toggleEnable () {
    this.isEnabled = !this.isEnabled
    this.isEnabled ? this.enable() : this.disable()
    debug(this.name + ' indicator output toggled to ' + (this.isEnabled ? 'enabled' : 'disabled') + ' on pin ID ' + this.pinId)
  }

  // PUBLIC FLASHING INTERFACE

  get flashing () {
    return this.isFlashing
  }

  flash () {
    this.isFlashing = true
    this.isEnabled = true

    if (!this.flashInterval) {
      // Setup individual timer for flash
      this.flashInterval = setInterval(() => {
        if (!this.isEnabled || !this.isFlashing) {
          clearInterval(this.flashInterval)
          this.flashInterval = undefined

          if (this.isEnabled) {
            // Return to the previous state if still enabled (steady called)
            this.enable()
          } else {
            // Turn off completely (disabled called)
            this.isFlashing = false
            this.nOutputPin.write(gpio.HIGH)
          }
        } else {
          this._togglePin()
        }
      }, 500)

      // Start the flashing immediately
      this.nOutputPin.write(gpio.HIGH)
    }
    debug(this.name + ' indicator flashing enabled for pin ID ' + this.pinId)
  }

  steady () {
    // Flash timer will cancel if
    this.isFlashing = false

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

  _togglePin () {
    this.nOutputPin.value === gpio.HIGH ? this.nOutputPin.write(gpio.LOW) : this.nOutputPin.write(gpio.HIGH)
  }
}
