const config = require('config')

const Indicator = require('./indicator.js')
const Stoplight = require('./stoplight.js')
const Switch = require('./switch.js')

let stoplight = new Stoplight(config.get('Pinout.stoplight'))
let armLed = new Indicator(config.get('Pinout.nLed'))

let keyswitchListener = (value) => {
  console.log('State switched to: ' + value)
  armLed.toggleEnable()
}
let keyswitch = new Switch(config.get('Pinout.nKeyswitch'))
keyswitch.on(keyswitchListener)

stoplight.enable()

stoplight.green.enable()
// stoplight.green.flash()

// armLed.toggleFlash()
// armLed.toggleEnable()

setTimeout(() => {
  stoplight.disable()
  // armLed.disable()
}, 10000)
