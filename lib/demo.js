const config = require('config')
const gpio = require('raspi-gpio')

const stoplight = require('./stoplight.js')

const output = new gpio.DigitalOutput(config.get('Pinout.nLed'))

output.write('LOW')
