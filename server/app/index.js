const express = require('express');
const app = express();
const socket = require('express-ws')(app);
const sensor = require('./sensor');
const database = require('./database');
const {createReading} = require('./reading');
const config = require('../config.json');

const cacheLimit = 50;
const sampleInterval = config.sensor.intervalMs ?? 30000;

if (!Number.isFinite(sampleInterval) || sampleInterval < 2000) {
    throw new Error('sensor.intervalMs must be a number of at least 2000 milliseconds');
}

if (config.sensor.intervalMs === undefined) {
    console.warn('sensor.intervalMs is not configured; using 30000 milliseconds');
}

let cache = [];
let interval;
let server;
let readingInProgress = false;
let shuttingDown = false;
const initializedClients = new WeakSet();

function sendMessage(client, message) {
    if (client.readyState !== client.OPEN) {
        return;
    }

    client.send(JSON.stringify(message), (error) => {
        if (error) {
            console.error('Failed to send WebSocket message', error);
        }
    });
}

function broadcast(message) {
    socket.getWss().clients.forEach((client) => {
        if (initializedClients.has(client)) {
            sendMessage(client, message);
        }
    });
}

async function pollSensor() {
    if (readingInProgress) {
        console.warn('Skipping sensor poll because the previous poll is still running');
        return;
    }

    readingInProgress = true;

    try {
        const result = sensor.read();

        if (!result.isValid) {
            console.warn('Sensor returned an invalid reading');
            return;
        }

        const reading = createReading(result.temperature, result.humidity);

        if (shuttingDown) {
            return;
        }

        cache.push(reading);

        if (cache.length > cacheLimit) {
            cache.shift();
        }

        broadcast({
            message: 'update',
            data: reading
        });

        try {
            await database.store(result.temperature, result.humidity);
        } catch (error) {
            console.error('Failed to persist sensor reading', error);
        }
    } catch (error) {
        console.error('Failed to read from the temperature sensor', error);
    } finally {
        readingInProgress = false;
    }
}

function sendLatest(field, res) {
    const latest = cache.at(-1);

    if (!latest) {
        res.status(503).type('text/plain').send('No readings available');
        return;
    }

    res.type('text/plain').send(latest[field].toString());
}

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        readings: cache.length
    });
});

app.get('/feels_like', (req, res) => {
    sendLatest('feels_like', res);
});

app.get('/humidity', (req, res) => {
    sendLatest('humidity', res);
});

app.get('/temperature', (req, res) => {
    sendLatest('temperature', res);
});

app.ws('/', async (client) => {
    try {
        const extremes = await database.fetchExtremes();
        const values = cache.slice();

        sendMessage(client, {
            message: 'initialize',
            data: {
                extremes,
                values
            }
        });
        initializedClients.add(client);
    } catch (error) {
        console.error('Failed to fetch temperature extremes', error);
        client.close(1011, 'Failed to initialize');
    }
});

async function start() {
    sensor.initialize();

    const results = await database.populateCache();

    if (shuttingDown) {
        return;
    }

    cache = results.map((result) => createReading(
        result.temperature,
        result.humidity,
        result.time_recorded
    ));

    await new Promise((resolve, reject) => {
        server = app.listen(config.server.port, resolve);
        server.once('error', reject);
    });

    if (shuttingDown) {
        return;
    }

    console.log(`Server ready on port ${config.server.port}`);
    interval = setInterval(() => void pollSensor(), sampleInterval);
    void pollSensor();
}

async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`Received ${signal}; shutting down`);
    clearInterval(interval);

    socket.getWss().clients.forEach((client) => {
        client.close(1001, 'Server shutting down');
    });

    let forceCloseTimer;
    let serverClosePromise = Promise.resolve();

    if (server) {
        serverClosePromise = new Promise((resolve) => {
            server.close((error) => {
                if (error) {
                    console.error('Failed to close HTTP server cleanly', error);
                    process.exitCode = 1;
                }
                resolve();
            });
        });

        forceCloseTimer = setTimeout(() => {
            socket.getWss().clients.forEach((client) => client.terminate());
        }, 1000);
    }

    try {
        sensor.cleanup();
    } catch (error) {
        console.error('Failed to release GPIO resources', error);
        process.exitCode = 1;
    }

    try {
        await database.close();
    } catch (error) {
        console.error('Failed to close database connections', error);
        process.exitCode = 1;
    }

    await serverClosePromise;
    clearTimeout(forceCloseTimer);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

start().catch(async (error) => {
    if (shuttingDown) {
        return;
    }

    console.error('Failed to start temperature server', error);
    process.exitCode = 1;

    try {
        sensor.cleanup();
    } catch (cleanupError) {
        console.error('Failed to release GPIO resources after startup error', cleanupError);
    }

    try {
        await database.close();
    } catch (cleanupError) {
        console.error('Failed to close database connections after startup error', cleanupError);
    }
});
