const mysql = require('mysql');
let config = require('../config.json').database;

config.multipleStatements = true;


let connection = mysql.createConnection(config);

module.exports = {

    storeTemperatureAndHumidity(temperature, humidity) {

        if (!temperature || !humidity) {
            console.log(temperature);
            console.log(humidity);
            console.log("Temperature or humidity not valid");
            return;
        }

        temperature = parseFloat(temperature);
        humidity = parseFloat(humidity);

        connection.query('INSERT INTO Temperature SET ? ', {
            temperature: temperature,
            humidity: humidity
        },( err) => {
            if (err) {
                console.log(err);
            }
        });

    },

    maxMin(cb) {

        let query = 'SELECT time_recorded, humidity, temperature FROM Temperature ORDER BY Temperature desc LIMIT 1;' +
            ' SELECT time_recorded, humidity, temperature FROM Temperature ORDER BY Temperature asc LIMIT 1;' +
            ' SELECT time_recorded, humidity, temperature FROM Temperature ORDER BY Humidity desc LIMIT 1; ' +
            'SELECT time_recorded, humidity, temperature FROM Temperature ORDER BY Humidity asc LIMIT 1';

        connection.query(query, (err, result) => {
            if (!err) {
                cb(null, result)
            } else {
                cb(err)
            }
        });

    }

};
