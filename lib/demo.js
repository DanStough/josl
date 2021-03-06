// demo.js
//
// This is the JOSl demo application entry point. The app
// code is exported as a closure so that is can be executed
// through command line arguments.
//
// The demo code run up the date counter until is reaches 13 days,
// at which point it registers an error and waits for to be
// cleared by the pushbutton. The keyswitch functions only as mute.

const config = require('config')
const death = require('death')({uncaughtException: true})
const debug = require('debug')('demo')

const Indicator = require('./hardware/indicator.js').Indicator
const SevenSegment = require('./hardware/sevenSegment.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js').Switch
const sState = require('./hardware/switch.js').switchState

let count = -2        // allow one loop for initialization indicators
let status = 'PASSED' // FAILED and BUILDING also valid

module.exports = () => {
  debug('Initiating JOSL Demo..')

  // Unhandled Promise rejections
  process.on('unhandledRejection', (reason) => {
    console.log('Reason: ' + reason)
  })

  // Input devices (switches)
  debug('Initializing hardware inputs.')
  const keyswitch = new Switch('Arm Keyswitch', config.get('Pinout.nKeyswitch'))
  const pushbutton = new Switch('Mushroom Button', config.get('Pinout.nPushbutton'))

  // Output Devices
  debug('Initializing hardware outputs.')
  const stoplight = new Stoplight(config.get('Pinout.stoplight'), keyswitch.value === sState.LOW)
  const armLed = new Indicator('Arm Status LED', config.get('Pinout.nLed'), keyswitch.value !== sState.LOW)
  const daysDisplay = new SevenSegment('Days Display')

  stoplight.enable()

  // ******************************
  // State transitions
  // ******************************
  // BUILDING -> PASSING
  const clear = () => {
    debug('Clearing Build Failure.')
    status = 'PASSING'

    daysDisplay.showSmile()

    // Send passing alarm
    stoplight.nextSeries([
      {dest: 'GREEN', type: 'FLASH', delay: 0},
      {dest: 'GREEN', type: 'DISABLE', delay: 3000}
    ])
    // Seven Segment will reset automatically; just clear 'count'
    count = 0
  }

  // FAILED -> BUILDING
  const build = () => {
    debug('Building Jenkins project.')
    status = 'BUILDING'

    daysDisplay.showBuild()

    // Send busy alarm
    stoplight.nextSeries([
      {dest: 'YELLOW', type: 'FLASH', delay: 0},
      {dest: 'YELLOW', type: 'DISABLE', delay: 3000}
    ])

    // Set faux build time to 5 seconds
    setTimeout(() => {
      clear()
    }, 5000)
  }

  // PASSING -> FAILING
  const fail = () => {
    debug('Build failed.')
    status = 'FAILED'

    daysDisplay.showFrown()

    // Send fail alarm
    stoplight.nextSeries([
      {delay: 0, dest: 'ALARM', type: 'ENABLE'},
      {delay: 0, dest: 'RED', type: 'ENABLE'},
      {delay: 3000, dest: 'ALARM', type: 'DISABLE'},
      {delay: 0, dest: 'RED', type: 'DISABLE'}
    ])
  }

  debug('Setting re-occurring count count to display.')

  // ******************************
  // Hook Inputs to Outputs
  // ******************************
  debug('Configuring I/O behavior')
  const keyswitchListener = (value) => {
    armLed.toggleEnable()
    value === sState.LOW ? stoplight.mute() : stoplight.unmute()
  }
  const keySubscription = keyswitch.subscribe(keyswitchListener)

  const pushbuttonListener = (value) => {
    if (value === sState.LOW && status === 'FAILED') {
      build()
    }
  }
  const pushSubscription = pushbutton.subscribe(pushbuttonListener)

  // ******************************
  // MAIN PROGRAM LOOP
  // ******************************
  debug('Running JOSL demo application.')
  setInterval(() => {
    if (count === 14) {
      fail()
    } else if (count > 0 && count < 14) {
      daysDisplay.showNumber(count)
    }
    ++count
  }, 2000)

  // ******************************
  // EXIT GRACEFULLY...
  // ******************************
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
}
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
