const gpio = require('raspi-gpio')

module.exports = class Switch {
  constructor (pinId) {
    this.nInput = new gpio.DigitalInput(pinId, gpio.PULL_UP)
  }

  on (changeListener) {
    this.nInput.on('change', (value) => {
      changeListener(value)
    })
  }
}
