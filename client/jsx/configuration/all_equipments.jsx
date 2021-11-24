import {deleteItem, editItem} from "../custom/comm/react_common";
import {
    convertToArray,
    EditBtnState,
    getKeyFromResource,
    getText,
    getYang, isNullOrUndefined,
    requestData,
    requestJson
} from "../custom/utils";

let allEquipmentsView = function (hashCodeStr) {
    let types = ["card","slot","port","tom"];

    let getFacilitiesData = function (cardIDList, portIDList, callback) {
        getFacilityData(types, cardIDList, portIDList, callback);
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
            let _cardList = [];
            let _allPortList = [];
            if (rs.data != null && rs.data.length > 0) {
                let _facilities = rs.data[0];
                for (let _type in types) {
                   let _objList = convertToArray(_facilities);
                    if(types[_type]=="card"){
                        _cardList = _facilities["card"];
                        for (let i = 0; i < _cardList.length; i++) {
                            let _obj = _cardList[i];
                            _obj["type"] = types[_type];
                            resultList.push(_obj);
                        }
                    }
                    if(types[_type]=="port"){
                        // let _cardList = _facilities["card"];
                        for (let i = 0; i < _cardList.length; i++) {
                            let _portList = convertToArray(_cardList[i]["port"]);
                            for (let i = 0; i < _portList.length; i++) {
                                let _obj = _portList[i];
                                _obj["type"] = types[_type];
                                resultList.push( _obj);
                                _allPortList.push(_obj)
                            }
                        }
                    }
                    if(types[_type]=="tom"){
                        // let _objList = convertToArray(_facilities["card"]["port"]);
                        for (let i = 0; i < _allPortList.length; i++) {
                            let _tomList = convertToArray(_allPortList[i]["tom"]);
                            for (let i = 0; i < _tomList.length; i++) {
                                let _obj = _tomList[i];
                                _obj["type"] = types[_type];
                                resultList.push( _obj);
                            }

                        }
                    }
                    if(types[_type]=="slot"){
                        let _objList = convertToArray(_facilities["chassis"]["slot"]);
                        for (let i = 0; i < _objList.length; i++) {
                            let _obj = _objList[i];
                            _obj["type"] = types[_type];
                            resultList.push( _obj);
                        }
                    }
                }
            }
            callback(resultList)
        })
    }


    return {
        "tableHead": {
            "type": {
                label: getText("equipment")
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

export {allEquipmentsView};
