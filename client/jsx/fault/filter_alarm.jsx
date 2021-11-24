import getRequest from "../requestConfig";
import {convertToArray, getEntityPathByKey, requestData, requestJson} from "../custom/utils";


let filterAlarmView = function (hashCodeStr) {
    let keysArray = ["chassis", "slot", "card", "port"];
    let needRequirePortType = ["comm-eth", "usb"];
    return {
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let keyType = null;
                if (requestKey.hasOwnProperty("where")) {
                    let request = [];
                    if (requestKey.where.hasOwnProperty("alarm")) {
                        request = [{
                            "from": "alarm",
                            "where": requestKey.where//alarm-id from event
                        }]
                    } else {

                        for (let i = 0; i < keysArray.length; i++) {
                            if (requestKey.where.hasOwnProperty(keysArray[i])) {
                                keyType = keysArray[i];
                            }
                        }
                        if (keyType == null) {
                            keyType = Object.keys(requestKey.where)[0]
                        }
                        if (requestKey.containerKey != null) {
                            keyType = requestKey.containerKey;
                        }
                        request = [{
                            "from": "alarm",
                            "where": {
                                "alarm": {
                                    "resource": getEntityPathByKey(keyType, requestKey.where)
                                }
                            }
                        }]
                        if (needRequirePortType.indexOf(keyType) > -1) {
                            request.push({
                                "from": "alarm",
                                "where": {
                                    "alarm": {
                                        "resource": getEntityPathByKey("port", requestKey.where)
                                    }
                                }
                            })
                        }

                    }


                    requestData(request, function (rs) {
                        if (rs.hasOwnProperty("alarm")) {
                            callback(convertToArray(rs["alarm"]));
                        } else {
                            callback([])
                        }
                    })
                } else {   //alarm and event relate table for container
                    let containerKey = obj.props.tableConfig.containerKey;
                    requestJson(getRequest("filter-alarm", [getEntityPathByKey(containerKey, {})]), function (rs) {
                        if (rs.hasOwnProperty("data") && rs.data.length > 0) {
                            if (rs["data"][0].hasOwnProperty("alarm")) {
                                callback(convertToArray(rs["data"][0]["alarm"]));
                                return;
                            }
                        }
                        callback([])
                    })
                }

                return [];
            }
        },

    }
};

export {filterAlarmView};
