import {convertToArray, deepClone, extendCustomConfig, getText, requestJson} from "../custom/utils";
import {getYangConfig, SpecificParameter} from "../yangMapping";

let allObjectReportView = function (hashCodeStr) {
    return {
        "tableHead": function (_config) {
            let _entity = getYangConfig(_config.exportPath[0]);
            _entity = extendCustomConfig(_entity, getYangConfig(_config.exportPath[1]))
            let tableHead = {};
            let _keyList = [];
            if (_config["include"] != null) {
                _keyList = _config["include"]
            } else {
                for (let _key in _entity) {
                    if (SpecificParameter.indexOf(_key) < 0 && _entity[_key].hasOwnProperty("type")) {
                        if (_entity[_key]["password"] != null && _entity[_key]["password"] == "true") {
                            continue;
                        }
                        _keyList.push(_key);
                    }
                }
            }
            for (let i = 0; i < _keyList.length; i++) {
                let _key = _keyList[i];
                if (_entity.hasOwnProperty(_key)) {
                    if (_config["exclude"] != null && _config["exclude"].indexOf(_key) > -1) {
                        continue;
                    }
                    let _label = getText(_entity[_key].label);
                    if (_entity[_key].hasOwnProperty("units")) {
                        _label += "(" + _entity[_key]["units"] + ")"
                    }
                    tableHead[_key] = {
                        label: _label,
                        description: _entity[_key].description
                    }
                    if (_entity[_key].hasOwnProperty("cellDataFun")) {
                        tableHead[_key]["cellDataFun"] = _entity[_key]["cellDataFun"];
                    } else if (_entity[_key].yangOriginaType != null && _entity[_key].yangOriginaType == "boolean") {
                        tableHead[_key]["cellDataFun"] = function (data, column) {
                            return data[column];
                        };
                    }
                } else {
                    tableHead[_key] = {
                        label: getText(_key),
                        description: getText(_key)
                    }
                }

            }
            return tableHead;
        },
        "expandConfig": {
            "getDataFun": function (requestKey, obj, filter, config, callback) {
                let path = config.tableConfig.exportPath;
                requestJson({
                    "get": {
                        "select": ["*", path[1]],
                        from: path[0],
                    }
                }, function (rs) {
                    let rsList = [];
                    if (rs.data != null && rs.data.length > 0) {
                        convertToArray(rs.data[0][path[0]]).forEach(item => {
                            let obj = deepClone(item);
                            if (item.hasOwnProperty(path[1])) {
                                convertToArray(item[path[1]]).forEach(item2 => {
                                    obj = extendCustomConfig(obj, item2);
                                    rsList.push(obj);
                                })
                            } else {
                                rsList.push(obj);
                            }
                        })
                    }
                    callback(rsList)
                })
                return [];
            }
        }
    }
};

export {allObjectReportView};
