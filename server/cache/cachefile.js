const fs = require('fs');
const PATH = require("path");
const Logger = require('../common/logger');
const CacheConfig = require("../common/config");
const FILE_LENGTH = CacheConfig["cache.event.size"];
const CACHE_DIR = CacheConfig.cacheDir;
const MAX = CacheConfig["cache.event.files"] - 1;

module.exports = class CacheFile {
    constructor(sessionID) {
        this.sessionID = sessionID;
        try {
            this.fileName = PATH.resolve(CACHE_DIR + "/" + sessionID);
            if (!fs.existsSync(CACHE_DIR)) {
                fs.mkdirSync(CACHE_DIR);
            } else if (!fs.statSync(CACHE_DIR).isDirectory()) {
                fs.mkdirSync(CACHE_DIR);
            }
        } catch (e) {
            Logger.error(JSON.stringify(e));
        }
        this.onClosing = false;
    }

    static cacheInit() {
        try {
            if (!fs.existsSync(CACHE_DIR)) return;

            fs.readdir(CACHE_DIR, (err, files) => {
                if (err) {
                    Logger.error(JSON.stringify(err));
                } else {
                    let filePath = "";
                    for (let file of files) {
                        filePath = PATH.resolve(CACHE_DIR + "/" + file);
                        try {
                            if (fs.statSync(filePath).isFile()) {
                                fs.unlinkSync(filePath);
                            }
                        } catch (e) {
                            Logger.error(JSON.stringify(e));
                        }
                    }
                }
            });
        } catch (e) {
            Logger.error(JSON.stringify(e));
        }
    }

    add(data) {
        if (this.onClosing) return;
        try {
            if (fs.existsSync(this.fileName)) {
                let st = fs.statSync(this.fileName);
                if (st.size >= FILE_LENGTH) {
                    // rename files, move .4 to .5, .3 to .4
                    let j = MAX - 1;
                    let oldFileName = "";
                    while (j >= 0) {
                        oldFileName = j > 0 ? (this.fileName + '.' + j) : this.fileName;
                        if (fs.existsSync(oldFileName)) {
                            try {
                                fs.renameSync(oldFileName, this.fileName + '.' + (j + 1));
                            } catch (err) {
                                Logger.error(JSON.stringify(err));
                            }
                        }
                        --j;
                    }
                }
            }
        } catch (err) {
            Logger.error(JSON.stringify(err));
        }

        try {
            fs.appendFileSync(this.fileName, data + "\n");
        } catch (e) {
            Logger.error(JSON.stringify(e));
        }
    }

    close() {
        this.onClosing = true;
        try {
            fs.readdir(CACHE_DIR, (err, files) => {
                if (!err) {
                    let filePath = "";
                    for (let file of files) {
                        if (file.match(this.sessionID)) {
                            filePath = PATH.resolve(CACHE_DIR + "/" + file);
                            try {
                                let stats = fs.statSync(filePath);
                                if (stats.isFile()) {
                                    fs.unlinkSync(filePath);
                                }
                            } catch (err) {
                                Logger.error(JSON.stringify(err));
                            }
                        }
                    }
                } else {
                    Logger.error(JSON.stringify(err));
                }
            });
        } catch (e) {
            Logger.error(JSON.stringify(e));
        }
    }

    clear() {
        try {
            fs.writeFileSync(this.fileName, "");
            fs.readdir(CACHE_DIR, (err, files) => {
                if (!err) {
                    for (let file of files) {
                        if (file.match(this.sessionID)) {
                            try {
                                fs.unlinkSync(PATH.resolve(CACHE_DIR + "/" + file));
                            } catch (e) {
                                Logger.error(JSON.stringify(e));
                            }
                        }
                    }
                } else {
                    Logger.error(JSON.stringify(err));
                }
            });
        } catch (e) {
            Logger.error(JSON.stringify(e));
        }
    }

    getData(callback) {
        if (!callback) return;
        if (this.onClosing) return callback("", this.sessionID);
        let buffer = "";
        for (let i = MAX - 1; i >= 0; --i) {
            try {
                if (i === 0) {
                    buffer += fs.readFileSync(this.fileName);
                } else if (fs.existsSync(this.fileName + "." + i)) {
                    buffer += fs.readFileSync(this.fileName + "." + i);
                }
            } catch (e) {
                Logger.error(JSON.stringify(e));
            }
        }
        callback(buffer, this.sessionID);
    }
}
