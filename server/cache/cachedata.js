const Logger = require('../common/logger');
const Config = require('../common/config');
const dataHandler = require('./datahandler');
const {getYang, getDataFromNetConf, findObjByKey, findResource} = require("../common/tools");
const ConfigFacilityTree = require('./facilityTree.json');
const cacheFilter = require('./cacheFilter.json');
const CacheFile = require('./cachefile');

const PAYLOAD_TYPE = "payload-type";

class CacheData {
    constructor(sessionID, netconf) {
        this.sessionid = sessionID;
        this.replayStatus = Config.ReplayStatus.INVALID;

        this.ne_model = {};
        this.facility = {};
        this.dashboard = {};

        this.currentAlarms = {};

        this.netconf = netconf;

        this.wsList = [];
        // this.notification = [];
        this.cacheFile = new CacheFile(sessionID);

        this.message = "";
    }

    free() {
        this.cacheFile.close();
        delete this.cacheFile;
        delete this.ne_model;
        delete this.dashboard;
        delete this.facility;
        this.wsList = [];
    }

    addEvent(notification) {
        this.cacheFile.add(notification);
    }

    clearEvent() {
        this.cacheFile.clear();
    }

    generateInnerData() {
        // generate facility tree
        this.facility = dataHandler.generateTree(ConfigFacilityTree, this.ne_model);
        this.facility.ne.user = findObjByKey(this.ne_model, "user");

        // generate stateCount and alarmCount for ne/chassis
        Object.assign(this.facility.ne, dataHandler.generateStatistic(this.ne_model.ne));
        Logger.debug(this.sessionid, "chassisview:", JSON.stringify(this.facility));
        this.dashboard = {
            systemInfo: this.getSystemInfo(),
            serviceUsage: this.getServiceUtil(),
            entityCount: this.getEquipmentCount()
        }
    }

    sendMessage(ws) {
        if (this.message) {
            this.notifyWS(Config.WSType.DBCHANGE, {
                notification: {
                    message: this.message
                }
            }, ws);
        }
    }

    fetchData(callback) {
        this.message = "Loading cache data...";
        this.sendMessage();
        Logger.log(this.sessionid, 'fetch equipment/facilities/alarms data......');
        getDataFromNetConf(cacheFilter, this.netconf).then(value => {
            if (value.result) {
                this.message = "Cache data loaded!";
                this.ne_model = value.data;
                Logger.debug(this.sessionid, 'fetch data result:', JSON.stringify(value.data));
                Logger.log(this.sessionid, 'fetch equipment/facilities/alarms data......done');
                this.getCardTypes();
                this.handleAlarms(this.ne_model);
                dataHandler.concatAlarmsToModel(this.currentAlarms, this.ne_model);
                this.generateInnerData();
                if (callback) {
                    callback();
                }
            } else {
                this.message = `Loading Cache data failed: ${value.message}`;
                Logger.error(this.sessionid, `fetch equipment/facilities data failed! ${value.message}`);
            }
        });
    }

    /**
     * e.g. cardTypes: ["1-1", "1-2", "1-3", "1-4"...]
     */
    getCardTypes() {
        let chassises = findObjByKey(this.ne_model, "chassis");
        if (chassises) {
            let data = findObjByKey(this.ne_model, "supported-chassis");
            let fun = (chassis, sptChassis) => {
                if (Array.isArray(chassis)) {
                    for (let item of chassis) {
                        fun(item, sptChassis);
                    }
                } else if (Array.isArray(sptChassis)) {
                    for (let item of sptChassis) {
                        fun(chassis, item);
                    }
                } else if (chassis["required-type"] === sptChassis["chassis-type"]) {
                    let sptSlots = sptChassis["supported-slot"];
                    for (let slot of sptSlots) {
                        let possibleCardTypes = slot["possible-card-types"];
                        if (possibleCardTypes && (
                            possibleCardTypes.indexOf("gx:CHM6") !== -1 || possibleCardTypes.indexOf("gx:CHM1R") !== -1)) {
                            Config.SRVSUTIL.cardTypes.push(`${chassis.name}-${slot["slot-name"]}`);
                        }
                    }
                }
            }
            fun(chassises, data);
        }

        if (this.ne_model.ne["ne-type"] === "G30") {
            Config.SRVSUTIL.payloadTypes = ["100GE", "400GE", "OTU4"];
        } else {
            let yang = findObjByKey(getYang(), "xcon");
            if (yang.hasOwnProperty(PAYLOAD_TYPE) && yang[PAYLOAD_TYPE].type === "enumeration") {
                for (let enumItem of yang[PAYLOAD_TYPE]["enum-value"]) {
                    for (let key in enumItem) {
                        if (key !== "empty") {
                            Config.SRVSUTIL.payloadTypes.push(key);
                        }
                    }
                }
            }
        }
        Logger.debug(this.sessionid, "getCardTypes:", JSON.stringify(Config.SRVSUTIL.cardTypes));
    }

    notifyWS(wsType, value, ws) {
        if (!value) {
            switch (wsType) {
                case Config.WSType.CHASSIS:
                    value = this.facility
                    break;
                case Config.WSType.ALARMS:
                    value = this.currentAlarms.alarm;
                    break;
                case Config.WSType.EVENTS:
                    this.cacheFile.getData((data, sessionid) => {
                        Logger.debug(sessionid, "[WS]", Config.WSType.EVENTS, "data:", data);
                        if (ws) {
                            _notify(ws, wsType, data, sessionid);
                        } else {
                            this.wsList.map(key => {
                                _notify(key, wsType, data, sessionid);
                            });
                        }
                    });
                    return;
                case Config.WSType.DASHBOARD:
                    value = this.dashboard;
                    break;
                default:
                    Logger.error(this.sessionid, "not handled wsType: ", wsType);
                    break;
            }
        }

        if (ws) {
            _notify(ws, wsType, value, this.sessionid);
        } else {
            this.wsList.map(key => {
                _notify(key, wsType, value, this.sessionid);
            });
        }

        function _notify(_ws, wsType, value, sessionid) {
            if (_ws.readyState === _ws.OPEN) {
                let ret = {
                    type: wsType,
                    result: true,
                    data: value
                }

                if (!value) {
                    ret.result = false;
                    ret.message = "fetch data failed";
                }

                try {
                    _ws.send(JSON.stringify(ret));
                    Logger.log(sessionid, "[WS]", wsType);
                    Logger.debug(sessionid, "[WS]", wsType, "data:", JSON.stringify(value));
                } catch (e) {
                    Logger.error(sessionid, "ws send failed:", JSON.stringify(e));
                }
            }
        }
    }

    updateCacheData(changeData, callback) {
        if (this.replayStatus !== Config.ReplayStatus.Start) {
            dataHandler.updateCacheData(changeData, this.ne_model);
            this.generateInnerData();
            if (callback) {
                callback();
            }
        }
    }

    addWSListener(ws, callback) {
        this.wsList.push(ws);
        if (this.hasData()) {
            callback && callback();
        } else {
            this.sendMessage();
        }
    }

    removeAlarmFromModel(model) {
        if (!model) return;

        if (model.alarms) {
            delete model.alarms;
        }

        if (Array.isArray(model)) {
            model.forEach(item => {
                this.removeAlarmFromModel(item);
            })
        } else {
            for (let i in model) {
                if ((typeof model[i] === "object")) {
                    this.removeAlarmFromModel(model[i]);
                }
            }
        }
    }

    handleAlarms(alarms) {
        this.currentAlarms = alarms ? (dataHandler.findAlarmRoot(alarms) ?? {}) : {};
        if (this.currentAlarms.alarm) {
            if (!Array.isArray(this.currentAlarms.alarm)) {
                this.currentAlarms.alarm = [this.currentAlarms.alarm];
            }
        }
    }

    fetchAlarms(callback) {
        Logger.log(this.sessionid, 'fetch alarm data......');
        getDataFromNetConf(Config.alarmFilter, this.netconf).then(value => {
            if (value.result) {
                Logger.log(this.sessionid, 'fetch alarm data......');
                this.removeAlarmFromModel(this.ne_model);
                this.handleAlarms(value.data.alarms);
                dataHandler.concatAlarmsToModel(this.currentAlarms, this.ne_model);
                this.generateInnerData();
                if (callback) callback();
            } else {
                Logger.error(this.sessionid, `fetch alarm data failed! ${value.message}`);
            }
        });
    }

    replayStart() {
        this.message = "Loading history data...";
        Logger.log(this.sessionid, this.message);
        // this.notification = [];
        this.clearEvent();
        this.replayStatus = Config.ReplayStatus.Start;
    }

    replayFailed(errMsg) {
        this.message = `Loading history data failed! ${errMsg}`;
        this.clearEvent();
        Logger.error(this.sessionid, this.message);
        this.replayStatus = Config.ReplayStatus.INVALID;
    }

    replayComplete(callback) {
        this.message = "History data loaded!";
        Logger.log(this.sessionid, this.message);
        this.replayStatus = Config.ReplayStatus.Complete;
        if (callback) callback();
    }

    updateAlarm(data, callback) {
        if (this.replayStatus !== Config.ReplayStatus.Start) {
            let Yang = getYang();
            if (Yang) {
                let alarmYang = Yang.yang ? Yang.yang.alarm : null;
                if (alarmYang) {
                    for (let i in alarmYang) {
                        if (!data.hasOwnProperty(i)) {
                            if (alarmYang[i].default) {
                                data[i] = alarmYang[i].default;
                            }
                        }
                    }
                }
            }
            dataHandler.updateAlarm(data, this.currentAlarms);
            dataHandler.concatAlarmToModel(data, this.ne_model);
            this.generateInnerData();
            if (callback) callback();
        }
    }

    hasData() {
        return Object.keys(this.ne_model).length !== 0;
    }

    getDataByFilter(filter) {
        let ret = {};
        if (this.ne_model) {
            let node = this.ne_model;
            filterData(filter, node, "", ret);
        }

        removeEmptyObject(ret);

        return ret;

        function removeEmptyObject(data) {
            if (Array.isArray(data)) {
                for (let i = data.length - 1; i >= 0; --i) {
                    if (typeof data[i] === "object") {
                        removeEmptyObject(data[i]);
                        if (Object.keys(data[i]).length === 0) {
                            data.splice(i, 1);
                        }
                    }
                }
            } else {
                Object.keys(data).map(key => {
                    if (typeof data[key] === "object") {
                        removeEmptyObject(data[key])
                        if (Object.keys(data[key]).length === 0) {
                            delete data[key];
                        }
                    }
                });
            }
        }

        function copyObject(filter, src, key, parent) {
            let dst = {};
            if (Array.isArray(src)) {
                src.map(item => {
                    copyObject(filter, item, key, parent);
                });
            } else if (Object.keys(filter).length === 0) {
                for (let i in src) {
                    if (src.hasOwnProperty(i) && (typeof src[i] !== "object")) {
                        dst[i] = src[i];
                    }
                }
            } else {
                for (let i in filter) {
                    if (filter.hasOwnProperty(i) && src.hasOwnProperty(i) && (typeof filter[i] !== "object")) {
                        dst[i] = src[i];
                    }
                }
            }
            if (Object.keys(dst).length > 0) {
                if (parent[key] && Array.isArray(parent[key])) {
                    parent[key].push(dst);
                } else {
                    parent[key] = parent[key] ? [parent[key], dst] : dst;
                }
            }
        }

        function filterData(filter, src, key, parent) {
            let res = false;
            if (Array.isArray(filter)) {
                filter.forEach(fi => {
                    let res2 = filterData(fi, src, key, parent);
                    res = res ? res : res2;
                });
            } else if (Array.isArray(src)) {
                src.forEach(item => {
                    let res2 = filterData(filter, item, key, parent);
                    res = res ? res : res2;
                });
            } else {
                let hasSubObject = false;
                for (let i in filter) {
                    if (filter.hasOwnProperty(i)) {
                        if (typeof filter[i] === "object") {
                            hasSubObject = true;
                        } else if (filter[i] !== '') {
                            if (Array.isArray(src[i])) {
                                let found = false;
                                for (let si of src[i]) {
                                    if (si === filter[i]) {
                                        found = true;
                                    }
                                }
                                if (!found) return false;
                            } else if (src[i] !== filter[i]) {
                                return false;
                            }
                        }
                    }
                }
                if (hasSubObject) {
                    for (let i in filter) {
                        if (filter.hasOwnProperty(i) && src.hasOwnProperty(i)) {
                            if (typeof filter[i] === "object") {
                                if (key) parent[key] = parent[key] ? parent[key] : {};
                                if (Object.keys(filter[i]).length === 0) {
                                    copyObject(filter[i], src[i], i, key ? parent[key] : parent);
                                    res = true;
                                } else {
                                    let res2 = filterData(filter[i], src[i], i, key ? parent[key] : parent);
                                    res = res ? res : res2;
                                }
                            }
                        }
                    }
                }
                if (res || !hasSubObject) {
                    copyObject(filter, src, key, parent);
                    res = true;
                }
            }

            return res;
        }
    }

    countXC(xc, ret) {
        const src = findResource(xc.source, this.ne_model).node;
        const dst = findResource(xc.destination, this.ne_model).node;
        if (src && dst) {
            let arr = xc.AID.split('-');
            const cardAID = arr[0] + '-' + arr[1];
            const rate = parseFloat(src.rate ?? src.speed);
            if (!ret[cardAID]) {
                ret[cardAID] = {};
                Config.SRVSUTIL.payloadTypes.map(payloadType => {
                    ret[cardAID][payloadType] = {
                        rate: 0,
                        count: 0
                    }
                });
            }
            if (xc[PAYLOAD_TYPE]) {
                if (Config.SRVSUTIL.payloadTypes.indexOf(xc[PAYLOAD_TYPE]) !== -1) {
                    ret[cardAID][xc[PAYLOAD_TYPE]].rate = rate;
                    ret[cardAID][xc[PAYLOAD_TYPE]].count += 1;
                } else {
                    Logger.error(this.sessionid, "xcon payload type is not valid:", xc[PAYLOAD_TYPE]);
                }
            } else {
                let key;
                if (rate === 100 && !src["supporting-facilities"].match("ethernet") && !dst["supporting-facilities"].match("ethernet")) {
                    key = "OTU4";
                } else {
                    key = rate + "GE";
                }

                if (!ret[cardAID].hasOwnProperty(key)) {
                    for (let i of Config.SRVSUTIL.cardTypes) {
                        if (!ret[i].hasOwnProperty(key)) {
                            ret[i][key] = {
                                rate: rate,
                                count: 0
                            }
                        }
                    }
                }
                ret[cardAID][key].rate = rate;
                ret[cardAID][key].count += 1;
            }
        }
    }

    countEthZR(zrEthernet, ret) {
        if (Config.isEthZR(zrEthernet)) {
            const cardAID = zrEthernet["supporting-card"];
            const rate = parseFloat(zrEthernet.speed);
            if (!ret[cardAID]) {
                ret[cardAID] = {};
                Config.SRVSUTIL.payloadTypes.map(payloadType => {
                    ret[cardAID][payloadType] = {
                        rate: 0,
                        count: 0
                    }
                });
            }
            const key = rate + "GE";
            ret[cardAID][key].rate = rate;
            ret[cardAID][key].count += 1;
        }
    }


    countPG(pg, ret) {
        if (pg.AID) {
            let cardAID = pg.AID.match(/^\d+-\d+/)[0];
            ret[cardAID] += 1;
        }
    }

    /**
     *
     * @returns
     *   e.g.
     *   {
     *       "1-1": {         // card AID
     *           "100GBE-LAN": 2,
     *           "400GBE-LAN": 3
     *       },
     *       "1-2": {
     *           "100GBE-LAN": 0,
     *           "400GBE-LAN": 1
     *       },
     *       ...
     *   }
     */
    getServiceUtil() {
        if (Config.SRVSUTIL.cardTypes.length === 0) {
            this.getCardTypes();
        }
        // init service util
        let ret = {};
        for (let i of Config.SRVSUTIL.cardTypes) {
            ret[i] = {};
            for (let payloadType of Config.SRVSUTIL.payloadTypes) {
                ret[i][payloadType] = {
                    rate: 0,
                    count: 0
                };
            }
        }

        // get xcon data
        let xcons = dataHandler.findNode(this.ne_model, Config.SRVSUTIL.xcon, null, null);
        if (xcons) {
            if (Array.isArray(xcons)) {
                xcons.map(xc => {
                    this.countXC(xc, ret);
                });
            } else {
                this.countXC(xcons, ret);
            }
        }

        // get ethZR data
        const ethZRs = dataHandler.findNode(this.ne_model, "ne.facilities.ethernet", "tx-mapping-mode", "openZR+");
        if (ethZRs) {
            if (Array.isArray(ethZRs)) {
                ethZRs.map(ethernet => {
                    this.countEthZR(ethernet, ret);
                });
            } else {
                this.countEthZR(ethZRs, ret);
            }
        }

        let pgRet = {};
        for (let i of Config.SRVSUTIL.cardTypes) {
            pgRet[i] = 0;
        }

        let pgs = dataHandler.findNode(this.ne_model, "ne.protection.protection-group", null, null);
        if (pgs) {
            if (Array.isArray(pgs)) {
                pgs.map(pg => {
                    this.countPG(pg, pgRet);
                });
            } else {
                this.countPG(pgs, pgRet);
            }
        }
        return {
            xc: ret,
            pg: pgRet
        };
    }

    getSystemInfo() {
        let rtValue = {
            swLabel: "",
            swVersion: "",
            dcn: "",
            ospf: [],
            user: "",
            session: ""
        };
        if (this.ne_model.ne && this.ne_model.ne.system) {
            let system = this.ne_model.ne.system;
            if (system.hasOwnProperty("sw-management")) {
                let swLoad = system["sw-management"]["software-load"];
                if (swLoad) {
                    let swLoadLabel = swLoad["swload-label"];
                    if (swLoad["swload-delta-label"]) {
                        swLoadLabel += "/" + swLoad["swload-delta-label"];
                    }
                    rtValue.swLabel = swLoadLabel;
                    rtValue.swVersion = swLoad["swload-version"];
                }
            }

            if (system.hasOwnProperty("networking")) {
                if (system.networking.interface) {
                    let itf = system.networking.interface;
                    itf = Array.isArray(itf) ? itf : [itf];
                    for (let i = 0; i < itf.length; ++i) {
                        if (itf[i]["if-name"] === "DCN") {
                            let dcnInfo = itf[i];
                            rtValue.dcn = "IPv4 " + dcnInfo["ipv4-enabled"] + "; IPv6: " + dcnInfo["ipv6-enabled"] + "; Oper State: " + dcnInfo["oper-state"];
                            break;
                        }
                    }
                }
                if (system.networking.routing) {
                    let ospfInfo = system.networking.routing["ospf-instance"];
                    if (ospfInfo) {
                        ospfInfo = Array.isArray(ospfInfo) ? ospfInfo : [ospfInfo];
                        ospfInfo.forEach(ospf => {
                            let rtId = ospf["router-id"];
                            let insId = ospf["instance-id"];
                            rtValue.ospf.push({
                                insId: !insId ? "NA" : insId,
                                rtId: !rtId ? "NA" : rtId
                            });
                        });
                    }
                }
                if (system.hasOwnProperty("security")) {
                    let users = system.security.user;
                    let userCount = users ? (Array.isArray(users) ? users.length : 1) : 0;
                    rtValue.user = "(" + userCount + ") " + (userCount > 1 ? "users configured" : "user configured");
                    let sessions = system.security.session;
                    let sessionCount = sessions ? (Array.isArray(sessions) ? sessions.length : 1) : 0;
                    rtValue.session = "(" + sessionCount + ") " + ((sessionCount > 1) ? "current sessions" : "current session");
                }
            }
        }
        return rtValue;
    }

    getEquipmentCount() {
        let retValue = {};
        Config.equipmentState.forEach(st => {
            retValue[st] = {};
        });

        Object.keys(Config.EQPCOUNT).map(key => {
            if (typeof Config.EQPCOUNT[key] === "object") {
                Config.equipmentState.forEach(st => {
                    retValue[st][key] = {};
                });
                Object.keys(Config.EQPCOUNT[key]).map(subKey => {
                    Config.equipmentState.forEach(st => {
                        retValue[st][key][subKey] = 0;
                    });

                    let nodes = dataHandler.findNode(this.ne_model, Config.EQPCOUNT[key][subKey], null, null);
                    if (nodes) {
                        nodes = Array.isArray(nodes) ? nodes : [nodes];
                        nodes.map(node => {
                            let value;
                            if (key === "service") {
                                if (subKey === "xcon") {
                                    value = getStatisticsForXcon(node, this.ne_model);
                                } else if (subKey === "ethZR") {
                                    value = getStatisticsForEthZR(node, this.ne_model);
                                } else {
                                    Logger.error("Not handled getEquipmentCount:", key, subKey);
                                }
                            } else {
                                value = dataHandler.generateStatistic(node, null, false);
                            }
                            addStatus(value, key, subKey);
                        });
                    }
                });
            }
        });

        function addStatus(state, key, subKey) {
            Config.equipmentState.forEach(st => {
                retValue[st][key][subKey] += state.statusCount[st];
            });
        }

        Object.keys(retValue).map(key => {
            let total = 0;
            Object.keys(retValue[key]).map(subkey => {
                retValue[key][subkey].total = 0;
                Object.values(retValue[key][subkey]).map(value => {
                    total += value;
                    retValue[key][subkey].total += value;
                });
            });
            retValue[key].total = total;
        });

        return retValue;

        function getStatisticsForXcon(node, rootNode) {
            const src = findResource(node.source, rootNode);
            const dst = findResource(node.source, rootNode);
            const retValue = {
                statusCount: {}
            };
            Config.equipmentState.forEach(st => {
                retValue.statusCount[st] = 0;
            });
            if (src.node && dst.node) {
                const srcV = dataHandler.generateStatistic(src.node, null, false);
                const dstV = dataHandler.generateStatistic(dst.node, null, false);
                if (srcV.statusCount.disabled || dstV.statusCount.disabled) {
                    retValue.statusCount.disabled = 1;
                } else {
                    retValue.statusCount.enabled = 1;
                }
            }
            return retValue;
        }

        function getStatisticsForEthZR(node, rootNode) {
            const retValue = {
                statusCount: {}
            };
            Config.equipmentState.forEach(st => {
                retValue.statusCount[st] = 0;
            });

            if (Config.isEthZR(node)) {
                const allEthZR = dataHandler.findNode(rootNode, 'ne.facilities.eth-zr', null, null);
                const ethZRList = Array.isArray(allEthZR) ? allEthZR : [allEthZR];
                let dst = ethZRList.find(ethZR => (ethZR["supporting-card"] === node["supporting-card"]) && (ethZR["supporting-port"] === node["line-port"]));
                if (dst) {
                    const srcV = dataHandler.generateStatistic(node, null, false);
                    const dstV = dataHandler.generateStatistic(dst, null, false);
                    if (srcV.statusCount.disabled || dstV.statusCount.disabled) {
                        retValue.statusCount.disabled = 1;
                    } else {
                        retValue.statusCount.enabled = 1;
                    }
                }
            }

            return retValue;
        }
    }
}

module.exports = CacheData;