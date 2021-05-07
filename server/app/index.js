const express = require('express');
const app = express();
const socket = require('express-ws')(app);
const moment = require('moment');
const Feels = require('feels');
const sensor = require('./sensor');
const database = require('./database');
const config = require('../config.json');

const cache = [];

let loop = () => {
    let result = sensor.read();

    if (result.isValid) {
        let values = {
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            temperature: Math.round(result.temperature*100)/100,
            humidity: Math.round(result.humidity * 100) / 100,
            feels_like: Math.round(new Feels({temp: result.temperature, humidity: result.humidity}).humidex() * 100) / 100
        };
        socket.getWss().clients.forEach((client) => {
            client.send(JSON.stringify({
                message: 'update',
                data: values
            }));
        });
        database.store(result.temperature, result.humidity);
        cache.push(values)
        if (cache.len > 50) {
            cache.shift()
        }
    }
};

app.get('/feels_like', (req, res) => {
    res.send(cache[cache.length-1].feels_like.toString());
});

app.get('/humidity', (req, res) => {
    res.send(cache[cache.length-1].humidity.toString());
});

app.get('/temperature', (req, res) => {
    res.send(cache[cache.length-1].temperature.toString());
});

app.ws('/', function (client, req) {
    database.fetch_extremes((err, results) => {
        if (err) {
            return;
        }
        client.send(JSON.stringify({
            message: 'initialize',
            data: {
                extremes: results,
                values: cache
            }
        }));
    });
});

app.listen(config.server.port, () => {
    console.log(`Server ready!`);
    setInterval(loop, 30000);
});
