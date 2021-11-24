import {deleteItem, editItem} from "../custom/comm/react_common";
import {
    convertToArray,
    EditBtnState,
    getKeyFromResource,
    getText,
    getYang,
    requestData,
    requestJson
} from "../custom/utils";

let allFacilitiesView = function (hashCodeStr) {
    let getFacilitiesData = function (cardIDList, portIDList, callback) {
        let facilitiesTypes = getYang("yang")["facilities"];
        let teyps = [];
        for (let key in facilitiesTypes) {
            if (facilitiesTypes[key] == "list") {
                teyps.push(key);
            }
        }
        getFacilityData(teyps, cardIDList, portIDList, callback);
    }
    let getFacilityData = function (types, cardIDList, portIDList, callback) {
        let requestList = [];
        for (let m = 0; m < types.length; m++) {
            // let _where = {};
            requestList.push(
                {
                    "from": types[m],
                }
            )
        }
        requestJson({
            "get": requestList
        }, function (rs) {
            let resultList = [];
            if (rs.data != null && rs.data.length > 0) {
                let _facilities = rs.data[0];
                for (let _type in _facilities) {
                    let _objList = convertToArray(_facilities[_type]);
                    for (let i = 0; i < _objList.length; i++) {
                        let _obj = _objList[i];
                        _obj["type"] = _type;
                        resultList.push(_obj);
                    }
                }
            }
            callback(resultList)
        })
    }

    let getParentFacilities = function (facilities, entitySource, callback) {
        let _entityObj = getKeyFromResource(entitySource);
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
                getParentFacilities(facilities, _obj["supporting-facilities"], callback)
            } else {
                callback()
            }
        })
    }

    return {
        "tableHead": {
            "type": {
                label: getText("type")
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
                    return EditBtnState.Normal;
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
                    if (data[0]["managed-by"] == "system") {
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
                let _where = requestKey.where;
                getFacilitiesData(null, null, callback)
                return [];
            }
        }
    }
};

export {allFacilitiesView};
