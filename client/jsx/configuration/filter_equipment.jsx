import React from 'react';
import {deleteItem, detailsItem, editItem} from "../custom/comm/react_common";
import {
    checkUserClass,
    convertToArray,
    deepClone,
    EditBtnState,
    getKeyFromResource,
    getText,
    requestData,
    getEntityPathByKey,
    USER_CLASS_TYPE
} from "../custom/utils";
import CommonControl from "../custom/comm/index";
import {EventTypeEnum} from "../custom/message_util";
import {getYangConfig} from "../yangMapping";

let ReactSelectEdit = CommonControl.ReactSelectEdit;

let equipmentDataTools = {

    existEntitySource: [],

    getExecuteParameters: function (_data) {
        let requestKey = {};
        if (_data.type == "chassis") {
            requestKey[_data.type] = {
                name: _data.name
            }
        } else if (_data.type == "card") {
            requestKey[_data.type] = {
                name: _data.name
            }
        } else if (_data.type == "port") {
            requestKey = {
                "card": {
                    "name": _data["card-name"]
                },
                "port": {
                    "name": _data.name
                }
            }
        } else if (_data.type == "tom") {
            requestKey = {
                "card": {
                    "name": _data["card-name"]
                },
                "port": {
                    "name": _data["port-name"]
                }
            }
        }
        return requestKey;
    },

    getRequestParameters: function (type, config) {
        if (type == "chassis") {
            return {
                "from": "chassis",
                // "requestType" : "cache",
                "where": {
                    "chassis": {
                        "name": 1
                    }
                }
            }
        }
        if (type == "slot") {
            return {
                "from": "slot",
                // "requestType" : "cache",
                "where": {
                    "slot": {
                        "name": config.name
                    }
                }
            }
        }
        if (type == "card") {
            return {
                "from": "card",
                // "requestType" : "cache",
                "where": {
                    "card": {
                        "name": config["supporting-card"]
                    }
                }
            }
        }
        if (type == "port") {
            let supportPort = convertToArray(config["supporting-port"]);
            let rsList = [];
            for (let i = 0; i < supportPort.length; i++) {
                rsList.push({
                    "select": ["*", "tom"],
                    "from": "port",
                    // "requestType" : "cache",
                    "where": {
                        "card": {
                            "name": config["supporting-card"]
                        },
                        "port": {
                            "name": supportPort[i]
                        }
                    }
                })
            }
            return rsList;
        }
    },

    getEquipmentData: function (equipments, type, config, callback) {
        requestData(this.getRequestParameters(type, config), function (rs) {
            if (rs[type] != null && rs[type].length > 0) {
                rs[type].forEach(item => {
                    item["type"] = type;
                    if (type == "port") {
                        item["card-name"] = config["supporting-card"];
                    }
                    this.saveData(equipments, type, item)
                    if (item.hasOwnProperty("tom")) {
                        let _tom = item["tom"];
                        _tom["type"] = "tom";
                        _tom["card-name"] = config["supporting-card"];
                        _tom["port-name"] = item["name"];
                        this.saveData(equipments, type, _tom)
                    }
                })
            }
            callback();
        }.bind(this))
    },

    saveData: function (equipments, type, data) {
        if (this.existEntitySource.indexOf(type + "_" + data.AID) < 0) {
            if (type == "slot") {
                equipments.splice(1, 0, data);
            } else {
                equipments.push(data);
            }
            this.existEntitySource.push(type + "_" + data.AID)
        }
    },

    getParentEquipments: function (equipments, entitySource, callback) {
        let _entityObj = getKeyFromResource(entitySource);
        let _where = {};
        _where[_entityObj.type] = {
            "name": _entityObj.keys[_entityObj.type]["name"]
        }
        requestData({
            "requestType": "cache",
            "from": _entityObj.type,
            "where": _where
        }, function (rs) {
            this.getEquipmentData(equipments, "card", rs[_entityObj.type][0], function () {
                this.getEquipmentData(equipments, "port", rs[_entityObj.type][0], function () {
                    for (let i = 0; i < equipments.length; i++) {
                        if (equipments[i]["type"] == "card") {
                            let slotName = equipments[i]["slot-name"];
                            this.getEquipmentData(equipments, "slot", {name: slotName}, function () {
                                callback();
                            });
                            break;
                        }
                    }
                }.bind(this));
            }.bind(this))
        }.bind(this))
    },

    getEquipmentForProtection : function(protection,callback) {
        let equipments = [];
        this.getEquipmentData(equipments, "chassis", {}, function () {
            this.getParentEquipments(equipments, getEntityPathByKey("trib-ptp",{"trib-ptp" : {name : protection["working-pu"]}}), function () {
                this.getParentEquipments(equipments, getEntityPathByKey("trib-ptp",{"trib-ptp" : {name : protection["protection-pu"]}}), function () {
                    callback(equipments);
                });
            }.bind(this));
        }.bind(this))
    },

    getEquipmentForXcon: function (xcon, callback) {
        let equipments = [];
        this.getEquipmentData(equipments, "chassis", {}, function () {
            this.getParentEquipments(equipments, xcon.source, function () {
                this.getParentEquipments(equipments, xcon.destination, function () {
                    callback(equipments);
                });
            }.bind(this));
        }.bind(this))
    }

}

let filterEquipmentView = function (hashCodeStr) {

    return {
        "tableHead": {
            "type": {
                label: getText("type")
            },
            "admin-state": {
                cellDataFun: function (rowData, field, getSelectedFun) {
                    let _data = deepClone(rowData);
                    let saveParameters = {
                        "setKey": field,
                        "from": _data.type,
                        "initKeyData": equipmentDataTools.getExecuteParameters(_data)
                    }
                    let val = rowData[field];
                    let writeRole = checkUserClass(getYangConfig(_data.type), USER_CLASS_TYPE.write);
                    return <ReactSelectEdit value={val} enabled={writeRole} saveParameters={saveParameters}
                                            eventType={EventTypeEnum.RefreshTableData} getSelectedFun={getSelectedFun}
                                            hashCode={hashCodeStr}/>
                }
            }
        },
        "rowEdit": [
            {
                label: getText("edit"),
                buttonClass: {
                    normal: "row_edit_e",
                    disabled: "row_edit_e_disabled"
                },
                enabled: function (data) {
                    let yang = getYangConfig(data[0].type)
                    if (yang != null && yang["definition"] != null && yang["definition"]["config"] != null) {
                        return EditBtnState.Hidden
                    } else if (!checkUserClass(getYangConfig(data[0].type), USER_CLASS_TYPE.write)) {
                        return EditBtnState.Disabled
                    } else {
                        return EditBtnState.Normal;
                    }
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    let _data = data[0];
                    editItem(_data.type, {
                        initKey: equipmentDataTools.getExecuteParameters(_data)
                    }, hashCodeStr)
                }
            },
            {
                label: getText("detail"),
                enabled: function (data) {
                    let yang = getYangConfig(data[0].type)
                    if (yang != null && yang["definition"] != null && yang["definition"]["config"] != null) {
                        return EditBtnState.Normal
                    } else {
                        return EditBtnState.Hidden;
                    }
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    let _data = data[0];
                    detailsItem(_data.type, {
                        initKey: equipmentDataTools.getExecuteParameters(_data)
                    })
                },
                buttonClass: {
                    normal: "row_edit_d",
                    disabled: "row_edit_d_disabled"
                }
            },
            {
                label: getText("delete"),
                enabled: function (data) {
                    let yang = getYangConfig(data[0].type)
                    if (yang != null && yang["definition"] != null &&
                        (yang["definition"]["system-managed"] != null || yang["definition"]["config"] != null)) {
                        return EditBtnState.Disabled
                    } else if (!checkUserClass(getYangConfig(data[0].type), USER_CLASS_TYPE.write)) {
                        return EditBtnState.Disabled
                    } else {
                        return EditBtnState.Normal;
                    }
                },
                clickFunction: function (data, event) {
                    let _data = data[0];
                    deleteItem(_data.type, {
                        initKey: equipmentDataTools.getExecuteParameters(_data)
                    }, hashCodeStr)
                },
                buttonClass: {
                    normal: "row_delete",
                    disabled: "row_delete_disabled"
                }
            }
        ],
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                equipmentDataTools.existEntitySource = [];
                let _where = requestKey.where;
                if ( requestKey.hasOwnProperty("containerKey") ) {
                    if( requestKey.containerKey === "xcon" ) {
                        requestData({
                            // "requestType" : "cache",
                            "select": ["source", "destination"],
                            "from": "xcon",
                            "where": _where
                        }, function (rs) {
                            equipmentDataTools.getEquipmentForXcon(rs.xcon[0], callback)
                        })
                    } else if( requestKey.containerKey === "protection-group" ) {
                        requestData({
                            // "requestType" : "cache",
                            "select": ["working-pu", "protection-pu"],
                            "from": "protection-group",
                            "where": _where
                        }, function (rs) {
                            equipmentDataTools.getEquipmentForProtection(rs["protection-group"][0], callback)
                        })
                    }
                }

                return [];
            }
        }
    }
};

export {filterEquipmentView, equipmentDataTools};
