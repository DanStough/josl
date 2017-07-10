const config = require('config')

// const Indicator = require('./hardware/indicator.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js')

let stoplight = new Stoplight(config.get('Pinout.stoplight'))
// let armLed = new Indicator(config.get('Pinout.nLed'))

// let keyswitchListener = (value) => {
//   console.log('State switched to: ' + value)
//   armLed.toggleEnable()
// }
let keyswitch = new Switch(config.get('Pinout.nKeyswitch'))
keyswitch.on()

stoplight.enable()

stoplight.green.enable()
// stoplight.green.flash()

// armLed.toggleFlash()
// armLed.toggleEnable()

setTimeout(() => {
  stoplight.disable()
  // armLed.disable()
}, 10000)
