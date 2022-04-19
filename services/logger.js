const {
    APP_NAME
} = require('../config/config');

const opts = {
    logDirectory: './logs',
    fileNamePattern: APP_NAME + '_<DATE>.log',
    dateFormat: 'YYYY_MM_DD'
};

const log = require('simple-node-logger').createRollingFileLogger(opts);
const consoleLog = require('simple-node-logger').createSimpleLogger();

if (process.env.NODE_ENV == 'development') {
    log.setLevel('debug');
} else {
    log.setLevel('info');
}

var All = (text) => {
    log.all(text);
    consoleLog.all(text);
}

var Trace = (text) => {
    log.trace(text);
    consoleLog.trace(text);
}

var Debug = (text) => {
    log.debug(text);
    consoleLog.debug(text);
}

var Info = (text) => {
    log.info(text);
    consoleLog.info(text);
}

var Warn = (text) => {
    log.warn(text);
    consoleLog.warn(text);
}

var Error = (text) => {
    log.error(text);
    consoleLog.error(text);
}

var Fatal = (text) => {
    log.fatal(text);
    consoleLog.fatal(text);
}

module.exports = {
    All: All,
    Trace: Trace,
    Debug: Debug,
    Info: Info,
    Warn: Warn,
    Error: Error,
    Fatal: Fatal
}