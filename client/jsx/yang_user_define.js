import {
    checkParameterUserClass,
    convertToArray,
    deepClone,
    enumFormControlType,
    extendCustomConfig,
    getChildrenList,
    getEntityPathByKey,
    getKeyFromResource,
    getText,
    isEmpty,
    isEmptyObj,
    isNullOrUndefined,
    parseColonValues,
    parseListValues,
    PLEASE_SELECT_VALUE,
    removeNS,
    requestData,
    requestDataQueue,
    checkPpcParameterUserClass,
    resource2KeyName, flexoiid,USER_CLASS_TYPE
} from "./custom/utils";
import {getRpcConfig, getYangConfig} from "./yangMapping";

const FormControlTypeEnum = enumFormControlType;

const Entity_RelatedFacility = ["card", "resources", "port", "xcon", "tom"];
const Entity_RelatedService = ["ne", "chassis", "card", "resources", "port", "tom"];

const YangTools = {
    "odu_diag_prbs_allowed" : function(data,config) {
        if( config["direction"]["conditionData"]["port"]["port-type"] === "tributary" ) {
            if( config["direction"]["conditionData"]["card"]["required-type"] === "gx:UCM4"
                && config["direction"]["conditionData"]["odu"]["supporting-facilities"].indexOf("otu") > -1 ) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    },
    "tti_allowed" : function(data,config) {
        if( config["direction"]["conditionData"] != null  ) {
            if( config["direction"]["conditionData"]["odu"]["class"] === 'low-order'
                || config["direction"]["conditionData"]["odu"]["supporting-facilities"].indexOf("otu") > -1 ) {
                if( ['limited-non-intrusive', 'non-intrusive'].indexOf(data["monitoring-mode"]) > -1 ) {
                    return false;
                }
                    // else if( $odu-switching-service ){   //todo
                    //     return false;
                // }
                else {
                    return true;
                }
            } else {
                return true;
            }
        } else {
            return true
        }
    },
    "odu4_spec_req_allowed" : function(data,config) {
        if( config["direction"]["conditionData"] != null  ) {
            if( config["direction"]["conditionData"]["card"]["required-type"] === "gx:CHM6" && config["direction"]["conditionData"]["odu"]["odu-type"] === "ODU4") {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },
    resourceInitConfigG40 : function (data, callback) {
        const _config = {
            enumValue: []
        };
        requestData([
            {
                from: "odu",
            },
            {
                from: "ethernet",
            },
            {
                from: "otu",
                where: {
                    "otu": {
                        "otu-type": "OTU4",
                        "otu-name": "OTU4"
                    }
                }
            },
            {
                from: "xcon",
            },

        ], function (_rs) {
            const enumList = [];
            if (_rs.hasOwnProperty("odu")) {
                const data = convertToArray(_rs.odu);
                for (let i = 0; i < data.length; i++) {
                    if (data[i].class === "low-order" || ((data[i].class === "high-order" || data[i].class === "mapped" )
                        && (data[i]["odu-type"] === "ODU4" || data[i]["odu-type"] === "ODU2" || data[i]["odu-type"] === "ODU2e"))) {
                        // if (EnvironmentConfig.supportODUType[sessionStorage.neType].indexOf(data[i]["odu-type"]) > -1) {
                            enumList.push({
                                label: "odu-" + data[i].name + " (" + parseFloat(data[i].rate) + "G)",
                                value: getEntityPathByKey("odu", {
                                    "odu": {
                                        name: data[i].name
                                    }
                                }),
                                rate: parseFloat(data[i].rate) + "GBE",
                                card: data[i]["supporting-card"],
                                type: "odu",
                                class: data[i].class,
                                oduType : data[i]["odu-type"],
                                filter : data[i].class === "low-order" ? (data[i]["odu-type"] === "ODU4i" ? [parseFloat(data[i].rate) + "GBE" , parseFloat(data[i].rate) + "G", "OTU4"] : [parseFloat(data[i].rate) + "GBE" , parseFloat(data[i].rate) + "G"]) : [parseFloat(data[i].rate) + "G"],
                            })
                        // }
                    }
                }
            }
            if (_rs.hasOwnProperty("ethernet")) {
                const data = convertToArray(_rs.ethernet);
                for (let i = 0; i < data.length; i++) {
                    enumList.push({
                        label: "ethernet-" + data[i].name + " (" + parseFloat(data[i].speed) + "G)",
                        value: getEntityPathByKey("ethernet", {
                            "ethernet": {
                                name: data[i].name
                            }
                        }),
                        rate: parseFloat(data[i].speed) + "GBE",
                        card: data[i]["supporting-card"],
                        type: "ethernet",
                        filter: [parseFloat(data[i].speed) + "GBE"]
                    })
                }
            }
            if (_rs.hasOwnProperty("otu")) {
                const data = convertToArray(_rs.otu);
                for (let i = 0; i < data.length; i++) {
                    enumList.push({
                        label: "otu-" + data[i].name + " (" + parseFloat(data[i].rate) + "G)",
                        value: getEntityPathByKey("otu", {
                            "otu": {
                                name: data[i].name
                            }
                        }),
                        rate: parseFloat(data[i].rate) + "GBE",
                        card: data[i]["supporting-card"],
                        type: "otu",
                        filter : ["OTU4"]
                    })
                }
            }
            //filter the used port
            if (_rs.hasOwnProperty("xcon")){
                const data = convertToArray(_rs.xcon);
                for (let i = 0; i < data.length; i++) {
                    let sourcePort = resource2KeyName(data[i]["source"]);
                    let index = enumList.findIndex( item => resource2KeyName(item.value)=== sourcePort);
                    enumList.splice(index,1);
                    let destinationPort = resource2KeyName(data[i]["destination"]);
                    index = enumList.findIndex( item => resource2KeyName(item.value)=== destinationPort);
                    enumList.splice(index,1);
                }
            }
                callback({
                enumValue: enumList
            })
        })
        return _config
    },
    resourceInitConfigG30: function (data, callback) {
        const _config = {
            enumValue: []
        };
        requestData([
            {
                from: "odu",
            },
            {
                from: "otu",
                where: {
                    "otu": {
                        "otu-type": "OTU4",
                        "otu-name": "OTU4"
                    }
                }
            },
            {
                from: "xcon"
            }
        ], function (_rs) {
            const enumList = [];
            if (_rs.hasOwnProperty("odu")) {
                const data = convertToArray(_rs.odu);
                for (let i = 0; i < data.length; i++) {
                    if( data[i]["class"] === "low-order" || data[i]["class"] === "mapped" ) {
                        enumList.push({
                            label: "odu-" + data[i].name + " (" + parseFloat(data[i].rate) + "G)",
                            value: getEntityPathByKey("odu", {
                                "odu": {
                                    name: data[i].name
                                }
                            }),
                            rate: parseFloat(data[i].rate) + "GBE",
                            card: data[i]["supporting-card"],
                            type: "odu",
                            class: data[i].class,
                            oduType : data[i]["odu-type"],
                            filter: [parseFloat(data[i].rate) + "GBE"]
                        })
                    }
                }
            }
            if (_rs.hasOwnProperty("otu")) {
                const data = convertToArray(_rs.otu);
                for (let i = 0; i < data.length; i++) {
                    enumList.push({
                        label: "otu-" + data[i].name + " (" + parseFloat(data[i].rate) + "G)",
                        value: getEntityPathByKey("otu", {
                            "otu": {
                                name: data[i].name
                            }
                        }),
                        rate: parseFloat(data[i].rate) + "GBE",
                        card: data[i]["supporting-card"],
                        type: "otu",
                        filter : ["OTU4"]
                    })
                }
            }
            //filter the used port
            if (_rs.hasOwnProperty("xcon")){
                const data = convertToArray(_rs.xcon);
                for (let i = 0; i < data.length; i++) {
                    let sourcePort = resource2KeyName(data[i]["source"]);
                    let index = enumList.findIndex( item => resource2KeyName(item.value)=== sourcePort);
                    enumList.splice(index,1);
                    let destinationPort = resource2KeyName(data[i]["destination"]);
                    index = enumList.findIndex( item => resource2KeyName(item.value)=== destinationPort);
                    enumList.splice(index,1);
                }
            }
            callback({
                enumValue: enumList
            })
        })
        return _config
    }
}

const YangExpand = {
    "G30": {
        xcon: {
            "source": {
                afterUpdateFilter: function (data, filterEnum, type) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].value === data[type]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                },
                createInitConfig: YangTools.resourceInitConfigG30
            },
            "destination": {
                afterUpdateFilter: function (data, filterEnum, type) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].value === data[type]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                },
                createInitConfig: YangTools.resourceInitConfigG30
            }
        },
        "line-ptp": {
            "service-type": {
                editInitConfig: function (data, callback) {
                    let serverTypeList = [];
                    if( ['DP-16QAM-200G','DP-QPSK-100G','DP-8QAM-200G'].indexOf(data["service-type"]) > -1 ) {
                        serverTypeList = ['DP-16QAM-200G','DP-QPSK-100G','DP-8QAM-200G'];
                    } else if( ['OTU2','OTU2e'].indexOf(data["service-type"]) > -1 )  {
                        serverTypeList = ['OTU2','OTU2e'];
                    } else if( data["service-type"] === 'not-applicable' ) {
                        if (data["supporting-port"] === "1" || data["supporting-port"] === "2") {
                            serverTypeList = ['DP-16QAM-200G', 'DP-QPSK-100G', 'DP-8QAM-200G'];
                        } else {
                            serverTypeList = ['OTU2', 'OTU2e']
                        }
                    }
                    if( serverTypeList.length > 0 ) {
                        let enumList = [];
                        if(serverTypeList.indexOf(data["service-type"]) < 0 ) {
                            serverTypeList.push(data["service-type"])
                        }
                        serverTypeList.forEach(item=>{
                            enumList.push( {
                                label: item,
                                value: item
                            })
                        })
                        callback({
                            enumValue : enumList
                        })
                    } else {
                        callback();
                    }
                }
            }
        },
        "optical-carrier" : {
            "tx-power" : {
                requestInitConfig: function (data, callback) {
                    requestData({
                        select : ["required-type"],
                        from : "card",
                        where : {
                            card : {
                                name : data["supporting-card"]
                            }
                        }
                    },function (rs) {
                        callback({
                            "conditionData" : {
                                "card-type" :rs["card"][0]["required-type"]
                            }
                        })
                    })
                },
                afterUpdate: function (data, config) {
                    if( config["conditionData"] != null && config["conditionData"]["card-type"] != null ) {
                        let max = null;
                        let min = null;
                        if( config["conditionData"]["card-type"] === "gx:CHM1R" ) {
                            min = -10;
                            max = 1;
                        } else if( config["conditionData"]["card-type"] === "gx:UTM2" ) {
                            min = -15;
                            max = 0;
                        }
                        if( max != null && min != null ) {
                            return {
                                placeholder: getText("range") + ": " + min + ".." + max,
                                validators: {
                                    "between": {
                                        min: min.toString(),
                                        max: max.toString(),
                                        message: function () {
                                            return getText("error.config.between").format(getText("trib-port-number"), min, max)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "trib-ptp": {
            "service-type": {
                afterUpdate: function (data, config) {
                    return deepClone(config.enumValue);
                },
                editInitConfig: function (data, callback) {
                    let serverType = data["service-type"];
                    if (serverType == "not-applicable") {
                        requestData({
                            select: ["required-type"],
                            from: "tom",
                            where: {
                                tom: {
                                    AID: data.AID.replace(/[a-zA-Z]+/g, "")
                                }
                            }
                        }, function (rs) {
                            if( rs.tom != null && rs["tom"].length > 0 ) {
                                let serverTypeList = [];
                                let tomType = rs.tom[0]["required-type"]
                                if (tomType === "gx:QSFP28") {
                                    serverTypeList = ["100GBE", "OTU4"];
                                } else if (tomType === "gx:QSFPDD") {
                                    serverTypeList = ["400GBE"];
                                } else if (tomType === "gx:SFPPLUS" || tomType === 'gx:QSFPPLUS') {
                                    serverTypeList = ['10GBE', 'STM64', 'OC192', 'OTU2', 'OTU2e'];
                                } else if (tomType === "gx:SFP") {
                                    serverTypeList = ['1GBE','STM16','OC48'];
                                }
                                if( serverTypeList.length > 0 ) {
                                    let enumList = [];
                                    if(serverTypeList.indexOf(data["service-type"]) < 0 ) {
                                        serverTypeList.push(data["service-type"])
                                    }
                                    serverTypeList.forEach(item => {
                                        enumList.push({
                                            label: item,
                                            value: item
                                        })
                                    })
                                    callback({
                                        enumValue: enumList
                                    })
                                } else {
                                    callback();
                                }
                            }
                        })
                    } else {
                        let serverTypeList = [];
                        if (["100GBE", "OTU4"].indexOf(serverType) > -1) {
                            serverTypeList = ["100GBE", "OTU4"];
                        } else if (serverType === "400GBE") {
                            serverTypeList = ["400GBE"]
                        } else if( ['10GBE','STM64','OC192','OTU2','OTU2e'].indexOf(serverType) > -1) {
                            serverTypeList = ['10GBE','STM64','OC192','OTU2','OTU2e'];
                        } else if( ['1GBE','STM16','OC48'].indexOf(serverType) > -1) {
                            serverTypeList = ['1GBE','STM16','OC48'];
                        }

                        if( serverTypeList.length > 0 ) {
                            let enumList = [];
                            if(serverTypeList.indexOf(data["service-type"]) < 0 ) {
                                serverTypeList.push(data["service-type"])
                            }
                            serverTypeList.forEach(item=>{
                                enumList.push( {
                                    label: item,
                                    value: item
                                })
                            })
                            callback({
                                enumValue : enumList
                            })
                        } else {
                            callback();
                        }
                     }
                }
            },
            "tributary-disable-action": {
                afterUpdate: function (data, config) {
                    if (config.enumValue == null) {
                        return [];
                    }
                    let filterEnum = deepClone(config.enumValue);
                    if (data["service-type"] === "100GBE" || data["service-type"] === "400GBE") {
                        return [
                            {
                                label: "laser-shut-off",
                                value: "laser-shut-off"
                            },
                            {
                                label: "send-idles",
                                value: "send-idles"
                            },
                            {
                                label: "send-lf",
                                value: "send-lf"
                            }
                        ]
                    } else if (data["service-type"] === "OTU4") {
                        if (config.conditionData != null && config.conditionData["service-mode"] != null) {
                            if (config.conditionData["service-mode"] === "transport") {
                                return [
                                    {
                                        label: "laser-shut-off",
                                        value: "laser-shut-off"
                                    },
                                    {
                                        label: "none",
                                        value: "none"
                                    }
                                ]
                            } else if (config.conditionData["service-mode"] === "adaptation") {
                                return [
                                    {
                                        label: "laser-shut-off",
                                        value: "laser-shut-off"
                                    },
                                    {
                                        label: "odu-ais",
                                        value: "odu-ais"
                                    },
                                    {
                                        label: "none",
                                        value: "none"
                                    }
                                ]
                            }
                        } else {
                            return filterEnum
                        }
                    } else {
                        return filterEnum
                    }
                },
                editInitConfig: function (data, callback) {
                    if (data["service-type"] === "OTU4") {
                        requestData({
                            from: "otu",
                            where: {
                                "otu": {
                                    name: data.name
                                }
                            }
                        }, function (rs) {
                            if (rs.otu != null && rs.otu.length > 0) {
                                callback(
                                    {
                                        conditionData: {
                                            "service-mode": rs.otu[0]["service-mode"]
                                        }
                                    }
                                )
                            }
                            callback();
                        })
                    }
                    callback();
                }
            },
        },
        "card": {
            "console": {
                extendConfig: {
                    editShow: function (data) {
                        return data != null && (parseColonValues(data["required-type"]) === "FRCU31");
                    }
                }
            },
            // "property": {
            //     fix: true,
            //     type: "list",
            //     show: false,
            //     extendConfig: {
            //         relateShow: function (data) {
            //             return true
            //         }
            //     }
            // },
        },
        "ethernet": {
            "lldp-egress-mode": {
                "when": "",
                "initwhen": function (data) {
                   return sessionStorage.neType != "G30";
                }

            },
            "tx-mapping-mode": {
                editInitConfig: function (data, callback) {
                      requestData({
                          select : ["required-type"],
                          from : "card",
                          where : {
                              card : {
                                  name : data["supporting-card"]
                              }
                          }
                      },function (rs) {
                          callback({
                              "conditionData" : rs["card"][0]["required-type"]
                          })
                      })
                },
                afterUpdate : function (data,config) {
                    if (config.enumValue == null) {
                        return [];
                    }
                    let filterEnum = deepClone(config.enumValue);
                    if( data.speed === "100.000" ) {
                        for (let i = filterEnum.length - 1; i >= 0; i--) {
                            if (['GMP','GFP-F', 'openZR+'].indexOf(filterEnum[i].value) < 0) {
                                filterEnum.splice(i, 1)
                            }
                        }
                    } else if( data.speed === "400.000" ) {
                        for (let i = filterEnum.length - 1; i >= 0; i--) {
                            if (['BMP', 'openZR+'].indexOf(filterEnum[i].value) < 0) {
                                filterEnum.splice(i, 1)
                            }
                        }
                    } else if( data.speed === "10.000" ) {
                        for (let i = filterEnum.length - 1; i >= 0; i--) {
                            if (['BMP', 'GFP-F','GFP-F-extOPU2'].indexOf(filterEnum[i].value) < 0) {
                                filterEnum.splice(i, 1)
                            }
                        }
                    }  else if( data.speed === "1.000" ) {
                        for (let i = filterEnum.length - 1; i >= 0; i--) {
                            if ( filterEnum[i].value === "GMP") {
                                filterEnum.splice(i, 1)
                            }
                        }
                    }
                    if( config.conditionData === "gx:CHM1R" ) {
                        for (let i = filterEnum.length - 1; i >= 0; i--) {
                            if (filterEnum[i].value === "GFP-F") {
                                filterEnum.splice(i, 1)
                            }
                        }
                    }
                    return filterEnum
                }
            }
         },
        "odu": {
            "odu-type" : {
                createInitConfig: function (data, callback) {
                    let type = ["ODU4","ODUflex"];
                    let enumList = [];
                    type.forEach(item => {
                        enumList.push({
                            label: item,
                            value: item
                        })
                    })
                    callback({
                        enumValue: enumList
                    })
                }
            },
            "rx-payload-type": {
                when : "",
                initwhen : function(data,config) {
                    return data["class"] === "high-order" ||
                        (data["supporting-facilities"] != null &&
                            data["supporting-facilities"].indexOf("otu") < 0 &&
                            config["delay-measurement-enable"].condition != null &&
                            config["delay-measurement-enable"].condition["port-type"] === "tributary" )
                },
            },
            "delay-measurement-enable" : {
                requestInitConfig: function (data, callback) {
                    requestData({
                        select : ["port-type"],
                        from : "port",
                        where : {
                            port : {
                                name : data["supporting-port"]
                            }
                        }
                    },function (rs) {
                        callback({
                            "conditionData" : {
                                "port-type" :rs["port"][0]["port-type"]
                            }
                        })
                    })
                },
                "when": "",
                "initwhen": function (data,config) {
                    return !(data["supporting-facilities"] != null && data["supporting-facilities"].indexOf("otu") > -1
                        && config["delay-measurement-enable"]["conditionData"] != null
                        && config["delay-measurement-enable"]["conditionData"]["port-type"] === "tributary")
                        && data["class"] != "low-order"
                }
            },

            "tx-payload-type": {
                default: "",
                type: FormControlTypeEnum.TextSelect,
                when : "",
                initwhen : function(data,config) {
                    return data["class"] === "high-order" ||
                        (data["supporting-facilities"] != null &&
                            data["supporting-facilities"].indexOf("otu") < 0 &&
                            config["delay-measurement-enable"].condition != null &&
                            config["delay-measurement-enable"].condition["port-type"] === "tributary" )
                },
                afterUpdate: function (data, config) {
                    if (config.enumValue == null) {
                        return [];
                    }
                    let filterEnum = deepClone(config.enumValue);
                    let filterValue = null;
                    if (data["odu-type"] === "ODUCn") {
                        filterValue = "0x22"
                    } else if( data["odu-type"] === "ODUflex" ) {
                        filterValue = "0x32"
                    }
                    if( filterValue != null ) {
                        for (let i = filterEnum.length - 1; i >= 0; i--) {
                            if (filterEnum[i].value != filterValue) {
                                filterEnum.splice(i, 1)
                            }
                        }
                    }
                    return filterEnum;
                },
                enumValue: [
                    {
                        label : "0x07",
                        value : "0x07"
                    },
                    {
                        label : "0x22",
                        value : "0x22"
                    },{
                        label : "0x32",
                        value : "0x32"
                    }
                ]
            },
            "expected-payload-type": {
                defaultValue: "",
                type: FormControlTypeEnum.TextSelect,
                when : "",
                initwhen : function(data,config) {
                    return data["class"] === "high-order" ||
                        (data["supporting-facilities"] != null &&
                            data["supporting-facilities"].indexOf("otu") < 0 &&
                            config["delay-measurement-enable"].condition != null &&
                            config["delay-measurement-enable"].condition["port-type"] === "tributary" )
                },
                afterUpdate: function (data, config) {
                    if (config.enumValue == null) {
                        return [];
                    }
                    let filterEnum = deepClone(config.enumValue);
                    let filterValue = null;
                    if (data["odu-type"] === "ODUCn") {
                        filterValue = "0x22"
                    } else if( data["odu-type"] === "ODUflex" ) {
                        filterValue = "0x32"
                    }
                    if( filterValue != null ) {
                        for (let i = filterEnum.length - 1; i >= 0; i--) {
                            if (filterEnum[i].value != filterValue) {
                                filterEnum.splice(i, 1)
                            }
                        }
                    }
                    return filterEnum;
                },
                enumValue: [
                    {
                        label : "0x07",
                        value : "0x07"
                    },
                    {
                        label : "0x22",
                        value : "0x22"
                    },{
                        label : "0x32",
                        value : "0x32"
                    }
                ]
            },
            "msim-config" : {
                when : "",
                initwhen : function(data,config) {
                    return config["msim-config"].conditionData != null
                        && config["msim-config"].conditionData["card-type"] != "gx:CHM1R"
                        && config["delay-measurement-enable"].conditionData != null
                        && config["delay-measurement-enable"].conditionData["port-type"] === "line"
                        && !data.hasOwnProperty("parent-odu")
                },
                requestInitConfig: function (data, callback) {
                    requestData({
                        select : ["required-type"],
                        from : "card",
                        where : {
                            card : {
                                name : data["supporting-card"]
                            }
                        }
                    },function (rs) {
                        callback({
                            "conditionData" : {
                                "card-type" :rs["card"][0]["required-type"]
                            }
                        })
                    })
                }
            },
            "trib-port-number" : {
                "initmandatory": function (data, config) {
                   return data != null && data.class === "low-order";
                }
            },
            "opucn-time-slots" : {
                "initmandatory": function (data, config) {
                    return data != null && data.class === "low-order";
                }
            },
            "parent-odu" : {
                "initmandatory": function (data, config) {
                    return data != null && data.class === "low-order";
                }
            },

        },
        "chassis": {
            "no-switchover": {
                show: false
            },
            "active-controller-slot": {
                show: false
            }
        }
    },
    "G40": {
        xcon: {
            "payload-type-filter": {
                fix: true,
                needCommit: false,
                type: FormControlTypeEnum.Select,
                enumValue : [],
                createInitConfig: function (data, callback) {
                    let type = ["100G","100GBE","400GBE"];
                    let enumList = [];
                    type.forEach(item => {
                        enumList.push({
                            label: item,
                            value: item
                        })
                    })
                    callback({
                        enumValue: enumList
                    })
                }
            },
            "source": {
                afterUpdateFilter: function (data, filterEnum, type) {
                    let filterType = [];
                    let limitODUClass = null;
                    if (data[type].indexOf("/ioa-ne:odu") > -1) {
                        filterType = ["ethernet", "otu", "odu"];
                        filterEnum.forEach(item => {
                            if (item.value === data[type]) {
                                limitODUClass = item.class;
                            }
                        })
                    } else if (data[type].indexOf("/ioa-ne:otu") > -1) {
                        filterType = ["odu"];
                        limitODUClass = "high-order"
                    } else if (data[type].indexOf("/ioa-ne:ethernet") > -1) {
                        filterType = ["odu"];
                        limitODUClass = "high-order"
                    }
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterType.indexOf(filterEnum[i].type) < 0) {
                            filterEnum.splice(i, 1);
                        } else if (limitODUClass != null && limitODUClass === filterEnum[i].class) {
                            filterEnum.splice(i, 1);
                        }
                    }
                },
                createInitConfig: YangTools.resourceInitConfigG40
            },
            "destination": {
                afterUpdateFilter: function (data, filterEnum, type) {
                    let filterType = [];
                    let limitODUClass = null;
                    if (data[type].indexOf("/ioa-ne:odu") > -1) {
                        filterType = ["ethernet", "otu", "odu"];
                        filterEnum.forEach(item => {
                            if (item.value === data[type]) {
                                limitODUClass = item.class;
                            }
                        })
                    } else if (data[type].indexOf("/ioa-ne:otu") > -1) {
                        filterType = ["odu"];
                        limitODUClass = "high-order"
                    } else if (data[type].indexOf("/ioa-ne:ethernet") > -1) {
                        filterType = ["odu"];
                        limitODUClass = "high-order"
                    }
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterType.indexOf(filterEnum[i].type) < 0) {
                            filterEnum.splice(i, 1);
                        } else if (limitODUClass != null && limitODUClass === filterEnum[i].class) {
                            filterEnum.splice(i, 1);
                        }
                    }
                },
                createInitConfig: YangTools.resourceInitConfigG40
            }
        },
        "create-xcon" : {
            "payload-type" : {
                createInitConfig: function (data, callback) {
                    let type = ["100G","100GBE","400GBE"];
                    let enumList = [];
                    type.forEach(item => {
                        enumList.push({
                            label: item,
                            value: item
                        })
                    })
                    callback({
                        enumValue: enumList
                    })
                }
            },
            "source": {
                createInitConfig: YangTools.resourceInitConfigG40
            },
            "destination": {
                createInitConfig: YangTools.resourceInitConfigG40
            }
        },
        "card": {
            "console": {
                extendConfig: {
                    editShow: function (data) {
                        return data != null && (parseColonValues(data["required-type"]) === "XMM4");
                    }
                }
            },
            "property": {
                fix: true,
                type: "list",
                show: false,
                extendConfig: {
                    relateShow: function (data) {
                        return data != null && (data["category"] === "controller" || data["category"] === "line-card")
                    }
                }
            }
        },
        "optical-carrier": {
            "tx-power" : {
                requestInitConfig: function (data, callback) {
                    requestData({
                        select : ["required-type"],
                        from : "card",
                        where : {
                            card : {
                                name : data["supporting-card"]
                            }
                        }
                    },function (rs) {
                        callback({
                            "conditionData" : {
                                "card-type" :rs["card"][0]["required-type"]
                            }
                        })
                    })
                },
                afterUpdate: function (data, config) {
                    if( config["conditionData"] != null && config["conditionData"]["card-type"] != null ) {
                        let max = null;
                        let min = null;
                        if( config["conditionData"]["card-type"] === "gx:CHM6" ) {
                            if ( data.AID.indexOf("L") > -1 ) {
                                min = -6;
                                max = 9;
                            } else {
                                min = -15;
                                max = -2;
                            }
                        } else if( config["conditionData"]["card-type"] === "gx:UCM4" ) {
                            min = -6;
                            max = 9;
                        }
                        if( max != null && min != null ) {
                            return {
                                placeholder: getText("range") + ": " + min + ".." + max,
                                validators: {
                                    "between": {
                                        min: min.toString(),
                                        max: max.toString(),
                                        message: function () {
                                            return getText("error.config.between").format(getText("trib-port-number"), min, max)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "frequency": {
                "requires-confirmation": {
                    "when": "",
                    "initwhen": function (data, config, fun) {
                        if (isNaN(data["frequency"])) {
                            fun(false);
                            return;
                        }
                        requestData([
                                {
                                    select: ["carriers", "spectral-bandwidth"],
                                    from: "super-channel",
                                    "requestType": "cache",
                                    where: {
                                        "super-channel": {
                                            "supporting-card": data["supporting-card"]
                                        }
                                    }
                                },
                                {
                                    select: ["name", "frequency"],
                                    from: "optical-carrier",
                                    "requestType": "cache",
                                    where: {
                                        "optical-carrier": {
                                            "supporting-card": data["supporting-card"]
                                        }
                                    }
                                }
                            ], function (rs) {
                                let superChannel = rs["super-channel"][0];
                                if (superChannel["carriers"].length == 2) {
                                    let ocFrequency = 0;
                                    let spectralBandwidth = superChannel["spectral-bandwidth"];
                                    if (isNaN(spectralBandwidth)) {
                                        fun(false);
                                        return;
                                    }
                                    rs["optical-carrier"].forEach(oc => {
                                        if (oc["name"] != data["name"]) {
                                            ocFrequency = oc["frequency"];
                                        }
                                    })
                                    if (isNaN(ocFrequency)) {
                                        fun(false);
                                        return;
                                    }
                                    if (Math.abs(data["frequency"] - ocFrequency) <= spectralBandwidth * 1000 / 2) {
                                        fun(true)

                                    } else {
                                        fun(false)

                                    }
                                } else {
                                    fun(false)
                                }
                            }
                        )
                        return true;
                    },
                    "description": "Provided frequency doesn’t obey the minimum carrier spacing recommendation. Are you sure you want to continue?"
                }
            }
        },
        "odu": {
            "odu-type" : {
                createInitConfig: function (data, callback) {
                    requestData({
                        select: ["required-type"],
                        from: "card",
                        where: {
                            "card" : {
                                name: data["supporting-card"]
                            }
                        }
                    },function (rs) {
                        let oduTypeList = [];
                        if( rs.card != null && rs.card.length > 0 ) {
                            if (rs.card[0]["required-type"] === "gx:CHM6") {
                                oduTypeList = ['ODU4i', 'ODUflexi', 'ODU4'];
                            } else if (rs.card[0]["required-type"] === "gx:UCM4") {
                                oduTypeList = ['ODU2', 'ODU2e'];
                            }
                        }
                        let enumList = [];
                        oduTypeList.forEach(item => {
                            enumList.push({
                                label: item,
                                value: item
                            })
                        })
                        callback({
                            enumValue: enumList
                        })
                    })
                }
            },
            "loopback" : {
                "when" : "",
                "initwhen": function (data, config, callback) {
                    return config["loopback"]["conditionData"] === "tributary"
                },
                editInitConfig: function (data, callback) {
                    requestData({
                        select: ["port-type"],
                        from: "port",
                        where: {
                            "card" : {
                                name : data["supporting-card"]
                            },
                            "port" : {
                                name : convertToArray(data["supporting-port"])[0]
                            }
                        }
                    },function (rs) {
                        callback({
                            "conditionData" : rs.port[0]["port-type"]
                        })
                    })
                }
            },
            "odu-diagnostics": {
                extendConfig: {
                    relateShow: function (data) {
                        return data["class"] === "low-order" || data["class"]  === "mapped";
                    }
                }
            }
        },
        "odu-diagnostics": {
            "direction" : {
                editInitConfig: function (data, callback,keys) {
                    new Promise(resolve => {
                        requestData({
                            select : ["odu-type","supporting-card","supporting-port","class","supporting-facilities"],
                            from : "odu",
                            where : keys
                        },function(rs) {
                            resolve(rs)
                        })
                    }).then(rs=>{
                        return new Promise(resolve => {
                            requestData([
                                {
                                    select : ["port-type"],
                                    from : "port",
                                    where : {
                                        port : {
                                            name : rs.odu[0]["supporting-port"]
                                        },
                                        card : {
                                            name : rs.odu[0]["supporting-card"]
                                        }
                                    }
                                },{
                                    select : ["required-type"],
                                    from : "card",
                                    where : {
                                        card : {
                                            name : rs.odu[0]["supporting-card"]
                                        }
                                    }
                                }
                            ],function(rs1) {
                                resolve([rs1,rs])
                            })
                        })
                    }).then(([rs1,odu])=>{
                        callback({
                            conditionData : {
                                "port" : rs1["port"][0],
                                "card" : rs1["card"][0],
                                "odu" : odu["odu"][0]
                            }
                        })
                    })
                }
            },
            "monitoring-mode": {
                when : "",
                initwhen : function (data,config) {
                    if( config["direction"]["conditionData"] != null  ) {
                        return config["direction"]["conditionData"]["odu"]["class"] === 'low-order'
                            || config["direction"]["conditionData"]["port"]["port-type"] === 'uplink'
                            || config["direction"]["conditionData"]["port"]["port-type"] === 'tributary'
                    } else {
                        return true;
                    }
                }
            },
            "tti-style" : {
                when : "",
                initwhen : function (data,config) {
                    return YangTools.odu4_spec_req_allowed(data,config)
                }
            },
            "tx-dapi": {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709' ) {
                        return YangTools.tti_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "tx-operator" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709' ) {
                        return YangTools.tti_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "rx-sapi" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709' && data["rx-sapi"] != null && data["rx-sapi"] != "" ) {
                        return YangTools.odu4_spec_req_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "rx-sapi-hex" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709') {
                        return YangTools.odu4_spec_req_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "rx-dapi" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709' && data["rx-dapi"] != "" && data["rx-dapi"] != null ) {
                        return YangTools.odu4_spec_req_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "rx-dapi-hex" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709') {
                        return YangTools.odu4_spec_req_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "rx-operator" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709' && data["rx-operator"] != "" && data["rx-operator"] != null ) {
                        return YangTools.odu4_spec_req_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "rx-operator-hex" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709') {
                        return YangTools.odu4_spec_req_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "tim-act-enabled": {
                when : "",
                initwhen : function (data,config) {
                    if( config["direction"]["conditionData"] != null  ) {
                        return config["direction"]["conditionData"]["card"]["required-type"] === "gx:UCM4";
                    } else {
                        return true;
                    }
                }
            },
            "tx-tti": {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'proprietary' ) {
                        return YangTools.tti_allowed(data,config);
                    } else {
                        return false;
                    }
                }
            },
            "rx-tti" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'proprietary' && data["rx-tti"] != "" && data["rx-tti"] != null ) {
                        return YangTools.odu4_spec_req_allowed(data,config)
                    } else {
                        return false;
                    }
                }
            },
            "rx-tti-hex" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'proprietary') {
                        return YangTools.odu4_spec_req_allowed(data,config)
                    } else {
                        return false;
                    }
                }
            },
            "expected-tti" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'proprietary') {
                        return YangTools.odu4_spec_req_allowed(data,config)
                    } else {
                        return false;
                    }
                }
            },
            "expected-sapi" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709') {
                        return YangTools.odu4_spec_req_allowed(data,config)
                    } else {
                        return false;
                    }
                }
            },
            "expected-dapi" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709') {
                        return YangTools.odu4_spec_req_allowed(data,config)
                    } else {
                        return false;
                    }
                }
            },
            "expected-operator" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709') {
                        return YangTools.odu4_spec_req_allowed(data,config)
                    } else {
                        return false;
                    }
                }
            },
            "tx-sapi" : {
                when : "",
                initwhen : function (data,config) {
                    if( data["tti-style"] === 'ITU-T-G709') {
                        return YangTools.tti_allowed(data,config)
                    } else {
                        return false;
                    }
                }
            },
            "test-signal-type" : {
                when : "",
                initwhen : function (data,config) {
                    return YangTools.odu_diag_prbs_allowed(data,config);
                }
            },
            "test-signal-monitoring" : {
                when : "",
                initwhen : function (data,config) {
                    return YangTools.odu_diag_prbs_allowed(data,config);
                }
            },
            "test-signal-direction": {
                when : "",
                initwhen : function (data,config) {
                    return false; //yang design: "when": " false() " todo
                }
            },
            "tti-mismatch-alarm-reporting" : {
                when : "",
                initwhen : function (data,config) {
                    return YangTools.odu4_spec_req_allowed(data,config)
                }
            },
        },
        "otu" : {
            "loopback" : {
                editInitConfig : function (data, callback,key) {
                    if( data.AID.indexOf("L") > -1 ) {
                        requestData({
                            "select": ["required-type"],
                            "from": "card",
                            "where": {
                                "card": {
                                    name: data["supporting-card"]
                                }
                            }
                        }, function (rs) {
                            if (rs.card[0]["required-type"] === "gx:CHM6") {
                                callback({
                                    enumValue : [
                                        {
                                            label : "none",
                                            value : "none"
                                        },
                                        {
                                            label : "terminal",
                                            value : "terminal"
                                        }
                                    ]
                                })
                            } else {
                                callback();
                            }
                        })
                    } else {
                        callback();
                    }
                }
            }
        },
        "trib-ptp": {
            "near-end-tda" : {
                "when" : "",
                "initwhen" : function(data, config, callback) {
                    return sessionStorage.neType != "G40"
                }
            },
            "tda-degrade-mode" : {
                "when" : "",
                "initwhen" : function(data, config, callback) {
                    return sessionStorage.neType != "G40"
                }
            },
            "tributary-disable-action": {
                afterUpdate: function (data, config) {
                    if (config.enumValue == null) {
                        return [];
                    }
                    let filterEnum = deepClone(config.enumValue);
                    if (data["service-type"] === "100GBE" || data["service-type"] === "400GBE") {
                        for (let i = 0; i < filterEnum.length; i++) {
                            if (filterEnum[i].value === "send-ais-l") {
                                filterEnum.splice(i, 1);
                                break;
                            }
                        }
                    }
                    return filterEnum;
                }
            },
            "service-type": {
                editInitConfig: function (data, callback) {
                    let aid = data.AID.replace(/[a-zA-Z]+/g, "");
                    if( aid.indexOf(".") > -1 ) {
                        aid = aid.substring(0,aid.indexOf("."))
                    }
                    requestData({
                        select: ["required-type","required-subtype","phy-mode"],
                        from: "tom",
                        where: {
                            tom: {
                                AID: aid
                            }
                        }
                    }, function (rs) {
                        let serviceTypeList = [];
                        if (rs.tom != null && rs["tom"].length > 0) {
                            let tomType = rs.tom[0]["required-type"];
                            if( tomType === "gx:QSFP28" ) {
                                serviceTypeList = ['100GBE', 'OTU4'];
                            } else if( tomType === "gx:QSFPDD" ) {
                                serviceTypeList = ['400GBE'];
                            } else if( tomType === "gx:QSFPPLUS" ) {
                                if( data.name.indexOf(".") > -1 ) {
                                    if( rs.tom[0]["phy-mode"].startsWith("4x10GE")) {
                                        serviceTypeList = ['10GBE'];
                                    } else {
                                        serviceTypeList = ['10GBE', 'OTU2', 'OTU2e', 'OC192', 'STM64'];
                                    }
                                } else {
                                    if( rs.tom[0]["phy-mode"].startsWith("4x10GE")) {
                                        serviceTypeList = ['4x10GBE'];
                                    } else {
                                        serviceTypeList = ['4x10G'];
                                    }
                                }

                            } else if( rs.tom[0]["required-subtype"] != null && rs.tom[0]["required-subtype"].indexOf("ZR") > -1 ) {
                                if( rs.tom[0]["phy-mode"] === "100GE") {
                                    serviceTypeList = ['100GE'];
                                } else if( rs.tom[0]["phy-mode"] === "400GE") {
                                    serviceTypeList = ['400GE'];
                                } else if( rs.tom[0]["phy-mode"] === "4x100GE") {
                                    serviceTypeList = ['4x100GE'];
                                }
                            }
                        }
                        if( serviceTypeList.length > 0 ) {
                            let enumList = [];
                            if(serviceTypeList.indexOf(data["service-type"]) < 0 ) {
                                serviceTypeList.push(data["service-type"])
                            }
                            serviceTypeList.forEach(item=>{
                                enumList.push( {
                                    label: item,
                                    value: item
                                })
                            })
                            callback({
                                enumValue : enumList
                            })
                        } else {
                            callback();
                        }
                    })
                }
            },
        },
    }
}

/**
 * fix : true                       //add a new parameter or overwrite to yang config.
 * mandatoryCommit : true           //mandatory to commit this parameter value.
 * cellDataFun : function           //format the value for table column.
 * createInitConfig : function       //init the config for create panel.
 * editInitConfig : function        //init the config for edit panel.
 * extendConfig : {                 //for container or list or the expand parameter.
        editShow : function/true    //it will be show on the edit panel.
        relateShow: true            //it will be show on the relate table. if want show it, please set it to false.
   }
 commitRequired : true              //it used when settings extendsConfig/editShow, can not commit the expand node value when this parameter is null.
 showTabButtons : false             //show buttons for related table
 needCommit : true                  //don't commit it;
 initwhen : function                //block yang when behavior.g
 *
 */
let YangUserDefine = {
    "slot": {
        "possible-frus": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["possible-frus"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "actual-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["actual-type"])
                        }
                    )
                } else {
                    callback({});
                }
            },
        },
        "required-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["required-type"])
                        }
                    )
                } else {
                    callback({});
                }
            },
        },

        "inventory": {
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
    },
    "log-server": {
        "log-server-facility-filter": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        },
        "source-facilities": {
            type: FormControlTypeEnum.MultiSelect,

        }

    },
    "log-file": {
        "log-file-facility-filter": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },

    },
    "traceroute": {
        "source": {
            type: FormControlTypeEnum.ChoiceRadio,
            needCommit: false,
            needNone: true,
            defaultValue: "None"
        },
        "tr-interface": {
            type: FormControlTypeEnum.Select,
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["source"] == null || data["source"] == "" || data["source"] === "tr-interface");
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["if-name"],
                                value: _rslist[i]["if-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["if-name"],
                                value: _rslist[i]["if-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
        "tr-vrf": {
            type: FormControlTypeEnum.Select,
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["source"] == null || data["source"] === "tr-vrf");
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["name"],
                        from: "vrf",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["vrf"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["name"],
                                value: _rslist[i]["name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["name"],
                        from: "vrf",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["vrf"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["name"],
                                value: _rslist[i]["name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
    },
    "run-task": {
        "task-name": {
            type: FormControlTypeEnum.Text,
            config: false,
        },
    },
    "clear-ospf-instance": {
        "instance": {
            type: FormControlTypeEnum.Text,
            config: false,
        },
    },
    "ping": {
        "source": {
            type: FormControlTypeEnum.ChoiceRadio,
            needCommit: false,
            needNone: true,
            defaultValue: "None"
        },
        "ping-interface": {
            type: FormControlTypeEnum.Select,
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["source"] == null || data["source"] === "ping-interface");
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["if-name"],
                                value: _rslist[i]["if-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["if-name"],
                                value: _rslist[i]["if-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
        "ping-vrf": {
            type: FormControlTypeEnum.Select,
            fix: true,
            when: "",
            initwhen: function (data) {
                return (data["source"] == null || data["source"] === "ping-vrf");
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["name"],
                        from: "vrf",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["vrf"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["name"],
                                value: _rslist[i]["name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["name"],
                        from: "vrf",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["vrf"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["name"],
                                value: _rslist[i]["name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
    },
    "acl": {
        "interface": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                        where: {
                            interface: {
                                name: data["if-name"]
                            },

                        }
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            let name = _rslist[i]["if-name"];
                            if (name.indexOf("AUX") != -1 || name.indexOf("DCN") != -1) {
                                enumList.push({
                                    label: _rslist[i]["if-name"],
                                    value: _rslist[i]["if-name"]
                                })
                            }
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                        where: {
                            interface: {
                                name: data["if-name"]
                            },

                        }
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            let name = _rslist[i]["if-name"];
                            if (name.indexOf("AUX") != -1 || name.indexOf("DCN") != -1) {
                                enumList.push({
                                    label: _rslist[i]["if-name"],
                                    value: _rslist[i]["if-name"]
                                })
                            }
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            }
        },
        "ace": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },
    },
    "supported-chassis": {
        "chassis-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["chassis-type"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "supported-slot": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            },
            "possible-card-types": {
                cellDataFun: function (treeObj, field) {
                    return parseColonValues(treeObj[field]);
                },
                editInitConfig: function (data, callback) {
                    if (data != null) {
                        callback(
                            {
                                "fixedValue": parseColonValues(data["possible-card-types"])
                            }
                        )
                    } else {
                        callback({});
                    }
                }
            }
        }

    },
    "alarm-severity-entry": {
        "resource-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["resource-type"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "alarm-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["alarm-type"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        }

    },
    "supported-port": {
        // "possible-tom-types": {
        //     cellDataFun: function (treeObj, field) {
        //         return parseColonValues(treeObj[field]);
        //     },
        //     editInitConfig: function (data, callback) {
        //         if (data != null) {
        //             callback(
        //                 {
        //                     "fixedValue": parseColonValues(data["possible-tom-types"])
        //                 }
        //             )
        //         } else {
        //             callback({});
        //         }
        //     }
        // }
        "supported-tom": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
                title: "supported-tom",
            },
        }
    },
    "supported-slot": {
        "possible-card-types": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    const enumList = [], dataType = data["possible-card-types"];
                    let dataArray = convertToArray(dataType);
                    for (let i = 0; i < dataArray.length; i++) {
                        enumList.push({
                            label: dataArray[i],
                            value: dataArray[i]
                        });
                    }
                    callback(
                        {
                            "enumValue": enumList,
                            "fixedValue": dataArray
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "auto-provision-capable": {
            config: false
        },
    },
    "ne": {
        "recover-mode": {
            config: false
        },
    },
    "supported-card": {
        "card-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["card-type"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "supported-subtype": {
            cellDataFun: function (treeObj, field) {
                return parseListValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    const enumList = [], dataType = data["supported-subtype"],
                        dataArray = convertToArray(dataType)
                    for (let i = 0; i < dataArray.length; i++) {
                        enumList.push({
                            label: dataArray[i],
                            value: dataArray[i]
                        });
                    }
                    callback(
                        {
                            "enumValue": enumList,
                            "fixedValue": dataArray
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "supported-port": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    if (data == null || isEmptyObj(data)) {
                        return true;
                    }
                    return data["category"] === "line-card";
                }
            }
        },
        "subtype-constraint": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                title: "subtype-constraint (gsct)",
                relateShow: function (data) {
                    if (data == null || isEmptyObj(data)) {
                        return true;
                    }
                    return data["category"] === "line-card";
                }
            }
        },
        "golden-carrier-mode": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                title: "golden-carrier-mode (gcmt)",
                relateShow: function (data) {
                    if (data == null || isEmptyObj(data)) {
                        return true;
                    }
                    return data["category"] === "line-card";
                }
            }
        },
        "golden-advanced-parameter": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                title: "golden-advanced-parameter (gapt)",
                relateShow: function (data) {
                    if (data == null || isEmptyObj(data)) {
                        return true;
                    }
                    return data["category"] === "line-card";
                }
            }
        },

    },
    "card": {
        "name": {
            createInitConfig: function (data, callback) {
                if (data != null && data.hasOwnProperty("keys")) {
                    callback(
                        {
                            fixedValue: data["keys"]["chassis"]["name"] + "-" + data["keys"]["slot"]["name"]
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "chassis-name": {
            createInitConfig: function (data, callback) {
                if (data != null && data.hasOwnProperty("keys")) {
                    callback(
                        {
                            fixedValue: data["keys"]["chassis"]["name"]
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "slot-name": {
            createInitConfig: function (data, callback) {
                if (data != null && data.hasOwnProperty("keys")) {
                    callback(
                        {
                            fixedValue: data["keys"]["slot"]["name"]
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "required-type": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null && data.hasOwnProperty("keys")) {
                    requestData({
                        select: ["possible-card-types"],
                        from: "supported-slot",
                        where: {
                            "supported-slot": {
                                "slot-name": data["keys"]["slot"]["name"]
                            }
                        }
                    }, function (_slotData) {
                        const enumList = [];
                        if (_slotData["supported-slot"][0].hasOwnProperty("possible-card-types")) {
                            const _rslist = convertToArray(_slotData["supported-slot"][0]["possible-card-types"]);
                            for (let i = 0; i < _rslist.length; i++) {
                                enumList.push({
                                    label: parseColonValues(_rslist[i]),
                                    value: _rslist[i]
                                })
                            }
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["required-type"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "required-subtype": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            "when" : "",
            "initwhen": function (data, config, callback) {
                return config["required-subtype"] != null && config["required-subtype"]["enumValue"] != null && config["required-subtype"]["enumValue"].length > 0;
            },
            "requires-confirmation": {
                "when": "",
                "initwhen": function (data, config, callback) {
                    let subtype = data["required-subtype"];
                    let type = data["required-type"];
                    if (subtype === "") {
                        callback(false);
                        return;
                    }
                    requestData([
                        {
                            "from": "slot.inventory",
                            where: {
                                "slot": {
                                    "name": data["slot-name"]
                                },
                                "chassis": {
                                    "name": data["chassis-name"]
                                }
                            }
                        }
                    ], function (rs) {
                        if (rs["slot.inventory"] == null || rs["slot.inventory"].length == 0) {
                            callback(false);
                            return;
                        }
                        let newSubtype = rs["slot.inventory"][0]["actual-subtype"];
                        if (newSubtype === subtype) {
                            callback(false);
                            return;
                        }
                        callback(true);

                    })
                },
                "description": "This operation will cause a mismatch and may have traffic impact. Are you sure you want to continue? [y/n] "
            },
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["required-type"] == null || data["required-type"] == PLEASE_SELECT_VALUE || data["required-type"].length == 0) {
                    return [];
                } else {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].filterType != data["required-type"]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                    return filterEnum
                }
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                const enumList = [];
                if (data["supported-type"] == null) {
                    callback({
                        enumValue: enumList
                    })
                    return;
                }
                let requestList = [];
                convertToArray(data["supported-type"]).forEach(item => {
                    requestList.push(
                        {
                            select: ["supported-subtype"],
                            from: "supported-card",
                            where: {
                                "supported-card": {
                                    "card-type": item
                                }
                            }
                        })
                })
                if (data != null) {
                    requestData(requestList, function (_rs) {
                        if (_rs.hasOwnProperty("supported-card")) {
                            convertToArray(_rs["supported-card"]).forEach(supportedCard => {
                                let subTypeList = convertToArray(supportedCard["supported-subtype"]);
                                subTypeList.forEach(subType => {
                                    enumList.push({
                                        filterType: supportedCard["card-type"],
                                        label: parseColonValues(subType),
                                        value: subType
                                    })
                                })
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["supported-subtype"],
                        from: "supported-card",
                        where: {
                            "supported-card": {
                                "card-type": data["required-type"]
                            }
                        }
                    }, function (_rs) {
                        const enumList = [];
                        if (_rs.hasOwnProperty("supported-card")) {
                            const _cardList = convertToArray(_rs["supported-card"]);
                            for (let i = 0; i < _cardList.length; i++) {
                                const cardType = parseColonValues(_cardList[i]["card-type"]);
                                const _ponList = convertToArray(_cardList[i]["supported-subtype"])
                                for (let j = 0; j < _ponList.length; j++) {
                                    enumList.push({
                                        filterType: cardType,
                                        label: parseColonValues(_ponList[j]),
                                        value: _ponList[j]
                                    })
                                }
                            }
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                }
                return _config
            },
        },
        "inventory": {
            extendConfig: {
                relateShow: true
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return data != null && data["category"] == "line-card"
                }
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return sessionStorage.neType === "G30"  && data["category"] == "line-card"
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "controller-card": {
            extendConfig: {
                editShow: function (data) {
                    return data != null && data["category"] === "controller"
                }
            }
        },
        "fan": {
            extendConfig: {
                editShow: function (data) {
                    return data != null && parseColonValues(data["required-type"]).indexOf("FAN") > -1;
                }
            }
        },
        "pem": {
            extendConfig: {
                editShow: function (data) {
                    return data != null && parseColonValues(data["required-type"]) === "PEM";
                }
            }
        },
        "supported-advanced-parameter": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return sessionStorage.neType === "G40" && data != null && data["category"] == "line-card"
                }
            }
        },
        "supported-carrier-mode": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return sessionStorage.neType === "G40" && data != null && data["category"] == "line-card"
                }
            }
        },
        "filter-facilities": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return data != null && data["category"] == "line-card"
                }
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "controller-card" : {
        "redundancy-standby-status" : {
            when: "",  //init
            "initwhen" : function(data, config) {
                if( config["expand-controller-card-redundancy-standby-status"] != null
                    && config["expand-controller-card-redundancy-standby-status"]["conditionData"] != null ) {
                    return config["expand-controller-card-redundancy-standby-status"]["conditionData"]["controller-redundancy-supported"] === "true"
                        && ( data["expand-controller-card-redundancy-status"] === "standby" || data["expand-controller-card-redundancy-status"] === "not-in-service" )
                } else {
                    return true;
                }
            },
            editInitConfig : function (data,callback) {
                requestData({
                    select : ["controller-redundancy-supported"],
                    from : "supported-chassis"
                },function (rs) {
                    callback({
                        "conditionData" : {
                            "controller-redundancy-supported" : rs["supported-chassis"][0]["controller-redundancy-supported"]
                        }
                    })
                })
                return {}
            }
        },
        "number-of-switchover-events": {
            when: "",  //init
            "initwhen" : function(data, config) {
                if( config["expand-controller-card-redundancy-standby-status"] != null
                    && config["expand-controller-card-redundancy-standby-status"]["conditionData"] != null ) {
                    return config["expand-controller-card-redundancy-standby-status"]["conditionData"]["controller-redundancy-supported"] === "true"
                        && data["expand-controller-card-redundancy-status"] === "active"
                } else {
                    return true;
                }
            },
        },
        "time-of-last-switchover": {
            when: "",  //init
            "initwhen" : function(data, config) {
                if( config["expand-controller-card-redundancy-standby-status"] != null
                    && config["expand-controller-card-redundancy-standby-status"]["conditionData"] != null ) {
                    return config["expand-controller-card-redundancy-standby-status"]["conditionData"]["controller-redundancy-supported"] === "true"
                        && ( data["expand-controller-card-redundancy-status"] === "active" || parseInt(data["expand-controller-card-number-of-switchover-events"]) > 0)
                } else {
                    return true;
                }
            },
        },
        "additional-details": {
            when: "",  //init
            "initwhen" : function(data, config) {
                if( config["expand-controller-card-redundancy-standby-status"] != null
                    && config["expand-controller-card-redundancy-standby-status"]["conditionData"] != null ) {
                    return config["expand-controller-card-redundancy-standby-status"]["conditionData"]["controller-redundancy-supported"] === "true"
                        && data["expand-controller-card-redundancy-status"] === "not-ready-synchronize-fail"
                } else {
                    return true;
                }
            },
        }
    },
    "console": {
        "local-switch": {
            "requires-confirmation": {
                "when": "",
                "initwhen": function (data, config, callback) {
                    if (data["expand-console-status"] === "disabled" && data["expand-controller-card-redundancy-status"] === "active") {
                        let aidTemp = data["AID"].split("-");
                        requestData([
                            {
                                select: ["admin-state"],
                                from: "port",
                                where: {
                                    "port": {
                                        "name": "CRAFT"
                                    }
                                }
                            },
                            {
                                select: ["is-node-controller"],
                                from: "chassis",
                                where: {
                                    "chassis": {
                                        "name": aidTemp[0]
                                    }
                                }
                            },
                        ], function (rs) {
                            if (rs["port"] == null || rs["port"].length == 0) {
                                callback(false);
                                return;
                            }
                            if (rs["chassis"] == null || rs["chassis"].length == 0) {
                                callback(false);
                                return;
                            }
                            if (rs["port"][0]["admin-state"] == "lock" &&
                                rs["chassis"][0]["is-node-controller"] == "true") {
                                callback(true);

                            } else {
                                callback(false);

                            }
                        })
                    } else {
                        callback(false);
                    }
                },
                "description": "Disabling this interface can make the node permanently inaccessible.\nPlease ensure that other Management interfaces are available and operable.\nAre you sure you want to continue? [y/n] "
            }
        }
    },
    "serial-console": {
        "global-switch": {
            "requires-confirmation": {
                "when": "",
                "initwhen": function (data, config, callback) {
                    if (data["global-switch"] === "disabled") {
                        requestData([
                            {
                                select: ["node-controller-chassis-name"],
                                from: "ne"
                            },
                        ], function (srs) {
                            let chassisName = srs["ne"]["node-controller-chassis-name"];
                            requestData([
                                {
                                    select: ["controller-card", "console"],
                                    from: "card",
                                    where: {
                                        "card": {
                                            "chassis-name": chassisName
                                        }
                                    }
                                },
                                {
                                    select: ["admin-state"],
                                    from: "port",
                                    where: {
                                        "port": {
                                            "name": "CRAFT"
                                        }
                                    }
                                },
                            ], function (rs) {
                                if (rs["card"] == null || rs["card"].length == 0) {
                                    callback(false);
                                    return;
                                }
                                if (rs["card"][0]["console"] == null || rs["card"][0]["controller-card"] == null) {
                                    callback(false);
                                    return;
                                }
                                if (rs["port"] == null || rs["port"].length == 0) {
                                    callback(false);
                                    return;
                                }
                                if (rs["card"][0]["console"]["local-switch"] === "use-global-switch" &&
                                    rs["card"][0]["controller-card"]["redundancy-status"] === "active" &&
                                    rs["port"][0]["admin-state"] === "lock") {
                                    callback(true);

                                } else {
                                    callback(false);

                                }
                            })
                        })
                    } else {
                        callback(false);
                    }
                },
                "description": "Disabling this interface can make the node permanently inaccessible.\nPlease ensure that other Management interfaces are available and operable.\nAre you sure you want to continue? [y/n] "
            }
        }
    },
    "ospf-instance": {
        "ospf-area": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
                title: "OSPF Area",
            },
        }

    },
    "ospf-area": {
        "ospf-area-range": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
                title: "OSPF Area Range",
            }
        },
        "ospf-interface": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
                title: "OSPF Interface",
            }
        },
    },
    "protection-group": {
        "working-pu": {
            type: FormControlTypeEnum.Select,
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                let protectionPort = filterEnum.find( item => item.value=== data["protection-pu"]);

                if(!isNullOrUndefined(protectionPort))
                {
                    let filterType = protectionPort.label.substring(protectionPort.label.indexOf("("),protectionPort.label.length) ;
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].label.indexOf(filterType) < 0) {
                            filterEnum.splice(i, 1);
                        }
                    }
                }
                if (data["protection-pu"] !== PLEASE_SELECT_VALUE) {
                    let index = filterEnum.findIndex( item => item.value=== data["protection-pu"]);
                    if(index!== -1)
                    {
                        filterEnum.splice(index,1);
                    }
                }

                return filterEnum;
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                requestData([
                    {
                        select : ["AID"],
                        from : "card",
                        where : {
                            "card" : {
                                "required-type" : "gx:CHM6"
                            }
                        }
                    },
                    {
                        select: ["name","service-type","AID"],
                        from: "trib-ptp",
                    },
                    {
                        select: ["working-pu","protection-pu"],
                        from: "protection-group",
                    }
                ], function (_rs) {
                    const enumList = [];
                    const usedTribList = [];
                    const cardAID = [];
                    if (_rs.hasOwnProperty("card") && _rs["card"].length > 0 ) {
                        _rs["card"].forEach(item=>{
                            cardAID.push(item["AID"]);
                        })
                    } else {
                        callback({});
                        return;
                    }
                    if (_rs.hasOwnProperty("protection-group") && _rs["protection-group"].length > 0) {
                        _rs["protection-group"].forEach(item => {
                            usedTribList.push({
                                label: item["working-pu"] + "",
                                value: item["working-pu"] + ""
                            });
                            usedTribList.push({
                                label: item["protection-pu"] + "",
                                value: item["protection-pu"] + ""
                            });

                        })
                    }
                    if (_rs.hasOwnProperty("trib-ptp") && _rs["trib-ptp"].length > 0) {
                        _rs["trib-ptp"].forEach(item => {
                            for(let i=0;i<cardAID.length;i++) {
                                if( item["AID"].startsWith(cardAID[i] + "-") ) {
                                    let findPort = usedTribList.find(usedTripPTP => usedTripPTP.value === item["name"])
                                    if (isNullOrUndefined(findPort)) {
                                        enumList.push({
                                            label: item["name"] + "(" + item["service-type"] + ")",
                                            value: item["name"] + ""
                                        })
                                    }
                                    break;
                                }
                            }
                        })
                    }
                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            } ,
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {

                    requestData([
                        {
                            select : ["AID"],
                            from : "card",
                            where : {
                                "card" : {
                                    "required-type" : "gx:CHM6"
                                }
                            }
                        },
                        {
                            select: ["name","AID"],
                            from: "trib-ptp",
                        },
                        {
                            select: ["working-pu","protection-pu"],
                            from: "protection-group",
                        }
                    ], function (_rs) {
                        let enumList = [];
                        const usedTribList = [];
                        const cardAID = [];
                        if (_rs.hasOwnProperty("card") && _rs["card"].length > 0 ) {
                            _rs["card"].forEach(item=>{
                                cardAID.push(item["AID"]);
                            })
                        } else {
                            callback({});
                            return;
                        }
                        if (_rs.hasOwnProperty("protection-group") && _rs["protection-group"].length > 0) {
                            _rs["protection-group"].forEach(item => {
                                usedTribList.push({
                                    label: item["working-pu"] + "",
                                    value: item["working-pu"] + ""
                                });
                                usedTribList.push({
                                    label: item["protection-pu"] + "",
                                    value: item["protection-pu"] + ""
                                });

                            })
                        }
                        if (_rs.hasOwnProperty("trib-ptp") && _rs["trib-ptp"].length > 0) {
                            _rs["trib-ptp"].forEach(item => {
                                for(let i=0;i<cardAID.length;i++) {
                                    if (item["AID"].startsWith(cardAID[i] + "-")) {
                                        let findPort = usedTribList.find(usedTripPTP => usedTripPTP.value === item["name"])
                                        if (isNullOrUndefined(findPort)) {
                                            enumList.push({
                                                label: item["name"] + "",
                                                value: item["name"] + ""
                                            })
                                        }
                                    }
                                }
                            })
                            enumList.push({
                                label: data["working-pu"] + "",
                                value: data["working-pu"] + ""
                            })
                        }
                        callback({
                            enumValue: enumList,
                        })
                    })
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
                return _config

            },
        },
        "protection-pu": {
            type: FormControlTypeEnum.Select,
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);

                let workingPort = filterEnum.find( item => item.value=== data["working-pu"]);
                if(!isNullOrUndefined(workingPort))
                {
                    let filterType = workingPort.label.substring(workingPort.label.indexOf("("),workingPort.label.length) ;
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].label.indexOf(filterType) < 0) {
                            filterEnum.splice(i, 1);
                        }
                    }
                }

                if (data["working-pu"] !== PLEASE_SELECT_VALUE) {
                    let index = filterEnum.findIndex( item => item.value=== data["working-pu"]);
                    if(index!== -1)
                    {
                        filterEnum.splice(index,1);
                    }
                }


                return filterEnum;
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                requestData([
                    {
                        select : ["AID"],
                        from : "card",
                        where : {
                            "card" : {
                                "required-type" : "gx:CHM6"
                            }
                        }
                    },
                    {
                        select: ["name","service-type","AID"],
                        from: "trib-ptp",
                    },
                    {
                        select: ["working-pu","protection-pu"],
                        from: "protection-group",
                    }
                ], function (_rs) {
                    const enumList = [];
                    const usedTribList = [];
                    const cardAID = [];
                    if (_rs.hasOwnProperty("card") && _rs["card"].length > 0 ) {
                        _rs["card"].forEach(item=>{
                            cardAID.push(item["AID"]);
                        })
                    } else {
                        callback({});
                        return;
                    }
                    if (_rs.hasOwnProperty("protection-group") && _rs["protection-group"].length > 0) {
                        _rs["protection-group"].forEach(item => {
                            usedTribList.push({
                                label: item["working-pu"] + "",
                                value: item["working-pu"] + ""
                            });
                            usedTribList.push({
                                label: item["protection-pu"] + "",
                                value: item["protection-pu"] + ""
                            });

                        })
                    }
                    if (_rs.hasOwnProperty("trib-ptp") && _rs["trib-ptp"].length > 0) {
                        _rs["trib-ptp"].forEach(item => {
                            for(let i=0;i<cardAID.length;i++) {
                                if (item["AID"].startsWith(cardAID[i] + "-")) {
                                    let findPort = usedTribList.find(usedTripPTP => usedTripPTP.value === item["name"])
                                    if (isNullOrUndefined(findPort)) {
                                        enumList.push({
                                            label: item["name"] + "(" + item["service-type"] + ")",
                                            value: item["name"] + ""
                                        })
                                    }
                                }
                            }
                        })


                    }
                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            } ,
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {

                    requestData([
                        {
                            select : ["AID"],
                            from : "card",
                            where : {
                                "card" : {
                                    "required-type" : "gx:CHM6"
                                }
                            }
                        },
                        {
                            select: ["name","service-type","AID"],
                            from: "trib-ptp",
                        },
                        {
                            select: ["working-pu","protection-pu"],
                            from: "protection-group",
                        }
                    ], function (_rs) {
                        let enumList = [];
                        const usedTribList = [];
                        const cardAID = [];
                        if (_rs.hasOwnProperty("card") && _rs["card"].length > 0 ) {
                            _rs["card"].forEach(item=>{
                                cardAID.push(item["AID"]);
                            })
                        } else {
                            callback({});
                            return;
                        }
                        if (_rs.hasOwnProperty("protection-group") && _rs["protection-group"].length > 0) {
                            _rs["protection-group"].forEach(item => {
                                usedTribList.push({
                                    label: item["working-pu"] +"",
                                    value: item["working-pu"] + ""
                                });
                                usedTribList.push({
                                    label: item["protection-pu"] + "",
                                    value: item["protection-pu"] + ""
                                });

                            })
                        }

                        let filerType = "";
                        if (_rs.hasOwnProperty("trib-ptp") && _rs["trib-ptp"].length > 0)
                        {
                            _rs["trib-ptp"].forEach(item => {
                                  if(item["name"] === data["working-pu"])
                                  {
                                      filerType = item["service-type"];
                                  }
                            })
                        }
                            if (_rs.hasOwnProperty("trib-ptp") && _rs["trib-ptp"].length > 0) {
                            _rs["trib-ptp"].forEach(item => {
                                for(let i=0;i<cardAID.length;i++) {
                                    if (item["AID"].startsWith(cardAID[i] + "-")) {
                                        let findPort = usedTribList.find(usedTripPTP => usedTripPTP.value === item["name"]);

                                        if (isNullOrUndefined(findPort) && item["service-type"] === filerType) {
                                            enumList.push({
                                                label: item["name"] + "(" + item["service-type"] + ")",
                                                value: item["name"] + ""
                                            })
                                        }
                                    }
                                }
                            })
                            _rs["trib-ptp"].forEach(item => {
                                if(item["name"] === data["protection-pu"])
                                {
                                    enumList.push({
                                        label: data["protection-pu"]  + "(" + item["service-type"] +")",
                                        value: data["protection-pu"] + ""
                                    })
                                }
                            })

                        }
                        callback({
                            enumValue: enumList,
                        })
                    })
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
                return _config

            },
        },
        "protection-unit": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-equipment": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-facilities": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
    },
    "protection-unit": {
        "transport-entity": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": resource2KeyName(data["transport-entity"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "ospf-interface": {
        "ospf-if-name": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["if-name"],
                                value: _rslist[i]["if-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["if-name"],
                        from: "interface",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["interface"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["if-name"],
                                value: _rslist[i]["if-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        }
    },
    "ISK": {
        "key-signature-list": {
            extendConfig: {
                relateShow: true
            }
        }
    },
    "chassis": {
        "required-type": {
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["required-type"])
                        }
                    )
                } else {
                    callback({});
                }
            },
        },
        "no-switchover" : {
            "when" : "",
            "initwhen" : function(data, config, callback) {
                return config["no-switchover"]["conditionData"]["controller-redundancy-supported"] === "true"
            },
            editInitConfig: function (data, callback) {
                requestData({
                    "select" : ["controller-redundancy-supported"],
                    "from" : "supported-chassis",
                    "where" : {
                        "supported-chassis" : {
                            "chassis-type" : data["required-type"]
                        }
                    }
                },function(rs) {
                    callback({
                        conditionData: {
                            "controller-redundancy-supported": rs["supported-chassis"][0]["controller-redundancy-supported"]
                        }
                    })
                })
            }
        },
        "inventory": {
            extendConfig: {
                relateShow: true
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return sessionStorage.neType === "G30"
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "ntp": {
        "ntp-stat": {
            type: FormControlTypeEnum.TextArea,
            rows: 3,
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
    },
    "sw-management.software-load": {
        "sw-management.software-load.sw-component": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },

        },
        "sw-management.software-load.packaged-fw": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        }
    },
    "sw-management.software-load.sw-component": {
        "sw-management.software-load.sw-component.sw-subcomponent": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        }
    },
    "user-group": {
        "user-names": {
            cellDataFun: function (treeObj, field) {
                return parseListValues(treeObj[field]);
            },
            type: FormControlTypeEnum.MultiSelect,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["user-name"],
                        from: "user",
                        where: {
                            user: {
                                name: data["user-name"]
                            },

                        }
                    }, function (_userData) {
                        const enumList = [];
                        const _rslist = convertToArray(_userData["user"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["user-name"],
                                value: _rslist[i]["user-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["user-name"],
                        from: "user",
                        where: {
                            user: {
                                name: data["user-name"]
                            },

                        }
                    }, function (_userData) {
                        const enumList = [];
                        const _rslist = convertToArray(_userData["user"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["user-name"],
                                value: _rslist[i]["user-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            }
        },
    },
    "sw-control-rule": {
        "service-name": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["sv-name"],
                        from: "sw-service",
                    }, function (_userData) {
                        const enumList = [];
                        const _rslist = convertToArray(_userData["sw-service"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["sv-name"],
                                value: _rslist[i]["sv-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["sv-name"],
                        from: "sw-service",
                    }, function (_userData) {
                        const enumList = [];
                        const _rslist = convertToArray(_userData["sw-service"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["sv-name"],
                                value: _rslist[i]["sv-name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
    },
    "password": {
        "new-password": {
            type: FormControlTypeEnum.Password
        },
        "old-password": {
            type: FormControlTypeEnum.Password
        }
    },

    "clock": {
        "timezone": {
            type: FormControlTypeEnum.Select,
            sortFunc: function (a, b) {
                let aa="";
                let bb = "";

                if(a.toString().indexOf("GMT+")==-1&&a.toString().indexOf("GMT-")==-1){
                    aa = "0";
                }else{
                    aa=a.toString().substring(a.toString().indexOf("[")+4,a.toString().indexOf("]"));
                }

                if(b.toString().indexOf("GMT+")==-1 && b.toString().indexOf("GMT-")==-1){
                    bb = "0";
                }else{
                    bb=b.toString().substring(b.toString().indexOf("[")+4,b.toString().indexOf("]"));
                }
                if(aa.indexOf(":")!=-1){
                    aa=aa.replaceAll(":","");
                }
                if(bb.indexOf(":")!=-1){
                    bb=bb.replaceAll(":","");
                }

                return parseInt(parseInt(aa)-parseInt(bb));
            },
        }
    },
    "set-time": {
        "new-time": {
            type: FormControlTypeEnum.DateTimeZoneSelect,
            enumValue: function (data) {
                console.log("2222")
                return getYangConfig("clock")["timezone"]["enumValue"];
            },
            createInitConfig: function (data, callback) {
                requestData({
                    select: ["timezone", "current-time"],
                    from: "clock",
                }, function (_data) {
                    const timezoneEnumList = [];
                    const currentTimeEnumList = [];
                    const _rslist = convertToArray(_data["clock"]);
                    for (let i = 0; i < _rslist.length; i++) {
                        timezoneEnumList.push({
                            label: _rslist[i]["timezone"],
                            value: _rslist[i]["timezone"]
                        })
                        currentTimeEnumList.push({
                            label: _rslist[i]["current-time"],
                            value: _rslist[i]["current-time"]
                        })
                    }
                    const currentTime = currentTimeEnumList[0].value;
                    let time = currentTime;
                    if (currentTime.indexOf("Z") != -1) {
                        time = currentTime.substr(0, currentTime.indexOf("Z"));
                    } else if (currentTime.indexOf("+") != -1) {
                        time = currentTime.substr(0, currentTime.indexOf("+"));
                    } else {
                        time = currentTime.substr(0, currentTime.lastIndexOf("-"));
                    }
                    if (time.length == 16) {               //hh:mm:ss  when ss=00, value doesn't contain :00
                        time += ":00";
                    }
                    time += "Z"
                    callback({
                        // timezoneDefaultValue: timezoneEnumList[0].value,
                        currentTimeDefaultValue: currentTimeEnumList[0].value,
                        defaultValue: time
                    })
                })
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("new-time"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("new-time"))
                    }
                }
            }
        }
    },
    "syslog": {
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },
    },
    "task": {
        "definition": {
            "fix": true,
            "requires-confirmation": {
                "when": "",
                "fix": true,
                "affect": ["create"],
                "nocommit": true,
                "initwhen": function (data, config, callback) {
                    if (data["frequency"] === '' && data["start-time"] === '') {
                        callback(true, "Frequency and start-time should not be empty at the same time! \nDo you want to continue? [y/n]");

                    } else {
                        callback(false);
                    }
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },
    },
    "restart": {
        "definition": {
            "fix": true,
            "requires-confirmation": {
                "when": "",
                "fix": true,
                "initwhen": function (data, config, callback) {
                    requestData({
                        select: ["swload-status"],
                        from: "sw-management.software-load",
                        where: {
                            "software-load": {
                                state: "installable"
                            }
                        }
                    }, function (rs) {
                        if (rs["sw-management.software-load"] != null && rs["sw-management.software-load"].length > 0) {
                            rs["sw-management.software-load"].forEach(sw => {
                                if (['validate-in-progress', 'apply-in-progress', 'activate-in-progress', 'cancel-in-progress'].indexOf(sw["swload-status"]) > -1) {
                                    callback(true, "Warning: system is currently performing an upgrade procedure. Any reboot in this scenario might disrupt the upgrade. \nAre you sure you want to proceed? [y/n]")
                                    return;
                                }
                            })
                        }
                        if ( isNullOrUndefined(data.resource) || data.resource === "" ) {
                            callback(true, "System will reboot and will temporarily lose connectivity. Are you sure? [y/n]");
                            return;
                        } else {
                            let _name = resource2KeyName(data.resource);
                            let type = _name.split("-")[0];
                            // let name = ;
                            if (type == "card") {
                                requestData({
                                    select: ["category", "container"],
                                    from: "card",
                                    where: {
                                        "card": {
                                            name: _name.replace(type + "-", "")
                                        }
                                    }
                                }, function (rs) {
                                    if( rs.card != null && rs.card.length > 0 ) {
                                        if( rs.card[0].category == "controller" && rs.card[0]["controller-card"]["redundancy-status"] == "active" ) {
                                            callback(true,"System will reboot and will temporarily lose connectivity. Are you sure? [y/n]");
                                            return;
                                        } else if( rs.card[0].category === "line-card") {
                                            if( data["sub-component"] != null && data["sub-component"] != "" &&
                                                data["sub-component"] != PLEASE_SELECT_VALUE && data["sub-component"] != data.resource ) {
                                                callback(true, resource2KeyName(data["resource"]) + "will restart, which may have traffic impact. Are you sure? [y/n]");
                                                return;
                                            }
                                            if( data["type"] === "warm" ) {
                                                callback(true, "Card will reboot and will be temporarily unreachable. Are you sure? [y/n]");
                                                return;
                                            }
                                            if( data["type"] === "cold" ) {
                                                callback(true, "Card will do a cold start, which may have traffic impact. Are you sure? [y/n]");
                                                return;
                                            }
                                            if( data["type"] === "shutdown" ) {
                                                callback(true, "Card will shutdown, which may have traffic impact. Are you sure? [y/n]");
                                                return;
                                            }
                                        } else {
                                            callback(true, "Are you sure? [y/n] ");
                                        }
                                        return;
                                    }
                                    callback(false);
                                    return;
                                })
                            } else if (type === "tom") {
                                callback(true, "TOM will restart, which may have traffic impact. Are you sure? [y/n]");
                                return;

                            } else {
                                callback(true);
                                return;
                            }
                        }
                    })

                }
            }
        },
        "resource": {
            showEnable: false,
            commitEnable: true,
        },
        "sub-component": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            when: "",
            initwhen: function (data) {
                if (data != null && data.resource != null) {
                    let keys = getKeyFromResource(data.resource);
                    if (keys != null && keys.type != null && keys.type == "card") {
                        return true;
                    }
                }
                return false;
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if( isNullOrUndefined(data.keys) ) {
                    callback(_config)
                    return ;
                }
                if (data != null) {
                    requestData({
                        select: ["supported-sub-components"],
                        from: "resources",
                        rsKey: "supported-sub-components",
                        where: {
                            "card": {
                                "name": data.keys.card.name
                            }
                        }
                    }, function (_com) {
                        if (_com.hasOwnProperty("supported-sub-components")
                            && _com["supported-sub-components"].length > 0) {
                            const enumValue = [];
                            const _comList = convertToArray(_com["supported-sub-components"])
                            for (let i = 0; i < _comList.length; i++) {
                                enumValue.push({
                                    label: _comList[i],
                                    value: _comList[i],
                                })
                            }

                            callback({
                                enumValue: enumValue
                            });
                        } else {
                            callback(_config);
                        }
                    })
                } else {
                    callback(_config)
                }
                return _config
            }
        }
    },
    "db_download": {
        "db-passphrase": {
            type: FormControlTypeEnum.Passphrase
        },
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "database",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },

        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        }
    },
    "sw_download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "swimage",
                })
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification" );
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },

        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        },
    },
    "krp_download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "krp",
                })
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },

        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        },
    },
    "trusted-certificate_download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "trusted-certificate",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        },
        "passphrase": {
            firstValidators: {
                "notRequired": {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                }
            }
        }
    },
    "peer-certificate_download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "peer-certificate",
                })
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        },
        "passphrase": {
            firstValidators: {
                "notRequired": {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                }
            }
        }
    },
    "local-certificate_download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "local-certificate",
                })
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        },
        "passphrase": {
            firstValidators: {
                "notRequired": {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                }
            }
        }
    },
    "script_download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "script",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },

        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        },
    },
    "file_download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "file",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },

        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        },
    },
    "download": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "swimage",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "passphrase": {
            type: FormControlTypeEnum.Password,
        },
        "target": {
            type: FormControlTypeEnum.ChoiceRadio,
            needCommit: false,
            defaultValue: "source",
        },
        "source": {
            type: FormControlTypeEnum.Text,
            label: "Source",
            fix: true,
            when: "",  //init
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("source"))
                    }
                }
            },
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "source");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "source") {
                    if (data.source.trim().toLowerCase().startsWith("scp") ||
                        data.source.trim().toLowerCase().startsWith("sftp") ||
                        data.source.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
    },
    "activate-snapshot": {
        "db-instance": {
            type: FormControlTypeEnum.Text,
            config: false,
            needCommit: true,
        }
    },
    "activate-fw": {
        "definition": {
            "fix": true,
            "requires-confirmation": {
                "when": "",
                "fix": true,
                "initwhen": function (data, config, callback) {
                    requestData({
                        "select" : ["nsa-upgrade-version"],
                        "from" : "third-party-fw",
                        "where" : {
                            "third-party-fw" : {
                                "fw-name" : data["fw-image-name"]
                            }
                        }
                    },function (rs) {
                        if( isNullOrUndefined(rs["third-party-fw"]) || rs["third-party-fw"].length === 0 ) {
                            callback(false);
                        } else {
                            callback(true)
                            // requestData({
                            //     "select" : ["nsa-upgrade-version"],
                            //     "from" : "third-party-fw",
                            //     "where" : {
                            //         "third-party-fw" : {
                            //             "fw-name" : data["fw-image-name"]
                            //         }
                            //     }
                            // },function (rs2) {
                            //
                            // })
                        }
                    })
                }
            }
        },
        "resource": {
            type: FormControlTypeEnum.Text,
            needCommit: true,
            show: false,
        },
        "fw-image-name": {
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["fw_name"],
                        from: "third-party-fw",
                    }, function (_data) {
                        const enumList = [];
                        const _rslist = convertToArray(_data["third-party-fw"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["fw_image_name"],
                                value: _rslist[i]["fw_image_name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },


        }
    },

    "take-snapshot": {
        "db-passphrase": {
            type: FormControlTypeEnum.Passphrase
        },
    },
    "db_upload": {
        "db-passphrase": {
            type: FormControlTypeEnum.Passphrase
        },
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "database",
                })
            },
        },
        "destination": {
            type: FormControlTypeEnum.Text,
            label: "Destination",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },

        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
    },
    "logfile_upload": {
        "filetype": {
            config: true,
            editEnable: true,
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const enumList = [];
                enumList.push({
                    label: "fdr-log",
                    value: "fdr-log"
                });
                enumList.push({
                    label: "pm-logs",
                    value: "pm-logs"
                });
                enumList.push({
                    label: "debug-log",
                    value: "debug-log"
                });
                enumList.push({
                    label: "logs",
                    value: "logs"
                });
                callback({
                    enumValue: enumList
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "debug-entity": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                requestData([{
                    from: "chassis",
                }, {
                    from: "card",
                }], function (_rs) {
                    const enumList = [];
                    if (_rs.hasOwnProperty("chassis")) {
                        const data = convertToArray(_rs.chassis);
                        for (let i = 0; i < data.length; i++) {
                            enumList.push({
                                label: "chassis-" + data[i].name,
                                value: getEntityPathByKey("chassis", {
                                    "chassis": {
                                        name: data[i].name
                                    }
                                })
                            })
                        }
                    }
                    if (_rs.hasOwnProperty("card")) {
                        const data = convertToArray(_rs.card);
                        for (let i = 0; i < data.length; i++) {
                            if(data[i].category==="controller"||data[i].category==="line-card"){
                                enumList.push({
                                    label: "card-" + data[i].name,
                                    value: getEntityPathByKey("card", {
                                        "card": {
                                            name: data[i].name
                                        }
                                    })
                                })
                            }
                        }
                    }

                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            },
        },
        "destination": {
            type: FormControlTypeEnum.Text,
            label: "Destination",
            fix: true,
            when: "",  //init
            // "initmandatory": function (data, config) {
            //     return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            // },
            // initValidators: {
            //     "notEmpty": {
            //         message: function () {
            //             return getText("error_required").format(getText("destination"))
            //         }
            //     }
            // },
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
    },
    "debuglog_upload": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "debug-log",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "debug-entity": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                requestData([{
                    from: "chassis",
                }, {
                    from: "card",
                }], function (_rs) {
                    const enumList = [];
                    if (_rs.hasOwnProperty("chassis")) {
                        const data = convertToArray(_rs.chassis);
                        for (let i = 0; i < data.length; i++) {
                            enumList.push({
                                label: "chassis-" + data[i].name,
                                value: getEntityPathByKey("chassis", {
                                    "chassis": {
                                        name: data[i].name
                                    }
                                })
                            })
                        }
                    }
                    if (_rs.hasOwnProperty("card")) {
                        const data = convertToArray(_rs.card);
                        for (let i = 0; i < data.length; i++) {
                            enumList.push({
                                label: "card-" + data[i].name,
                                value: getEntityPathByKey("card", {
                                    "card": {
                                        name: data[i].name
                                    }
                                })
                            })
                        }
                    }
                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            },
        },
        "destination": {
            type: FormControlTypeEnum.Text,
            label: "Destination",
            fix: true,
            when: "",  //init
            // "initmandatory": function (data, config) {
            //     return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            // },
            // initValidators: {
            //     "notEmpty": {
            //         message: function () {
            //             return getText("error_required").format(getText("destination"))
            //         }
            //     }
            // },
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["name"],
                        from: "file-server",
                    }, function (_interfaceData) {
                        const enumList = [];
                        const _rslist = convertToArray(_interfaceData["file-server"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["name"],
                                value: _rslist[i]["name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },

        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
    },
    "fdrlog_upload": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "fdr-log",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "destination": {
            type: FormControlTypeEnum.Text,
            label: "Destination",
            fix: true,
            when: "",  //init
            // "initmandatory": function (data, config) {
            //     return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            // },
            // initValidators: {
            //     "notEmpty": {
            //         message: function () {
            //             return getText("error_required").format(getText("destination"))
            //         }
            //     }
            // },
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "debug-entity": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                requestData([{
                    from: "chassis",
                }, {
                    from: "card",
                }], function (_rs) {
                    const enumList = [];
                    if (_rs.hasOwnProperty("chassis")) {
                        const data = convertToArray(_rs.chassis);
                        for (let i = 0; i < data.length; i++) {
                            enumList.push({
                                label: "chassis-" + data[i].name,
                                value: getEntityPathByKey("chassis", {
                                    "chassis": {
                                        name: data[i].name
                                    }
                                })
                            })
                        }
                    }
                    if (_rs.hasOwnProperty("card")) {
                        const data = convertToArray(_rs.card);
                        for (let i = 0; i < data.length; i++) {
                            enumList.push({
                                label: "card-" + data[i].name,
                                value: getEntityPathByKey("card", {
                                    "card": {
                                        name: data[i].name
                                    }
                                })
                            })
                        }
                    }
                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            },
        }
    },
    "manifest": {
        "downloaded-image": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        }
    },
    "db_activate-file": {
        "db-passphrase": {
            type: FormControlTypeEnum.Passphrase
        },
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "database",
                })
            },
        },
        "label": {
            type: FormControlTypeEnum.Text,
            config: false,
            needCommit: true,
        }

    },
    "krp_activate-file": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "krp",
                })
            },
        },
        "label": {
            type: FormControlTypeEnum.Text,
            config: false,
            needCommit: true,
        }

    },
    "sw_activate-file": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "swimage",
                })
            },
        },
        "label": {
            type: FormControlTypeEnum.Text,
            config: false,
            needCommit: true,
        }
    },
    "prepare-upgrade": {
        "definition": {
            "fix": true,
            "requires-confirmation": {
                "when": "",
                "fix": true,
                "initwhen": function (data, config, callback) {
                    requestData({
                        select: ["swload-status"],
                        from: "software-location.software-load",
                        where: {
                            "software-load": {
                                state: "installable"
                            }
                        }
                    }, function (rs) {
                        if (rs["software-location.software-load"] != null && rs["software-location.software-load"].length > 0) {
                            rs["software-location.software-load"].forEach(sw => {
                                if (['validate-in-progress', 'apply-in-progress', 'activate-in-progress', 'cancel-in-progress'].indexOf(sw["swload-status"]) > -1) {
                                    callback(true)

                                } else {
                                    callback(false)

                                }
                            })
                        } else {
                            callback(false)

                        }
                    })
                },
                "description": "Warning: FRUs  are performing an upgrade procedure. Any prepare-upgrade in this scenario might delay the upgrade. \\nAre you sure you want to proceed? [y/n]"
            }
        },
        "manifest": {
            type: FormControlTypeEnum.Text,
            config: false,
        }
    },
    "activate-file": {
        "definition": {
            "fix": true,
            "requires-confirmation": {
                "when": "",
                "fix": true,
                "initwhen": function (data, config, callback) {
                    if (data["filetype"] === 'swimage' && data["db-action"] === 'auto') {
                        callback(true, "This operation may affect network connectivity.Post installation, please do network configurations either via serial console or via ethernet CRAFT interface. Are you sure? [y/n]")
                    } else if (data["filetype"] === 'swimage' && data["db-action"] === 'empty-db') {
                        callback(true, "This operation will affect network connectivity.Post installation, please do network configurations either via serial console or via ethernet CRAFT interface. Are you sure? [y/n]")
                    } else if (data["filetype"] != "database") {
                        callback(true, " Are you sure? [y/n]");
                    } else if (data["filetype"] === "database") {
                        callback(true, "This command may have traffic impact! Are you sure? [y/n]");
                    } else {
                        callback(true, " Are you sure? [y/n]")
                    }
                }
            }
        },
        "label": {
            type: FormControlTypeEnum.Text,
            config: false,
            needCommit: true,
        },
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "swimage",
                })
            },
        },
    },
    "clear-file": {
        "target-file": {
            type: FormControlTypeEnum.Text,
            config: false,
        },
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "swimage",
                })
            },
        },
    },
    "trusted_clear-certificate": {
        "type": {
            config: false,
            editEnable: false,
            type: FormControlTypeEnum.Text,
            mandatoryCommit: true,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "trusted",
                })
            },
        },
        "id": {
            config: false,
            editEnable: false,
            type: FormControlTypeEnum.Text,
        }
    },
    "local_clear-certificate": {
        "type": {
            config: false,
            editEnable: false,
            type: FormControlTypeEnum.Text,
            mandatoryCommit: true,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "local",
                })
            },
        },
        "id": {
            type: FormControlTypeEnum.Text,
            editEnable: false,
            config: false,
        }
    },
    "peer_clear-certificate": {
        "type": {
            config: false,
            editEnable: false,
            type: FormControlTypeEnum.Text,
            mandatoryCommit: true,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "peer",
                })
            },
        },
        "id": {
            config: false,
            editEnable: false,
            type: FormControlTypeEnum.Text,
        }
    },
    "script_clear-file": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "script",
                })
            },
        },
    },
    "krp_clear-file": {
        "target-file": {
            type: FormControlTypeEnum.Text,
            config: false,
            show: false,
            needCommit: false,
        },
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "krp",
                })
            },
        },
    },
    "pmLog_upload": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "pm-logs",
                })
            },
        },
        "destination": {
            type: FormControlTypeEnum.Text,
            label: "Destination",
            fix: true,
            when: "",  //init
            // initValidators: {
            //     "notEmpty": {
            //         message: function () {
            //             return getText("error_required").format(getText("destination"))
            //         }
            //     }
            // },
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            },
            // "initmandatory": function (data, config) {
            //     return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            // },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "period" : {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                callback({
                    enumValue: [
                        {
                            label : "pm-15min",
                            value : "pm-15min"
                        },
                        {
                            label : "pm-24h",
                            value : "pm-24h"
                        }
                    ]
                })
            }
        },
        "start-time": {
            type: FormControlTypeEnum.DateTimeSelect,
            initValidators: {
            }
        },
    },
    "sw_upload": {
        "filetype": {
            config: false,
            type: FormControlTypeEnum.Text,
            createInitConfig: function (data, callback) {
                callback({
                    fixedValue: "swimage",
                })
            },
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "destination": {
            type: FormControlTypeEnum.Text,
            label: "Destination",
            fix: true,
            when: "",  //init
            // initValidators: {
            //     "notEmpty": {
            //         message: function () {
            //             return getText("error_required").format(getText("destination"))
            //         }
            //     }
            // },
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            },
            // "initmandatory": function (data, config) {
            //     return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            // },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            "initmandatory": function (data, config) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
    },
    "upload": {
        "db-passphrase": {
            type: FormControlTypeEnum.Passphrase
        },
        "filetype": {
            config: false,
        },
        "target": {
            type: FormControlTypeEnum.ChoiceRadio,
            needCommit: false,
            defaultValue: "destination",
        },
        "skip-secure-verification":{
            when: "",  //init
            initwhen: function (data) {
                return  checkPpcParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "skip-secure-verification");
            },
        },
        "destination": {
            type: FormControlTypeEnum.Text,
            label: "Destination",
            fix: true,
            when: "",  //init
            // initValidators: {
            //     "notEmpty": {
            //         message: function () {
            //             return getText("error_required").format(getText("destination"))
            //         }
            //     }
            // },
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "destination");
            },
        },
        "file-server": {
            type: FormControlTypeEnum.Select,
            label: "File Server",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] === "file-server-based");
            },
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
                "regexp": {
                    regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                    message: function () {
                        return getText("error_required").format(getText("file-server"))
                    }
                },
            },
        },
        "path": {
            type: FormControlTypeEnum.Text,
            label: "Path",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "file-server-based");
            },
        },
        "password": {
            type: FormControlTypeEnum.Password,
            initwhen: function (data) {
                if (data["target"] == "" || data["target"] === "destination") {
                    if (data.destination.trim().toLowerCase().startsWith("scp") ||
                        data.destination.trim().toLowerCase().startsWith("sftp") ||
                        data.destination.trim().toLowerCase().startsWith("ftp")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            },
        }
    },
    "file-server": {
        "password": {
            type: FormControlTypeEnum.Password
        }
    },
    "software-location": {
        "software-location.software-load": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        }
    },
    "software-location.software-load": {
        "software-location.software-load.sw-component": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        },
        "software-location.software-load.packaged-fw": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        }
    },
    "software-location.software-load.sw-component": {
        "software-location.software-load.sw-component.sw-subcomponent": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        },
    },
    "log-console": {
        "log-console-facility-filter": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            },
        }
    },
    "get-log": {
        "start-time": {
            type: FormControlTypeEnum.DateTimeSelect,
            initValidators: {
                // "notEmpty": {
                //     message: function () {
                //         return getText("error_required").format(getText("start-time"))
                //     }
                // }
            }
        },
        "end-time": {
            type: FormControlTypeEnum.DateTimeSelect,
            initValidators: {
                // "notEmpty": {
                //     message: function () {
                //         return getText("error_required").format(getText("end-time"))
                //     }
                // }
            }
        },
    },

    "ntp-server": {
        "auth-key-id": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    const enumList = [];
                    enumList.push({
                        label: "not-applicable",
                        value: "not-applicable"
                    })

                    requestData({
                        select: ["key-id"],
                        from: "ntp-key",
                    }, function (_ntpData) {
                        const _rslist = convertToArray(_ntpData["ntp-key"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["key-id"],
                                value: _rslist[i]["key-id"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    const enumList = [];
                    enumList.push({
                        label: "not-applicable",
                        value: "not-applicable"
                    })
                    requestData({
                        select: ["key-id"],
                        from: "ntp-key",
                    }, function (_ntpData) {
                        const _rslist = convertToArray(_ntpData["ntp-key"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["key-id"],
                                value: _rslist[i]["key-id"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "ntp-server-status": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "aaa-server": {
        "server-priority": {
            type: FormControlTypeEnum.Select,
        },
        "server-port-authentication": {
            editInitConfig: function (data, callback) {
                if (data != null && data.hasOwnProperty("protocol-supported") && data["protocol-supported"] !== "TACACSPLUS") {
                    callback({})
                } else {
                    callback({
                        defaultValue: "",
                    })
                }

            }
        },
        "server-port-accounting": {
            editInitConfig: function (data, callback) {
                if (data != null && data.hasOwnProperty("protocol-supported") && data["protocol-supported"] !== "TACACSPLUS") {
                    callback({})
                } else {
                    callback({
                        defaultValue: "",
                    })
                }

            }
        },
        "server-port": {
            editInitConfig: function (data, callback) {
                if (data != null && data.hasOwnProperty("protocol-supported") && data["protocol-supported"] === "TACACSPLUS") {
                    callback({
                        // value : authentication
                    })
                } else {
                    callback({
                        defaultValue: "",
                    })
                }

            }
        },
        "role-supported": {
            cellDataFun: function (treeObj, field) {
                return treeObj[field].split(" ").join(",");
            }
        }

    },
    "port": {
        "admin-state": {
            "requires-confirmation": {
                "when": "",
                "initwhen": function (data, config, callback) {
                    if (data["admin-state"] === "lock" && data["name"] === "CRAFT") {
                        let aidTemp = data["AID"].split("-");
                        requestData([
                            {
                                select: ["redundancy-status"],
                                from: "controller-card",
                                where: {
                                    "card": {
                                        "name": aidTemp[0] + "-" + aidTemp[1]
                                    }
                                }
                            },
                            {
                                select: ["is-node-controller"],
                                from: "chassis",
                                where: {
                                    "chassis": {
                                        "name": aidTemp[0]
                                    }
                                }
                            },
                            {
                                select: ["status"],
                                from: "console",
                                where: {
                                    "card": {
                                        "name": aidTemp[0] + "-" + aidTemp[1]
                                    }
                                }
                            }
                        ], function (rs) {
                            if (rs["controller-card"] == null || rs["controller-card"].length == 0) {
                                callback(false);
                                return;
                            }
                            if (rs["chassis"] == null || rs["chassis"].length == 0) {
                                callback(false);
                                return;
                            }
                            if (rs["console"] == null || rs["console"].length == 0) {
                                callback(false);
                                return;
                            }
                            if (rs["controller-card"][0]["redundancy-status"] == "active" &&
                                rs["chassis"][0]["is-node-controller"] == "true" &&
                                rs["console"][0]["status"] == "disabled") {
                                callback(true);

                            } else {
                                callback(false);

                            }
                        })
                    } else {
                        callback(false);
                    }
                },
                "description": "Disabling this interface can make the node permanently inaccessible.\nPlease ensure that other Management interfaces are available and operable.\nAre you sure you want to continue? [y/n] "
            }
        },
        "required-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                callback({
                    fixedValue: parseColonValues(data["required-type"]),
                })
            }

        },
        "hosted-facility": {
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["hosted-facility"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "carrier": {
            fix: true,
            type: "list",
            extendConfig: {
                relateShow: function (data) {
                    return data != null && data.hasOwnProperty("carrier");
                },
                initData: function (data) {
                    if (data != null) {
                        return data.carrier;
                    } else {
                        return ""
                    }
                }
            }
        },
        "hosted-interface": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["hosted-interface"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "inventory": {
            extendConfig: {
                relateShow: true
            }
        },
        "usb": {
            extendConfig: {
                editShow: function (data) {
                    return data != null && data["port-type"] === "usb";
                }
            }
        },
        "comm-eth": {
            extendConfig: {
                editShow: function (data) {
                    return data != null && data["port-type"] === "comm";
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return data["port-type"] === "line" || data["port-type"] === "tributary";
                }
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return sessionStorage.neType === "G30" && (data["port-type"] === "line" || data["port-type"] === "tributary")
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-facilities": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return data != null && (data["port-type"] === "line" ||
                        (data["port-type"] === "tributary" && data.hasOwnProperty("hosted-interface")));
                }
            }
        }
    },
    "ip-monitoring":{
        "static-route": {
            // cellDataFun: function (treeObj, field) {
            //     return resource2KeyName(treeObj[field]);
            // },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                const enumList = [];
                if (data != null) {
                    requestData([
                        {
                            from: "ipv4-static-route",
                        },
                        {
                            from: "ipv6-static-route",
                        }
                    ], function (_data) {
                        let _rslist = convertToArray(_data["ipv4-static-route"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            let ipv4Name = "ipv4-static-route-"+ _rslist[i]["ipv4-destination-prefix"]+"/"+_rslist[i]["vrf"];
                            let  ipv4Resource =getEntityPathByKey("ipv4-static-route", {
                                "ipv4-static-route": {
                                    "ipv4-destination-prefix": _rslist[i]["ipv4-destination-prefix"],
                                    "vrf":_rslist[i]["vrf"]
                                }
                            })
                            enumList.push({
                                label: ipv4Name,
                                value: ipv4Resource
                            })
                        }
                        _rslist = convertToArray(_data["ipv6-static-route"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            let ipv6Name = "ipv6-static-route-"+ _rslist[i]["ipv6-destination-prefix"]+"/"+_rslist[i]["vrf"]
                            let  ipv6Resource =getEntityPathByKey("ipv6-static-route", {
                                "ipv6-static-route": {
                                    "ipv6-destination-prefix": _rslist[i]["ipv6-destination-prefix"],
                                    "vrf":_rslist[i]["vrf"]
                                }
                            })
                            enumList.push({
                                label: ipv6Name,
                                value: ipv6Resource
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                const enumList = [];
                if (data != null) {
                    requestData([
                        {
                            from: "ipv4-static-route",
                        },
                        {
                            from: "ipv6-static-route",
                        }
                    ], function (_data) {
                        let _rslist = convertToArray(_data["ipv4-static-route"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            let ipv4Name = "ipv4-static-route-"+ _rslist[i]["ipv4-destination-prefix"]+"/"+_rslist[i]["vrf"];
                            let  ipv4Resource =getEntityPathByKey("ipv4-static-route", {
                                "ipv4-static-route": {
                                    "ipv4-destination-prefix": _rslist[i]["ipv4-destination-prefix"],
                                    "vrf":_rslist[i]["vrf"]
                                }
                            })
                            enumList.push({
                                label: ipv4Name,
                                value: ipv4Resource
                            })
                        }
                        _rslist = convertToArray(_data["ipv6-static-route"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            let ipv6Name = "ipv6-static-route-"+ _rslist[i]["ipv6-destination-prefix"]+"/"+_rslist[i]["vrf"]
                            let  ipv6Resource =getEntityPathByKey("ipv6-static-route", {
                                "ipv6-static-route": {
                                    "ipv6-destination-prefix": _rslist[i]["ipv6-destination-prefix"],
                                    "vrf":_rslist[i]["vrf"]
                                }
                            })
                            enumList.push({
                                label: ipv6Name,
                                value: ipv6Resource
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        }

    },
    "tom": {
        "required-type": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            cellDataFun: function (data) {
                return parseColonValues(data["required-type"]);
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null && data.hasOwnProperty("keys")) {
                    requestData({
                        select: ["supported-type"],
                        from: "port",
                        where: {
                            "port" : {
                                "name" :  data["keys"]["port"]["name"]
                            },
                            "card": {
                                "name": data["keys"]["card"]["name"]
                            }
                        }
                    }, function (_rs) {
                        const enumList = [];
                        if (_rs["port"] != null && _rs["port"].length > 0) {
                            convertToArray(_rs["port"][0]["supported-type"]).forEach(item=>{
                                enumList.push({
                                    label: parseColonValues(item),
                                    value: item
                                })
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["required-type"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "required-subtype": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["required-type"] == null || data["required-type"] == PLEASE_SELECT_VALUE || data["required-type"].length == 0) {
                    return [];
                } else {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].filterType != data["required-type"]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                    filterEnum.unshift({
                        label : getText("please-select"),
                        value : PLEASE_SELECT_VALUE
                    })
                    return filterEnum
                }
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                const enumList = [];
                if (data["supported-type"] == null) {
                    callback({
                        enumValue: enumList
                    })
                    return;
                }
                let requestList = [];
                requestData({
                    select : ["required-type"],
                    from : "card",
                    where : {
                        "card" : {
                            "name" : data["keys"]["card"]["name"]
                        }
                    }
                }, function (rs) {
                    let card_type = rs.card[0]["required-type"];
                    convertToArray(data["supported-type"]).forEach(item => {
                        requestList.push(
                            {
                                select: ["supported-subtype"],
                                from: "supported-tom",
                                where: {
                                    "supported-card" : {
                                        "card-type" : card_type
                                    },
                                    "supported-port" : {
                                        "port-name" : data["keys"]["port"]["name"]
                                    },
                                    "supported-tom": {
                                        "tom-type": item
                                    }
                                }
                            })
                    })
                    if (data != null) {
                        requestData(requestList, function (_rs) {
                            if (_rs.hasOwnProperty("supported-tom")) {
                                convertToArray(_rs["supported-tom"]).forEach(supportedCard => {
                                    let subTypeList = convertToArray(supportedCard["supported-subtype"]);
                                    subTypeList.forEach(subType => {
                                        enumList.push({
                                            filterType: parseColonValues(supportedCard["tom-type"]),
                                            label: parseColonValues(subType),
                                            value: subType
                                        })
                                    })
                                })
                            }
                            callback({
                                enumValue: enumList,
                                conditionData : {
                                    "card-type" : card_type
                                }
                            })
                        })
                    } else {
                        callback({
                            conditionData : {
                                "card-type" : card_type
                            }
                        })
                    }
                })

                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                const enumList = [];
                let requestList = [];
                requestData({
                    select : ["required-type"],
                    from : "card",
                    where : {
                        "card" : {
                            "AID" : data.AID.substring(0,data.AID.lastIndexOf("-"))
                        }
                    }
                }, function (rs) {
                    let card_type = rs.card[0]["required-type"];
                    requestList.push(
                        {
                            select: ["supported-subtype"],
                            from: "supported-tom",
                            where: {
                                "supported-card" : {
                                    "card-type" : card_type
                                },
                                // "supported-port" : {
                                //     "port-name" : data["keys"]["port"]["name"]
                                // },
                                "supported-tom": {
                                    "tom-type": data["required-type"]
                                }
                            }
                        })
                    if (data != null) {
                        requestData(requestList, function (_rs) {
                            if (_rs.hasOwnProperty("supported-tom") && _rs["supported-tom"].length >0 ) {
                                let supportedTom = _rs["supported-tom"][0];
                                if( supportedTom["supported-subtype"] != null ) {
                                    convertToArray(supportedTom["supported-subtype"]).forEach(item => {
                                        enumList.push({
                                            filterType: parseColonValues(supportedTom["tom-type"]),
                                            label: parseColonValues(item),
                                            value: item
                                        })
                                    })
                                    }
                            }
                            callback({
                                enumValue: enumList,
                                conditionData : {
                                    "card-type" : card_type
                                }
                            })
                        })
                    } else {
                        callback({
                            conditionData : {
                                "card-type" : card_type
                            }
                        })
                    }
                })

                return _config
            },
        },
        "phy-mode": {
            type : FormControlTypeEnum.Select,
            defaultValue : null,
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["required-type"] == null || data["required-type"] == PLEASE_SELECT_VALUE || data["required-type"].length == 0) {
                    return [];
                } else {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].filterType != data["required-type"]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                    return filterEnum
                }
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                const enumList = [];
                if (data["supported-type"] == null) {
                    callback({
                        enumValue: enumList
                    })
                    return;
                }
                let requestList = [];
                requestData({
                    select : ["required-type"],
                    from : "card",
                    where : {
                        "card" : {
                            "name" : data["keys"]["card"]["name"]
                        }
                    }
                }, function (rs) {
                    let card_type = rs.card[0]["required-type"];
                    convertToArray(data["supported-type"]).forEach(item => {
                        requestList.push(
                            {
                                select: ["supported-phy-modes","default-phy-mode"],
                                from: "supported-tom",
                                where: {
                                    "supported-card" : {
                                        "card-type" : card_type
                                    },
                                    "supported-port" : {
                                        "port-name" : data["keys"]["port"]["name"]
                                    },
                                    "supported-tom": {
                                        "tom-type": item
                                    }
                                }
                            })
                    })
                    if (data != null) {
                        requestData(requestList, function (_rs) {
                            if (_rs.hasOwnProperty("supported-tom")) {
                                convertToArray(_rs["supported-tom"]).forEach(supportedCard => {
                                    let subTypeList = convertToArray(supportedCard["supported-phy-modes"]);
                                    subTypeList.forEach(subType => {
                                        enumList.push({
                                            filterType: parseColonValues(supportedCard["tom-type"]),
                                            label: parseColonValues(subType),
                                            value: subType,
                                            defaultValue : supportedCard["default-phy-mode"]
                                        })
                                    })
                                })
                            }
                            callback({
                                enumValue: enumList
                            })
                        })
                    }
                })

                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    let enumList = [];
                    convertToArray(data["supported-phy-modes"]).forEach(item=> {
                        enumList.push({
                            filterType: parseColonValues(data["required-type"]),
                            label: item,
                            value: item
                        })

                        callback({
                            enumValue: enumList
                        })
                    })
                }
                return _config
            },
        },
        "enable-serdes" : {
            "when" : "",
            "initwhen" : function(data,config) {
                return data["required-subtype"] === PLEASE_SELECT_VALUE || data["required-subtype"] === "" || config["enable-serdes"]["generic-subtype"] === data["required-subtype"]
            },
            editInitConfig: function (data, callback) {
                requestData({
                    "select" : ["generic-subtype"],
                    "from" : "tom-type",
                    "where" : {
                        "tom-type" : {
                            "tom-type" : data["required-type"]
                        }
                    }
                },function (rs) {
                    if( rs["tom-type"] != null && rs["tom-type"].length > 0 ) {
                        callback(
                            {
                                "generic-subtype" : rs["tom-type"][0]["generic-subtype"]
                            }
                        )
                    } else {
                        callback();
                    }
                })
            }
        },
		"power-class-override" : {
            "when" : "",
            "initwhen" : function(data,config) {
                if( config["required-subtype"]["conditionData"] != null ) {
                    return config["required-subtype"]["conditionData"]["card-type"] != "gx:CHM6" || ['TOM-40G-Q', 'TOM-100G-Q', 'TOM-400G-Q'].indexOf(data["required-subtype"]) > -1
                } else {
                    return true;
                }
            },
        },
        "serdes": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    if (data["enable-serdes"] != null && data["enable-serdes"] === "true") {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function () {
                    return sessionStorage.neType === "G30"
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "alarm": {
        "resource": {
            width: 65,
            cellDataFun: function (data) {
                return resource2KeyName(data["resource"]) || data["resource"];
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["resource"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "resource-type": {
            width: 60,
            cellDataFun: function (data) {
                return removeNS(data["resource-type"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: removeNS(data["resource-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "alarm-category": {
            width: 80
        },
        "perceived-severity": {
            width: 60
        },
        "reported-time": {
            width: 130
        },
        "location": {
            width: 40
        },
        "direction": {
            width: 40
        },
        "service-affecting": {
            width: 40
        },
        "alarm-type": {
            width: 100,
            cellDataFun: function (data) {
                return removeNS(data["alarm-type"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: removeNS(data["alarm-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "alarm-type-description": {
            width: 100
        },
        "operator-state": {
            width: 60
        },
        "eventTime": {
            fix: true,
            type: FormControlTypeEnum.Text
        },
        "filter-resource": {
            fix: true,
            show: false,
            type: "list",
            extendConfig: {
                relateShow: function (data) {
                    return (data.hasOwnProperty("realtype") && data["realtype"] === "event") ?
                        (isEmpty(data.detail) ? false : (!(data.hasOwnProperty("entityType") && data["entityType"] === "alarm"))) : true;

                },
                resetRelateCfg: function (data) {
                    const obj = getKeyFromResource(data.resource);
                    return {
                        keyType: data.entityYangType ? data.entityYangType : obj.type,
                        keyValue: obj.keys
                    }
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: true,
            extendConfig: {
                relateShow: function (data) {
                    if (isEmpty(data.entityType) || ((data.hasOwnProperty("realtype") && data["realtype"] === "event") && isEmpty(data.detail))) return false;
                    let facilitiesTypes = getChildrenList("facilities");

                    return (facilitiesTypes.indexOf(data.entityType.toLowerCase()) > -1 ? true :
                        (Entity_RelatedService.indexOf(data.entityType) > -1 ?
                            ((data.entityType === "card" || data.entityType === "port") ? data.isLineCard : true) : false));
                },
                resetRelateCfg: function (data) {
                    const obj = getKeyFromResource(data.resource);
                    return {
                        keyType: "filter-service",
                        keyValue: obj.keys,
                        containerKey: obj.type
                    }
                }
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    if( sessionStorage.neType != "G30" ) {
                        return false;
                    }
                    if (isEmpty(data.entityType) || ((data.hasOwnProperty("realtype") && data["realtype"] === "event") && isEmpty(data.detail))) return false;
                    let facilitiesTypes = getChildrenList("facilities");

                    return (facilitiesTypes.indexOf(data.entityType.toLowerCase()) > -1 ? true :
                        (Entity_RelatedService.indexOf(data.entityType) > -1 ?
                            ((data.entityType === "card" || data.entityType === "port") ? data.isLineCard : true) : false));
                },
                resetRelateCfg: function (data) {
                    const obj = getKeyFromResource(data.resource);
                    return {
                        keyType: "filter-ethzr-server",
                        keyValue: obj.keys,
                        containerKey: obj.type
                    }
                }
            }
        },
        "filter-facilities": {
            fix: true,
            type: "list",
            show: true,
            extendConfig: {
                relateShow: function (data) {
                    return (isEmpty(data.entityType) || ((data.hasOwnProperty("realtype") && data["realtype"] === "event") && isEmpty(data.detail))) ? false :
                        (Entity_RelatedFacility.indexOf(data.entityType) > -1 ?
                            ((data.entityType === "card" || data.entityType === "port") ? data.isLineCard : true) : false);
                },
                resetRelateCfg: function (data) {
                    const obj = getKeyFromResource(data.resource);
                    return {
                        keyType: "filter-facilities",
                        keyValue: obj.keys,
                    }
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {

                    return (data.hasOwnProperty("realtype") && data["realtype"] === "event" && data.hasOwnProperty("entityType") && data["entityType"] === "alarm");
                }
            },
            resetRelateCfg: function (data) {
                const obj = getKeyFromResource(data.resource);
                return {
                    keyType: "filter-alarm",
                    keyValue: obj.keys,
                }
            }
        },
    },
    "set-alarm-state": {
        "target": {
            type: FormControlTypeEnum.ChoiceRadio,
            needCommit: false,

            defaultValue: "",
            initValidators: {
                "notEmpty": {
                    message: function () {
                        return getText("error_required").format(getText("target"))
                    }
                }
            },
            disabled: 0
        },
        "all-alarms": {
            type: FormControlTypeEnum.Text,
            label: "All Alarms",
            fix: true,
            when: "",  //init
            emptyValue: {},
            initwhen: function (data) {
                return (data["target"] == null || data["target"] == "" || data["target"] === "all-alarms");
            },
            createInitConfig: function (data, callback) {
                // const _config = {
                //     defaultValue:"All Alarms"
                // }
                let _config = {};
                return _config
            },
            editInitConfig: function (data, callback) {

                let _config = {};
                return _config
            },
        },
        "alarm-id-list": {
            type: FormControlTypeEnum.MultiSelect,
            label: "Selected Alarms List",
            fix: true,
            when: "",  //init
            initwhen: function (data) {
                return (data["target"] == null || data["target"] === "alarm-id-list");
            },
            createInitConfig: function (data, callback) {
                let _config = {
                    enumValue: []
                };
                if (data != null) {
                    const enumList = [];
                    Object.values(data).map(alarm => {
                        enumList.push({
                            label: resource2KeyName(alarm["resource"]),
                            value: alarm["alarm-id"]
                        })
                    });
                    _config.enumValue = enumList;

                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    const enumList = [];
                    Object.values(data).map(alarm => {
                        enumList.push({
                            label: resource2KeyName(alarm["resource"]),
                            value: alarm["alarm-id"]
                        })
                    });
                    _config.enumValue = enumList;

                }
                return _config
            },
        },
    },
    "super-channel-group": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "stm": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "oc": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "super-channel": {
        // "name": {
        //     createInitConfig: function (data, callback) {
        //         if (data != null) {
        //             callback({
        //                 fixedValue: data["name"]
        //             })
        //         } else {
        //             callback({});
        //         }
        //     }
        // },
        "carrier-mode": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            "requires-confirmation": {
                fix: true,
                "when": "",
                "initwhen": function (data, config, callback) {
                    requestData({
                        select: ["status"],
                        from: "supported-carrier-mode",
                        where: {
                            card: {
                                name: data["supporting-card"]
                            },
                            "supported-carrier-mode": {
                                "carrier-mode": data["carrier-mode"]
                            }
                        }
                    }, function (rs) {
                        if (rs["supported-carrier-mode"] != null && rs["supported-carrier-mode"].length > 0) {
                            let status = rs["supported-carrier-mode"][0]["status"];
                            if (status == "candidate") {
                                callback(true, "This mode is not fully system tested for performance but only functionally tested. Do you understand the implications and wish to proceed? [y/n]")
                                return;
                            }
                            if (status == "deprecated") {
                                callback(true, "This mode is marked as deprecated, please consult documentation for details. Do you wish to proceed? [y/n]")
                                return;
                            }
                        }
                        callback(false)
                    })
                },
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null && data.hasOwnProperty("keys")) {
                    requestData({
                        from: "supported-carrier-mode",
                        where: {
                            card: {
                                name: data.keys["card"]["name"]
                            },

                        }
                    }, function (_rs) {
                        let _modelist = _rs["supported-carrier-mode"];
                        if (isNullOrUndefined(_modelist)) {
                            _modelist = [];
                        }
                        const enumList = [];
                        for (let i = 0; i < _modelist.length; i++) {
                            enumList.push({
                                label: _modelist[i]["carrier-mode"],
                                value: _modelist[i]["carrier-mode"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config);
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        from: "supported-carrier-mode",
                        where: {
                            card: {
                                name: data["supporting-card"]
                            },

                        }
                    }, function (_rs) {
                        let _modelist = _rs["supported-carrier-mode"];
                        if (isNullOrUndefined(_modelist)) {
                            _modelist = [];
                        }
                        const enumList = [];
                        for (let i = 0; i < _modelist.length; i++) {
                            enumList.push({
                                label: _modelist[i]["carrier-mode"],
                                value: _modelist[i]["carrier-mode"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            }
        },

        "carriers": {
            type: FormControlTypeEnum.MultiSelect,
            enumValue: [],
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null && data.hasOwnProperty("keys")) {
                    requestData({
                        select: ["unassigned-carriers"],
                        from: "resources",
                        rsKey: "unassigned-carriers",
                        where: {
                            card: {
                                name: data.keys["card"]["name"]
                            }
                        }
                    }, function (_rs) {
                        if (_rs.hasOwnProperty("capabilities")) {
                            _rs = _rs.capabilities[0].card;
                        }
                        let _modelist = _rs["unassigned-carriers"];

                        if (isNullOrUndefined(_modelist)) {
                            _modelist = [];
                        }
                        const enumList = [];
                        const requestParamter = [];
                        for (let i = 0; i < _modelist.length; i++) {
                            enumList.push({
                                label: _modelist[i],
                                value: _modelist[i]
                            })
                            requestParamter.push(
                                {
                                    select: ["AID", "openwave-contention-check"],
                                    from: "super-channel-group",
                                    where: {
                                        "super-channel-group": {
                                            "AID": _modelist[i].split("-").slice(0, 3).join("-"),
                                        }
                                    }
                                }
                            )
                        }
                        if (requestParamter.length > 0) {
                            requestDataQueue(requestParamter, function (_data) {
                                const scg = {}
                                for (let i = 0; i < _data.length; i++) {
                                    const _scg = _data[i]["super-channel-group"][0];
                                    scg[_scg.name] = _scg["openwave-contention-check"]
                                }
                                callback({
                                    enumValue: enumList,
                                    conditionData: {
                                        "super-channel-group": scg
                                    }
                                })
                            })
                        } else {
                            callback({
                                enumValue: enumList
                            })
                        }
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["supported-carriers"],
                        from: "resources",
                        rsKey: "supported-carriers",
                        where: {
                            card: {
                                name: data["supporting-card"]
                            }
                        }
                    }, function (_rs) {
                        if (_rs.hasOwnProperty("capabilities")) {
                            _rs = _rs.capabilities[0].card;
                        }
                        let _modelist = _rs["supported-carriers"];
                        if (isNullOrUndefined(_modelist)) {
                            _modelist = [];
                        }
                        const requestParamter = [];
                        const enumList = [];
                        for (let i = 0; i < _modelist.length; i++) {
                            enumList.push({
                                label: _modelist[i],
                                value: _modelist[i]
                            })
                            requestParamter.push(
                                {
                                    select: ["AID", "openwave-contention-check"],
                                    from: "super-channel-group",
                                    where: {
                                        "super-channel-group": {
                                            "AID": _modelist[i].split("-").slice(0, 3).join("-"),
                                        }
                                    }
                                }
                            )
                        }
                        if (requestParamter.length > 0) {
                            requestDataQueue(requestParamter, function (_data) {
                                const scg = {}
                                for (let i = 0; i < _data.length; i++) {
                                    const _scg = _data[i]["super-channel-group"][0];
                                    scg[_scg.name] = _scg["openwave-contention-check"]
                                }
                                callback({
                                    enumValue: enumList,
                                    conditionData: {
                                        "super-channel-group": scg
                                    }
                                })
                            })
                        } else {
                            callback({
                                enumValue: enumList
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                const field = "supported-facilities";
                const sfNameArray = [];
                if (treeObj[field] != null) {
                    const sfList = convertToArray(treeObj[field]);
                    for (let i = 0; i < sfList.length; i++) {
                        sfNameArray.push(resource2KeyName(sfList[i]))
                    }
                }
                return sfNameArray.join(",");
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    const sfList = convertToArray(data["supported-facilities"]);
                    const sfNameArray = [];
                    for (let i = 0; i < sfList.length; i++) {
                        sfNameArray.push(resource2KeyName(sfList[i]))
                    }
                    callback({
                        fixedValue: sfNameArray.join(",")
                    })
                } else {
                    callback({})
                }
            }
        },
        "contention-check-status": {
            "initwhen": function (data, config) {
                if (data.carriers == null || data.carriers === ""
                    || data.carriers === PLEASE_SELECT_VALUE || (data.carriers != null && data.carriers.length === 0)) {
                    return false;
                }
                let show = false;
                const _carriers = convertToArray(data.carriers)
                if (config.carriers.conditionData != null && config.carriers.conditionData["super-channel-group"] != null) {
                    for (let i = 0; i < _carriers.length; i++) {
                        const carriersID = _carriers[i].split("-").slice(0, 3).join("-");
                        if (config.carriers.conditionData["super-channel-group"].hasOwnProperty(carriersID)
                            && config.carriers.conditionData["super-channel-group"][carriersID] === "true") {
                            show = true;

                        }
                    }
                }
                return show;
            }
        },
        // "digital-trigger-registration" : {
        //     fix: true,
        //     type: "list",
        //     show: false,
        //     extendConfig: {
        //         relateShow: true
        //     }
        // },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "get-carriers": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                title: "carriers",
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "otu": {
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "otu-diagnostics": {
            extendConfig: {
                relateShow: true
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "otu-diagnostics": {
        "tti-mismatch-alarm-reporting": {
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["tti-style"] === "proprietary") {
                    return [
                        {
                            label: "disabled",
                            value: "disabled"
                        },
                        {
                            label: "full-64-bytes",
                            value: "full-64-bytes"
                        }
                    ]
                } else {
                    for (let i = 0; i < filterEnum.length; i++) {
                        if (filterEnum[i].value === "full-64-bytes") {
                            filterEnum.splice(i, 1);
                            break;
                        }
                    }
                    return filterEnum;
                }
            }
        }
    },
    "odu-diagnostics": {
        "tti-mismatch-alarm-reporting": {
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["tti-style"] === "proprietary") {
                    return [
                        {
                            label: "disabled",
                            value: "disabled"
                        },
                        {
                            label: "full-64-bytes",
                            value: "full-64-bytes"
                        }
                    ]
                } else {
                    for (let i = 0; i < filterEnum.length; i++) {
                        if (filterEnum[i].value === "full-64-bytes") {
                            filterEnum.splice(i, 1);
                            break;
                        }
                    }
                    return filterEnum;
                }
            }
        }
    },
    "trib-ptp": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function () {
                    return sessionStorage.neType === "G30"
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "carrier-neighbor": {
        "local-carrier": {
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["local-carrier"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["local-carrier"])
                    })
                } else {
                    callback({})
                }
            }
        },
    },
    "ethernet": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "client-type": {
            cellDataFun: function (treeObj) {
                return parseColonValues(treeObj["client-type"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["client-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "line-port": {
            type: FormControlTypeEnum.Select,
            editInitConfig: function (data, callback) {
                if (data != null) {
                    requestData({
                        "select": ["AID", "name"],
                        "from": "port",
                        "where": {
                            "card": {
                                "name": data["supporting-card"]
                            },
                            "port-type": "line"
                        }
                    }, function (rs) {
                        let rsList = [];
                        if (rs.port != null && rs.port.length > 0) {
                            rs.port.forEach(port => {
                                rsList.push({
                                    label: "port" + "-" + port.AID,
                                    value: port.name,
                                })
                            })
                        }
                        callback({
                            enumValue: rsList,
                        })
                    })
                }

            }
        },
        "time-slots": {
            type: FormControlTypeEnum.Select,
            afterUpdate: function (data, config) {
                if (data["line-port"] != null && config["allTimeSlotsMapping"][data["line-port"]] != null) {
                    if (data["time-slots"] !== PLEASE_SELECT_VALUE) {
                        let filterEnum = config["allTimeSlotsMapping"][data["line-port"]].enumValue;
                        let found = false;
                        for (let i = 0; i < filterEnum.length; i++) {
                            if (filterEnum[i].value === data["time-slots"]) {
                                found = true;
                            }
                        }
                        if (!found) {
                            data["time-slots"] = PLEASE_SELECT_VALUE;
                        }
                    }
                    return config["allTimeSlotsMapping"][data["line-port"]].enumValue;
                } else {
                    return null;
                }
            },
            createInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        total: data["total-time-slots"],
                        placeholder: getText("available-time-slots") + " " + data["available-time-slots"]
                    })
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {

                    requestData({

                        select: ["supporting-port", "total-time-slots", "available-time-slots"],
                        from: "eth-zr",
                        requestType: "cache",
                        where: {
                            "eth-zr": {
                                "supporting-card": data["supporting-card"],
                                // "supporting-port" : data["line-port"]
                            }
                        }
                    }, function (_rs) {
                        let enumList = [];
                        let total = 0;
                        let available = 0;
                        let allTimeSlots = {};
                        let speed = 0;
                        if (_rs.hasOwnProperty("eth-zr") && _rs["eth-zr"].length > 0) {
                            _rs["eth-zr"].forEach(item => {
                                if (item["supporting-port"] == data["line-port"]) {
                                    total = item["total-time-slots"];
                                    available = item["available-time-slots"];
                                    speed = item["speed"];
                                }
                                enumList = [];
                                if (item["available-time-slots"] !== 0 && item["available-time-slots"] !== "0") {
                                    let _rsList = item["available-time-slots"].split(",");

                                    for (let i = 0; i < _rsList.length; i++) {
                                        let tmpSlots = _rsList[i].split("..").sort((a, b) => a - b);
                                        let startNum = parseInt(tmpSlots[0]);
                                        let endNum = parseInt(tmpSlots[tmpSlots.length - 1]);
                                        for (let j = startNum; j <= endNum; j++) {
                                            enumList.push({
                                                label: j + "",
                                                value: j + ""
                                            })
                                        }

                                    }
                                }

                                if (data["speed"] === "400.000") {
                                    if ((item["supporting-port"] === data["line-port"]
                                        && !isNullOrUndefined(data["time-slots"]) && data["time-slots"] !== "")
                                        || enumList.length === 4) {
                                        enumList = [];
                                        let _value = data["time-slots"];
                                        if( isNullOrUndefined(data["time-slots"]) || data["time-slots"] === "" ) {
                                            _value = "1..4"
                                        }
                                        enumList.push({
                                            label: _value,
                                            value: _value
                                        })
                                    } else {
                                        enumList = [];
                                    }
                                } else {
                                    if (item["supporting-port"] === data["line-port"] &&
                                        !isNullOrUndefined(data["time-slots"]) && data["time-slots"] !== "") {
                                        enumList.push({
                                            label: data["time-slots"],
                                            value: data["time-slots"]
                                        })
                                    }
                                }
                                allTimeSlots[item["supporting-port"]] = {
                                    enumValue: enumList,
                                    total: item["total-time-slots"],
                                    placeholder: getText("available-time-slots") + " " + item["available-time-slots"]
                                }
                            })


                        }
                        callback({
                            enumValue: enumList,
                            total: total,
                            placeholder: getText("available-time-slots") + " " + available,
                            allTimeSlotsMapping: allTimeSlots
                        })
                    })
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
                return _config

            },
        },
        "fec-degraded-ser-monitoring": {
            "when": "../speed = '400.000'"
        },
        "fec-degraded-ser-activate-threshold": {
            "when": "../speed = '400.000'"
        },
        "fec-degraded-ser-deactivate-threshold": {
            "when": "../speed = '400.000'"
        },
        "fec-degraded-ser-monitoring-period": {
            "when": "../speed = '400.000'"
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function () {
                    return sessionStorage.neType === "G30"
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "odu": {
        "odu-type": {
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["odu-type"])
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            "set-on-create-only": false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supporting-facilities": {
            config: false,
            "set-on-create-only": false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "time-slot-granularity": {
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["time-slot-granularity"])
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "parent-odu": {
            createInitConfig: function (data, callback) {
                // requestData({
                //     select: ["name"],
                //     from: "odu",
                //     where: {
                //         "odu": {
                //             "class": "high-order"
                //         }
                //     }
                // }, function (_rs) {
                //     const enumList = [];
                //     const _rslist = convertToArray(_rs["odu"]);
                //     for (let i = 0; i < _rslist.length; i++) {
                //         enumList.push({
                //             label: _rslist[i]["name"],
                //             value: _rslist[i]["name"]
                //         })
                //     }
                //     let rsObj = {
                //         enumValue: enumList
                //     };
                //     if (data != null) {
                //         rsObj["fixedValue"] = data["name"]
                //     }
                //     callback(rsObj)
                // })
                const enumList = [];
                enumList.push({
                    label: data["name"],
                    value: data["name"]
                })
                callback({
                    enumValue: enumList,
                    fixedValue : data["name"]
                })
            }
        },
        "instance-id":{
            firstValidators: {
                "notRequired": {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                }
            }
        },
        "time-slots": {
            createInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        total: data["total-time-slots"],
                        placeholder: getText("available-time-slots") + " " + data["available-time-slots"]
                    })
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    requestData({
                        select: ["total-time-slots", "available-time-slots"],
                        from: "odu",
                        where: {
                            odu: {
                                name: data["parent-odu"]
                            }
                        }
                    }, function (_rs) {
                        let total = 0;
                        let available = 0;
                        if (_rs.hasOwnProperty("odu") && _rs["odu"].length > 0) {
                            total = _rs["odu"][0]["total-time-slots"];
                            available = _rs["odu"][0]["available-time-slots"];
                        }
                        callback({
                            total: total,
                            placeholder: getText("available-time-slots") + " " + available
                        })
                    })
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
            },
            type: FormControlTypeEnum.TribInput,
        },
        "opucn-time-slots": {
            createInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        total: data["total-time-slots"],
                        placeholder: getText("available-time-slots") + " " + data["available-time-slots"]
                    })
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    if (data["parent-odu"] != null) {
                        requestData({
                            select: ["total-time-slots", "available-time-slots"],
                            from: "odu",
                            where: {
                                odu: {
                                    name: data["parent-odu"]
                                }
                            }
                        }, function (_rs) {
                            let total = 0;
                            let available = 0;
                            if (_rs.hasOwnProperty("odu") && _rs["odu"].length > 0) {
                                total = _rs["odu"][0]["total-time-slots"];
                                available = _rs["odu"][0]["available-time-slots"];
                            }
                            callback({
                                total: total,
                                placeholder: getText("available-time-slots") + " " + available
                            })
                        })
                    } else {
                        callback({
                            total: data["total-time-slots"],
                            placeholder: getText("available-time-slots") + " " + data["available-time-slots"]
                        })
                    }
                } else {
                    callback({
                        total: 0,
                        placeholder: ""
                    });
                }
            },
            type: FormControlTypeEnum.TribInput,
        },
        "trib-port-number" : {
            afterUpdate: function (data, config) {
                if( data["parent-odu"] != null ) {
                    let max = null;
                    if( data["parent-odu"].indexOf("ODUC4") > -1 ) {
                        max = 80;
                    } else if( data["parent-odu"].indexOf("ODUC3") > -1 ) {
                        max = 60;
                    } else if( data["parent-odu"].indexOf("ODUC2") > -1 ) {
                        max = 40;
                    } else if( data["parent-odu"].indexOf("ODUC1") > -1 ) {
                        max = 20;
                    }
                    if( max != null ) {
                        return {
                            placeholder: getText("range") + ": " + "1.." + max,
                            validators: {
                                "between": {
                                    min: "1",
                                    max: max.toString(),
                                    message: function () {
                                        return getText("error.config.between").format(getText("trib-port-number"), 1, max)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "odu-diagnostics": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return true;
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "user": {
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },
    },
    "interface": {
        "protection-mode": {
            defaultValue: "protected",
            createInitConfig: function (data, callback) {
                if (data != null) {
                    const enumList = [];
                    enumList.push({
                        label: "protected",
                        value: "protected"
                    });
                    enumList.push({
                        label: "unprotected",
                        value: "unprotected"
                    });
                    callback({
                        enumValue: enumList
                    })
                } else {
                    callback({})
                }
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    const enumList = [];
                    enumList.push({
                        label: "protected",
                        value: "protected"
                    });
                    enumList.push({
                        label: "unprotected",
                        value: "unprotected"
                    });
                    callback({
                        enumValue: enumList
                    })
                } else {
                    callback({})
                }
            }
        },
        "ipv4-address": {
            extendConfig: {
                relateShow: true,
                title: "IPv4 Address",
            },

        },
        "ipv6-address": {
            extendConfig: {
                relateShow: true,
                title: "IPv6 Address",
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "sw-services": {
        "sw-service": {
            extendConfig: {
                title: "SW Service",
                relateShow: true,
            }
        }
    },
    "ikev2-local-instance": {
        "supporting-interface": {
            extendConfig: {
                relateShow: true,
            },
        },
        // "peer-authorization-database": {
        //     extendConfig: {
        //         relateShow: true,
        //     },
        // },
        "ikev2-peer": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        }
    },
    "ipv4-address": {
        "netmask": {
            editInitConfig : function(data,callback) {
                callback({
                    editEnable: false
                })
            }
        }
    },
    "supporting-interface": {
        "ipv4-endpoints": {
            extendConfig: {
                relateShow: true,
            },
        },
        "ipv6-endpoints": {
            extendConfig: {
                relateShow: true,
            },
        },
    },
    "ikev2-peer": {
        "peer-identity":{
            initmandatory : function(){
                return true;
            }
        },
        "local-identity" : {
            type: FormControlTypeEnum.TextSelect,
            enumValue: [],
            initmandatory : function(){
                return true;
            },
            createInitConfig: function (data, callback) {
               requestData({
                   select : ["ne-name"],
                   from : "ne"
               },function (rs) {
                   let v = rs.ne[0]["ne-name"] + "-" + data.keys["ikev2-local-instance"].name;
                   callback({
                       defaultValue : v,
                       enumValue: [
                           {
                                label : v,
                                value : v
                            }
                       ]
                   })
               })
                return {}
            }
        },
        "psk-ascii" : {
            when: "",
            initwhen: function (data) {
                return ("pre-shared-key" === data["authentication-scheme"])
            }
        },
        "ike-sa-proposal": {
            extendConfig: {
                fix: true,
                type: "list",
                relateShow: true,
            }
        },
        "security-policy-database": {
            extendConfig: {
                editShow: true
            }
        },
        "ipsec-spd-entry": {
            fix: true,
            type: "list",
            extendConfig: {
                relateShow: true,
            }
        }
    },
    "ike-sa-proposal": {
        "ryption-algorithm": {
            extendConfig: {
                relateShow: true,
            }
        }
    },
    // "security-policy-database": {
    //     "ipsec-spd-entry": {
    //         fix: true,
    //         type: "list",
    //         extendConfig: {
    //             relateShow: true,
    //         }
    //     }
    // },
    "ipsec-spd-entry": {
        "ipsec-sa-re-key": {
            extendConfig: {
                relateShow: true,
            }
        },
        "ipsec-sa-proposal": {
            extendConfig: {
                relateShow: true,
            }
        }
    },
    "ipsec-sa-proposal": {
        "encryption-algorithm": {
            extendConfig: {
                relateShow: true,
            }
        }
    },
    "secure-entity": {
        "supporting-facility":{
            type: FormControlTypeEnum.Select,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["name"],
                        from: "optical-carrier",
                        where: {
                            "optical-carrier": {
                                "carrier-type": "ICE6"
                            }
                        }
                    }, function (_data) {
                        const enumList = [];
                        const _rslist = convertToArray(_data["optical-carrier"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: "optical-carrier-" + _rslist[i]["name"],
                                value:  getEntityPathByKey("optical-carrier", {
                                "optical-carrier": {
                                    name: _rslist[i].name
                                }
                            }),
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facility"])
                    })
                } else {
                    callback({})
                }

            },
        }
    },
    "rib": {
        "route": {
            extendConfig: {
                relateShow: true,
            },
        },
    },
    "route": {
        "next-hop": {
            extendConfig: {
                relateShow: true,
            },
        },
    },
    "pm-profile-entry": {
        "resource-type": {
            cellDataFun: function (treeObj) {
                return parseColonValues(treeObj["resource-type"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["resource-type"])
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "period": {
            cellDataFun: function (treeObj) {
                return parseColonValues(treeObj["period"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["period"])
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "pm-threshold-profile": {
            extendConfig: {
                relateShow: true
            }
        },
        "default-tca-supervision": {
            when: "",  //init
            initwhen: function (data) {
                if (data["default-tca-supervision"] != null) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    },
    "pm-threshold-profile": {
        "parameter": {
            cellDataFun: function (treeObj) {
                return parseColonValues(treeObj["parameter"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["parameter"])
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "low-threshold": {
            "when" : "",
            "initwhen" : function(data) {
                return data["low-threshold"] != null
            },
            pattern: "^(na|([1-9][0-9]*|[0-9])(\\.\\d{1,17})?)$",
            warningMessage: "Low Threshold value must be a number (e.g. '12.34') or 'na' when threshold is not applicable.",
            editInitConfig: function (data, callback) {
                let _enum = [];
                if (data != null) {
                    getYangConfig("pm-threshold-profile")["low-threshold"].enumValue.forEach(item => {
                        if (item.value != "not-supported") {
                            _enum.push(item);
                        }
                    })
                    callback(
                        {
                            enumValue: _enum
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "high-threshold": {
            "when" : "",
            "initwhen" : function(data) {
                return data["high-threshold"] != null
            },
            pattern: "^(na|([1-9][0-9]*|[0-9])(\\.\\d{1,17})?)$",
            warningMessage: "High Threshold value must be a number (e.g. '12.34') or 'na' when threshold is not applicable.",
            editInitConfig: function (data, callback) {
                let _enum = [];
                if (data != null) {
                    getYangConfig("pm-threshold-profile")["high-threshold"].enumValue.forEach(item => {
                        if (item.value != "not-supported") {
                            _enum.push(item);
                        }
                    })
                    callback(
                        {
                            enumValue: _enum
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "units": {
            type: FormControlTypeEnum.Text,
            fix: true,
            "set-on-create-only": true,
            commitRequired: false
        }
    },
    "pm-resource": {
        "resource": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": resource2KeyName(data["resource"])
                        }
                    )
                } else {
                    callback({})
                }
            }
        },
        "resource-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["resource-type"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "supported-gauges": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["supported-gauges"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "supported-counters": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["supported-counters"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "pm-control-entry": {
            extendConfig: {
                relateShow: true
            }
        }
    },
    "pm-control-entry": {
        "period": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["period"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "supported-parameters": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["supported-parameters"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        },
        "tca-supervision": {
            when: "",
            initwhen: function (data) {
                if (data["tca-supervision"] != null) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    },
    "pm-threshold": {
        "parameter": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["parameter"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        }
    },
    "pm-parameter": {
        "parameter": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback(
                        {
                            "fixedValue": parseColonValues(data["parameter"])
                        }
                    )
                } else {
                    callback({});
                }
            }
        }
    },
    "xcon": {
        "card": {
            fix: true,
            needCommit: false,
            type: FormControlTypeEnum.Select,
            enumValue: [],
            createInitConfig: function (data, callback) {
                const enumList = [];
                requestData({
                    from: "card",
                    where: {
                        "card": {
                            "category": "line-card"
                        }
                    }
                }, function (rs) {
                    for (let i = 0; i < rs.card.length; i++) {
                        enumList.push({
                            label: "card-" + rs.card[i].name,
                            value: rs.card[i].name
                        })
                    }
                    callback({
                        enumValue: enumList
                    })
                });
                callback({
                    enumValue: enumList
                })
            }
        },
        "source": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["payload-type-filter"] && data["payload-type-filter"] !== PLEASE_SELECT_VALUE) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if( data["payload-type-filter"] === "OTU4") {
                            if (sessionStorage.neType === "G40") {
                                if (!(filterEnum[i].filter.indexOf(data["payload-type-filter"]) > -1 || filterEnum[i].oduType === "ODU4i")) {
                                    filterEnum.splice(i, 1);
                                }
                            }
                            if (sessionStorage.neType === "G30") {
                                if (!(filterEnum[i].filter.indexOf(data["payload-type-filter"]) > -1 || filterEnum[i].oduType === "ODU4")) {
                                    filterEnum.splice(i, 1);
                                }
                            }
                        } else if( data["payload-type-filter"] === "100G" ) {
                            if ( !(filterEnum[i].filter.indexOf(data["payload-type-filter"]) > -1 || filterEnum[i].oduType === "ODU4")) {
                                filterEnum.splice(i, 1);
                            }
                        } else if ( filterEnum[i].filter.indexOf(data["payload-type-filter"]) < 0) {
                            filterEnum.splice(i, 1);
                        }
                    }
                }
                if (data["card"] !== PLEASE_SELECT_VALUE) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].card != data["card"]) {
                            filterEnum.splice(i, 1);
                        }
                    }
                }

                if (data["destination"] !== PLEASE_SELECT_VALUE) {
                    this.afterUpdateFilter(data, filterEnum, "destination");
                }

                if (data["source"] !== PLEASE_SELECT_VALUE) {
                    let found = false;
                    for (let i = 0; i < filterEnum.length; i++) {
                        if (filterEnum[i].value === data["source"]) {
                            found = true;
                        }
                    }
                    if (!found) {
                        data["source"] = PLEASE_SELECT_VALUE;
                    }
                }
                return filterEnum;
            },
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            createInitConfig: function (data, callback) {
                callback([])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["source"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "destination": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["payload-type-filter"] && data["payload-type-filter"] !== PLEASE_SELECT_VALUE) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if( data["payload-type-filter"] === "OTU4") {
                            if (sessionStorage.neType === "G40") {
                                if (!(filterEnum[i].filter.indexOf(data["payload-type-filter"]) > -1 || filterEnum[i].oduType === "ODU4i")) {
                                    filterEnum.splice(i, 1);
                                }
                            }
                            if (sessionStorage.neType === "G30") {
                                if (!(filterEnum[i].filter.indexOf(data["payload-type-filter"]) > -1 || filterEnum[i].oduType === "ODU4")) {
                                    filterEnum.splice(i, 1);
                                }
                            }
                        } else if( data["payload-type-filter"] === "100G" ) {
                            if ( !(filterEnum[i].filter.indexOf(data["payload-type-filter"]) > -1 || filterEnum[i].oduType === "ODU4")) {
                                filterEnum.splice(i, 1);
                            }
                        } else if ( filterEnum[i].filter.indexOf(data["payload-type-filter"]) < 0) {
                            filterEnum.splice(i, 1);
                        }
                    }
                }
                if (data["card"] !== PLEASE_SELECT_VALUE) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].card != data["card"]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                }

                if (data["source"] !== PLEASE_SELECT_VALUE) {
                    this.afterUpdateFilter(data, filterEnum, "source");
                }

                if (data["destination"] !== PLEASE_SELECT_VALUE) {
                    let found = false;
                    for (let i = 0; i < filterEnum.length; i++) {
                        if (filterEnum[i].value === data["destination"]) {
                            found = true;
                        }
                    }
                    if (!found) {
                        data["destination"] = PLEASE_SELECT_VALUE
                    }
                }
                return filterEnum;
            },
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            createInitConfig: function (data, callback) {
                callback([])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["destination"])
                    })
                } else {
                    callback({})
                }
            },
        },
        "filter-object-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-equipment": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-facilities": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
        // "xcon-diagram-view" : {
        //     fix : true,
        //     type : "list",
        //     show  : false,
        //     extendConfig : {
        //         relateShow: true
        //     }
        // }
    },
    "lldp-neighbor": {
        "management-address": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "lldp-port": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["lldp-port"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "custom-tlv": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "lldp-port-statistics": {
        "lldp-port": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["lldp-port"])
                    })
                } else {
                    callback({})
                }
            }
        },
    },
    "optical-carrier": {
        "supporting-facilities": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "advanced-parameter": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    if (data["enable-advanced-parameters"] != null && data["enable-advanced-parameters"] === "true") {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        },
        "current-advanced-parameter": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function () {
                    return sessionStorage.neType === "G30"
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "advanced-parameter": {
        "definition": {
            "fix": true,
            "traffic-affecting": {
                "when": "",
                "fix": true,
                "affect": ["create", "edit", "delete"],
                "initwhen": function (data, config, callback) {
                    requestData({
                        select: ["service-impact"],
                        from: "golden-advanced-parameter",
                        where: {
                            "golden-advanced-parameter": {
                                "name": data.name
                            }
                        }
                    }, function (rs) {
                        if (rs["golden-advanced-parameter"] != null && rs["golden-advanced-parameter"].length > 0 &&
                            rs["golden-advanced-parameter"][0]["service-impact"] == "service-affecting") {
                            callback(true)
                        } else {
                            callback(false)
                        }
                    })
                }
            }
        },
        "name": {
            type: FormControlTypeEnum.TextSelect,
            enumValue: [],
            requestInitConfig: function (data, callback) {
                let parseValue = function (rs, enumList, key, callback) {
                    let _rsList = convertToArray(rs[key]);
                    _rsList.forEach(item => {
                        enumList.push({
                            label: item.name,
                            value: item.name,
                        })
                    })
                    callback({
                        enumValue: enumList
                    })
                }
                const _config = {
                    enumValue: []
                };
                let enumList = [];
                requestData({
                    select: ["name"],
                    from: "golden-advanced-parameter",
                }, function (_rs2) {
                    parseValue(_rs2, enumList, "golden-advanced-parameter", callback)
                })
                return _config
            }
        },
        "value": {
            type: FormControlTypeEnum.TextSelect,
            enumValue: [],
            sortFunc: function (a, b) {
                return parseInt(a.toString().split(",")[0].replace("[", "")) - parseInt(b.toString().split(",")[0].replace("[", ""));
            },
            "traffic-affecting": {
                "when": "",
                "initwhen": function (data, config, callback) {
                    callback(false)
                },
            },
            requestInitConfig: function (data, callback) {
                let getMultiplicityValue = function (v, multiplicity) {
                    if (multiplicity == null || multiplicity == 1) {
                        return v;
                    }
                    let vList = [];
                    for (let i = 0; i < multiplicity; i++) {
                        vList.push(v);
                    }
                    return "[" + vList.join(",") + "]";
                }

                let createItems = function (item, enumListKey, enumList, v) {
                    let _value = getMultiplicityValue(v, item["multiplicity"]);
                    if (enumListKey[item.name] == null || enumListKey[item.name].indexOf(_value) < 0) {
                        if (enumListKey[item.name] == null) {
                            enumListKey[item.name] = [];
                        }
                        enumListKey[item.name].push(_value);
                        enumList.push({
                            label: _value,
                            value: _value,
                            filterType: item.name
                        })
                    }
                }

                let parseValue = function (_rs, enumList, enumListKey, key, callback) {
                    if (_rs[key] != null) {
                        let _rsList = convertToArray(_rs[key]);
                        _rsList.forEach(item => {
                            let _values = item["supported-values"].split(",");
                            _values.forEach(subItem => {
                                if (subItem.indexOf("-") > -1) {
                                    let _tmp = subItem.split("-");
                                    let min = _tmp[0];
                                    let max = _tmp[1];
                                    for (let i = min; i <= max; i++) {
                                        createItems(item, enumListKey, enumList, i)
                                    }
                                } else {
                                    createItems(item, enumListKey, enumList, subItem)
                                }
                            })
                        })
                    }
                    if (callback != null) {
                        callback({
                            enumValue: enumList
                        })
                    }
                }

                const _config = {
                    enumValue: []
                };
                // requestData({
                //     select : ["name","supported-values"],
                //     from: "supported-advanced-parameter",
                // }, function (_rs) {
                let enumList = [];
                let enumListKey = {};
                // parseValue(_rs,enumList,enumListKey,"supported-advanced-parameter");
                requestData({
                    select: ["name", "supported-values", "multiplicity"],
                    from: "golden-advanced-parameter",
                }, function (_rs2) {
                    parseValue(_rs2, enumList, enumListKey, "golden-advanced-parameter", callback);
                })
                // })

                return _config
            },
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["name"] == null || data["name"] == PLEASE_SELECT_VALUE || data["name"].length == 0) {
                    return [];
                } else {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].filterType != data["name"]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                    return filterEnum
                }
            },
        }
    },
    "optical-channel": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "acknowledge-alarm": {
        "target": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: [
                        {
                            label: "All Alarms",
                            value: "all alarms"
                        }
                    ]
                };
                requestData({
                    from: "alarm",
                }, function (_rs) {
                    const enumList = [];
                    enumList.push({
                        label: "All Alarms",
                        value: "all alarms"
                    });
                    if (_rs.hasOwnProperty("alarm")) {
                        const data = convertToArray(_rs.alarm);
                        for (let i = 0; i < data.length; i++) {
                            if (data[i]["operator-state"] === "none") {
                                enumList.push({
                                    label: data[i].AID + " (" + parseColonValues(data[i]["alarm-type"]) + " of " + parseColonValues(data[i]["resource-type"]) + " on " + resource2KeyName(data[i]["resource"]) + ")",
                                    value: data[i]["alarm-id"]
                                })
                            }
                        }
                    }
                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            }
        },
        "acknowledge-text": {
            type: FormControlTypeEnum.TextArea,
            rows: 5,
        }
    },
    "trusted-certificate": {
        "certificate-bytes": {
            type: FormControlTypeEnum.TextArea,
            rows: 5,
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },
    },
    "local-certificate": {
        "certificate-bytes": {
            type: FormControlTypeEnum.TextArea,
            rows: 5,
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },
    },
    "peer-certificate": {
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
            }
        },
    },
    "chassis.inventory": {
        "actual-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["actual-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "chassis.inventory.current-fw": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return data.name == null || data.name.startsWith("chassis")
                },
                resetRelateCfg: function (data) {
                    return {
                        keyType: "chassis.inventory.current-fw",
                        keyValue: {
                            "chassis": {
                                "name": data.name.split("-")[1]
                            }
                        },
                        containerKey: "chassis.inventory.current-fw"
                    }
                }
            }
        },
        "slot.inventory.current-fw": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return data.name == null || data.name.startsWith("slot")
                },
                resetRelateCfg: function (data) {
                    return {
                        keyType: "slot.inventory.current-fw",
                        keyValue: {
                            "chassis": {
                                "name": data.name.split("-")[1]
                            },
                            "slot": {
                                "name": data.name.replace("slot-" + data.name.split("-")[1] + "-", "")
                            }
                        },
                        containerKey: "slot.inventory.current-fw"
                    }
                }
            }
        },
        "port.inventory.current-fw": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function (data) {
                    return data.name == null || data.name.startsWith("port")
                },
                resetRelateCfg: function (data) {
                    return {
                        keyType: "port.inventory.current-fw",
                        keyValue: {
                            "card": {
                                "name": data.name.split("-")[2]
                            },
                            "port": {
                                "name": data.name.split("-")[3]
                            }
                        },
                        containerKey: "port.inventory.current-fw"
                    }
                }
            }
        }
    },
    "supported-tom": {
        "tom-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["tom-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "PON": {
            cellDataFun: function (treeObj, field) {
                return parseListValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    const enumList = [], dataType = data["PON"],
                        dataArray = convertToArray(dataType);
                    for (let i = 0; i < dataArray.length; i++) {
                        enumList.push({
                            label: dataArray[i],
                            value: dataArray[i]
                        });
                    }
                    callback(
                        {
                            "enumValue": enumList,
                            "fixedValue": dataArray
                        }
                    )
                } else {
                    callback({});
                }
            }
        }
    },
    "real-time-pm": {
        "resource": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["resource"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "resource-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["resource-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "parameter": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["parameter"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "period": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["period"])
                    })
                } else {
                    callback({})
                }
            }
        }
    },
    "current-pm": {
        "resource": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["resource"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "resource-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["resource-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "parameter": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["parameter"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "period": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["period"])
                    })
                } else {
                    callback({})
                }
            }
        }
    },
    "history-pm": {
        "resource": {
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["resource"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "resource-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["resource-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "parameter": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["parameter"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "period": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["period"])
                    })
                } else {
                    callback({})
                }
            }
        }
    },
    "security-policies": {
        "default-user-group": {
            type: FormControlTypeEnum.MultiSelect,
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["name"],
                        from: "user-group",
                    }, function (_userData) {
                        const enumList = [];
                        const _rslist = convertToArray(_userData["user-group"]);
                        for (let i = 0; i < _rslist.length; i++) {
                            enumList.push({
                                label: _rslist[i]["name"],
                                value: _rslist[i]["name"]
                            })
                        }
                        callback({
                            enumValue: enumList
                        })
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        }
    },
    "comm-channel": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supporting-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj) {
                return resource2KeyName(treeObj["supported-facilities"]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "interface": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true,
                resetRelateCfg: function (data) {
                    return {
                        keyType: "interface",
                        keyValue: {
                            "interface": {
                                "if-name": resource2KeyName(data["supported-facilities"]).replace("interface-", "")
                            }
                        },
                        containerKey: "interface"
                    }
                }
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "ssh": {
        "post-login-message": {
            type: FormControlTypeEnum.TextArea,
            rows: 5,
        }

    },
    "line-ptp": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: function () {
                    return sessionStorage.neType === "G30"
                }
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "flexo": {
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "iid" : {
            type: FormControlTypeEnum.MultiSelect,
            enumValue: flexoiid(),
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "flexo-group": {
        "carriers": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null && data.hasOwnProperty("keys")) {
                    requestData({
                        select: ["unassigned-carriers"],
                        from: "resources",
                        rsKey: "unassigned-carriers",
                        where: {
                            card: {
                                name: data.keys["card"]["name"]
                            }
                        }
                    }, function (_rs) {
                        if (_rs["unassigned-carriers"] != null && _rs["unassigned-carriers"].length > 0) {
                            const enumList = [];
                            _rs["unassigned-carriers"].forEach(item => {
                                if (item == data.AID) {
                                    enumList.push({
                                        label: item,
                                        value: item
                                    })
                                }
                            })
                            callback({
                                enumValue: enumList
                            })
                        } else {
                            callback(_config)
                        }
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["supported-carriers"],
                        from: "resources",
                        rsKey: "supported-carriers",
                        where: {
                            card: {
                                name: data["supporting-card"]
                            }
                        }
                    }, function (_rs) {
                        if (_rs["unassigned-carriers"] != null && _rs["unassigned-carriers"].length > 0) {
                            const enumList = [];
                            _rs["unassigned-carriers"].forEach(item => {
                                if (item == data.AID) {
                                    enumList.push({
                                        label: item,
                                        value: item
                                    })
                                }
                            })
                            callback({
                                enumValue: enumList
                            })
                        } else {
                            callback(_config)
                        }
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "rate": {
            type: FormControlTypeEnum.Select,
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["modulation-format"] != null) {
                    if (data["modulation-format"] == "DP-16QAM") {
                        return [
                            {
                                label: "200.000",
                                value: "200.000"
                            },
                            {
                                label: "400.000",
                                value: "400.000"
                            }
                        ]
                    } else if (data["modulation-format"] == "DP-8QAM") {
                        return [
                            {
                                label: "200.000",
                                value: "200.000"
                            }, {
                                label: "300.000",
                                value: "300.000"
                            }
                        ]
                    } else if (data["modulation-format"] == "DP-QPSK") {
                        return [
                            {
                                label: "100.000",
                                value: "100.000"
                            }, {
                                label: "200.000",
                                value: "200.000"
                            }
                        ]
                    } else {
                        return filterEnum
                    }
                }
            },
            enumValue: [
                {
                    label: "100.000",
                    value: "100.000"
                }, {
                    label: "200.000",
                    value: "200.000"
                }, {
                    label: "300.000",
                    value: "300.000"
                }, {
                    label: "400.000",
                    value: "400.000"
                }
            ],
        },
        "filter-service": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
    },
    "eth-zr": {
        "carriers": {
            type: FormControlTypeEnum.Select,
            enumValue: [],
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null && data.hasOwnProperty("keys")) {
                    requestData({
                        select: ["unassigned-carriers"],
                        from: "resources",
                        rsKey: "unassigned-carriers",
                        where: {
                            card: {
                                name: data.keys["card"]["name"]
                            }
                        }
                    }, function (_rs) {
                        if (_rs["unassigned-carriers"] != null && _rs["unassigned-carriers"].length > 0) {
                            const enumList = [];
                            _rs["unassigned-carriers"].forEach(item => {
                                if (item == data.AID) {
                                    enumList.push({
                                        label: item,
                                        value: item
                                    })
                                }
                            })
                            callback({
                                enumValue: enumList
                            })
                        } else {
                            callback(_config)
                        }
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
            editInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                if (data != null) {
                    requestData({
                        select: ["supported-carriers"],
                        from: "resources",
                        rsKey: "supported-carriers",
                        where: {
                            card: {
                                name: data["supporting-card"]
                            }
                        }
                    }, function (_rs) {
                        if (_rs["unassigned-carriers"] != null && _rs["unassigned-carriers"].length > 0) {
                            const enumList = [];
                            _rs["unassigned-carriers"].forEach(item => {
                                if (item == data.AID) {
                                    enumList.push({
                                        label: item,
                                        value: item
                                    })
                                }
                            })
                            callback({
                                enumValue: enumList
                            })
                        } else {
                            callback(_config)
                        }
                    })
                } else {
                    callback(_config)
                }
                return _config
            },
        },
        "supporting-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supporting-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "supported-facilities": {
            config: false,
            cellDataFun: function (treeObj, field) {
                return resource2KeyName(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["supported-facilities"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "rate": {
            type: FormControlTypeEnum.Select,
            enumValue: [
                {
                    label: "400.000",
                    value: "400.000"
                }
            ],
        },
        "modulation-format": {
            requestInitConfig: function (data, callback) {
                callback({
                    enumValue: [{
                        label: "DP-16QAM",
                        value: "DP-16QAM"
                    }]
                })
            }
        },
        "filter-ethzr-server" : {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-alarm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-event": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-pm-control": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-real-time-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-current-pm": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-15min": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        },
        "filter-history-pm-24h": {
            fix: true,
            type: "list",
            show: false,
            extendConfig: {
                relateShow: true
            }
        }
    },
    "create-xcon": {
        "source-facility": {
            defaultValue: "src-existing-facility"
        },
        "destination-facility": {
            defaultValue: "dst-existing-facility"
        },
        "source": {
            type: FormControlTypeEnum.Select,
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["payload-type"] !== PLEASE_SELECT_VALUE) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].filter != null && filterEnum[i].filter.indexOf(data["payload-type"]) < 0) {
                            filterEnum.splice(i, 1);
                        }
                    }
                }

                // if (data["destination-facility"] === "dst-existing-facility" &&
                //     data["destination"] !== PLEASE_SELECT_VALUE) {
                //     let filterType = "odu";
                //     if (data["destination"].indexOf("/ioa-ne:odu") > -1) {
                //         filterType = "ethernet";
                //     }
                //     for (let i = filterEnum.length - 1; i >= 0; i--) {
                //         if (!filterEnum[i].label.startsWith(filterType)) {
                //             filterEnum.splice(i, 1);
                //         }
                //     }
                //
                // }

                // if (data["destination-facility"] === "dst-non-existing-facility") {
                //     let filterType = "ethernet";
                //     for (let i = filterEnum.length - 1; i >= 0; i--) {
                //         if (!filterEnum[i].label.startsWith(filterType)) {
                //             filterEnum.splice(i, 1)
                //         }
                //     }
                // }

                if (data["source"] !== PLEASE_SELECT_VALUE) {
                    let found = false;
                    for (let i = 0; i < filterEnum.length; i++) {
                        if (filterEnum[i].value === data["source"]) {
                            found = true;
                        }
                    }
                    if (!found) {
                        data["source"] = PLEASE_SELECT_VALUE;
                    }
                }
                return filterEnum;
            },
            createInitConfig: function (data, callback) {
                callback([])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["source"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "src-parent-odu": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                requestData([{
                    from: "odu",
                }], function (_rs) {
                    const enumList = [];
                    if (_rs.hasOwnProperty("odu")) {
                        const data = convertToArray(_rs.odu);
                        for (let i = 0; i < data.length; i++) {
                            if (data[i]["class"] === "high-order") {
                                enumList.push({
                                    label: "odu-" + data[i].name + " (" + parseFloat(data[i].rate) + "G)",
                                    value: data[i].name,
                                    rate: parseFloat(data[i].rate) + "GBE",
                                    card: data[i]["supporting-card"]
                                })
                            }
                        }
                    }
                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["src-parent-odu"])
                    })
                } else {
                    callback({})
                }
            },
        },
        "destination": {
            type: FormControlTypeEnum.Select,
            afterUpdate: function (data, config) {
                if (config.enumValue == null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if (data["payload-type"] !== PLEASE_SELECT_VALUE) {
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if (filterEnum[i].filter != null && filterEnum[i].filter.indexOf(data["payload-type"]) < 0) {
                            filterEnum.splice(i, 1)
                        }
                    }
                }
                //
                // if (data["source-facility"] === "src-existing-facility" &&
                //     data["source"] !== PLEASE_SELECT_VALUE) {
                //     let filterType = "odu";
                //     if (data["source"].indexOf("/ioa-ne:odu") > -1) {
                //         filterType = "ethernet";
                //     }
                //     for (let i = filterEnum.length - 1; i >= 0; i--) {
                //         if (!filterEnum[i].label.startsWith(filterType)) {
                //             filterEnum.splice(i, 1)
                //         }
                //     }
                // }
                //
                // if (data["source-facility"] === "src-non-existing-facility") {
                //     let filterType = "ethernet";
                //     for (let i = filterEnum.length - 1; i >= 0; i--) {
                //         if (!filterEnum[i].label.startsWith(filterType)) {
                //             filterEnum.splice(i, 1)
                //         }
                //     }
                // }

                if (data["destination"] !== PLEASE_SELECT_VALUE) {
                    let found = false;
                    for (let i = 0; i < filterEnum.length; i++) {
                        if (filterEnum[i].value === data["destination"]) {
                            found = true;
                        }
                    }
                    if (!found) {
                        data["destination"] = PLEASE_SELECT_VALUE
                    }
                }
                return filterEnum;
            },
            createInitConfig: function (data, callback) {
                callback([])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["destination"])
                    })
                } else {
                    callback({})
                }
            },
        },
        "dst-parent-odu": {
            type: FormControlTypeEnum.Select,
            createInitConfig: function (data, callback) {
                const _config = {
                    enumValue: []
                };
                requestData([{
                    from: "odu",
                }], function (_rs) {
                    const enumList = [];
                    if (_rs.hasOwnProperty("odu")) {
                        const data = convertToArray(_rs.odu);
                        for (let i = 0; i < data.length; i++) {
                            if (data[i]["class"] === "high-order") {
                                enumList.push({
                                    label: "odu-" + data[i].name + " (" + parseFloat(data[i].rate) + "G)",
                                    value: data[i].name,
                                    rate: parseFloat(data[i].rate) + "GBE",
                                    card: data[i]["supporting-card"]
                                })
                            }
                        }
                    }
                    callback({
                        enumValue: enumList
                    })
                })
                return _config
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: resource2KeyName(data["src-parent-odu"])
                    })
                } else {
                    callback({})
                }
            },
        },
        "src-instance-id":{
            firstValidators: {
                "notRequired": {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                }
            }
        },
        "dst-instance-id":{
            firstValidators: {
                "notRequired": {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                }
            }
        }
    },
    "manual-switchover": {
        "resource": {
            config: false,
            type: FormControlTypeEnum.Select,
            // defaultValue: function (data) {
            //     return resource2KeyName(data["resource"]);
            // }
            enumValue : [],
            createInitConfig: function (data, callback) {
                callback({
                    enumValue: [{
                        label : "card-" + data.keys.card.name,
                        value : getEntityPathByKey("card", data.keys)
                    }]
                })
            }
        }
    },
    "tom-type": {
        "tom-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["tom-type"])
                    })
                } else {
                    callback({})
                }
            }
        }
    },
    "alarm-inventory" : {
        "alarm-type" : {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field])
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["alarm-type"])
                    })
                } else {
                    callback({})
                }
            }
        },
        "resource-type": {
            cellDataFun: function (treeObj, field) {
                return parseColonValues(treeObj[field]);
            },
            editInitConfig: function (data, callback) {
                if (data != null) {
                    callback({
                        fixedValue: parseColonValues(data["resource-type"])
                    })
                } else {
                    callback({})
                }
            }
        }
    }
};

/**
 * set the group for create/edit dialog.
 * {
 *     head : ["alias-name"] //if the head line has input need.
 *     itesm : [
 *         {
 *             groupName : "xxx",
 *             itesm : ["xxx1","xxx2"....]
 *         }
 *     ]
 * }
 *
 */
const YangUserGroupDefine = {
    "ping": {
        items: [
            {
                items: ["ping-count", "ping-timeout", "ping-pktsize", "ping-dest"]
            },
            {
                items: ["source", "ping-interface", "ping-vrf"]
            },
        ]
    },
    "traceroute": {
        items: [
            {
                items: ["tr-hopcnt", "tr-timeout", "tr-pktsize", "tr-dest"]
            },
            {
                items: ["source", "tr-interface", "tr-vrf"]
            },
        ]
    },
    "interface": {
        items: [
            {
                items: ["if-name", "if-description", "if-type", "supporting-port", "vrf"]
            },
            {
                groupName: "Status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "IP Address",
                items: ["ipv4-enable", "ipv4-address-assignment", "ipv6-enable", "ipv6-address-assignment"]
            },
        ]
    },
    "download": {
        items: [
            {
                items: ["filetype", "certificate-name", "passphrase", "unattended", "async", "start-time", "sanity-check-override", "skip-secure-verification", "db-passphrase","white-listed"]
            },
            {
                items: ["target", "source", "password", "file-server", "path","destination"]
            },

        ]
    },
    "upload": {
        items: [
            {
                items: ["filetype", "async", "debug-entity", "period", "log-file-list", "start-time", "db-instance", "skip-secure-verification", "db-passphrase"]
            },
            {
                items: ["target", "destination", "password", "file-server", "path"]
            },

        ]
    },
    "card": {
        items: [
            {
                items: ["name", "chassis-name", "slot-name", "required-type", "required-subtype", "AID", "alias-name", "label", "category", "alarm-report-control"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "power",
                items: ["max-power-draw"]
            },
            {
                groupName: "last-reboot",
                items: ["last-reboot-reason", "last-reboot-time"]
            }
        ]
    },
    "ne": {
        items: [
            {
                groupName: "info",
                items: ["ne-id", "ne-name", "label", "ne-type", "ne-vendor", "clli", "node-controller-chassis-name", "contact"]
            },
            {
                groupName: "location",
                items: ["ne-site", "ne-location", "ne-sub-location", "altitude", "latitude", "longitude"]
            },
            {
                groupName: "state",
                items: ["equipment-discovery-ready", "alarm-report-ready", "alarm-report-control", "oper-state", "avail-state"]
            },
            {
                groupName: "recover-status",
                items: ["recover-mode", "original-recover-mode-reason", "recover-mode-reason"]
            }

        ]

    },
    "chassis": {
        items: [
            {
                items: ["name", "required-type", "AID", "alias-name", "label", "is-node-controller", "category", "chassis-location", "rack-name", "position-in-rack", "alarm-report-control","no-switchover","active-controller-slot"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "power",
                items: ["current-estimated-power-draw", "configured-max-power-draw", "max-available-draw", "available-power", "power-redundancy", "configured-ambient-temperature"]
            },
            {
                groupName: "pem",
                items: ["expected-pem-type", "expected-fan-type", "pem-under-voltage-threshold", "pem-over-voltage-threshold"]
            },
        ]
    },
    "port": {
        items: [
            {
                items: ["name", "port-type", "tom", "hosted-facilities", "AID", "alias-name", "label", "required-type", "parent-port", "actual-type", "alarm-report-control", "hosted-facility", "hosted-interface", "supported-type", "connected-to","subport-list"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            }
        ]
    },
    "super-channel-group": {
        items: [
            {
                items: ["name", "index", "AID", "label", "auto-in-service-enabled", "valid-signal-time", "remaining-valid-signal-time", "alarm-report-control", "line-system-mode", "openwave-contention-check", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "power",
                items: ["power-control-mode", "required-rx-power-offset", "required-tx-power-offset", "actual-rx-power-offset", "actual-tx-power-offset", "expected-total-tx-power"]
            },
            {
                groupName: "tti",
                items: ["rx-tti", "tx-tti", "expected-tti"]
            }
        ]
    },
    "super-channel": {
        items: [
            {
                items: ["name", "carriers", "carrier-mode", "capacity", "client-mode", "baud-rate", "application", "index", "AID", "label", "spectral-bandwidth", "alarm-report-control", "contention-check-status", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "tti",
                items: ["rx-tti", "tx-tti", "expected-tti"]
            }
        ]
    },
    "otu": {
        items: [
            {
                items: ["name", "index", "AID", "label", "otu-type", "otu-name", "rate", "service-mode", "service-mode-qualifier", "degrade-interval", "degrade-threshold", "alarm-report-control", "loopback", "loopback-mode", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "FEC",
                items: ["fec-mode", "fec-generation-mode", "fec-type"]
            },
            {
                groupName: "tti-trace",
                items: ["tti-style", "tti-mismatch-alarm-reporting", "expected-tti", "expected-sapi", "expected-dapi", "expected-operator", "facility-monitoring-mode", "terminal-monitoring-mode", "tx-tti", "rx-tti", "tx-sapi", "tx-dapi", "tx-operator", "rx-sapi", "rx-dapi", "rx-operator"]
            }
        ]
    },
    "odu": {
        items: [
            {
                items: ["name", "index", "AID", "label", "odu-type", "odu-name", "parent-odu", "rate", "instance-id", "time-slots","trib-port-number","opucn-time-slots", "total-time-slots", "available-time-slots", "service-mode", "service-mode-qualifier", "class", "alarm-report-control", "loopback", "loopback-mode","degrade-interval", "degrade-threshold","rx-payload-type","tx-payload-type","expected-payload-type","delay-measurement-enable", "msim-config","client-signal-type","client-defect-indicator","managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "tti-trace",
                items: ["tti-style", "tti-mismatch-alarm-reporting", "expected-tti", "expected-sapi", "expected-dapi", "expected-operator", "facility-monitoring-mode", "terminal-monitoring-mode", "tx-tti", "rx-tti", "tx-sapi", "tx-dapi", "tx-operator", "rx-sapi", "rx-dapi", "rx-operator"]
            }
        ]
    },
    "optical-channel": {
        items: [
            {
                items: ["name", "index", "AID", "label", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            }
        ]
    },
    "optical-carrier": {
        items: [
            {
                items: ["name", "index", "AID", "label", "carrier-type","rate", "alarm-report-control", "enable-advanced-parameters", "tx-power", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                items: ["frequency", "frequency-offset", "actual-frequency", "rx-frequency", "actual-rx-frequency", "wavelength", "modulation-format",
                    "line-encoding", "rate-class", "laser-enable", "propagate-shutdown", "propagate-shutdown-holdoff-timer",]
            },
            {
                items: ["tx-cd", "dgd-high-threshold", "post-fec-q-sig-deg-threshold", "post-fec-q-sig-deg-hysteresis", "loopback",
                    "actual-tx-optical-power", "rx-attenuation", "tx-filter-roll-off",
                    "preemphasis", "preemphasis-value", "DGD", "CD", "OSNR", "Q-factor", "pre-fec-ber", "cd-range-low", "cd-range-high", "cd-compensation-mode", "cd-compensation-value", "fast-sop-mode",
                    "BICHM"]
            },
            {
                groupName: "fec",
                items: ["pre-fec-q-sig-deg-threshold", "pre-fec-ber-sig-deg-threshold", "pre-fec-q-sig-deg-hysteresis", "pre-fec-ber-sig-deg-hysteresis"]
            }
        ]
    },
    "trib-ptp": {
        items: [
            {
                items: ["name", "index", "AID", "label", "service-type","auto-in-service-enabled", "valid-signal-time", "remaining-valid-signal-time", "alarm-report-control", "tributary-disable-action", "forward-defect-trigger", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "power",
                items: ["power-threshold-low", "power-threshold-low-offset", "power-threshold-high", "power-threshold-high-offset"]
            },
            {
                groupName: "TDA",
                items: ["tda-shutdown-holdoff-timer", "near-end-tda", "tda-degrade-mode"]
            }
        ]
    },
    "eth-zr": {
        items: [
            {
                items: ["name", "carriers", "rate", "modulation-format", "AID", "label", "alarm-report-control", "fec-type", "fec-mode", "total-time-slots", "available-time-slots", "fdd-threshold", "fed-threshold", "loopback", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
        ]
    },
    "line-ptp": {
        items: [
            {
                items: ["name", "index", "AID", "label", "service-type","auto-in-service-enabled", "valid-signal-time", "remaining-valid-signal-time", "alarm-report-control", "line-system-mode", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supported-facilities", "supporting-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "power",
                items: ["expected-total-tx-power", "required-rx-power-offset", "actual-rx-power-offset", "actual-tx-power-offset", "test-rx-power-offset"]
            },
        ]
    },
    "ethernet": {
        items: [
            {
                items: ["name", "index", "AID", "label", "mapping-mode", "tx-mapping-mode", "expected-mapping-mode", "line-port", "time-slots", "client-type", "service-mode", "service-mode-qualifier", "mtu", "speed",
                    "loopback", "loopback-mode", "alarm-report-control",  "status", "in-sync-seconds", "out-sync-seconds", "bit-errors","managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "lldp",
                items: ["lldp-admin-status", "lldp-ingress-mode", "lldp-egress-mode",]
            },
            {
                groupName: "FEC",
                items: ["fec-ability", "fec-mode", "fec-degraded-ser-monitoring", "fec-degraded-ser-activate-threshold", "fec-degraded-ser-deactivate-threshold",
                    "fec-degraded-ser-monitoring-period"]
            },
            {
                groupName: "test",
                items: ["test-signal-type", "test-signal-direction", "test-status","test-signal-monitoring"]
            }
        ]
    },
    "tom": {
        items: [
            {
                items: ["required-type", "required-subtype", "phy-mode", "AID", "alias-name", "label", "supported-phy-modes", "alarm-report-control", "enable-serdes","upgrade-status","power-class-override"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "test",
                items: ["test-signal-type", "test-signal-direction", "test-status","test-signal-monitoring"]
            }
        ]
    },
    "oc" : {
        items: [
            {
                items: ["name", "AID", "label", "oc-type","rate","supporting-card","supporting-port", "supporting-facilities","supported-facilities","tx-mapping-mode","expected-mapping-mode","service-mode","service-mode-qualifier","loopback","alarm-report-control","managed-by"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            },
            {
                groupName: "tti",
                items: ["rx-tti", "tx-tti","rx-tti-hex", "expected-tti"]
            },
            {
                groupName: "test",
                items: ["test-signal-type", "test-signal-direction", "test-signal-monitoring"]
            }
        ]
    },
    "alarm": {
        items: [
            {
                items: ["alarm-id", "resource", "resource-type", "AID", "label", "alarm-type", "alarm-type-description", "direction", "location", "perceived-severity", "reported-time", "service-affecting", "alarm-category", "additional-details", "corrective-action"]
            },
            {
                groupName: "Operator State",
                items: ["operator-state", "operator-text", "operator-name", "operator-last-action"]
            },
            {
                groupName: "Time",
                items: ["eventTime"]
            }
        ]
    },

    "set-alarm-state": {
        items: [
            {
                items: ["state", "acknowledge-text"]
            },
            {
                items: ["target", "all-alarms", "alarm-id-list"]
            }
        ]
    },

    "xcon": {
        items: [
            {
                groupName : "filter",
                items: ["payload-type-filter", "card"]
            },
            {
                items: ["name", "AID", "label", "source", "src-tpn","src-time-slots","destination","dst-tpn","dst-time-slots", "direction", "time-slots", "type", "payload-type","payload-treatment", "network-mapping", "protection-type", "circuit-id", "circuit-id-suffix", "signaling-type","from-adaptation","managed-by"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            }
        ]
    },

    "comm-channel": {
        items: [
            {
                items: ["name", "AID", "label", "type", "bandwidth", "alarm-report-control", "managed-by"]
            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            }
        ]
    },

    "ospf-instance": {
        items: [
            {
                items: ["instance-id", "router-id", "router-id-mode", "version", "description"]
            }
        ]
    },

    "flexo-group": {
        items: [
            {
                items: ["name", "carriers", "rate", "modulation-format", "group-id", "AID", "label", "fec-type", "rate-class", "alarm-report-control", "managed-by"]

            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            }
        ]
    },
    "flexo": {
        items: [
            {
                items: ["name", "AID", "label", "iid", "accepted-iid", "accepted-group-iid", "accepted-group-id", "fec-type", "foic-type", "alarm-report-control", "frequency-offset", "tx-cd", "dgd-high-threshold", "managed-by"]

            },
            {
                groupName: "supporting",
                items: ["supporting-card", "supporting-port", "supporting-facilities", "supported-facilities"]
            },
            {
                groupName: "status",
                items: ["admin-state", "oper-state", "avail-state"]
            }
        ]
    },
    "protection-group":{
        items: [
            {
                items: ["name", "AID", "label", "working-pu","protection-pu","protection-type", "pg-state","pg-request",
                    "switching-mode","reversion-mode","wtr-timer","hold-off-timer","remaining-wtr","last-switch-trigger","client-side-olos-trigger","client-side-sd-trigger"
                    ,"network-side-csf-trigger","alarm-report-control"
                ]

            }
        ]
    },
    "protection-unit":{
        items: [
            {
                items: ["name", "AID", "label", "transport-entity","state","role", "alarm-report-control"]

            }
        ]
    },
    "create-xcon": {
        items: [
            {
                items: ["payload-type", "direction", "label", "circuit-id-suffix"]
            }, {
                groupName: "source",
                items: ["source-facility", "source", "src-parent-odu", "src-time-slots", "src-instance-id"]
            }, {
                groupName: "destination",
                items: ["destination-facility", "destination", "dst-parent-odu", "dst-time-slots", "dst-instance-id"]
            }
        ]
    }
}

let mergeYangExpand = function () {
    YangUserDefine = extendCustomConfig(YangUserDefine, YangExpand[sessionStorage.neType]);
}

export {YangUserDefine, YangUserGroupDefine, FormControlTypeEnum, mergeYangExpand}
