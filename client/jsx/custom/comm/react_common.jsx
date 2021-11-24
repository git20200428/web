import React from 'react';
import ReactDOM from 'react-dom';

import {ModalConfigConstant, ReactModalAlert,ReactReduxModalAlert} from "../modal/react_modal";
import {Provider} from "react-redux";
import {FormControlTypeEnum, YangUserDefine as userDefineYang, YangUserDefine} from "../../yang_user_define";
import {getPathKey, getRequestKeys, getRpcConfig, getYangConfig} from "../../yangMapping";
import store from "../../redux/store";
import {
    confirmToast,
    deepClone,
    deleteCommit,
    editCommit,
    EXPAND_KEYS,
    extendCustomConfig,
    getText,
    getYang,
    getYangNameByXpath,
    isEmptyObj,
    isFunction,
    isNullOrUndefined,
    merge,
    parseYangAction,
    PLEASE_SELECT_VALUE,
    requestData,
    showAlertDialog,
    xPathToKeys
} from "../utils";
import {DialogType} from '../../components/modal/modal';
import {DynamicTabPanel} from "../table/dynamicTabPanel";
import {EventTypeEnum, MyReactEvents} from "../message_util";

let ModalAlertType = ModalConfigConstant.ModalAlertType;
let ModalBodyTypeEnum = ModalConfigConstant.ModalBodyTypeEnum;
let ModalButtonTypeEnum = ModalConfigConstant.ModalButtonTypeEnum;

let warningConfig = {
    "requires-confirmation": {
        message: function (data) {
            if (data.value == null) {
                data.value = "Are you sure? [y/n]";
            }
            return data.value.replace("\\n", "<br/>");
        }
    },
    "traffic-affecting": {
        message: function (data) {
            return getText("traffic-affecting-warning").format(data.keys.join(","))
        }
    }
}

let refreshTableType = {
    "table": 0,
    "treeTable": 1
}

const expandIndexStr = "expandConfig";

/**
 *
 * @param objectType        //same as yang.json
 * @param init              //initData && initConfig && title
 * {
 *     initData : {xxx},    //JSON String, init the create panel items value.
 *     initKey : {xxx}      //JSON String, it for init the where keys, not request init panel data,
 *                            it is different with the edit function, on normal, it can be not set.
 *     initConfig : {},     //e.g. {"alias-name" :{disabled:false}｝} to cover the default config.
 *     title : "xxx"
 * }
 * @param refreshConfig     //please reference the refresh function desc.
 * @param callback
 */
let createItem = function (objectType, init, refreshConfig, callback) {
    let initData = {}, initConfig = {}, initConfigData = {}, title = "", formData = {}, parentData = null,
        initKey = null;
    let keyListObj = getPathKey(objectType);
    let keyList = keyListObj[objectType] || keyListObj;
    if (!isNullOrUndefined(init)) {
        if (init.hasOwnProperty("initConfig")) {
            initConfig = init.initConfig;
        }
        if (init.hasOwnProperty("initConfigData")) {
            initConfigData = init.initConfigData;
        }
        if (init.hasOwnProperty("initData")) {
            initData = init.initData;
        }
        if (init.hasOwnProperty("initKey")) {
            initKey = init.initKey;
        }
        if (init.parentData != null) {
            parentData = init.parentData;
        }
        if (init.hasOwnProperty("title") && !isNullOrUndefined(init.title)) {
            title = init.title;
        } else {
            title = getText(objectType);
        }
    }
    initConfigData["keys"] = initKey;
    let _config = getYangConfig(objectType);

    initUserDefineConfig(YangUserDefine[objectType], _config, "requestInitConfig", initConfigData, initKey,function (_cfg) {
        initConfig = extendCustomConfig(initConfig, _cfg);
        initUserDefineConfig(YangUserDefine[objectType], _config, "createInitConfig", initConfigData, initKey,function (_cfg) {
            initConfig = extendCustomConfig(initConfig, _cfg);
            for (let _key in initConfig) {   //fixed enum value for select component.
                if (initConfig[_key].hasOwnProperty("fixedEnumValue")) {
                    if (_config.hasOwnProperty(_key)) {
                        _config[_key]["enumValue"] = [];
                    }
                }
            }
            _config = extendCustomConfig(_config, initConfig);
            Object.keys(_config).map(key => {
                let value = _config[key];
                if (!value.hasOwnProperty("type")) {
                    return;
                }
                if (value.hasOwnProperty("show") && !value.show) {
                    return;
                }
                if (existKey(keyList, key)) {
                    value.editEnable = true;
                    _config[key]["mandatory"] = "true";
                    if (!value.hasOwnProperty("validators")) {
                        value["validators"] = {};
                    }
                    delete value["validators"]["notRequired"];
                    value["validators"] = extendCustomConfig(
                        {
                            "notEmpty": {
                                message: function () {
                                    return getText("error_required").format(getText(value.label))
                                }
                            }
                        }, value["validators"]);
                }
                if (value.type == FormControlTypeEnum.Password) {
                    _config[key].type = FormControlTypeEnum.NormalPassword;
                } else if (value.type == FormControlTypeEnum.Select && value["validators"] != null
                    && value["validators"]["notEmpty"] != null) {
                    value["validators"]["regexp"] = {
                        regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                        message: function () {
                            return getText("error_required").format(getText(value.label))
                        }
                    }
                }
                if (value.hasOwnProperty("set-on-create-only") && value["set-on-create-only"]) {
                    value.editEnable = true;
                }
                if (value.editEnable) {
                    if (initData.hasOwnProperty(key)) {
                        formData[key] = initData[key];
                    } else {
                        if (isNullOrUndefined(value.defaultValue)) {
                            if (value.hasOwnProperty("enumValue")) {    //if the select can not set default value, set it the 1st option value.
                                formData[key] = (value.type == FormControlTypeEnum.MultiSelect ? [] : PLEASE_SELECT_VALUE);
                            } else {
                                formData[key] = "";
                            }
                        } else {
                            if (value.type == FormControlTypeEnum.MultiSelect && value.yangOriginaType == "bits"
                                && typeof value.defaultValue == "string") {
                                formData[key] = value.defaultValue.split(" ");
                            } else {
                                formData[key] = value.defaultValue;
                            }
                        }
                    }
                } else if (value.hasOwnProperty("defaultValue")) {
                    formData[key] = value.defaultValue;
                    value.show = false;
                }
                if (value.hasOwnProperty("fixedValue") && value.fixedValue != null) {
                    formData[key] = value.fixedValue
                }
            });
            let committing = false;
            let originalValues = deepClone(formData);
            let modalConfig = {
                head: {
                    title: getText("create") + " " + getText(title)
                },
                body: {
                    bodyContentType: ModalBodyTypeEnum.Form,
                    bodyContentMessage: ""
                },
                foot: {
                    buttons: [
                        {
                            type: ModalButtonTypeEnum.Ok,
                            label: getText("submit"),
                            clickFunction: function (data, fun) {
                                if (committing) {
                                    return;
                                }
                                committing = true;
                                let submitData = extendCustomConfig(data, {});
                                let commitData = {}
                                for (let key in submitData) {
                                    if (_config[key].hasOwnProperty("needCommit") && !_config[key]["needCommit"]) {
                                        continue;
                                    }
                                    if (submitData[key] != PLEASE_SELECT_VALUE) {
                                        let keyList = getPathKey(objectType)[objectType];
                                        if( isNullOrUndefined(keyList) ) {
                                            keyList = [];
                                        }
                                        if (keyList.indexOf(key) > -1 || _config[key]["mandatoryCommit"] || submitData[key] != "" ||
                                            (originalValues[key] != submitData[key] &&
                                                !(originalValues[key] == null && submitData[key] == ""))) {
                                            if (keyList.indexOf(key) < 0 && _config[key].defaultValue == submitData[key] && _config[key]["mandatoryCommit"] == null) {
                                                continue;
                                            }
                                            if (_config[key].type == FormControlTypeEnum.MultiSelect && _config[key].yangOriginaType == "bits") {
                                                commitData[key] = submitData[key].join(" ");
                                            } else {
                                                if (typeof (submitData[key]) == "string") {
                                                    commitData[key] = submitData[key].trim();
                                                } else {
                                                    commitData[key] = submitData[key];
                                                }
                                            }
                                        }
                                    }
                                }
                                let values = {};
                                values[objectType] = commitData;
                                if (initKey != null) {
                                    if (initKey.hasOwnProperty(objectType)) {
                                        delete initKey[objectType];
                                    }
                                    let whereKeys = getRequestKeys(objectType, initKey);
                                    if (!isEmptyObj(whereKeys)) {
                                        merge(values, whereKeys);
                                    }
                                }
                                let _request = {
                                    "values": values,
                                    "into": objectType
                                }

                                let updateConfig = {
                                    "insert": _request
                                }

                                checkWarning(updateConfig, "create", commitData, _config, submitData, refreshConfig, fun, callback, function () {
                                    committing = false;
                                })
                            }
                        }
                    ]
                }
            };
            let helpString = (init && init.hasOwnProperty("helpString")) ? init.helpString : ("create" + objectType).replaceAll(" ", "").replaceAll("-", "").toLowerCase();
            ReactDOM.render(<Provider store={store}><ReactReduxModalAlert modalConfig={modalConfig} formData={formData} controlConfig={_config}
                                             objectType={objectType} parentData={parentData} helpString={helpString}
                                                                     alertType={ModalAlertType.Create}/></Provider>, document.getElementById("additionalContent1"));
        })
    })
};

/**
 *
 * @param objectType        //same as yang.json
 * @param init              //initData && initConfig && title
 * {
 *     initData : {},       //JSON String, init the data for edit panel, it's priority then intiKey.
 *     intiKey : {},        //JSON String, init the create request keys and request init data.
 *     initConfig : {},     //e.g. {"alias-name" :{disabled:false}｝} to cover the default config.
 *     title : "xxx"        //define the title.
 * }
 * @param refreshConfig     //please reference the refresh function desc.
 * @param callback
 */
let editItem = function (objectType, init, refreshConfig, callback) {
    let initData = null, initConfig = {}, title = objectType, parentData = null,
        formData = {}, initKey = null, extendsKey = null, keyStr = objectType;
    let keyList = getPathKey(objectType)[objectType];

    if (objectType.indexOf(".") !== -1) {
        keyStr = objectType.substring(objectType.indexOf('.') + 1, objectType.length);
        keyList = getPathKey(objectType)[keyStr]
    }
    if (keyList == null) { //if the type no exist key.
        keyList = []
    }
    let titleFromKey = false;
    if (!isNullOrUndefined(init)) {
        if (init.hasOwnProperty("initConfig")) {
            initConfig = init.initConfig;
        }
        if (init.hasOwnProperty("initData")) {
            initData = init.initData;
        }
        if (init.hasOwnProperty("initKey")) {
            initKey = init.initKey;
        }
        if (init.hasOwnProperty("extendsKey")) {
            extendsKey = init.extendsKey;
        }
        if (init.parentData != null) {
            parentData = init.parentData;
        }
        if (init.hasOwnProperty("title") && !isNullOrUndefined(init.title)) {
            title = init.title;
        } else if (!isNullOrUndefined(objectType)) {
            title = getText(objectType);
        } else {
            if (initData != null && initData.hasOwnProperty(keyList[0])) {
                titleFromKey = true;
                title = initData[keyList[0]]
            }
        }
    }

    let _yangConfig = getYangConfig(objectType);
    let _config = extendCustomConfig(_yangConfig, initConfig);
    initItemData(objectType, initData, initKey, _config,function (_data) {
        let newInitData = {}
        if (_data.hasOwnProperty(objectType) && _data[objectType].length > 0) {
            newInitData = _data[objectType][0];
        }
        if (isEmptyObj(newInitData)) {
            let config = {};
            config.dialogType = DialogType.ERROR;
            config.showText = getText("object_not_exist")
            showAlertDialog(config);
            return;
        }
        let _extendConfig = extendExpandYang(_yangConfig, _config, newInitData);  //init expand config.
        _config = _extendConfig.config;
        let expandType = _extendConfig.expandType;
        let commitRequired = _extendConfig.commitRequired;
        initUserDefineConfig(_config, _yangConfig, "requestInitConfig", newInitData, initKey || extendsKey,function (_newconfig) {
            _config = extendCustomConfig(_config, _newconfig);
            initUserDefineConfig(_config, _yangConfig, "editInitConfig", newInitData,initKey || extendsKey, function (_newconfig) {
                _config = extendCustomConfig(_config, _newconfig);
                for (let i = 0; i < expandType.length; i++) {   //reset the expand data to parent object.
                    if (newInitData.hasOwnProperty(expandType[i])) {
                        let expandDateItem = newInitData[expandType[i]];
                        for (let _key in expandDateItem) {
                            newInitData[EXPAND_KEYS.format(expandType[i]) + _key] = expandDateItem[_key];
                        }
                    } else {
                        Object.keys(_config).map(key => {
                            let value = _config[key];
                            if (key.startsWith(EXPAND_KEYS.format(expandType[i])) && value.hasOwnProperty("set-on-create-only")) {
                                value["set-on-create-only"] = false;
                            }
                        })
                    }
                }
                Object.keys(_config).map(key => {
                    let value = _config[key];
                    if (key == expandIndexStr) {
                        return;
                    }
                    if (!value.hasOwnProperty("type")) {
                        return;
                    }
                    if (value.hasOwnProperty("show") && !value.show) {
                        return;
                    }
                    if (existKey(keyList, key)) {
                        value.editEnable = false;
                    }
                    if (value.hasOwnProperty("set-on-create-only") && value["set-on-create-only"]) {
                        value.editEnable = false
                    }
                    if (value.hasOwnProperty("password") && value["password"] === "true") {
                        delete value["mandatory"];
                        value.commitEnable = false;
                    }

                    if (!value.editEnable && value.type == FormControlTypeEnum.Select) {
                        value.type = FormControlTypeEnum.Text;
                        if (value.hasOwnProperty("fixedValue") && value.fixedValue != null) {
                            formData[key] = value.fixedValue
                        }else{
                            if (newInitData.hasOwnProperty(key)) {
                                for (let i = 0; i < value["enumValue"].length; i++) {
                                    if (newInitData[key] == value["enumValue"][i].value) {
                                        formData[key] = value["enumValue"][i].label;
                                        // delete newInitData[key];
                                        break;
                                    }
                                }
                            }
                        }
                        delete value["enumValue"];
                    }

                    if (newInitData.hasOwnProperty(key)) {
                        if (value.type == FormControlTypeEnum.MultiSelect && typeof (newInitData[key]) == "string") {
                            if (value.yangOriginaType == "bits") {
                                formData[key] = newInitData[key].split(" ");
                            } else {
                                formData[key] = [newInitData[key]];
                            }
                        } else {
                            formData[key] = newInitData[key];
                        }
                    } else {
                        if (value.hasOwnProperty("expandType")) {
                            if (isNullOrUndefined(value.defaultValue)) {
                                if (value.hasOwnProperty("enumValue")) {
                                    // formData[key] = PLEASE_SELECT_VALUE;
                                    formData[key] = (value.type == FormControlTypeEnum.MultiSelect ? [] : PLEASE_SELECT_VALUE);
                                } else {
                                    formData[key] = "";
                                }
                            } else {
                                if (value.type == FormControlTypeEnum.MultiSelect && value.yangOriginaType == "bits"
                                    && typeof value.defaultValue == "string") {
                                    formData[key] = value.defaultValue.split(" ");
                                } else {
                                    formData[key] = value.defaultValue;
                                }
                            }
                        }
                    }

                    if (value.hasOwnProperty("fixedValue") && value.fixedValue != null) {
                        formData[key] = value.fixedValue
                    }
                    if (!value.editEnable && value.type == FormControlTypeEnum.MultiSelect) {
                        value.type = FormControlTypeEnum.Text;
                    }
                    if (value.type == FormControlTypeEnum.Select && value.editEnable && value["validators"] != null
                        && value["validators"]["notEmpty"] != null) {
                        value["validators"]["regexp"] = {
                            regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                            message: function () {
                                return getText("error_required").format(getText(value.label))
                            }
                        }
                    }
                    if( value.type == FormControlTypeEnum.MultiSelect && !isNullOrUndefined(formData[key]) && formData[key].length === 1 && formData[key][0] === "" ) {
                        formData[key] = [PLEASE_SELECT_VALUE];
                    }
                    if( value.type == FormControlTypeEnum.Select && !isNullOrUndefined(formData[key]) && formData[key] === "" ) {
                        formData[key] = PLEASE_SELECT_VALUE;
                    }
                });
                if (titleFromKey) {
                    if (_config.hasOwnProperty(keyList[0]) && _config[keyList[0]].hasOwnProperty("cellDataFun")) {
                        let _newTitle = _config[keyList[0]]["cellDataFun"](newInitData, keyList[0]);
                        if (_newTitle != null && _newTitle != "") {
                            title = _newTitle;
                        }
                    }
                }
                let originalValues = deepClone(formData);
                let committing = false;
                let modalConfig = {
                    head: {
                        title: title
                    },
                    body: {
                        bodyContentType: ModalBodyTypeEnum.Form,
                        bodyContentMessage: ""
                    },
                    foot: {
                        buttons: [
                            {
                                type: ModalButtonTypeEnum.Ok,
                                label: getText("submit"),
                                clickFunction: function (data, fun) {
                                    if (committing) {
                                        return;
                                    }
                                    committing = true;
                                    let submitData = extendCustomConfig(data, {});
                                    let commitData = {};
                                    let expandValus = {};
                                    for (let key in submitData) {
                                        if (_config[key].hasOwnProperty("needCommit") && !_config[key]["needCommit"]) {
                                            continue;
                                        }
                                        if (isNullOrUndefined(_config[key]["editEnable"])
                                            || _config[key]["editEnable"] || _config[key]["mandatoryCommit"]) {
                                            if (_config[key]["mandatoryCommit"] || (originalValues[key] != submitData[key] &&
                                                !(originalValues[key] == null && submitData[key] == "")) ||
                                                (_config[key].type == FormControlTypeEnum.Password && submitData[key] != null)) {
                                                if (originalValues[key] instanceof Array && submitData[key] instanceof Array) {
                                                    if (JSON.stringify(originalValues[key]) == JSON.stringify(submitData[key])) {
                                                        continue;
                                                    }
                                                }
                                                if (submitData[key] == PLEASE_SELECT_VALUE) {
                                                    submitData[key] = "";
                                                }
                                                if (_config[key].hasOwnProperty("expandType")) {
                                                    let keyName = _config[key]["expandType"];
                                                    if (!expandValus.hasOwnProperty(keyName)) {
                                                        expandValus[keyName] = {};
                                                    }
                                                    if (_config[key].type == FormControlTypeEnum.MultiSelect && _config[key].yangOriginaType == "bits") {
                                                        expandValus[keyName][key.substring((key.indexOf(keyName) + keyName.length + 1))] = submitData[key].join(" ");
                                                    } else {
                                                        expandValus[keyName][key.substring((key.indexOf(keyName) + keyName.length + 1))] = submitData[key]
                                                    }
                                                } else {
                                                    if (_config[key].type == FormControlTypeEnum.MultiSelect && _config[key].yangOriginaType == "bits") {
                                                        commitData[key] = submitData[key].join(" ");
                                                    } else {
                                                        if (typeof (submitData[key]) == "string") {
                                                            commitData[key] = submitData[key].trim();
                                                        } else {
                                                            commitData[key] = submitData[key];
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    for (let key in expandValus) {
                                        let commit = true;
                                        if (commitRequired.hasOwnProperty(key)) {
                                            for (let i = 0; i < commitRequired[key].length; i++) {
                                                if (submitData[EXPAND_KEYS.format(key) + commitRequired[key][i]] == PLEASE_SELECT_VALUE) {
                                                    commit = false;
                                                    break;
                                                }
                                            }
                                        }
                                        if (commit) {
                                            if (typeof (submitData[key]) == "string") {
                                                commitData[key] = expandValus[key].trim();
                                            } else {
                                                commitData[key] = expandValus[key];
                                            }

                                        }
                                    }
                                    let editObj = {
                                        "set": commitData,
                                        "from": objectType,
                                    }
                                    let whereStr = getRequestKeys(objectType, (initKey == null ? newInitData : initKey));
                                    if (!isEmptyObj(whereStr)) {
                                        if (extendsKey != null) {
                                            merge(whereStr, extendsKey);
                                        }
                                        editObj["where"] = whereStr;
                                    }
                                    let updateConfig = {
                                        "edit": editObj
                                    }
                                    saveData(updateConfig, null, commitData, _config, submitData, refreshConfig, fun, callback, function () {
                                        committing = false;
                                    })
                                }
                            }
                        ]
                    }
                };
                let helpString = init.hasOwnProperty("helpString") ? init.helpString : objectType.replaceAll("-", "").toLowerCase();
                ReactDOM.render(<Provider store={store}><ReactReduxModalAlert modalConfig={modalConfig} formData={formData} controlConfig={_config}
                                                 objectType={objectType} parentData={parentData} helpString={helpString}
                                                                              alertType={ModalAlertType.Edit}/></Provider>, document.getElementById("additionalContent1"));
            })
        })
    });
}

let parseDefinition = function(keyString, commitType, _key, _config, submitData, fun) {
    if (_config["definition"] != null && _config["definition"][keyString] != null) {
        if (!isNullOrUndefined(commitType) &&
            (_config["definition"][keyString]["affect"] == null || _config["definition"][keyString]["affect"].indexOf(commitType) < 0)) {
            fun("definition", keyString, false);
            return;
        }
        parseYangAction(_config["definition"], keyString, _key, "when", submitData, function (rs, message) {
            fun("definition", keyString, rs, message)
        });
    } else {
        fun("definition", keyString, false);
    }
}

let checkWarning = function(updateConfig, commitType, commitData, _config, submitData, refreshConfig, fun, callback, returnState) {
    let warningData = {};
    let parameter = "name";
    parseDefinition("traffic-affecting", commitType, parameter, _config, submitData, function (key, keyString, rs, message) {
        if (rs) {
            setActionValue(warningData, _config, keyString, parameter, key, message);
        }
        parseDefinition("requires-confirmation", commitType, parameter, _config, submitData, function (key2, keyString2, rs2, message) {
            if (rs2) {
                setActionValue(warningData, _config, keyString2, parameter, key2, message);
            }
            let confirmTitle = [];
            for (let warningMsgKey in warningData) {
                confirmTitle.push(warningConfig[warningMsgKey].message(warningData[warningMsgKey]))
            }
            confirmToast(confirmTitle.join("<br>"), function () {
                    if (commitType == "delete") {

                    } else {
                        editCommit(updateConfig, function (_result) {
                            if (_result.result) {
                                fun();
                                refresh(refreshConfig);
                            }
                            if (!isNullOrUndefined(callback) && isFunction(callback)) {
                                callback(_result)
                            }
                            returnState();
                        }, function () {
                            returnState();
                        });
                    }
                }, function () {
                    returnState();
                }, (confirmTitle.length > 0)
            )
        })
    })
}

let saveData = function (updateConfig, commitType, commitData, _config, submitData, refreshConfig, fun, callback, returnState) {
    let warningData = {};
    let warningParameters = [];
    for (let _key in commitData) {
        if (typeof (commitData[_key]) != "string" && !(commitData[_key] instanceof Array)) {
            for (let _subKey in commitData[_key]) {
                warningParameters.push(EXPAND_KEYS.format(_key) + _subKey)
            }
        } else {
            warningParameters.push(_key)
        }
    }
    if (warningParameters.length > 0) {
        let returnCount = 0;
        for (let i = 0; i < warningParameters.length; i++) {
            let parameter = warningParameters[i];
            parseWarning("traffic-affecting", commitType, parameter, _config, submitData, function (key, keyString, rs, message) {
                if (rs) {
                    setActionValue(warningData, _config, keyString, parameter, key, message);
                }
                parseWarning("requires-confirmation", commitType, parameter, _config, submitData, function (key2, keyString2, rs2, message) {
                    returnCount++;
                    if (rs2) {
                        setActionValue(warningData, _config, keyString2, parameter, key2, message);
                    }
                    if (returnCount == warningParameters.length) {
                        let confirmTitle = [];
                        for (let warningMsgKey in warningData) {
                            confirmTitle.push(warningConfig[warningMsgKey].message(warningData[warningMsgKey]))
                        }
                        confirmToast(confirmTitle.join("<br>"), function () {
                                if (commitType == "delete") {

                                } else {
                                    editCommit(updateConfig, function (_result) {
                                        if (_result.result) {
                                            fun();
                                            if(!isNullOrUndefined(refreshConfig) && isFunction(refreshConfig.setFilePath)){
                                                refreshConfig.setFilePath(commitData.destination)
                                            }
                                            refresh(refreshConfig);
                                        }
                                        if (!isNullOrUndefined(callback) && isFunction(callback)) {
                                            callback(_result)
                                        }
                                        returnState();
                                    }, function () {
                                        returnState();
                                    });
                                }
                            }, function () {
                                returnState();
                            }, (confirmTitle.length > 0)
                        )
                    }
                })
            })
        }
    } else {
        editCommit(updateConfig, function (_result) {
            if (_result.result) {
                fun();
                refresh(refreshConfig);
            }
            if (!isNullOrUndefined(callback) && isFunction(callback)) {
                callback(_result)
            }
            returnState();
        }, function () {
            returnState();
        });
    }
}

/**
 * same as editItem.
 */
let detailsItem = function (objectType, init, refreshConfig, callback) {
    let initData = null, initConfig = {}, title = getText(objectType),
        formData = {}, initKey = null, keyStr = objectType;
    if (objectType.match(".")) {
        keyStr = objectType.substring(objectType.indexOf('.') + 1, objectType.length);
    }
    let keyList = getPathKey(objectType)[keyStr]
    if (!isNullOrUndefined(init)) {
        if (init.hasOwnProperty("initConfig")) {
            initConfig = init.initConfig;
        }
        if (init.hasOwnProperty("initData")) {
            initData = init.initData;
        }
        if (init.hasOwnProperty("initKey")) {
            initKey = init.initKey;
        }

        if (init.hasOwnProperty("title") && !isNullOrUndefined(init.title)) {
            title = init.title;
        } else {
            if (initData != null && initData.hasOwnProperty(keyList[0])) {
                title = initData[keyList[0]]
            }
        }
    }

    let _yangConfig = getYangConfig(objectType);
    let _config = extendCustomConfig(_yangConfig, initConfig);
    initItemData(objectType, initData, initKey,_config, function (_data) {
        if (!_data.hasOwnProperty(objectType)) {
            alert("Initialize the data error, please check the request key!");
            return;
        }
        if (_data[objectType] == null || _data[objectType].length < 1) {
            let config = {};
            config.dialogType = DialogType.ERROR;
            config.showText = getText("object_not_exist");
            showAlertDialog(config);
            return;
        }
        let newInitData = _data[objectType][0];
        let _extendConfig = extendExpandYang(_yangConfig, _config, newInitData);  //init expand config.
        _config = _extendConfig.config;
        let expandType = _extendConfig.expandType;

        initUserDefineConfig(_config, _yangConfig, "editInitConfig", newInitData, initKey,function (_newconfig) {
            _config = extendCustomConfig(_config, _newconfig);
            for (let i = 0; i < expandType.length; i++) {   //reset the expand data to parent object.
                if (newInitData.hasOwnProperty(expandType[i])) {
                    let expandDateItem = newInitData[expandType[i]];
                    for (let _key in expandDateItem) {
                        newInitData[EXPAND_KEYS.format(expandType[i]) + _key] = expandDateItem[_key];
                    }
                }
            }
            Object.keys(_config).map(key => {
                let value = _config[key];
                if (key == expandIndexStr) {
                    return;
                }
                if (!value.hasOwnProperty("type")) {
                    return;
                }
                if (value.hasOwnProperty("show") && !value.show) {
                    return;
                }
                value.editEnable = false; //set all parameters to enabled true.
                if (newInitData.hasOwnProperty(key)) {
                    if (value.type == FormControlTypeEnum.MultiSelect && value.yangOriginaType == "bits") {
                        formData[key] = newInitData[key].split(" ");
                    } else {
                        formData[key] = newInitData[key];
                    }
                } else {
                    if (!isNullOrUndefined(value.defaultValue)) {
                        if (value.type == FormControlTypeEnum.MultiSelect && value.yangOriginaType == "bits") {
                            formData[key] = value.defaultValue.split(" ");
                        } else {
                            formData[key] = value.defaultValue;
                        }
                    }
                }
                if (!value.editEnable && (value.type == FormControlTypeEnum.Select || value.type == FormControlTypeEnum.MultiSelect)) {
                    value.type = FormControlTypeEnum.Text;
                }
                if (value.hasOwnProperty("fixedValue") && value.fixedValue != null) {
                    formData[key] = value.fixedValue
                }

            });
            let modalConfig = {
                head: {
                    title: title
                },
                body: {
                    bodyContentType: ModalBodyTypeEnum.Form,
                    bodyContentMessage: ""
                },
                foot: {}
            };
            let helpString = init.hasOwnProperty("helpString") ? init.helpString : (objectType.replaceAll("-", "").toLowerCase() + "properties");
            if (init.hasOwnProperty("buttons")) {
                modalConfig.foot["buttons"] = init.buttons;
            }
            ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={formData} controlConfig={_config}
                                             objectType={objectType} helpString={helpString}
                                             alertType={ModalAlertType.Edit}/>, document.getElementById("additionalContent1"));
        })
    });
}


/**
 * same as editItem.
 */
let detailsForDataItem = function (_config, data, title) {
    initUserDefineConfig(_config, _config, "editInitConfig", data, null,function (_newconfig) {
        _config = extendCustomConfig(_config, _newconfig);
        let formData = {};
        Object.keys(_config).map(key => {
            let value = _config[key];
            if (data.hasOwnProperty(key)) {
                if (value.type == FormControlTypeEnum.MultiSelect && value.yangOriginaType == "bits") {
                    formData[key] = data[key].split(" ");
                } else {
                    formData[key] = data[key];
                }
            } else {
                if (isNullOrUndefined(value.defaultValue)) {
                    if (value.hasOwnProperty("enumValue")) {
                        // formData[key] = PLEASE_SELECT_VALUE;
                        formData[key] = (value.type == FormControlTypeEnum.MultiSelect ? [] : PLEASE_SELECT_VALUE);
                    } else {
                        formData[key] = "";
                    }
                } else {
                    if (value.type == FormControlTypeEnum.MultiSelect && value.yangOriginaType == "bits") {
                        formData[key] = value.defaultValue.split(" ");
                    } else {
                        formData[key] = value.defaultValue;
                    }
                }
            }
            if (!value.editEnable && (value.type == FormControlTypeEnum.Select || value.type == FormControlTypeEnum.MultiSelect)) {
                value.type = FormControlTypeEnum.Text;
            }
            if (value.hasOwnProperty("fixedValue") && value.fixedValue != null) {
                formData[key] = value.fixedValue
            }

        });
        let modalConfig = {
            head: {
                title: title
            },
            body: {
                bodyContentType: ModalBodyTypeEnum.Form,
                bodyContentMessage: ""
            },
            foot: {}
        };
        let helpString = title.replaceAll(" ", "").replaceAll("-", "").toLowerCase();
        ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={formData} controlConfig={_config}
                                         helpString={helpString}
                                         alertType={ModalAlertType.Edit}/>, document.getElementById("additionalContent1"));
    })
}

/**
 *
 * @param objectType
 * @param init
 * {
 *     initData : {},       //JSON string, init the panel, can be not set it at normal.
 *     initKey : {},        //JSON String, init the request key.
 *     title : "xxxx"       //init the title.
 * }
 * @param refreshConfig     //the table hashcode if need refresh table after save, it can be a hashcode,
 * @param callback
 */
let deleteItem = function (objectType, init, refreshConfig, callback, confirmFunc) {
    let initData = {}, title = null, initKey = {}, extendsKey = null;
    if (!isNullOrUndefined(init)) {
        if (init.hasOwnProperty("initData")) {
            initData = init.initData;
        }
        if (init.hasOwnProperty("initKey")) {
            initKey = init.initKey;
        } else {
            initKey = initData;
        }
        if (init.hasOwnProperty("title")
            && !isNullOrUndefined(init.title)) {
            title = getText("confirm_delete").format(init.title);
        }
        if (init.hasOwnProperty("extendsKey")) {
            extendsKey = init.extendsKey;
        }
    }

    if (title == null) {
        let keyList = getPathKey(objectType)[objectType];
        if (keyList != null && initData.hasOwnProperty(keyList[0])) {
            if (keyList[0].match("session-id")) {
                title = getText("confirm_delete_session").format(initData[keyList[0]])
            } else {
                title = getText("confirm_delete").format(initData[keyList[0]])
            }

        } else {
            title = getText("error_confirm_delete");
        }
    }

    let whereStr = getRequestKeys(objectType, (initKey == null ? initData : initKey));
    if (!isEmptyObj(whereStr)) {
        if (extendsKey != null) {
            merge(whereStr, extendsKey);
        }
    }

    let _config = getYangConfig(objectType);
    parseWarning("traffic-affecting", "delete", "definition", _config, initData, function (key, keyString, rs, message) {
        if (rs) {
            title = getText("traffic-affecting-warning")
        }
        confirmFunc = confirmFunc ? confirmFunc : confirmToast;
        confirmFunc(title, function () {
            let request = {
                "delete": {
                    "from": objectType,
                    "where": whereStr
                }
            }
            deleteCommit(request, function (_result) {
                if (_result.result) {
                    refresh(refreshConfig);
                }
                if (!isNullOrUndefined(callback) && isFunction(callback)) {
                    callback(_result)
                }
            });
        }.bind(this), null, null, init)
    }.bind(this))


};

/**
 *
 * @param objectType
 * @param init
 * @param refreshConfig
 * @param callback
 */
let editRpcItem = function (objectType, init, refreshConfig, callback) {
    let initData = {}, initConfig = {}, title = objectType, initKey = {}, initConfigData = {},
        formData = {};
    if (!isNullOrUndefined(init)) {
        if (init.hasOwnProperty("initConfig")) {
            initConfig = init.initConfig;
        }
        if (init.hasOwnProperty("initData")) {
            initData = init.initData;
        }
        if (init.hasOwnProperty("initKey")) {
            initKey = init.initKey;
            initConfigData["keys"] = initKey;
        }
        if (init.hasOwnProperty("title") && !isNullOrUndefined(init.title)) {
            title = init.title;
        } else {
            title = getText(title);
        }
    }
    let _rpcYangConfig = getRpcConfig(objectType);

    let _yangConfig = {};
    if (_rpcYangConfig.hasOwnProperty("input")) {
        _yangConfig = _rpcYangConfig.input;
        _yangConfig["definition"] = _rpcYangConfig.definition;
    } else {
        _yangConfig = _rpcYangConfig;
    }
    let userDefineConfig;
    if (!isNullOrUndefined(initConfigData["keys"]) && (typeof initConfigData["keys"] != "object")) {
        let yangdefineObject = initConfigData["keys"] + "_" + objectType;
        userDefineConfig = userDefineYang[yangdefineObject];
    } else {
        userDefineConfig = userDefineYang[objectType];
    }

    initUserDefineConfig(userDefineConfig, _yangConfig, "requestInitConfig", initConfigData, initKey, function (updateConfig) {
        merge(initConfig, updateConfig);
        initUserDefineConfig(userDefineConfig, _yangConfig, "createInitConfig", initConfigData, initKey, function (updateConfig) {
            merge(initConfig, updateConfig);
            let _config = extendCustomConfig(_yangConfig, initConfig);
            _config = extendCustomConfig(_config, userDefineConfig, {Array: 1});

            Object.keys(_config).map(key => {
                let value = _config[key];

                if (key == expandIndexStr) {
                    return;
                }
                if (!value.hasOwnProperty("type")) {
                    return;
                }
                if (value.hasOwnProperty("show") && !value.show) {
                    if(_config[key].hasOwnProperty("needCommit") && !_config[key]["needCommit"]){
                        return;
                    }

                }

                if (value.type == FormControlTypeEnum.Password) {
                    _config[key].type = FormControlTypeEnum.NormalPassword;
                }
                if (value.type == FormControlTypeEnum.Passphrase) {
                    _config[key].type = FormControlTypeEnum.Password;
                }
                if (initData.hasOwnProperty(key)) {
                    formData[key] = initData[key];
                } else {
                    initData[key] = "";
                    if (isNullOrUndefined(value.defaultValue)) {
                        if (value.hasOwnProperty("enumValue") && value["enumValue"].length > 0) {
                            // formData[key] = PLEASE_SELECT_VALUE;
                            formData[key] = (value.type == FormControlTypeEnum.MultiSelect ? [] : PLEASE_SELECT_VALUE);
                        } else {
                            formData[key] = "";
                        }
                    } else {
                        formData[key] = value.defaultValue;
                    }
                }

                if (value.hasOwnProperty("fixedValue") && value.fixedValue != null) {
                    formData[key] = value.fixedValue
                }
                if (value.type == FormControlTypeEnum.Select && value.editEnable && value["validators"] != null
                    && value["validators"]["notEmpty"] != null) {
                    value["validators"]["regexp"] = {
                        regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                        message: function () {
                            return getText("error_required").format(getText(value.label))
                        }
                    }
                }
                if (value.type == FormControlTypeEnum.ChoiceRadio) {
                    if (_config[key]["needNone"]) {
                        value.enumValue.push({
                            label: "None",
                            value: "None"
                        })
                    } else {
                        let defaultSelectedKey = formData[key] || value['enumValue'][0].value;
                        _config[key]["defaultValue"] = defaultSelectedKey;
                        formData[key] = defaultSelectedKey;
                    }

                }
            });


            let originalValues = deepClone(formData);
            let committing = false;
            let modalConfig = {
                head: {
                    title: title
                },
                body: {
                    bodyContentType: ModalBodyTypeEnum.Form,
                    bodyContentMessage: ""
                },
                foot: {
                    buttons: [
                        {
                            type: ModalButtonTypeEnum.Ok,
                            label: getText("submit"),
                            clickFunction: function (data, fun) {
                                if (committing) {
                                    return;
                                }
                                committing = true;
                                let submitData = extendCustomConfig(data, {});
                                let commitData = {};
                                for (let key in submitData) {
                                    if (_config[key].hasOwnProperty("needCommit") && !_config[key]["needCommit"]) {
                                        continue;
                                    }
                                    if (isNullOrUndefined(_config[key]["editEnable"]) || _config[key]["mandatory"]
                                        || _config[key]["editEnable"] || _config[key]["mandatoryCommit"]) {
                                        if (_config[key]["mandatoryCommit"] || _config[key]["mandatory"]
                                            || (originalValues[key] != submitData[key] && !(originalValues[key] === null && submitData[key] === ""))
                                            || (originalValues[key] === submitData[key] && submitData[key] != null && submitData[key] != "")
                                            || (_config[key].type == FormControlTypeEnum.Password && submitData[key] != null)) {
                                            // if (originalValues[key] instanceof Array && submitData[key] instanceof Array) {
                                            //     if (JSON.stringify(originalValues[key]) == JSON.stringify(submitData[key])) {
                                            //         continue;
                                            //     }
                                            // }

                                            if (submitData[key] === PLEASE_SELECT_VALUE) {
                                                continue;
                                            }

                                            if (_config[key].type === FormControlTypeEnum.MultiSelect && _config[key].yangOriginaType === "bits") {
                                                commitData[key] = submitData[key].join(" ");
                                            } else {
                                                if (_config[key].hasOwnProperty("emptyValue")) {
                                                    commitData[key] = _config[key]["emptyValue"];
                                                } else if (typeof (submitData[key]) == "string") {
                                                    commitData[key] = submitData[key].trim();
                                                } else {
                                                    commitData[key] = submitData[key];
                                                }
                                            }

                                        }
                                    }

                                }
                                let rpcCommit = {};
                                rpcCommit[objectType] = commitData;
                                let updateConfig = {"rpc": rpcCommit};
                                saveData(updateConfig, null, commitData, _config, submitData, refreshConfig, fun, callback, function () {
                                    committing = false;
                                })
                            }
                        }
                    ]
                }
            };
            let helpString = init.hasOwnProperty("helpString") ? init.helpString : title.replaceAll(" ", "").replaceAll("-", "").toLowerCase();
            ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={formData} controlConfig={_config}
                                             objectType={objectType} helpString={helpString}
                                             alertType={ModalAlertType.Create}/>, document.getElementById("additionalContent1"));
        }.bind(this))
    })
};

let callRpc = function (objectType, init, refreshConfig, callback) {
    let initData = {}, title = null, initKey = {};
    if (!isNullOrUndefined(init)) {
        if (init.hasOwnProperty("initData")) {
            initData = init.initData;
        }
        if (init.hasOwnProperty("initKey")) {
            initKey = init.initKey;
        } else {
            initKey = initData;
        }
        if (init.hasOwnProperty("title")) {
            title = init.title;
        } else {
            let _confrim = getRpcConfig(objectType)["definition"]["requires-confirmation"]
            if (_confrim != null) {
                title = _confrim;
            }
        }
        if (!init.hasOwnProperty("helpString")) {
            init.helpString = objectType.replaceAll("-", "").toLowerCase()
        }
    }

    confirmToast(title, function () {
        let submitData = extendCustomConfig(initKey, {});
        let rpcCommit = {};
        let trimData = {};
        for (let key in submitData) {
            if (typeof (submitData[key]) == "string") {
                trimData[key] = submitData[key].trim();
            } else {
                trimData[key] = submitData[key];
            }
        }
        rpcCommit[objectType] = trimData;
        let updateConfig = {"rpc": rpcCommit}
        editCommit(updateConfig, function (_result) {
            if (_result.result) {
                refresh(refreshConfig);
            }
            if (isFunction(callback)) {
                callback(_result);
            }
        }, function () {
        }, null, null);
    }.bind(this), null, title != null, init)
};
let runRpcItem = function (objectType, init, refreshConfig, callback) {
    let initData = {}, initConfig = {}, title = objectType, initKey = {}, initConfigData = {},
        formData = {};
    if (!isNullOrUndefined(init)) {
        if (init.hasOwnProperty("initConfig")) {
            initConfig = init.initConfig;
        }
        if (init.hasOwnProperty("initData")) {
            initData = init.initData;
        }
        if (init.hasOwnProperty("initKey")) {
            initKey = init.initKey;
            initConfigData["keys"] = initKey;
        }
        if (init.hasOwnProperty("title") && !isNullOrUndefined(init.title)) {
            title = init.title;
        } else {
            title = getText(title);
        }
    }
    let _rpcYangConfig = getRpcConfig(objectType);

    let _yangConfig = {};
    if (_rpcYangConfig.hasOwnProperty("input")) {
        _yangConfig = _rpcYangConfig.input;
        _yangConfig["definition"] = _rpcYangConfig.definition;
    } else {
        _yangConfig = _rpcYangConfig;
    }
    let userDefineConfig;
    if (!isNullOrUndefined(initConfigData["keys"]) && (typeof initConfigData["keys"] != "object")) {
        let yangdefineObject = initConfigData["keys"] + "_" + objectType;
        userDefineConfig = userDefineYang[yangdefineObject];
    } else {
        userDefineConfig = userDefineYang[objectType];
    }

    initUserDefineConfig(userDefineConfig, _yangConfig, "requestInitConfig", initConfigData, initKey, function (updateConfig) {
        merge(initConfig, updateConfig);
        initUserDefineConfig(userDefineConfig, _yangConfig, "createInitConfig", initConfigData, initKey, function (updateConfig) {
            merge(initConfig, updateConfig);
            let _config = extendCustomConfig(_yangConfig, initConfig);
            _config = extendCustomConfig(_config, userDefineConfig, {Array: 1});
            Object.keys(_config).map(key => {
                let value = _config[key];
                if (key == expandIndexStr) {
                    return;
                }
                if (!value.hasOwnProperty("type")) {
                    return;
                }
                if (value.hasOwnProperty("show") && !value.show) {
                    return;
                }
                if (value.type == FormControlTypeEnum.Password) {
                    _config[key].type = FormControlTypeEnum.NormalPassword;
                }
                if (initData.hasOwnProperty(key)) {
                    formData[key] = initData[key];
                } else {
                    initData[key] = "";
                    if (isNullOrUndefined(value.defaultValue)) {
                        if (value.hasOwnProperty("enumValue") && value["enumValue"].length > 0) {
                            formData[key] = (value.type == FormControlTypeEnum.MultiSelect ? [] : PLEASE_SELECT_VALUE);
                        } else {
                            formData[key] = "";
                        }
                    } else {
                        formData[key] = value.defaultValue;
                    }
                }
                if (value.hasOwnProperty("fixedValue") && value.fixedValue != null) {
                    formData[key] = value.fixedValue
                }
                if (value.type == FormControlTypeEnum.Select && value.editEnable && value["validators"] != null
                    && value["validators"]["notEmpty"] != null) {
                    value["validators"]["regexp"] = {
                        regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                        message: function () {
                            return getText("error_required").format(getText(value.label))
                        }
                    }
                }
                if (value.hasOwnProperty("password") && value["password"] === "true") {
                    value.commitEnable = false;
                }
                if (value.type == FormControlTypeEnum.ChoiceRadio) {
                    if (_config[key]["needNone"]) {
                        value.enumValue.push({
                            label: "None",
                            value: "None"
                        })
                    } else {
                        let defaultSelectedKey = formData[key] || value['enumValue'][0].value;
                        _config[key]["defaultValue"] = defaultSelectedKey;
                        formData[key] = defaultSelectedKey;
                    }
                }
            });

            let originalValues = deepClone(formData);
            let committing = false;
            let modalConfig = {
                head: {
                    title: title
                },
                body: {
                    bodyContentType: ModalBodyTypeEnum.Form,
                    bodyContentMessage: ""
                },
                foot: {
                    buttons: [
                        {
                            type: ModalButtonTypeEnum.Ok,
                            label: getText("submit"),
                            clickFunction: function (data, fun) {
                                if (committing) {
                                    return;
                                }
                                committing = true;
                                let submitData = extendCustomConfig(data, {});
                                let commitData = {};
                                for (let key in submitData) {
                                    if (_config[key].hasOwnProperty("needCommit") && !_config[key]["needCommit"]) {
                                        continue;
                                    }
                                    if (isNullOrUndefined(_config[key]["editEnable"]) || _config[key]["mandatory"] || _config[key]["editEnable"] || _config[key]["mandatoryCommit"]) {
                                        if (_config[key]["mandatoryCommit"] || _config[key]["mandatory"]
                                            || (originalValues[key] != submitData[key] && !(originalValues[key] === null && submitData[key] === ""))
                                            || (originalValues[key] === submitData[key] && submitData[key] != null && submitData[key] != "")
                                            || (_config[key].type == FormControlTypeEnum.Password && submitData[key] != null)) {
                                            if (submitData[key] === PLEASE_SELECT_VALUE) {
                                                continue;
                                            }
                                            if (_config[key].type === FormControlTypeEnum.MultiSelect && _config[key].yangOriginaType === "bits") {
                                                commitData[key] = submitData[key].join(" ");
                                            } else {
                                                if (_config[key].hasOwnProperty("emptyValue")) {
                                                    commitData[key] = _config[key]["emptyValue"];
                                                } else if (typeof (submitData[key]) == "string") {
                                                    commitData[key] = submitData[key].trim();
                                                } else {
                                                    commitData[key] = submitData[key];
                                                }
                                            }

                                        }
                                    }
                                }
                                let rpcCommit = {};
                                rpcCommit[objectType] = commitData;
                                let updateConfig = {"rpc": rpcCommit};
                                editCommit(updateConfig, function (_result) {
                                    if (_result.result) {
                                        fun();
                                        refresh(refreshConfig);
                                    }
                                    if (!isNullOrUndefined(callback) && isFunction(callback)) {
                                        callback(_result)
                                    }
                                    committing = false;
                                }, function () {
                                    committing = false;
                                }, null, null, extendCustomConfig(init, {type: 2}));
                            }
                        }
                    ]
                }
            };
            ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={formData} controlConfig={_config}
                                             objectType={objectType}
                                             alertType={ModalAlertType.Edit}/>, document.getElementById("additionalContent1"));
        }.bind(this))
    })
};


/**
 * show the relate table
 * @param type          //e.g.  card,port...
 * @param data          //table row data
 * @param initKeyObj    // e.g. {
 *                                   card : "1-1"
 *                                   port : "1"
 *                               }
 */
let relateTable = function (type, data, initKeyObj, realType, parentData) {
    let requestConfig = [];
    let _yangcfg = getYangConfig(type);
    let whereKeys = getRequestKeys(type, xPathToKeys(initKeyObj));
    for (let key in _yangcfg[expandIndexStr]) {
        for (let _subKey in _yangcfg[expandIndexStr][key]) {
            if ((isFunction(_yangcfg[expandIndexStr][key][_subKey]["relateShow"]) && _yangcfg[expandIndexStr][key][_subKey]["relateShow"](data))
                || _yangcfg[expandIndexStr][key][_subKey]["relateShow"] == true) {
                let requistObj = {
                    "type": getYangNameByXpath(initKeyObj, whereKeys, _subKey)
                };
                requistObj["containerKey"] = (realType != null ? realType : type);
                requistObj["AID"] = data["AID"];
                if (!isEmptyObj(whereKeys)) {
                    requistObj["key"] = whereKeys
                }
                if (_yangcfg[expandIndexStr][key][_subKey].hasOwnProperty("initData")) {
                    requistObj["data"] = _yangcfg[expandIndexStr][key][_subKey]["initData"](data);
                }
                if (_yangcfg[expandIndexStr][key][_subKey]["title"]) {
                    requistObj["title"] = _yangcfg[expandIndexStr][key][_subKey]["title"];
                }
                if (_yangcfg[expandIndexStr][key][_subKey]["showTabButtons"]) {
                    requistObj["showTabButtons"] = _yangcfg[expandIndexStr][key][_subKey]["showTabButtons"];
                }
                if (_yangcfg[expandIndexStr][key][_subKey]["resetRelateCfg"]) {
                    let _tableCfg = _yangcfg[expandIndexStr][key][_subKey]["resetRelateCfg"](data);
                    requistObj["type"] = _tableCfg["keyType"];
                    requistObj["key"] = _tableCfg["keyValue"]
                    if (_tableCfg.hasOwnProperty("containerKey")) {
                        requistObj["containerKey"] = _tableCfg["containerKey"]
                    }
                }
                requistObj["isRelateTable"] = true;
                let _parentData = deepClone(data)
                if (parentData != null) {
                    _parentData.parentData = parentData;
                }
                requistObj["parentData"] = _parentData;
                requestConfig.push(requistObj)
            }
        }
    }
    if (requestConfig.length == 0) {
        return <p><br/><br/>&nbsp;<br/><br/></p>
    }

    return <Provider store={store}>
        <DynamicTabPanel contentCss="relate_table_content_height" tabConfig={requestConfig}/>
    </Provider>
}


/**
 * null : don't refresh.
 * hashcode : refresh table with RefreshTableData.
 * {
 *     tableHashCode : "xxxx",
 *     tableTable : key from refreshTableType.
 *     eventType : key from EventTypeEnum. like : RefreshTableData, RefreshTableRowData and etc.
 *     rowData : if the eventType is RefreshTableRowData to refresh one row.
 * }
 * @param refreshConfig
 */
let refresh = function (refreshConfig) {
    if (isNullOrUndefined(refreshConfig)) {
        return;
    }
    let hashcodes = [];
    let eventType = EventTypeEnum.RefreshTableData;
    let rowData = null;
    if (typeof refreshConfig == 'number') {
        hashcodes.push(refreshConfig);
    } else if (refreshConfig instanceof Array) {
        hashcodes = refreshConfig;
    } else {
        if (refreshConfig.hasOwnProperty("tableHashCode")) {
            let _codes = refreshConfig["tableHashCode"];
            if (typeof _codes == 'number') {
                hashcodes.push(_codes);
            } else if (_codes instanceof Array) {
                hashcodes = _codes;
            } else if (_codes instanceof String) {
                hashcodes = _codes;
            }
            eventType = refreshConfig.eventType;
            if (eventType == null) {
                eventType = EventTypeEnum.RefreshTableData;
            }
            if (refreshConfig.hasOwnProperty("tableTable")) {
                if (refreshConfig["tableTable"] == refreshTableType.treeTable) {
                    eventType = EventTypeEnum.RefreshTreeTableData;
                }
                if (refreshConfig["tableTable"] == refreshTableType.table) {
                    eventType = EventTypeEnum.RefreshTableData;
                }
            }
            rowData = refreshConfig.rowData;
        }
    }
    setTimeout(function () {
        for (let i = 0; i < hashcodes.length; i++) {
            if (eventType == EventTypeEnum.RefreshTreeTableRow
                || eventType == EventTypeEnum.RefreshTableRow) {
                if (rowData == null) {
                    MyReactEvents.emitEvent(eventType.format(hashcodes[i]));
                } else {
                    MyReactEvents.emitEvent(eventType.format(hashcodes[i]), rowData);
                }
            } else {
                MyReactEvents.emitEvent(eventType.format(hashcodes[i]));
            }
        }
    }, refreshConfig.timeout ? refreshConfig.timeout : 1000);
}

let existItem = function (items, keyValue) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].value == keyValue) {
            return true;
        }
    }
    return false;
}

let initItemData = function (objectType, initData, initKey, initConfig, callback) {
    if (initData != null) {
        let _obj = {}
        _obj[objectType] = [initData];
        callback(_obj);
    } else if (initKey != null) {
        let requestList = ["*"];
        if( initConfig != null &&initConfig.expandConfig != null && initConfig.expandConfig.container != null ) {
            Object.keys(initConfig.expandConfig.container).forEach(key=>{
                if( initConfig.expandConfig.container[key].hasOwnProperty("editShow") ) {
                    requestList.push(key);
                }
            })
        }
        requestData(
            {
                select: requestList,
                from: objectType,
                where: getRequestKeys(objectType, initKey)
            }, function (_data) {
                callback(_data)
            })
    } else {
        callback()
    }
}

function initUserDefineConfig(_defineConfig, yangConfig, type, objData, initKey, callback) {
    let _configList = [];
    for (let _key in yangConfig) {
        if (_key === expandIndexStr && yangConfig[expandIndexStr].container != null) {
            for(let _subKey in yangConfig[expandIndexStr].container) {
                for(let defineKey in _defineConfig) {
                    if( defineKey.startsWith( EXPAND_KEYS.format(_subKey)) && _defineConfig[defineKey].hasOwnProperty(type) ) {
                        let _fun = _defineConfig[defineKey];
                        if (_fun != null) {
                            let _obj = {};
                            _obj[defineKey.substring(EXPAND_KEYS.format(_subKey).length)] = _fun;
                            _configList.push(_obj);
                        }
                    }
                }
            }
        } else {
            let _fun = null;
            if (!isNullOrUndefined(_defineConfig) && _defineConfig[_key] != null && _defineConfig[_key].hasOwnProperty(type)
                && (yangConfig.hasOwnProperty(_key) || (_defineConfig[_key].hasOwnProperty("fix") && _defineConfig[_key]["fix"] == true))) {
                _fun = _defineConfig[_key];
            } else if (yangConfig[_key].hasOwnProperty(type)) {
                _fun = yangConfig[_key];
            }
            if (_fun != null) {
                let _obj = {};
                _obj[_key] = _fun;
                _configList.push(_obj);
            }
        }
    }
    if (_configList.length == 0) {
        callback({});
        return;
    }
    let newConfig = {};
    getUserDefineConfigData(_configList, type, objData, newConfig, initKey, function (_cfg) {
        callback(_cfg);

    });
}

function getUserDefineConfigData(_configList, type, objData, newConfig,initKey, callback) {
    if (_configList.length <= 0) {
        callback(newConfig);
        return;
    }

    let _cfg = _configList.splice(0, 1)[0];
    for (let _key in _cfg) {
        let itemKey = _key;
        _cfg[itemKey][type](objData, function (_data) {
            if( _cfg[itemKey].hasOwnProperty("expandType") ) {
                newConfig[EXPAND_KEYS.format(_cfg[itemKey]["expandType"]) + itemKey] = _data;
            } else {
                newConfig[itemKey] = _data;
            }
            getUserDefineConfigData(_configList, type, objData, newConfig,initKey, callback);
        },initKey);
    }

}

/**
 * extend the Expand Yang config
 * @param _yangConfig
 * @param _config
 * @returns {*}
 */
let extendExpandYang = function (_yangConfig, _config, _data) {
    let expandType = [];
    let commitRequired = {};
    if (!_yangConfig.hasOwnProperty(expandIndexStr)) {
        return {
            config: _config,
            expandType: expandType,
            commitRequired: commitRequired
        };
    }
    let container = _yangConfig[expandIndexStr]["container"];
    if (container == null) {
        return {
            config: _config,
            expandType: expandType,
            commitRequired: commitRequired
        };
    }
    for (let containerKey in container) {
        if (!container[containerKey].hasOwnProperty("editShow")) {
            continue;
        } else {
            if (!container[containerKey].editShow) {
                continue;
            }
            if (isFunction(container[containerKey].editShow)
                && !container[containerKey].editShow(_data)) {
                continue;
            }
        }
        let expandYang = getYangConfig(containerKey);

        if (isEmptyObj(expandYang)) {
            continue;
        }
        expandType.push(containerKey)
        let _expandYang = {};
        let _expandConfig = true;
        if ("false" == getYang("yang")[containerKey]["config"]) {
            _expandConfig = false;
        }
        for (let key in expandYang) {
            if (!_expandConfig) {
                expandYang[key]["editEnable"] = false;
            }
            expandYang[key]["expandType"] = containerKey;
            _expandYang[EXPAND_KEYS.format(containerKey) + key] = expandYang[key];
            if (expandYang[key].hasOwnProperty("commitRequired")) {
                if (!commitRequired.hasOwnProperty(containerKey)) {
                    commitRequired[containerKey] = [];
                }
                commitRequired[containerKey].push(key)
            }
        }
        _config = extendCustomConfig(_config, _expandYang);
    }
    return {
        config: _config,
        expandType: expandType,
        commitRequired: commitRequired
    };
}

let existKey = function (idList, key) {
    for (let i = 0; i < idList.length; i++) {
        if (idList[i].indexOf(key) > -1) {
            return true;
        }
    }
    return false;
}

let setActionValue = function (warningData, _config, keyString, key, realKey, message) {
    if (warningData[keyString] == null) {
        warningData[keyString] = {
            keys: [],
            value: null
        };
    }
    warningData[keyString]["keys"].push(key);
    if (message != null) {
        warningData[keyString]["value"] = message;
    } else if (_config[realKey][keyString].hasOwnProperty("description")) {
        warningData[keyString]["value"] = _config[realKey][keyString]["description"]
    } else if (typeof (_config[realKey][keyString]) == "string") {
        warningData[keyString]["value"] = _config[realKey][keyString];
    }
}

let parseSUbWarning = function (_config, _key, keyString, key, config, submitData, fun) {
    if (_config[_key][keyString] != null) {
        parseYangAction(_config[_key], keyString, _key, "when", submitData, function (rs, message) {
            fun(key, keyString, rs, message)
        });
    } else {
        fun("definition", keyString, false)
    }
}

let parseWarning = function (keyString, commitType, key, config, submitData, fun) {
    let _key = deepClone(key);
    let _config = deepClone(config);
    if (_config[key] == null) {
        fun("definition", keyString, false);
        return;
    }
    if (_config[key].expandType != null) {
        _key = key.substring((key.indexOf(_config[key].expandType) + _config[key].expandType.length + 1))
        _config = getYangConfig(config[key].expandType);
    }
    if (_config["definition"] != null && _config["definition"][keyString] != null) {
        if (!isNullOrUndefined(commitType) &&
            (_config["definition"][keyString]["affect"] == null || _config["definition"][keyString]["affect"].indexOf(commitType) < 0)) {
            fun("definition", keyString, false);
            return;
        }
        parseYangAction(_config["definition"], keyString, _key, "when", submitData, function (rs, message) {
            if (!rs) {
                parseSUbWarning(_config, _key, keyString, key, config, submitData, fun)

            } else {
                fun("definition", keyString, rs, message)

            }
        });
    } else {
        parseSUbWarning(_config, _key, keyString, key, config, submitData, fun)
    }
}

export {
    createItem,
    editItem,
    deleteItem,
    relateTable,
    editRpcItem,
    callRpc,
    runRpcItem,
    detailsItem,
    detailsForDataItem,
    refreshTableType,
    refresh
};
