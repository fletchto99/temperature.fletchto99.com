const config = require('../config.json').sensor;
const LED = require('./LED');

let sensorLib = null;
let initialized = false;

module.exports =  {
    initialize() {
        if (initialized) {
            return;
        }

        LED.initialize();

        try {
            sensorLib = require('node-dht-sensor');

            if (!sensorLib.initialize(22, config.gpio)) {
                throw new Error('Failed to initialize DHT22 sensor');
            }

            initialized = true;
        } catch (error) {
            sensorLib = null;
            LED.cleanup();
            throw error;
        }
    },

    read() {
        if (!initialized) {
            throw new Error('Temperature sensor has not been initialized');
        }

        LED.enable();

        try {
            return sensorLib.read();
        } finally {
            LED.disable();
        }
    },

    cleanup() {
        initialized = false;
        sensorLib = null;
        LED.cleanup();
    }
};
