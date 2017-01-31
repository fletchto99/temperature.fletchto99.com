const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const moment = require('momentjs');
const Feels = require('feels');
const sensor = require('./sensor');
const database = require('./database');
const config = require('../config.json');

const day  = [];

let main = () => {
    let result = sensor.read();

    if (result.isValid) {
        let values = {
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            temperature: Math.round(result.temperature*100)/100,
            humidity: Math.round(result.humidity * 100) / 100,
            feels_like: Math.round(new Feels({temp: result.temperature, humidity: result.humidity}).humidex() * 100) / 100
        };
        expressWs.getWss().clients.forEach((client) => {
            client.send(JSON.stringify({
                message: 'update',
                data: values
            }));
        });
        database.storeTemperatureAndHumidity(result.temperature, result.humidity);
        if (day.length > (86400000 / config.sensor.time)) {
            day.shift();
        }
        day.push(values)
    }
};


app.get('/feels_like/', (req, res) => {
    res.send(day[day.length-1].feels_like.toString());
});

app.get('/humidity/', (req, res) => {
    res.send(day[day.length-1].humidity.toString());
});

app.get('/temperature/', (req, res) => {
    res.send(day[day.length-1].temperature.toString());
});

app.ws('/', function (client, req) {
    database.maxMin((err, results) => {
        if (err) {
            return;
        }
        client.send(JSON.stringify({
            message: 'maxmin',
            data: results
        }));
    });

    client.send(JSON.stringify({
        message: 'halfhour',
        data: day
    }));
});

app.listen(config.server.port, () => {
    console.log(`Server ready!`);
    main();
    setInterval(main, 5000);
});