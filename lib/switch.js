const gpio = require('raspi-gpio')

module.exports = class Switch {
  constructor (pinId) {
    this.nInput = new gpio.DigitalInput({
      pin: pinId,
      pullResistor: gpio.PULL_UP})
  }

  on (changeListener) {
    this.nInput.on('change', (value) => {
      changeListener(value)
    })
  }
}
