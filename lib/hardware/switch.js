const debug = require('debug')('hardware:switch')
const gpio = require('raspi-gpio')
const rx = require('rxjs/Rx')

module.exports.switchState = {
  HIGH: gpio.HIGH,
  LOW: gpio.LOW
}

module.exports.Switch = class Switch {
  constructor (name, pinId) {
    this.name = name
    this.pinId = pinId
    this.nInput = new gpio.DigitalInput({
      pin: pinId,
      pullResistor: gpio.PULL_UP})

    this.source = rx.Observable.fromEventPattern(
      (listener) => {
        this.nInput.on('change', listener)
      }
    ).debounceTime(50)

    // Subscribe to pins own updates
    this.value = this.nInput.value
    this.subscribe(val => { this.value = val })

    debug(this.name + ' switch input constructed on pin ID ' + this.pinId)
  }

  subscribe (cb) {
    // Return a subscription; client's responsibility to cancel
    return this.source.subscribe(value => {
      debug(this.name + ' switch input of ' + value + ' received on pin ' + this.pinId)
      cb(value)
    })
  }
}
