window.onload = function() {

    var chart = c3.generate({
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
            },
            size: {
                height: 800
            }
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
                    text: 'Temperature (\xB0c)',
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
                    return value + (id == 'humidity' ? '%' : '\xB0c');
                }
            }
        }
    });

    let set_extreme = (type, extreme, value, delimiter, date) => {
        document.getElementById(`${type}${extreme}`).innerText = `${type} ${extreme} of ${value}${delimiter} recorded on ${new Date(date).toLocaleString()}`
    }

    let socket = new WebSocket("wss://temperature.fletchto99.com/api/");
    let max_temp = null;
    let min_temp = null;
    let max_humid = null;
    let min_humid = null;


    socket.onmessage = function (message) {
        var msg = JSON.parse(message.data);

        if (msg.message == 'update') {
            chart.flow({
                columns: [
                    ['time', msg.data.timestamp],
                    ['temperature', msg.data.temperature],
                    ['feels_like', msg.data.feels_like],
                    ['humidity', msg.data.humidity]
                ],
                length: (chart.data.values('temperature').length > 50) ? 1 : 0
            });

            document.title = `${msg.data.feels_like} / ${msg.data.humidity}`;

            if (msg.data.temperature > max_temp.temperature) {
                set_extreme("Max", "temperature", msg.data.temperature, "c", msg.data.time)
            }

            if (msg.data.temperature < min_temp.temperature) {
                set_extreme("Min", "temperature", msg.data.temperature, "c", msg.data.time)
            }

            if (msg.data.humidity > max_humid.humidity) {
                set_extreme("Max", "humidity", msg.data.humidity, "%", msg.data.time)
            }

            if (msg.data.humidity < min_humid.humidity) {
                set_extreme("Min", "humidity", msg.data.humidity, "%", msg.data.time)
            }

        } else if (msg.message == 'initialize') {
            max_temp = msg.data["extremes"][0][0]
            min_temp = msg.data["extremes"][1][0]
            max_humid = msg.data["extremes"][2][0]
            min_humid = msg.data["extremes"][3][0]
            set_extreme("Max", "temperature", max_temp.temperature, "c", max_temp.time_recorded)
            set_extreme("Min", "temperature", min_temp.temperature, "c", min_temp.time_recorded)
            set_extreme("Max", "humidity", max_humid.humidity, "%", max_humid.time_recorded)
            set_extreme("Min", "humidity", min_humid.humidity, "%", min_humid.time_recorded)

            chart.load({
                columns: [
                    ['time'].concat(msg.data.values.map(function (item) {
                        return item.timestamp
                    })),
                    ['temperature'].concat(msg.data.values.map(function (item) {
                        return item.temperature
                    })),
                    ['feels_like'].concat(msg.data.values.map(function (item) {
                        return item.feels_like;
                    })),
                    ['humidity'].concat(msg.data.values.map(function (item) {
                        return item.humidity
                    }))
                ]
            })
        }
    }
};
