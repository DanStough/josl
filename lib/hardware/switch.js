const debug = require('debug')('hardware:switch')
const gpio = require('raspi-gpio')
const rx = require('rxjs/Rx')

module.exports = class Switch {
  constructor (name, pinId) {
    this.name = name
    this.pinId = pinId
    this.nInput = new gpio.DigitalInput({
      pin: pinId,
      pullResistor: gpio.PULL_UP})
    this.value = this.nInput.value

    this.source = rx.Observable.fromEventPattern(
      (listener) => {
        this.nInput.on('change', listener)
      }
    ).debounceTime(50)
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
