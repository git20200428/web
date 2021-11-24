import {convertToArray, getText, requestData} from "../custom/utils";

let filterEthzrServerView = function (hashCodeStr) {
    let filterEth = function(filterCard,filterPort,callback){
        let request = {
            from: "ethernet"
        };
        requestData(request, function (rs) {
            let data = [];
            if( rs.ethernet ) {
                for(let i=0; i<rs.ethernet.length; i++) {
                    let item = rs.ethernet[i];
                    if( item["tx-mapping-mode"] === "openZR+"
                        && item["line-port"] && item["line-port"] != ""
                        && item["time-slots"] && item["time-slots"] != "") {
                        if( filterCard != null && item["supporting-card"] != filterCard) {
                            continue;
                        }
                        if( filterPort != null && (item["line-port"] != filterPort && item["supporting-port"] != filterPort)) {
                            continue;
                        }
                        data.push(item);
                    }
                }
            }
            callback(data);
        })
    }

    return {
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let filterCard = null;
                let filterPort = null;
                if( requestKey.containerKey === "chassis" ) {

                } else if( requestKey.containerKey === "card" ) {
                    filterCard = requestKey.where.card.name;
                } else if ( requestKey.containerKey === "port" || requestKey.containerKey === "tom") {
                    filterCard = requestKey.where.card.name;
                    filterPort = requestKey.where.port.name;
                } else {
                    requestData({
                        "select" : ["supporting-card","supporting-port"],
                        "from" : requestKey.containerKey,
                        "where" : requestKey.where
                    },function (rs) {
                        if( rs[requestKey.containerKey] != null && rs[requestKey.containerKey].length > 0 ) {
                            filterCard = rs[requestKey.containerKey][0]["supporting-card"];
                            filterPort = rs[requestKey.containerKey][0]["supporting-port"];
                            filterEth(filterCard,filterPort,callback);
                        }
                    })
                    return;
                }
                filterEth(filterCard,filterPort,callback);
            }
        }
    }
};

export {filterEthzrServerView};
