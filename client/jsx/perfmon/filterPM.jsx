import {
    checkUserClass,
    convertToArray,
    editCommit,
    getEntityPathByKey,
    getText,
    USER_CLASS_TYPE
} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";
import {callRpc} from "../custom/comm/react_common";

let filterPMView = function (hashCodeStr) {
    let _requestKey = null;
    return {
        "globalEdit": [
            {
                label: getText("clear-pm"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-pm"), USER_CLASS_TYPE.write)
                },
                clickFunction: function (data, hashcode) {
                    let request = {
                        "data-type": _requestKey.from.substring(0, _requestKey.from.length - 3),
                        "resource": getEntityPathByKey(_requestKey.containerKey, _requestKey.where)
                    };
                    if (_requestKey["where"] != null && _requestKey["where"]["history-pm"] != null
                        && _requestKey["where"]["history-pm"]["period"] != null) {
                        request["period"] = (_requestKey["where"]["history-pm"]["period"])
                    }
                    let init = {
                        'initData': request,
                        'title': getText("clear_pm_warning2")
                    }
                    callRpc("clear-pm", init);
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
        ],
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                _requestKey = requestKey;
                let pmType = requestKey.from.substring(0, requestKey.from.length - 3);
                let source = getEntityPathByKey(requestKey.containerKey, requestKey.where);

                let param = {
                    "data-type": pmType,
                    "filter": [{"resource": source, "filter-id": 1}]
                }
                if (requestKey["where"] != null && requestKey["where"]["history-pm"] != null
                    && requestKey["where"]["history-pm"]["period"] != null) {
                    param["period"] = requestKey["where"]["history-pm"]["period"]
                }
                let updateConfig = {"rpc": {"get-pm": param}}
                editCommit(updateConfig, function (_result) {
                    if (_result.hasOwnProperty("data") && _result["data"].length > 0
                        && _result["data"][0].hasOwnProperty("pm-record")) {
                        callback(convertToArray(_result["data"][0]["pm-record"]), true);
                    } else {
                        callback([], true);
                    }
                }, function () {
                    callback([], true);
                }, false, 30000)
            }
        }
    }
};

export {filterPMView};
