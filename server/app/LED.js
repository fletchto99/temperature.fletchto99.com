const config = require('../config.json').LED;

let led = null;

module.exports = {

    initialize() {
        if (led) {
            return;
        }

        const Gpio = require('onoff').Gpio;
        led = new Gpio(config.gpio, 'out');
    },

    enable() {
        if (!led) {
            throw new Error('LED has not been initialized');
        }

        led.writeSync(1);
    },

    disable() {
        if (!led) {
            throw new Error('LED has not been initialized');
        }

        led.writeSync(0);
    },

    cleanup() {
        if (!led) {
            return;
        }

        try {
            led.writeSync(0);
        } finally {
            led.unexport();
            led = null;
        }
    }

};
