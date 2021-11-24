import {convertToArray, requestJson} from "../custom/utils";

let carrierView = function (hashCodeStr) {
    return {
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                requestJson({
                    "get": [
                        {
                            "select": ["carriers"],
                            "from": "super-channel",
                            "where": requestKey.where
                        }
                    ]
                }, function (rs) {
                    if (rs.data != null && rs.data.length > 0) {
                        let carriersIdList = convertToArray(rs.data[0]["super-channel"]["carriers"]);
                        let carriersArray = [];
                        for (let i = 0; i < carriersIdList.length; i++) {
                            requestJson({
                                "get": [
                                    {
                                        "from": "optical-carrier",
                                        "where": {
                                            "optical-carrier": {
                                                "name": carriersIdList[i]
                                            }
                                        }
                                    }
                                ]
                            }, function (carriersRs) {
                                carriersArray.push(carriersRs.data[0]["optical-carrier"]);
                                if (i == carriersIdList.length - 1) {
                                    callback(carriersArray);
                                }
                            })
                        }
                    }
                })
            }
        }
    }
};

export {carrierView};
