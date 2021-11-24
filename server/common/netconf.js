const SSHClient = require("../ssh2_mod/client");
const xml2js = require('xml2js');
const events = require("events");
const {DOMParser} = require("xmldom");

const DELIM = ']]>]]>';
const Logger = require('./logger');

const MESSAGES = require("../../config/message.json");

function createError(msg, type) {
    const err = new Error(msg);
    err.name = type;

    Error.captureStackTrace(err, createError);
    return err;
}

function parseXML2JSON(xml, callback) {
    function parseValue(str, config) {
        if (config.numbers && str.match(/^-?\d+(\.\d+)?$/)) {
            if (str.match(".")) {
                return parseFloat(str);
            } else {
                return parseInt(str);
            }
        } else if (str.toLowerCase() === "true") {
            return config.boolean ? true : str;
        } else if (str.toLowerCase() === "false") {
            return config.boolean ? false : str;
        }
        return str;
    }

    function _parse(node, parent) {
        if (!node.hasOwnProperty("tagName")) return;
        let name = node.tagName;
        let obj = {};

        if (node.hasOwnProperty("attributes")) {
            let attributes = node.attributes;
            for (let j = 0; j < attributes.length; ++j) {
                if (!attributes[j].nodeName.match(/^xmlns/)) {
                    obj['@' + attributes[j].nodeName] = parseValue(attributes[j].nodeValue, {numbers: true});
                }
            }
        }

        if (node.hasOwnProperty("childNodes")) {
            let children = node.childNodes;
            for (let i = 0; i < children.length; ++i) {
                let child = children.item(i);
                if (node.childNodes && node.childNodes.length === 1
                    && Object.getPrototypeOf(child).nodeName === "#text") {
                    let v = node.firstChild.nodeValue;
                    if (Object.keys(obj).length === 0) {
                        obj = v;
                    } else {
                        obj.text = v;
                    }
                } else {
                    _parse(child, obj);
                }
            }
        }

        if ((typeof obj === "object") && (Object.keys(obj).length === 0)) {
            obj = "";
        }

        if (Array.isArray(parent[name])) {
            parent[name].push(obj);
        } else if (parent.hasOwnProperty(name)) {
            parent[name] = [parent[name], obj];
        } else {
            parent[name] = obj;
        }
    }

    try {
        let doc = new DOMParser().parseFromString(xml);
        let jsonObj = {};
        _parse(doc.documentElement, jsonObj);
        callback && callback(null, jsonObj);
    } catch (e) {
        callback && callback(e, null);
    }
}

function Client(params) {
    this.host = params.host;
    this.username = params.username;
    this.port = params.port || 22;
    this.password = params.password;
    this.env = params.env;
    this.pkey = params.pkey;

    // Debug and informational
    this.connected = false;
    this.sessionID = null;
    this.idCounter = 100;
    this.rcvBuffer = '';

    // Runtime option tweaks
    this.raw = false;

    this.emitter = new events.EventEmitter();

    this.lastConnectSuccessTimestamp = 0; // milli seconds
}

Client.prototype = {
    // Message and transport functions.
    // Operation functions defined below as wrappers to rpc function.
    rpc: function (request, callback) {
        const messageID = this.idCounter += 1;

        const object = {};
        const defaultAttr = {
            'message-id': messageID,
            'xmlns': 'urn:ietf:params:xml:ns:netconf:base:1.0'
        };
        if (typeof (request) === 'string') {
            object.rpc = {
                $: defaultAttr,
                [request]: null
            };
        } else if (typeof (request) === 'object') {
            object.rpc = request;
            if (object.rpc.$) {
                object.rpc.$['message-id'] = messageID;
            } else {
                object.rpc.$ = defaultAttr;
            }
        }

        const builder = new xml2js.Builder({headless: true});
        let xml;
        try {
            xml = builder.buildObject(object) + '\n' + DELIM;
        } catch (err) {
            return callback(err);
        }
        this.send(xml, messageID, callback);
    },

    rpcRequestXML: function (xml, callback) {
        const messageID = this.idCounter += 1;
        let requestXML = '<rpc xmlns="urn:ietf:params:xml:ns:netconf:base:1.0" message-id="' + messageID + '">'
        requestXML = requestXML + "<get><filter>" + xml + "</filter></get></rpc>" + '\n' + DELIM;
        this.send(requestXML, messageID, callback);
    },

    rpcXML: function (xml, callback) {
        const messageID = this.idCounter += 1;
        let requestXML = '<rpc xmlns="urn:ietf:params:xml:ns:netconf:base:1.0" message-id="' + messageID + '">'
        requestXML = requestXML + xml + "</rpc>" + '\n' + DELIM;
        this.send(requestXML, messageID, callback);
    },

    rpcEditXML: function (xml, callback, wildcard) {
        const messageID = this.idCounter += 1;
        let editXML = '<rpc message-id="' + messageID + '" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">';
        editXML += "<edit-config><target><running/></target>";
        if (wildcard) editXML += '<wildcard-support xmlns="http://infinera.com/yang/ioa/common/ioa-ietf">true</wildcard-support>';
        editXML += "<config>" + xml + " </config></edit-config></rpc>" + '\n' + DELIM;
        this.send(editXML, messageID, callback);
    },

    rpcSubscribeXML: function (replayStartTime, callback) {
        const messageID = "##ID##";
        let requestXML = '<rpc message-id="' + messageID + '" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">';
        const xml = '<create-subscription xmlns="urn:ietf:params:xml:ns:netconf:notification:1.0">' + (replayStartTime ? `<startTime>${replayStartTime}</startTime>` : "") + '</create-subscription>';
        requestXML = requestXML + xml + "</rpc>" + '\n' + DELIM;
        this.send(requestXML, messageID, callback);
    },

    addNotificationListener: function (callback) {
        this.emitter.on('notification', function (arg1) {
            return callback(arg1);
        });
    },

    addWSNotificationListener: function (callback) {
        this.emitter.on('notificationForWS', function (arg1) {
            return callback(arg1);
        });
    },

    removeWSNotificationListener: function () {
        this.emitter.removeAllListeners('notificationForWS');
    },

    removeNotificationListener: function () {
        this.emitter.removeAllListeners('notification');
    },

    addNetconfCloseListener: function (callback) {
        this.emitter.on('close', function (arg1) {
            Logger.log(arg1, "Netconf closed.");
            return callback(arg1);
        });
    },

    send: function (xml, messageID, callback) {
        Logger.debug(this.sessionID, "[netconf] request XML:", xml);
        if (!this.netconf) {
            callback("NE lost connection!");
            return;
        }
        try {
           const self = this;
           this.netconf.write(xml, function startReplyHandler() {
                const rpcReply = new RegExp(`(<rpc-reply.*message-id="${messageID}"[\\s\\S]*</rpc-reply>)\\n?]]>]]>\\s*`);
                // Add an event handler to search for our message on data events.
                self.netconf.on('data', function replyHandler() {
                    const replyFound = self.rcvBuffer.search(rpcReply) !== -1;
                    if (replyFound) {
                        const message = self.rcvBuffer.match(rpcReply);
                        self.parse(message[1], callback);
                        // Tidy up, remove matched message from buffer and
                        // remove this messages replyHandler.
                        self.rcvBuffer = self.rcvBuffer.replace(message[0], '');
                        self.netconf.removeListener('data', replyHandler);
                    }
                });
            });
        } catch (e) {
            Logger.error(JSON.stringify(e));
        }
    },

    parse: function (xml, callback) {
        const self = this;
        parseXML2JSON(xml, function checkRPCErrors(err, message) {
            if (err) {
                Logger.error(self.sessionID, "[netconf]", JSON.stringify(err));
                return callback(err, null);
            }
            if (message.hasOwnProperty('hello')) {
                return callback(null, message);
            }
            Logger.debug(self.sessionID, "[netconf]", JSON.stringify(message));
            if (message['rpc-reply'].hasOwnProperty('rpc_error')) {
                return callback(createError(JSON.stringify(message), 'rpcError'), null);
            }
            return callback(null, message);
        });
    },

    shell: function (sshPort, callBack) {
        let sshConn = SSHClient();
        sshConn.once('ready', () => {
            sshConn.shell((err, stream) => {
                stream.removeAllListeners();
                sshConn.end() && sshConn.destroy();
                if (err) {
                    callBack(err);
                } else {
                    callBack(null, true);
                }
            })
        }).addListener('error', (err) => {
            Logger.error("SSH connection error:", JSON.stringify(err));
            sshConn.end() && sshConn.destroy();
            callBack(err);
        }).connect({
            host: this.host,
            username: this.username,
            password: this.password,
            port: sshPort
        });
    },

    login: function (sshPort, newPassword, callBack) {
        let sshConn = SSHClient();
        sshConn.once('ready', () => {
            sshConn.shell((err, stream) => {
                if (err) {
                    stream.removeAllListeners();
                    sshConn.end() && sshConn.destroy();
                    callBack(err);
                } else {
                    let rcvData = "";
                    let INPUT_NEW_PASSWD = "Please provide the new password:|Please confirm the new password:";
                    let PROVIDE_OLD_PASSWD = "Please provide the old password:";
                    stream.on('data', (data) => {
                        rcvData += data;
                        if (rcvData.match("Connection closed")) {
                            stream.removeAllListeners();
                            sshConn.end() && sshConn.destroy();
                            callBack(rcvData);
                            rcvData = "";
                            return;
                        }
                        let arr = rcvData.match(/ERROR.*/);
                        if (arr) {
                            rcvData = "";
                            stream.removeAllListeners();
                            sshConn.end() && sshConn.destroy();
                            callBack(arr[0]);
                            return;
                        }

                        arr = rcvData.match(PROVIDE_OLD_PASSWD);
                        if (arr) {
                            if (!newPassword) {
                                rcvData = "";
                                stream.removeAllListeners();
                                sshConn.end() && sshConn.destroy();
                                callBack("password-expired");
                                return;
                            }
                            stream.write(this.password + "\n", err => {
                                if (err) {
                                    rcvData = "";
                                    stream.removeAllListeners();
                                    sshConn.end() && sshConn.destroy();
                                    callBack(err);
                                }
                            });
                            rcvData = "";
                        }

                        arr = rcvData.match(INPUT_NEW_PASSWD);
                        if (arr) {
                            stream.write(newPassword + "\n", err => {
                                if (err) {
                                    rcvData = "";
                                    stream.removeAllListeners();
                                    sshConn.end() && sshConn.destroy();
                                    callBack(err);
                                }
                            });
                            rcvData = "";
                        }

                        if (rcvData.match(this.username + "@")) {
                            rcvData = "";
                            stream.removeAllListeners();
                            sshConn.end() && sshConn.destroy();
                            if (!newPassword) {
                                callBack({
                                    result: true
                                });
                            } else if (callBack) {
                                rcvData = "";
                                callBack({
                                    result: true,
                                    message: MESSAGES['change-passwd-success']
                                });
                            }
                        }
                    });
                }
            })
        }).on('error', (err) => {
            Logger.error("Login failed with SSH connection error: ", err.message);
            sshConn.end() && sshConn.destroy();
            if (callBack) callBack(err);
        }).connect({
            host: this.host,
            username: this.username,
            password: this.password,
            port: sshPort,
            readyTimeout: 95000
        });
    },

    open: function (callback) {
        const self = this;
        self.sshConn = SSHClient();
        self.sshConn.on('ready', () => {
            self.sshConn.subsys('netconf', function (err, stream) {
                self.netconf = stream;
                const helloRequest = `
                  <?xml version="1.0" encoding="UTF-8"?>
                  <hello xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
                    <capabilities>
                      <capability>urn:ietf:params:netconf:base:1.0</capability>
                    </capabilities>
                  </hello>]]>]]>`
                let dataArray = [];
                stream.on('data', function buffer(chunk) {
                    self.rcvBuffer += chunk;
                    if (self.rcvBuffer.endsWith(DELIM)) {
                        dataArray = self.rcvBuffer.split(DELIM);
                        let rcvNotification = [];
                        for (let i = 0; i < dataArray.length; ++i) {
                            if (dataArray[i].match("</notification>")) {
                                parseXML2JSON(dataArray[i], function (err, rsp) {
                                    if (rsp) {
                                        rcvNotification.push(rsp);
                                    } else {
                                        Logger.error(self.sessionID, "[netconf]", JSON.stringify(err));
                                    }
                                });
                                dataArray[i] = "";
                            }
                        }
                        if (rcvNotification.length > 0) {
                            self.emitter.emit("notification", rcvNotification);
                        }
                        self.rcvBuffer = "";
                        for (let dt of dataArray) {
                            if (dt) {
                                self.rcvBuffer += dt + DELIM;
                            }
                        }
                    }
                }).on('error', function streamErr(err) {
                    Logger.error(self.sessionID, "[netconf]", err);
                    self.emitter.emit("close", self.sessionID);
                    stream.removeAllListeners();
                    self.sshConn.end() && self.sshConn.destroy();
                }).on('close', function handleClose() {
                    if (Date.now() - self.lastConnectSuccessTimestamp < 2000) {
                        callback(false, "Connection closed in short time.");
                    } else {
                        Logger.log(self.sessionID, "--------------netconf ended------------");
                        self.emitter.emit("close", self.sessionID);
                    }
                    stream.removeAllListeners();
                    self.sshConn.end() && self.sshConn.destroy();
                    self.lastConnectSuccessTimestamp = 0;
                }).on('data', function handleHello() {
                    if (self.rcvBuffer.match(DELIM)) {
                        const helloMessage = self.rcvBuffer.replace(DELIM, '');
                        self.rcvBuffer = '';
                        self.netconf.removeListener('data', handleHello);
                        parseXML2JSON(helloMessage, function (err, message) {
                            if (err) {
                                callback && callback(new Error('NETCONF session not established'));
                            } else if (message.hasOwnProperty("hello") && message.hello['session-id'] > 0) {
                                self.sessionID = message.hello['session-id'];
                                self.connected = true;
                                self.lastConnectSuccessTimestamp = Date.now();
                                callback && callback(true, null);
                            }
                        });
                    }
                }).write(helloRequest);
            }, self.env);
        }).on('error', function (err) {
            Logger.error("Netconf error:", JSON.stringify(err));
            self.sshConn.end() && self.sshConn.destroy();
            callback(false, err);
        }).connect({
            host: this.host,
            username: this.username,
            password: this.password,
            port: this.port,
            privateKey: this.pkey,
            env: this.env,
            readyTimeout: 95000
        });
    }
};

// Operation layer. Wrappers around RPC calls.
Client.prototype.close = function (callback) {
    this.connected = false;
    let self = this;
    this.rpc('close-session', function closeSocket(err, reply) {
        self.netconf && self.netconf.removeAllListeners();
        self.sshConn && self.sshConn.end() && self.sshConn.destroy();
        self.emitter.removeAllListeners();
        if (!callback) {
            return;
        }
        if (err) {
            return callback(err, reply);
        }
        return callback(null, reply);
    });
};

module.exports.Client = Client;
