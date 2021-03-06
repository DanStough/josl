# JOSL
:rotating_light: JOSL, the Jenkins 'OS' Light. Another Jenkins build status monitor, now with more flavor! :cake: :vertical_traffic_light:

# TODO

* [X] ~~*Switch Library*~~
    * [X] ~~*Debounce Switch using Observables*~~
* [X] ~~*Process exit cleanup procedure.*~~
* [X] ~~*Add debug library*~~
* [X] ~~*Indicator library*~~
    * [X] ~~*Delay partial flashes*~~
    * [X] ~~*Create Pulse API for Indicator*~~
    * [X] ~~*Switch to using observables?*~~
* [X] ~~*Stoplight library*~~
    * [X] ~~*Alarm API*~~
    * [X] ~~*Mute*~~
* [X] ~~*sevenSegment I2C API*~~
    * [X] ~~*Number to display*~~
    * [X] ~~*Promisify I2C Aysnc API*~~
    * [X] ~~*Error display*~~
    * [X] ~~*Special Character API/ Animations (Hi message, BILD)?*~~
* [X] ~~*Complete Demo*~~
    * [X] ~~*Move mute variable into the subject code for live update*~~
    * [X] ~~*Create custom interval for each indicator to prevent chop on flash*~~
* [X] ~~*Command Line Interface*~~
* [X] ~~*Clock Demo*~~
* [X] ~~*Integrate PM2*~~
* [X] ~~*Integrate jenkins library*~~
* [ ] Documentation

# REQUIRED HARDWARE

# INSTALLATION

* Install and configure PM2 AS ROOT... 

* Modify `/boot/config.txt`, modify the I2C baudrate from 100000 to 10000, save and reboot the raspberry pi. This resolves stability issues with the [seven segment serial display](https://www.sparkfun.com/products/11441).

# USAGE

# LICENSE
MIT License

Copyright (c) 2017 Dan Stough

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.