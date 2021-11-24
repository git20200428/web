import {convertToArray, getText, requestData} from "../custom/utils";

let filterAddPONView = function (hashCodeStr) {
    return {
        "tableHead": {
            "PON": {
                label: getText("PON")
            }
        },
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let request = {
                    select: requestKey.select,
                    from: requestKey.from,
                    where: requestKey.where
                };
                if (requestKey.requestType != null) {
                    request["requestType"] = requestKey.requestType;
                }
                requestData(request, function (rs) {
                    let data = [];
                    if (requestKey.rsKey == "slot") {
                        if (rs.chassis != null && rs.chassis[0]["slot"] != null) {
                            data = convertToArray(rs.chassis[0]["slot"])
                        }
                    } else if (requestKey.rsKey == "port") {
                        if (rs.card != null && rs.card[0]["port"] != null) {
                            data = convertToArray(rs.card[0]["port"])
                        }
                    }
                    data.forEach(item => {
                        if (item.inventory != null && item.inventory.PON != null) {
                            item.PON = item.inventory.PON;
                        }
                    })
                    callback(data);
                })
            }
        }
    }
};

export {filterAddPONView};
