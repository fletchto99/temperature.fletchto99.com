const Gpio = require('onoff').Gpio;
const config = require('../config.json').LED;

let led = new Gpio(config.gpio, 'out');

module.exports = {

    enable() {
        led.writeSync(1);
    },

    disable() {
        led.writeSync(0);
    }

};
