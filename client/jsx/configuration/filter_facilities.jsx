import React from 'react';
import {deleteItem, editItem} from "../custom/comm/react_common";
import {
    checkUserClass,
    convertToArray,
    deepClone,
    EditBtnState, getEntityPathByKey,
    getKeyFromResource,
    getText,
    getYang,
    requestData,
    requestJson,
    USER_CLASS_TYPE
} from "../custom/utils";
import {getYangConfig} from "../yangMapping";
import {EventTypeEnum} from "../custom/message_util";
import CommonControl from "../custom/comm/index";

let ReactSelectEdit = CommonControl.ReactSelectEdit;

let facilitiesDataTools = {

    existEntitySource: [],

    getFacilitiesData: function (cardIDList, portIDList, callback) {
        let facilitiesTypes = getYang("yang")["facilities"];
        let teyps = [];
        for (let key in facilitiesTypes) {
            if (facilitiesTypes[key] == "list") {
                teyps.push(key);
            }
        }
        this.getFacilityData(teyps, cardIDList, portIDList, callback);
    },
    getFacilityData: function (types, cardIDList, portIDList, callback) {
        let requestList = [];
        for (let m = 0; m < types.length; m++) {
            for (let i = 0; i < cardIDList.length; i++) {
                if (portIDList != null) {
                    for (let j = 0; j < portIDList.length; j++) {
                        let _where = {};
                        _where[types[m]] = {
                            "supporting-card": cardIDList[i],
                            "supporting-port": portIDList[j]
                        }
                        requestList.push(
                            {
                                "requestType": "cache",
                                "from": types[m],
                                "where": _where
                            }
                        )
                    }
                } else {
                    let _where = {};
                    _where[types[m]] = {
                        "supporting-card": cardIDList[i],
                    }
                    requestList.push(
                        {
                            "requestType": "cache",
                            "from": types[m],
                            "where": _where
                        }
                    )
                }
            }
        }
        requestJson({
            "get": requestList
        }, function (rs) {
            let resultList = [];
            if (rs.data != null && rs.data.length > 0) {
                let _rs = rs.data[0];
                if (_rs.hasOwnProperty("ne") && _rs["ne"].hasOwnProperty("facilities")) {
                    let _facilities = _rs["ne"]["facilities"];
                    for (let _type in _facilities) {
                        let _objList = convertToArray(_facilities[_type]);
                        for (let i = 0; i < _objList.length; i++) {
                            let _obj = _objList[i];
                            _obj["type"] = _type;
                            resultList.push(_obj);
                        }
                    }
                }
            }
            callback(resultList)
        })
    },

    getParentFacilities: function (facilities, entitySource, callback) {
        if( entitySource === "" ) {
            callback();
            return;
        }
        let entitySourceList = convertToArray(entitySource);
        let executeEntitySource = entitySourceList.splice(0, 1)[0];
        if (this.existEntitySource.indexOf(executeEntitySource) < 0) {
            this.existEntitySource.push(executeEntitySource);
            let _entityObj = getKeyFromResource(executeEntitySource);
            if( _entityObj.type === "" ) {
                callback();
                return;
            }
            let _where = {};
            _where[_entityObj.type] = {
                "name": _entityObj.keys[_entityObj.type]["name"]
            }
            requestData({
                // "requestType" : "cache",
                "from": _entityObj.type,
                "where": _where
            }, function (rs) {
                let _obj = rs[_entityObj.type][0];
                _obj.type = _entityObj.type;
                facilities.push(_obj);
                if (_obj["supporting-facilities"] != null) {
                    this.getParentFacilities(facilities, _obj["supporting-facilities"], function () {
                        if (entitySourceList.length > 0) {
                            this.getParentFacilities(facilities, entitySourceList, callback)
                        } else {
                            callback()
                        }
                    }.bind(this))
                } else {
                    if (entitySourceList.length > 0) {
                        this.getParentFacilities(facilities, entitySourceList, callback)
                    } else {
                        callback()
                    }
                }
            }.bind(this))
        } else {
            if (entitySourceList.length > 0) {
                this.getParentFacilities(facilities, entitySourceList, callback)
            } else {
                callback()
            }
        }
    },

    getChildFacilities: function (facilities, entitySource, callback) {
        if( entitySource === "" ) {
            callback();
            return;
        }
        let entitySourceList = convertToArray(entitySource);
        let executeEntitySource = entitySourceList.splice(0, 1)[0];
        if (this.existEntitySource.indexOf(executeEntitySource) < 0) {
            this.existEntitySource.push(executeEntitySource);
            let _entityObj = getKeyFromResource(executeEntitySource);
            if( _entityObj.type === "" ) {
                callback();
                return;
            }
            let _where = {};
            _where[_entityObj.type] = {
                "name": _entityObj.keys[_entityObj.type]["name"]
            }
            requestData({
                // "requestType" : "cache",
                "from": _entityObj.type,
                "where": _where
            }, function (rs) {
                let _obj = rs[_entityObj.type][0];
                _obj.type = _entityObj.type;
                facilities.push(_obj);
                if (_obj["supported-facilities"] != null) {
                    this.getChildFacilities(facilities, _obj["supported-facilities"], function () {
                        if (entitySourceList.length > 0) {
                            this.getChildFacilities(facilities, entitySourceList, callback)
                        } else {
                            callback()
                        }
                    }.bind(this))
                } else {
                    if (entitySourceList.length > 0) {
                        this.getChildFacilities(facilities, entitySourceList, callback)
                    } else {
                        callback()
                    }
                }
            }.bind(this))
        } else {
            if (entitySourceList.length > 0) {
                this.getChildFacilities(facilities, entitySourceList, callback)
            } else {
                callback()
            }
        }
    },

    getFacilitiesForProtection: function (protection, callback) {
        if (!protection) {
            callback();
            return;
        }
        let facilities = [];
        this.getChildFacilities(facilities, getEntityPathByKey("trib-ptp",{"trib-ptp" : {name : protection["working-pu"]}}), function () {
            this.getChildFacilities(facilities, getEntityPathByKey("trib-ptp",{"trib-ptp" : {name : protection["protection-pu"]}}), function () {
                callback(facilities);
            }.bind(this));
        }.bind(this));
    },

    getFacilitiesForXcon: function (xcon, callback) {
        if (!xcon) {
            callback();
            return;
        }
        let facilities = [];
        let _source = xcon.source;
        let _destination = xcon.destination;
        this.getParentFacilities(facilities, _source, function () {
            this.getParentFacilities(facilities, _destination, function () {
                callback(facilities);
            }.bind(this));
        }.bind(this));
    }
}

let filterFacilitiesView = function (hashCodeStr) {
    return {
        "tableHead": {
            "type": {
                label: getText("type")
            },
            "admin-state": {
                cellDataFun: function (rowData, field, getSelectedFun) {
                    let _data = deepClone(rowData);
                    let requestKey = {};
                    requestKey[_data.type] = {
                        name: _data.name
                    }
                    let saveParameters = {
                        "setKey": field,
                        "from": _data.type,
                        "initKeyData": requestKey
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
                    if (!checkUserClass(getYangConfig(data[0].type), USER_CLASS_TYPE.write)) {
                        return EditBtnState.Disabled
                    } else {
                        return EditBtnState.Normal;
                    }
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    let _data = data[0];
                    let requestKey = {};
                    requestKey[_data.type] = {
                        name: _data.name
                    }
                    editItem(_data.type, {
                        initKey: requestKey
                    }, hashCodeStr)
                }
            },
            {
                label: getText("delete"),
                enabled: function (data) {
                    if (data[0]["managed-by"] == "system"
                        || !checkUserClass(getYangConfig(data[0].type), USER_CLASS_TYPE.write)) {
                        return EditBtnState.Disabled;
                    }
                    if (data[0]["type"] == "odu" && data[0]["class"] == "high-order") {
                        return EditBtnState.Disabled;
                    }
                    return EditBtnState.Normal;
                },
                clickFunction: function (data, event) {
                    let _data = data[0];
                    let requestKey = {};
                    requestKey[_data.type] = {
                        name: _data.name
                    }
                    deleteItem(_data.type, {
                        initKey: requestKey
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
                facilitiesDataTools.existEntitySource = [];
                let _where = requestKey.where;
                if( requestKey.hasOwnProperty("containerKey") && requestKey["containerKey"] === "protection-group" ) {
                    requestData({
                        // "requestType" : "cache",
                        "select": ["working-pu", "protection-pu"],
                        "from": "protection-group",
                        "where": _where
                    }, function (rs) {
                        facilitiesDataTools.getFacilitiesForProtection(rs["protection-group"][0], callback)
                    })
                    return;
                }
                if (requestKey.hasOwnProperty("containerKey") &&
                    (requestKey.containerKey == "xcon" || (requestKey.containerKey == "alarm" && _where.hasOwnProperty("xcon")))
                ) {
                    requestData({
                        // "requestType" : "cache",
                        "select": ["source", "destination"],
                        "from": "xcon",
                        "where": _where
                    }, function (rs) {
                        facilitiesDataTools.getFacilitiesForXcon(rs.xcon[0], callback)
                    })
                }


                if (_where.hasOwnProperty("chassis")) {
                    requestJson({
                        "get": [
                            {
                                "requestType": "cache",
                                "select": ["name"],
                                "from": "card",
                                "where": {
                                    "card": {
                                        "chassis-name": _where.chassis.name,
                                        "category": "line-card"
                                    }
                                }
                            }
                        ]
                    }, function (rs) {
                        if (rs.data != null && rs.data.length > 0) {
                            let cardList = convertToArray(rs.data[0].card);
                            let cardIDList = [];
                            for (let i = 0; i < cardList.length; i++) {
                                cardIDList.push(cardList[i].name);
                            }
                            facilitiesDataTools.getFacilitiesData(cardIDList, null, callback)
                        }
                    })
                } else if (_where.hasOwnProperty("card")) {
                    if (_where.hasOwnProperty("port")) {
                        facilitiesDataTools.getFacilitiesData([_where.card.name], [_where.port.name], callback);
                    } else {
                        facilitiesDataTools.getFacilitiesData([_where.card.name], null, callback);
                    }
                }
                return [];
            }
        }
    }
};

export {filterFacilitiesView, facilitiesDataTools};
