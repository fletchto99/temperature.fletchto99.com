const Feels = require('feels');

function round(value) {
    return Math.round(value * 100) / 100;
}

function formatTimestamp(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new TypeError('Reading timestamp must be a valid date');
    }

    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 19).replace('T', ' ');
}

function createReading(temperature, humidity, timestamp) {
    const parsedTemperature = Number(temperature);
    const parsedHumidity = Number(humidity);

    if (!Number.isFinite(parsedTemperature) || !Number.isFinite(parsedHumidity)) {
        throw new TypeError('Temperature and humidity must be finite numbers');
    }

    const feelsLike = parsedTemperature <= 0 || parsedHumidity <= 0
        ? parsedTemperature
        : new Feels({
            temp: parsedTemperature,
            humidity: parsedHumidity
        }).humidex();

    return {
        timestamp: formatTimestamp(timestamp),
        temperature: round(parsedTemperature),
        humidity: round(parsedHumidity),
        feels_like: round(feelsLike)
    };
}

module.exports = {
    createReading,
    formatTimestamp
};
