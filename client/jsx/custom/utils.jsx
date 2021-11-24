import axios from "axios";
import React from "react";
import ReactDOM from "react-dom";

import ModalDialog, {DialogType} from "../components/modal/modal";
import LANGUAGE from "../../conf/language.json";
import UPPERCASE_KEY from "../../conf/uppercase_key";
import imgIcon from "../../img/favicon_infinera.png";
import MESSAGES from "../../../config/message.json";
import MessageModalDialog from "../components/modal/messageModal";
import HELPSTRINGMAP from "../../conf/helpstring.json";

const DEFAULT_LANG = "en";

let YANGCONFIG = {};
let CONTEXT_HELP_MAP = {};
export let MENUCONFIG = {};

const ResultType = {
    SUCCESS: true,
    FAILED: false
};

const ErrorMsgType = {
    login: "login",
    schema: "The requested schema does not exist.",
    inValid: "invalid-value",
    NetworkError: "Network Error"
};
export const defaultEnums = {
    "lock": "color_red",
    "unlock": "color_green",
    "maintenance": "color_blue",

    "disabled": "color_red",
};
export const enumFormControlType = {
    Text: 1,
    Password: 2,
    Passphrase: 3,
    Radio: 4,
    Select: 5,
    TribInput: 8,
    TextArea: 10,
    MultiSelect: 13,
    ChoiceRadio: 14,
    DateTimeZoneSelect: 15,
    DateTimeSelect: 16,
    Case: 17,
    TextSelect: 18,
    NormalPassword: 19,
};

export const EXPAND_KEYS = "expand-{0}-";

export const DisabledState = {
    0: true,
    1: false
};

export const ControlStateEnum = {
    Disabled: 0,
    Enabled: 1,
    None: 2
};

export const EditBtnState = {
    Normal: true,
    Disabled: false,
    Hidden: -1,
};

export const USER_CLASS_TYPE = {
    "read": "-r",
    "write": "-w"
}

export const EnvironmentConfig = {
    lineCardType: [],
    formatLineCardType: [],
    supportODUType: {
        "G30": ["ODU4", "ODUflex"],
        "G40": ["ODU4", "ODU4i", "ODUflexi"]
    },
    supportAutoXCON: {
        "G30": false,
        "G40": true
    }
}

export const _ActionEnum = {
    _LOGIN: "/api/login",             //{"user": username, "password": password,  "passaes": pwdaes} ,if parameter is {}, only check if the session is exist
    _LOGOUT: "/api/logout",            //{}
    _REQUESTJSON: "/api/rpc",               //{id:[{key:value},......], parameter:"json"}    return json.
    _SUBSCRIBE: "/api/ws_subscribe",      //web sockets.
    _EVENT: "/api/getCachedEvents",
    _CHANGEPASSWORD: "/api/changePassword",
    _ADMIN: "/api/admin"    // on/off debug on server side
};

export const icons = {
    "check-mark": "has-success",
    "remove": "has-error",
    "notRequired": "has-notRequired",
    "default": ""
};

export const isNullOrUndefined = obj => obj == null;

export const isEmpty = obj => obj == null || obj === "";

export const isEmptyObj = obj => obj == null || Object.keys(obj).length === 0;

export const isFunction = fun => typeof fun === "function";

export const isObject = obj => obj instanceof Object && obj.constructor === Object;

export const xmlDom2json = function (xmlDom) {
    let children = xmlDom.children;
    return convert(children);

    function convert(nodeList, ret) {
        if (!nodeList || nodeList.length <= 0) {
            return {};
        }

        if (!ret) ret = {};
        for (let i = 0; i < nodeList.length; ++i) {
            let node = nodeList[i];
            node.normalize();
            if (node.nodeType === 1) {
                let obj = {};
                if (!ret[node.nodeName]) {
                    ret[node.nodeName] = obj;
                } else if (Array.isArray(ret[node.nodeName])) {
                    ret[node.nodeName].push(obj);
                } else {
                    let tmp = ret[node.nodeName];
                    ret[node.nodeName] = [tmp];
                    ret[node.nodeName].push(obj);
                }

                convert(node.children, obj);

                for (let attr of node.attributes) {
                    obj["@" + attr.nodeName] = attr.value;
                }

                // this should be the last one
                for (let subNode of node.childNodes) {
                    switch (subNode.nodeType) {
                        case 3: // innerText
                            if (!isEmptyObj(obj)) {
                                let value = subNode.data.replace(/[\s\r]/g, "");
                                if (value.length > 0) {
                                    obj["@text"] = subNode.data;
                                }
                            } else {
                                ret[node.nodeName] = subNode.data.replace(/[\s\r]/g, "");
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        return ret;
    }
};

export const xml2JSON = function (xml_data) {
    let parser = new DOMParser();
    let xmlDom = parser.parseFromString(xml_data, "text/xml");
    return xmlDom2json(xmlDom);
};

export const currentTimeStamp = function () {
    return new Date().getTime();
};

export const flexoiid = function () {
    let iidList = [];
    for(let i = 1; i<= 254 ;i++)
    {
        iidList.push(  {
            label: i+"",
            value: i+""
        })
    }
    return iidList;
};

export const handleCollapseClick = function (event) {
    let ta = event.target;
    if (ta.classList.contains("icon-rotate-180")) {
        ta.classList.remove("icon-rotate-180");
    } else {
        ta.classList.add("icon-rotate-180");
    }
    let t_body = ta.parentElement.nextElementSibling;
    t_body.classList.contains("in") ? t_body.classList.remove("in") : t_body.classList.add("in");
};


export const getYang = function (type, callback) {
    if (isEmptyObj(YANGCONFIG)) {
        initYangConfig(sessionStorage.neType + "-" + sessionStorage.neVersion, callback);
    }
    return YANGCONFIG[type];
};

export const requestDataQueue = function (_requestParameterList, callback) {
    let resultList = [];
    executeRequestData(_requestParameterList, resultList, callback);

    function executeRequestData(_requestParameterList, resultList, callback) {
        requestData(_requestParameterList.splice(0, 1), function (data) {
            resultList.push(data);
            if (_requestParameterList.length === 0) {
                callback(resultList);
            } else {
                executeRequestData(_requestParameterList, resultList, callback)
            }
        });
    }
}

export const getMultiHeaderTableDataKey = function (resourceList, originKey, multiTitleLine2) {
    let newKey = "";
    if (originKey.indexOf("ioa-ne") != -1) {
        let resource = "";
        if (originKey.indexOf("&") != -1) {
            let keyArr = originKey.split("&");
            keyArr.map(key2 => {
                if (key2.indexOf("ioa-ne") != -1) {
                    let resourceLabel = resource2KeyName(key2);
                    for (let i = 0; i < resourceList.length; i++) {
                        if (!isNullOrUndefined(resourceList[i].label)) {
                            if (resourceList[i].label.indexOf(resourceLabel) != -1) {
                                resourceLabel = resourceList[i].label;
                                break;
                            }
                        }
                    }
                    resource += resourceLabel;
                }
            });
        }

        for (let i = 0; i < multiTitleLine2.length; i++) {
            if (originKey.indexOf(multiTitleLine2[i].key) != -1) {
                let lastPara = originKey.substr(originKey.lastIndexOf("&"), originKey.length).replaceAll("&", "/");
                newKey = resource + "/" + multiTitleLine2[i].label + lastPara;
            }
        }
    } else {
        newKey = originKey;
    }
    return newKey;
}
export const getEntityPathByKey = function (type, keys) {
    let YANG = getYang("yang");
    let _yang = YANG[type];
    if (_yang === null) {
        console.error("Can not found the type " + type + " settings in the yang.json ,Please check it!");
        return {};
    }
    let _jsonObj = _yang["definition"]["jpath"];
    const rootYang = YANG[Object.keys(_jsonObj)[0]];
    let entityPathObj = [""];
    parseKeys(_jsonObj, keys, entityPathObj, type, getSimplifyNS(rootYang.definition.namespace));
    if (!entityPathObj[entityPathObj.length - 1].startsWith(type)) {
        entityPathObj.push(type);
    }
    let root = YANG[Object.keys(_yang.definition.jpath)[0]];
    let ns = getSimplifyNS(root.definition.namespace);
    let cc = entityPathObj.join("/" + ns + ":");
    return entityPathObj.join("/" + ns + ":");
}

export const parseKeys = function (jsonObj, keys, entityPathObj, type, namespace) {
    if (typeof jsonObj === "string") {
        return;
    }
    for (let key in jsonObj) {
        if (keys.hasOwnProperty(key)) {
            let keyObj = jsonObj[key];
            let valueObj = keys[key];
            let valueArray = [];
            for (let key2 in keyObj) {
                if (valueObj.hasOwnProperty(key2)) {
                    valueArray.push(namespace + ":" + key2 + "=" + "'" + valueObj[key2] + "'");
                }
            }
            if (valueArray.length > 0) {
                entityPathObj.push(key + "[" + valueArray.join("][") + "]");
            } else {
                entityPathObj.push(key);
            }
            for (let key3 in keyObj) {
                if (typeof (keyObj[key3]) != "string") {
                    parseKeys(jsonObj[key], keys, entityPathObj, type, namespace);
                }
            }
            return;
        } else {
            if (jsonObj[key] !== "") {
                entityPathObj.push(key);
            }
            parseKeys(jsonObj[key], keys, entityPathObj, type, namespace);
        }
    }
}

export const getText = function (key, defaultTranslate) {
    if (isNullOrUndefined(key)) return key;

    if (!LANGUAGE[key] && key.indexOf(".") !== -1) return key;

    let curLang = localStorage[CookKeyEnum.language] || DEFAULT_LANG;
    if (!LANGUAGE[key] || !LANGUAGE[key][curLang]) {
        if (!isNullOrUndefined(defaultTranslate)) return key;
        let values = key.split("-");
        for (let i = 0; i < values.length; i++) {
            let _str = values[i];
            if (isAllUpperCase(_str)) {
                _str = _str.toUpperCase();
            } else {
                _str = _str.substring(0, 1).toUpperCase() + _str.substring(1);
            }
            values[i] = _str;
        }
        return values.join(" ");
    }

    return LANGUAGE[key][curLang];

    function isAllUpperCase(key) {
        for (let i = 0; i < UPPERCASE_KEY.length; ++i) {
            if (UPPERCASE_KEY[i] === key) return true;
        }

        return false;
    }
}

export const capitalText = function (text) {
    if (isNullOrUndefined(text)) return text;
    return text.substring(0, 1).toUpperCase() + text.substring(1);
}


export const formatSortString = function(str) {
    if( /(-\d)$/.test(str) || /-[a-zA-Z]*(\d)$/.test(str)  ) {
        str = str.substring(0,str.length-1) + "0" + str.substring(str.length-1)
    }
    if( /-[a-zA-Z]*(\d).(\d)$/.test(str) ) {
        str = str.substring(0,str.length-3) + "0" + str.substring(str.length-3)
    }
    return str;
}

export const getNumberFromString = function (str) {
    let h = "", char = "";
    str = str + "";
    let len = str.length;
    for (let i = 0; i < len; i++) {
        char = str.charAt(i);
        if (isPositiveNum(char) || char === ".")
            h += char;
    }
    if (h === "") {
        h = 65535;
    }
    return h;
}

export const isPositiveNum = function (s) {
    let re = /^[0-9]*[0-9][0-9]*$/;
    return re.test(s)
}

export const xpath2IdPath = str => str.replace(/((?=[\x21-\x7e]+)[^A-Za-z0-9])/g, "_");

export const xpath2IdPathNoSpace = str => str.replace(/((?=[\x21-\x7e]+)[^A-Za-z0-9])/g, "_").replaceAll(" ", "_");

export const CookKeyEnum = {
    cookie: "__infinera_cookie_user_owner_gwif_web_expire__",
    theme: "__infinera_cookie_user_owner_gwif_web_theme__",
    language: "__infinera_cookie_user_owner_gwif_web_lang__"
};

export const changeFavicon = function () {
    let head = document.getElementsByTagName('head')[0];
    let link = document.createElement("link");
    link.href = imgIcon;
    link.setAttribute('rel', 'icon');
    link.setAttribute('type', 'image/x-icon');
    head.appendChild(link);
}

export const requestJson = function (parameter, successFun, errorFun, commonCallBack, notExecuteCallBackWhenSuccess, showAlert, timeout) {
    requestAxisoData(_ActionEnum._REQUESTJSON, parameter, successFun, errorFun, commonCallBack, notExecuteCallBackWhenSuccess, showAlert, timeout);
};

export const requestCachedEvent = function (parameter, successFun, errorFun, commonCallBack, notExecuteCallBackWhenSuccess, showAlert) {
    requestAxisoData(_ActionEnum._EVENT, parameter, successFun, errorFun, commonCallBack, notExecuteCallBackWhenSuccess, showAlert);
}

export const axiosSubmit = function (requestURL, requestCondition, callback, timeout = 60000) {
    return axios.post(requestURL, requestCondition).then(response => {
        callback(response);
    }).catch(error => {
        if (requestURL.indexOf(_ActionEnum._LOGOUT) != -1) {
            callback({status: 200,data: {result: true, message: ""}});
        } else {
            console.error(error)
            let config = {
                dialogType: DialogType.ERROR,
                showText: error.toString()
            }
            let loginButton = document.getElementById("loginButtonId");
            if (!isNullOrUndefined(loginButton)) {
                loginButton.removeAttribute("disabled");
            }
            showAlertDialog(config);
        }
    });
}

export const convertToArray = function (obj) {
    if (isNullOrUndefined(obj)) {
        return [];
    }
    if (typeof obj == "string" || typeof obj == "number") {
        return [obj]
    }
    if (obj instanceof Array) {
        return obj;
    } else if (typeof (obj) == "object") {
        let objArr = [];
        objArr.push(obj);
        return objArr;
    }
};

export const getRelateTableKeys = function (_yangcfg, data) {
    let relateExpandKeys = [];
    if (data == null) {
        data = {};
    }
    if (_yangcfg.hasOwnProperty("expandConfig")) {
        for (let key in _yangcfg["expandConfig"]) {
            for (let _subKey in _yangcfg["expandConfig"][key]) {
                let isFun = isFunction(_yangcfg["expandConfig"][key][_subKey]["relateShow"]);
                if ((isFun && _yangcfg["expandConfig"][key][_subKey]["relateShow"](data))
                    || (!isFun && _yangcfg["expandConfig"][key][_subKey]["relateShow"])) {
                    relateExpandKeys.push(_subKey);
                }
            }
        }
    }
    return relateExpandKeys;
}

export const redirectMainPage = function () {
    window.location.href = '/chassisboardview';
};


/**
 *
 * @param _requestParameter  //below is the example, the "key" and "formatKey" only choose one parameter, it can be a Array.
 * {
 *     select : ["*","list","container"],   //default is no this parameter, or you can set "*","list","container" or value with yang parameter.
 *     name : "port",
 *     key : {
 *         "card" : {
 *             name : "1"
 *         },
 *         "port" : {
 *             name : "1-1"
 *         }
 *     }
 * }
 *
 * @param callback
 * @returns {any[]}
 */

let serverAcceptKey = ["select", "from", "where", "requestType", "wildcard"];

export const requestData = function (_requestParameter, callback) {
    let _requestParameterList = convertToArray(_requestParameter);
    let _request = [];
    for (let i = 0; i < _requestParameterList.length; i++) {
        let reqestTmp = {};
        let requestParameterListTmp = _requestParameterList[i];
        for (let j = 0; j < serverAcceptKey.length; j++) {
            if (requestParameterListTmp.hasOwnProperty(serverAcceptKey[j])) {
                reqestTmp[serverAcceptKey[j]] = requestParameterListTmp[serverAcceptKey[j]];
            }
        }
        _request.push(reqestTmp);
    }
    if (_request.length === 0) {
        console.error("error request!");
        return;
    }
    let resultList = [];
    requestJson(
        {
            "get": _request
        },
        function (resp) {
            let data = resp.data || [];
            let resultObj = {};
            let _requestParameterList = convertToArray(_requestParameter);
            for (let i = 0; i < _requestParameterList.length; i++) {
                let keynames = _requestParameterList[i]["rsKey"] != null ? _requestParameterList[i]["rsKey"] : _requestParameterList[i]["from"];
                resultObj[keynames] = getValueFromRs(data, keynames);
                if( ["alarm","event"].indexOf(keynames) < 0 && (_requestParameterList[i]["select"] == null || _requestParameterList[i]["select"].indexOf("*") > -1) ) {
                    let yangConfig = getYang("yang")[keynames];
                    if( yangConfig != null ) {
                        for(let key in yangConfig) {
                            if( yangConfig[key]["yangType"] === "leaf-list" ) {
                                if( resultObj[keynames].length === 1 && resultObj[keynames][0] === "" ) {
                                    resultObj[keynames] = []
                                }
                                resultObj[keynames].forEach(item=>{
                                    if( isNullOrUndefined(item[key])) {
                                        item[key] = "";
                                    }
                                })
                            }
                        }
                    }
                }
            }
            if (!isNullOrUndefined(callback) && isFunction(callback)) {
                callback(resultObj);
            }
        },
        function () {
            callback();
        }
    );
    return resultList;
}

export const getYangNameByXpath = function (xPath, keys, keyName) {
    let Yang = getYang("yang");
    if (Yang.hasOwnProperty(keyName)) {
        return keyName;
    }
    let _name = keyName;
    let keysList = [];
    for (let _key in xPath) {
        keysList.push(_key);
    }
    for (let i = keysList.length - 1; i >= 0; i--) {
        let _key = keysList[i];
        let keyStr = _key;
        if (_key.endsWith("-id")) { //remove the xpath end charts.
            keyStr = _key.substring(0, _key.length - 3)
        }
        if (keys.hasOwnProperty(keyStr)) {
            _name = keyStr + "." + _name;
            if (Yang.hasOwnProperty(_name)) {
                return _name;
            }
        }
    }
    return keyName;
}

export const getValueFromRs = function (data, keyName) {
    if (keyName.indexOf(".") > -1) {
        let _keyTemp = keyName.split(".");
        keyName = _keyTemp[_keyTemp.length - 1];
    }
    let values = [];
    for (let i = 0; i < data.length; i++) {
        parseValue(data[i], keyName, values);
    }
    return values;
}


export const parseValue = function (data, name, values) {
    if (isNullOrUndefined(data)) {
        return;
    }
    if (typeof data == "string" || typeof data == "number" || typeof data == "boolean") {
        return;
    }
    let _dataList = convertToArray(data);
    if (isNullOrUndefined(_dataList)) {
        return;
    }
    for (let i = 0; i < _dataList.length; i++) {
        let _objTemp = _dataList[i];
        for (let _key in _objTemp) {
            if (_key == name) {
                values.push.apply(values, convertToArray(_objTemp[name]));
            } else {
                parseValue(_objTemp[_key], name, values);
            }
        }
    }
}

export const formatterTimeData = function (timeStr) {
    if (isEmpty(timeStr)) return timeStr;
    timeStr = timeStr.toUpperCase();
    timeStr = String.prototype.replace.call(timeStr, "Z", "");
    timeStr = String.prototype.replace.call(timeStr, "T", "-");
    let dataArray = timeStr.split("-");
    if (dataArray.length === 0 || dataArray.length < 4) return timeStr;
    let y = dataArray[0],
        m = dataArray[1],
        d = dataArray[2],
        h = dataArray[3];
    return y + "-" + m + "-" + d + " " + h;
};

const ErrorMsgText = {
    getText: function (type) {
        if (type === ErrorMsgType.login) {
            return this.login();
        } else if (type === MESSAGES["invalid-session"]) {
            return getText("invalidSession");
        } else if (type === "unknown") {
            return this.unknown();
        } else if (type === "noneFile") {
            return this.noneFile();
        } else if (type === "checkNetwork") {
            return this.checkNetwork();
        } else if (type === "webSocketError") {
            return this.webSocketError();
        } else if (type === MESSAGES["password-expired"]) {
            return getText("passwd_expired");
        } else if (type.contains("configured authentication methods failed")) {
            return getText("login_authentication_failed")
        }
    },
    login: function () {
        return getText("login_timeout");
    },
    unknown: function () {
        return getText("operation_failed")
    },
    noneFile: function () {
        return getText("operation.label.noneFile")
    },
    checkNetwork: function () {
        return getText("operation.label.checkNetwork");
    },
    webSocketError: function () {
        return getText("operation.label.webSocketError");
    }
};

export const requestAxisoData = function (requestUrl, parameter, successFun, errorFun, commonCallBack
    , notExecuteCallBackWhenSuccess, showAlert, timeout) {
    axiosSubmit(location.origin + requestUrl, parameter, function (result) {
        handleResult(result, showAlert, commonCallBack, successFun, notExecuteCallBackWhenSuccess,
            errorFun);
    }, timeout).catch(function (er) {
        console.error(er);
        let config = {
            okCallBack: function () {
                if (er.toString().indexOf("timeout") > -1) {
                    redirectLoginPage();
                }
            }
        };
        if (isFunction(errorFun)) {
            errorFun();
        }
        config.showText = er.toString();
        config.dialogType = DialogType.ERROR;
        showAlertDialog(config);
    });
}

export const handleResult = function (result, showAlert, commonCallBack, successFun,
                                      notExecuteCallBackWhenSuccess, errorFun) {
    let config = {};
    let showAlertFlag = true;
    if (!isNullOrUndefined(showAlert)) {
        showAlertFlag = showAlert;
    }
    if (result.status === 200) {
        if (result.hasOwnProperty("data")) {
            let data = result.data;
            if (data.result === ResultType.SUCCESS) {
                let _tempData = data.data || [];
                if (!(_tempData instanceof Array)) {
                    let _tempArray = [];
                    _tempArray.push(_tempData)
                    data.data = _tempArray;
                }
                if (isFunction(successFun)) {
                    successFun(data);
                }
                showAlertFlag = false;
                if (notExecuteCallBackWhenSuccess) {
                    return;
                }
            } else if (data.result === ResultType.FAILED) {
                config.dialogType = DialogType.ERROR;
                if (data.message === ErrorMsgType.login || data.message === MESSAGES["invalid-session"]) {
                    config.showText = ErrorMsgText.getText(data.message);
                    config.okCallBack = redirectLoginPage;
                    config.closeCallBack = redirectLoginPage;
                } else {
                    let msgKey = data.message;
                    config.okCallBack = function () {
                        if (isFunction(errorFun)) {
                            errorFun();
                        }
                    };
                    config.closeCallBack = function () {
                        if (isFunction(errorFun)) {
                            errorFun();
                        }
                    };
                    if (data.data != null && Array.isArray(data.data)) {
                        if (msgKey == "" && data.data == "") {
                            showAlertFlag = true;
                            config.okCallBack = redirectLoginPage;
                            config.closeCallBack = redirectLoginPage;
                            config.showText = getText("operation_failed");
                        } else {
                            config.showText = data.message;
                        }
                    } else if (msgKey != null) {
                        showAlertFlag = true;
                        config.dialogType = DialogType.ERROR;
                        config.showText = msgKey;
                    } else {
                        console.error("should not be here!");
                    }
                }
            }
            if (isFunction(commonCallBack)) {
                commonCallBack(data);
            }
        } else {
            if (isFunction(commonCallBack)) {
                commonCallBack("No data");
            }
            showAlertFlag = true;
            config.dialogType = DialogType.ERROR;
            config.showText = "No data!";
        }
    } else {
        if (isFunction(commonCallBack)) {
            commonCallBack(result.statusText);
        }
        console.error(result);
        showAlertFlag = true;
        config.dialogType = DialogType.ERROR;
        config.showText = result.statusText;
    }
    if (showAlert || showAlertFlag) {
        showAlertDialog(config);
    }
}

export const redirectLoginPage = function () {
    window.location.href = '/';
}

export const loginOut = function () {
    let condition = {id: []}
    requestAxisoData(_ActionEnum._LOGOUT, condition, function (data) {
        clearCookiesInLocalStorage();
        sessionStorage.clear();
        redirectLoginPage();
    }, function () {
        sessionStorage.clear();
        redirectLoginPage();
    })
};

const clearCookiesInLocalStorage = function () {
    Object.keys(CookKeyEnum).forEach(key => {
        localStorage.removeItem(CookKeyEnum[key]);
    })
}

/**
 * Remove namespace for data
 * @param {*} data
 * @returns
 * e.g. : data="gx:CHM6", removeNS(data) = "CHM6"
 */
export const removeNS = function (data) {
    if (!data) return "";
    let arr = data.split(":");
    if (arr && arr.length > 1) {
        let ns = arr[0];
        if (getYang("namespace").hasOwnProperty(ns)) return data.replace(ns + ":", "");
    }

    return data;
};

export const initMenuConfig = function (neVersion, callback) {
    axios.get(`/static/config/menu-${neVersion}.json`,).then(response => {
        if (response.status === 200) {
            MENUCONFIG = response.data;
            if (isFunction(callback)) {
                callback(MENUCONFIG);
            }
        } else {
            console.error(response);
        }
    }).catch(error => {
        console.error(error);
        showAlertDialog({
            dialogType: DialogType.ERROR,
            showText: error.toString()
        });
    });
}

export const initYangConfig = function (neVersion, callback) {
    axios.get(`/static/config/yang-${neVersion}.json`).then(response => {
        if (response.status === 200) {
            YANGCONFIG = response.data;
            if (isFunction(callback)) {
                callback(YANGCONFIG);
            }
        } else {
            console.error(response);
        }
    }).catch(error => {
        showAlertDialog({
            dialogType: DialogType.ERROR,
            showText: error.toString()
        });
    });
    axiosSubmit("/download", {file: "../webgui_help/context-help-map.xml"}, (response) => {
        if (response.status === 200) {
            let xml = response.data;
            let json = xml2JSON(xml);
            if (json.hasOwnProperty("map") && json.map.hasOwnProperty("appContext")) {
                json.map.appContext.forEach(item => {
                    if (item.hasOwnProperty("@helpID")) {
                        CONTEXT_HELP_MAP[item["@helpID"]] = item["@path"];
                    }
                });
            }
        } else {
            console.log(response.message);
        }
    });
}

export const initEnvironment = function (rs) {
    if (rs && rs.supportedCard) {
        let supportedCards = Array.isArray(rs.supportedCard) ? rs.supportedCard : [rs.supportedCard];
        let cardTypeList = [];
        let formatCardTypeList = [];
        let ledSupport = [];
        supportedCards.forEach(item => {
            let cardType = item["card-type"];
            if (item["category"] === "line-card") {
                cardTypeList.push(cardType);
                formatCardTypeList.push(parseColonValues(cardType));
            }
            if (item["location-led-support"] === "true") {
                ledSupport.push(cardType);
            }
        });
        EnvironmentConfig.lineCardType = cardTypeList;
        EnvironmentConfig.formatLineCardType = formatCardTypeList;
        EnvironmentConfig.ledSupportCard = ledSupport;
    }
}

export const deleteCommit = function (idList, fun, toast) {
    setLoadingState();
    requestJson(idList, function (_data) {
        if (toast == null || toast) {
            let config = {
                dialogType: DialogType.SUCCESS,
                showText: getText("operation_success")
            };
            showAlertDialog(config);
        }
        if (isFunction(fun)) {
            fun(_data);
        }
    })
}

/**
 * popup alert dialog
 *
 * conf: {
 *     dialogType,  // DialogType
 *     btn,  // Array, with element {label: string, onClick: function}
 *     showText,  // string
 *     okCallBack,    // optional
 *     closeCallBack,   // optional
 * }
 */
const DOMID = "modal-parent";
export const showAlertDialog = function (conf) {
    function noop() {
    }

    let modal_parent = null;
    for (let i = 0; i < 10; ++i) {
        modal_parent = document.getElementById(DOMID + i);
        if (modal_parent && modal_parent.childElementCount > 0) {
            let data = modal_parent.getAttribute("data");
            if (data === JSON.stringify(conf)) {
                return; // do not pop up same message
            }
        }
    }

    for (let i = 0; i < 10; ++i) {
        modal_parent = document.getElementById(DOMID + i);
        if (!modal_parent) {
            let domNode = document.createElement("div");
            domNode.id = DOMID + i;
            domNode.className = DOMID;
            domNode.setAttribute("data", JSON.stringify(conf));
            domNode.style.zIndex = String(2052 * (i + 1));
            document.body.appendChild(domNode);
            modal_parent = domNode;
            break;
        } else if (!modal_parent.childElementCount) {
            modal_parent.setAttribute("data", JSON.stringify(conf));
            break;
        }
    }

    let btnList = conf.btn ? conf.btn : [];
    if (conf.dialogType === DialogType.ERROR || conf.dialogType === DialogType.INFO) {
        btnList.push({
            label: getText("ok"), onClick: conf.okCallBack || noop
        })
    } else if (conf.dialogType === DialogType.WARNING) {
        conf.okCallBack ? btnList.push({
            label: getText("yes"), onClick: conf.okCallBack
        }) : null;
        conf.closeCallBack ? btnList.push({
            label: getText("no"), onClick: conf.closeCallBack
        }) : null;
    }
    let config = {
        type: conf.dialogType,
        title: getText(conf.dialogType),
        message: conf.showText,
        btn: btnList,
        autoClose: btnList.length === 0,
        helpString: conf.helpString
    };
    conf.closeCallBack ? config.onClose = conf.closeCallBack : null;
    if (conf.selectType) {
        ReactDOM.render(<MessageModalDialog config={config}/>, modal_parent);
    } else {
        ReactDOM.render(<ModalDialog config={config}/>, modal_parent);
    }
}

export const editCommitQueue = function (idList, successFun, errorFun, toast, timeout, init) {
    executeEditCommit(idList, successFun, errorFun, toast, timeout, init);

    function executeEditCommit(_idList, successFun, errorFun, toast, timeout, init) {
        editCommit(_idList.splice(0, 1)[0], function (_data) {
            if (_idList.length === 0) {
                revertLoadingState();
                if (toast == null || toast) {
                    let sucConfirm = getText("operation_success");
                    if (!isNullOrUndefined((_data.data)) && JSON.stringify(_data.data).indexOf("rpc-reply") == -1) {
                        let info = JSON.stringify(_data.data);
                        info = info.replaceAll("\"", "").replace(/\[|]/g, '').replace(/\{|}/g, '');
                        if (info.indexOf(":") != -1) {
                            info = info.substr(info.indexOf(":") + 1);
                        }
                        if (!isNullOrUndefined(info) && init.showMessage) {
                            sucConfirm = info;
                            let config = {
                                dialogType: DialogType.INFO,
                                showText: sucConfirm
                            };
                            showAlertDialog(config);
                        } else {
                            let config = {
                                dialogType: DialogType.SUCCESS,
                                showText: sucConfirm
                            };
                            showAlertDialog(config);
                        }

                    } else {
                        let config = {
                            dialogType: DialogType.SUCCESS,
                            showText: sucConfirm
                        };
                        showAlertDialog(config);
                    }
                }
                if (isFunction(successFun)) {
                    successFun(_data);
                }
            } else {
                executeEditCommit(_idList, successFun, errorFun, toast, timeout, init)
            }
        }, function () {

        }, false, timeout, init, false)
    }
}

/**
 *
 * @param {*} tag only supports "card" && "port"
 * @param {*} aid node AID
 * @param {*} rootNode
 * @returns
 */
export const isLineCard = function (tag, aid, rootNode) {
    if (!aid) return false;
    if (rootNode && (tag === "card" || tag === "port")) {
        let isLine = function (obj) {
            return (obj.category === "line-card") ||
                (obj["port-type"] === "line") || (obj["port-type"] === "tributary");
        }
        let objList = findObjByTag(rootNode, tag);
        if (objList) {
            if (Array.isArray(objList)) {
                for (let obj of objList) {
                    if (obj.AID === aid) {
                        return isLine(obj);
                    }
                }
            } else if (objList.AID === aid) {
                return isLine(objList);
            }
        }
    }

    return false;
}


/**
 * find obj with tag
 * e.g. :
 *   data = {a: {b: {c: {d: "5"}}}}, findObjByTag(data, "d") return "5", findObjByTag(data, "c") return {d: "5"}
 *
 * @param {*} data
 * @param {*} tag
 * @returns
 */
export const findObjByTag = function (data, tag) {
    if (data.hasOwnProperty(tag)) {
        return data[tag];
    }

    if (Array.isArray(data)) {
        let rt = [];
        for (let item of data) {
            let obj = findObjByTag(item, tag);
            if (obj) {
                rt = rt.concat(obj);
            }
        }
        return rt.length > 1 ? rt : (rt.length > 0 ? rt[0] : null);
    }

    for (let key in data) {
        if (typeof data[key] === "object") {
            let obj = findObjByTag(data[key], tag);
            if (obj) {
                return obj;
            }
        }
    }
    return null;
}

const findObjByKey = function(data,type,keyObj,callback) {
    if( isObject(data) ) {
        if (data.hasOwnProperty(type)) {
            let _list = convertToArray(data[type]);
            for (let i = 0; i < _list.length; i++) {
                let item = _list[i];
                let found = true;
                for (let key in keyObj) {
                    if (item[key] == null || item[key] != keyObj[key]) {
                        found = false;
                    }
                }
                if ( found ) {
                    callback(item);
                    break;
                }
            }
        } else {
            for (let key in data) {
                findObjByKey(data[key], type, keyObj,callback);
            }
        }
    } else if(data instanceof Array) {
        data.forEach(item=>{
            if( isObject(item) ) {
                findObjByKey(item, type, keyObj,callback);
            }
        })
    }
}

export const editCommit = function (idList, successFun, errorFun, toast, timeout, init, needRevertLoading) {
    setLoadingState();
    requestJson(idList, function (_data) {
        if (isNullOrUndefined(needRevertLoading) || needRevertLoading) {
            revertLoadingState();
        }
        if (toast == null || toast) {
            let sucConfirm = getText("operation_success");
            if (!isNullOrUndefined((_data.data)) && JSON.stringify(_data.data).indexOf("rpc-reply") == -1) {
                let info = JSON.stringify(_data.data);
                info = info.replaceAll("\"", "").replace(/\[|]/g, '').replace(/\{|}/g, '');
                if (info.indexOf(":") != -1) {
                    info = info.substr(info.indexOf(":") + 1);
                }
                if (!isNullOrUndefined(info) && init != null && init.showMessage) {
                    sucConfirm = info;
                    let config = {
                        dialogType: DialogType.INFO,
                        showText: sucConfirm,
                        selectType: init.type
                    };
                    showAlertDialog(config);
                } else {
                    let config = {
                        dialogType: DialogType.SUCCESS,
                        showText: sucConfirm
                    };
                    showAlertDialog(config);
                }

            } else {
                let config = {
                    dialogType: DialogType.SUCCESS,
                    showText: sucConfirm
                };
                showAlertDialog(config);
            }
        }
        if (isFunction(successFun)) {
            successFun(_data);
        }
    }, function (_data) {
        revertLoadingState();
        if (isFunction(errorFun)) {
            errorFun(_data);
        }
    }, function () {
        revertLoadingState();
    }, function () {
        revertLoadingState();
    }, null, timeout)
};

export const setLoadingState = function () {
    let okBt = document.getElementById("modal_btn_ok");
    if (okBt != null) {
        okBt.disabled = "disabled";
        okBt.className += " btn_disabled"
    }
    let loadingBt = document.getElementsByClassName("loading_icon");
    if (loadingBt.length > 0) {
        loadingBt[0].style.display = "block";
    }
}

export const revertLoadingState = function () {
    let okBt = document.getElementById("modal_btn_ok");
    if (okBt != null) {
        okBt.className = document.getElementById("modal_btn_ok").className.replace("btn_disabled", "")
    }
    // if( document.getElementById("react-modal-close-btn") != null ) {
    //     document.getElementById("react-modal-close-btn").className = document.getElementById("react-modal-close-btn").className.replace("btn_disabled", "")
    // }
    let loadingBt = document.getElementsByClassName("loading_icon");
    if (loadingBt.length > 0) {
        loadingBt[0].style.display = "none";
    }
}


export const confirmToast = function (title, ok, cancel, toast, init) {
    if (toast != null && !toast) {
        if (ok != null && isFunction(ok)) {
            ok();
        }
        return;
    }
    let config = {
        dialogType: DialogType.WARNING,
        showText: title,
        okCallBack: function () {
            if (isFunction(ok)) {
                ok();
            }
        },
        closeCallBack: function () {
            revertLoadingState();
            if (isFunction(cancel)) {
                cancel();
            }
        },
        helpString: init ? init.helpString : ""
    };
    showAlertDialog(config);
}

export const excelCellData = function (str) {
    if (isEmpty(str)) {
        return "";
    }
    if (typeof str == "number" || typeof str == "boolean") {
        return str;
    }
    if (typeof str == "object") {
        str = JSON.stringify(str);
        return str.substring(1, str.length - 2);
    }
    if (typeof str != "string") {
        return "";
    }
    str = str.replace(/,/g, " ");
    return str;
}

let NumberRegExp = new RegExp("^[0-9]+(.[0-9]+)?$");
export const sortFunc = function (x, y) {
    if (NumberRegExp.test(x) && NumberRegExp.test(y)) {
        return parseInt(x) - parseInt(y);
    } else {
        let xx = parseColonValues(x);
        let yy = parseColonValues(y);
        if (xx != null) {
            return (xx).localeCompare(yy);
        } else {
            return 0;
        }

    }
}

export const parseColonValues = function (val) {
    if (val != null) {
        let _items = convertToArray(val);
        for (let i = 0; i < _items.length; i++) {
            if (_items[i].toString().indexOf(":") > -1) {
                _items[i] = _items[i].substring(_items[i].toString().indexOf(":") + 1);
            }
        }
        return _items.join(",");
    } else {
        return null;
    }
}

/**
 * parse the mandatory action and so on.
 * e.g. : "mandatory": {
        "when": "../class='low-order'",
        "value": "true"
    } *
 */
export const parseYangParameterAction = function (controlConfig, key, conditionKey, _formData) {
    if (controlConfig.hasOwnProperty("init" + key)) {
        let whenRs = controlConfig["init" + key](_formData, controlConfig);
        if (!isNullOrUndefined(whenRs)) {
            return whenRs;
        }
    }
    if (controlConfig.hasOwnProperty(key)) {
        if (typeof (controlConfig[key]) != "string") {
            return getYangActionConfig(controlConfig[key], key, conditionKey, _formData);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export const parseYangAction = function (controlConfig, keyString, key, conditionKey, _formData, fun) {
    let subConfig = controlConfig[keyString];
    if (subConfig.hasOwnProperty("init" + conditionKey)) {
        subConfig["init" + conditionKey](_formData, controlConfig, function (rs, message) {
            fun(rs, message);

        });
    } else if (subConfig instanceof Array) {
        for (let i = 0; i < subConfig.length; i++) {
            if (getYangActionConfig(subConfig[i], key, keyString, _formData)) {
                fun(true);
                return;
            }
        }
        fun(false);
    } else if (subConfig.hasOwnProperty(conditionKey)) {
        fun(getYangActionConfig(controlConfig, key, keyString, _formData));
    } else {
        fun(true)
    }
}

export const parseWhenAction = function (controlConfig, key, conditionKey, _formData, parentData,neData) {
    let _controlConfig = controlConfig[key];
    if (_controlConfig.hasOwnProperty("init" + conditionKey)) {
        let whenRs = _controlConfig["init" + conditionKey](_formData, controlConfig);
        if (!isNullOrUndefined(whenRs)) {
            return whenRs;
        }
    }
    return getYangActionConfig(_controlConfig, key, conditionKey, _formData, parentData, neData);
}

export const getYangActionConfig = function (_controlConfig, key, conditionKey, _formData, parentData, neData) {
    let _parseResult = null;
    if (_controlConfig.hasOwnProperty(conditionKey)) {
        let keyString = _controlConfig[conditionKey];
        if (!(keyString instanceof Array) && typeof (keyString) != "string") {
            keyString = keyString["when"];
        }
        if( typeof (keyString) === "string" ) {
            keyString = keyString.replaceAll("\n", " ");
        } else if (keyString instanceof Array) {
            for(let i=0; i<keyString.length; i++) {
                keyString[i] = keyString[i].replaceAll("\n", " ");
            }
        }
        _parseResult = parseYangActionParameter(keyString,_controlConfig,key,_formData,parentData, neData);
    }
    return _parseResult;
}


const parseYangActionParameter = function(keyStrings,_controlConfig,key,_formData,parentData, neData,isEditCondition) {
    if( keyStrings instanceof Array) {
        for (let i = 0; i < keyStrings.length; i++) {
            if (parseYangActionParameterItem(keyStrings[i], _controlConfig, key, _formData, parentData, neData, isEditCondition) === false) {
                return false;
            }
        }
        return true;
    } else {
        return parseYangActionParameterItem(keyStrings, _controlConfig, key, _formData, parentData, neData, isEditCondition);
    }
}

const parseYangActionParameterItem = function (keyString,_controlConfig,key,_formData,parentData, neData,isEditCondition) {
    let _key = null;
    if (keyString.indexOf(" and ") > -1) {
        _key = " and ";
    } else if (keyString.indexOf(" or ") > -1) {
        _key = " or ";
    }
    let keyStrList = keyString.split(_key);
    let valueList = [];
    for (let i = 0; i < keyStrList.length; i++) {
        valueList.push(parseYangActionParameter1st(_controlConfig, keyStrList[i], key, _formData, parentData, neData,isEditCondition));
    }
    if (_key == null) {
        if (valueList.length > 0) {
            return isNullOrUndefined(valueList[0]) ? (isNullOrUndefined(isEditCondition)) : valueList[0];
        } else {
            return true;
        }
    }

    if (_key === " and ") {
        for (let i = 0; i < valueList.length; i++) {
            if( isEditCondition === true ) {
                if (isNullOrUndefined(valueList[i])) {
                    return false;
                }
            } else {
                if (isNullOrUndefined(valueList[i])) {
                    return true;
                }
            }
            if (valueList[i] === false) {
                return false;
            }
        }
        return true;
    } else if (_key === " or ") {
        for (let i = 0; i < valueList.length; i++) {
            if( isEditCondition === true ) {
                if (isNullOrUndefined(valueList[i])) {
                    return false;
                }
            } else {
                if (isNullOrUndefined(valueList[i])) {
                    return true;
                }
            }
            if (isNullOrUndefined(valueList[i]) || valueList[i] === true) {
                return true;
            }
        }
        return false;
    }
}

const parseYangActionParameter1st = function(_controlConfig, _parameter, key, _formData, parentData, neData,isEditCondition) {
    _parameter = _parameter.trim();
    if (_parameter.startsWith("not(")) {
        _parameter = _parameter.substring(4, _parameter.length - 1);
        let rs = parseYangActionParameter2nd(_controlConfig, _parameter, key, _formData, parentData, neData,isEditCondition);
        if( rs != null ) {
            return !rs
        }
    } else {
        return parseYangActionParameter2nd(_controlConfig, _parameter, key, _formData, parentData, neData,isEditCondition);
    }
}

const parseContains = function(_parameter, _formData, parentData, isEditCondition) {
    let parameter = _parameter.substring(9, _parameter.length - 1);
    let temp = parameter.split(",");
    let key = temp[0].trim();
    let value = temp[1].trim().substring(1, temp[1].trim().length - 1);
    if (key.indexOf("../../") > -1) {
        key = key.replace("../../", "");
        if (parentData != null && parentData[key] != null && parentData[key].indexOf(value) > -1) {
            return true;
        } else {
            if( isEditCondition === true ) {
                return null;
            }
            return false;
        }
    } else if (key.indexOf("../") > -1 || key.indexOf("./") > -1) {
        let keyTemp = key.split("/");
        key = keyTemp[keyTemp.length - 1];
        if (_formData[key] != null && _formData[key].indexOf(value) > -1) {
            return true;
        } else {
            if( isEditCondition === true ) {
              return null;
            }
            return false;
        }
    } else {
        if( isEditCondition === true ) {
            return null;
        }
        return true;
    }
}

const parseStartType = function(_controlConfig, _parameter, _formData, key, parentData,isEditCondition) {
    let strList = (_parameter.substring(_parameter.indexOf("(") + 1, _parameter.length - 1)).split(",");
    let conditionType = parseConditionType(strList[0], _controlConfig, key);
    let conditionValue = strList[1];
    conditionValue = conditionValue.replaceAll("'", "").replaceAll(" ", "");
    let checkData = _formData;
    if (isObject(conditionType)) {
        if (parentData != null) {
            checkData = parentData;
            for (let i = conditionType.path; i > 1; i--) {
                if (checkData.parentData != null) {
                    checkData = checkData.parentData;
                }
            }
        }
        conditionType = conditionType.key;
    }
    if (!checkData.hasOwnProperty(conditionType)) {
        if( isEditCondition === true ) {
            return null;
        } else {
            return false;
        }
    } else {
        return (checkData[conditionType].startsWith(conditionValue));
    }
}

const parseBooleanType = function(_controlConfig, _parameter, _formData, key, parentData,isEditCondition) {
    let strList = _parameter.substring(_parameter.indexOf("(") + 1, _parameter.length - 1);
    let conditionType = parseConditionType(strList, _controlConfig, key);
    let checkData = _formData;
    if (isObject(conditionType)) {
        if (parentData != null) {
            checkData = parentData;
            for (let i = conditionType.path; i > 1; i--) {
                if (checkData.parentData != null) {
                    checkData = checkData.parentData;
                }
            }
        }
        conditionType = conditionType.key;
    }
    if (!checkData.hasOwnProperty(conditionType)) {
        return null;
    } else {
        return checkData[conditionType];
    }
}

let cardTypeList = ["chm1r","utm2","ucm4","chm6"];

let checkCardType = function (str) {
    for(let i=0;i<cardTypeList.length;i++) {
        if (str.startsWith("in-" + cardTypeList[i])) {
            return true;
        }
    }
    return false;
}

const parseYangActionParameter2nd = function(_controlConfig, _parameter, key, _formData, parentData, neData,isEditCondition) {
    _parameter = _parameter.trim();
    if (_parameter.startsWith("(") && _parameter.endsWith(")")) {  // (ospf-if-routing != 'passive')
        _parameter = _parameter.substring(1, _parameter.length - 1);
    }
    if( _parameter.startsWith("oldvalue(.)") ) {
        if( isEditCondition === true ) {
            return true;
        }
    } else if (_parameter.startsWith("starts-with(")) {    //starts-with(../source,'scp')
        return parseStartType(_controlConfig, _parameter, _formData, key, parentData,isEditCondition);
    } else if (_parameter === "db-value(..)") {
        return _formData.hasOwnProperty(key);
    } else if (_parameter.startsWith("boolean(")) {
        return parseBooleanType(_controlConfig, _parameter, _formData, key, parentData,isEditCondition)
    } else if (_parameter.startsWith("contains(")) {
        return parseContains(_parameter, _formData, parentData,isEditCondition)
    } else if( checkCardType(_parameter) ) {
        let _keystr = _parameter.substring(3,_parameter.indexOf("("))
        let r = parseCardType(_formData,parentData,neData,isEditCondition,_keystr.toUpperCase());
        return _parameter.endsWith("false()") ? !r : r;
    } else if( _parameter == "$is-openroadm" ) {
        return parseIsOpenroadm(isEditCondition);
    } else if( _parameter == "$is-tom" ) {
       return ( _formData != null && _formData.resource != null && getKeyFromResource(_formData.resource).type === "tom");
    } else if( _parameter == "$ho-odu" || _parameter == "ho-odu" ) {
        return _formData.hasOwnProperty("parent-odu");
    } else if (_parameter.startsWith("if ")) {  //?????   logic if(xxx) then xxx
        //todo edit-condition
    } else if (_parameter.startsWith("$")) {  //??????  $ov-threshold >= .
        //todo edit-condition
    } else if( _parameter === "/ne/ne-type = 'G40'" ) {
        return sessionStorage.neType === "G40"
    } else {
        return parseYangActionParameter3rd(_controlConfig, _parameter, key, _formData, parentData,isEditCondition,neData);
    }
}

const  parseIsOpenroadm = function(isEditCondition) {
    if( isEditCondition === true ) {
        return null;
    }
    return false;
}

const parseCardType = function(_formData,parentData,neData,isEditCondition,cardType) {
    if( neData != null ) {
        let card_id = null;
        if( _formData.AID != null && _formData.AID.split("-").length > 2 ) {
            let temp = _formData.AID.split("-");
            card_id = temp[0] + "-" + temp[1];
        } else {
            if (_formData != null && _formData["supporting-card"] != null) {
                card_id = _formData["supporting-card"];
            } else if (parentData != null && parentData["supporting-card"] != null) {
                card_id = parentData["supporting-card"];
            }
        }
        if( card_id != null ) {
            let matchCardType = true;
            findObjByKey(neData,"card",{name: card_id},function (rs) {
                matchCardType =  (rs != null && rs.type == cardType)
            });
            return matchCardType
        } else {
            if( isEditCondition === true ) {
                return null;
            }
            return true;
        }
    } else {
        if( isEditCondition === true ) {
            return null;
        }
        return true;
    }
}

const parseYangActionParameter3rd = function(_controlConfig, _parameter, key, _formData, parentData, isEditCondition,neData) {
    let keyChars = ["!=", ">=", "<=", ">", "<", "="];
    let condition = _parameter.trim();
    let keyStr = null;
    for (let i = 0; i < keyChars.length; i++) {
        if (condition.indexOf(keyChars[i]) > -1) {
            keyStr = keyChars[i];
            break;
        }
    }

    if (keyStr != null) {
        let conditionType = parseConditionType(condition.substring(0, condition.indexOf(keyStr)).trim(), _controlConfig, key);
        if (conditionType == null) {
            if( isEditCondition === true ) {
                return null;
            }
            return true;
        }
        let conditionValue = condition.substring(condition.indexOf(keyStr) + keyStr.length);
        if (conditionValue.indexOf(")") > -1) {
            conditionValue = conditionValue.substring(0, conditionValue.indexOf(")"))
        }
        if (conditionValue.indexOf(",") > -1) {
            conditionValue = conditionValue.replace("(", "").replace(")", "").replaceAll("'", "").replaceAll(" ", "");
            conditionValue = conditionValue.split(",");
        } else {
            conditionValue = [conditionValue.replaceAll("'", "").replaceAll(" ", "")];
        }
        let checkData = deepClone(_formData);
        if (isObject(conditionType)) {
            if (parentData != null) {
                checkData = parentData;
                for (let i = conditionType.path; i > 1; i--) {
                    if (checkData.parentData != null) {
                        checkData = checkData.parentData;
                    }
                }
            }
            conditionType = conditionType.key;
        }
        if( conditionType === "/ne/equipment/chassis/required-type" ) {
            if( neData != null ) {
                return parseColonValues(neData["chassis"][0]["required-type"]) === conditionValue[0];
            }
        } else if(conditionType === "count(seq(.))") {
            if (_formData != null && _formData[key] != null && _formData[key] instanceof Array && _formData[key].length > 0 && _formData[key][0] != "") {
                return eval(_formData[key].length + keyStr + conditionValue[0])
            } else {
                return false;
            }

        } else if( conditionType === "number(.)" ) {
            conditionType = key;
        }
        if (!checkData.hasOwnProperty(conditionType)) {
            if( isEditCondition === true ) {
                return null;
            }
            return false;
        }
        if (keyStr == "=") {
            keyStr = "==";
        }
        let realValue = checkData[conditionType];
        let doubleCheckRealValue = null;
        if( isNum(realValue) ) {
            doubleCheckRealValue = parseInt(realValue);
        }
        let rsList = [];
        let testStr = null;
        for (let i = 0; i < conditionValue.length; i++) {
            try {
                testStr = null; //init it to null
                if (keyStr === "==" || keyStr === "!=") {
                    testStr = "'" + realValue + "' " + keyStr + " '" + conditionValue[i] + "'"
                } else {
                    testStr = realValue + " " + keyStr + " " + conditionValue[i]
                }
                rsList.push(eval(testStr));
                if( doubleCheckRealValue != null ) {
                    testStr = null;
                    if (keyStr === "==" || keyStr === "!=") {
                        testStr = "'" + doubleCheckRealValue + "' " + keyStr + " '" + conditionValue[i] + "'"
                    } else {
                        testStr = doubleCheckRealValue + " " + keyStr + " " + conditionValue[i]
                    }
                    rsList.push(eval(testStr));
                }
            } catch (e) {
                // console.log("can not eval '" + testStr + "'")
                // console.error(e)
                rsList.push(true);
            }
        }
        if (keyStr == "==") {
            if (rsList.indexOf(true) > -1) {
                return true;
            } else {
                return false;
            }
        }
        if (keyStr == "!=") {
            if (rsList.indexOf(false) > -1) {
                return false;
            } else {
                return true;
            }
        }
        return rsList[0];
    }
}

const getPlaceholderCount = function(str,key,count) {
    if( str.indexOf(key) > -1) {
        count++;
        str = str.substring(str.indexOf(key) + key.length);
        return getPlaceholderCount(str,key,count)
    } else {
        return count
    }
}

const parseConditionType = function(conditionType, _controlConfig, key) {
    let keyItems = ["db-value(", "string(", "current("];
    if (conditionType.startsWith("count(")) {

    }
    for (let i = 0; i < keyItems.length; i++) {
        let _keyStr = keyItems[i];
        if (conditionType.startsWith(_keyStr)) {
            return parseConditionType(conditionType.substring(_keyStr.length, conditionType.length - 1), _controlConfig, key);
        }
    }
    if (conditionType.startsWith("../../")) {   //todo
        return {
            path: getPlaceholderCount(conditionType,"../",0) ,
            key: conditionType.replaceAll("../", "")
        };
    } else if (conditionType.startsWith("../")) {
        conditionType = conditionType.replace("../", "")
    } else if (conditionType == "" || conditionType == "." || conditionType == "..") {
        conditionType = key;
    }
    if (_controlConfig.hasOwnProperty("expandType")) {
        conditionType = EXPAND_KEYS.format(_controlConfig.expandType) + conditionType;
    }
    return conditionType;
}
const parseEditCondition1 = function (subConfig,_value) {
    let values = _value.split("=");
    if( values.length == 2 ) {
        values = values[1].trim();
        if ( values.startsWith("../") && values.match(/[/]/g).length == 1 ) {
            let _key = values.substring(3)
            subConfig.afterUpdate = function (data, config) {
                if (config.enumValue === null) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                if( data[_key] === null ) {
                    return filterEnum;
                }
                for (let i = filterEnum.length - 1; i >= 0; i--) {
                    if( _value.startsWith(". !=") ) {
                        if (filterEnum[i].label == data[_key]) {
                            filterEnum.splice(i, 1)
                        }
                    } else {
                        if (filterEnum[i].label != data[_key]) {
                            filterEnum.splice(i, 1)
                        }
                    }
                }
                data[subConfig.label] = data[_key];
                if( isEmptyObj(filterEnum) ) {
                    return null;
                }
                return filterEnum;
            }
        } else {
            let _items = [values];
            let filterItems = [];
            if (values.startsWith("(") && values.endsWith(")")) {
                values = values.substring(1, values.length - 1);
                _items = values.split(",");
            }
            for (let i = 0; i < _items.length; i++) {
                if (_items[i].toString().trim().startsWith("'")) {
                    let str = _items[i].toString().trim();
                    str = str.substring(1, str.length - 1);
                    if( !(str == null || str == "" || str.indexOf("/") > -1 || str.indexOf(".") > -1 ||str.indexOf("'") > -1 )) {
                        filterItems.push(str);
                    }
                }
            }
            if( filterItems.length > 0 ) {
                subConfig.afterUpdate = function (data, config) {
                    if (isNullOrUndefined(config.enumValue)) {
                        return [];
                    }
                    let filterEnum = deepClone(config.enumValue);
                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                        if( _value.startsWith(". !=") ) {
                            if (filterItems.indexOf(filterEnum[i].label) > -1) {
                                filterEnum.splice(i, 1)
                            }
                        } else {
                            if (filterItems.indexOf(filterEnum[i].label) < 0) {
                                filterEnum.splice(i, 1)
                            }
                        }

                    }
                    return filterEnum;
                }
            }

        }
    }
}

const parseEditCondition2 = function (subConfig,_value,data, config) {
    let values = _value.split("=");
    if( values.length == 2 ) {
        values = values[1].trim();
        if ( values.startsWith("../") && values.match(/[/]/g).length == 1 ) {
            let _key = values.substring(3)
            if (config.enumValue === null) {
                return [];
            }
            let filterEnum = deepClone(config.enumValue);
            if( data[_key] === null ) {
                return filterEnum;
            }
            for (let i = filterEnum.length - 1; i >= 0; i--) {
                if( _value.startsWith(". !=") ) {
                    if (filterEnum[i].label == data[_key]) {
                        filterEnum.splice(i, 1)
                    }
                } else {
                    if (filterEnum[i].label != data[_key]) {
                        filterEnum.splice(i, 1)
                    }
                }
            }
            data[subConfig.label] = data[_key];
            if( isEmptyObj(filterEnum) ) {
                return null;
            }
            return filterEnum;
        } else {
            let _items = [values];
            let filterItems = [];
            if (values.startsWith("(") && values.endsWith(")")) {
                values = values.substring(1, values.length - 1);
                _items = values.split(",");
            }
            for (let i = 0; i < _items.length; i++) {
                if (_items[i].toString().trim().startsWith("'")) {
                    let str = _items[i].toString().trim();
                    str = str.substring(1, str.length - 1);
                    if( !(str == null || str == "" || str.indexOf("/") > -1 || str.indexOf(".") > -1 ||str.indexOf("'") > -1 )) {
                        filterItems.push(str);
                    }
                }
            }
            if( filterItems.length > 0 ) {
                if (isNullOrUndefined(config.enumValue)) {
                    return [];
                }
                let filterEnum = deepClone(config.enumValue);
                for (let i = filterEnum.length - 1; i >= 0; i--) {
                    if( _value.startsWith(". !=") ) {
                        if (filterItems.indexOf(filterEnum[i].label) > -1) {
                            filterEnum.splice(i, 1)
                        }
                    } else {
                        if (filterItems.indexOf(filterEnum[i].label) < 0) {
                            filterEnum.splice(i, 1)
                        }
                    }

                }
                return filterEnum;
            }

        }
    }
}

export const parseEditCondition = function (subConfig,keyStr) {
    if( subConfig.afterUpdate != null ) {
        return;
    }
    let conditionList = [];
    convertToArray(subConfig["edit-condition"]).forEach(item=>{
        if( item.hasOwnProperty("value") ) {
            let _value = item.value.trim();
            if( _value.startsWith("(") && _value.indexOf(" or ") > -1
                && (_value.indexOf("newvalue(.)") > -1 || _value.indexOf(". =") > -1 || _value.indexOf(". !=") > -1) ) {
                subConfig.afterUpdate = function (data, config,parentData,neData) {
                    _value = _value.substring(1, _value.length - 1);
                    let vs = _value.split(" or ");
                    let parseValue = ""
                    let booleanValue = false;
                    vs.forEach(item => {
                        if (item.indexOf("newvalue(.)") < 0 && item.indexOf(". =") < 0 && item.indexOf(". !=") < 0) {
                            if( parseYangActionParameter1st(subConfig, item, keyStr, data, parentData, neData,true)) {
                                booleanValue = true;
                            }
                        } else {
                            if( item.startsWith("(") ) {
                                item = item.substring(1);
                            }
                            parseValue = item;
                        }
                    })
                    if( !booleanValue ) {
                        return parseEditCondition2(subConfig,parseValue,data, config)
                    }
                }
            } else if( _value.startsWith("newvalue(.)") || _value.startsWith(". =") || _value.startsWith(". !=") ) {
                return parseEditCondition1(subConfig,_value)
            } else if( _value.startsWith("if") ) {
                let substring = _value.replaceAll("\n", " ").replace(/\s+/g, ' ');
                let count = 0;
                while (substring.indexOf("if ") > -1 && count < 10) {
                    count++;
                    try {
                        let condition = substring.substring(substring.indexOf("if ") + 3, substring.indexOf(" then")).trim();
                        if (condition.startsWith("(") && condition.endsWith(")")) {
                            condition = condition.substring(1, condition.length - 1);
                        }
                        substring = substring.substring(substring.indexOf(" then"));
                        let value = substring.substring(substring.indexOf(" then") + 5, substring.indexOf("else ")).trim();
                        substring = substring.substring(substring.indexOf("else ") + 5);
                        conditionList.push({
                            condition: condition,
                            value: value
                        })
                    } catch (e) {

                    }
                }
            }
            if( conditionList.length > 0 ) {
                subConfig.afterUpdate = function (data, config) {
                    if (isNullOrUndefined(config.enumValue)) {
                        return [];
                    }

                    let filterEnum = deepClone(config.enumValue);
                    for(let i=0;i<conditionList.length;i++) {
                        let condition = conditionList[i].condition;
                        if(parseYangActionParameter(condition, config, keyStr, data, {}, {},true)){
                            let filterValue = conditionList[i].value;
                            if( filterValue.startsWith(". = ") || filterValue.startsWith(". != ") ) {
                                filterValue = filterValue.substring(4);
                                if( filterValue.startsWith("(") && filterValue.endsWith(")") ) {
                                    filterValue = filterValue.substring(1,filterValue.length-1);
                                }
                                let filterItems = filterValue.split(",");
                                for(let i=0;i<filterItems.length;i++) {
                                    filterItems[i] = filterItems[i].toString().replaceAll("'","").trim();
                                }
                                if( conditionList[i].value.startsWith(". = ") ) {
                                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                                        if (filterItems.indexOf(filterEnum[i].label) < 0) {
                                            filterEnum.splice(i, 1)
                                        }
                                    }
                                } else {
                                    for (let i = filterEnum.length - 1; i >= 0; i--) {
                                        if (filterItems.indexOf(filterEnum[i].label) > -1) {
                                            filterEnum.splice(i, 1)
                                        }
                                    }
                                }
                            }
                            return filterEnum;
                        }
                    }
                    return filterEnum;
                }
            }
        }
    })
}

export const getSimplifyNS = function (_namespace) {
    let NS = getYang("namespace");
    for (let i in NS) {
        if (_namespace === NS[i]) {
            return i;
        }
    }
    return null;
}

const resourceReg = /\/(?:[\w-]+:)?([\w-]+)((?:\[(?:[^[\]]+\[[^[\]]+])*[^[\]]*])*)/
export const getKeyFromResource = function (resourceObj) {
    let retValue = {
        type: "",
        keys: {},
        keyName: ""
    };
    if (resourceObj == null) {
        return retValue;
    }
    const arr = resourceObj.match(/\/([\w-]+:)?[\w-]+(?:\[(?:[^[\]]+\[[^[\]]+])*[^[\]]*])*/g);
    if (arr) {
        for (let element of arr) {
            let arr1 = element.match(resourceReg);
            if (arr1) {
                retValue.type = arr1[1];
                if (arr1[2]) {
                    retValue.keys[arr1[1]] = {};
                    let obj = retValue.keys[arr1[1]];
                    let arr2 = arr1[2].match(/\[(?:[^[\]]+\[[^[\]]+])*[^[\]]*]/g);
                    if (arr2) {
                        for (let i in arr2) {
                            let arr3 = arr2[i].match(/\[(?:[\w\-]+:)?([\w\-]+)='(.+)'/);
                            if (arr3) {
                                let value = arr3[2];
                                obj[arr3[1]] = value; // contain namespace
                                let v = removeNS(value);
                                if (value.match(resourceReg)) {
                                    let subResource = getKeyFromResource(value);
                                    v = subResource && subResource.type ? subResource.keyName : v;
                                } else {
                                    value = removeNS(value);
                                }
                                retValue.keyName += ((i > 0) ? "/" : "-") + v;
                            } else {
                                // console.error(`not able to translate resource: ${kv}`);
                            }
                        }
                    } else {
                        // console.error(`not able to translate resource: ${arr1[2]}`);
                    }
                }
            } else {
                // console.error(`not able to translate resource: ${element}`);
            }
        }
    } else {
        // console.error(`not able to translate resource: ${resourceObj}`);
    }

    retValue.keyName = retValue.type + retValue.keyName;
    return retValue;
}

export const resource2KeyName = resourceObj => {
    let resourceObjList = convertToArray(resourceObj);
    let keyNameList = [];
    resourceObjList.forEach(obj => {
        let keyObj = getKeyFromResource(obj);
        if (!isEmptyObj(keyObj) && keyObj.type != "") {
            keyNameList.push(keyObj.keyName)
        }
    })
    return keyNameList.join(",");
}

export const key2Name = (containerKey, keys) => {
    let YANG = getYang("yang");
    let _yang = YANG[containerKey];
    if (_yang === null) {
        console.error("Can not found the type " + containerKey + " settings in the yang.json ,Please check it!");
        return {};
    }
    let jpath = _yang.definition.jpath;
    let name = keys ? (containerKey + "-" + _key2Name(keys, jpath)) : containerKey;
    return name;

    function _key2Name(keys, jpath) {
        let name = "";
        for (let i in jpath) {
            if (keys.hasOwnProperty(i)) {
                name += Object.values(keys[i]).join("-");
            }

            if (jpath.hasOwnProperty(i)) {
                let tmp = _key2Name(keys, jpath[i]);
                if (tmp) {
                    name += (name ? "-" : "") + tmp;
                }
            }
        }
        return name;
    }
}

export const parseURLParameter = function (_urlSearch) {
    let SHOW_CONFIG_ACTION_KEYS = ["initFilter", "select"];
    let showConfig = {};
    if (_urlSearch != "") {
        let _urlObj = _urlSearch.replace("?", "").split("&");
        let urlKeys = {};
        for (let i = 0; i < _urlObj.length; i++) {
            let _obj = _urlObj[i].split("=");
            urlKeys[_obj[0].toLowerCase()] = _obj[1];
        }
        if (urlKeys.hasOwnProperty("action")) {
            let action = urlKeys["action"];
            let _keyStr = null;
            if (SHOW_CONFIG_ACTION_KEYS.indexOf(action) > -1) {
                _keyStr = action
                delete urlKeys["action"];
            }
            showConfig[_keyStr] = urlKeys;
        } else if (urlKeys.hasOwnProperty("filter")) {
            let _keyStr = urlKeys.filter;
            delete urlKeys["filter"];
            showConfig.filter = {};
            showConfig.filter[_keyStr] = urlKeys;
        }
    }

    if (!isEmptyObj(showConfig)) {
        showConfig["urlRequest"] = true;
    }

    return showConfig;
}

export const deepClone = function (obj) {
    let result = {};
    let oClass = isClass(obj);
    if (oClass === "Object") {
        result = {};
    } else if (oClass === "Array") {
        result = [];
    } else {
        return obj;
    }
    for (let key in obj) {
        let copy = obj[key];
        result[key] = deepClone(copy);
    }
    return result;

    function isClass(o) {
        if (o === null) return "Null";
        if (o === undefined) return "Undefined";
        return Object.prototype.toString.call(o).slice(8, -1);
    }
};

/**
 *
 * @param _d_
 * @param _c_
 * @param mergeCfg :
    * {
 *     Array : 0  // overwrite (default),
 *             1  // append
 * }
 * @returns {{}}
 */

export const merge = function (src, obj, mergeCfg) {
    if (isNullOrUndefined(obj)) return;
    for (let key in obj) {
        if (src[key] && src[key] instanceof Array) {
            if (mergeCfg == null || mergeCfg.Array == null || mergeCfg.Array == 0) {
                src[key] = deepClone(obj[key]);
            } else if (mergeCfg.Array == 1) {
                src[key] = src[key].concat(obj[key])
            } else {
                merge(src[key], obj[key], mergeCfg);
            }
        } else if (src[key] && typeof src[key] === "object") {
            merge(src[key], obj[key], mergeCfg);
        } else {
            src[key] = deepClone(obj[key]);
        }
    }
};


/**
 *
 * @param _d_
 * @param _c_
 * @param mergeCfg :
    * {
 *     Array : 0  // overwrite (default),
 *             1  // append
 * }
 * @returns {{}}
 */
export const extendCustomConfig = function (_d_, _c_, mergeCfg) {
    let tmp = deepClone(_d_);
    merge(tmp, deepClone(_c_), mergeCfg);
    return tmp;
};

export const parseListValues = function (val) {
    if (typeof val == 'object') {
        if (typeof val.length == 'number') {
            let newValue = '';
            for (let i = 0; i < val.length; i++) {
                newValue += val[i];
                if (i != val.length - 1) {
                    newValue += ", "
                }
            }
            return newValue;
        }
    } else {
        return val;
    }
}

export const xPathToKeys = function (xPath) {
    let keys = {};
    for (let key in xPath) {
        if (key.endsWith("-id") && key !== "alarm-id") {
            keys[key.substring(0, key.length - 3)] = {
                name: xPath[key]
            }
        } else {
            keys[key] = xPath[key];
        }
    }
    return keys;
}

export const hashCode = function (str) {
    str = str + "";
    let h = 0, off = 0;
    let len = str.length;
    for (let i = 0; i < len; i++) {
        h = 31 * h + str.charCodeAt(off++);
        if (h > 0x7fffffff || h < 0x80000000) {
            h = h & 0xffffffff;
        }
    }
    return h;
};

export const getChildrenList = function (yangNode) {
    let nodeTypes = getYang("yang")[yangNode];
    let types = [];
    for (let key in nodeTypes) {
        if (nodeTypes[key] == "list") {
            types.push(key);
        }
    }
    return types;
}

export const getContainerList = function (yangNode) {
    let nodeTypes = getYang("yang")[yangNode];
    let types = [];
    for (let key in nodeTypes) {
        if (nodeTypes[key] == "container") {
            types.push(key);
        }
    }
    return types;
}

export const neDisconnect = function (err) {
    let config = {
        dialogType: DialogType.ERROR,
        showText: getText(err),
        okCallBack: redirectLoginPage,
        closeCallBack: redirectLoginPage
    };
    showAlertDialog(config);
}

export const collapseOthers = function () {
    const myOpenList = document.getElementsByClassName("my-open");
    for (let index = myOpenList.length - 1; index >= 0; index--) {
        myOpenList.item(index).classList.remove("my-open");
    }
}
export const isNum = function (s) {
    let re = /^(\-|\+)?\d+(\.\d+)?$/;// /^(-)*\d*[0-9][0-9]*$/;
    return re.test(s)
}
export const ActionListener = function (key, validatorRules, changeFunc, selectMd) {//selectMd only for select with mandator=false
    return function (event) {
        let value = event.target.value, vMsg = {validateMsg: {}}, vr = validatorRules.validators;
        value = (value == PLEASE_SELECT_VALUE && !selectMd) ? "" : value;
        let retValue = validateField(value, vr);
        let retFlag = typeof (retValue) == "string";
        let msg = retFlag ? vr[retValue]["message"]() : null;
        let iconStr = retFlag ? "remove" : retValue == 0 ? "check-mark" : "has-notRequired";
        vMsg.validateMsg[key] = {showIcon: iconStr, text: msg};
        changeFunc && changeFunc(event, vMsg);
    }
}
export const validate = function (values, validators) {
    let flag = true, vMsg = {validateMsg: {}};
    for (let key in values) {
        let vf = validators.fields[key];
        if (isNullOrUndefined(vf) || isNullOrUndefined(vf.validators)) continue;
        let vr = vf.validators;
        let value = values[key];
        let retValue = 0;
        if (value instanceof Array) {
            retValue = validate4MultiValue(value, vr, key);
        } else {
            retValue = validateField(value, vr);
        }
        let retFlag = typeof (retValue) == "string";
        retFlag && (flag = false);
        let msg = retFlag ? vr[retValue]["message"]() : null;
        let iconStr = retFlag ? "remove" : retValue == 0 ? "check-mark" : "has-notRequired";
        vMsg.validateMsg[key] = {showIcon: iconStr, text: msg};
    }
    vMsg.validateMsg["pass"] = flag;
    return vMsg;
}
const validate4MultiValue = function (value, vr, key) {
    let retValue = 0;
    for (let i = 0; i < value.length; i++) {
        retValue = validateField(value[i], vr);
        if (retValue != 0) {
            break;
        }
    }
    if (value.length == 0) {
        if (vr.hasOwnProperty("notEmpty")) {
            retValue = "notEmpty";
        } else if (vr.hasOwnProperty("notRequired")) {
            retValue = -1;
        } else {
            retValue = Object.keys(vr)[0];
        }
    }
    return retValue;
}
export const ActionListener4MultiSelect = function (key, validatorRules, changeFunc) {
    return function (event) {
        let t = event.target, vMsg = {validateMsg: {}}, vr = validatorRules.validators;
        let value = t.value;
        let retValue = 0;
        for (let i = 0; i < value.length; i++) {
            retValue = validateField(value[i], vr);
            if (retValue != 0) {
                break;
            }
        }
        if (value.length == 0) {
            if (vr.hasOwnProperty("notEmpty")) {
                retValue = "notEmpty";
            } else {
                retValue = "notRequired";
            }
        }
        let retFlag = typeof (retValue) == "string";
        let msg = retFlag ? vr[retValue]["message"]() : null;
        let iconStr = retFlag ? "remove" : retValue == 0 ? "check-mark" : "has-notRequired";
        vMsg.validateMsg[key] = {showIcon: iconStr, text: msg};
        changeFunc ? changeFunc(event, vMsg) : null;
    }
}

const validateField = function (value, validatorRules) {
    for (let validator in validatorRules) {
        switch (validator) {
            case "notEmpty":
                if (isEmpty(value))
                    return validator;
                break;
            case "stringLength":
                let len = isEmpty(value) ? 0 : value.length;
                let val = validatorRules[validator], loopFlag = false;
                if (val.hasOwnProperty("lenArray")) {
                    val["lenArray"].forEach(vl => {
                        if (vl.hasOwnProperty("len")) {
                            if (len == vl["len"]) {
                                loopFlag = true;
                            }
                        } else {
                            if (len >= vl["min"] && len <= vl["max"]) {
                                loopFlag = true;
                            }
                        }
                    })
                } else {
                    if (len >= val["min"] && len <= val["max"]) {
                        loopFlag = true;
                    }
                }
                if (!loopFlag) {
                    return validator;
                }
                break;
            case "between": //for value:19 or 990.00001, not for "" etc
                let reg = /^(\-|\+)?\d+(\.\d+)?$/;
                if (validatorRules[validator].hasOwnProperty("fraction-digits")) {
                    reg = new RegExp("^(\\-|\\+)?\\d+(\\.\\d{1," + validatorRules[validator]["fraction-digits"] + "})?$");
                }
                if (!reg.test(value)) {//validate if value is a number
                    return validator;
                }
                let [lftVal, rgtVal = 0] = value.split("."), sign = true;
                rgtVal = "0." + rgtVal;
                if (value.indexOf("-") == 0) {
                    sign = false;
                }
                if (validatorRules[validator].hasOwnProperty("bwnArray")) {
                    let flag = false;
                    validatorRules[validator]["bwnArray"].some(vl => {
                        if (vl.hasOwnProperty("val")) {
                            if (value == vl["val"]) {
                                flag = true;
                                return true;
                            }
                        } else {
                            let [lftMin, rgtMin = 0] = vl["min"].split("."),
                                [lftMax, rgtMax = 0] = vl["max"].split(".");
                            rgtMin = "0." + rgtMin;
                            rgtMax = "0." + rgtMax;
                            if (lftVal == lftMin && ((sign && rgtVal - rgtMin >= 0) || (!sign && rgtVal - rgtMin <= 0))) {
                                flag = true;
                                return true;
                            } else if (lftVal == lftMax && ((sign && rgtVal - rgtMax <= 0) || (!sign && rgtVal - rgtMax >= 0))) {
                                flag = true;
                                return true;
                            } else if (lftVal - lftMin > 0 && lftVal - lftMax < 0) {
                                flag = true;
                                return true;
                            }
                        }
                    });
                    if (!flag) {
                        return validator;
                    }
                } else {
                    let [lftMin, rgtMin = 0] = validatorRules[validator]["min"].split("."),
                        [lftMax, rgtMax = 0] = validatorRules[validator]["max"].split(".");
                    rgtMin = "0." + rgtMin;
                    rgtMax = "0." + rgtMax;
                    if (lftVal == lftMin && ((sign && rgtVal - rgtMin < 0) || (!sign && rgtVal - rgtMin > 0))) {
                        return validator;
                    } else if (lftVal == lftMax && ((sign && rgtVal - rgtMax > 0) || (!sign && rgtVal - rgtMax < 0))) {
                        return validator;
                    } else if (lftVal - lftMin < 0 || lftVal - lftMax > 0) {
                        return validator;
                    }
                }
                break;
            case "decimal":
                let regs1 = validatorRules["decimal"]["regexp"];
                if (typeof (regs) == "string")
                    regs1 = new RegExp(regs1);
                if (!regs1.test(value))
                    return validator;
                break;
            case "regexp":
                let regs = validatorRules[validator]["regexp"];
                let loopRet = true;
                if (regs instanceof Array) {
                    regs.forEach(reg => {
                        if (typeof (reg) == "string")
                            reg = new RegExp(reg);
                        if (!reg.test(value))
                            loopRet = false;
                    })
                } else {
                    if (typeof (regs) == "string")
                        regs = new RegExp(regs);
                    if (!regs.test(value))
                        loopRet = false;
                }
                if (!loopRet)
                    return validator;
                break;
            case "custom":
                if (!validatorRules[validator]["custom"](value))
                    return validator;
                break;
            case "notRequired":
                if (isEmpty(value))
                    return -1;//not required
                break;
            case "validateInteger":
                if (!/^(\-|\+)?\d+$/.test(value)) {
                    return validator;
                }
                break;
            case "union":
                let flag = false;
                validatorRules[validator]["validators"].some(validate => {
                    let ret = validateField(value, validate);
                    if ( ret <= 0) {
                        flag = true;
                        return true;//like break; return true like continue;
                    }
                });
                if (!flag)
                    return validator;
                break;
            case "enumList":
                if (validatorRules[validator]["enumList"].indexOf(value) == -1)
                    return validator;
                break;
        }
    }
    return 0;
}

export const ActionListener4Ele = function (validatorRules, changeFunc) {
    return function (dataid, value) {
        let vMsg = {validateMsg: {}}, vr = validatorRules.validators;
        let retValue = validateField(value, vr);
        let retFlag = typeof (retValue) == "string";
        let msg = retFlag ? vr[retValue]["message"]() : null;
        let iconStr = retFlag ? "remove" : retValue == 0 ? "check-mark" : "has-notRequired";
        vMsg.validateMsg[dataid] = {showIcon: iconStr, text: msg};
        changeFunc ? changeFunc(dataid, value, vMsg) : null;
    }
}

export const formatByObject = function (oriStr, template) {
    if (template == undefined || template == null) {
        return oriStr;
    }
    let str = oriStr;
    Object.keys(template).map(key => {
        str = str.replace(new RegExp("\\{" + key + "\\}", "g"), template[key]);
    });
    return str;
};

export const formatDate = function (oriDate, fmt) { //author: meizz
    let o = {
        "M+": oriDate.getMonth() + 1, //月份
        "d+": oriDate.getDate(), //日
        "H+": oriDate.getHours(), //小时
        "m+": oriDate.getMinutes(), //分
        "s+": oriDate.getSeconds(), //秒
        "q+": Math.floor((oriDate.getMonth() + 3) / 3), //季度
        "S": oriDate.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (oriDate.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};


export const uniqueArray = function (arr) {
    return [...new Set(arr)];
}

export const removeArrayItem = function (arr, s) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (s === arr[i])
            arr.splice(i, 1);
    }
};

String.prototype.replaceAll = function (s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
};

String.prototype.format = function () {
    if (arguments.length == 0) return this;
    for (let s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};


export const closestDom = function (element, tag) {
    if (element) {
        return (element.localName === tag) ? element : closestDom(element.parentNode, tag);
    }
    return null;
};

export const nextDom = function (element, tag) {
    let retDom = null;
    while (!retDom) {
        let previous = element.previousSibling;
        if (!previous) break;
        if (previous.localName === tag) {
            retDom = previous;
        }
    }
    while (!retDom) {
        let next = element.nextSibling;
        if (!next) break;
        if (next.localName === "div") {
            retDom = next;
        }
    }

    return retDom;
}

export const checkUserClass = function (_config, type) {
    let config = _config["definition"]
    if (config != null && config.hasOwnProperty("user-class")) {
        if (config["user-class"].hasOwnProperty(type)) {
            let _userClassList = config["user-class"][type];
            let sessionUserClass = sessionStorage.userGroup.split(",");
            for (let i = 0; i < _userClassList.length; i++) {
                if (_userClassList[i] == "*") {
                    return true;
                }
                for (let j = 0; j < sessionUserClass.length; j++) {
                    if (_userClassList[i] == sessionUserClass[j]) {
                        return true;
                    }
                }
            }
        } else if (type == USER_CLASS_TYPE.read) {
            return true;
        }
        return false;
    }
    return true;
}

export const checkParameterUserClass = function (config, type, para, option) {
    if (config["input"].hasOwnProperty(para)) {
        if (config["input"][para].hasOwnProperty("user-class")) {
            let _userClassList = config["input"][para]["user-class"];
            let sessionUserClass = sessionStorage.userGroup.split(",");
            _userClassList = _userClassList.toString();
            const startIndex = _userClassList.indexOf(option);
            let optionUserClassList = _userClassList.substr(startIndex);
            optionUserClassList = optionUserClassList.substr(0, optionUserClassList.indexOf(" "));
            optionUserClassList = optionUserClassList.substr(optionUserClassList.indexOf(":") + 1).split(",")
            for (let i = 0; i < optionUserClassList.length; i++) {
                for (let j = 0; j < sessionUserClass.length; j++) {
                    if (optionUserClassList[i] == sessionUserClass[j]) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            return true
        }
    }

    return false;
}

export const checkPpcParameterUserClass = function (config, type, para) {
    if (config["input"].hasOwnProperty(para)) {
        if (config["input"][para].hasOwnProperty("user-class")) {
            let _userClassList = config["input"][para]["user-class"];
            let sessionUserClass = sessionStorage.userGroup.split(",");
            _userClassList = _userClassList.substr(_userClassList.indexOf(":") + 1).split(",")
            if(_userClassList==="*")
                return true;
            for (let i = 0; i < _userClassList.length; i++) {
                for (let j = 0; j < sessionUserClass.length; j++) {
                    if (_userClassList[i] == sessionUserClass[j]) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            return true
        }
    }

    return false;
}

export const getRefData = function (selectStr, fromStr, callback, whereStr) {
    const _config = {
        enumValue: []
    };
    requestData({
        select: [selectStr],
        from: fromStr,
        where: whereStr
    }, function (_selectedData) {
        const enumList = [];
        const _rslist = convertToArray(_selectedData[fromStr]);
        for (let i = 0; i < _rslist.length; i++) {
            enumList.push({
                label: _rslist[i][selectStr],
                value: _rslist[i][selectStr]
            })
        }
        callback({
            enumValue: enumList
        })
    })
    return _config
}


export const initConfigFuction = function (data, callback, selectStr, fromStr, whereStr) {
    const _config = {
        enumValue: []
    };
    if (data != null) {
        requestData({
            select: [selectStr],
            from: fromStr,
            where: whereStr
        }, function (_selectedData) {
            const enumList = [];
            const _rslist = convertToArray(_selectedData[fromStr]);
            for (let i = 0; i < _rslist.length; i++) {
                enumList.push({
                    label: _rslist[i][selectStr],
                    value: _rslist[i][selectStr]
                })
            }
            callback({
                enumValue: enumList
            })
        })
    } else {
        callback(_config)
    }
    return _config
}

export const getMappingHelpString = function (str) {
    if (HELPSTRINGMAP.hasOwnProperty(str)) {
        return HELPSTRINGMAP[str];
    }
    return str;
}

export const getHelpUrl = function (helpString) {
    if (!helpString || !CONTEXT_HELP_MAP.hasOwnProperty(helpString)) {
        helpString = "webguidefaultmapid";
    }
    let dstUrl = CONTEXT_HELP_MAP[helpString];
    return dstUrl;
}

const checkBrowserIsSupport = function (func) {
    const explorerInfo = getExplorerInfo();
    if (explorerInfo.type.support) {
        if (!checkBrowserVersion(explorerInfo)) {
            alertNotSupportWarning(func);
        } else {
            func();
        }
    } else {
        alertNotSupportWarning(func);
    }
};

const getExplorerInfo = function () {
    let explorer = navigator.userAgent;
    let isOpera = explorer.indexOf("Opera") > -1 || explorer.indexOf("OPR/") > -1;
    let isFF = explorer.indexOf("Firefox") > -1;
    let isIE = isIEBrowser();
    let isSafari = explorer.indexOf("Safari") > -1 && explorer.indexOf("Chrome") === -1 && !isOpera;
    let isChrome = explorer.indexOf("Chrome") > -1 && explorer.indexOf("Safari") > -1 && !isOpera;
    explorer = explorer.toLowerCase();
    let ver;
    if (isIE) {
        ver = explorer.match(/rv:([\d]+(\.[\d]+)?)/)[1];
        return {type: BrowserType.IE, version: ver};
    } else if (isFF) {
        ver = explorer.match(/firefox\/([\d.]+)/)[1];
        return {type: BrowserType.Firefox, version: ver};
    } else if (isChrome) {
        ver = explorer.match(/chrome\/([\d.]+)/)[1];
        return {type: BrowserType.Chrome, version: ver};
    } else if (isOpera) {
        ver = explorer.match(/opera.([\d.]+)/) || explorer.match(/opr\/([\d.]+)/)[1];
        return {type: BrowserType.Opera, version: ver};
    } else if (isSafari) {
        ver = explorer.match(/version\/([\d.]+)/)[1];
        return {type: BrowserType.Safari, version: ver};
    } else {
        return {type: BrowserType.Other, version: null};
    }
};

const checkBrowserVersion = function (explorerInfo) {
    let supVersion = explorerInfo.type.supVersion;
    let curVersion = explorerInfo.version;
    if (isEmpty(curVersion)) {
        return false;
    }
    if (isEmpty(supVersion)) {
        return false;
    }
    if (supVersion.toLowerCase() === "all") {
        return true;
    }
    supVersion = supVersion.split(".");
    curVersion = curVersion.split(".");
    let maxLength = Math.max(supVersion.length, curVersion.length);
    let supIndex, curIndex;
    for (let i = 0; i < maxLength; i++) {
        supIndex = supVersion[i] || 0;
        curIndex = curVersion[i] || 0;
        if (supIndex > curIndex) {
            return false;
        }
    }
    return true;
};

const alertNotSupportWarning = function () {
    let supportMsg = "The current browser is not supported, it may be abnormal.</br>" +
        "The following browsers have been supported:</br>";
    Object.keys(BrowserType).map(key => {
        let obj = BrowserType[key];
        if (obj.support) {
            supportMsg += "&nbsp;&nbsp;&nbsp;&nbsp;● " + key + "-" + obj.supVersion + "  and higher version" + "</br>"
        }
    });
    let config = {
        dialogType: DialogType.INFO,
        showText: supportMsg
    };
    showAlertDialog(config);
};

const isIEBrowser = function () {
    return !!ActiveXObject || "ActiveXObject" in window;
};

const BrowserType = {
    Opera: {
        id: 1,
        support: false,
        supVersion: "44.0"
    },
    Firefox: {
        id: 2,
        support: true,
        supVersion: "50.0"
    },
    Chrome: {
        id: 3,
        support: true,
        supVersion: "55.0"
    },
    Safari: {
        id: 4,
        support: false,
        supVersion: ""
    },
    IE: {
        id: 5,
        support: true,
        supVersion: "11.0"
    },
    Other: {
        id: 6,
        support: false,
        supVersion: ""
    }
};

export const PLEASE_SELECT_VALUE = getText("please-select");
