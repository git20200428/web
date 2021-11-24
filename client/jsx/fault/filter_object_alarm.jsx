import {getEntityPathByKey, requestData} from "../custom/utils";
import {facilitiesDataTools} from "../configuration/filter_facilities";
import {equipmentDataTools} from "../configuration/filter_equipment";
import {getPathKey} from "../yangMapping";

let filterObjectAlarmView = function (hashCodeStr) {
    return {
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let _where = requestKey.where;
                let objects = [];
                if (requestKey.hasOwnProperty("containerKey") && requestKey.containerKey == "xcon") {
                    requestData({
                        // "requestType" : "cache",
                        "select": ["source", "destination"],
                        "from": "xcon",
                        "where": _where
                    }, function (rs) {
                        facilitiesDataTools.existEntitySource = [];
                        facilitiesDataTools.getFacilitiesForXcon(rs.xcon[0], function (facilities) {
                            objects = objects.concat(facilities);
                            equipmentDataTools.existEntitySource = [];
                            equipmentDataTools.getEquipmentForXcon(rs.xcon[0], function (equipments) {
                                objects = objects.concat(equipments);
                                let requests = [];
                                for (let i = 0; i < objects.length; i++) {
                                    let obj = objects[i];
                                    let keyList = getPathKey(obj.type);
                                    let _where = {
                                        "chassis": {name: "1"},
                                    };
                                    _where[obj.type] = {
                                        "name": obj.name
                                    }
                                    for (let key in keyList) {
                                        if (key != obj.type && obj.hasOwnProperty(key + "-name")) {
                                            _where[key] = {
                                                "name": obj[key + "-name"]
                                            }
                                        }
                                    }

                                    requests.push({
                                        "from": "alarm",
                                        "requestType": "cache",
                                        "where": {
                                            "alarm": {
                                                "resource": getEntityPathByKey(obj.type, _where)
                                            }
                                        }
                                    })
                                }
                                requestData(requests, function (rs) {
                                    callback(rs.alarm)
                                })
                            })
                        })
                    })
                }
                return [];
            }
        },
    }
};

export {filterObjectAlarmView};
