// clock.js
//
// This is the JOSl clock application entry point. The app
// code is exported as a closure so that is can be executed
// through command line arguments.
//
// The clock app will display the local time on the seven segment
// display. On the hour, it will also blink lights on the hour.
//
// Currently front panel controls are disabled.

const config = require('config')
const death = require('death')({uncaughtException: true})
const debug = require('debug')('clock')

const Indicator = require('./hardware/indicator.js').Indicator
const SevenSegment = require('./hardware/sevenSegment.js')
const Stoplight = require('./hardware/stoplight.js')
const Switch = require('./hardware/switch.js').Switch
const sState = require('./hardware/switch.js').switchState

const pollTime = 20000

module.exports = () => {
  debug('Initiating JOSL Clock application..')

  // Unhandled Promise rejections
  process.on('unhandledRejection', (reason) => {
    console.log('Reason: ' + reason)
  })

  // Input devices (switches)
  debug('Initializing hardware inputs.')
  let keyswitch = new Switch('Arm Keyswitch', config.get('Pinout.nKeyswitch'))
  // let pushbutton = new Switch('Mushroom Button', config.get('Pinout.nPushbutton'))

  // Output Devices
  debug('Initializing hardware outputs.')
  let stoplight = new Stoplight(config.get('Pinout.stoplight'), keyswitch.value === sState.LOW)
  let armLed = new Indicator('Arm Status LED', config.get('Pinout.nLed'), keyswitch.value !== sState.LOW)
  let clockDisplay = new SevenSegment('Clock Display')

  stoplight.enable()

  // ******************************
  // Hook Inputs to Outputs
  // ******************************
  debug('Configuring I/O behavior')
  let keyswitchListener = (value) => {
    armLed.toggleEnable()
    value === sState.LOW ? stoplight.mute() : stoplight.unmute()
  }
  let keySubscription = keyswitch.subscribe(keyswitchListener)

  // let pushbuttonListener = (value) => {
  //   if (value === sState.LOW && status === 'FAILED') {
  //     build()
  //   }
  // }
  // let pushSubscription = pushbutton.subscribe(pushbuttonListener)

  // ******************************
  // POLLING HANDLER
  // ******************************
  let lastHourlyNotice = -1

  debug('Running JOSL clock application.')

  const clockUpdate = () => {
    let now = new Date()
    let hours = now.getHours()
    let minutes = now.getMinutes()
    let isPM = false

    // Adjust for 24 clock
    if (hours > 12) {
      isPM = true
      hours -= 12
    }

    debug('Clock update to: ' + (hours * 100 + minutes) + (isPM ? ' PM' : ' AM'))
    clockDisplay.showTime(hours * 100 + minutes, isPM)

    // Check for on the hour notification
    if (minutes === 0 && lastHourlyNotice !== hours) {
      lastHourlyNotice = hours

      let color = isPM ? 'RED' : 'GREEN'

      // Flash the number of hours
      stoplight.nextSeries([
        {dest: `${color}`, type: 'FLASH', delay: 0},
        {dest: `${color}`, type: 'DISABLE', delay: hours * 1000}
      ])
    }
  }

  // ******************************
  // MAIN PROGRAM LOOP
  // ******************************

  // Wait 3 seconds, then initially update the display and setup the polling loop
  setTimeout(clockUpdate, 3000)
  setInterval(clockUpdate, pollTime)

  // ******************************
  // EXIT GRACEFULLY...
  // ******************************
  death((signal, err) => {
    debug('Preparing to exit.')

    // Dispose of subscriptions
    keySubscription.unsubscribe()
    // pushSubscription.unsubscribe()

    // Reset IO
    debug('Resetting hardware I/O.')
    armLed.disable()
    stoplight.disable()
    clockDisplay._clearSync()

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
