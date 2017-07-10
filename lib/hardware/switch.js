const gpio = require('raspi-gpio')
const rx = require('rx')

module.exports = class Switch {
  constructor (pinId) {
    this.nInput = new gpio.DigitalInput({
      pin: pinId,
      pullResistor: gpio.PULL_UP})

    this.source = rx.Observable.fromEventPattern(
      (listener) => {
        this.nInput.on('change', listener)
      }
    ).debounce(200)

    this.subscription = this.source.subscribe(
      function (result) {
        console.log('The state has changed to: ' + result)
      }
    )
  }

  on () {
    console.log('Hello World')
  }
}
