const mysql = require('mysql');

let config = require('../config.json').database;
let connection = mysql.createConnection({
    ...config,
    multipleStatements: true
});

module.exports = {

    store(temperature, humidity) {
        if (!temperature || !humidity) {
            console.log(temperature);
            console.log(humidity);
            console.log("Temperature or humidity not valid");
            return;
        }

        temperature = parseFloat(temperature);
        humidity = parseFloat(humidity);

        connection.query('INSERT INTO temperature SET ? ', {
            temperature: temperature,
            humidity: humidity
        }, (err) => {
            if (err) {
                console.log(err);
            }
        });
    },

    fetch_extremes(callback) {
        let query = `
            SELECT time_recorded, humidity, temperature FROM temperature ORDER BY temperature desc LIMIT 1;
            SELECT time_recorded, humidity, temperature FROM temperature ORDER BY temperature asc LIMIT 1;
            SELECT time_recorded, humidity, temperature FROM temperature ORDER BY humidity desc LIMIT 1;
            SELECT time_recorded, humidity, temperature FROM temperature ORDER BY humidity asc LIMIT 1;
        `

        connection.query(query, (err, result) => {
            if (!err) {
                callback(null, result)
            } else {
                callback(err)
            }
        });
    },

    populate_cache(callback) {
        let query = `SELECT time_recorded, humidity, temperature FROM temperature ORDER BY id desc LIMIT 50;`

        connection.query(query, (err, result) => {
            if (!err) {
                callback(null, result)
            } else {
                callback(err)
            }
        });
    }

};
