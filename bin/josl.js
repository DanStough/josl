const program = require('commander')

let appMode

program
  .version('0.0.1')
  .arguments('[mode]')
  .option('-d, --debug', 'Enable all debugging output')
  .description('Run the JOSL I/O demo; does not require a connection to a Jenkin\'s Server')
  .action((mode) => {
    appMode = mode
  })
  .parse(process.argv)

// Check options for debugging
if (program.debug) {
  process.env.DEBUG = '*'
}

// This need to be done after commander to set up environment variables correctly

// const clock = require('../lib/clock')
const demo = require('../lib/demo')
// const joslApp = require('../lib/application')

const validModes = {
  demo: demo,
  clock: ''   // clock function
}

// Check for the mode
if (!appMode) {
  // Run regular app
} else if (appMode in validModes) {
  // Run modified app
  validModes[appMode]()
} else {
  console.error('ERROR: Invalid argument.')
  program.help()
}
