import {convertToArray, getText, getYang, requestJson} from "../custom/utils";

let inventoryView = function (hashCodeStr) {
    let parseData = function (key, _data, keyString, result) {
        let ls = convertToArray(_data);
        for (let i = 0; i < ls.length; i++) {
            let data = ls[i];
            let keyStringTmp = keyString;
            if (data.hasOwnProperty("name")) {
                keyStringTmp = keyString + "-" + data["name"];
            }
            if (data.hasOwnProperty("inventory")) {
                let inventoryObj = data.inventory;
                inventoryObj["name"] = key + "-" + keyStringTmp.substring(1);
                result.push(inventoryObj);
            }
            for (let _key in data) {
                if (_key != "name" && _key != "inventory") {
                    parseData(_key, data[_key], keyStringTmp, result)
                }
            }
        }
    }
    return {
        "tableHead": {
            "name": {
                label: getText("name")
            }
        },
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let _yang = getYang("yang");
                let request = [];
                for (let _key in _yang) {
                    if (_key.endsWith(".inventory")) {
                        request.push(
                            {
                                "from": _key
                            }
                        )
                    }
                }
                requestJson({
                    "get": request
                }, function (rs) {
                    let result = [];
                    if (rs.hasOwnProperty("data") && rs.data.length > 0) {
                        parseData("", rs.data[0], "", result);
                    }
                    callback(result);
                })
                return [];
            }
        }
    }
};

export {inventoryView};
