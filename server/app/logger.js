function write(stream, level, args) {
    const timestamp = new Date().toISOString();
    stream(`[${timestamp}] [${level}]`, ...args);
}

module.exports = {
    info: (...args) => write(console.log, 'INFO', args),
    warn: (...args) => write(console.warn, 'WARN', args),
    error: (...args) => write(console.error, 'ERROR', args)
};
