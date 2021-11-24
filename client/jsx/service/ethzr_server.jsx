import {convertToArray, getText, requestData} from "../custom/utils";

let ethzrServerView = function (hashCodeStr) {
    return {
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let request = {
                    from: "ethernet"
                };
                requestData(request, function (rs) {
                    let data = [];
                    if( rs.ethernet ) {
                        rs.ethernet.forEach(item=>{
                            if( item["tx-mapping-mode"] === "openZR+"
                                && item["line-port"] && item["line-port"] != ""
                                && item["time-slots"] && item["time-slots"] != "") {
                                data.push(item);
                            }
                        })
                    }
                    callback(data);
                })
            }
        }
    }
};

export {ethzrServerView};
