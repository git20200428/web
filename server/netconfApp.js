const netconf = require('./common/netconf');
const events = require('events');
const Tools = require("./common/tools");
const Logger = require('./common/logger');
const SSHClient = require("./ssh2_mod/client");
const MESSAGES = require("../config/message.json");

let keyArray = [];

let netConfApp = function (serverIP, serverPort, username, password, env) {

    this.eventEmitter = new events.EventEmitter();

    this.isDisconnected = false;

    this.router = new netconf.Client({
        host: serverIP,
        port: serverPort,
        username: username,
        password: password,
        env
    });

    this.checkNEAccessable = function (callback, params) {
        this.router.shell(params.sshPort, callback);
    }

    this.connection = function (callback, params) {
        if (params.newPassword) {
            this.router.login(params.sshPort, params.newPassword, (err) => {
                if (err && err.result && !err.message) {
                    this.router.open(callback);
                } else {
                    callback(!err, err);
                }
            });
        } else {
            this.defaultCheck(serverIP, params.sshPort, (result, err) => {
                if (result) {
                    callback(false, {
                        result: false,
                        message: MESSAGES["first-user-required"],
                        data: err
                    });
                } else {
                    this.router.login(params.sshPort, params.newPassword, (err) => {
                        if (err && err.result && !err.message) {
                            this.router.open(callback);
                        } else {
                            callback(!err, err);
                        }
                    });
                }
            });
        }
    };

    this.defaultCheck = function (sIP, sPort, callback) {
        let sshConn = SSHClient();
        sshConn.on("keyboard-interactive", (name, instructions, instructionsLang, prompts) => {
            sshConn.end();
            if (prompts.length > 0 && prompts[0].prompt.match(/^NOTICE:/)) {
                callback(true, prompts[0].prompt.replace("New password:", ""));
            } else {
                callback(false);
            }
        }).on("error", err => {
            sshConn.end();
            Logger.error("defaultCheck has error:", err.message);
            callback(false);
        }).connect({
            host: sIP,
            port: sPort,
            username: "aaa",
            tryKeyboard: true,
            readyTimeout: 95000
        });
    }

    this.requestXML = function (xml, callback) {
        this.router.rpcRequestXML(xml, function (err, rs) {
            if (err) {
                throw err;
            }
            if (Tools.isFunction(callback)) {
                callback(rs);
            }
        })
    };

    this.rpcXML = function (xml) {
        return new Promise((resolve, reject) => {
            this.router.rpcXML(xml, function (err, rs) {
                if (err) {
                    Logger.error(JSON.stringify(err));
                    reject(err);
                } else {
                    resolve(rs);
                }
            })
        });
    };

//---------------------------------------------

    this.rpc_get = async (xml) => {
        return new Promise((resolve, reject) => {
            this.router.rpcRequestXML(xml, function (err, rs) {
                if (err) {
                    Logger.error(JSON.stringify(err));
                    reject(err);
                } else {
                    resolve(rs);
                }
            })
        })
    };

    this.rpc_edit = async (xml, wildcard = false) => {
        return new Promise((resolve, reject) => {
            this.router.rpcEditXML(xml, function (err, rs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rs);
                }
            }, wildcard)
        })
    };

    this.SubscribeXML = function (replayStartTime, callback) {
        this.router.rpcSubscribeXML(replayStartTime, function (err, rs) {
            if (Tools.isFunction(callback)) {
                callback(err, rs);
            }
        })
    }

    this.addNetconfCloseListener = function (callback) {
        let self = this;
        this.router.addNetconfCloseListener(function (rs) {
            self.isDisconnected = true;
            if (Tools.isFunction(callback)) {
                callback(rs);
            }
        })
    }

    this.addNotificationListener = function (callback) {
        try {
            this.router.addNotificationListener(function (rs) {
                if (Tools.isFunction(callback)) {
                    callback({
                        result: true,
                        data: rs
                    });
                }
            })
        } catch (e) {
            Logger.error(JSON.stringify(e));
            if (Tools.isFunction(callback)) {
                callback({
                    result: false,
                    data: "WebSocket fail " + e
                });
            }
        }
    }

    this.getWSNotificationListener = function (key) {
        let added = false;
        for (let item of keyArray) {
            if (item === key) {
                added = true;
            }
        }
        return added;
    }


    this.removeNotificationListener = function (key) {
        this.router.removeNotificationListener();
        for (let item of keyArray) {
            if (item === key) {
                delete keyArray[index];
            }
        }
    }

    this.removeWSNotificationListener = function (key) {
        this.router.removeWSNotificationListener();
        for (let item of keyArray) {
            if (item === key) {
                delete keyArray[index];
            }
        }
    }

    this.close = function () {
        if (!this.isDisconnected) {
            this.router.close((err) => {
                Logger.log('netconf router close!');
                if (err) {
                    Logger.error(err);
                    throw err;
                }
            })
        }
    }

}

module.exports = netConfApp