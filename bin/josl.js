const program = require('commander')

let appMode

program
  .version('0.0.1')
  .arguments('[mode]')
  .option('-d, --debug', 'Enable all debugging output')
  .description('The Jenkins \'Oh Shit\' Light (JOSL) is a custom Jenkins Monitor for multiple jobs.')
  .action((mode) => {
    appMode = mode
  })

program.on('--help', () => {
  console.log('')
  console.log('  Valid Modes:')
  console.log('')
  console.log('    - [None]  Run the main JOSL app (network required)')
  console.log('    - clock   Run the clock demo (network required)')
  console.log('    - demo    Run the JOSL I/O demo (network NOT required)')
  console.log('')
  console.log('  Examples:')
  console.log('')
  console.log('    $ josl')
  console.log('    $ josl --debug demo')
  console.log('    $ josl -d clock')
  console.log('')
})

program.parse(process.argv)

// Check options for debugging
if (program.debug) {
  process.env.DEBUG = '*'
}

// Application requires need to be done after commander to
// set up environment variables correctly

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
