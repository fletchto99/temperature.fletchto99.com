# Temperature Sensor
----

A simple program to monitor the temperature inside of my room using the DHT-22 sensor for the raspberry PI. I've also set it up so that an LED will blink each time the PI is detecting the temperature. You can view the pin diagram I used here: 

![pin layour](https://github.com/fletchto99/termperature.fletchto99.com/raw/master/images/layout.png "pin layout")

I followed this [youtube tutorial](https://www.youtube.com/watch?v=IHTnU1T8ETk) to hook up all of the hardware.

### Setup Instructions

1. Prepare the hardware as seen above.
2. Setup a MySQL DB as per the `server/table.sql` file.
3. Setup a `config.json` for the server using the layout of `config.sample.json`
4. Point the `API_URL` in `web/resource/js/temperature.js` to the server side API

