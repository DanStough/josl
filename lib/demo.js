const config = require('config')
const death = require('death')({uncaughtException: true})
const debug = require('debug')('demo')

const Indicator = require('./hardware/indicator.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js')

debug('Initiating JOSL Demo..')

// Indicators
debug('Configure hardware outputs.')
let stoplight = new Stoplight(config.get('Pinout.stoplight'))
let armLed = new Indicator(config.get('Pinout.nLed'))

// Input devices (switches)
debug('Configure hardware inputs.')
let keyswitchListener = (value) => {
  armLed.toggleEnable()
}
let keyswitch = new Switch(config.get('Pinout.nKeyswitch'))
let keySubscription = keyswitch.subscribe(keyswitchListener)

stoplight.enable()
debug('Turn on Green indicator.')

stoplight.green.enable()
// stoplight.green.flash()

// armLed.toggleFlash()
// armLed.toggleEnable()

setTimeout(() => {
  debug('Turn off Green indicator.')
  stoplight.disable()
  // armLed.disable()
}, 10000)

// EXIT GRACEFULLY...
death((signal, err) => {
  debug('Preparing to exit.')

  // Dispose of subscriptions
  keySubscription.unsubscribe()

  // Reset IO
  debug('Resetting hardware I/O.')
  armLed.disable()
  stoplight.disable()

  // le fin (Exit needed to release GPIO)
  debug('Exiting process.')
  process.exit()
})
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
