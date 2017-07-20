const config = require('config')
const death = require('death')({uncaughtException: true})
const debug = require('debug')('demo')
const gpio = require('raspi-gpio')

const Indicator = require('./hardware/indicator.js')
const SevenSegment = require('./hardware/sevenSegment.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js')

debug('Initiating JOSL Demo..')

// Indicators
debug('Configure hardware outputs.')
let stoplight = new Stoplight(config.get('Pinout.stoplight'))
let armLed = new Indicator('Arm Status LED', config.get('Pinout.nLed'))
let daysDisplay = new SevenSegment('Days Display')

// Input devices (switches)
debug('Configure hardware inputs.')
let keyswitchListener = (value) => {
  armLed.toggleEnable()
}
let keyswitch = new Switch('Arm Keyswitch', config.get('Pinout.nKeyswitch'))
let keySubscription = keyswitch.subscribe(keyswitchListener)

let pushbuttonListener = (value) => {
  if (value === gpio.LOW) {
    stoplight.green.toggleEnable()
  }
}
let pushbutton = new Switch('Mushroom Button', config.get('Pinout.nPushbutton'))
let pushSubscription = pushbutton.subscribe(pushbuttonListener)

stoplight.enable()
debug('Turn on Green indicator.')

daysDisplay.setBrightness(100)
// stoplight.green.flash()
stoplight.green.enable()
// stoplight.green.flash()

debug('Setting re-occurring count count to display.')
let count = 0
setInterval(() => {
  daysDisplay.showNumber(count)
  ++count
}, 500)

// EXIT GRACEFULLY...
death((signal, err) => {
  debug('Preparing to exit.')

  // Dispose of subscriptions
  keySubscription.unsubscribe()
  pushSubscription.unsubscribe()

  // Reset IO
  debug('Resetting hardware I/O.')
  armLed.disable()
  stoplight.disable()
  daysDisplay._clearSync()

  // le fin (Exit needed to release GPIO)
  debug('Exiting process. Goodbye, Felicia!')
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
