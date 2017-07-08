const config = require('config')

const Stoplight = require('./stoplight.js')

let stoplight = new Stoplight(config.get('Pinout.stoplight'))

stoplight.enable()

stoplight.green.enable()

setTimeout(()=>{
  stoplight.disable()
}, 5000)