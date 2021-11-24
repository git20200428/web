const Logger = require('../common/logger');
const CacheData = require('./cachedata');
const {WSType, ReplayStatus} = require('../common/config');
const DB_CHANGE = 'db-change';

let cachePool = {};

module.exports = {

    addSession(sessionID, nc, replay) {
        function getReplayStartTime(replay) {
            if (!replay) {
                return "";
            }
            let curTime = new Date();
            curTime.setMilliseconds(0);
            let t = 0;
            switch (replay) {
                case "day":
                    t = curTime.getTime() - 86400000;
                    break;
                case "week":
                    t = curTime.getTime() - 604800000;
                    break;
                case "month":
                    curTime.setMonth(curTime.getMonth() - 1);
                    t = curTime;
                    break;
                case "year":
                    curTime.setUTCFullYear(curTime.getUTCFullYear() - 1);
                    t = curTime;
                    break;
                case "all":
                    return "1970-01-01T00:00:00Z";
                default:
                    Logger.error(sessionID, "not handled replay start time: ", replay);
            }
            return (new Date(t)).toJSON().replace(".000Z", "Z");
        }

        if (!cachePool[sessionID]) {
            let cacheData = new CacheData(sessionID, nc);
            cachePool[sessionID] = cacheData;

            // fetch equipment
            cacheData.fetchData(() => {
                cacheData.sendMessage();
                nc.addNotificationListener(this.notify.bind(this, sessionID)); // add notification listener

                cacheData.notifyWS(WSType.CHASSIS);
                cacheData.notifyWS(WSType.DASHBOARD);
                cacheData.notifyWS(WSType.ALARMS);

                let subscribe = (nc, replay) => {
                    let startTime = getReplayStartTime(replay);
                    if (replay) {
                        cacheData.replayStart();
                        cacheData.sendMessage();
                        let startNotification = {
                            notification: {
                                replayStart: ""
                            }
                        };
                        cacheData.addEvent(JSON.stringify(startNotification));
                        cacheData.notifyWS(WSType.DBCHANGE, startNotification);
                    }
                    nc.SubscribeXML(startTime, (err, rsp) => {
                        if (!err && rsp['rpc-reply'].hasOwnProperty("ok")) {
                            Logger.log(sessionID, `netconf subscribe${startTime ? " from " + startTime : ""} succeeded.`);
                        } else {
                            if (replay) {
                                cacheData.replayFailed(JSON.stringify(err));
                                cacheData.sendMessage();
                                replay = "";
                                subscribe(nc, replay);
                            }
                            Logger.error(sessionID, `netconf subscribe${startTime ? "from " + startTime : ""} failed: ${JSON.stringify(err)}`);
                        }
                    });
                }

                subscribe(nc, replay);
            });
        }
    },

    /**
     *
     * @param {number} sessionid
     * @param {function} callback
     * @param {number} timeout: ms
     */
    getCacheData(sessionid, callback, timeout = 60000) {
        if (!(cachePool.hasOwnProperty(sessionid) && cachePool[sessionid].hasData())) {
            let startTime = Date.now();
            setTimeout(() => {
                if (cachePool.hasOwnProperty(sessionid) && cachePool[sessionid].hasData()) {
                    callback(cachePool[sessionid], '');
                } else {
                    let endTime = Date.now();
                    let nextTimeout = timeout - (endTime - startTime);
                    if (nextTimeout > 0) {
                        this.getCacheData(sessionid, callback, nextTimeout);
                    } else {
                        callback(null, 'getCacheData timedout');
                    }
                }
            }, 1000);
        } else {
            callback(cachePool[sessionid], '');
        }
    },

    requestCache(sessionID, type, callback) {
        this.getCacheData(sessionID, function (cacheData, err) {
            if (cacheData) {
                switch (type) {
                    case 'chassisview':
                    case 'facility':
                        callback(cacheData.facility);
                        break;
                    case "equipmentCount":
                        callback(cacheData.getEquipmentCount());
                        break;
                    case "cachedEvents":
                        callback(cacheData.notification);
                        break;
                    case "serviceUtil":
                        callback(cacheData.getServiceUtil());
                        break;
                    case "fetchAlarms":
                        cacheData.fetchAlarms(function () {
                            cacheData.notifyWS(WSType.ALARMS);
                            callback("alarm reloaded");
                        });
                        break;
                    default :
                        callback("", "not able to handle " + type);
                        break;
                }
            } else {
                callback("", err);
            }
        }, 50000);
    },

    removeSession(sessionid) {
        if (cachePool.hasOwnProperty(sessionid)) {
            cachePool[sessionid].free();
            delete cachePool[sessionid];
            Logger.log(sessionid, 'Cache is removed.');
        } else {
            Logger.warning(sessionid, 'Not found cache to remove.');
        }
    },

    notify(sessionID, rs) {
        if (!cachePool.hasOwnProperty(sessionID) || !rs.result) return;

        Logger.debug(sessionID, "[notification]", JSON.stringify(rs));
        let dt = cachePool[sessionID];
        rs.data.forEach(reply => {
            // notify client for update
            if (dt.replayStatus !== ReplayStatus.Start) {
                dt.notifyWS(WSType.DBCHANGE, reply);
            }

            // record notifications for current session
            dt.addEvent(JSON.stringify(reply));

            let notification = reply.notification;
            try {
                if (notification[DB_CHANGE] && notification[DB_CHANGE].change) {
                    let dbchange = notification[DB_CHANGE].change;
                    dt.updateCacheData(dbchange, () => {
                        dt.notifyWS(WSType.CHASSIS);
                        dt.notifyWS(WSType.DASHBOARD);
                        if (dbchange.hasOwnProperty("alarms")) {
                            dt.notifyWS(WSType.ALARMS);
                        }
                    });
                } else if (notification['alarm-notification']) {
                    const alarmChange = notification['alarm-notification'];
                    dt.updateAlarm(alarmChange, () => {
                        dt.notifyWS(WSType.CHASSIS);
                        dt.notifyWS(WSType.DASHBOARD);
                        dt.notifyWS(WSType.ALARMS);
                    });
                } else if (notification["audit"]) {
                    notification = null;
                } else if (notification.hasOwnProperty("replayComplete")) {
                    dt.replayComplete(() => {
                        dt.notifyWS(WSType.CHASSIS);
                        dt.notifyWS(WSType.DASHBOARD);
                        dt.notifyWS(WSType.ALARMS);
                        dt.sendMessage();
                        dt.notifyWS(WSType.EVENTS);
                    });
                } else {
                    Logger.log(sessionID, 'notification is not handled by cache: ' + JSON.stringify(reply))
                    notification = null;
                }
            } catch (err) {
                Logger.error(sessionID, err);
            }
        });
    },

    getMessage(sessionID) {
        return cachePool.hasOwnProperty(sessionID) ? cachePool[sessionID].message : "";
    },

    addWSNotificationListener(sessionID, ws) {
        if (!cachePool.hasOwnProperty(sessionID)) return;

        let cacheData = cachePool[sessionID];
        cacheData.addWSListener(ws, function () {
            cacheData.notifyWS(WSType.CHASSIS, "", ws);
            cacheData.notifyWS(WSType.ALARMS, "", ws);
            cacheData.notifyWS(WSType.DASHBOARD, "", ws);
            cacheData.sendMessage(ws);
            cacheData.notifyWS(WSType.EVENTS, "", ws);
        });
    },

    getRequestData(sessionid, filter) {
        return cachePool.hasOwnProperty(sessionid) ? cachePool[sessionid].getDataByFilter(filter) : null;
    }
};