const config = require('config')
const death = require('death')({uncaughtException: true})

const Indicator = require('./hardware/indicator.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js')

// Indicators
let stoplight = new Stoplight(config.get('Pinout.stoplight'))
let armLed = new Indicator(config.get('Pinout.nLed'))

// Input devices (switches)
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

// // EXIT GRACEFULLY...
// death((signal, err) => {
//   // Dispose of subscriptions
//   keySubscription.unsubscribe()

//   // Reset IO
//   armLed.disable()
//   stoplight.disable()
// })

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