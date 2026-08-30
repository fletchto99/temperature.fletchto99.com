window.onload = function () {
    const chart = c3.generate({
        bindto: '#chart',
        data: {
            x: 'time',
            xFormat: '%Y-%m-%d %H:%M:%S',
            columns: [
                ['time'],
                ['temperature'],
                ['feels_like'],
                ['humidity']
            ],
            types: {
                temperature: 'spline',
                humidity: 'spline'
            },
            axes: {
                temperature: 'y',
                feels_like: 'y',
                humidity: 'y2'
            }
        },
        size: {
            height: 800
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d %H:%M:%S'
                }
            },
            y: {
                show: true,
                padding: {
                    top: 0,
                    bottom: 0
                },
                min: -100,
                max: 100,
                label: {
                    text: 'Temperature (\xB0C)',
                    position: 'outer-middle'
                }
            },
            y2: {
                show: true,
                padding: {
                    top: 0,
                    bottom: 0
                },
                min: 0,
                max: 100,
                label: {
                    text: 'Humidity (%)',
                    position: 'outer-middle'
                }
            }
        },
        tooltip: {
            format: {
                value: function (value, ratio, id) {
                    return value + (id === 'humidity' ? '%' : '\xB0C');
                }
            }
        }
    });

    let maxTemperature = null;
    let minTemperature = null;
    let maxHumidity = null;
    let minHumidity = null;
    let reconnectTimer = null;

    function setExtreme(type, metric, value, unit, date) {
        document.getElementById(`${type}${metric}`).innerText =
            `${metric} ${type.toLowerCase()} of ${value}${unit} recorded on ${new Date(date).toLocaleString()}`;
    }

    function setInitialExtreme(type, metric, reading, unit) {
        if (reading) {
            setExtreme(type, metric, reading[metric], unit, reading.time_recorded);
        }
    }

    function updateExtremes(reading) {
        if (!maxTemperature || reading.temperature > maxTemperature.temperature) {
            maxTemperature = {
                temperature: reading.temperature,
                time_recorded: reading.timestamp
            };
            setExtreme('Max', 'temperature', reading.temperature, '\xB0C', reading.timestamp);
        }

        if (!minTemperature || reading.temperature < minTemperature.temperature) {
            minTemperature = {
                temperature: reading.temperature,
                time_recorded: reading.timestamp
            };
            setExtreme('Min', 'temperature', reading.temperature, '\xB0C', reading.timestamp);
        }

        if (!maxHumidity || reading.humidity > maxHumidity.humidity) {
            maxHumidity = {
                humidity: reading.humidity,
                time_recorded: reading.timestamp
            };
            setExtreme('Max', 'humidity', reading.humidity, '%', reading.timestamp);
        }

        if (!minHumidity || reading.humidity < minHumidity.humidity) {
            minHumidity = {
                humidity: reading.humidity,
                time_recorded: reading.timestamp
            };
            setExtreme('Min', 'humidity', reading.humidity, '%', reading.timestamp);
        }
    }

    function initialize(data) {
        maxTemperature = data.extremes[0]?.[0] ?? null;
        minTemperature = data.extremes[1]?.[0] ?? null;
        maxHumidity = data.extremes[2]?.[0] ?? null;
        minHumidity = data.extremes[3]?.[0] ?? null;

        setInitialExtreme('Max', 'temperature', maxTemperature, '\xB0C');
        setInitialExtreme('Min', 'temperature', minTemperature, '\xB0C');
        setInitialExtreme('Max', 'humidity', maxHumidity, '%');
        setInitialExtreme('Min', 'humidity', minHumidity, '%');

        chart.load({
            columns: [
                ['time'].concat(data.values.map((item) => item.timestamp)),
                ['temperature'].concat(data.values.map((item) => item.temperature)),
                ['feels_like'].concat(data.values.map((item) => item.feels_like)),
                ['humidity'].concat(data.values.map((item) => item.humidity))
            ]
        });

        const latest = data.values.at(-1);
        if (latest) {
            document.title = `${latest.feels_like}\xB0C / ${latest.humidity}%`;
        }

        data.values.forEach(updateExtremes);
    }

    function handleUpdate(reading) {
        chart.flow({
            columns: [
                ['time', reading.timestamp],
                ['temperature', reading.temperature],
                ['feels_like', reading.feels_like],
                ['humidity', reading.humidity]
            ],
            length: chart.data.values('temperature').length > 50 ? 1 : 0
        });

        document.title = `${reading.feels_like}\xB0C / ${reading.humidity}%`;
        updateExtremes(reading);
    }

    function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const client = new WebSocket(`${protocol}//${window.location.host}/api/`);

        client.onopen = function () {
            window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
        };

        client.onmessage = function (message) {
            const data = JSON.parse(message.data);

            if (data.message === 'update') {
                handleUpdate(data.data);
            } else if (data.message === 'initialize') {
                initialize(data.data);
            }
        };

        client.onerror = function () {
            client.close();
        };

        client.onclose = function () {
            if (reconnectTimer === null) {
                reconnectTimer = window.setTimeout(function () {
                    reconnectTimer = null;
                    connect();
                }, 5000);
            }
        };
    }

    connect();
};
