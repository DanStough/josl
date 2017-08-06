const debug = require('debug')('hardware:sevenSegment')
const I2C = require('raspi-i2c').I2C
const util = require('util')

const i2c = new I2C()

module.exports = class SevenSegment {
  constructor (name, address = 0x71) {
    this.name = name
    this.address = address

    this.writeByte = util.promisify(i2c.writeByte).bind(i2c) // Bind is required because writeByte refers to
    this.readByte = util.promisify(i2c.readByte).bind(i2c)   // methods from the closing scope. https://github.com/nodejs/node/pull/13440

    this.showHello()
  }

  async showNumber (number) {
    let intInput = parseInt(Math.abs(number))
    if (intInput > 9999) {
      debug(this.name + ' seven segment sent OVERFLOW')
      await this.showOverflow()
      return false
    }

    let strInput = intInput.toString()
    let newDisplay = Array(4 - strInput.length).fill(0x10)  // 0x10 clears a char
                      .concat(Array.from(strInput).map(chr => { return parseInt(chr, 16) }))
    debug(this.name + ' seven segment sent : ' + strInput)

    await this._showDisplay(newDisplay)

    return true
  }

  showNumberSync (number) {
    let intInput = parseInt(Math.abs(number))
    if (intInput > 9999) {
      debug(this.name + ' seven segment sent OVERFLOW')
      this.showOverflowSync()
      return false
    }

    let strInput = intInput.toString()
    let newDisplay = Array(4 - strInput.length).fill(0x10)  // 0x10 clears a char
                      .concat(Array.from(strInput).map(chr => { return parseInt(chr, 16) }))
    debug(this.name + ' seven segment sent : ' + strInput)

    this._showDisplaySync(newDisplay)

    return true
  }

  async clear () {
    await this.writeByte(this.address, 0x76)
    debug(this.name + ' seven segment cleared')
    return true
  }

  _clearSync () {
    i2c.writeByteSync(this.address, 0x76)
    debug(this.name + ' seven segment cleared')
    return true
  }

  async setBrightness (level) {
    let intLevel = parseInt(level)
    if (intLevel < 0 || intLevel > 100) return false

    await this.writeByte(this.address, 0x7A)
    await this.writeByte(this.address, intLevel)
    debug(this.name + ' seven segment brightness (0-100) set to: ' + intLevel)

    return true
  }

  _setBrightnessSync (level) {
    let intLevel = parseInt(level)
    if (intLevel < 0 || intLevel > 100) return false

    i2c.writeByteSync(this.address, 0x7A)
    i2c.writeByteSync(this.address, intLevel)
    debug(this.name + ' seven segment brightness (0-100) set to: ' + intLevel)

    return true
  }

  async showError (code) {
    code = parseInt(Math.abs(code))
    if (code < 0 || code > 9) return false

    // Display "Err<code>" in ASCII
    let newDisplay = [0x45, 0x52, 0x52, code]
    debug(this.name + ' seven segment sent ERROR: ' + code)

    await this._showDisplay(newDisplay)

    return true
  }

  showErrorSync (code) {
    code = parseInt(Math.abs(code))
    if (code < 0 || code > 9) return false

    // Display "Err<code>" in ASCII
    let newDisplay = [0x45, 0x52, 0x52, code]
    debug(this.name + ' seven segment sent ERROR: ' + code)

    this._showDisplaySync(newDisplay)

    return true
  }

  async showOverflow () {
    // Display "Err<code>" in ASCII
    let newDisplay = [0x4F, 0x46, 0x4C, 0x4F]
    debug(this.name + ' seven segment sent OVERFLOW')

    await this._showDisplay(newDisplay)

    return true
  }

  showOverflowSync () {
    // Display "Err<code>" in ASCII
    let newDisplay = [0x4F, 0x46, 0x4C, 0x4F]
    debug(this.name + ' seven segment sent OVERFLOW')

    this._showDisplaySync(newDisplay)

    return true
  }

  async showBuild () {
    // Display "bild" in ASCII
    let newDisplay = [0x62, 0x69, 0x6C, 0x64]
    debug(this.name + ' seven segment sent \'bild\'')

    await this._showDisplay(newDisplay)

    return true
  }

  async showHello () {
    // Display "Hi!" in ASCII
    let newDisplay = [0x48, 0x49, 0x10, 0x10] // Characters
    debug(this.name + ' seven segment sent \'Hi!\'')

    await this._showDisplay(newDisplay)

    // Exclaimation point
    await this.writeByte(this.address, 0x7E)
    await this.writeByte(this.address, 0x60)

    await this.writeByte(this.address, 0x77)
    await this.writeByte(this.address, 0x02)

    return true
  }

  async showSmile () {
    // Display "Err<code>" in ASCII
    debug(this.name + ' seven segment is sad that you\'re bad at life :<')

    // Clear points
    await this.writeByte(this.address, 0x77)
    await this.writeByte(this.address, 0x00)

    // Update the cursor to the left position
    await this.writeByte(this.address, 0x79)
    await this.writeByte(this.address, 0x0)

    // Update individual characters
    await this.writeByte(this.address, 0x7B)
    await this.writeByte(this.address, 0x0)

    await this.writeByte(this.address, 0x7C)
    await this.writeByte(this.address, 0x63)

    await this.writeByte(this.address, 0x7D)
    await this.writeByte(this.address, 0x1B)

    await this.writeByte(this.address, 0x7E)
    await this.writeByte(this.address, 0x63)

    return true
  }

  async showFrown () {
    // Display "Err<code>" in ASCII
    debug(this.name + ' seven segment is sad that you\'re bad at life :<')

    // Clear points
    await this.writeByte(this.address, 0x77)
    await this.writeByte(this.address, 0x00)

    // Update the cursor to the left position
    await this.writeByte(this.address, 0x79)
    await this.writeByte(this.address, 0x0)

    // Update individual characters
    await this.writeByte(this.address, 0x7B)
    await this.writeByte(this.address, 0x0)

    await this.writeByte(this.address, 0x7C)
    await this.writeByte(this.address, 0x63)

    await this.writeByte(this.address, 0x7D)
    await this.writeByte(this.address, 0x54)

    await this.writeByte(this.address, 0x7E)
    await this.writeByte(this.address, 0x63)

    return true
  }

  _showDisplaySync (newDisplay) {
    // Clear points
    i2c.writeByteSync(this.address, 0x77)
    i2c.writeByteSync(this.address, 0x00)

    // Update the cursor to the left position
    i2c.writeByteSync(this.address, 0x79)
    i2c.writeByteSync(this.address, 0x0)

    // Send characters
    for (let i = 0; i < 4; ++i) {
      i2c.writeByteSync(this.address, newDisplay[i])
    }
  }

  async _showDisplay (newDisplay) {
    // Clear points
    await this.writeByte(this.address, 0x77)
    await this.writeByte(this.address, 0x00)

    // Update the cursor to the left position
    await this.writeByte(this.address, 0x79)
    await this.writeByte(this.address, 0x0)

    // Send characters
    for (let i = 0; i < 4; ++i) {
      await this.writeByte(this.address, newDisplay[i])
    }
  }
}
