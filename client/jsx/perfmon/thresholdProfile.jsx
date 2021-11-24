import {getText, requestData,} from "../custom/utils";

let thresholdProfile = function (hashCodeStr) {
    return {
        "tableHead": {
            "units": {
                label: getText("units")
            }
        },
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let parameterUnitsMapping = {};
                requestData({
                    "from": "pm-parameter"
                }, function (data) {
                    let parameterList = data["pm-parameter"];
                    for (let i = 0; i < parameterList.length; i++) {
                        let _parameter = parameterList[i];
                        parameterUnitsMapping[_parameter.parameter] = _parameter["units"];
                    }

                    requestData(requestKey, function (_data) {
                        let thresholdProfileList = _data["pm-threshold-profile"];
                        for (let i = 0; i < thresholdProfileList.length; i++) {
                            let _parameter = thresholdProfileList[i]["parameter"];
                            // thresholdProfileList[i]["parameter"] = _parameter + ( parameterUnitsMapping[_parameter] != null ? " ("+ parameterUnitsMapping[_parameter] +")" : "" );
                            thresholdProfileList[i]["units"] = (parameterUnitsMapping[_parameter] != null ? parameterUnitsMapping[_parameter] : "")
                        }
                        callback(thresholdProfileList);
                    })
                })
            }
        }
    }
}

export {thresholdProfile};
