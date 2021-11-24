import React from 'react';
import CommonControl from "../custom/comm/index";
import {upDownFormatter4ReactTable,loopbackFormatter4ReactTable} from "./config_util";
import {
    callRpc,
    createItem,
    deleteItem,
    detailsItem,
    editItem,
    editRpcItem,
    refreshTableType,
    relateTable
} from "../custom/comm/react_common";
import {getRpcConfig, getYangConfig} from "../yangMapping";
import {
    checkUserClass,
    convertToArray,
    deepClone,
    defaultEnums,
    EditBtnState,
    EnvironmentConfig,
    formatByObject,
    getEntityPathByKey,
    getRelateTableKeys,
    getText,
    getYang,
    hashCode,
    isEmpty,
    isFunction,
    isNullOrUndefined,
    removeArrayItem,
    requestAxisoData, requestData,
    USER_CLASS_TYPE,
    xpath2IdPathNoSpace,
    xPathToKeys
} from "../custom/utils";
import treeConfig from "../../conf/treeConfig.json";
import {EventTypeEnum, MyReactEvents} from "../custom/message_util";

let {ReactCircleIconText, ReactTableEditButton, ReactSelectEdit} = CommonControl;

let tableConfig = {
    "facility": {
        name: "facility",
        buttons: {
            "chassis": {
                "create": false,
                "delete": false,
                "restart": false,
                "activate": false
            },
            "card": {
                "create": function (data) {
                    return actionConfig[sessionStorage.neType]["card"]["create"](data);
                },
                "delete": true,
                "restart": function (data) {
                    return data.rowData.category == "line-card" || data.rowData.category == "controller"
                },
                "activate": false
            },
            "port": {
                "create": function (data) {
                    if (data["port-type"] === "tributary") {
                        return !data.hasOwnProperty("childrenId");

                    } else {
                        return false;
                    }
                },
                "delete": false,
                "restart": false,
                "activate": false
            },
            "trib-ptp": {
                "create": false,
                "restart": false,
                "activate": false
            },
            "super-channel-group": {
                "delete": false,
                "create": false,
                "restart": false,
                "activate": false
            },
            "super-channel": {
                "create": false,
                "restart": false,
                "activate": false
            },
            "optical-channel": {
                "create": false,
                "delete": false,
                "restart": false,
                "activate": false
            },
            "comm-channel": {
                "activate": false
            },
            "otu": {
                "create": false,
                "delete": false,
                "restart": false,
                "activate": false
            },
            "odu": {
                "create": function (data) {
                    return data.rowData.hasOwnProperty("available-time-slots") || ( data.pathType && data.pathType.card === "gx:UCM4" && data.rowData.class != "low-order");
                    // return !isNullOrUndefined(data.rowData["available-time-slots"]) && data.rowData["available-time-slots"] != "";
                },
                "delete": function (data) {
                    return data.hasOwnProperty("_parentId") && data["_parentId"].startsWith("odu");
                },
                "restart": false,
                "activate": false
            },
            "optical-carrier": {
                "create": false,
                "restart": false,
                "activate": false
            },
            "line-ptp": {
                "create": function (data) {
                    return data.pathType != null && data.pathType["card"] === "gx:CHM1R" && !data.hasOwnProperty("childrenId");
                },
                "restart": false,
                "activate": false
            },
            "flexo-group": {
                "create": false,
                "restart": false,
                "activate": false,
            },
            "ethernet": {
                "create": false,
                "restart": false,
                "activate": false
            },
            "flexo": {
                "create": false,
                "restart": false,
                "activate": false
            },
            "eth-zr" : {
                "restart": false,
                "activate": false
            },
            "oc" : {
                "create": false,
            },
            "stm" : {
                "create": false,
            }
        }
    },
    "equipment": {
        name: "equipment",
        buttons: {
            "chassis": {
                "delete": false,
                "restart": false,
                "activate": false
            },
            "slot": {
                "create": function (data) {
                    return !data.hasOwnProperty("childrenId");
                },
                "activate": false
            },
            "card": {
                "create": false,
                "delete" : function (data) {
                    return actionConfig[sessionStorage.neType]["card"]["delete"](data);
                },
                "restart": function (data) {
                    return data.rowData.category == "line-card" || data.rowData.category == "controller"
                },
                "activate": false
            },
            "port": {
                "create": function (data) {
                    return actionConfig[sessionStorage.neType]["port"]["create"](data);
                },
                "delete": false,
                "restart": false,
                "activate": false
            },
            "tom": {
                "create": false,
                "restart": true,
                "activate":true
            }
        }
    }
}

let actionConfig = {
    "G30": {
        "card": {
            "delete" : function(data) {
                let requireType = data.rowData['required-type']
                return !( requireType === "gx:IOPANEL" || requireType === "gx:PEM" || requireType === "gx:FRCU31" || requireType === "gx:FAN" )
            },
            "create": function () {
                return false;
            }
        },
        "port": {
            "create": function (data) {
                if (data["port-type"] === "tributary" || data["port-type"] === "line") {
                    return !data.hasOwnProperty("childrenId");
                } else {
                    return false;
                }
            }
        },
        "line-ptp": {
            createType: ["flexo-group", "eth-zr"]
        },
        "optical-carrier" : {
            "typeConfig" : function (data) {
                return data["carrier-type"] + "(" + parseInt(data["rate"]) + "G)";
            }
        },
        "ethernet": {
            "typeConfig" : function(data) {
                return data["tx-mapping-mode"] + "(" + parseInt(data["speed"]) + "G)";
            }
        },
    },
    "G40": {
        "card": {
            "create": function (data) {
                if (EnvironmentConfig.formatLineCardType.indexOf(data["port-type"]) > -1) {
                    return data.rowData.resources != null && data.rowData.resources["unassigned-carriers"] != null && data.rowData.resources["unassigned-carriers"].length > 0;
                } else {
                    return false;
                }
            },
            "delete" : function(data) {
                let requireType = data.rowData['required-type']
                return !( requireType === "gx:XMM4-FAN" || requireType === "gx:FAN-CTRL" || requireType === "gx:FAN" )
            },
        },
        "port": {
            "create": function (data) {
                if (data["port-type"] === "tributary" || data["port-type"] === "uplink") {
                    return !data.hasOwnProperty("childrenId");
                } else {
                    return false;
                }
            }
        },
        "typeConfig": {
            "ethernet": function (data) {
                return parseInt(data["speed"]) + "G";
            }
        },
        "optical-carrier" : {
            "typeConfig" : function (data) {
                return data["carrier-type"];
            }
        },
        "ethernet": {
            "typeConfig" : function(data) {
                return parseInt(data["speed"]) + "G";
            }
        },
    }
}

let xPathTypeConfig = {
    "port": {
        "port-type": {
            "usb": "usb",
            "comm": "comm-eth"
        }
    }
}

/**
 * settings for getTypeValue
 * @type {{}}
 */
let typeConfig = {
    "super-channel": "carrier-mode",
    "trib-ptp": "service-type",
    "ethernet": function (data) {
        return actionConfig[sessionStorage.neType]["ethernet"]["typeConfig"](data)
    },
    "flexo-group": function (data) {
        return data["modulation-format"] + "(" + parseInt(data["rate"]) + "G)";
    },
    "line-ptp": "service-type",
    "optical-carrier" : function (data) {
        return actionConfig[sessionStorage.neType]["optical-carrier"]["typeConfig"](data)
    },
    "eth-zr": function (data) {
        return data["modulation-format"] + "(" + parseInt(data["rate"]) + "G)"
    },
    "tom" :  function (data) {
        return data["required-type"] + "(" + data["phy-mode"] + ")"
    },
    // "otu" : function (data) {
    //     return data["otu-type"] + "(" + parseInt(data["rate"]) + "G)";
    // },
    // "odu" : function (data) {
    //     return data["odu-type"] + "(" + parseInt(data["rate"]) + "G)";
    // }
}

let dataFormatterIdConfig = {
    "port": {
        "port-type": {
            "comm": "comm-eth",
            "usb": "usb"
        }
    }
}

let parseNextNodeType = function (treeJson, type, isEnd) {
    if (!isEnd && treeJson.hasOwnProperty("@nodeType") && treeJson["@nodeType"] === type) {
        if (treeJson.hasOwnProperty("@nextType")) {
            return treeJson["@nextType"];
        }
        let rs = parseNextNodeType(treeJson, type, true);
        if (rs != null) {
            return rs;
        }
    }
    for (let _key in treeJson) {
        if (!_key.startsWith("@")) {
            if (isEnd) {
                if (treeJson[_key].hasOwnProperty("@show") && treeJson[_key]["@show"] === "false") {
                    let rs = parseNextNodeType(treeJson[_key], type, true);
                    if (rs != null) {
                        return rs;
                    }
                } else if (treeJson[_key].hasOwnProperty("@create") && treeJson[_key]["@create"] === "false") {
                    // return parseNextNodeType(treeJson[_key], type, true);
                } else {
                    if (treeJson[_key].hasOwnProperty("@nodeType")) {
                        return treeJson[_key]["@nodeType"];
                    }
                    return _key;
                }
            } else {
                if (_key === type && treeJson.hasOwnProperty("@nextType")) {
                    return treeJson["@nextType"];
                }
                let rs = parseNextNodeType(treeJson[_key], type, (_key === type));
                if (rs != null) {
                    return rs;
                }
            }
        }
    }
}

function createObject(nextType, treeDataObj, tableHashCode, selectedData, attributes, EditApply, event, originalTreeData) {
    let init = {
        initKey: xPathToKeys(treeDataObj.rowData.xPathObj),
        initConfigData: treeDataObj.rowData,
        parentData : treeDataObj.rowData
    }
    if (actionConfig[sessionStorage.neType][nextType] != null && actionConfig[sessionStorage.neType][nextType]["createFun"] != null) {
        editRpcItem(actionConfig[sessionStorage.neType][nextType]["createFun"], init,
            {
                "tableHashCode": tableHashCode,
                "tableTable": refreshTableType.treeTable,
                "timeout": 2000
            })
    } else {
        createItem(nextType, init,
            {
                "tableHashCode": tableHashCode,
                "tableTable": refreshTableType.treeTable,
                "timeout": 2000
            })
    }
}

function editObject(treeDataObj, tableHashCode, selectedData, attributes, EditApply, event, originalTreeData) {
    let init = {
        initKey: xPathToKeys(treeDataObj.rowData.xPathObj),
        title: treeDataObj.nodeType === "tom" ? "tom-" + treeDataObj.AID : treeDataObj["_fId"]
    }
    if (treeDataObj.nodeType === "port") {
        if (treeDataObj["port-type"] === "usb") {
            init.helpString = "editusb";
        } else if (treeDataObj["port-type"] === "comm") {
            init.helpString = "editcommeth";
        }
    }

    if (treeDataObj.nodeType === "odu" && treeDataObj.rowData.class === "low-order") {
        init.helpString = "editloodu";
    }
    editItem(treeDataObj.nodeType, init
        , {
            "tableHashCode": tableHashCode,
            "tableTable": refreshTableType.treeTable,
            timeout: 2000
        })
}

function detailsObject(treeDataObj, tableHashCode, selectedData, attributes, EditApply, event, originalTreeData) {
    let init = {
        initKey: xPathToKeys(treeDataObj.rowData.xPathObj),
        title: treeDataObj["_fId"]
    }
    // let initConfig = initExtendsConfig(treeDataObj.nodeType,treeDataObj.rowData,originalTreeData);
    // if( !isEmptyObj(initConfig) ) {
    //     init["initConfig"] = initConfig;
    // }
    detailsItem(treeDataObj.nodeType, init
        , {
            "tableHashCode": tableHashCode,
            "tableTable": refreshTableType.treeTable
        })
}

function showRelateTable(treeDataObj) {
    let realType = null;
    if (xPathTypeConfig.hasOwnProperty(treeDataObj.nodeType)) {
        let _key = Object.keys(xPathTypeConfig[treeDataObj.nodeType])[0];
        if (treeDataObj.rowData.hasOwnProperty(_key) && xPathTypeConfig[treeDataObj.nodeType][_key].hasOwnProperty(treeDataObj.rowData[_key])) {
            realType = xPathTypeConfig[treeDataObj.nodeType][_key][treeDataObj.rowData[_key]];
        }
    }
    return relateTable(treeDataObj.nodeType, treeDataObj.rowData, treeDataObj.rowData.xPathObj, realType);
}

function defaultObject(treeDataObj, tableHashCode, selectedData, attributes, EditApply, event, originalTreeData) {
    let keys = xPathToKeys(treeDataObj.rowData.xPathObj);
    const resource = getEntityPathByKey(treeDataObj.nodeType, keys);
    callRpc("default", {
        'initData': {
            "entity-id": resource
        },
        'title': getText("confirm_default").format(treeDataObj["_fId"])
    }, {
        "tableHashCode": tableHashCode,
        "tableTable": refreshTableType.treeTable
    })
}

function restartObject(treeDataObj, tableHashCode, selectedData, attributes, EditApply, event, originalTreeData) {
    let keys = xPathToKeys(treeDataObj.rowData.xPathObj);
    const resource = getEntityPathByKey(treeDataObj.nodeType, keys);
    let initData = {
        'resource': resource
    };
    let init = {
        initKey: xPathToKeys(treeDataObj.rowData.xPathObj),
        'initData': initData,
        'title': getText("restart") + " " + treeDataObj["_fId"],
        helpString: "restart"
    }

    editRpcItem("restart", init, {
        "tableHashCode": tableHashCode,
        "tableTable": refreshTableType.treeTable
    }, function (_resultData) {
    });
}

let DNATestConfig = {
    "super-channel" : ["DLV"],
    "super-channel-group" : ["DLV"],
    "trib-ptp" : ["CLR","CDM"]
}

function DNATestEnable(type) {
    return navigator.userAgent.indexOf("dna") > -1 && DNATestConfig[type] != null;
    // return DNATestConfig[type] != null;
}

function DNATest(type,treeDataObj, tableHashCode) {
    requestData({
        select : ["ne-name"],
        from : "ne"
    },function (rs) {
        alert(type + " "+ rs.ne[0]["ne-name"] +" "+ treeDataObj.nodeType +" " + treeDataObj.rowData.AID )
    })
}

function activateFW(treeDataObj, tableHashCode, selectedData, attributes, EditApply, event, originalTreeData) {
    let keys = xPathToKeys(treeDataObj.rowData.xPathObj);
    const resource = getEntityPathByKey(treeDataObj.nodeType, keys);
    let initData = {
        'resource': resource
    };
    let init = {
        'initData': initData,
        'title': getText("activate-fw") + " " + treeDataObj["_fId"],
    }

    editRpcItem("activate-fw", init, {
        "tableHashCode": tableHashCode,
        "tableTable": refreshTableType.treeTable
    }, function (_resultData) {
    });
}

function deleteObject(treeDataObj, tableHashCode) {
    if (actionConfig[sessionStorage.neType][treeDataObj.nodeType] != null && actionConfig[sessionStorage.neType][treeDataObj.nodeType]["createFun"] != null) {
        callRpc(actionConfig[sessionStorage.neType][treeDataObj.nodeType]["deleteFun"], {
            'initData': {
                name: treeDataObj.rowData.name
            }
        }, {
            tableHashCode: tableHashCode
        })
    } else {
        deleteItem(treeDataObj.nodeType,
            {
                initData: treeDataObj.rowData,
                initKey: xPathToKeys(treeDataObj.rowData.xPathObj),
                title: treeDataObj.rowData._fId
            }, {
                "tableHashCode": tableHashCode,
                "tableTable": refreshTableType.treeTable
            })
    }
}

let createFacilityEditBtnConfigWithType = function (treeObj, stateType, parentNode, z) {

    return createEditBtnConfigWithType(treeObj, stateType, parentNode, tableConfig.facility)
}

let createEquipmentEditBtnConfigWithType = function (treeObj, stateType, parentNode) {
    return createEditBtnConfigWithType(treeObj, stateType, parentNode, tableConfig.equipment)
}

let buttonEnabled = function (buttonsConfig, type, _data, buttonType) {
    if (!buttonsConfig.hasOwnProperty(type)) {
        return true;
    }
    if (!buttonsConfig[type].hasOwnProperty(buttonType)) {
        return true;
    }
    let btconfig = buttonsConfig[type][buttonType];
    if (typeof btconfig == "string") {
        return btconfig;
    }
    if (isFunction(btconfig)) {
        return btconfig(_data);
    } else {
        return btconfig;
    }
}

let defaultButtonEnabled = function (buttonsConfig, type, _data, buttonType) {
    if (!buttonsConfig.hasOwnProperty(type)) {
        return false;
    }
    if (!buttonsConfig[type].hasOwnProperty(buttonType)) {
        return false;
    }
    let btconfig = buttonsConfig[type][buttonType];
    // console.log(btconfig)
    if (typeof btconfig == "string") {
        return btconfig;
    }
    if (isFunction(btconfig)) {
        return btconfig(_data);
    } else {
        return btconfig;
    }
}

let createEditBtnConfigWithType = function (treeObj, stateType, parentNode, tableConfig) {
    let type = treeObj.nodeType;
    let btnsArray = [];
    let _yang = getYang("yang");
    if (!_yang.hasOwnProperty(type)) {
        return btnsArray;
    }
    let buttonsConfig = tableConfig.buttons;

    //create
    if (buttonEnabled(buttonsConfig, type, treeObj, "create")) {
        let nextTypeList = [];
        if (actionConfig[sessionStorage.neType][type] != null && actionConfig[sessionStorage.neType][type]["createType"] != null) {
            nextTypeList = actionConfig[sessionStorage.neType][type]["createType"];
        } else {
            nextTypeList = convertToArray(parseNextNodeType(treeConfig[tableConfig.name]["ne"], type, false));
        }
        let items = [];
        nextTypeList.forEach(nextType => {
            treeObj.nextType = nextType;
            if (_yang[nextType]["definition"]["config"] == null || _yang[nextType]["definition"]["config"] === "true") {
                items.push(
                    {
                        onClick: createObject.bind(this, nextType),
                        normalClass: "row_create",
                        buttonLabel: getText("create"),
                        disabledClass: "row_create_disabled",
                        label: (getText("create") + " " + getText(nextType)),
                        enable: checkUserClass(getYangConfig(nextType), USER_CLASS_TYPE.write) ? EditBtnState.Normal : EditBtnState.Disabled
                    }
                );
            }
        })
        if (items.length == 1) {
            btnsArray.push(items[0]);
        }
        if (items.length > 1) {
            btnsArray.push(items);
        }
    }

    //edit
    if (!buttonsConfig.hasOwnProperty(type)
        || !buttonsConfig[type].hasOwnProperty("edit")
        || buttonsConfig[type]["edit"]) {
        if ((_yang[type]["definition"]["config"] == null || _yang[type]["definition"]["config"] === "true")
            && checkUserClass(getYangConfig(type), USER_CLASS_TYPE.write)) {
            btnsArray.push(
                {
                    onClick: editObject,
                    normalClass: "row_edit_e",
                    disabledClass: "row_edit_e_disabled",
                    label: getText("edit"),
                    enable: EditBtnState.Normal
                },
            );
        } else {
            btnsArray.push(
                {
                    onClick: detailsObject,
                    normalClass: "row_edit_d",
                    disabledClass: "row_edit_d_disabled",
                    label: getText("detail"),
                    enable: EditBtnState.Normal
                },
            );
        }
    }
    //delete
    if (buttonEnabled(buttonsConfig, type, treeObj, "delete")) {
        if ((_yang[type]["definition"]["config"] == null || _yang[type]["definition"]["config"] === "true")
            && (_yang[type]["definition"]["system-managed"] == null || typeof(_yang[type]["definition"]["system-managed"]) != "string" ||_yang[type]["definition"]["system-managed"] === "true")
            && (!treeObj.rowData.hasOwnProperty("managed-by") || treeObj.rowData["managed-by"] !== "system")) {
            btnsArray.push({
                onClick: deleteObject,
                normalClass: "row_delete",
                disabledClass: "row_delete_disabled",
                label: getText("delete"),
                enable: checkUserClass(getYangConfig(type), USER_CLASS_TYPE.write) ? EditBtnState.Normal : EditBtnState.Disabled
            });
        }
    }
    if (!buttonsConfig.hasOwnProperty(type)
        || !buttonsConfig[type].hasOwnProperty("default")
        || buttonsConfig[type]["default"]) {
        if ((_yang[type]["definition"]["config"] == null || _yang[type]["definition"]["config"] === "true")) {
            btnsArray.push({
                onClick: defaultObject,
                normalClass: "row_default",
                disabledClass: "row_default_disabled",
                label: getText("default"),
                enable: (checkUserClass(getRpcConfig("default"), USER_CLASS_TYPE.write) && checkUserClass(getYangConfig(type), USER_CLASS_TYPE.write)) ? EditBtnState.Normal : EditBtnState.Disabled
            });
        }
    }

    // restart
    if (defaultButtonEnabled(buttonsConfig, type, treeObj, "restart")) {
        if ((_yang[type]["definition"]["config"] == null || _yang[type]["definition"]["config"] === "true")
            && (_yang[type]["definition"]["system-managed"] == null || _yang[type]["definition"]["system-managed"] === "true")
            && (!treeObj.rowData.hasOwnProperty("managed-by") || treeObj.rowData["managed-by"] !== "system")) {
            btnsArray.push({
                onClick: restartObject,
                normalClass: "restart",
                disabledClass: "restart_disabled",
                label: getText("restart"),
                enable: checkUserClass(getRpcConfig("restart"), USER_CLASS_TYPE.write) ? checkRestartEnabled(type, treeObj.rowData) : EditBtnState.Disabled
            });
        }
    }
    //activate_fw
    if (defaultButtonEnabled(buttonsConfig, type, treeObj, "activate")) {
        if ((_yang[type]["definition"]["config"] == null || _yang[type]["definition"]["config"] === "true")) {
            btnsArray.push({
                onClick: activateFW,
                normalClass: "activate-file",
                disabledClass: "activate_disabled",
                label: getText("activate-fw"),
                enable: checkUserClass(getRpcConfig("activate-fw"), USER_CLASS_TYPE.write) ? checkActFWEnabled(type, treeObj.rowData) : EditBtnState.Disabled
            });
        }
    }


    if (getRelateTableKeys(getYangConfig(type), treeObj.rowData).length > 0) {
        if (!buttonsConfig.hasOwnProperty(type)
            || !buttonsConfig[type].hasOwnProperty("relate")
            || buttonsConfig[type]["relate"]) {
            btnsArray.push({
                type: "collapse",
                onClick: showRelateTable,
                normalClass: "row_expand",
                triggerClass: "row_contract",
                disabledClass: "row_expand_disabled",
                label: getText("relate"),
                enable: EditBtnState.Normal
            });
        }
    }

    if( DNATestEnable(type) ) {
        DNATestConfig[type].forEach(item=>{
            btnsArray.push({
                onClick: DNATest.bind(this,item),
                normalClass: "alarm-on",
                disabledClass: "alarm-on",
                label: getText(item),
                enable: EditBtnState.Normal
            });
        })

    }

    return btnsArray;
};

let checkRestartEnabled = function (type, data) {
    if (["card", "tom"].indexOf(type) > -1) {
        if (data["avail-state"].match("equipment-not-present")) {
            return EditBtnState.Disabled;
        }
    }
    return EditBtnState.Normal
}

let checkActFWEnabled = function (type, data) {
    if (["tom"].indexOf(type) > -1) {
        if (!isNullOrUndefined(data["required-type"]) && data["required-type"].indexOf("ZR")==-1) {
            return EditBtnState.Disabled;
        }
    }
    return EditBtnState.Normal
}

let editButtonFormatter = function (treeTableHashcode) {
    return function (data, field, selectedData, showDivId, config) {
        let btnHtml = [];
        let btnConfs = data[field]
        if (isNullOrUndefined(btnConfs)) {
            return btnHtml;
        }
        Object.keys(btnConfs).map(index => {
            btnHtml.push(<ReactTableEditButton key={data.id + "-" + index}
                                               keyName={data.id}
                                               tableHashCode={treeTableHashcode}
                                               showDivId={showDivId}
                                               conf={deepClone(btnConfs[index])}
                                               rowData={data}
                                               selectedData={selectedData}
            />);
        });
        return btnHtml;
    };
};

let getState = function (treeObj, field) {
    let rowData = treeObj.rowData;
    let state = rowData[field];
    if (isNullOrUndefined(state)) {
        return;
    }
    if (state instanceof Array) {
        rowData[field] = state[0];
        return state[0];
    } else {
        return state;
    }
};

let getTypeValue = function (treeObj, field) {
    let _type = "";
    let _nodeType = treeObj["nodeType"];
    if (typeConfig.hasOwnProperty(_nodeType)) {
        if (isFunction(typeConfig[_nodeType])) {
            _type = typeConfig[_nodeType](treeObj.rowData);
        } else {
            _type = treeObj.rowData[typeConfig[_nodeType]];
        }
    } else if (treeObj.rowData.hasOwnProperty(_nodeType + "-type")) {
        _type = treeObj.rowData[_nodeType + "-type"];
    } else if (treeObj.rowData.hasOwnProperty("required-type")) {
        _type = treeObj.rowData["required-type"];
    } else if (!isNullOrUndefined(treeObj.rowData[field])) {
        _type = getState(treeObj, field);
    }
    if (_type != null && _type.indexOf(":")) {
        _type = _type.substring(_type.indexOf(":") + 1);
    }
    return _type;
};


let newQueryFacilityData = function (columns, tableConfig) {
    return function (columns11, facData, callback) {
        let fac_dataJson = "";
        if (isNullOrUndefined(facData)) {
            getFacilityData(function (_data) {
                fac_dataJson = _data
                let tableId = "react-" + tableConfig.name + "-table",
                    hashCodeStr = hashCode(tableId);
                let message = EventTypeEnum.UpdateTreeTableOriginalData.format(hashCodeStr)
                MyReactEvents.emitEvent(message, fac_dataJson);
                makeFacilityTreeData(fac_dataJson, columns, tableConfig, callback);
            });
        } else {
            fac_dataJson = facData;
            makeFacilityTreeData(fac_dataJson, columns, tableConfig, callback);
        }
        return []
    }
};

let getFacilityData = function (callback) {
    requestAxisoData("/api/facility", "", (data) => {
        let fac_dataJson = null;
        if (data.hasOwnProperty("data") && data.data.length > 0) {
            fac_dataJson = data.data[0]["ne"];
        }
        parseFacilityNode(fac_dataJson);
        callback(fac_dataJson);
    });
}

let parseFacilityNode = function (facData) {
    if (typeof (facData) == 'number' || typeof (facData) == 'string' || facData.hasOwnProperty("@xmlns:gx")) {
        return;
    }
    for (let _key in facData) {
        if (typeof (facData[_key]) == 'string') {
            //nothing to do
        } else if (facData[_key].hasOwnProperty("@xmlns:gx")) {
            //nothing to do
        } else {
            let _list = convertToArray(facData[_key]);
            let _id = _key + "-" + "id";
            for (let i = 0; i < _list.length; i++) {
                if (_list[i].hasOwnProperty("name")) {
                    _list[i][_id] = _list[i]["name"];
                }
                parseFacilityNode(_list[i]);
            }
        }
    }

}

let makeFacilityTreeData = function (facData, columns, tableConfig, callback) {
    let rowData = null, field = null, sourceFun = null;
    let treeJson = treeConfig[tableConfig.name]["ne"];
    if (treeJson === null) {
        alert("can't found tree format xml file.")
        return;
    }
    let resultList = [];
    parseData("ne", treeJson, facData, null, [], {}, resultList, {}, {});

    Object.values(resultList).map(treeObj => {
        rowData = treeObj.rowData;
        Object.values(columns).map(config => {
            sourceFun = config["sourceFun"];
            field = config["field"];

            if (!isNullOrUndefined(sourceFun) && isFunction(sourceFun)) {
                let _v = sourceFun(treeObj, field, getParentTreeData(resultList, treeObj._parentId))
                if (!isNullOrUndefined(_v)) {
                    treeObj[field] = _v
                }
            } else {
                if (!isNullOrUndefined(rowData[field])) {
                    treeObj[field] = rowData[field];
                }
            }
        });
    });

    callback(resultList);
}

let getParentTreeData = function (treeData, _parentId) {
    for (let i = 0; i < treeData.length; i++) {
        if (treeData[i]["id"] == _parentId) {
            return treeData[i];
        }
    }
    return null;
}

/**
 * ReactSelectEdit demo how to define save function.
 * @param val
 * @param callBack
 let cellClickFunction = function(val, rowData, tableHashCode,callBack,errorCallback){
    // console.log("rowData",rowData)
    let _edit = {
        "edit": {
            "set":
                {
                    "admin-state": val
                }
            ,
            "from":rowData.nodeType,
            "where" : getRequestKeys(rowData.nodeType,xPathToKeys(rowData["rowData"]["xPathObj"]))
        }
    }

    editCommit(_edit, callBack,errorCallback);
};
 */

let upDownCheckFormatter = function (hashCodeStr) {
    return function (rowData, field, getSelectedFun, editDivID, config) {
        let val = rowData[field]
        if (isEmpty(val)) {
            return "";
        }
        if (!checkUserClass(getYangConfig(rowData.nodeType), USER_CLASS_TYPE.write)) {
            if (val == "true" || val == "enabled") {
                return <ReactCircleIconText color="color_green" text={getText(val)}/>;
            } else {
                return <ReactCircleIconText color={defaultEnums[val]} text={getText(val)}/>;
            }
        }

        let saveParameters = {
            "setKey": field,
            "from": rowData.nodeType,
            "initKeyData": xPathToKeys(rowData["rowData"]["xPathObj"])
        }
        // return <ReactSelectEdit value={val} saveFun={cellClickFunction} data={rowData}  getSelectedFun={getSelectedFun} hashCode={hashCodeStr} />
        return <ReactSelectEdit value={val} saveParameters={saveParameters}
                                eventType={EventTypeEnum.RefreshTreeTableData} getSelectedFun={getSelectedFun}
                                hashCode={hashCodeStr}/>
    }
};


let facilityTableView = function (hashCodeStr) {
    let options = {
        treeField: '_fId',
        columns: [
            {
                field: '_fId',
                title: getText("facility-path"),
                width: 300,
                align: 'left'
            },
            {
                field: 'port-type',
                sourceFun: getTypeValue,
                title: getText("type"),
                width: 100,
                align: 'left'
            },
            {
                field: "AID",
                title: getText("AID"),
                width: 70,
                align: 'left'
            },
            {
                field: 'alias-name',
                title: getText("alias-name"),
                width: 100,
                align: 'left'
            },
            {
                field: 'label',
                title: getText("label"),
                width: 100,
                align: 'left'
            },

            {
                field: 'admin-state',
                sourceFun: getState,
                title: getText("label.admin"),
                width: 60,
                minWidth: 94,
                align: 'left',
                formatter: upDownCheckFormatter(hashCodeStr),
            },
            {
                field: 'oper-state',
                sourceFun: getState,
                title: getText("label.oper"),
                width: 60,
                align: 'left',
                formatter: upDownFormatter4ReactTable(hashCodeStr),
            },
            {
                field: 'loopback',
                sourceFun: getState,
                title: getText("loopback"),
                width: 60,
                align: 'left',
                formatter: loopbackFormatter4ReactTable(hashCodeStr),
            },
            {
                field: 'editBtns',
                sourceFun: createFacilityEditBtnConfigWithType,
                title: "",
                width: 120,
                minWidth: 120,
                align: 'left',
                formatter: editButtonFormatter(hashCodeStr),
            }
        ]
    };
    return {
        options: options,
        buttons: [
            "expandAllButton",
            "collapseAllButton"
        ],
        getDataFun: newQueryFacilityData(options.columns, tableConfig.facility)
    }
};

let equipmentTableView = function (hashCodeStr) {
    let options = {
        treeField: '_fId',
        columns: [
            {
                field: '_fId',
                title: getText("equipment-path"),
                width: 200,
                align: 'left'
            },
            {
                field: 'port-type',
                sourceFun: getTypeValue,
                title: getText("type"),
                width: 100,
                align: 'left'
            },
            {
                field: "AID",
                title: getText("AID"),
                width: 70,
                align: 'left'
            },
            {
                field: 'alias-name',
                title: getText("alias-name"),
                width: 100,
                align: 'left'
            },
            {
                field: 'label',
                title: getText("label"),
                width: 100,
                align: 'left'
            },
            {
                field: 'admin-state',
                sourceFun: getState,
                title: getText("label.admin"),
                width: 60,
                minWidth: 94,
                align: 'left',
                formatter: upDownCheckFormatter(hashCodeStr),
            },
            {
                field: 'oper-state',
                sourceFun: getState,
                title: getText("label.oper"),
                width: 60,
                align: 'left',
                formatter: upDownFormatter4ReactTable(hashCodeStr),
            },
            {
                field: 'editBtns',
                sourceFun: createEquipmentEditBtnConfigWithType,
                title: "",
                width: 120,
                minWidth: 120,
                align: 'left',
                formatter: editButtonFormatter(hashCodeStr),
            }
        ]
    };
    return {
        options: options,
        buttons: [
            {
                key: "policies",
                label: "policies",
                onClick: function () {
                    editItem("equipment-policies", {
                        initKey: {}
                    })
                },
                enabled: function (data) {
                    return checkUserClass(getYangConfig("equipment-policies"), USER_CLASS_TYPE.write);

                },
            },
            "expandAllButton",
            "collapseAllButton"
        ],
        getDataFun: newQueryFacilityData(options.columns, tableConfig.equipment)
    }
};

let createNodeId = function (type, dataObj, key, idList, idObj, treeJson, important, cardmode) {
    let nodeId = null;
    let keyBefore = treeJson["@keyBefore"], keyAfter = treeJson["@keyAfter"];
    if (!isNullOrUndefined(keyBefore)) {
        keyBefore = Object.parseJSON(keyBefore);
        Object.keys(keyBefore).map(_k => {
            idList.push({[_k]: keyBefore[_k]});
            idObj[_k] = keyBefore[_k];
        });
    }
    switch (type) {
        default :
            nodeId = dataObj[key] || "";
            idList.push({[key]: nodeId});
            idObj[key] = nodeId;
            break;
    }
    if (!isNullOrUndefined(keyAfter)) {
        let keyAfterParam = JSON.parse(treeJson["@keyAfterParam"]);
        if (!isNullOrUndefined(keyAfterParam)) {
            let templateValue = {};
            Object.keys(keyAfterParam).map(_k => {
                templateValue[_k] = dataObj[keyAfterParam[_k]];
            });
            keyAfter = formatByObject(keyAfter, templateValue);
        }
        keyAfter = JSON.parse(keyAfter);
        Object.keys(keyAfter).map(_k => {
            idList.push({[_k]: keyAfter[_k]});
            idObj[_k] = keyAfter[_k];
        });
    }
};

let createDataFormatterId = function (type, fIdTemplate, fIdTemplateParam, nodeIdObj, dataBack) {
    let formatterId = "";
    if (isNullOrUndefined(fIdTemplateParam) || isNullOrUndefined(fIdTemplate)) {
        return formatterId;
    }
    let templateValue = {};
    let specialKey = null;
    let specialValue = [];
    if (dataFormatterIdConfig.hasOwnProperty(type)) {
        let _obj = dataFormatterIdConfig[type];
        specialKey = Object.keys(_obj)[0];
        specialValue = _obj[specialKey];
    }
    fIdTemplateParam = JSON.parse(fIdTemplateParam);
    Object.keys(fIdTemplateParam).map(key => {
        let field = fIdTemplateParam[key];
        if (isNullOrUndefined(nodeIdObj[field])) {
            if (!isNullOrUndefined(dataBack[field])) {
                if (specialKey != null && specialKey === field) {
                    if (specialValue.hasOwnProperty(dataBack[field])) {
                        templateValue[key] = specialValue[dataBack[field]];
                    } else {
                        templateValue[key] = type;
                    }
                } else {
                    templateValue[key] = dataBack[field];
                }
            } else {
                templateValue[key] = "null";
            }
        } else {
            templateValue[key] = nodeIdObj[field];
        }
    });
    formatterId = formatByObject(fIdTemplate, templateValue);
    return formatterId;
};
let createParentId = function (type, parentId, neData) {
    let _parentID = parentId;
    //todo
    return _parentID;
};


let parseData = function (type, treeJson, dataJson, parentId, idList, idObj, dataList, insertDataListObj, pathType) {
    if (dataJson != null && dataJson.hasOwnProperty("required-type")) {
        pathType[type] = dataJson["required-type"];
    }
    let nodeKey = treeJson["@key"] || type, isShow = treeJson["@show"],
        fIdTemplate = treeJson["@fid"], fIdTemplateParam = treeJson["@param"],
        nodeType = treeJson["@nodeType"], important = treeJson["@important"],
        cardmode = treeJson["@cardmode"], filter = treeJson["@filter"];
    if (filter != null) {
        let filterData = JSON.parse(filter);
        let accord = true;
        for (let _key in filterData) {
            accord = dataJson.hasOwnProperty(_key) && EnvironmentConfig[filterData[_key]].indexOf(dataJson[_key]) > -1;
            if (!accord) {
                return true;
            }
        }
    }

    let dataBack = deepClone(dataJson);
    let xPathList = [].concat(idList), xPathObj = deepClone(idObj);
    if (!treeJson.hasOwnProperty("@insertNode")) {
        createNodeId(type, dataBack, nodeKey, xPathList, xPathObj, treeJson, important, cardmode);
    }
    if (isNullOrUndefined(isShow) || isShow === "true") {

        let nodeObj = {};
        let _fId = createDataFormatterId(type, fIdTemplate, fIdTemplateParam, xPathObj, dataBack);
        dataBack._fId = _fId;
        dataBack.xPathList = xPathList;
        dataBack.xPathObj = xPathObj;
        nodeObj.rowData = dataBack;
        nodeObj.nodeType = nodeType || type;
        nodeObj.id = xpath2IdPathNoSpace(_fId);
        if (!isNullOrUndefined(parentId)) {
            nodeObj._parentId = createParentId(type, parentId, dataBack);
            let parentObj = getParentTreeData(dataList, nodeObj._parentId);
            // nodeObj.parentData = getParentTreeData(dataList, nodeObj._parentId);
            if (parentObj != null) {
                if (parentObj.hasOwnProperty("childrenId")) {
                    parentObj.childrenId.push(nodeObj.id);
                } else {
                    parentObj.childrenId = [];
                    parentObj.childrenId.push(nodeObj.id);
                }

            }
        }
        parentId = nodeObj.id;
        nodeObj["pathType"] = pathType;
        dataList.push(nodeObj);
    } else if (treeJson.hasOwnProperty("@insertData")) {
        let _fId = createDataFormatterId(type, fIdTemplate, fIdTemplateParam, xPathObj, dataBack);
        insertDataListObj[_fId] = {
            rowData: dataBack,
            xPathList: xPathList,
            xPathObj: xPathObj,
            nodeType: nodeType || type,
            id: xpath2IdPathNoSpace(_fId)
        }
    }
    let nodeKeyList = Object.keys(treeJson);
    removeArrayItem(nodeKeyList, "@nodeType");
    removeArrayItem(nodeKeyList, "@key");
    removeArrayItem(nodeKeyList, "@keyBefore");
    removeArrayItem(nodeKeyList, "@keyAfter");
    removeArrayItem(nodeKeyList, "@insertNode");
    removeArrayItem(nodeKeyList, "@dataPath");
    removeArrayItem(nodeKeyList, "@insertData");
    removeArrayItem(nodeKeyList, "@keyAfterParam");
    removeArrayItem(nodeKeyList, "@key");
    removeArrayItem(nodeKeyList, "@show");
    removeArrayItem(nodeKeyList, "@fid");
    removeArrayItem(nodeKeyList, "@param");
    Object.values(nodeKeyList).map(childKey => {
        delete dataBack[childKey];
        let children = dataJson[childKey];
        if (!isNullOrUndefined(children)) {
            if (children instanceof Array) {
                Object.values(children).map(data => {
                    parseData(childKey, treeJson[childKey], data, parentId, xPathList, xPathObj, dataList, insertDataListObj, deepClone(pathType));
                });
            } else {
                parseData(childKey, treeJson[childKey], children, parentId, xPathList, xPathObj, dataList, insertDataListObj, deepClone(pathType));
            }
        } else if (treeJson[childKey].hasOwnProperty("@insertNode")) {
            let _treeJson = treeJson[childKey];
            let _fId = createDataFormatterId(childKey, _treeJson["@dataPath"], _treeJson["@param"], xPathObj, dataJson);
            let _insertObj = insertDataListObj[_fId];
            if (_insertObj != null) {
                parseData(childKey, _treeJson, _insertObj.rowData, parentId, _insertObj.xPathList, _insertObj.xPathObj, dataList, insertDataListObj, deepClone(pathType));
            }
        }
    });
};

export {facilityTableView, equipmentTableView};
