const config = require('config')
// const gpio = require('raspi-gpio')

const Indicator = require('./indicator.js')
const Stoplight = require('./stoplight.js')

let stoplight = new Stoplight(config.get('Pinout.stoplight'))
let armLed = new Indicator(config.get('Pinout.nLed'))

// let pushbuttonPin = new gpio.DigitalInput(config.get('Pinout.nPushbutton'), gpio.PULL_UP)

// pushbuttonPin.on('change', (value) => {
//   armLed.toggleEnabled()
// })

stoplight.enable()

stoplight.green.enable()
stoplight.green.flash()

armLed.toggleFlash()
armLed.toggleEnable()

setTimeout(() => {
  stoplight.disable()
  armLed.disable()
}, 10000)
