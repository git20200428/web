const express = require("express");
const http = require("http");
const session = require("express-session");
const expressWs = require("express-ws");
const PATH = require("path");
const fs = require("fs");
const helmet = require("helmet");
const expressStaticGzip = require("express-static-gzip");
const basicAuth = require("express-basic-auth");

const MESSAGES = require("../config/message.json");

const cacheManagerTool = require("./cache/cachemanager");
const sessionStorage = {};
const netConf = require("./netconfApp");
const {
    removeEmptyObject, initYang, getDataFromNetConf, editDataFromNetConf, rpcRequest, createDataFromNetConf
    , insertDataFromNetConf, deleteDataFromNetConf, json2Xml, getNCRequestJSON
} = require("./common/tools");
const cryptoUtils = require("./CryptoUtil");
const Logger = require('./common/logger');
const cache = require("./cache/cachefile");
const Config = require("./common/config");
cache.cacheInit();

const app = express();
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(helmet.hsts());

/**
 * get server ipaddress
 * Command should be:
 *          {node} serverApp.js <serverIP> <serverPort> <listenPort> <sshPort> <listenTransferPort>
 *          for example: "node serverApp.js 127.0.0.1 831 444 22 8970"
 */
const LOCAL_HOST = "127.0.0.1";
const DEFAULT_PORT = "831";
const DEFAULT_LISTEN_PORT = "444";
const DEFAULT_LISTEN_TRANSFER_PORT = "8970";
const DEFAULT_SSH_PORT = "8021";
let serverIP = LOCAL_HOST, serverPort = DEFAULT_PORT, listenPort = DEFAULT_LISTEN_PORT, sshPort = DEFAULT_SSH_PORT,
    listenTransferPort = DEFAULT_LISTEN_TRANSFER_PORT;
if (process.argv.length > 2) {
    serverIP = process.argv[2];
    const reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
    if (!reg.test(serverIP)) {
        serverIP = LOCAL_HOST;
    }

    serverPort = process.argv.length > 3 ? process.argv[3] : DEFAULT_PORT;
    listenPort = process.argv.length > 4 ? process.argv[4] : DEFAULT_LISTEN_PORT;
    sshPort = process.argv.length > 5 ? process.argv[5] : DEFAULT_SSH_PORT;
    listenTransferPort = process.argv.length > 6 ? process.argv[6] : DEFAULT_LISTEN_TRANSFER_PORT;

}
const cookieName = `connect-${listenPort}`;
let DOC_SUPPORTED = true;

const sessionMiddleware = session({
    secret: 'infinera',
    saveUninitialized: false,
    resave: false,
    rolling: true,
    name: cookieName,
    cookie: {path: "/", maxAge: 60 * 60 * 1000, sameSite: "strict"}
});

app.use(sessionMiddleware);
app.use("/static", expressStaticGzip(PATH.resolve(__dirname, "../static"), {}));

const gzipWebguiHelp = expressStaticGzip(PATH.resolve(__dirname, "../webgui_help"), {});
const gzipDocumentation = expressStaticGzip(PATH.resolve(__dirname, "../documentation"), {});

function loadStatic(name, gzipHandlder) {
    app.use(name, (req, res, next) => {
        if (!sessionStorage[req.sessionID]) {
            res.sendFile(PATH.resolve(__dirname, "../static/index.html"));
        } else {
            gzipHandlder(req, res, next);
        }
    });
}

loadStatic("/webgui_help/", gzipWebguiHelp);
fs.stat(PATH.resolve(__dirname, "../documentation"), (err, stats) => {
    if (!err) {
        loadStatic("/documentation/", gzipDocumentation);
    } else {
        DOC_SUPPORTED = false;
    }
});

const httpServer = http.createServer(app);
app.set('trust proxy', true);
expressWs(app, httpServer);

function isExternalLogin(url) {
    return url === "/api/externalLogin";
}

app.post("*", (req, res) => {
    if (req.originalUrl === "/api/isDocSupported") {
        res.json({result: DOC_SUPPORTED, message: "", data: ""})
    } else if (req.originalUrl === "/api/login" || isExternalLogin(req.originalUrl)) {
        login(req, res);
    } else if (req.originalUrl === "/api/changePassword") {
        Logger.log(req.sessionID, '/api/changePassword user:', req.body.user, ', host:', req.hostname);
        connectNE(req, res);
    } else if (!sessionStorage[req.sessionID]) {
        Logger.log(req.sessionID, "Not found session.");
        res.json({result: false, message: MESSAGES['invalid-session']});  //****please don't change "Invalid session! ""
    } else {
        Logger.log(req.sessionID, req.originalUrl, req.body ? ("body: " + JSON.stringify(req.body)) : "");
        switch (req.originalUrl) {
            case "/api/rpc": {
                rpcHandler(req, res);
                break;
            }
            case "/download": {
                download(req, res);
                break;
            }
            case "/api/admin": {
                adminFunc(req, res);
                break;
            }
            case "/api/chassisview": {
                requestCache(req, res, "chassisview");
                break;
            }
            case "/api/facility": {
                requestCache(req, res, "facility");
                break;
            }
            case "/api/getCachedEvents": {
                requestCache(req, res, "cachedEvents");
                break;
            }
            case "/api/logout": {
                sessionDisconnected(req, res);
                break;
            }
            case "/api/fetchAlarms": {
                requestCache(req, res, "fetchAlarms");
                break;
            }
            case "/api/getAlarmTrend": {
                requestCache(req, res, "alarmTrend");
                break;
            }
            default: {
                break;
            }
        }
    }
});

const myAuthorizer = (username, password, cb) => {
    let netconf = new netConf(serverIP, serverPort, username, password);
    netconf.checkNEAccessable(function (err, result) {
        if (err) {
            cb(null, false);
        } else {
            cb(null, result);
        }
    }, {sshPort: sshPort});
};

const app2 = express();
app2.use(express.urlencoded({extended: false}));
app2.use(helmet.hsts());
app2.use("/transfer/", basicAuth({
    authorizer: myAuthorizer,
    authorizeAsync: true
}));

app2.get("/transfer/*", (req, res) => {
    let name = req.originalUrl;
    let transferDir = (process.argv.length = 2 && Config.hasOwnProperty("transfer.dir")) ? Config["transfer.dir"] : (__dirname + "/../");
    let _path = PATH.resolve(transferDir + name.replace("/transfer", ""));
    Logger.log(req.sessionID, `transfer-download <file: ${_path}>`);
    res.sendFile(_path);
});

app2.put("/transfer/*", (req, res) => {
    let name = req.originalUrl;
    let transferDir = (process.argv.length = 2 && Config.hasOwnProperty("transfer.dir")) ? Config["transfer.dir"] : (__dirname + "/../");
    let _path = PATH.resolve(transferDir + name.replace("/transfer", ""));
    Logger.log(req.sessionID, `transfer-upload <file: ${_path}>`);
    try {
        const f = fs.createWriteStream(_path);
        req.pipe(f);
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(404);
    }
});

const http2Server = http.createServer(app2);
app2.set('trust proxy', true);
http2Server.listen(listenTransferPort, () => {
    Logger.log("Port:", listenTransferPort, "is listened for basic auth access!");
});

function login(req, res) {
    if (req.body.link && !req.body.link.startsWith("/")) {
        req.body.link = "/" + req.body.link;
    }
    if (sessionStorage[req.sessionID] && req.body.link) {
        res.redirect(`${req.body.link}`);
        return;
    } else if (sessionStorage[req.sessionID]) {
        res.json({
            result: true,
            message: cacheManagerTool.getMessage(req.sessionID),
            data: sessionStorage[req.sessionID].loginInfo
        });
        return;
    } else if (Object.keys(req.body).length === 0) {
        res.json({result: false, message: "", data: []});
        return;
    }

    Logger.log(`------------login user: ${req.body.user}, host: ${req.hostname}------------`);
    connectNE(req, res);
}

function download(req, res) {
    let name = req.body.file;
    let _path = PATH.resolve(__dirname, name);
    Logger.log(req.sessionID, `/download <file: ${_path}>`);
    try {
        let size = fs.statSync(_path).size;
        let f = fs.createReadStream(_path);
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename=' + name,
            'Content-Length': size
        });
        f.pipe(res);
    } catch (e) {
        Logger.error(req.sessionID, JSON.stringify(e));
        res.send({
            result: false,
            message: e.toString()
        })
    }
}

function adminFunc(req, res) {
    let adminReq = req.body;
    sessionStorage.adminInfo = sessionStorage.adminInfo ? sessionStorage.adminInfo : {
        enableDebug: false,
        startTime: "",
        endTime: ""
    };
    let ret = {
        result: true,
        data: sessionStorage.adminInfo,
        message: `Debug is ${sessionStorage.adminInfo.enableDebug ? "enabled" : "disabled"}.`
    };
    let adminInfo = sessionStorage.adminInfo;
    if (!adminReq.hasOwnProperty("enableDebug")) {
    } else if (!(adminInfo.enableDebug) && adminReq.enableDebug) {
        adminInfo.enableDebug = adminReq.enableDebug;
        adminInfo.startTime = adminReq.startTime;
        Logger.setDebug(adminReq.enableDebug);
        setTimeout(() => {
            adminInfo.enableDebug = false;
            adminInfo.endTime = Date.now();
        }, 3600000) // one hour to reset debug
        ret.message = "Debug is enabled."
    } else if (adminInfo.enableDebug) {
        if (adminReq.enableDebug) {
            ret.message = "Debug is ready enabled";
        } else {
            adminInfo.enableDebug = adminReq.enableDebug;
            adminInfo.endTime = adminReq.endTime;
            Logger.setDebug(adminReq.enableDebug);
            ret.message = "Debug is disabled.";
        }
    } else {
        ret.message = "Debug is ready disabled";
    }

    res.json(ret);
}

function connectNE(req, res) {
    const name = req.body.user;
    let passwd = req.body.password;
    let passaes = req.body.passaes;  //"1qXmNsD9mIH1xA==";
    let newPasswd = req.body.newPassword;

    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ip = ip === "::1" ? "localhost" : ip.split(":").slice(-1)[0];
    let port = req.headers['x-forwarded-for'] && !req.headers["x-forwarded-port"] ? "443" : req.headers["x-forwarded-port"] || req.connection.remotePort;

    const crytokey = 'C7kqe3zS4+8SUjU9ORT/gDjDNYmWs1nM';
    if (passaes && passaes !== "") {
        try {
            passwd = cryptoUtils.decrypt(passaes, crytokey);
        } catch (e) {
            Logger.error(req.sessionID, JSON.stringify(e));
            res.json({result: false, message: MESSAGES['password-expired'], data: []});
            return;
        }
    }

    const netConfTool = new netConf(serverIP, serverPort, name, passwd, {WEB_CLIENT_CONNECTION: `${ip} ${port}`});
    netConfTool.reqIP = (serverIP === LOCAL_HOST) ? req.hostname : serverIP;
    netConfTool.connection((rs, err) => {
        if (rs) {
            Logger.log(req.sessionID, 'NE Connected.');
            req.session.loginUser = name;
            // init yang
            let reqJson = {
                ne: {
                    "ne-name": "",
                    system: {
                        security: {
                            user: {
                                "user-name": name,
                                "user-group": ""
                            }
                        },
                        "sw-management": {
                            "software-load": {
                                "swload-state": "active",
                                "swload-product": "",
                                "swload-version": ""
                            }
                        }
                    },
                    "system-capabilities": {
                        "equipment-capabilities": {
                            "supported-card": {
                                "card-type": "",
                                category: "",
                                "location-led-support": ""
                            }
                        }
                    }
                }
            }
            netConfTool.router.rpcRequestXML(json2Xml(reqJson), function (err2, rs2) {
                if (rs2 && rs2["rpc-reply"]) {
                    let rs2Data = rs2["rpc-reply"].data;
                    if (!rs2Data) {
                        netConfTool.close();
                        err = "NE type is not supported on WebGUI. Please check it!";
                        Logger.error(req.sessionID, err);
                    } else {
                        removeEmptyObject(rs2Data);
                        if (!rs2Data || !rs2Data.ne || !rs2Data.ne.hasOwnProperty("software-load")) {
                            err = "Get NE type failed. Not able to read NE yang modal by reason(" + err2 + ")";
                            Logger.error(req.sessionID, err);
                        } else {
                            let swLoad = rs2Data.ne["software-load"];
                            let neSWLoad = [swLoad["swload-product"], swLoad["swload-version"].match(/^\w+\.\d+/)[0]];
                            initYang(neSWLoad.join("-"));
                            if (passwd !== "" && passaes == null) {
                                passaes = cryptoUtils.encrypt(passwd, crytokey);
                            }

                            sessionStorage[req.sessionID] = {};
                            sessionStorage[req.sessionID].ncsession = netConfTool;
                            netConfTool.addNetconfCloseListener(() => {
                                Logger.log(req.sessionID, "Netconf closed notification.");
                                const wsMessage = {
                                    type: 'NEDisconnected',
                                    message: 'Lost connection to NE.',
                                    data: [],
                                    result: true
                                };

                                sessionDisconnected(req, res, wsMessage);
                            });
                            sessionStorage[req.sessionID].loginInfo = {
                                passaes: passaes,
                                neSWLoad: neSWLoad,
                                neIP: netConfTool.reqIP,
                                userGroup: rs2Data.ne.user["user-group"],
                                supportedCard: rs2Data.ne["supported-card"],
                                loginUser: netConfTool.router.username,
                                sessionID: ip + ":" + port
                            }
                            if (req.body.link) {
                                res.redirect(`${req.body.link}`);
                            } else {
                                res.json({
                                    result: true, message: "",
                                    data: sessionStorage[req.sessionID].loginInfo
                                });
                            }
                            cacheManagerTool.addSession(req.sessionID, netConfTool, req.body.replay);
                        }
                    }
                } else {
                    Logger.error(req.sessionID, "get NE type failed.");
                    err = err2;
                }
            });

            if (err) {
                if (isExternalLogin(req.originalUrl)) {
                    res.redirect(`/#/?error=${err}`);
                } else {
                    res.json({result: false, message: err, data: ""});
                }
            }
        } else {
            err.result ? Logger.log(req.sessionID, err.message) : (
                err.message ? Logger.error(req.sessionID, err.message) : Logger.error(req.sessionID, err));
            delete sessionStorage[req.sessionID];
            cacheManagerTool.removeSession(req.sessionID);
            Logger.log(req.sessionID, "Session is ended.")
            if (!res.writableEnded) {
                if (isExternalLogin(req.originalUrl)) {
                    res.redirect(`/#/?error=${err.message ? err.message : err}`);
                } else {
                    res.json({
                        result: err.result ? err.result : false,
                        message: err.message ? err.message : err,
                        data: err.data ? err.data : null
                    });
                }
            }
        }
    }, {
        sshPort: sshPort,
        newPassword: newPasswd
    });
}

app.ws('/api/ws_subscribe', (ws, req) => {
    if (!sessionStorage.hasOwnProperty(req.sessionID)) {
        Logger.log(req.sessionID, "session is already closed");
        return;
    }

    const nc = sessionStorage[req.sessionID].ncsession;
    sessionStorage[req.sessionID].wssession = sessionStorage[req.sessionID].wssession ? sessionStorage[req.sessionID].wssession : [];
    sessionStorage[req.sessionID].wssession.push(ws);
    Logger.log(req.sessionID, '/api/ws_subscribe');
    if (nc) {
        if (!nc.getWSNotificationListener(req.sessionID)) {
            Logger.log(req.sessionID, "Notification listener is added.");
        }

        cacheManagerTool.addWSNotificationListener(req.sessionID, ws);
    }
});

function sessionDisconnected(req, res, err) {
    if (sessionStorage[req.sessionID]) {
        const nc = sessionStorage[req.sessionID].ncsession;
        nc.removeWSNotificationListener(req.sessionID);
        nc.removeNotificationListener(req.sessionID);
        nc.close();
        if (sessionStorage[req.sessionID].wssession) {
            sessionStorage[req.sessionID].wssession.forEach(ws => {
                if (ws.readyState === ws.OPEN) {
                    try {
                        err ? ws.send(JSON.stringify(err)) : null;
                        ws.close();
                    } catch (e) {
                        Logger.error(req.sessionID, "Websocket error = (", e.message, ")");
                    }
                }
            });
        }

        req.session.destroy((err2) => {
            if (res && !res.finished) {
                let errMsg = '';
                if (err2) {
                    errMsg = 'Session disconnected with err: ' + err2;
                } else if (err) {
                    errMsg = err.message ? err.message : "Session disconnected: " + JSON.stringify(err);
                }

                errMsg && Logger.warning(req.sessionID, errMsg);
                Logger.log(req.sessionID, 'Clear cookie...');
                res.clearCookie(cookieName);
                res.json({result: !errMsg, message: errMsg, data: []});
            }
        });

        delete sessionStorage[req.sessionID];
        cacheManagerTool.removeSession(req.sessionID);
        Logger.log(req.sessionID, ' is released.');
    }
}

function rpcHandler(req, res) {
    let nc = sessionStorage[req.sessionID].ncsession;

    try {
        if (req.body.get) {
            let nc_request = {};
            let cache_request = {};
            getNCRequestJSON(nc_request, req.body.get, cache_request);
            let rsData = null;
            if (Object.keys(cache_request).length > 0) {
                rsData = cacheManagerTool.getRequestData(req.sessionID, cache_request);
            }
            getDataFromNetConf(nc_request, nc).then(rs => {
                if (rs.result) {
                    removeEmptyObject(rs.data);
                    if (rsData) {
                        Object.assign(rs.data, rsData);
                    }
                    if (Object.keys(rs.data).length === 0 && rs.message.length > 0) {
                        rs.message += "No data found";
                        rs.result = false;
                    }
                }

                res.json(rs);
            });
        } else if (req.body.edit) {
            editDataFromNetConf(req.body.edit, nc).then(rs => {
                res.json(rs);
            })
        } else if (req.body.create) {
            createDataFromNetConf(req.body.create, nc).then(rs => {
                res.json(rs);
            });
        } else if (req.body.insert) {
            insertDataFromNetConf(req.body.insert, nc).then(rs => {
                res.json(rs);
            });
        } else if (req.body.delete) {
            deleteDataFromNetConf(req.body.delete, nc).then(rs => {
                res.json(rs);
            });
        } else if (req.body.rpc) {
            rpcRequest(req.body.rpc, nc).then(rs => {
                res.json(rs);
            });
        } else {
            res.json({result: false, message: "request type not found!"});
        }
    } catch (e) {
        Logger.error(e.stack);
    }
}

function requestCache(req, res, type) {
    const retJson = {
        message: '',
        data: {},
        result: false
    };

    cacheManagerTool.requestCache(req.sessionID, type, function (data, err) {
        if (data) {
            retJson.data = data;
            retJson.result = true;
        } else {
            Logger.error(req.sessionID, err);
            retJson.data = null;
            retJson.message = err ? err : "";
            retJson.result = false;
        }

        res.json(retJson);
    });
}

app.use("*", expressStaticGzip(PATH.resolve(__dirname, "../static"), {}));

httpServer.listen(listenPort, () => {
    let message = "HTTP Server start up! netconfPort=" + serverPort + ", sshPort=" + sshPort + " and listenPort=" + listenPort;
    Logger.log(message);
    // console.log(message);
});

const oneG = 1024 * 1024 * 1024;
setInterval(() => {
    if (process.memoryUsage().rss > oneG) {
        Logger.error(process.pid, "process exit because memory usage is out of", oneG / 1024 / 1024 + "M.");
        process.exit();
    }
}, 60000);