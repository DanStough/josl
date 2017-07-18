const debug = require('debug')('hardware:sevenSegment')
const I2C = require('raspi-i2c').I2C
const util = require('util')

const i2c = new I2C()

module.exports = class SevenSegment {
  constructor (name, address = 0x71) {
    this.name = name
    this.address = address
    this.display = [undefined, undefined, undefined, undefined]

    this.writeByte = util.promisify(i2c.writeByte).bind(i2c) // Bind is required because writeByte refers to
    this.readByte = util.promisify(i2c.readByte).bind(i2c)   // methods from the closing scope. https://github.com/nodejs/node/pull/13440
  }

  async writeNumber (number) {
    let intInput = parseInt(Math.abs(number))
    if (intInput >= 9999) {
      debug(this.name + ' seven segment display OVERFLOW')
      // TODO: Display overflow
      // this.displayOverflowSync(0x01)
      return false
    }
    // Save the last four digits and covert to hex
    let strInput = intInput.toString()
    let newDisplay = Array(4 - strInput.length).fill(0x10).concat(Array.from(strInput))
    // let cursorStart = parseInt((4 - strInput.length), 16)
    debug(this.name + ' seven segment sent display: ' + strInput)

    // Update the cursor to the left position
    await this.writeByte(this.address, 0x79)
    await this.writeByte(this.address, 0x0)

    // Send characters
    for (let i = 0; i < 4; ++i) {
      await this.writeByte(this.address, parseInt(newDisplay[i], 16))
    }
    this.display = newDisplay
    // await Promise.all(strInput.split('').map(async char => {
    //   await this.writeByte(this.address, parseInt(char, 16))
    // }))
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
