import {
    severityFormatter4ReactTable,
    upDownCheckFormatter,
    upDownFormatter4ReactTable
} from "./configuration/config_util";
import {getText} from "./custom/utils";

let TableFilterTypeEnum = {
    Select: 5,
    TextInput: 1,
    MultiSelect: 3,
    MultiSubItemsSelect: 4,
};

let tableType = {
    minTable: "min",   //default
    pageTable: "page",
    treeTable: "tree",
    view: "view",
    userdefine: "userdefine",
}

export let DataTypeEnum = {
    Fuzzy: 1,
    Accurate: 2,
    MultiMatch: 3
};

let TABLECONFIG = {
    "ne-info": {
        title: getText("ne-info"),
        extendsType: "ne",
        include: ["ne-id", "ne-name", "label", "ne-type", "ne-vendor", "clli", "node-controller-chassis-name", "contact"],
        viewClass: require("./system/neInfo").neInfoView,
    },
    "ne-location": {
        title: getText("ne-location"),
        extendsType: "ne",
        include: ["ne-id", "ne-site", "ne-location", "ne-sub-location", "altitude", "latitude", "longitude"],
    },
    "ne-state": {
        title: getText("ne-state"),
        extendsType: "ne",
        include: ["ne-id", "equipment-discovery-ready", "alarm-report-ready", "alarm-report-control", "oper-state", "avail-state"],
    },
    "ne-recover-status": {
        title: getText("ne-recover-status"),
        extendsType: "ne",
        include: ["ne-id", "recover-mode", "original-recover-mode-reason", "recover-mode-reason"],
        viewClass: require("./system/neInfo").neRecoverView,
    },
    "clock": {
        viewClass: require("./system/neInfo").clockView,
    },
    "ztp": {
        viewClass: require("./system/ztp").chgZTPModeView,
    },
    "sw-management.software-load.sw-component": {
        title: "SW Component",
        columnSort: ["name", "description", "state", "version"],
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "protection-group" : {
        title: "Protection Group",
        columnSort: ["name", "AID", "label", "working-pu","protection-pu","protection-type", "pg-state","pg-request",
            "switching-mode","reversion-mode","wtr-timer","hold-off-timer","remaining-wtr","last-switch-trigger","client-side-olos-trigger","client-side-sd-trigger"
            ,"network-side-csf-trigger","alarm-report-control"]
    },
    "protection-unit":{
        title: "Protection Unit",
        columnSort: ["name", "AID", "label", "transport-entity","state","role", "alarm-report-control"],
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "xcon": {
        title: getText("xcon"),
        exclude: ["payload-type-filter", "card"],
        columnSort: ["name", "AID", "label", "source", "destination", "direction", "time-slots", "payload-type", "network-mapping", "type"],
        relateTableColumns: ["name", "AID", "label", "source", "destination", "direction", "time-slots", "payload-type", "network-mapping"],
        tableType: tableType.pageTable,
        viewClass: require("./service/xcon").xconView,
    },
    "secure-entity":{
        formatColumns: {
            "oper-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "name": ""
                }
                return upDownFormatter4ReactTable(configKey, requestKey, tableHashCode);
            }
        }
    },
    "interface": {
        columnSort: ["if-name", "if-description", "if-type", "mtu", "ipv4-enabled", "ipv4-address-assignment-method", "ipv6-enabled", "ipv6-address-assignment-method", "admin-state", "oper-state", "avail-state"],
        formatColumns: {
            "admin-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "if-name": ""
                }
                return upDownCheckFormatter(configKey, requestKey, tableHashCode);
            },
            "oper-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "if-name": ""
                }
                return upDownFormatter4ReactTable(configKey, requestKey, tableHashCode);
            }
        },
    },
    "ntp-server": {
        columnSort: ["ip-address", "origin", "auth-key-id", "admin-state", "oper-state", "avail-state", "alarm-report-control"],
        formatColumns: {
            "admin-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "ip-address": ""
                }
                return upDownCheckFormatter(configKey, requestKey, tableHashCode);
            },
            "oper-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "ip-address": ""
                }
                return upDownFormatter4ReactTable(configKey, requestKey, tableHashCode);
            }
        },
    },
    "acl": {
        formatColumns: {
            "admin-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "name": ""
                }
                return upDownCheckFormatter(configKey, requestKey, tableHashCode);
            },
            "oper-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "name": ""
                }
                return upDownFormatter4ReactTable(configKey, requestKey, tableHashCode);
            }
        },
    },
    "vrf": {
        buttons: {
            rowButtons: {
                "edit": {
                    enabled: false
                }
            }
        },
        columnSort: ["name", "type", "chassis-name", "description"]
    },
    "task": {
        viewClass: require("./system/task").taskView,
    },
    "equipment": {
        title: "equipment",
        tableType: tableType.treeTable,
        expendState: ["^chassis_.", "^slot_._."],
        // tableSort: false,
        viewClass: require("./configuration/facility").equipmentTableView,
    },
    "facility": {
        title: "facility",
        tableType: tableType.treeTable,
        expendState: ["^chassis_.", "^slot_._."],
        // tableSort: false,  //default is true
        viewClass: require("./configuration/facility").facilityTableView,
    },
    "card": {
        columnSort: ["name", "AID", "chassis-name", "slot-name", "alias-name", "label", "required-type", "admin-state", "oper-state", "avail-state"],
        relateTableColumns: ["name", "AID", "slot-name", "alias-name", "label", "required-type", "admin-state", "oper-state", "required-subtype"]
    },
    "supported-card": {
        columnSort: ["card-type", "card-width", "card-height", "supported-subtype", "is-field-replaceable", "description"],
    },
    "supported-tom": {
        columnSort: ["tom-type", "phy-modes", "PON", "form-factor", "support-third-party-toms", "description"],
    },
    "user": {
        columnSort: ["user-name", "user-status", "user-admin-state", "last-login-date", "user-aaa-type", "max-invalid-login", "suspension-time", "timeout", "password", " max-sessions", "password-expiration-date", "password-aging-interval"],
    },
    "security-policies": {
        title: getText("security-policies"),
    },
    "user-group": {
        title: getText("user-group"),
        columnSort: ["name", "user-names", "description"]
    },
    "session": {
        viewClass: require("./security/securityView").sessionTableView,
        columnSort: ["session-id", "session-user", "session-protocol", "session-type", "created-time"]
    },
    "port": {
        columnSort: ["name", "AID", "alias-name", "label", "port-type", "tom", "hosted-facilities", "admin-state", "oper-state", "avail-state"],
        relateTableColumns: ["name", "AID", "alias-name", "label", "port-type", "admin-state", "oper-state", "supported-type", "avail-state"],
        buttons: {
            rowButtons: {
                "delete": {
                    enabled: false
                }
            }
        },
    },
    "third-party-fw":{
        title: getText("third-party-fw"),
        viewClass: require("./system/manifest").thirdPartyView,
    },
    "sw-management.software-load": {
        title: getText("sw-load"),
        formatColumns: {
            "swload-prepared": function (tableHashCode) {
                return upDownFormatter4ReactTable(tableHashCode);
            }
        },
        columnSort: ["swload-state", "swload-label", "swload-version", "swload-information", "swload-vendor", "swload-product", "swload-status"],
        viewClass: require("./system/manifest").swLoadView,
    },
    "software-location.software-load": {
        formatColumns: {
            "swload-prepared": function (configKey, tableHashCode) {
                return upDownFormatter4ReactTable(tableHashCode);
            }
        },
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
        columnSort: ["swload-state", "swload-label", "swload-version", "swload-information", "swload-vendor", "swload-product", "swload-status"]
    },
    "software-location.software-load.sw-component": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "route": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "ikev2-local-instance": {
        formatColumns: {
            "admin-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "name": ""
                }
                return upDownCheckFormatter(configKey, requestKey, tableHashCode);
            },
            "oper-state": function (configKey, tableHashCode) {
                let requestKey = {
                    "name": ""
                }
                return upDownCheckFormatter(configKey, requestKey, tableHashCode);
            },
        }
    },
    "supporting-interface": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "sw-service": {
        tableType: tableType.pageTable,
    },
    "log_server": {
        columnSort: ["name", "address", "transport", "port", "destination-facility-switch", "destination-facility", "pattern-match", "source-interface", "message-format"]
    },
    "log-file": {
        columnSort: ["name", "number-of-files", "log-file-facility", "max-file-size"]
    },
    "filetype": {
        title: getText("transfer-status"),
    },
    "get-pm": {
        title: "pm-data",
        tableType: tableType.view,
        viewClass: require("./perfmon/pm").pmView,
    },

    "pm-resource": {
        viewClass: require("./perfmon/pmResource").pmResourceTable,
    },
    "pm-threshold-profile": {
        viewClass: require("./perfmon/thresholdProfile").thresholdProfile,
    },
    "filter-pm-control": {
        extendsType: "pm-control-entry",
        viewClass: require("./perfmon/filterPMControlEntry").filterPMControlEntryTable,
    },
    "pm-profile-entry": {
        viewClass: require("./perfmon/pmProfileEntry").pmProfileEntryTable,
        columnSort: ["resource-type"]
    },
    "total$inventory": {
        title: getText("inventory"),
        extendsType: "chassis.inventory",
        viewClass: require("./configuration/inventory").inventoryView,
        columnSort: ["name"]
    },
    "ipv4-static-route": {
        columnSort: ["ipv4-destination-prefix", "vrf"]
    },
    "ipv6-static-route": {
        columnSort: ["ipv6-destination-prefix", "vrf"]
    },
    "ospf-instance": {
        viewClass: require("./network/routing").routingView,
        columnSort: ["instance-id"]
    },
    "ospf-area": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "management-address": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "custom-tlv": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "ikev2-peer": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
        // viewClass: require("./security/ikev2View").IKEV2View,
    },
    "ISK": {
        viewClass: require("./security/securityView").ISKView,
    },
    "ssh-keygen": {
        title: "ssh-keygen",
        tableType: tableType.view,
        commandType: "rpc",
        viewClass: require("./security/securityView").sshKeyGenView,
    },
    "ssh": {
        title: getText("ssh"),
        viewClass: require("./security/securityView").sshView,
    },
    "get-log": {
        tableType: tableType.view,
        title: getText("log"),
        commandType: "rpc",
        viewClass: require("./system/logTools").LogToolView,
    },
    "script-list": {
        tableType: tableType.view,
        commandType: "rpc",
        viewClass: require("./system/script").scriptView,
    },
    "file-operation": {
        tableType: tableType.view,
        commandType: "rpc",
        viewClass: require("./system/file_operation").fileOperationView,
    },
    "key-replacement-package":{
        formatColumns: {
            "install-status": function (configKey, tableHashCode) {
                let requestKey = {
                    "if-name": ""
                }
                return upDownFormatter4ReactTable(configKey, requestKey, tableHashCode);
            }
        },
        viewClass: require("./security/securityView").krpView,
    },
    "fdr": {
        buttons: {
            globalButtons: {
                "create": {
                    enabled: false
                }
            },
            rowButtons: {
                "delete": {
                    enabled: false
                }
            }
        },
    },
    "http-file-server": {
        title: getText("httpfileserver"),
        buttons: {
            globalButtons: {
                "create": {
                    enabled: false
                }
            },
            rowButtons: {
                "delete": {
                    enabled: false
                }
            }
        },
    },
    "dial-out-server": {
        title: getText("dial-out-server"),
        viewClass: require("./network/protocol").protocolView,
    },
    // "tl1": {
    //     buttons: {
    //         globalButtons: {
    //             "create": {
    //                 enabled: false
    //             }
    //         },
    //         rowButtons: {
    //             "delete": {
    //                 enabled: false
    //             }
    //         }
    //     },
    // },
    "tools": {
        tableType: tableType.view,
        title: getText("tool"),
        commandType: "rpc",
        viewClass: require("./network/rpcPing").rpcPingView,
    },
    // "swupgrade" : {
    //     title : "SW Upgrade",
    //     tableType : tableType.view,
    //     commandType : "rpc",
    //     viewClass : require("./system/rpcSoftware").rpcSwView,
    // },
    "manifest": {
        title: getText("manifest"),
        viewClass: require("./system/manifest").manifestView,
    },
    "database": {
        title: getText("database"),
        viewClass: require("./system/database").databaseView,
    },
    "cer-download": {
        title: getText("download-certificate"),
        // tableType : tableType.view,
        // commandType : "rpc",
        viewClass: require("./security/securityView").cerDownloadView,
    },
    "peer-certificate": {
        title: getText("peer-certificate"),
        // tableType : tableType.view,
        // commandType : "rpc",
        viewClass: require("./security/securityView").peerCerDownloadView,
    },
    "local-certificate": {
        title: getText("local-certificate"),
        viewClass: require("./security/securityView").localCerView,
    },
    "trusted-certificate": {
        title: getText("trusted-certificate"),
        viewClass: require("./security/securityView").trustedCerView,
    },
    "filter-alarm": {
        title: "alarm",
        extendsType: "alarm",
        columnSort: ["resource", "resource-type", "alarm-type", "alarm-type-description", "direction", "location", "perceived-severity", "reported-time", "service-affecting", "alarm-category", "operator-state", "AID"],
        exclude: ["eventTime", "alarm-id", "corrective-action", "operator-text", "operator-name", "operator-last-action", "additional-details"],
        buttons: {
            noButtons: false,
            headButtons: false,
            globalButtons: {
                "create": {
                    enabled: false
                }
            },
            rowButtons: {
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
                "relate": {
                    enabled: false
                }
            }
        },
        defaultTableFilter: {
            "perceived-severity": {
                value: ["critical", "major", "minor", "warning"],
                type: DataTypeEnum.MultiMatch
            }
        },
        viewClass: require("./fault/filter_alarm").filterAlarmView,
    },
    "filter-event": {
        buttons: {
            noButtons: false,
            headButtons: false,
            globalButtons: {
                "create": {
                    enabled: false
                }
            },
            rowButtons: {
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                }
            }
        },
        tableType: tableType.view,
        viewClass: require("./fault/event").eventView,
    },
    "filter-service": {
        title: "service",
        extendsType: "xcon",
        exclude: ["payload-type-filter","card"],
        columnSort: ["name", "AID", "label", "source", "destination", "direction", "time-slots", "payload-type", "network-mapping", "type"],
        // relateTableColumns: ["name", "AID", "label", "source", "destination", "direction", "time-slots", "payload-type", "network-mapping"],
        viewClass: require("./service/filter_service").filterServiceView,
    },
    "fault_event": {
        tableType: tableType.view,
        viewClass: require("./fault/event").eventView,
    },
    "alarm-control": {
        title: getText("alarm-control"),
    },
    "alarm-severity-entry": {
        title: getText("alarm-severity-profile"),
        formatColumns: {
            "severity": function (configKey, tableHashCode) {
                return severityFormatter4ReactTable(configKey, tableHashCode);
            }
        },
        viewClass: require("./fault/alarm_profile").alarmProfileView,
        columnSort: ["resource-type", "alarm-type", "direction", "location", "severity", "service-affecting"],
    },

    "alarm": {
        title: getText("current-alarm"),
        propsFromStore: "alarmPool",
        buttons: {
            globalButtons: {
                "create": {
                    enabled: false,
                }
            },
            rowButtons: {
                "delete": {
                    enabled: false
                },
                "edit": {
                    enabled: false

                },
                "details": {
                    enabled: false,
                },
                "relate": {
                    enabled: false,
                }
            }
        },
        formatColumns: {
            "perceived-severity": function (configKey, tableHashCode) {
                return severityFormatter4ReactTable(configKey, tableHashCode);
            }
        },
        columnSort: ["resource", "resource-type", "AID", "alarm-type", "alarm-type-description", "alarm-category", "perceived-severity", "location", "direction", "reported-time", "service-affecting", "operator-state"],
        exclude: ["eventTime", "alarm-id", "corrective-action", "operator-text", "operator-name", "operator-last-action", "additional-details"],
        filterConfig: {
            "resource": {control_Type: TableFilterTypeEnum.MultiSelect},
            "alarm-type": {control_Type: TableFilterTypeEnum.MultiSelect},
            "location": {control_Type: TableFilterTypeEnum.MultiSelect},
            "direction": {control_Type: TableFilterTypeEnum.MultiSelect},
            "service-affecting": {control_Type: TableFilterTypeEnum.MultiSelect},
            "perceived-severity": {
                control_Type: TableFilterTypeEnum.MultiSelect
            },
            "operator-state": {control_Type: TableFilterTypeEnum.MultiSelect},
            "reported-time": {
                control_Type: TableFilterTypeEnum.TextInput,
                data_Type: DataTypeEnum.Fuzzy,
                data_Fun: function (_d) {
                    return _d.substring(0, 10);
                }
            },
            "alarm-type-description": {control_Type: TableFilterTypeEnum.MultiSelect},
            "resource-type": {control_Type: TableFilterTypeEnum.MultiSelect}
        },
        defaultTableFilter: {
            "perceived-severity": {
                value: ["critical", "major", "minor", "warning"],
                type: DataTypeEnum.MultiMatch
            }
        },
        tableType: tableType.pageTable,
        viewClass: require("./fault/alarm").alarmView,
    },
    "history-alarm": {
        title: getText("history-alarm"),
        extendsType: "alarm",
        propsFromStore: "alarmHistory",
        buttons: {
            globalButtons: {
                "create": {
                    enabled: false,
                }
            },
            rowButtons: {
                "delete": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "relate": {
                    enabled: false
                }
            }
        },
        initConfig: {
            "operator-state": {
                show: false
            }
        },
        tableType: tableType.pageTable,
        columnSort: ["resource", "resource-type", "alarm-type", "alarm-type-description", "alarm-category", "perceived-severity", "location", "direction", "eventTime", "reported-time", "service-affecting"],
        exclude: ["AID", "alarm-id", "corrective-action", "operator-text", "operator-name", "operator-last-action", "additional-details", "operator-state"],
        viewClass: require("./fault/alarm_history").alarmHistoryView
    },
    "tca": {
        title: getText("tca"),
        extendsType: "alarm",
        propsFromStore: "tcaPool",
        buttons: {
            globalButtons: {
                "create": {
                    enabled: false,
                }
            },
            rowButtons: {
                "delete": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "relate": {
                    enabled: false
                }
            }
        },
        initConfig: {
            "operator-state": {
                show: false
            }
        },
        tableType: tableType.pageTable,
        columnSort: ["resource", "resource-type", "alarm-type", "alarm-type-description", "alarm-category", "perceived-severity", "location", "direction", "eventTime", "reported-time", "service-affecting"],
        exclude: ["AID", "alarm-id", "corrective-action", "operator-text", "operator-name", "operator-last-action", "additional-details", "operator-state"],
        viewClass: require("./fault/alarm_history").alarmHistoryView
    },
    "alarm-log": {
        title: "alarm-log",
        extendsType: "alarm",
        exclude: ["operator-state", "AID", "alarm-id", "corrective-action", "operator-text", "operator-name", "operator-last-action", "additional-details"],
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false,
                },
                "relate": {
                    enabled: false,
                },
                "refresh": {
                    enabled: false
                }
            }
        },
        tableType: tableType.pageTable
    },
    "event-log": {
        title: "event-log",
        extendsType: "event",
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false,
                },
                "relate": {
                    enabled: false,
                },
                "delete": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                }
            }
        },
        tableType: tableType.userdefine,
        tableConfig: function (hashcodeStr) {
            return {
                tableHead: {
                    type: {
                        label: getText("type")
                    },
                    entity: {
                        label: getText("entity")
                    },
                    "time-stamp": {
                        label: getText("time")
                    },
                    "user-name": {
                        label: getText("user-name")
                    },
                    attributes: {
                        label: getText("details")
                    }
                },
                reloadBtn: {
                    enabled: false
                }
            }
        }
    },
    "cli-log": {
        title: "cli-log",
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false,
                },
                "relate": {
                    enabled: false,
                },
                "delete": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                }
            }
        },
        tableType: tableType.userdefine,
        tableConfig: function (hashcodeStr) {
            return {
                tableHead: {
                    time: {
                        label: getText("time"),
                        width: 200
                    },
                    user: {
                        label: getText("user"),
                        width: 80
                    },
                    ip: {
                        label: getText("ip"),
                        width: 120
                    },
                    command: {
                        label: getText("command")
                    }
                },
                reloadBtn: {
                    enabled: false
                }
            }
        }
    },
    "configuration-log": {
        title: "configuration-log",
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false,
                },
                "relate": {
                    enabled: false,
                },
                "delete": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                }
            }
        },
        tableType: tableType.userdefine,
        tableConfig: function (hashcodeStr) {
            return {
                tableHead: {
                    type: {
                        label: getText("type")
                    },
                    entity: {
                        label: getText("entity")
                    },
                    "session-id": {
                        label: getText("session-id")
                    },
                    "user-name": {
                        label: getText("user-name")
                    },
                    "time-stamp": {
                        label: getText("time-stamp")
                    },
                    result: {
                        label: getText("result")
                    },
                    duration: {
                        label: getText("duration")
                    },
                    nbi: {
                        label: getText("nbi")
                    },
                    attributes: {
                        label: getText("attributes")
                    }
                },
                reloadBtn: {
                    enabled: false
                }
            }
        }
    },
    "get-carriers": {
        title: "carriers",
        extendsType: "optical-carrier",
        viewClass: require("./configuration/carrier").carrierView,
    },
    "lldp-neighbor": {
        viewClass: require("./topology/lldp").lldpNeighborView,
        columnSort: ["lldp-port", "direction"]
    },
    "lldp-port-statistics": {
        viewClass: require("./topology/lldp").portStaticsView,
        columnSort: ["lldp-port", "direction"]
    },
    "carrier-neighbor": {
        viewClass: require("./topology/lldp").carrierNeighborView,
    },
    "dashboard": {
        tableType: tableType.view,
        viewClass: require("./dashboard/dashboard").ReactThanOSDashboard,
    },
    "report": {
        title: getText("report"),
        tableType: tableType.view,
        viewClass: require("./system/report").exportReportView,
    },
    "filter-facilities": {
        include: ["type", "name", "AID", "label", "admin-state", "oper-state", "avail-state"],
        extendsType: "optical-channel",
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./configuration/filter_facilities").filterFacilitiesView,
    },
    "all-facilities": {
        include: ["type", "name", "AID", "label", "admin-state", "oper-state", "avail-state", "supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"],
        extendsType: "all-facilities",
        tableType: tableType.pageTable,
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./configuration/all_facilities").allFacilitiesView,
    },
    "all-equipments": {
        include: ["type", "name", "AID", "admin-state", "oper-state", "avail-state","supported-type","alarm-report-control" ],
        extendsType: "all-equipments",
        tableType: tableType.pageTable,
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./configuration/all_equipments").allEquipmentsView,
    },
    "all-software-loads": {
        title: "SW Load",
        extendsType: "sw-management.software-load",
        include: ["sw-load", "swload-label", "swload-state", "swload-version", "swload-information", "swload-vendor", "swload-product", "swload-status"],
        formatColumns: {
            "swload-prepared": function (configKey, tableHashCode) {
                return upDownFormatter4ReactTable(tableHashCode);
            }
        },
        viewClass: require("./system/all_swload").allSWView,
    },
    "filter-equipment": {
        include: ["type", "name", "AID", "alias-name", "label", "admin-state", "oper-state", "avail-state"],
        extendsType: "port",
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./configuration/filter_equipment").filterEquipmentView,
    },
    "port-alarm": {
        extendsType: "alarm"
    },
    "common-alarm": {
        extendsType: "alarm"
    },
    "filter-real-time-pm": {
        extendsType: "real-time-pm",
        additionColumn: ["bin", "monitoring-date-time", "validity"],
        columnSort: ["resource", "parameter", "resource-type", "AID", "bin", "monitoring-date-time", "pm-value", "pm-value-min", "pm-value-max", "pm-value-avg", "validity", "pm-unit"],
        viewClass: require("./perfmon/filterPM").filterPMView,
    },
    "filter-current-pm": {
        extendsType: "current-pm",
        additionColumn: ["bin"],
        columnSort: ["resource", "parameter", "period", "resource-type", "AID", "bin", "monitoring-date-time", "pm-value","pm-value-min", "pm-value-max", "pm-value-avg", "validity", "pm-unit"],
        viewClass: require("./perfmon/filterPM").filterPMView,
    },
    "filter-history-pm-15min": {
        extendsType: "history-pm",
        columnSort: ["resource", "parameter", "period", "resource-type", "AID", "bin", "monitoring-date-time",  "pm-value","pm-value-min", "pm-value-max", "pm-value-avg", "validity", "pm-unit"],
        viewClass: require("./perfmon/filterPM").filterPMView,
        initRequestFilter: {
            "history-pm": {
                "period": "pm-15min"
            }
        }
    },
    "filter-history-pm-24h": {
        extendsType: "history-pm",
        columnSort: ["resource", "parameter", "period", "resource-type", "AID", "bin", "monitoring-date-time", "pm-value", "pm-value-min", "pm-value-max", "pm-value-avg", "validity", "pm-unit"],
        viewClass: require("./perfmon/filterPM").filterPMView,
        initRequestFilter: {
            "history-pm": {
                "period": "pm-24h"
            }
        }
    },
    "filter-object-alarm": {
        extendsType: "alarm",
        viewClass: require("./fault/filter_object_alarm").filterObjectAlarmView,
    },
    "topo": {
        tableType: tableType.view,
        viewClass: require("./service/serviceView").serviceView,
    },
    "pm-control-entry-report": {
        extendsType: "pm-control-entry",
        columnSort: ["resource"],
        exportPath: ["pm-resource", "pm-control-entry"],
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./system/all_object_report").allObjectReportView,
    },
    "pm-threshold-profile-report": {
        extendsType: "pm-threshold-profile",
        columnSort: ["resource-type", "period", "location", "direction"],
        exclude: ["units"],
        exportPath: ["pm-profile-entry", "pm-threshold-profile"],
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./system/all_object_report").allObjectReportView,
    },
    "application-description": {
        title: "application-description-table"
    },
    "pm-control-entry": {
        exportName: ["resource-type", "AID"]
    },
    "management-address-report": {
        extendsType: "management-address",
        columnSort: ["lldp-port"],
        exportPath: ["lldp-neighbor", "management-address"],
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./system/all_object_report").allObjectReportView,
    },
    "custom-tlv-report": {
        extendsType: "custom-tlv",
        columnSort: ["lldp-port"],
        exportPath: ["lldp-neighbor", "custom-tlv"],
        buttons: {
            rowButtons: {
                "details": {
                    enabled: false
                },
                "edit": {
                    enabled: false
                },
                "delete": {
                    enabled: false
                },
            }
        },
        viewClass: require("./system/all_object_report").allObjectReportView,
    },
    "filter-slot": {
        extendsType: "slot",
        viewClass: require("./configuration/filterAddPON").filterAddPONView,
    },
    "filter-port": {
        extendsType: "port",
        viewClass: require("./configuration/filterAddPON").filterAddPONView,
    },
    "supported-port": {
        buttons: {
            rowButtons: {
                "relate": {
                    enabled: true
                }
            }
        },
    },
    "ethzr-server" : {
        extendsType : "ethernet",
        title : getText('ethzr-server'),
        buttons: {
            rowButtons: {
                "default": {
                    enabled: false
                }
            }
        },
        viewClass: require("./service/ethzr_server").ethzrServerView,
    },
    "filter-ethzr-server" : {
        extendsType : "ethernet",
        title : getText('ethzr-server'),
        buttons: {
            rowButtons: {
                "default": {
                    enabled: false
                }
            }
        },
        viewClass: require("./service/filter_ethzr_server").filterEthzrServerView,
    },
    "security-policy-database" : {
        buttons: {
            globalButtons: {
                "create": {
                    enabled: false
                }
            },
            rowButtons: {
                "delete": {
                    enabled: false
                },
                "relate": {
                    enabled: true
                }
            }
        },
    }
}

export default TABLECONFIG;
export {tableType};
