window.onload = function() {

    var config = {
        API_URL: "wss://temperature.fletchto99.com/api/"
    };

    var maxmin = null;

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
        //TODO: c and % formatting for tooltip
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

    var socket = new WebSocket(config.API_URL);

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
                length: (chart.data.values('temperature').length > 200) ? 1 : 0
            });

            document.title = 'Hot as Balls (' + msg.data.feels_like + ')';

            //TODO: check if a new max/min has been achieved

        } else if (msg.message == 'halfhour'){
            if (msg.data.length > 200) {
                msg.data = msg.data.slice(-200);
            }
            document.title = 'Hot as Balls (' + msg.data[msg.data.length-1].feels_like + ')';
            chart.load({
                columns: [
                    ['time'].concat(msg.data.map(function (item) {
                        return item.timestamp
                    })),
                    ['temperature'].concat(msg.data.map(function (item) {
                        return item.temperature
                    })),
                    ['feels_like'].concat(msg.data.map(function (item) {
                        return item.feels_like;
                    })),
                    ['humidity'].concat(msg.data.map(function (item) {
                        return item.humidity
                    }))
                ]
            });
        } else if (msg.message == 'maxmin') {
            document.getElementById('maxtemp').innerText = "Max temp recorded: " + msg.data[0][0].temperature + "c on " + (new Date(msg.data[0][0].time_recorded)).toLocaleString();
            document.getElementById('mintemp').innerText = "Min temp recorded: " + msg.data[1][0].temperature + "c on " + (new Date(msg.data[1][0].time_recorded)).toLocaleString();
            document.getElementById('maxhumid').innerText = "Max humidity recorded: " + msg.data[2][0].humidity + "% on " + (new Date(msg.data[2][0].time_recorded)).toLocaleString();
            document.getElementById('minhumid').innerText = "Min humidity recorded: " + msg.data[3][0].humidity + "% on " + (new Date(msg.data[3][0].time_recorded)).toLocaleString();
        }
    }
};
