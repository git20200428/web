import {
    FETCH_ALARMS,
    FETCH_CHASSISVIEW,
    FETCH_LED,
    NE_DISCONNECTED,
    ON_CHASSISVIEW,
    ON_DASHBOARD,
    ON_EVENTS,
    ON_NOTIFICATION, REMOVE_ALERT,
    TO_LOGIN, IS_DOC_SUPPORTED
} from "../actions";
import chassisConfig from "../../../conf/chassis_config"
import {
    convertToArray,
    getKeyFromResource,
    getSimplifyNS,
    getYang,
    isLineCard,
    isObject,
    neDisconnect,
    removeNS,
    resource2KeyName,
    findObjByTag
} from "../../custom/utils";

const OLDVALUE = "@old-value";
const AlarmSeverityValues = ["critical", "major", "minor", "warning"];
const PERCEIVED_SEVERITY = "perceived-severity";
const PERIOD = 100 * 86400 * 1000; // 100 days;
const INTERVAL = 1800 * 1000;  // miliseconds

const initialState = {
    events: [],
    eventSummary: [],
    alarmPool: [],
    alarmHistory: [],
    islogin: 0,
    msg: "",
    alarmTrend: {
        needUpdate: false,
        data: {}
    },
    tcaPool: [],
    alertPool: {},
    isReplaying: false
};

export default function (state = initialState, action) {
    function generateResource(node, tag, yang, parentResource) {
        let retValue = {
            resource: "",
            pathSource: ""
        }

        // get namespace
        let parentPathResource = parentResource ? parentResource.pathSource : null;
        let ns = parentPathResource ? (parentPathResource.split(":")[0]).replace("/", "") : (yang.definition && yang.definition.namespace ? getSimplifyNS(yang.definition.namespace) : "");
        retValue.pathSource = (parentPathResource ? parentPathResource : "") + "/" + ns + ":" + tag;

        if (yang && yang.definition && yang.definition.key) {
            let keyArr = yang.definition.key.split(" ");
            keyArr.map(key => {
                if (node[key] && typeof node[key] !== "object") {
                    retValue.pathSource += "[" + ns + ":" + key + "='" + node[key] + "']";
                }
            });
        }

        retValue.resource = node.resource ? node.resource : retValue.pathSource;
        return retValue;
    }

    function putValue(value, oldValue, newValue, type) {
        let v = value;
        if (type === "instance-identifier") {
            // resource instance
            v = resource2KeyName(isObject(value) ? value.text : value);
        } else if (isObject(value)) {
            v = value.text;
        }
        if (value["@operation"] === "delete") {
            oldValue.push(v);
        } else if (value.hasOwnProperty(OLDVALUE)) {
            if (type === "instance-identifier") {
                oldValue.push(resource2KeyName(value[OLDVALUE]));
            } else {
                oldValue.push(value[OLDVALUE]);
            }
            newValue.push(v);
        } else {
            newValue.push(v);
        }
    }

    function generateDetail(node, yang) {
        let detail = "";
        for (let key in node) {
            if (key === "@operation") continue;
            if (yang[key] !== "container" && yang[key] !== "list" && yang.hasOwnProperty(key)) {
                let value = node[key];
                detail += key + ": ";
                let oldV = [];
                let newV = [];
                let type = yang[key].type;
                if (Array.isArray(value)) {
                    for (let item of value) {
                        putValue(item, oldV, newV, type);
                    }
                } else {
                    putValue(value, oldV, newV, type);
                }

                if (oldV.length > 0) {
                    if (yang[key]["yangType"] === "leaf-list") {
                        oldV = oldV.concat(newV);
                    }
                    detail += '["' + oldV.join('","') + '"] ===> ["' + newV.join('","') + '"]\n';
                } else if (newV.length > 1) {
                    detail += "[" + newV.join(",") + "]\n";
                } else {
                    detail += newV + "\n";
                }
            }
        }
        return detail;
    }

    function generateDetailForRpc(node, yang) {
        let detail = "";
        let subYang = null;
        for (let key in node) {
            if (yang && yang.input && yang.input.hasOwnProperty(key)) {
                let value = node[key];
                detail += key + ": ";
                let oldV = [];
                let newV = [];
                if (yang.input[key] === "list") {
                    subYang = getYang("rpc")[key];
                }
                let type = yang.input[key].type;
                if (Array.isArray(value)) {
                    for (let item of value) {
                        if (subYang) {
                            newV.push("{\n" + generateDetailForRpc(item, subYang) + "}");
                        } else {
                            putValue(item, oldV, newV, type);
                        }
                    }
                } else if (subYang) {
                    newV.push("{\n" + generateDetailForRpc(value, subYang) + "}");
                } else {
                    putValue(value, oldV, newV, type);
                }

                if (oldV.length > 0) {
                    if (yang[key]["yangType"] === "leaf-list") {
                        oldV = oldV.concat(newV);
                    }
                    detail += '["' + oldV.join('","') + '"] ===> ["' + newV.join('","') + '"]\n';
                } else if (newV.length > 1) {
                    detail += "[" + newV.join(",") + "]\n";
                } else {
                    detail += newV + "\n";
                }
            }
        }
        return detail;
    }

    function getObjYang(path, last) {
        function _getYang(category) {
            let Yang = getYang(category);
            if (Yang[last]) {
                return {
                    name: last,
                    value: Yang[last]
                };
            } else {
                let arr = path.split(".");
                let key = last;
                if (arr) {
                    for (let i = arr.length - 1; i >= 0; --i) {
                        key = arr[i] + "." + key;
                        if (Yang[key]) {
                            return {
                                name: key,
                                value: Yang[key]
                            };
                        }
                    }
                }
            }
            return null;
        }

        let obj = _getYang("yang");
        obj = obj ? obj : _getYang("rpc");
        return obj;
    }

    function addEventItem(node, tag, type, resource, eventTime, changeBy, yang) {
        let detail = generateDetail(node, yang ? yang.value : null);
        let ev = {
            eventType: "db-change",
            type: type,
            resource: resource,
            entity: resource2KeyName(resource),
            entityType: tag,
            time: eventTime,
            detail: detail,
            changedby: changeBy,
            isLineCard: isLineCard(tag, node.AID, state.ne),
            entityYangType: yang.name,
            _key: state.events.length
        };
        state.events.splice(0, 0, ev);
        state.eventSummary[ev.entity] = state.eventSummary[ev.entity] ? state.eventSummary[ev.entity] : [];
        state.eventSummary[ev.entity].splice(0, 0, ev);
    }

    function handleDBChange(node, eventTime, changeBy, tpath, tag, resource = "") {
        if (Array.isArray(node)) {
            node.map(item => {
                handleDBChange(item, eventTime, changeBy, tpath, tag, JSON.parse(JSON.stringify(resource)));
            });
        } else {
            let yang = getObjYang(tpath, tag);
            let yangObj = yang ? yang.value : null;
            let nextResource = null;
            if (yangObj) {
                nextResource = generateResource(node, tag, yangObj, resource);
                if (node.hasOwnProperty("@operation")) {
                    addEventItem(node, tag, node['@operation'], nextResource.pathSource, eventTime, changeBy, yang);
                }
            }

            let oldValue = false;
            for (let key in node) {
                if (!oldValue && yangObj && yangObj[key] && yangObj[key]["yangType"] === "leaf-list") {
                    if (!node.hasOwnProperty("@operation") || node["@operation"].toLowerCase() !== "create") {
                        addEventItem(node, tag, "change", nextResource ? nextResource.pathSource : null, eventTime, changeBy, yang);
                        oldValue = true;
                    }
                } else if (!oldValue && node[key].hasOwnProperty(OLDVALUE)) {
                    addEventItem(node, tag, "change", nextResource ? nextResource.pathSource : null, eventTime, changeBy, yang);
                    oldValue = true;
                } else {
                    let nextPath = tpath + "." + tag;
                    if ((!yangObj || (yangObj[key] === "container" || yangObj[key] === "list")) && getObjYang(nextPath, key)) {
                        handleDBChange(node[key], eventTime, changeBy, nextPath, key, JSON.parse(JSON.stringify(nextResource)));
                    }
                }
            }
        }
    }

    function handleAudit(ev, node, path, resource = "", parentYang) {
        let leaf = true;
        for (let i in node) {
            if (i === "@operation") {
                ev.type = node[i];
            } else {
                let yangObj = null;
                if (!parentYang || parentYang[i] === "container" || parentYang[i] === "list") {
                    let yang = getObjYang(path, i);
                    yangObj = yang ? yang.value : null;
                }
                if (yangObj) {
                    leaf = false;
                    ev.entityType = i;
                    if (yangObj.definition["yangType"] === "rpc") {
                        ev.entityType = "rpc";
                        ev.entity = i;
                        ev.detail = generateDetailForRpc(node[i], yangObj);
                        ev._key = state.events.length;
                        state.events.splice(0, 0, ev);
                    } else if (Array.isArray(node[i])) {
                        node[i].forEach(item => {
                            let itemEv = JSON.parse(JSON.stringify(ev));
                            itemEv.type = "change";
                            let nextPath = path + "." + i;
                            let nextRsc = generateResource(item, i, yangObj, resource);
                            itemEv.resource = nextRsc.pathSource;
                            itemEv.entity = resource2KeyName(nextRsc.pathSource);
                            itemEv.detail = generateDetail(item, yangObj);
                            handleAudit(itemEv, item, nextPath, nextRsc, yangObj);
                        });
                    } else {
                        let nextPath = path + "." + i;
                        let nextRsc = generateResource(node[i], i, yangObj, resource);
                        ev.resource = nextRsc.pathSource;
                        ev.entity = resource2KeyName(nextRsc.pathSource);
                        ev.detail = generateDetail(node[i], yangObj);
                        handleAudit(ev, node[i], nextPath, nextRsc, yangObj);
                    }
                }
            }
        }

        if (leaf) {
            ev._key = state.events.length;
            state.events.splice(0, 0, ev);
        }
    }

    function getValue(obj, key) {
        if (obj.hasOwnProperty(key)) {
            if (obj[key].hasOwnProperty("@old-value")) {
                return obj[key].text;
            } else {
                return obj[key];
            }
        }

        return null;
    }

    function filterAlert(notification) {
        if (state.isReplaying) return;

        let dbchange = notification["db-change"];
        if (dbchange) {
            let obj = findObjByTag(dbchange, "transfer-status");
            if (obj) {
                let name = obj.filetype;
                let operation = obj.operation;
                let type = getValue(obj, "transfer-type");
                let sessionID = getValue(obj, "session-id");
                let status = getValue(obj, "last-completion-status");
                if ((!type || !sessionID || !status) && state.ne["transfer-status"]) {
                    convertToArray(state.ne["transfer-status"]).some(item => {
                        if ((item.filetype === name) && (item.operation === operation)) {
                            if (!type) type = item["transfer-type"];
                            if (!sessionID) sessionID = item["session-id"];
                            if (!status) status = item["last-completion-status"];
                            return true;
                        }
                        return false
                    });
                }
                if (type === "sync" || sessionID !== sessionStorage.sessionID) return; // not concern sync operation

                state.alertPool = {...state.alertPool};
                state.alertPool[name + ":" + operation] = {
                    name: name,
                    operation: operation,
                    status: status.match("Fail") ? "Fail" : status,
                    message: status
                }
            }
        }
    }

    function handleSingleNotification(notif) {
        if (!notif) return;

        let eventTime = notif.eventTime;
        if (notif.hasOwnProperty("replayStart")) {
            state.eventSummary = [];
            state.events = [];
            state.alarmHistory = [];
            state.alarmTrend.needUpdate = true;
            state.isReplaying = true;
        } else if (notif["db-change"]) {
            let dbchange = notif["db-change"];
            let changedby = dbchange["changed-by"].hasOwnProperty("server") ? "server" : dbchange["changed-by"]["user-name"];
            handleDBChange(dbchange.change, eventTime, changedby, "", "", "");
        } else if (notif["alarm-notification"]) {
            let alarm = notif["alarm-notification"];
            alarm.eventTime = (alarm[PERCEIVED_SEVERITY] === "cleared") ? eventTime : alarm["reported-time"];
            let entityType = getKeyFromResource(alarm.resource).type;
            alarm["entityType"] = entityType;

            let alarmType = alarm["alarm-type"];
            if (/TCA-PM/.test(alarmType.toUpperCase())) {
                alarm._key = state.tcaPool.length;
                state.tcaPool.push(alarm);
            } else {
                alarm.isLineCard = isLineCard(entityType, alarm.AID, state.ne);
                alarm._key = state.alarmHistory.length;
                let i = 0;
                for (; i < state.alarmHistory.length; ++i) {
                    if (state.alarmHistory[i].eventTime <= alarm.eventTime) {
                        break;
                    }
                }
                state.alarmHistory.splice(i, 0, alarm);
                state.alarmTrend.needUpdate = true;
            }
        } else if (notif.hasOwnProperty("replayComplete")) {
            state.msg = "History data loaded!";
            state.isReplaying = false;
        } else if (notif.hasOwnProperty("message")) {
            state.msg = notif.message;
        } else if (notif.hasOwnProperty("audit")) {
            let audit = notif.audit;
            let command = audit.command;
            let ev = {
                eventType: "audit",
                type: "change",
                resource: "",
                entity: "",
                entityType: "",
                time: eventTime,
                detail: "",
                changedby: audit["user-name"],
                entityYangType: ""
            }
            handleAudit(ev, command, "", "");
        }
    }

    function getAlarmTrend(alarmList, retValue) {
        if (alarmList.length === 0) return;

        const initAlarmStatus = data => {
            for (let severity of AlarmSeverityValues) {
                data[severity] = {new: 0, clear: 0};
            }
        }

        let trendTime = 0;
        let newestAlarmTime = alarmList[0].eventTime;
        let startTime = Date.parse(newestAlarmTime) - PERIOD;
        let key = "";
        let t = 0;
        let alarm = null;
        let trendPoint = "";
        for (let i = alarmList.length - 1; i >= 0; --i) {
            alarm = alarmList[i];
            key = alarm.eventTime;
            t = Date.parse(key);
            if (t < startTime) {
                continue;
            }

            if (!trendPoint) {  // first one
                trendTime = Math.floor(t / INTERVAL) * INTERVAL;
                trendPoint = (new Date(trendTime)).toJSON().replace(".000", "");
                retValue[trendPoint] = {};
                initAlarmStatus(retValue[trendPoint]);
                if (trendTime < t) {
                    trendTime += INTERVAL;
                }
            }

            while (t > trendTime) {
                trendPoint = (new Date(trendTime)).toJSON().replace(".000", "");
                if (!retValue[trendPoint]) {
                    retValue[trendPoint] = {};
                    initAlarmStatus(retValue[trendPoint]);
                }

                trendTime += INTERVAL;
            }

            trendPoint = (new Date(trendTime)).toJSON().replace(".000", "");
            if (!retValue[trendPoint]) {
                retValue[trendPoint] = {};
                initAlarmStatus(retValue[trendPoint]);
            }
            let severity = alarm[PERCEIVED_SEVERITY];
            if (retValue[trendPoint].hasOwnProperty(severity)) retValue[trendPoint][severity].new += 1;
            if (severity === "cleared") {
                for (let j = i + 1; j < alarmList.length; ++j) {
                    if (alarmList[j]["alarm-id"] === alarm["alarm-id"]
                        && alarmList[j]["reported-time"] === alarm["reported-time"]
                        && alarmList[j][PERCEIVED_SEVERITY] !== "cleared") {
                        if (retValue[trendPoint].hasOwnProperty(alarmList[j][PERCEIVED_SEVERITY])) {
                            retValue[trendPoint][alarmList[j][PERCEIVED_SEVERITY]].clear += 1;
                            break;
                        }
                    }
                }
            }
        }
    }

    switch (action.type) {
        case FETCH_LED: {
            const leds = {};
            action.payload.led && action.payload.led.map(led => {
                leds[led.location] || (leds[led.location] = []);
                leds[led.location].push(led);
            });
            return {
                ...state,
                led: leds
            };
        }
        case ON_DASHBOARD: {
            return {
                ...state,
                dashboard: action.payload
            }
        }
        case FETCH_CHASSISVIEW:
        case ON_CHASSISVIEW: {
            // Handle chassis (Add type)
            if (action.payload.ne.chassis) {
                action.payload.ne.chassis = convertToArray(action.payload.ne.chassis);
                for (let chassis of action.payload.ne.chassis) {
                    const chassisType = removeNS(chassis["required-type"]);
                    if (!chassisType) continue;
                    Object.assign(chassis, {type: chassisType});
                    const chassisCfg = chassisConfig[chassisType];

                    // Handle slot (Add slot type)
                    chassis.slot.map(slot => {
                        Object.assign(slot, {...chassisCfg.slot[slot.name]});

                        // Handle card (Add card type/left/top)
                        if (slot.card) {
                            const cardType = removeNS(slot.card["required-type"]);
                            slot.type = cardType.toLowerCase();
                            Object.assign(slot.card, {...chassisCfg.card[cardType].cfg, type: cardType});

                            // Handle card (Add port left/top)
                            if (slot.card.port) {
                                Array.isArray(slot.card.port) ? slot.card.port.map(port => {
                                    Object.assign(port, {...chassisCfg.card[cardType].port[port.name]});
                                }) : Object.assign(slot.card.port, {...chassisCfg.card[cardType].port[slot.card.port.name]});
                            }
                        }
                    });
                }
            }

            let userList = action.payload.ne.user;
            if (userList) {
                let loginUser = sessionStorage.username;
                if (Array.isArray(userList)) {
                    for (let user of userList) {
                        if (user["user-name"] === loginUser) {
                            sessionStorage.userGroup = user["user-group"];
                        }
                    }
                } else if (userList["user-name"] === loginUser) {
                    sessionStorage.userGroup = userList["user-group"];
                }
            }
            return {
                ...state,
                ...action.payload
            };
        }
        case ON_EVENTS:
            state.events = [];
            state.eventSummary = [];
            state.alarmHistory = [];
            state.tcaPool = [];
            state.alarmTrend.needUpdate = true;
            action.payload = JSON.parse("[" + action.payload.replace(/\n/g, ",").replace(/,$/, "") + "]");
            // DO NOT RETURN HERE, need to go through below logic
        case ON_NOTIFICATION: {
            state.events = state.events ? state.events : [];
            state.eventSummary = state.eventSummary ? state.eventSummary : {};
            if (Array.isArray(action.payload)) {
                action.payload.forEach(notif => {
                    handleSingleNotification(notif.notification);
                });
            } else {
                handleSingleNotification(action.payload.notification);
                filterAlert(action.payload.notification);
            }

            if (state.alarmTrend.needUpdate) {
                delete state.alarmTrend.data;
                state.alarmTrend.data = {};
                getAlarmTrend(state.alarmHistory.length ? state.alarmHistory : state.alarmPool, state.alarmTrend.data);
                state.alarmTrend.needUpdate = false;
            }

            return {
                ...state
            }
        }
        case FETCH_ALARMS:
            if (Array.isArray(action.payload)) {
                action.payload.sort(
                    function (a, b) {
                        let t1 = a["reported-time"];
                        let t2 = b["reported-time"];
                        return t1 > t2 ? -1 : 1;
                    }
                );
                state.alarmPool = action.payload;
                for (let alarm of state.alarmPool) {
                    let entityType = getKeyFromResource(alarm.resource).type;
                    alarm["entityType"] = entityType;
                    alarm.isLineCard = isLineCard(entityType, alarm.AID, state.ne);
                    alarm.eventTime = alarm["reported-time"];
                }
            }

            if (state.alarmHistory.length === 0 && state.alarmPool.length > 0) {
                delete state.alarmTrend.data;
                state.alarmTrend.data = {};
                getAlarmTrend(state.alarmPool, state.alarmTrend.data);
                state.alarmTrend.needUpdate = false;
            }

            return {
                ...state
            }
        case TO_LOGIN:
            state.islogin = action.payload;
            return {
                ...state
            }
        case IS_DOC_SUPPORTED:
            state.isDocSupported = action.payload;
            return {
                ...state
            }
        case NE_DISCONNECTED:
            neDisconnect(action.payload);
            state = initialState;
            return {
                ...state
            }
        case REMOVE_ALERT:
            if (state.alertPool.hasOwnProperty(action.payload)) {
                state.alertPool = {...state.alertPool};
                delete state.alertPool[action.payload];
            }

            return {
                ...state
            }
        default:
            return state;
    }
}
