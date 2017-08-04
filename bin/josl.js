const program = require('commander')

const validModes = ['demo', 'clock']

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

if (!validModes.includes(appMode)) {
  console.error('ERROR: Invalid argument.')
  program.help()
}

if (program.debug) console.log('Debug enabled.')
