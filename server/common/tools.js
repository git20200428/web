let YANG = null;
const xml2js = require('xml2js');
const Logger = require("./logger");
const Path = require("path");
const fs = require("fs");

const xmlBuilder = new xml2js.Builder({
    xmldec: {
        version: '1.0',
        encoding: 'UTF-8'
    },
    headless: true
});

parseOpts = {
    trim: true,
    explicitArray: false,
    ignoreAttrs: false,
    valueProcessors: [xml2js.processors.parseNumbers],
    attrValueProcessors: [xml2js.processors.parseNumbers]
};

function removeKeyFromJPath(data) {
    for (let i in data) {
        if (data.hasOwnProperty(i) && typeof data[i] !== "object") {
            delete data[i];
        } else {
            removeKeyFromJPath(data[i]);
        }
    }
}

const Utils = {
    RPC_REPLY: "rpc-reply",

    isEmptyObj: function (obj) {
        return (Object.keys(obj).length === 0);
    },

    isObject: function (obj) {
        return ((typeof obj === "object") && !(obj instanceof Array));
    },

    getJsonResponse: function (jsonData, obj) {
        if (jsonData instanceof Array) {
            for (let i = 0; i < jsonData.length; ++i) {
                Utils.getJsonResponse(jsonData[i], obj);
            }
        } else {
            for (let key in jsonData) {
                if (!jsonData.hasOwnProperty(key)) {
                    continue;
                }
                if (typeof (jsonData[key]) === 'object') {
                    Utils.getJsonResponse(jsonData[key], obj);
                } else {
                    obj[key] = jsonData[key];
                }
            }
        }
    },

    removeKeyInJson: function (json, key) {
        for (let i in json) {
            if (!json.hasOwnProperty(i)) {
                continue;
            }
            if (i === key) {
                delete json[i];
            } else if (json[i] instanceof Array) {
                json[i].forEach(element => {
                    Utils.removeKeyInJson(element);
                });
            } else if (json[i] instanceof Object) {
                Utils.removeKeyInJson(json[i]);
            }
        }
    },

    findObjByKey: function (json_data, key_name) {
        if (!json_data) return null;

        if (json_data.hasOwnProperty(key_name)) {
            return json_data[key_name];
        }

        if (Array.isArray(json_data)) {
            let rt = [];
            json_data.forEach(item => {
                let obj = Utils.findObjByKey(item, key_name);
                if (obj) {
                    rt = rt.concat(obj);
                }
            });
            return rt.length > 1 ? rt : (rt.length > 0 ? rt[0] : null);
        }

        for (let val of Object.values(json_data)) {
            if (typeof val == "object") {
                let obj = Utils.findObjByKey(val, key_name);
                if (obj) {
                    return obj;
                }
            }
        }
        return null;
    },

    /**
     * find node as resource indicated in rootNode
     * @param {*} resource
     * @param {*} rootNode
     * @returns
     */
    findResource(resource, rootNode) {
        let name = "";
        let ypath = "";
        let node = rootNode;
        const fragment = resource.matchAll(/\/([\w-]+:)?([\w-]+)((?:\[(?:[^[\]]+\[[^[\]]+])*[^[\]]*])*)/g);
        for (let element of fragment) {
            if (!node.hasOwnProperty(element[2]) && !element[3] && resource.endsWith(element)) {
                return {
                    name: name,
                    node: node,
                    ypath: ypath
                };
            }

            name = element[2];
            ypath = ypath ? (ypath + "." + name) : name;
            if (!node[element[2]]) {
                return {
                    name: name,
                    node: null,
                    parentNode: node,
                    ypath: ypath
                };
            }
            node = node[element[2]];
            let keyList = element[3];
            if (keyList) {
                let keyListArr = keyList.match(/\[(?:[^[\]]+\[[^[\]]+])*[^[\]]*]/g);
                if (keyListArr) {
                    let keyValue = {};
                    for (let item of keyListArr) {
                        let keyArr = item.match(/\[([\w\-]+:)?([\w\-]+)='(.+)'/);
                        if (keyArr) {
                            let key = keyArr[2];
                            keyValue[key] = keyArr[3];
                        } else {
                            Logger.error("findResource > regexp is not match for resource: ", keyArr);
                            return {
                                name: name,
                                node: null,
                                parentNode: node,
                                ypath: ypath
                            }
                        }
                    }
                    let tmp = node;
                    if (Array.isArray(node)) {
                        for (let item of node) {
                            tmp = item;
                            for (let key in keyValue) {
                                if (!item.hasOwnProperty(key) || item[key] !== keyValue[key]) {
                                    tmp = null;
                                    break;
                                }
                            }
                            if (tmp) {
                                break;
                            }
                        }
                    } else {
                        for (let key in keyValue) {
                            if (!node.hasOwnProperty(key) || node[key] !== keyValue[key]) {
                                tmp = null;
                                break;
                            }
                        }
                    }
                    if (!tmp) {
                        return {
                            name: name,
                            node: null,
                            parentNode: node,
                            ypath: ypath
                        }
                    } else {
                        node = tmp;
                    }
                } else {
                    Logger.error("findResource > regexp is not match for resource: ", keyListArr);
                    return {
                        name: name,
                        node: null,
                        parentNode: node,
                        ypath: ypath
                    }
                }
            }
        }

        return {
            name: name,
            node: node,
            ypath: ypath
        }
    },

    deepCopyObject: function (src, dst, tag, filter) {
        let obj = Utils.cloneObject(src, tag, filter[tag]);
        if (!dst[tag]) {
            dst[tag] = obj;
        } else if (dst[tag] instanceof Array) {
            dst[tag].push(obj);
        } else {
            let tmp = dst[tag];
            dst[tag] = [tmp, obj];
        }
        return obj;
    },

    cloneObject: function (src, tag, filter) {
        let obj = {};

        const objYang = Utils.getYangByYPath(filter.ypath);
        for (let key in src) {
            if (!src.hasOwnProperty(key)) continue;
            if (objYang[key] === 'container' || objYang[key] === 'list') {
                if (filter && filter[key]) {
                    if (src[key] instanceof Array) {
                        obj[key] = [];
                        for (let i of src[key]) {
                            Utils.deepCopyObject(i, obj, key, filter);
                        }
                    } else {
                        Utils.deepCopyObject(src[key], obj, key, filter);
                    }
                }
            } else if ((typeof src[key] !== 'object') || (key === 'alarms' && !objYang[key])) {
                obj[key] = src[key];
            } else if (typeof src[key] === 'object') {
                if (!objYang.hasOwnProperty(key)) {
                    Logger.error('Object ', key, ' is unknown for ', tag);
                } else if (objYang[key] && objYang[key]["yangType"] === 'leaf-list') {
                    obj[key] = [];
                    Object.assign(obj[key], src[key]);
                } else {
                    Logger.error('Object ', filter.ypath, "with key", key, "(", JSON.stringify(src[key]), ') has unknown yangType: ', objYang[key]["yangType"]);
                }
            } else {
                Logger.error('Attribute <', key, '> is not handled by cache');
            }
        }
        return obj;
    },

    mergeJSON: function (dst, src, path = null) {
        if (Array.isArray(src)) {
            for (let item of src) {
                Utils.mergeJSON(dst, item, path);
            }
        } else {
            for (let key in src) {
                if (src.hasOwnProperty(key) && dst.hasOwnProperty(key)) {
                    if (typeof dst[key] === "object") {
                        if (Array.isArray(src[key])) {
                            dst[key] = Array.isArray(dst[key]) ? dst[key] : [dst[key]];
                            dst[key] = dst[key].concat(src[key]);
                        } else if (typeof src[key] === "object") {
                            if (path != null) {
                                path += '.' + key;
                                let yang = Utils.getYangByYPath(path);
                                if (Utils.isList(yang.definition ? yang.definition["yangType"] : yang["yangType"])) {
                                    if (Array.isArray(dst[key])) {
                                        dst[key].push(src[key]);
                                    } else {
                                        dst[key] = [dst[key], src[key]];
                                    }
                                } else {
                                    Utils.mergeJSON(dst[key], src[key], path);
                                }
                            } else {
                                Utils.mergeJSON(dst[key], src[key]);
                            }
                        }
                    }
                } else {
                    dst[key] = JSON.parse(JSON.stringify(src[key]));
                }
            }
        }
    },

    isContainer: function (value) {
        return !!value && value === "container";
    },

    isList: function (value) {
        return !!value && value === "list";
    },

    getNCRequestJSONSingle: function (nc_request, web_request, cache_request) {
        //Handle FROM part
        if (!web_request.from) {
            throw ("Error: FROM doesn't exist in request.");
        }
        const mo_name = web_request.from;
        let yangObj = YANG["yang"][mo_name];
        let curObj = JSON.parse(JSON.stringify(yangObj.definition["jpath"]));
        removeKeyFromJPath(curObj);
        let arr = mo_name.split('.');
        let moKey = arr[arr.length - 1];
        let mo = Utils.findObjByKey(curObj, moKey);

        //Handle SELECT part
        let select = web_request.select;
        if (!select) {
            // only get own attributes if contains sub container/list
            let hasSubContainer = false;
            if (!web_request.where) {
                for (let i in yangObj) {
                    if (yangObj.hasOwnProperty(i) && (Utils.isContainer(yangObj[i]) || Utils.isList(yangObj[i]))) {
                        hasSubContainer = true;
                        break;
                    }
                }
            }
            if (web_request.where || hasSubContainer) {
                for (let i in yangObj) {
                    if (yangObj.hasOwnProperty(i) && yangObj[i].type) {
                        mo[i] = '';
                    }
                }
            }
        } else if (select instanceof Array) {
            let s_all = false, s_list = false, s_ctn = false;
            for (let sel of select) {
                if (sel === '*') {
                    s_all = true;
                    // only get own attributes
                    for (let i in yangObj) {
                        if (yangObj.hasOwnProperty(i) && yangObj[i].type) {
                            mo[i] = '';
                        }
                    }
                } else if (Utils.isList(sel)) {
                    s_list = true;
                    // only get list attributes
                    for (let i in yangObj) {
                        if (yangObj.hasOwnProperty(i) && Utils.isList(yangObj[i])) {
                            mo[i] = '';
                        }
                    }
                } else if (Utils.isContainer(sel)) {
                    s_ctn = true;
                    // only get container attributes
                    for (let i in yangObj) {
                        if (yangObj.hasOwnProperty(i) && Utils.isContainer(yangObj[i])) {
                            mo[i] = '';
                        }
                    }
                } else if (yangObj[sel]) {
                    mo[sel] = '';
                } else {
                    throw 'request.select ' + sel + ' is not an attribute of ' + mo_name;
                }
            }

            if (s_all && s_list && s_ctn) {
                for (let i in mo) {
                    if (mo.hasOwnProperty(i)) {
                        delete mo[i];
                    }
                }
            }
        } else {
            throw 'request.select should be arrary';
        }

        //Handle WHERE part
        Utils.handleWhere(web_request.where, curObj, mo, web_request.requestType === "cache");

        if (web_request.requestType === "cache") {
            Utils.mergeJSON(cache_request, curObj, "");
        } else {
            Utils.mergeJSON(nc_request, curObj, "");
        }
    },

    getNCRequestJSON: function (nc_request, web_request, cache_request) {
        if (web_request instanceof Array) {
            for (let req of web_request) {
                Utils.getNCRequestJSONSingle(nc_request, req, cache_request);
            }
        } else if (typeof (web_request) == "object") {
            Utils.getNCRequestJSONSingle(nc_request, web_request, cache_request);
        } else {
            nc_request = null;
        }
    },

    editNCRequestJSON: function (nc_request, web_request) {
        //Handle FROM part
        if (!web_request.from) {
            throw "FROM doesn't exist in request.";
        }

        const mo_name = web_request.from;

        let yangObj = YANG.yang[mo_name];
        let curObj = JSON.parse(JSON.stringify(yangObj.definition.jpath));
        removeKeyFromJPath(curObj);
        Utils.mergeJSON(nc_request, curObj);
        let moKey = mo_name.split('.').pop();
        let mo = Utils.findObjByKey(nc_request, moKey);

        //Handle SET part
        if (web_request.set) {
            if (Array.isArray(web_request.set)) {
                throw 'request.set should not be array';
            }

            for (let i in web_request.set) {
                if (web_request.set.hasOwnProperty(i)) {
                    mo[i] = (Array.isArray(web_request.set[i]) && web_request.set[i].length === 0) ? "" : web_request.set[i];
                }
            }
        }

        //Handle WHERE part
        Utils.handleWhere(web_request.where, nc_request, mo);
    },

    createNCRequestJSON: function (nc_request, web_request) {
        let self = this;

        function getNodeAndValue(item) {
            let o, a;
            if (item instanceof Array) {
                o = mo;
                a = item;
            } else if (Utils.isObject(item)) {
                let key0 = Object.keys(item)[0];
                o = self.findObjByKey(nc_request, key0.split(".").pop());
                a = item[key0];
            }
            return {o, a};
        }

        //Handle INTO part
        if (!web_request.into) {
            throw "INTO doesn't exist in request.";
        }

        const mo_name = web_request.into;
        let yangObj = YANG.yang[mo_name];
        let curObj = JSON.parse(JSON.stringify(yangObj.definition.jpath));
        removeKeyFromJPath(curObj);
        Utils.mergeJSON(nc_request, curObj);
        let moKey = mo_name.split('.').pop();
        let mo = Utils.findObjByKey(nc_request, moKey);
        mo.$ = {operation: "create"};

        //Handle VALUES part
        if (web_request.values) {
            for (let set of web_request.values) {
                let {o, a} = getNodeAndValue.call(this, set);
                if (a instanceof Array) {
                    for (let i of a) {
                        Object.assign(o, i);
                    }
                }
            }
        }
    },

    insertNCRequestJSON: function (nc_request, web_request) {
        //Handle INTO part
        if (!web_request.into) {
            throw ("Error: INTO doesn't exist in request.");
        }
        const mo_name = web_request.into;
        const yangObj = YANG.yang[mo_name];
        let curObj = JSON.parse(JSON.stringify(yangObj.definition.jpath));
        removeKeyFromJPath(curObj);
        Utils.mergeJSON(nc_request, curObj);
        let moKey = mo_name.split('.').pop();
        let mo = Utils.findObjByKey(nc_request, moKey);
        mo.$ = {operation: "create"};

        //Handle VALUES part
        if (web_request.values) {
            for (let i in web_request.values) {
                const vObj = web_request.values[i];
                if (typeof vObj != 'object') {
                    throw "Error： VALUES should contain objects";
                }

                moKey = i.split('.').pop();
                let mo = Utils.findObjByKey(nc_request, moKey);
                if (!mo) {
                    throw ("Error: VALUES contain incorrect instance: " + i);
                }
                for (let j in vObj) {
                    mo[j] = vObj[j];
                }
            }
        }
    },

    deleteNCRequestJSON: function (nc_request, web_request) {
        //Handle FROM part
        if (!web_request.from) {
            throw ("Error: FROM doesn't exist in request.");
        }
        const mo_name = web_request.from;
        const yangObj = YANG.yang[mo_name];
        let curObj = JSON.parse(JSON.stringify(yangObj.definition.jpath));
        removeKeyFromJPath(curObj);
        Utils.mergeJSON(nc_request, curObj);
        let arr = mo_name.split('.');
        let moKey = arr[arr.length - 1];
        let mo = Utils.findObjByKey(nc_request, moKey);
        mo.$ = {operation: "delete"};

        //Handle WHERE part
        Utils.handleWhere(web_request.where, nc_request, mo);
    },

    handleWhere: function (where, dstReq, mo, merge = false) {
        if (where) {
            if (where instanceof Array) {
                throw 'request.where should not be array';
            }

            for (let key in where) {
                let obj = where[key];
                if (typeof obj === 'object') {
                    let o = Utils.findObjByKey(dstReq || mo, key);
                    if (!o) {
                        throw key + ' is not found in from path';
                    }
                    Utils.handleWhere(obj, null, o, merge);
                } else if (mo.hasOwnProperty(key) && !merge) {
                    mo[key] = Array.from([mo[key], obj]);
                } else {
                    mo[key] = obj;
                }
            }
        }
    },

    removeEmptyObject: function (json_data) {
        let need_remove = true;
        for (let val in json_data) {
            if (val === "$") {
                delete json_data[val];
                continue;
            }

            if (!(typeof json_data[val] === "object")) {
                need_remove = false;
            } else {
                if (json_data[val] instanceof Array) {
                    for (let o in json_data[val]) {
                        if (Utils.removeEmptyObject(json_data[val][o])) {
                            Object.assign(json_data[val], json_data[val][o]);
                            delete json_data[val][o];
                        }
                    }
                } else {
                    if (Utils.removeEmptyObject(json_data[val])) {
                        Object.assign(json_data, json_data[val]);
                        delete json_data[val];
                    }
                }
            }
        }
        return need_remove;
    },

    isFunction: function (fun) {
        if (!fun) {
            return false;
        }
        return (typeof fun === "function");
    },

    isNullOrUndefined: function (obj) {
        return obj == null;
    },

    getYang: function () {
        return YANG;
    },

    initYang: function (neType) {
        let filePath = Path.resolve("./config/yang-" + neType + ".json");
        Logger.log("init yang:", filePath);
        YANG = JSON.parse(fs.readFileSync(filePath).toString());
    },

    // Such as: ne.equipment.chassis.slot
    getYangByYPath: function (path) {
        let arr = path.split('.');
        let idx = arr.length;
        let key = arr[--idx];
        while (idx >= 0) {
            let cy = YANG.yang[key];
            if (!cy) cy = YANG.rpc[key];
            if (cy) return cy;

            key = arr[--idx] + '.' + key;
        }
        return null;
    },

    xml2JsonSync: async function (xml) {
        await xml2js.parseStringPromise(xml, parseOpts);
    },

    xml2Json: function (xml, callback) {
        xml2js.parseString(xml, parseOpts, function (err, result) {
            callback(result);
        });
    },

    json2Xml: function (json) {
        return xmlBuilder.buildObject(json);
    },

    editDataFromNetConf: async function (cmd, nc) {
        try {
            //Construct NetConf XML Request
            let nc_request = {};
            Utils.editNCRequestJSON(nc_request, cmd);
            return Utils.rpcEdit(cmd, nc, nc_request);
        } catch (e) {
            return {result: false, message: `Call NetConf failed: ${e}`}
        }
    },

    rpcEdit: async function (cmd, nc, nc_request) {
        if (nc_request) {
            let rootTag = Object.keys(nc_request)[0];
            nc_request[rootTag].$ = {"xmlns": Utils.getRootNamespace(rootTag)};
            let xml = xmlBuilder.buildObject(nc_request);
            let rs = await nc.rpc_edit(xml, cmd.wildcard ? cmd.wildcard : false);
            let err = Utils.getReplyErrorMsg(rs);
            if (err.length > 0) {
                return {result: false, message: err, data: rs["rpc-reply"]["rpc-error"]};
            }
            return {result: true, message: "", data: rs};
        } else {
            return {result: false, message: "Not able to handle request"};
        }
    },

    createDataFromNetConf: async function (cmd, nc) {
        try {
            //Construct NetConf XML Request
            let nc_request = {};
            Utils.createNCRequestJSON(nc_request, cmd);
            return Utils.rpcEdit(cmd, nc, nc_request);
        } catch (e) {
            return {result: false, message: `Call NetConf failed: ${e}`}
        }
    },

    insertDataFromNetConf: async function (cmd, nc) {
        try {
            //Construct NetConf XML Request
            let nc_request = {};
            Utils.insertNCRequestJSON(nc_request, cmd);
            return Utils.rpcEdit(cmd, nc, nc_request);
        } catch (e) {
            return {result: false, message: `Call NetConf failed: ${e}`}
        }
    },

    rpcRequest: async function (rpc, nc) {
        for (let i in rpc) {
            if (!rpc.hasOwnProperty(i)) continue;
            let rpcYang = Utils.getYang().rpc;
            if (!rpcYang.hasOwnProperty(i)) {
                return {result: false, message: `rpc(${i}) is not supported!`, data: ''};
            }
            rpc[i].$ = {};
            rpc[i].$.xmlns = rpcYang[i].definition.namespace;
            let arr = i.split('.');
            if (arr.length > 1) {
                let tmp = rpc[i];
                delete rpc[i];
                rpc[arr[arr.length - 1]] = tmp;
            }
        }
        let xml = xmlBuilder.buildObject(rpc);

        let rs = await nc.rpcXML(xml);
        const RPC_REPLY = 'rpc-reply';
        if (rs && rs[RPC_REPLY]) {
            if (rs[RPC_REPLY]['rpc-error']) {
                const o = rs[RPC_REPLY]['rpc-error'];
                let err = "";
                for (let i in o) {
                    if (o.hasOwnProperty(i)) {
                        err += `${i}: ${JSON.stringify(o[i])}<br>`;
                    }
                }
                return {result: false, message: err, data: rs[RPC_REPLY]['rpc-error']};
            }

            let rtData = rs[RPC_REPLY].data ? rs[RPC_REPLY].data : rs[RPC_REPLY];
            if (rtData.hasOwnProperty('$')) {
                delete rtData['$'];
            }
            return {result: true, message: '', data: rtData};
        }

        return {result: false, message: '', data: 'no data reply'};
    },

    deleteDataFromNetConf: async function (cmd, nc) {
        try {
            //Construct NetConf XML Request
            let nc_request = {};
            Utils.deleteNCRequestJSON(nc_request, cmd);
            if (nc_request) {
                let rootTag = Object.keys(nc_request)[0];
                nc_request[rootTag].$ = {"xmlns": Utils.getRootNamespace(rootTag)};
                let xml = xmlBuilder.buildObject(nc_request);

                let rs = await nc.rpc_edit(xml);
                //Logger.log("NetConf JSON response: ", JSON.stringify(rs));

                if (rs && rs["rpc-reply"] && rs["rpc-reply"]["rpc-error"]) {
                    const o = rs["rpc-reply"]["rpc-error"];
                    let err = "";
                    for (let i in o) {
                        if (o.hasOwnProperty(i)) {
                            err += `${i}: ${JSON.stringify(o[i])}<br>`;
                        }
                    }
                    return {result: false, message: err, data: rs["rpc-reply"]["rpc-error"]};
                }
                return {result: true, message: "", data: rs};
            } else {
                return {result: false, message: "Not able to handle request"};
            }
        } catch (e) {
            return {result: false, message: `Call NetConf failed: ${e}`}
        }
    },

    getDataFromNetConf: async function (nc_request, nc) {
        try {
            //Construct NetConf XML Request
            let rtvalue = {result: true, message: "", data: {}};
            if (Object.keys(nc_request).length > 0) {
                let rootTag = Object.keys(nc_request)[0];
                nc_request[rootTag].$ = {"xmlns": Utils.getRootNamespace(rootTag)};
                let xml = "";
                if (Object.keys(nc_request).length > 1) {
                    for (let i in nc_request) {
                        let ncReq = {};
                        ncReq[i] = nc_request[i];
                        xml += xmlBuilder.buildObject(ncReq);
                    }
                } else {
                    xml = xmlBuilder.buildObject(nc_request);
                }
                let rs = await nc.rpc_get(xml);
                //  Logger.log("NetConf XML response: \n", JSON.stringify(rs));
                if (rs) {
                    if (rs["rpc-reply"] && rs["rpc-reply"]["rpc-error"]) {
                        const o = rs["rpc-reply"]["rpc-error"];
                        let err = "";
                        for (let i in o) {
                            if (o.hasOwnProperty(i)) {
                                err += `${i}: ${JSON.stringify(o[i])}<br>`;
                            }
                        }
                        rtvalue.message += err;
                        rtvalue.result = false;
                    } else {
                        Object.assign(rtvalue.data, rs.hasOwnProperty("rpc-reply") ? rs["rpc-reply"].data : rs);
                    }
                }
            }
            return rtvalue;
        } catch (e) {
            return {result: false, message: `Call NetConf failed: ${e.stack ? e.stack : e.message}`}
        }
    },

    getRootNamespace: function (nodeName) {
        let yang = YANG ? YANG.yang[nodeName] : null;
        let defaultNamespace = "http://infinera.com/yang/ioa/ne";
        return (yang && yang.definition) ? yang.definition.namespace : defaultNamespace;
    },

    getReplyErrorMsg: function (rs) {
        if (rs && rs["rpc-reply"] && rs["rpc-reply"]["rpc-error"]) {
            const o = rs["rpc-reply"]["rpc-error"];
            let err = "";
            for (let i in o) {
                if (o.hasOwnProperty(i)) {
                    err += `${i}: ${JSON.stringify(o[i])}<br>`;
                }
            }
            return err;
        }

        return "";
    }
};

module.exports = Utils;
