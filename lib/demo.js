const config = require('config')
const stoplight = require('stoplight')
const gpio = require('raspi-gpio')

const output = new gpio.DigitalOutput(config.get('Pinout.nLed'))

output.write('LOW')
