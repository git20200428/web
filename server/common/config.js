const PATH = require("path");
let Config = {
    AlarmConfig: {
        AlarmID: "alarm-id",
        AlarmReportTime: "reported-time",
        AlarmSeverity: "perceived-severity",
        AlarmSeverityValues: ["critical", "major", "minor", "warning"],
        AlarmTrendInterval: "1800"
    },
    adminState: "admin-state",
    operState: "oper-state",
    WSType: {
        DBCHANGE: "notification",
        ALARMS: "fetchAlarms",
        CHASSIS: "chassisviewSubscribe",
        DASHBOARD: "dashboard",
        EVENTS: "events"
    },
    equipmentState: ["enabled", "disabled", "lock", "maintenance"],
    EQPCOUNT: {
        equipment: {
            chassis: "ne.equipment.chassis",
            slot: "ne.equipment.chassis.slot",
            card: "ne.equipment.card",
            port: "ne.equipment.card.port",
            tom: "ne.equipment.card.port.tom"
        },
        facility: {
            "super-channel-group": "ne.facilities.super-channel-group",
            "super-channel": "ne.facilities.super-channel",
            "optical-carrier": "ne.facilities.optical-carrier",
            odu: "ne.facilities.odu",
            otu: "ne.facilities.otu",
            "optical-channel": "ne.facilities.optical-channel",
            "trib-ptp": "ne.facilities.trib-ptp",
            "line-ptp": "ne.facilities.line-ptp",
            ethernet: "ne.facilities.ethernet",
            "comm-channel": "ne.facilities.comm-channel",
            "flexo": "ne.facilities.flexo",
            "flexo-group": "ne.facilities.flexo-group",
            "eth-zr": "ne.facilities.eth-zr",
            "oc": "ne.facilities.oc",
            "stm": "ne.facilities.stm"
        },
        service: {
            xcon: "ne.services.xcon",
            ethZR: "ne.facilities.ethernet"
        },
        system: {
            ne: "ne",
            interface: "ne.system.networking.interface"
        }
    },
    ReplayStatus: {
        INVALID: -1,
        Start: 0,
        Complete: 1
    },
    alarmFilter: {
        "alarms": {
            "current-alarms": {
                "alarm": ""
            }
        }
    },
    cacheDir: PATH.resolve(__dirname + "/../../cache"),
    SRVSUTIL: {
        xcon: "ne.services.xcon",
        payloadTypes: [],
        cardTypes: []
    },
    isEthZR: function (node) {
        return (node["tx-mapping-mode"] === "openZR+") &&
            node.hasOwnProperty("time-slots") && node.hasOwnProperty("line-port") &&
            (node["time-slots"] !== "") && (node["line-port"] !== "");
    }
};

const fs = require("fs");
const Logger = require("./logger");
try {
    let buffer = fs.readFileSync(PATH.resolve(__dirname + "/../../config/server.conf"));
    if (buffer && buffer.length > 0) {
        let regexp = {
            sizeM: /^\dM$/,
            sizeK: /^\dK$/,
            size: /^\d$/
        }
        const arr = buffer.toString().split("\n");
        for (let line of arr) {
            let conf = line.match(/^([\w.]+)=(.+)/);
            if (conf) {
                if (conf[1].match(".size")) {
                    let size = conf[2].toUpperCase();
                    if (regexp.sizeM.test(size)) {
                        size = parseFloat(conf[2]) * 1024 * 1024;
                    } else if (regexp.sizeK.test(size)) {
                        size = parseFloat(conf[2]) * 1024;
                    } else if (conf[1] === "cache.event.size") {
                        size = 2 * 1024 * 1024;  // default is 2M
                    } else {
                        size = 5 * 1024 * 1024;  // default is 5M
                    }
                    Config[conf[1]] = size;
                } else if (conf[1].match(".files")) {
                    let num = 10;  // default is 10;
                    if (regexp.size.test(conf[2])) {
                        num = parseInt(conf[2]) > 5 ? 5 : parseInt(conf[2]);
                    } else if (conf[1] === "cache.event.files") {
                        num = 5;  // default is 5
                    }
                    Config[conf[1]] = num;
                } else {
                    Config[conf[1]] = conf[2];
                }
            }
        }
    }
} catch (err) {
    Logger.error(JSON.stringify(err));
}

module.exports = Config;