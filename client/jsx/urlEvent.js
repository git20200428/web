import {callRpc, createItem, deleteItem, detailsItem, editItem, editRpcItem} from "./custom/comm/react_common";
/**
 * CLI for NMS
 * login :      https://<host>?action=login&username=root&password=onl
 *              https://<host>?action=login&username=root&spassword=ESMZTLP/qtKzWj/qA46Z/g==
 * logout :     https://<host>?action=logout
 * active :     https://<host>/1_0                                      //entry page id.

 * select :     https://<host>?action=select                            //todo
 * view :       https://<host>?view=card&action=view&card_name=1-5
 * create :     https://<host>?view=card&action=create&chassis_name=1&slot_name=4
 * edit :       https://<host>?view=card&action=edit&chassis_name=1&slot_name=4&card_name=1-4
 * delete :     https://<host>?view=card&action=delete&chassis_name=1&slot_name=4&card_name=1-4
 */
import {getEntityPathByKey, getText, getYang, isEmptyObj, loginOut, merge} from "./custom/utils";

let resourceParameter = {
    "pm-resource": ["resource"],
}

let parseURLEvent = function (_url) {
    if( _url.indexOf("?") > -1) {
        let _urlSearch = _url.substring(_url.indexOf("?") +1).trim();
        if( _urlSearch != "" ) {
            let _urlObj = _urlSearch.replace("?", "").split("&");
            let urlKeys = {};
            for (let i = 0; i < _urlObj.length; i++) {
                let _obj = _urlObj[i].split("=");
                urlKeys[_obj[0].toLowerCase()] = _obj[1];
            }
            if (urlKeys.hasOwnProperty("action")) {
                let action = urlKeys["action"];
                if (action == "logout") {
                    loginOut();
                } else if (action == "select") {
                    //todo
                } else {
                    let _action = urlKeys["action"];
                    delete urlKeys["action"];
                    let _type = urlKeys["view"];
                    delete urlKeys["view"];
                    let _initKey = {};
                    let _xPath = {};
                    for (let _key in urlKeys) {
                        if (_key.indexOf("_")) {
                            let _nameList = _key.split("_");
                            let _keyValue = null;
                            if (resourceParameter.hasOwnProperty(_nameList[0])
                                && resourceParameter[_nameList[0]].indexOf(_nameList[1]) > -1) { //parse resource parameters
                                let _value = urlKeys[_key];
                                let _objType = _value.substring(0, _value.indexOf("-"));
                                let _objId = _value.substring(_value.indexOf("-") + 1);
                                let _keyWhere = {};
                                _keyWhere[_objType] = {
                                    "name": _objId
                                }
                                _keyValue = getEntityPathByKey(_objType, _keyWhere);
                            } else {
                                _keyValue = urlKeys[_key];
                            }
                            if (_initKey[_nameList[0]] != null) {
                                _initKey[_nameList[0]][_nameList[1]] = _keyValue;
                            } else {
                                let _obj = {}
                                _obj[_nameList[1]] = _keyValue;
                                _initKey[_nameList[0]] = _obj;
                            }
                            _xPath[_nameList[0] + "-id"] = urlKeys[_key];
                        }
                    }
                    //parse resource parameters
                    if (resourceParameter.hasOwnProperty(_type)) {
                        for (let i = 0; i < resourceParameter[_type].length; i++) {
                            if (_initKey.hasOwnProperty(resourceParameter[_type][i])) {
                                let _value = _initKey[resourceParameter[_type][i]];
                                let _objType = _value.substring(0, _value.indexOf("-"));
                                let _objId = _value.substring(_value.indexOf("-") + 1);
                                let _keyWhere = {};
                                _keyWhere[_objType] = {
                                    "name": _objId
                                }
                                _initKey[resourceParameter[i]] = getEntityPathByKey(_objType, _keyWhere);
                            }
                        }
                    }
                    let _init = {
                        initKey: _initKey
                    }
                    if (_action == "view") {
                        detailsItem(_type, _init);
                    } else if (_action == "create") {
                        if (getYang("yang").hasOwnProperty(_type)) {
                            _init["initConfigData"] = {
                                "xPathObj": _xPath
                            };
                            createItem(_type, _init);
                        } else if (getYang("rpc").hasOwnProperty(_type)) {
                            editRpcItem(_type, {});
                        }
                    } else if (_action == "edit") {
                        if (getYang("yang").hasOwnProperty(_type)) {
                            editItem(_type, _init);
                        } else if (getYang("rpc").hasOwnProperty(_type)) {
                            let rpcInitData = {};
                            if (!isEmptyObj(_initKey)) {
                                for (let _key in _initKey) {
                                    merge(rpcInitData, _initKey[_key]);
                                }
                            }
                            editRpcItem(_type, {})
                        }
                    } else if (_action == "delete") {
                        if (getYang("yang").hasOwnProperty(_type)) {
                            deleteItem(_type, _init);
                        } else if (getYang("rpc").hasOwnProperty(_type)) {
                            let rpcInitData = {};
                            if (!isEmptyObj(_initKey)) {
                                for (let _key in _initKey) {
                                    merge(rpcInitData, _initKey[_key]);
                                }
                            }
                            let keyStr = rpcInitData[Object.keys(rpcInitData)[0]];
                            if (keyStr == null || keyStr == "") {
                                keyStr = getText("object");
                            }
                            callRpc(_type, {"initData": rpcInitData, "title": keyStr})
                        }
                    }
                }
            }
        }
    }
}

// exports.parseURLEvent = parseURLEvent;
export {parseURLEvent};
