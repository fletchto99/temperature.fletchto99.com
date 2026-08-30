const test = require('node:test');
const assert = require('node:assert/strict');
const {createReading, formatTimestamp} = require('../app/reading');

test('formatTimestamp emits the local timestamp expected by the chart', () => {
    const date = new Date(2024, 0, 2, 3, 4, 5);

    assert.equal(formatTimestamp(date), '2024-01-02 03:04:05');
});

test('createReading normalizes database strings and preserves their timestamp', () => {
    const reading = createReading('21.234', '45.678', new Date(2024, 0, 2, 3, 4, 5));

    assert.equal(reading.timestamp, '2024-01-02 03:04:05');
    assert.equal(reading.temperature, 21.23);
    assert.equal(reading.humidity, 45.68);
    assert.equal(Number.isFinite(reading.feels_like), true);
});

test('createReading accepts valid zero values', () => {
    const reading = createReading(0, 0, new Date(2024, 0, 2));

    assert.equal(reading.temperature, 0);
    assert.equal(reading.humidity, 0);
    assert.equal(reading.feels_like, 0);
});

test('createReading rejects invalid readings', () => {
    assert.throws(
        () => createReading('not-a-number', 50),
        /Temperature and humidity must be finite numbers/
    );
});
