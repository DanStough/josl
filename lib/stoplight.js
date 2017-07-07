const gpio = require('raspi-gpio')

module.exports = class Stoplight {
  constructor (config) {
    this.config = config

    this.output = new gpio.DigitalOutput(config)
  }

  enable () {
    this.output.write('LOW')
  }
}
