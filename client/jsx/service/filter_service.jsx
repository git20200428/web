import {convertToArray, getYang, requestData} from "../custom/utils";

let filterServiceView = function (hashCodeStr) {

    let actionConfig = {
        "G30": {
            "getXConFromEth": function (supportingCard, supportingPort, xcons, callback) {
                callback([]);
            }
        },
        "G40": {
            "getXConFromEth": function (supportingCard, supportingPort, xcons, callback) {
                requestData({
                    "select": ["AID", "name"],
                    "from": "ethernet",
                    "requestType": "cache",
                    "where": {
                        "ethernet": {
                            "supporting-card": supportingCard,
                            "supporting-port": supportingPort,
                        }
                    }
                }, function (odu) {
                    callback(filterRelateXcon(odu, "ethernet", xcons))
                })
            }
        }
    }

    let getFacilityType = function () {
        let facilitiesTypes = getYang("yang")["facilities"];
        let teyps = [];
        for (let key in facilitiesTypes) {
            if (facilitiesTypes[key] == "list") {
                teyps.push(key);
            }
        }
        return teyps;
    }

    let getFacilityRelateXcon = function (requestKey, xcons, callback) {
        let requestType = requestKey.containerKey;
        requestData({
            "select": ["AID", "name"],
            "from": requestType,
            "where": requestKey.where
        }, function (_facilityRs) {
            callback(filterRelateXcon(_facilityRs, requestType, xcons));
        })
    }

    let filterRelateXcon = function (_facilityRs, requestType, xcons) {
        if (_facilityRs.hasOwnProperty(requestType) && _facilityRs[requestType].length > 0) {
            let xcons_rs = [];
            _facilityRs[requestType].forEach(obj => {
                let facility_aid = obj.AID;
                for (let i = 0; i < xcons.length; i++) {
                    let xcon = xcons[i];
                    if (xcon.AID.split(",")[0] == facility_aid || xcon.AID.split(",")[1] == facility_aid
                        || xcon.AID.split(",")[0].startsWith(facility_aid + "-") || xcon.AID.split(",")[1].startsWith(facility_aid + "-")) {
                        xcons_rs.push(xcon);
                    }
                }
            })
            return xcons_rs;
        } else {
            return [];
        }
    }

    let filterRelateXconBySupportingCardAndPort = function (supportingCard, supportingPort, xcons, callback) {
        requestData([
            {
                "select": ["AID", "name"],
                "from": "odu",
                "requestType": "cache",
                "where": {
                    "odu": {
                        "class": "low-order",
                        "supporting-card": supportingCard,
                        "supporting-port": supportingPort,
                    }
                }
            },{
                "select": ["AID", "name"],
                "from": "odu",
                "requestType": "cache",
                "where": {
                    "odu": {
                        "class": "mapped",
                        "supporting-card": supportingCard,
                        "supporting-port": supportingPort,
                    }
                }
            }
        ], function (odu) {
            let oduRs = filterRelateXcon(odu, "odu", xcons);
            actionConfig[sessionStorage.neType].getXConFromEth(supportingCard, supportingPort, xcons, function (ethRs) {
                callback(oduRs.concat(ethRs));
            });
        })
    }

    return {
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let facilityTypes = getFacilityType();
                requestData({
                    "from": "xcon"
                }, function (rs) {
                    if (rs.hasOwnProperty("xcon") && rs.xcon.length > 0) {
                        let xcons = convertToArray(rs["xcon"]);
                        if (requestKey.containerKey == "protection-group") {
                            requestData({
                                "select": ["working-pu", "protection-pu"],
                                "from": "protection-group",
                                "where": requestKey.where
                            }, function (rs) {
                                let xcons_rs = [];
                                for (let i = 0; i < xcons.length; i++) {
                                    xcons[i].AID.split(",").forEach(item=>{
                                        if( item === rs["protection-group"][0]["working-pu"] || item === rs["protection-group"][0]["protection-pu"] ) {
                                            xcons_rs.push(xcons[i]);
                                        }
                                    })
                                }
                                callback(xcons_rs);
                            })
                            return;
                        }
                        if ((requestKey.where.hasOwnProperty("chassis")) && !(requestKey.where.hasOwnProperty("card")) && !(requestKey.where.hasOwnProperty("port"))) {
                            let chassis_name = requestKey.where.chassis.name;//name is equal AID of chassis
                            let xcons_rs = [];
                            for (let i = 0; i < xcons.length; i++) {
                                let xcon = xcons[i];
                                let chass_id = xcon.AID.split("-")[0];
                                if (chass_id == chassis_name) {
                                    xcons_rs.push(xcon);
                                }
                            }
                            callback(xcons_rs);
                            return;
                        } else if (requestKey.where.hasOwnProperty("card") && !requestKey.where.hasOwnProperty("port")) {
                            requestData({
                                "select": ["AID"],
                                "from": "card",
                                "where": {
                                    "card": {
                                        "name": requestKey.where.card.name
                                    }
                                }
                            }, function (_cardRs) {
                                if (_cardRs.hasOwnProperty("card") && _cardRs.card.length > 0) {
                                    let card_aid = _cardRs.card[0].AID;
                                    let xcons_rs = [];
                                    for (let i = 0; i < xcons.length; i++) {
                                        let xcon = xcons[i];
                                        if (xcon.AID.startsWith(card_aid + "-")) {
                                            xcons_rs.push(xcon);
                                        }
                                    }
                                    callback(xcons_rs);

                                }
                            })
                        } else if (requestKey.where.hasOwnProperty("card") && requestKey.where.hasOwnProperty("port")) {
                            filterRelateXconBySupportingCardAndPort(requestKey.where.card.name, requestKey.where.port.name, xcons, callback)
                        } else if (requestKey.containerKey == "optical-carrier" || requestKey.containerKey == "super-channel-group") {
                            let _where = {};
                            _where[requestKey.containerKey] = {
                                name: requestKey.where[requestKey.containerKey].name
                            }
                            requestData({
                                "select": ["supporting-card", "supporting-port"],
                                "from": requestKey.containerKey,
                                "requestType": "cache",
                                "where": _where
                            }, function (opticalCarrier) {
                                if (opticalCarrier[requestKey.containerKey] != null && opticalCarrier[requestKey.containerKey].length > 0) {
                                    filterRelateXconBySupportingCardAndPort(opticalCarrier[requestKey.containerKey][0]["supporting-card"],
                                        opticalCarrier[requestKey.containerKey][0]["supporting-port"], xcons, callback)
                                } else {
                                    callback([]);
                                }
                            })
                        } else if (requestKey.containerKey == "ne") {
                            callback(xcons);
                            return;
                        } else if (facilityTypes.indexOf(requestKey.containerKey) > -1) {
                            getFacilityRelateXcon(requestKey, xcons, callback)
                        }
                    }
                    callback([])
                })
                return [];
            }
        }
    }
};

export {filterServiceView};
