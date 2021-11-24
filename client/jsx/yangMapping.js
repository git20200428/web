import {YangExpand, YangUserDefine as yangConfig} from "./yang_user_define";
import {
    convertToArray,
    deepClone,
    enumFormControlType as FormControlTypeEnum,
    extendCustomConfig,
    getText,
    getYang,
    isEmptyObj,
    isNullOrUndefined,
    isObject,
    requestData,
    parseEditCondition
} from "./custom/utils";

/**
 * yang mapping for webGUI.
 * the values need same as yang.json
 */
const YangMapping = {
    // "pm-control-entry" : ["pm-resource","pm-control-entry"],
}

const expandIndexStr = "expandConfig";
const InnerSpecificParameter = ["inputCSS", "labelCSS", "showId"];
const SpecificParameter = ["inputCSS", "labelCSS", "showId", expandIndexStr, "user-class", "definition"];

const typeMapping = {
    "enumeration": FormControlTypeEnum.Select,
    "boolean": FormControlTypeEnum.Select,
    "string": FormControlTypeEnum.Text,
    "decimal128": FormControlTypeEnum.Text,
    "decimal64": FormControlTypeEnum.Text,
    "decimal32": FormControlTypeEnum.Text,
    "decimal16": FormControlTypeEnum.Text,
    "decimal8": FormControlTypeEnum.Text,
    "bits": FormControlTypeEnum.MultiSelect,
    "uint8": FormControlTypeEnum.Text,
    "uint16": FormControlTypeEnum.Text,
    "uint32": FormControlTypeEnum.Text,
    "union": FormControlTypeEnum.TextSelect,
}

const initValidators = {
    "int8": {
        min: "-128",
        max: "127"
    },
    "uint8": {
        min: "0",
        max: "255"
    },
    "int16": {
        min: "-32768",
        max: "32767"
    },
    "uint16": {
        min: "0",
        max: "65535"
    },
    "int32": {
        min: "-2147483648",
        max: "2147483647"
    },
    "uint32": {
        min: "0",
        max: "4294967295"
    },
    "int64": {
        min: "-9223372036854775808",
        max: "9223372036854775807"
    },
    "uint64": {
        min: "0",
        max: "18446744073709551615"
    }
}

const yangTypeMapping = {
    "leaf-list": FormControlTypeEnum.MultiSelect
}

const mergeConfig = function (config1, config2) {
    for (let key in config2) {
        if (InnerSpecificParameter.indexOf(key) > -1) {
            config1[key] = config2[key];
        } else if (config2[key].hasOwnProperty("fix")) {
            config1[key] = config2[key];
        } else if (config1.hasOwnProperty(key)) {
            for (let config2Key in config2[key]) {
                if (config1[key][config2Key] instanceof Array) {
                    if (isObject(config2[key][config2Key]) && config2[key][config2Key].hasOwnProperty("fix")) {
                        config1[key][config2Key] = config2[key][config2Key];
                    } else {
                        config1[key][config2Key] = config1[key][config2Key].concat(config2[key][config2Key]);
                    }
                } else {
                    if (typeof (config1[key]) != "string") {
                        config1[key][config2Key] = config2[key][config2Key];
                    }
                }
            }
        } else {
            //do nothing
        }
    }
    return config1;
}

const parseType = function (subConfig) {
    if (subConfig.hasOwnProperty("type") && !subConfig.hasOwnProperty("fix")) {
        if (isNaN(subConfig["type"])) {
            let _type = FormControlTypeEnum.Text;
            if (typeMapping.hasOwnProperty(subConfig["type"])) {
                _type = typeMapping[subConfig["type"]];
            }
            if (yangTypeMapping.hasOwnProperty(subConfig["yangType"])) {
                _type = yangTypeMapping[subConfig["yangType"]];
            }
            subConfig["yangOriginaType"] = subConfig["type"];
            subConfig["type"] = _type;
        }
    }
}

const parseDefault = function (subConfig) {
    if (subConfig.hasOwnProperty("default") && !subConfig.hasOwnProperty("defaultValue")) {
        if( subConfig["default"].indexOf("$") > -1 || subConfig["default"].indexOf("/") > -1) {
            subConfig["defaultValue"] = ""
        } else {
            subConfig["defaultValue"] = subConfig["default"];
        }
        delete subConfig["default"];
    }
}

const parseDefinition = function (subConfig, type) {
    if (subConfig != null) {
        if (subConfig["user-class"] != null) {
            parseUserClass(subConfig, subConfig["user-class"]);
        }
    }
    let _yangConfig = yangConfig[type];
    if (_yangConfig != null && _yangConfig["definition"] != null) {
        mergeConfig(subConfig, _yangConfig["definition"]);
    }
}

const parseBits = function (subConfig) {
    if (subConfig.yangOriginaType == "bits") {
        subConfig.cellDataFun = function (treeObj, field) {
            if (treeObj != null && treeObj[field] != null) {
                return treeObj[field].split(" ").join(",");
            } else {
                return ""
            }
        }
    }
}

const parsePassword = function (type, subConfig) {
    if (subConfig.hasOwnProperty("password") && subConfig.password == "true") {
        subConfig["yangOriginaType"] = subConfig["type"];
        subConfig["type"] = FormControlTypeEnum.Password;
        subConfig.editInitConfig = function (data, callback) {
            callback({
                "fixedValue": ""
            })
        }
        if (type == "user" && subConfig.validators.hasOwnProperty("notRequired")) {
            delete subConfig.validators["notRequired"];
        }
    }
}

const parseUnion = function (type, key, subConfig) {
    if (subConfig.type == "union") {
        subConfig["validators"] = subConfig["validators"] || {};
        let _enumList = [], validatorArr = [], rangeList = [], messages = "";
        subConfig["union-value"].forEach(item => {
            if (item.type == "enumeration") {
                let keyArr = [];
                item["enum-value"].forEach(value => {
                    if( typeof(value) === "string" ) {
                        keyArr.push(value)
                    } else {
                        Object.keys(value).forEach(key => {
                            value.hasOwnProperty(key) && keyArr.push(key);
                        })
                    }
                })
                _enumList = _enumList.concat(keyArr);
            } else {
                let validators = parseValidators("", type, item).validators;
                if (validators != null) {
                    delete validators["notRequired"];
                    validatorArr.push(validators);
                }
            }
            if (item.range2 != null) {
                rangeList.push(item.range2);
            }
        })
        if (_enumList.length > 0) {
            subConfig["enum-value"] = _enumList;
            validatorArr.push({
                "enumList":
                    {
                        "enumList": _enumList,
                        message: function () {
                            return getText("error_pattern").format(getText(key));
                        }
                    }
            });
        }
        if (validatorArr.length > 0) {
            if (subConfig["validators"]["notEmpty"] == null) {
                subConfig["validators"]["notRequired"] = {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                };
            }
            subConfig["validators"]["union"] = {
                validators: validatorArr,
                message: function () {
                    return getText("error_pattern").format(getText(key));
                }
            };
        }

        if (rangeList.length > 0) {
            subConfig["placeholder"] = getText("range") + ": " + rangeList.join(" | ");
        }

    } else if (subConfig.type == "enumeration") {
        let keyArr = [], _enumList = [];
        subConfig["enum-value"].forEach(value => {
            Object.keys(value).forEach(key => {
                value.hasOwnProperty(key) && keyArr.push(key);
            })
        })
        _enumList = _enumList.concat(keyArr);
        if (_enumList.length > 0) {
            let validators = {};
            if (!subConfig.hasOwnProperty("mandatory") || (subConfig.hasOwnProperty("mandatory") && subConfig["mandatory"] === "false")) {
                validators = {
                    "notRequired": {
                        comment: "this is not required",
                        message: function () {
                            return "this is not required";
                        }
                    }
                };
            } else {
                validators = {
                    "notEmpty": {
                        message: function () {
                            return getText("error.config.required").format(getText(_key))
                        }
                    }
                };
            }
            validators["enumList"] = {
                "enumList": _enumList,
                message: function () {
                    return getText("error_pattern").format(getText(key));
                }
            };
            subConfig["validators"] = extendCustomConfig(validators, subConfig["validators"] || {});
        }
    }

}

const parseChoice = function (config) {
    for (let key in config) {
        let subConfig = config[key];
        let enumList = [];
        if (subConfig.yangType === "choice") {
            for (let subKey in subConfig) {
                if (isObject(subConfig[subKey]) && subConfig[subKey].hasOwnProperty("yangType")) {
                    let obj = {
                        label: getText(subKey),
                        value: subKey,
                    };
                    if (subConfig[subKey].description != null) {
                        obj.description = subConfig[subKey].description;
                    }
                    enumList.push(obj);
                    if (subConfig[subKey]["yangType"] === "case") {
                        let caseObj = subConfig[subKey];
                        for (let caseKey in caseObj) {
                            if (isObject(caseObj[caseKey]) && caseObj[caseKey].hasOwnProperty("yangType")) {
                                caseObj[caseKey]["when"] = "../" + key + " = " + subKey;
                                caseObj[caseKey]["label"] = caseKey;
                                config[caseKey] = caseObj[caseKey];
                            }
                        }

                    } else {
                        subConfig[subKey]["when"] = "../" + key + " = " + subKey;
                        subConfig[subKey]["label"] = subKey;
                        config[subKey] = subConfig[subKey]
                    }
                }
            }
            subConfig.enumValue = enumList;
            subConfig.needCommit = false;
            subConfig.type = FormControlTypeEnum.ChoiceRadio;
        }
    }
}

const parseEnum = function (subConfig, keyStr,addDescription) {
    let enumKey = ["enum-value", "bit-value"];
    for (let i = 0; i < enumKey.length; i++) {
        if (subConfig.hasOwnProperty(enumKey[i])) {
            let _enum = subConfig[enumKey[i]];
            let _euumList = [];
            for (let j = 0; j < _enum.length; j++) {
                if (typeof _enum[j] == "object") {
                    for (let key in _enum[j]) {
                        let _label = key;
                        if (subConfig.excludeEnum != null && subConfig.excludeEnum.indexOf(key) > -1) {
                            continue;
                        }
                        if (addDescription && _enum[j][key].hasOwnProperty("description")) {
                            _label += ' (' + _enum[j][key]["description"] + ')';
                        }

                        _euumList.push({
                            label: _label,
                            value: key,
                        })
                    }
                } else {
                    if (subConfig.excludeEnum != null && subConfig.excludeEnum.indexOf(_enum[j]) > -1) {
                        continue;
                    }
                    _euumList.push({
                        label: _enum[j],
                        value: _enum[j]
                    });
                }
            }
            subConfig["enumValue"] = _euumList;
            delete subConfig["enum-value"];

            if( subConfig.hasOwnProperty("edit-condition") ) {
                parseEditCondition(subConfig,keyStr);
            }
        }
    }
}

const parseUserClass = function (subConfig, userClass) {
    let userClassList = userClass.split(" ");
    let _userClassObj = {};
    userClassList.forEach(_userClass => {
        let _userClassList = _userClass.split(":");
        _userClassObj[_userClassList[0]] = _userClassList[1].split(",")
    })
    subConfig["user-class"] = _userClassObj;
}

const parseRange = function (subConfig) {
    if (subConfig.hasOwnProperty("range2") && subConfig.yangType == "leaf") {
        let range2Item = subConfig["range2"].split("..");
        if (range2Item.length > 1) {
            let fractionVlue = null;
            let minRange = parseFloat(range2Item[0].trim());
            let maxRange = parseFloat(range2Item[1].trim());
            if (subConfig["fraction-digits"] != null) {
                fractionVlue = Math.pow(10, parseInt(subConfig["fraction-digits"]));
                minRange = minRange * fractionVlue;
                maxRange = maxRange * fractionVlue
            }
            if (maxRange - minRange <= 100) {
                let enumList = [];
                for (let i = minRange; i <= maxRange; i++) {
                    let _value = i;
                    if (fractionVlue != null) {
                        _value = _value / fractionVlue;
                    }
                    enumList.push(
                        {
                            label: _value + "",
                            value: _value + ""
                        }
                    )
                }
                subConfig.type = FormControlTypeEnum.TextSelect;
                subConfig["enumValue"] = enumList;
                delete subConfig["enum-value"];
            }
        }
        subConfig["placeholder"] = getText("range") + ": " + subConfig["range2"];
    }
}

const parseExpandParameter = function (_config, _key, type) {
    if (!_config.hasOwnProperty(expandIndexStr)) {
        _config[expandIndexStr] = {};
    }
    if (!_config[expandIndexStr].hasOwnProperty(_config[_key])) {
        _config[expandIndexStr][_config[_key]] = {};
    }
    let _cfg = {}
    if (yangConfig.hasOwnProperty(type)
        && yangConfig[type].hasOwnProperty(_key)
        && yangConfig[type][_key].hasOwnProperty("extendConfig")) {
        _cfg = yangConfig[type][_key]["extendConfig"];
    }
    _config[expandIndexStr][_config[_key]][_key] = _cfg;
}

const parseUserDefineExpandParameter = function (_config, subConfig, _key, type) {
    if (!_config.hasOwnProperty(expandIndexStr)) {
        _config[expandIndexStr] = {};
    }
    if (!_config[expandIndexStr].hasOwnProperty(subConfig.type)) {
        _config[expandIndexStr][subConfig.type] = {};
    }
    let _cfg = {}
    if (yangConfig.hasOwnProperty(type)
        && yangConfig[type].hasOwnProperty(_key)
        && yangConfig[type][_key].hasOwnProperty("extendConfig")) {
        _cfg = yangConfig[type][_key]["extendConfig"];
    }
    _config[expandIndexStr][subConfig.type][_key] = _cfg;
}

const parseBoolean = function (subConfig) {
    if (subConfig["type"] === "boolean") {
        let _eumList = [];
        _eumList.push(
            {
                label: "True",
                value: "true"
            }
        )
        _eumList.push(
            {
                label: "False",
                value: "false"
            }
        )
        subConfig["enumValue"] = _eumList;
        if( !subConfig.hasOwnProperty("default") ) {
            subConfig["default"] = "false";
        }
    }
}

const parseString = function (subConfig) {
    if (subConfig["type"] === "string" && !subConfig.hasOwnProperty("default")) {
        subConfig["default"] = "";
    }
}

const parseNumber = function (subConfig) {
    if (Object.keys(initValidators).indexOf(subConfig["type"]) > -1 && !subConfig.hasOwnProperty("default")) {
        subConfig["default"] = "0";
    }
}

const parseLeafref = function (key, config, subConfig) {
    if (subConfig.hasOwnProperty("config") && subConfig["config"] == "false")
        return;
    if (subConfig.hasOwnProperty("path")) {
        let pathArray = subConfig["path"].replaceAll("ioa-ne:", "");
        pathArray = pathArray.split("\/");
        let selectedstr = pathArray[pathArray.length - 1];
        let fromStr = pathArray[pathArray.length - 2];
        if (subConfig["yangType"] === "leaf-list") {
            subConfig["type"] === FormControlTypeEnum.MultiSelect;
        } else if (subConfig["yangType"] === "leaf") {
            subConfig["type"] = FormControlTypeEnum.Select;
        }
        subConfig.requestInitConfig = function (data, callback) {
            const _config = {
                enumValue: []
            };
            requestData({
                select: [selectedstr],
                from: fromStr,
                // where: whereStr
            }, function (_selectedData) {
                const enumList = [];
                const _rslist = convertToArray(_selectedData[fromStr]);
                for (let i = 0; i < _rslist.length; i++) {
                    enumList.push({
                        label: _rslist[i][selectedstr],
                        value: _rslist[i][selectedstr]
                    })
                }
                callback({
                    enumValue: enumList
                })
            })
            return _config
        }
    }


}

const parseConfig = function (subConfig, yangType) {
    // if( yangType == "rpc" ) {
    //     subConfig["editEnable"] = true;
    // } else {
    if (subConfig.hasOwnProperty("config")) {
        subConfig["editEnable"] = (subConfig["config"] === "true");
        delete subConfig["config-value"];
    } else {
        subConfig["editEnable"] = true;
    }
    // }
}

const parseValidators = function (type, _key, subConfig) {
    let validators = {};
    if (subConfig.hasOwnProperty("mandatory") && subConfig["mandatory"] === "true") {
        validators["notEmpty"] = {
            message: function () {
                return getText("error.config.required").format(getText(_key))
            }
        }
    }
    if (subConfig.hasOwnProperty("type") && initValidators[subConfig["type"]]) {
        let minRange = initValidators[subConfig["type"]].min;
        let maxRange = initValidators[subConfig["type"]].max;
        let tp = subConfig["type"];
        if (subConfig.hasOwnProperty("range")) {
            if (subConfig["range"].indexOf("..") != -1) {
                let _length = subConfig["range"].split("..");
                minRange = _length[0].trim();
                maxRange = _length[1].trim();
            }
        }
        validators["validateInteger"] = {
            message: function () {
                return getText("error.config.Integer").format(getText(_key), tp)
            }
        }
        validators["between"] = {
            min: minRange,
            max: maxRange,
            message: function () {
                return getText("error.config.between").format(getText(_key), minRange, maxRange)
            }
        }
    }else if(subConfig.hasOwnProperty("type") && subConfig["type"]=== "decimal64"){
        if(subConfig.hasOwnProperty("fraction-digits")){
            let dig = parseInt(subConfig["fraction-digits"]);
            let reg = new RegExp("^(\\-|\\+)?\\d+(\\.\\d{1," + dig + "})?$");
            validators["decimal"] = {
                regexp: reg,
                message: function () {
                        return getText("error_pattern").format(getText(_key));
                }
            }
        }


    }

    if (subConfig.hasOwnProperty("range")) {
        let lengthArray = subConfig["range"].split("|"), betweenList = [];
        if (lengthArray.length == 2) {
            // validators["notEmpty"] = {
            //     message: function () {
            //         return getText("error.config.required").format(getText(_key))
            //     }
            // }
            lengthArray.forEach(val => {
                let vl = val.split("..");
                vl.length > 1 ? betweenList.push({
                    min: vl[0].trim(),
                    max: vl[1].trim()
                }) : betweenList.push({val: vl[0].trim()})
            });
            validators["between"] = {
                bwnArray: betweenList,
                message: function () {
                    return getText("error_pattern").format(getText(_key));
                }
            }
        } else {
            if (subConfig["range"].indexOf("..") > 0) {
                // validators["notEmpty"] = {
                //     message: function () {
                //         return getText("error.config.required").format(getText(_key))
                //     }
                // }
                let _length = subConfig["range"].split("..");
                let minRange = _length[0].trim();
                let maxRange = _length[1].trim();
                validators["between"] = {
                    min: minRange,
                    max: maxRange,
                    message: function () {
                        return getText("error.config.between").format(getText(_key), minRange, maxRange)
                    }
                }

            }
        }
        if (subConfig.hasOwnProperty("fraction-digits")) {
            validators["between"]["fraction-digits"] = parseInt(subConfig["fraction-digits"]);
        }
        subConfig["range2"] = subConfig["range"];
        delete subConfig["range"];
    }
    if (subConfig.hasOwnProperty("length") && subConfig["length"].toString().indexOf("..") > -1) {
        let lengthArray = subConfig["length"].split("|");
        if (lengthArray.length == 1) {
            let _length = lengthArray[0].split("..");
            let minLength = parseInt(_length[0]);
            let maxLength = parseInt(_length[1]);
            validators["stringLength"] = {
                min: minLength,
                max: maxLength,
                message: function () {
                    return getText("error.config.long").format(getText(_key), minLength, maxLength)
                }
            }
        } else {
            let patternList = [];
            lengthArray.forEach(val => {
                let vl = val.split("..");
                vl.length > 1 ? patternList.push({
                    min: parseInt(vl[0]),
                    max: parseInt(vl[1])
                }) : patternList.push({len: parseInt(vl[0])})
            })
            validators["stringLength"] = {
                lenArray: patternList,
                message: function () {
                    return getText("input_match").format(getText(_key), lengthArray.join("|"));
                    // return getText("error.config.long").format(getText(_key), minLength, maxLength)
                }
            }
        }
        delete subConfig["length"];
    }

    if (subConfig.hasOwnProperty("pattern")) {
        let patternList = [];
        convertToArray(subConfig["pattern"]).forEach(patternItem => {
            patternList.push(new RegExp("^" + patternItem.replace(/^\^|[\r\n]|\$$/g, "") + "$"));
        })
        validators["regexp"] = {
            regexp: patternList,
            message: function () {
                if (subConfig.warningMessage != null) {
                    return subConfig.warningMessage;
                } else {
                    return getText("error_pattern").format(getText(_key));
                }
            }
        }
        delete subConfig["pattern"];
    }
    if (!isEmptyObj(validators)) {
        if (!validators.hasOwnProperty("notEmpty")) {
            validators = extendCustomConfig({
                "notRequired": {
                    comment: "this is not required",
                    message: function () {
                        return "this is not required";
                    }
                }
            }, validators);
        }
        subConfig.validators = validators;
    }
    return subConfig;
}

const supportAddDesc = function (type,_key) {
    return (type === "ace" && _key === "protocol")
        || (type === "alarm-control" && _key === "arc-behavior")
}

const parseYangConfig = function (type, _config, expand, yangType) {
    parseChoice(_config);
    for (let _key in _config) {
        if (_key == "definition") {
            parseDefinition(_config[_key], type);
            continue;
        }
        parseValidators(type, _key, _config[_key]);
        if (typeof (_config[_key]) == "string") {
            if (isNullOrUndefined(expand) || expand) {
                if (_config[_key] === "container" || _config[_key] === "list") {
                    parseExpandParameter(_config, _key, type)
                }
            }
            delete _config[_key];
            continue;
        }
        if (typeof (_config[_key]) === "boolean" || typeof (_config[_key]) === "number") {
            delete _config[_key];
            continue;
        }
        let subConfig = _config[_key];
        if (subConfig.hasOwnProperty("extendConfig") &&
            subConfig.hasOwnProperty("type") &&
            (subConfig["type"] === "list" || subConfig["type"] === "container")) {
            parseUserDefineExpandParameter(_config, subConfig, _key, type)
            delete _config[_key];
            continue;
        }
        parseUnion(type, _key, subConfig);
        parseRange(subConfig);
        parseBoolean(subConfig);
        parseType(subConfig);
        parseDefault(subConfig);
        parseEnum(subConfig, _key,supportAddDesc(type,_key));
        parsePassword(type, subConfig);
        parseBits(subConfig);
        // parseWhen(subConfig); //requires-confirmation [], when, traffic-affecting
        if (SpecificParameter.indexOf(_key) < 0) {
            parseConfig(subConfig, yangType);
        }
        parseLeafref(_key, _config, subConfig);
        parseString(subConfig);
        parseNumber(subConfig);
        _config[_key] = subConfig;
    }
    return _config;
}

const getPathKey = function (type) {
    let YANG = getYang("yang");
    let _yang = YANG[type];
    if (_yang == null) {
        console.error("Can not find the type " + type + " settings in the yang.json\nPlease check it!");
        return {};
    }
    let _jsonObj = _yang["definition"]["jpath"];
    let keyObj = {};
    parseKeys(_jsonObj, keyObj, type);
    return keyObj;
}

const parseKeys = function (jsonObj, keyObj, parentKey) {
    let keyList = [];
    for (let key in jsonObj) {
        let _items = jsonObj[key];
        if (_items == "") {
            keyList.push(key);
        } else {
            parseKeys(_items, keyObj, key);
        }
    }
    if (keyList.length > 0) {
        keyObj[parentKey] = keyList;
    }
}

const setYangDefaultValue = function (cfg) {
    for (let key in cfg) {
        let item = cfg[key];
        if (!isObject(item)) continue;

        if (!item.hasOwnProperty("placeholder")) {
            item["placeholder"] = "";
        }
        if (!item.hasOwnProperty("validators")) {
            item["validators"] = {};
        }
        if (InnerSpecificParameter.indexOf(key) < 0 && !item.hasOwnProperty("label")) {
            item["label"] = key;
        }
    }
    return cfg;
}

const getRequestKeys = function (key, initData) {
    let requestKeys = getPathKey(key);
    let keys = {};
    for (let _itemKey in requestKeys) {
        let _itemValue = convertToArray(requestKeys[_itemKey]);
        if (initData.hasOwnProperty(_itemKey)) {
            /*  e.g.
                the key is "card",
                and the initData is {
                    card : {
                        name : "xxxx".
                    }
                }
             */
            let _pObj = {};
            for (let i = 0; i < _itemValue.length; i++) {
                if (initData[_itemKey].hasOwnProperty(_itemValue[i])) {
                    _pObj[_itemValue[i]] = initData[_itemKey][_itemValue[i]];
                }
            }
            if (!isEmptyObj(_pObj)) {
                keys[_itemKey] = _pObj;
            }
        } else {
            /*  e.g.
               the key is "card",
               and the initData is {
                   {
                       name : "xxxx".
                   }
               }
            */
            let _pObj = {};
            for (let i = 0; i < _itemValue.length; i++) {
                if (initData.hasOwnProperty(_itemValue[i])) {
                    _pObj[_itemValue[i]] = initData[_itemValue[i]];
                }
            }
            if (!isEmptyObj(_pObj)) {
                keys[_itemKey] = _pObj;
            }
        }
    }
    return keys;
}

const YANG_INSTANCE = {};

const getYangConfig = function (type, expand) {
    if (YANG_INSTANCE[type] != null) {
        return YANG_INSTANCE[type];
    }

    let YANG = getYang("yang");
    let _configList = YangMapping.hasOwnProperty(type) ? YangMapping[type] : [type];

    let configObj = {};
    for (let i = 0; i < _configList.length; i++) {
        let _objName = _configList[i];
        let _yang = YANG[_objName];
        if (_yang == null) {
            continue;
        }
        parseYangConfigItem(_yang, type, configObj, _objName, expand, "yang")
    }
    if (!isEmptyObj(configObj)) {
        YANG_INSTANCE[type] = configObj;
    }
    return configObj;
}


const getRpcConfig = function (type) {
    if (YANG_INSTANCE[type] != null) {
        return YANG_INSTANCE[type];
    }
    let YANG = getYang("rpc");
    if (YANG[type] == null) {
        return {};
    } else {
        let _yang = deepClone(YANG[type]);
        let configObj = {};
        if (_yang.hasOwnProperty("input")) {
            parseYangConfigItem(_yang["input"], type, configObj, type, false, "rpc");
            _yang["input"] = configObj;
        }
        parseDefinition(_yang["definition"], type);
        if (!isEmptyObj(_yang)) {
            YANG_INSTANCE[type] = _yang;
        }
        return _yang;
    }
}


const parseYangConfigItem = function (_yang, type, configObj, _objName, expand, yangType) {
    let _newCfg = deepClone(_yang);
    let _yangConfig = yangConfig[_objName];
    if (_yangConfig != null) {
        _newCfg = mergeConfig(_newCfg, _yangConfig);
    }
    _newCfg = setYangDefaultValue(_newCfg);
    _newCfg = parseYangConfig(type, _newCfg, expand, yangType);
    for (let _key in _newCfg) {
        if (!_newCfg[_key].hasOwnProperty("type") && (_key != "expandConfig" && _key != "definition")) {
            continue;
        }
        if (!configObj.hasOwnProperty(_key)) {
            configObj[_key] = _newCfg[_key];
        } else {
            configObj[_key] = extendCustomConfig(configObj[_key], _newCfg[_key])
        }
    }
}

export {getYangConfig, getRpcConfig, getPathKey, getRequestKeys, SpecificParameter}