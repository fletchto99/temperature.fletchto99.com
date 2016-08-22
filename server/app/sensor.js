const sensorLib = require('node-dht-sensor');
const config = require('../config.json').sensor;
const LED = require('./LED');

sensorLib.initialize(22, config.gpio);

module.exports =  {
    read() {
        LED.enable();
        var readout = sensorLib.read();
        LED.disable();
        return readout;
    }
};
