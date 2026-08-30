const mysql = require('mysql2/promise');
const config = require('../config.json').database;

const pool = mysql.createPool({
    waitForConnections: true,
    connectionLimit: 4,
    ...config
});

module.exports = {

    async store(temperature, humidity) {
        const parsedTemperature = Number(temperature);
        const parsedHumidity = Number(humidity);

        if (!Number.isFinite(parsedTemperature) || !Number.isFinite(parsedHumidity)) {
            throw new TypeError('Temperature and humidity must be finite numbers');
        }

        await pool.execute(
            'INSERT INTO temperature (temperature, humidity) VALUES (?, ?)',
            [parsedTemperature, parsedHumidity]
        );
    },

    async fetchExtremes() {
        const queries = [
            'SELECT time_recorded, humidity, temperature FROM temperature ORDER BY temperature DESC LIMIT 1',
            'SELECT time_recorded, humidity, temperature FROM temperature ORDER BY temperature ASC LIMIT 1',
            'SELECT time_recorded, humidity, temperature FROM temperature ORDER BY humidity DESC LIMIT 1',
            'SELECT time_recorded, humidity, temperature FROM temperature ORDER BY humidity ASC LIMIT 1'
        ];

        return Promise.all(queries.map(async (query) => {
            const [rows] = await pool.query(query);
            return rows;
        }));
    },

    async populateCache() {
        const [rows] = await pool.query(`
            SELECT time_recorded, humidity, temperature
            FROM (
                SELECT id, time_recorded, humidity, temperature
                FROM temperature
                ORDER BY id DESC
                LIMIT 50
            ) AS recent_readings
            ORDER BY id ASC
        `);

        return rows;
    },

    async close() {
        await pool.end();
    }

};
