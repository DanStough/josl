const debug = require('debug')('hardware:sevenSegment')
const I2C = require('raspi-i2c').I2C

const i2c = new I2C()

module.exports = class SevenSegment {
  constructor (name, address = 0x71) {
    this.name = name
    this.address = address
  }

  writeNumberSync (number) {
    let clippedNumber = parseInt(Math.abs(number))
    if (clippedNumber > 9999) {
      debug(this.name + ' seven segment display OVERFLOW')
      // Display overflow
      // this.displayOverflowSync(0x01)
      return false
    }
    // Save the last four digits and covert to hex
    let clippedString = clippedNumber.toString()
    let cursorPos = parseInt((4 - clippedString.length), 16)
    debug(this.name + ' seven segment sent display: ' + clippedString)

    // Update the cursor to the left position
    i2c.writeByteSync(this.address, 0x79)
    i2c.writeByteSync(this.address, cursorPos)

    // Send characters
    clippedString.split('').map(char => {
      i2c.writeByteSync(this.address, parseInt(char, 16))
    })
    return true
  }

  // displayErrorSync (number) {
    // let
    // parseInt(number) & 0x
    // // Save the last four digits and covert to hex
    // String(number)

    // // Update the cursor to the left position
    // i2c.writeByteSync(this.address, 0x01)

    // i2c.writeByteSync(this.address, 0x01)
  // }
}
