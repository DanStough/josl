const program = require('commander')

// const clock = require('lib/clock')
const demo = require('lib/demo')
// const joslApp = require('lib/application')

const validModes = {
  demo: demo, // demo function
  clock: ''   // clock function
}

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
  process.env['DEBUG'] = 'DEBUG=*'
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
