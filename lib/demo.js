const config = require('config')

const Stoplight = require('./stoplight.js')

let stoplight = new Stoplight(config.get('Pinout.nLed'))

stoplight.enable()
