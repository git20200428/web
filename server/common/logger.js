const fs = require('fs');
const Path = require('path');
const logDir = Path.resolve(__dirname + "/../../log");
const logFile = Path.resolve(logDir, "LOG");
const Config = require("./config");
const fileLength = Config["log.size"];
const MAX = Config["log.files"];

let DEBUG_MODE = false;

class Logger {
    static setDebug(enable) {
        DEBUG_MODE = enable;
    }

    static log(...str) {
        this._log('INFO', ...str);
    }

    static checkLogDir() {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        } else {
            let dirStat = fs.statSync(logDir);
            if (!dirStat.isDirectory()) {
                fs.mkdirSync(logDir);
            }
        }
    }

    static debug(...str) {
        if (DEBUG_MODE) {
            this._log("DEBUG", ...str);
        }
    }

    static _log(logType, ...str) {
        try {
            if (fs.existsSync(logFile)) {
                let st = fs.statSync(logFile);
                if (st.size >= fileLength) {
                    let j = MAX - 1;
                    while (j > 0) {
                        if (fs.existsSync(logFile + '.' + j)) {
                            fs.renameSync(logFile + '.' + j, logFile + '.' + (j + 1));
                        }
                        --j;
                    }

                    fs.renameSync(logFile, logFile + '.1');
                }
            } else {
                this.checkLogDir();
            }

            let n = new Date();
            let now = new Date(n - n.getTimezoneOffset() * 60 * 1000).toISOString().replace("T", " ").substr(0, 23);
            let log = `[${now}]` + ' [' + logType + '] ';
            for (let i of str) {
                log += i + ' ';
            }
            log = (typeof log === 'string') ? log.replace(/\s\s/g, ' ') : log;
            //console.log(`[${now}]`, ...str);
            fs.appendFileSync(logFile, log + '\n');
        } catch (err) {
            // console.log(err);
        }
    }

    static error(...str) {
        // console.error(...str);
        this._log('ERROR', ...str);
    }

    static warning(...str) {
        this._log('WARNING', ...str);
    }

    static setfilename(sessionID) {
        this.filename = "log_" + sessionID;
    }
}

module.exports = Logger;