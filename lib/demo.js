const config = require('config')
const death = require('death')({uncaughtException: true})
const debug = require('debug')('demo')

const Indicator = require('./hardware/indicator.js').Indicator
const SevenSegment = require('./hardware/sevenSegment.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js').Switch
const sState = require('./hardware/switch.js').switchState

// let greenFlashSeq = [
//   {delay: 500, type: 'TOGGLE'},
//   {delay: 200, type: 'TOGGLE'},
//   {delay: 200, type: 'TOGGLE'},
//   {delay: 1000, type: 'TOGGLE'}
// ]

debug('Initiating JOSL Demo..')

// Unhandled Promise rejections
process.on('unhandledRejection', (reason) => {
  console.log('Reason: ' + reason)
})

// Input devices (switches)
debug('Initializing hardware inputs.')
let keyswitch = new Switch('Arm Keyswitch', config.get('Pinout.nKeyswitch'))
let pushbutton = new Switch('Mushroom Button', config.get('Pinout.nPushbutton'))

// Output Devices
debug('Initializing hardware outputs.')
let stoplight = new Stoplight(config.get('Pinout.stoplight'), keyswitch.value === sState.LOW)
let armLed = new Indicator('Arm Status LED', config.get('Pinout.nLed'), keyswitch.value !== sState.LOW)
let daysDisplay = new SevenSegment('Days Display')

// Hook Inputs to Outputs
debug('Configuring I/O behavior')
let keyswitchListener = (value) => {
  armLed.toggleEnable()
}
let keySubscription = keyswitch.subscribe(keyswitchListener)

let pushbuttonListener = (value) => {
  if (value === sState.LOW) {
    stoplight.green.toggleEnable()
  }
}
let pushSubscription = pushbutton.subscribe(pushbuttonListener)

// App Procedure
stoplight.enable()
debug('Turn on Green indicator.')

daysDisplay.setBrightness(100)
// stoplight.green.flash()

// This might need to be a map
// greenFlashSeq.map(event => { stoplight.green.next(event) })

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
