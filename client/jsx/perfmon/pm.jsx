import React from 'react';
import {getRpcConfig, getYangConfig, SpecificParameter} from "../yangMapping";
import {ReactTable, SortFlag, TableFilterTypeEnum} from "../custom/table/react_table";
import {
    checkParameterUserClass,
    checkUserClass,
    convertToArray,
    deepClone,
    editCommit,
    enumFormControlType as FormControlTypeEnum,
    extendCustomConfig,
    getEntityPathByKey,
    getText,
    getYang,
    isEmpty,
    isEmptyObj,
    isFunction,
    isNullOrUndefined,
    parseColonValues,
    PLEASE_SELECT_VALUE,
    requestJson,
    resource2KeyName,
    showAlertDialog,
    USER_CLASS_TYPE,
    xpath2IdPath
} from "../custom/utils";
import {DialogType} from '../components/modal/modal';
import LoadingModal from "../custom/loading-modal";
import JSMap from "../custom/js_map";
import {editRpcItem} from "../custom/comm/react_common";

let typeMapping = {
    "current": "current-pm",
    "history": "history-pm",
    "real-time": "real-time-pm"
}

let showError = function (content) {
    let config = {
        dialogType: DialogType.ERROR,
        showText: content,
        okCallBack: function () {

        }
    }
    showAlertDialog(config);
}

let previousRequest = null;

let getHistoryData = function (requestParam, callbackFun) {
    previousRequest = requestParam;
    let param = deepClone(requestParam);
    for (let _key in param) {
        if (param[_key] == PLEASE_SELECT_VALUE) {
            delete param[_key]
        }
    }
    if (!param.hasOwnProperty("data-type")) {
        if (!isNullOrUndefined(callbackFun) && isFunction(callbackFun)) {
            try {
                callbackFun([], true)();
            } catch (e) {

            }
            return;
        } else {
            return [];
        }
    }
    if (param["data-type"] == "current") {
        delete param["start-time"];
        delete param["end-time"];
        delete param["start-bin"];
        delete param["end-bin"];
    }
    if (param["data-type"] == "real-time") {
        delete param["period"];
        delete param["start-time"];
        delete param["end-time"];
        delete param["start-bin"];
        delete param["end-bin"];
    }

    if (param["data-type"] == "history") {
        if (!param.hasOwnProperty("period")) {
            showError("Please select the Period!");
            try {
                callbackFun([], true)();
            } catch (e) {

            }
            return;
        }

    }

    if (!param.hasOwnProperty("number-of-records")) {
        param["number-of-records"] = "1000";
    } else {
        if (param["number-of-records"].trim() == "") {
            delete param["number-of-records"];
        }
    }
    if (!param.hasOwnProperty("skip-records")) {
        param["skip-records"] = "0";
    } else {
        if (param["skip-records"].trim() == "") {
            delete param["skip-records"];
        }
    }

    let filter = {}
    if (param.hasOwnProperty("resource")) {
        filter["resource"] = param["resource"];
        delete param["resource"]
    }
    if (param.hasOwnProperty("resource-type")) {
        filter["resource-type"] = param["resource-type"];
        delete param["resource-type"]
    }
    if (param.hasOwnProperty("parameter")) {
        filter["parameter"] = param["parameter"];
        delete param["parameter"]
    }

    if (param.hasOwnProperty("direction")) {
        filter["direction"] = param["direction"];
        delete param["direction"]
    }

    if (param.hasOwnProperty("location")) {
        filter["location"] = param["location"];
        delete param["location"]
    }

    if (param.hasOwnProperty("AID")) {
        filter["AID"] = param["AID"];
        delete param["AID"]
    }

    if (param.hasOwnProperty("aid")) {
        filter["AID"] = param["aid"];
        delete param["aid"]
    }

    if (!isEmptyObj(filter)) {
        let _resource = filter["resource"];
        delete filter["resource"];
        let _resourceType = filter["resource-type"];
        delete filter["resource-type"];
        let _parameter = filter["parameter"];
        delete filter["parameter"];
        let _direction = filter["direction"];
        delete filter["direction"];
        let _location = filter["location"];
        delete filter["location"];
        let _aid = filter["AID"];
        delete filter["AID"];

        if (_resource == null || _resource == "null" || _resource.length == 0) {
            _resource = ["NULL"];
        }
        if (_resourceType == null || _resourceType == "null" || _resourceType.length == 0) {
            _resourceType = ["NULL"];
        }
        if (_parameter == null || _parameter == "null" || _parameter.length == 0) {
            _parameter = ["NULL"];
        }
        if (_direction == null || _direction == "null" || _direction.length == 0) {
            _direction = ["NULL"];
        }
        if (_location == null || _location == "null" || _location.length == 0) {
            _location = ["NULL"];
        }
        if (_aid != null && _aid instanceof Array) {

        } else if (_aid == null || _aid == "null" || _aid.trim() == "") {
            _aid = ["NULL"];
        } else {
            _aid = _aid.split(",");
        }
        let filterID = 0;
        let filterList = [];
        for (let i = 0; i < _resource.length; i++) {
            let _resourceTemp = _resource[i];
            for (let j = 0; j < _resourceType.length; j++) {
                let _resourceTypeTemp = _resourceType[j];
                for (let k = 0; k < _parameter.length; k++) {
                    let _parameterTemp = _parameter[k];
                    for (let m = 0; m < _direction.length; m++) {
                        let _directionTemp = _direction[m];
                        for (let n = 0; n < _location.length; n++) {
                            let _locationTemp = _location[n];
                            for (let z = 0; z < _aid.length; z++) {
                                let _aidTemp = _aid[z].toUpperCase();

                                filterID++;
                                let filterObj = {};
                                if (_resourceTemp != "NULL") {
                                    filterObj["resource"] = _resourceTemp;
                                }
                                if (_resourceTypeTemp != "NULL") {
                                    filterObj["resource-type"] = _resourceTypeTemp;
                                }
                                if (_parameterTemp != "NULL") {
                                    filterObj["parameter"] = _parameterTemp;
                                }
                                if (_directionTemp != "NULL") {
                                    filterObj["direction"] = _directionTemp;
                                }
                                if (_locationTemp != "NULL") {
                                    filterObj["location"] = _locationTemp;
                                }
                                if (_aidTemp != "NULL") {
                                    filterObj["AID"] = _aidTemp;
                                }
                                if (!isEmptyObj(filterObj)) {
                                    filterObj["filter-id"] = filterID
                                    filterList.push(filterObj);
                                }
                            }
                        }
                    }
                }
            }
        }
        if (filterList.length > 0) {
            param["filter"] = filterList;
        }
    }
    if (param["data-type"] != "history") {
        createTableHead(this, param["data-type"]);
    }
    let loadingModal = new LoadingModal();
    loadingModal.show();
    let updateConfig = {"rpc": {"get-pm": param}}
    editCommit(updateConfig, function (_result) {
        let pmList = [];
        if (_result.hasOwnProperty("data") && _result["data"].length > 0
            && _result["data"][0].hasOwnProperty("pm-record")) {
            pmList = convertToArray(_result["data"][0]["pm-record"]);
        }
        if (param["data-type"] == "history") {
            pmList = createPMHistoryTable(this, pmList);
        }
        callbackFun(pmList, true);
        loadingModal.close();
    }.bind(this), function () {
        callbackFun([], true);
        loadingModal.close();
    }, false, 30000)
    return [];
}

let columnSort = {
    "current": ["resource", "parameter", "period", "resource-type", "direction", "location", "AID", "bin", "monitoring-date-time", "pm-value", "pm-value-min", "pm-value-max", "pm-value-avg", "validity", "pm-unit"],
    "history": ["resource", "parameter", "period", "resource-type", "AID", "bin", "monitoring-date-time", "pm-value", "pm-value-min", "pm-value-max", "pm-value-avg", "validity", "pm-unit"],
    "real-time": ["resource", "parameter", "resource-type", "direction", "location", "AID", "bin", "monitoring-date-time", "pm-value", "pm-value-min", "pm-value-max", "pm-value-avg", "validity", "pm-unit"]
}

let pmValueKeys = ["Bin", "Value", "Min", "Max", "AVG", "Validity"];
let pmValueKeysMapping = {
    "Bin": "bin",
    "Value": "pm-value",
    "Min": "pm-value-min",
    "Max": "pm-value-max",
    "AVG": "pm-value-avg",
    "Validity": "validity",
}

let createPMHistoryTable = function (reactObj, pmList) {
    let {tableConfig, pageInfo} = reactObj.state;
    let multiHeadConf = [], tableHeadConf = {};
    let firstHead = [], secondHead = [], thirdHead = [];
    firstHead.push({
        key: "monitoring-date-time",
        rowSpan: 3
    });
    let _yang = getYangConfig(typeMapping["history"]);
    tableHeadConf["monitoring-date-time"] = {
        label: getText("monitoring-date-time"),
        description: _yang["monitoring-date-time"].description,
        width: 160
    };
    // firstHead.push({
    //     key: "bin",
    //     rowSpan: 3
    // });
    // tableHeadConf["bin"] = {
    //     label : getText("bin"),
    //     width : 71
    // };
    let _conf = {};
    let _resourceConf = {};
    let _parameterConf = {};
    let _resultObj = {};
    for (let i = 0; i < pmList.length; i++) {
        let _pm = pmList[i];
        if (_conf[_pm.resource] == null) {
            _conf[_pm.resource] = [];
            _resourceConf[_pm.resource] = {
                "resource": _pm.resource,
                "AID": _pm.AID,
                "period": _pm.period,
                "resource-type": _pm["resource-type"],
            }
        }
        let pmKey = _pm.resource + "&" + _pm.parameter + "&" + _pm.direction + "&" + _pm.location;
        if (_conf[_pm.resource].indexOf(pmKey) < 0) {
            _conf[_pm.resource].push(pmKey);
            _parameterConf[pmKey] = {
                "unit": _pm["pm-unit"],
                "direction": _pm["direction"],
                "location": _pm["location"]
            }
        }
        if (_resultObj[_pm["monitoring-date-time"]] == null) {
            _resultObj[_pm["monitoring-date-time"]] = {
                // "bin" :_pm.bin,
                "monitoring-date-time": _pm["monitoring-date-time"],
            };
        }
        _resultObj[_pm["monitoring-date-time"]][pmKey + "&" + "Bin"] = _pm["bin"];
        _resultObj[_pm["monitoring-date-time"]][pmKey + "&" + "Value"] = _pm["pm-value"];
        _resultObj[_pm["monitoring-date-time"]][pmKey + "&" + "Min"] = _pm["pm-value-min"];
        _resultObj[_pm["monitoring-date-time"]][pmKey + "&" + "Max"] = _pm["pm-value-max"];
        _resultObj[_pm["monitoring-date-time"]][pmKey + "&" + "AVG"] = _pm["pm-value-avg"];
        _resultObj[_pm["monitoring-date-time"]][pmKey + "&" + "Validity"] = _pm["validity"];
    }
    for (let _resourceKey in _conf) {
        let _parameter = _conf[_resourceKey];
        let _objTemp = {
            key: _resourceKey,
            label: resource2KeyName(_resourceKey) + " (AID : " + _resourceConf[_resourceKey].AID + ")",
            colSpan: _parameter.length * 6,
            items: _parameter,
            id: xpath2IdPath(_resourceKey),
            width: 60
        };
        if (_resourceConf[_resourceKey] != null) {
            _objTemp.title = "Resource : " + resource2KeyName(_resourceKey) + "\n"
                + "Resource Type : " + parseColonValues(_resourceConf[_resourceKey]["resource-type"]) + "\n"
                + "AID : " + _resourceConf[_resourceKey].AID + "\n"
                + "Period : " + parseColonValues(_resourceConf[_resourceKey].period) + "\n"
        }
        firstHead.push(_objTemp);
        for (let i = 0; i < _parameter.length; i++) {
            let _parameterKey = _parameter[i];
            let _pmValueKeys = [];
            for (let j = 0; j < pmValueKeys.length; j++) {
                let _keyTemp = _parameterKey + "&" + pmValueKeys[j];
                _pmValueKeys.push(_keyTemp);
                thirdHead.push({
                    label: pmValueKeys[j],
                    width: 100,
                    key: _keyTemp,
                    id: xpath2IdPath(_keyTemp)
                });
                tableHeadConf[_keyTemp] = {
                    label: pmValueKeys[j],
                    description: _yang[pmValueKeysMapping[pmValueKeys[j]]].description,
                    cellDataFun: function (data, columnKey) {
                        let _validityKey = columnKey.substring(0, columnKey.lastIndexOf("&")) + "&Validity";
                        if (data[_validityKey] == "suspect") {
                            return <label className="table-pm-label-suspect"
                                          title={data[columnKey]}>{data[columnKey]}</label>
                        } else if (data[_validityKey] == "complete") {
                            return <label className="table-pm-label-complete"
                                          title={data[columnKey]}>{data[columnKey]}</label>
                        } else {
                            return <label title={data[columnKey] + "(complete)"}>{data[columnKey]}</label>;
                        }
                    }
                }
            }
            let _secondObj = {
                key: _parameterKey,
                colSpan: 6,
                items: _pmValueKeys,
                id: xpath2IdPath(_parameterKey),
                // rowPadding: 2,
                width: 100
            };

            let _labelTemp = parseColonValues(_parameterKey.split("&")[1]);
            if (_parameterConf[_parameterKey] != null) {
                _secondObj.label = _labelTemp + "/" + _parameterConf[_parameterKey].direction + "/"
                    + _parameterConf[_parameterKey].location
                    + " (" + _parameterConf[_parameterKey].unit + ")";
                _secondObj.title = "Parameter : " + _labelTemp + "\n" +
                    "Direction : " + _parameterConf[_parameterKey].direction + "\n" +
                    "Location : " + _parameterConf[_parameterKey].location + "\n" +
                    "Unit : " + _parameterConf[_parameterKey].unit;
            }
            if (secondHead.length == 0) {
                _secondObj.rowPadding = 2;
            }
            secondHead.push(_secondObj);
        }
    }
    multiHeadConf.push(firstHead);
    multiHeadConf.push(secondHead);
    multiHeadConf.push(thirdHead);
    tableConfig.multiHead = {
        config: multiHeadConf,
        enabled: true
    };
    tableConfig.tableHead = tableHeadConf;
    tableConfig.showTableBody = true;
    tableConfig.colSortColumn = ["monitoring-date-time"];

    reactObj.setState({
        tableConfig: Object.assign([], deepClone(tableConfig))
    });
    pageInfo.setSort("monitoring-date-time", SortFlag.DESC);
    return Object.values(_resultObj);
}

let createTableHead = function (reactObj, objType) {
    if (reactObj.state == null) {
        return;
    }
    let {initFilterInfo, tableConfig, pageInfo} = reactObj.state;
    if (isNullOrUndefined(initFilterInfo)) {
        return;
    }

    let tableHead = {};
    let _entity = deepClone(getYangConfig(typeMapping[objType]));
    for (let i = 0; i < columnSort[objType].length; i++) {
        let _key = columnSort[objType][i];
        if (_entity.hasOwnProperty(_key)) {
            tableHead[_key] = {
                label: getText(_entity[_key].label),
                description: _entity[_key].description
            }
            if (_key == "resource") {
                tableHead[_key]["cellDataFun"] = function (treeObj, field) {
                    return resource2KeyName(treeObj[field])
                }
            }
            if (_key == "resource-type" || _key == "parameter" || _key == "period") {
                tableHead[_key]["cellDataFun"] = function (treeObj, field) {
                    return parseColonValues(treeObj[field])
                }
            }
            delete _entity[_key];
        }
    }
    for (let _key in _entity) {
        if (SpecificParameter.indexOf(_key) < 0) {
            tableHead[_key] = {
                label: getText(_entity[_key].label),
                description: _entity[_key].description
            }
        }
    }
    delete tableConfig["multiHead"];
    tableConfig.tableHead = tableHead;
    tableConfig.showTableBody = true;
    tableConfig.colSort = {
        enabled: true
    };
    tableConfig.colSortColumn = null;
    reactObj.setState({
        tableConfig: Object.assign([], deepClone(tableConfig))
    });
    pageInfo.setSort("resource", SortFlag.DESC);
    return tableHead;
}

let allPMInitData = {};

let initFilterDataFun = function (obj, filter, callback) {
    let allData = {};
    let resource = new JSMap();
    let resource_type = new JSMap();
    let parameters = new JSMap();

    let data_type = new JSMap();
    data_type.put("real-time", "real-time");
    data_type.put("current", "current");
    data_type.put("history", "history");

    let period = new JSMap();
    // period.put("15min","pm-15min");
    // period.put("24h","pm-24h");

    let numberRecords = new JSMap();
    numberRecords.put("number-of-records", 1000);

    let skipRecords = new JSMap();
    skipRecords.put("skip-records", 0)

    let direction = new JSMap();
    direction.put("na", "na");
    direction.put("ingress", "ingress");
    direction.put("egress", "egress");

    let location = new JSMap();
    location.put("na", "na");
    location.put("near-end", "near-end");
    location.put("far-end", "far-end");

    let loadingModal = new LoadingModal();
    loadingModal.show();
    let requestSql = {
        "get": [
            {
                "select": ["resource", "resource-type", "pm-control-entry"],
                "from": "pm-resource",
            }
        ]
    }
    requestJson(requestSql, function (_data) {
        if (_data.hasOwnProperty("data") && _data.data.length > 0) {
            let pm_resource = _data.data[0]["pm-resource"];
            if (pm_resource != null) {
                for (let i = 0; i < pm_resource.length; i++) {
                    let _pm = pm_resource[i];
                    let _resource = resource2KeyName(_pm["resource"]);
                    let _resource_type = parseColonValues(_pm["resource-type"]);

                    if (resource_type.get(_resource_type) == null) {
                        resource_type.put(_resource_type, _resource_type)
                        allData[_resource_type] = {};
                    }

                    if (resource.get(_resource) == null) {
                        resource.put(_resource, _pm["resource"]);

                    }
                    if (!allData[_resource_type].hasOwnProperty([_pm["resource"]])) {
                        allData[_resource_type][_pm["resource"]] = [];
                    }

                    let pm_control_entry = _pm["pm-control-entry"];
                    if (pm_control_entry != null && pm_control_entry.length > 0) {
                        for (let j = 0; j < pm_control_entry.length; j++) {
                            let gr = parseColonValues(pm_control_entry[j]["period"]);
                            if (period.get(gr) == null) {
                                period.put(gr, pm_control_entry[j]["period"])
                            }
                            let pm_parameter_list = convertToArray(pm_control_entry[j]["supported-parameters"]);
                            for (let m = 0; m < pm_parameter_list.length; m++) {
                                let _ps = parseColonValues(pm_parameter_list[m]);
                                if (parameters.get(_ps) == null) {
                                    parameters.put(_ps, _ps);
                                }
                                if (allData[_resource_type][_pm["resource"]].indexOf(_ps) < 0) {
                                    allData[_resource_type][_pm["resource"]].push(_ps);
                                }
                            }
                        }
                    }
                }
            }
        }
        allPMInitData = {
            "data-type": data_type,
            "period": period,
            "resource": resource,
            "resource-type": resource_type,
            "parameter": parameters,
            "number-of-records": numberRecords,
            "skip-records": skipRecords,
            "direction": direction,
            "location": location,
            "allData": allData,
            "copyResource": resource,
            "copyParameter": parameters,
        }
        callback(allPMInitData);
        loadingModal.close();
    })
}

let regexpMsgConfig = {
    "start-time": {
        "warningMessage": "It must be a time, e.g. '2020-01-01T01:01:01Z'"
    },
    "end-time": {
        "warningMessage": "It must be a time, e.g. '2020-01-01T01:01:01Z'"
    }
}

let previousFilter = {};

let filterPMData = function (allFilter, filter, callback) {
    if (filter["resource-type"] != null && filter["resource-type"].length > 0) {
        let rsMap = new JSMap();
        let parametersMap = new JSMap();
        for (let i = 0; i < filter["resource-type"].length; i++) {
            let rs = allFilter.allData[filter["resource-type"][i]];
            for (let key in rs) {
                rsMap.put(resource2KeyName(key), key);
                let parameter = rs[key];
                for (let j = 0; j < parameter.length; j++) {
                    parametersMap.put(parameter[j], parameter[j]);
                }
            }
        }
        allFilter["resource"] = rsMap;
        allFilter["parameter"] = parametersMap;
    }
    if (filter["resource"] == PLEASE_SELECT_VALUE) {
        filter["resource"] = [];
    }
    if (filter["resource-type"] == PLEASE_SELECT_VALUE) {
        filter["resource-type"] = [];
    }
    if (filter["period"] == PLEASE_SELECT_VALUE) {
        filter["period"] = [];
    }
    if ((previousFilter["resource-type"] == null && filter["resource-type"] != null && filter["resource-type"].length > 0)
        || (filter["resource-type"] == null && previousFilter["resource-type"] != null && previousFilter["resource-type"].length > 0)
        || (previousFilter["resource-type"] != null && filter["resource-type"] != null && previousFilter["resource-type"].length != filter["resource-type"].length)) {
        delete filter["resource"]
    }
    if (filter["resource"] != null && filter["resource"].length > 0) {
        let parametersMap = new JSMap();
        for (let i = 0; i < filter["resource"].length; i++) {
            let rsName = filter["resource"][i];
            for (let key in allFilter.allData) {
                if (allFilter.allData[key].hasOwnProperty(rsName)) {
                    let parameter = allFilter.allData[key][rsName];
                    for (let j = 0; j < parameter.length; j++) {
                        parametersMap.put(parameter[j], parameter[j]);
                    }
                    break;
                }
            }
        }
        allFilter["parameter"] = parametersMap;
    }
    if ((filter["resource-type"] == null || filter["resource-type"].length == 0) &&
        (filter["resource"] == null || filter["resource"].length == 0)) {
        allFilter["resource"] = allFilter["copyResource"];
        allFilter["parameter"] = allFilter["copyParameter"];
    }
    delete filter["parameter"]
    previousFilter = deepClone(filter);
    callback(allFilter);
}

let changeUpdateConfig = ["resource", "resource-type"]

let getHeadInitPanel = function (initControlData, control_Type, validatorsConfig) {
    let _items = extendCustomConfig(getRpcConfig("get-pm").input, getRpcConfig("filter").input);
    delete _items["filter-id"];
    // delete _items["AID"]
    let newItem = {};
    for (let key in control_Type) {
        if (_items.hasOwnProperty(key)) {
            newItem[key] = parseItem(control_Type, key, _items, validatorsConfig);
            delete _items[key];
        }
    }
    for (let key in _items) {
        newItem[key] = parseItem(control_Type, key, _items, validatorsConfig);
    }
    return {
        show: true,
        items: newItem
    }
};

let parseItem = function (control_Type, _key, _items, validatorsConfig) {
    // delete _items[_key]["validators"];
    // delete _items[_key]["range2"];
    if (control_Type.hasOwnProperty(_key)) {
        _items[_key]["control_Type"] = control_Type[_key]["control_Type"];
        if (control_Type[_key]["control_Type"] == TableFilterTypeEnum.MultiSelect) {
            _items[_key]["multiSelect_type"] = "Normal"
        }
    } else {
        _items[_key]["control_Type"] = TableFilterTypeEnum.TextInput;
    }
    if (validatorsConfig.hasOwnProperty(_key)) {
        _items[_key]["validators"] = validatorsEnabled(validatorsConfig[_key], _key)
    }
    if (regexpMsgConfig.hasOwnProperty(_key)) {
        _items[_key]["validators"]["regexp"]["message"] = function () {
            return regexpMsgConfig[_key]["warningMessage"];
        }
    }

    if (changeUpdateConfig.indexOf(_key) > -1) {
        _items[_key].onChange = filterPMData;
    }
    return _items[_key];
}

let checkInitSelectEmpty = function (val) {
    if (isEmpty(val) || val === PLEASE_SELECT_VALUE) {
        return false;
    }
    return true;
};

let validatorsEnabled = function (enabled, key) {
    if (enabled) {
        return {
            custom: {
                custom: checkInitSelectEmpty,
                message: function () {
                    return getText("error_required").format(getText(key))
                }
            }
        }
    } else {
        return {}
    }
}

let getTableInfo = function () {
    let fileName = "real-time";
    if (previousRequest != null) {
        if (previousRequest["data-type"] != null) {
            fileName = previousRequest["data-type"];
            if (previousRequest["period"] != null && previousRequest["data-type"] != "real-time") {
                if (previousRequest["period"] != PLEASE_SELECT_VALUE) {
                    fileName += "_" + parseColonValues(previousRequest["period"]);
                }
            }
        }
    }
    return fileName;
}

let createPM = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    let initControlData = {};
    let validatorsConfig = {
        "data-type": true
    }
    let control_Type = {
        "data-type": {control_Type: TableFilterTypeEnum.Select},
        "period": {control_Type: TableFilterTypeEnum.Select},
        "number-of-records": {control_Type: TableFilterTypeEnum.TextInput},
        "skip-records": {control_Type: TableFilterTypeEnum.TextInput},
        "start-time": {control_Type: TableFilterTypeEnum.TextInput},
        "end-time": {control_Type: TableFilterTypeEnum.TextInput},
        "start-bin": {control_Type: TableFilterTypeEnum.TextInput},
        "end-bin": {control_Type: TableFilterTypeEnum.TextInput},
        "resource": {control_Type: TableFilterTypeEnum.MultiSelect},
        "resource-type": {control_Type: TableFilterTypeEnum.MultiSelect},
        "parameter": {control_Type: TableFilterTypeEnum.MultiSelect},
        "direction": {control_Type: TableFilterTypeEnum.MultiSelect},
        "location": {control_Type: TableFilterTypeEnum.MultiSelect},
        "AID": {control_Type: TableFilterTypeEnum.TextInput}
    };
    if (showPanelConfig.initFilter == null) {
        showPanelConfig.initFilter = {
            "data-type": "real-time"
        }
    } else {
        let isErrorUrl = false;
        if (!showPanelConfig.initFilter.hasOwnProperty("data-type")) {
            showPanelConfig.initFilter["data-type"] = "real-time";
        } else {
            if (showPanelConfig.initFilter["data-type"] == "history") {
                if (!showPanelConfig.initFilter.hasOwnProperty("period")) {
                    showError("Please select the Period!");
                    isErrorUrl = true;
                }
            }
        }
        if (showPanelConfig.initFilter.hasOwnProperty("period")) {
            showPanelConfig.initFilter.period = "ioa-pm:" + showPanelConfig.initFilter.period;
        }
        if (!isErrorUrl && showPanelConfig.initFilter.hasOwnProperty("resource")) {
            let _resourceList = showPanelConfig.initFilter["resource"].split(",");
            for (let i = 0; i < _resourceList.length; i++) {
                let _resourceNameArray = _resourceList[i].split("-");
                let _objType = null;
                let _objId = null;
                for (let i = _resourceNameArray.length; i > 0; i--) {
                    if (getYang("yang")[_resourceNameArray.slice(0, i).join("-")] != null) {
                        _objType = _resourceNameArray.slice(0, i).join("-");
                        _objId = _resourceNameArray.slice(i).join("-");
                        break;
                    }
                }
                if (_objType == null || _objId == null) {
                    showError("The object of RUL parameter 'resource' is incorrect!");
                    isErrorUrl = true;
                }
                let _keyWhere = {};
                _keyWhere[_objType] = {
                    "name": _objId
                }
                _resourceList[i] = getEntityPathByKey(_objType, _keyWhere);
            }
            showPanelConfig.initFilter["resource"] = _resourceList;
        }
        let supportSelectType = ["resource-type", "parameter", "direction", "location", "aid"];
        supportSelectType.forEach(_key => {
            let realKey = _key;
            if (_key == "aid") {
                realKey = "AID"
            }
            if (showPanelConfig.initFilter.hasOwnProperty(_key)) {
                showPanelConfig.initFilter[realKey] = showPanelConfig.initFilter[_key].split(",")
            }
        })
        if (isErrorUrl) {
            showPanelConfig.initFilter = {
                "data-type": "real-time"
            }
        }
    }
    let tableConfig = {
        defaultTableFilter: showPanelConfig.filter,
        defaultTableSelected: showPanelConfig.selected,
        defaultTableInitFilter: showPanelConfig.initFilter,
        showTableBody: false,
        tableKey: tableHashCode,
        reloadBtn: {
            enabled: false
        },
        sort: {
            sortKey: "resource",
            sortFlag: SortFlag.ASC
        },
        defineButtons: [
            {
                key: "react-table-init-panel-btn-clear",
                label: "clear",
                enabled: function () {
                    return checkUserClass(getRpcConfig("clear-pm"), USER_CLASS_TYPE.write)
                },
                click: function (filter) {
                    return function () {
                        let initConfig = {
                            "AID": {
                                editEnable: true
                            }
                        };
                        for (let key in allPMInitData) {
                            initConfig[key] = {};
                            let _enum = [];
                            if (allPMInitData[key].data != null) {
                                if (key == "period" || key == "resource" || key == "resource-type") {
                                    if (key == "resource") {
                                        for (let subKey in allPMInitData["copyResource"].data) {
                                            let _obj = {
                                                label: subKey,
                                                value: allPMInitData["copyResource"].data[subKey]
                                            };
                                            let keys = Object.keys(allPMInitData["allData"]);
                                            for (let i = 0; i < keys.length; i++) {
                                                let key = keys[i];
                                                if (allPMInitData["allData"][key].hasOwnProperty(_obj.value)) {
                                                    _obj["type"] = key;

                                                }
                                            }
                                            _enum.push(_obj)
                                        }
                                        initConfig[key].afterUpdate = function (data, config) {
                                            let filterEnum = deepClone(config.enumValue);
                                            if (data["resource-type"] != PLEASE_SELECT_VALUE) {
                                                for (let i = filterEnum.length - 1; i >= 0; i--) {
                                                    if (filterEnum[i].type != data["resource-type"]) {
                                                        filterEnum.splice(i, 1);
                                                    }
                                                }
                                            }
                                            return filterEnum;
                                        }
                                    } else {
                                        for (let subKey in allPMInitData[key].data) {
                                            _enum.push({
                                                label: subKey,
                                                value: allPMInitData[key].data[subKey]
                                            })
                                        }
                                    }
                                }
                                if (_enum.length > 0) {
                                    initConfig[key]["enumValue"] = _enum;
                                }
                                if (key == "period" || key == "resource" || key == "resource-type" ||
                                    key == "direction" || key == "location") {
                                    initConfig[key]["type"] = FormControlTypeEnum.Select;
                                }
                            }
                        }
                        editRpcItem("clear-pm", {
                            "initConfig": initConfig,
                            // "initData" : deepClone(filter),
                            'title': getText("clear-pm")
                        })
                    }
                }
            },
            {
                label: getText("upload"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write);
                },
                click: function (data, event) {
                    return function () {
                        let init = {
                            title: getText("upload-pm-logs"),
                            initKey: "pmLog",
                            showMessage: true
                        }
                        editRpcItem("upload", init);
                    }
                },
                buttonClass: {
                    normal: "upload",
                }
            },
        ],
        eachColFilter: {
            showCol: control_Type
        },
        headInitPanel: getHeadInitPanel(initControlData, control_Type, validatorsConfig),
        tableHead: {
            "data-type": {
                label: getText("data-type")
            },

        },
        globalEdit: [],
        rowEdit: []
    };
    return <ReactTable key={"_react_key_History_table_" + tableHashCode} hashCode={tableHashCode}
                       tableInfo={getTableInfo}
                       getDataFun={getHistoryData} loadMask="true" initFilterDataFun={initFilterDataFun}
                       initLoadData={showPanelConfig.urlRequest != null ? true : false}
                       initFilterData={initControlData} tableData={[]} tableConfig={tableConfig}
                       tableDivClass="minHeight100"/>;

}


export {createPM as pmView};