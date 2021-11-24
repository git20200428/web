/**
 * Created by lfu on 4/22/2020.
 */
import getRequest from "../requestConfig";
import {convertToArray, extendCustomConfig, getEntityPathByKey, requestJson} from "../custom/utils";

let filterPMControlEntryTable = function (hashCodeStr) {
    return {
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let requestSql = getRequest("pm-resource");
                if (requestKey.where != null) {
                    requestSql.get[0]["where"] = {
                        "pm-resource": {
                            "resource": getEntityPathByKey(Object.keys(requestKey.where)[0], requestKey.where)
                        }
                    }
                }
                requestJson(requestSql, function (_data) {
                    let realDataList = [];
                    if (_data.hasOwnProperty("data") && _data.data.length > 0) {
                        let pm_resource = convertToArray(_data.data[0]["pm-resource"]);
                        for (let i = 0; i < pm_resource.length; i++) {
                            let pm_resource_item = pm_resource[i];
                            let pm_control_entry = pm_resource_item["pm-control-entry"];
                            if (pm_control_entry != null && pm_control_entry.length > 0) {
                                for (let j = 0; j < pm_control_entry.length; j++) {
                                    let pm_control_entry_item = pm_control_entry[j];
                                    pm_control_entry_item = extendCustomConfig(pm_control_entry_item, pm_resource_item);
                                    delete pm_control_entry_item["pm-control-entry"];
                                    realDataList.push(pm_control_entry_item);
                                }
                            } else {
                                // realDataList.push(pm_resource_item);
                            }
                        }
                    }
                    callback(realDataList);
                })
            }
        }
    }
}

export {filterPMControlEntryTable};
