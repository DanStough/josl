const config = require('config')

const Indicator = require('./hardware/indicator.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js')

let stoplight = new Stoplight(config.get('Pinout.stoplight'))
let armLed = new Indicator(config.get('Pinout.nLed'))

let keyswitchListener = (value) => {
  armLed.toggleEnable()
}
let keyswitch = new Switch(config.get('Pinout.nKeyswitch'))
let keySubscription = keyswitch.subscribe(keyswitchListener)

stoplight.enable()

stoplight.green.enable()
// stoplight.green.flash()

// armLed.toggleFlash()
// armLed.toggleEnable()

setTimeout(() => {
  stoplight.disable()
  // armLed.disable()
}, 10000)

/*
         .,ad88888ba,.
     .,ad8888888888888a,
    d8P"""98888P"""98888b,
    9b    d8888,    `9888B
  ,d88aaa8888888b,,,d888P'
 d8888888888888888888888b
d888888P""98888888888888P
88888P'    9888888888888
`98P'       9888888888P'
             `"9888P"'
                `"'
 */

function cleanup () {
  // Dispose of subscriptions
  keySubscription.unsubscribe()

  // Reset IO
  armLed.disable()
  stoplight.disable()
}

function exitHandler (options, err) {
  if (options.cleanup) {
    console.log('clean')
    cleanup()
  }
  if (err) console.log(err.stack)
  if (options.exit) process.exit()
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}))

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {cleanup: true, exit: true}))

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {cleanup: true, exit: true}))
