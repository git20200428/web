import {convertToArray, getText, isNullOrUndefined, requestJson} from "../custom/utils";

let allSWView = function (hashCodeStr) {
    let getSWloadData = function (callback) {

        let resultList = [];
        let requestList = [
            {
                "from": "software-location.software-load",
            },
            {
                "from": "sw-management.software-load",
            }
        ];
        requestJson({
            "get": requestList
        }, function (rs) {
            if (rs.data != null && rs.data.length > 0) {
                if (!isNullOrUndefined(rs.data[0]["software-location"])) {
                    let _swLocations = convertToArray(rs.data[0]["software-location"]);
                    for (let i = 0; i < _swLocations.length; i++) {
                        let locationID = _swLocations[i]["location-id"];
                        let _swLoadGroup = convertToArray(_swLocations[i]["software-load"]);
                        for (let j = 0; j < _swLoadGroup.length; j++) {
                            let swLoad = _swLoadGroup[j];
                            swLoad["sw-load"] = "software-load-" + locationID + "\/" + swLoad["swload-state"];
                            resultList.push(swLoad);
                        }

                    }
                }
                if (!isNullOrUndefined(rs.data[0]["software-load"])) {
                    let _swLoads = convertToArray(rs.data[0]["software-load"]);
                    for (let i = 0; i < _swLoads.length; i++) {
                        let _swLoad = _swLoads[i];
                        let swLoad = _swLoad;
                        swLoad["sw-load"] = "software-load" + "\/" + _swLoad["swload-state"];
                        resultList.push(swLoad);
                    }
                }
                callback(resultList);

            }
        })
    }


    return {
        "tableHead": {
            "sw-load": {
                label: getText("sw-load")
            }
        },
        "expandConfig": {

            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let _where = requestKey.where;
                getSWloadData(callback)
                return [];
            }
        }
    }
};

export {allSWView};
