const Config = require('../common/config');
const ALARM_ROOT = 'alarm';
const AlarmStatus_Cleared = 'cleared';
const Logger = require('../common/logger');

const AttrOperation = '@operation';
const OLD_VALUE = '@old-value';

const {isNullOrUndefined, getYangByYPath, deepCopyObject, cloneObject, findResource} = require('../common/tools');

module.exports = {
    updateCacheData: function (src, dst) {
        if (!dst) return;

        for (let i in src) {
            if (!src.hasOwnProperty(i)) continue;
            updateData(src[i], dst, i);
        }

        function updateData(src, parentDst, path) {
            if (Array.isArray(src)) {
                src.forEach(item => {
                    updateData(item, parentDst, path);
                });
                return;
            }

            if (!parentDst) return;

            let arr = path.split('.');
            let tag = arr[arr.length - 1];
            let yang = getYangByYPath(path);
            let yangType = yang ? (yang.definition ? yang.definition.yangType : yang.yangType) : "";
            if (!parentDst[tag]) {
                if (yangType === 'container') {
                    parentDst[tag] = {};
                } else if (yangType === "list") {
                    parentDst[tag] = [];
                } else {
                    return;
                }
            }
            let dst = parentDst[tag];
            let ddst = null;
            if (yangType === "list") {
                ddst = findObj(dst, yang.definition.key, src);
            }
            for (let i in src) {
                if (!src.hasOwnProperty(i)) continue;
                // !!! DO NOT CHANGE THE ORDER
                if (yang && yang[i] && yang[i].yangType === "leaf-list") {
                    ddst = ddst ? ddst : dst;
                    ddst[i] = Array.isArray(src[i]) ? src[i].filter(ele => {
                        return !ele.hasOwnProperty(AttrOperation);
                    }) : (src[i].hasOwnProperty(AttrOperation) ? [] : src[i]);
                    if (Array.isArray(ddst[i]) && ddst[i].length === 0) {
                        delete ddst[i];
                    }
                } else if (i === AttrOperation) {
                    updateOperationData(src, parentDst, tag, yang);
                    break;
                } else if (i === OLD_VALUE) {
                    let ret = ddst ? ddst : dst;
                    ret[i] = src[i].text ? src[i].text : "";
                } else if (src[i].hasOwnProperty(AttrOperation)) {
                    updateOperationData(src[i], ddst ? ddst : dst, i, getYangByYPath(path + "." + i) || yang);
                } else if (src[i].hasOwnProperty(OLD_VALUE)) {
                    let ret = ddst ? ddst : dst;
                    ret[i] = src[i].text ? src[i].text : "";
                } else if (typeof src[i] === "object") {
                    updateData(src[i], ddst ? ddst : dst, path + "." + i);
                }
            }

            if (parentDst && parentDst.hasOwnProperty(tag) && (typeof parentDst[tag] === "object") && Object.keys(parentDst[tag]).length === 0) {
                delete parentDst[tag];
            }
        }

        function updateOperationData(src, parentDst, tag, yang) {
            if (!parentDst) {
                Logger.error(`operation is not supported on ${tag}: ${JSON.stringify(src)}`);
                return;
            }
            if (src[AttrOperation] === "create") {
                let tmp = JSON.stringify(src);
                let data = JSON.parse(tmp.replace(/"@operation":"create",/g, ""));
                if (!parentDst[tag]) {
                    parentDst[tag] = yang[tag] === "list" ? [data] : data;
                } else if (parentDst[tag] instanceof Array) {
                    parentDst[tag].push(data);
                } else {
                    parentDst[tag] = [parentDst[tag], data];
                }
            } else if (src[AttrOperation] === 'delete') {
                if (!parentDst[tag]) {
                    return;
                }

                if (!yang) {
                    Logger.error("not find yang obj");
                    return;
                }

                if (Array.isArray(parentDst[tag])) {
                    for (let i = 0; i < parentDst[tag].length; ++i) {
                        let dst = parentDst[tag][i];
                        if (findObj(dst, yang.definition.key, src)) {
                            parentDst[tag].splice(i, 1);
                        }
                    }
                } else if (!yang.hasOwnProperty(tag) && yang.definition.key) {
                    if (findObj(parentDst[tag], yang.definition.key, src)) {
                        delete parentDst[tag];
                    }
                } else {
                    delete parentDst[tag];
                }
            } else if (src[AttrOperation] === "replace") {
                if (!parentDst.hasOwnProperty(tag)) {
                    Logger.error(`operation="replace" for ${tag} is not possible for non-exist object: ${JSON.stringify(parentDst)}`);
                } else if (yang) {
                    let dst = JSON.parse(JSON.stringify(src).replace(/"@operation":"replace",/g, ""));
                    let keyList = yang.definition.key.split(" ");
                    if (Array.isArray(parentDst[tag])) {
                        for (let i = 0; i < parentDst[tag].length;) {
                            if (findIt(parentDst[tag][i], keyList, src)) {
                                parentDst[tag].splice(i, 1);
                            } else {
                                ++i;
                            }
                        }
                        parentDst[tag].push(dst);
                    } else if (findIt(parentDst[tag], keyList, src)) {
                        parentDst[tag] = dst;
                    }
                } else {
                    Logger.warning("not hanlded db-change: ", JSON.stringify(src));
                }
            } else {
                Logger.warning("not hanlded db-change: ", JSON.stringify(src));
            }
        }

        function findIt(obj, keyList, keyValues) {
            for (let key of keyList) {
                if (!obj.hasOwnProperty(key) || obj[key] !== keyValues[key]) {
                    return false;
                }
            }
            return true;
        }

        function findObj(obj, key, keyValues) {
            if (!key) return null;
            let keyList = key.split(" ");
            if (Array.isArray(obj)) {
                for (let item of obj) {
                    if (findIt(item, keyList, keyValues)) {
                        return item;
                    }
                }
            } else if (findIt(obj, keyList, keyValues)) {
                return obj;
            }
            return null;
        }
    },

    /**
     *
     * @param {*} node
     * @param {*} path should sperate the path with '.', like "ne.equipment.card"
     * @param {*} key
     * @param {*} value
     */
    findNode(node, path, key, value) {
        if (!path) {
            return null;
        }

        let retObj = [];
        let pathArray = path.split('.');
        _findNode(node, pathArray, retObj, key, value, false);
        return retObj.length > 0 ? (retObj.length === 1 ? retObj[0] : retObj) : null;

        function _findNode2(node, retArr, key, value, deepin) {
            if (node instanceof Array) {
                for (let tmp of node) {
                    if (isNullOrUndefined(key)) {
                        retArr.push(tmp);
                    } else if (tmp[key] === value) {
                        retArr.push(tmp);
                    } else if (deepin) {
                        for (let i in tmp) {
                            if (tmp.hasOwnProperty(i) && typeof tmp[i] == 'object') {
                                _findNode2(tmp[i], retArr, key, value, deepin);
                            }
                        }
                    }
                }
            } else if (isNullOrUndefined(key)) {
                retArr.push(node);
            } else if (Array.isArray(node[key])) {
                node[key].map(item => {
                    if (item === value) {
                        retArr.push(node);
                    }
                });
            } else if (node[key] === value) {
                retArr.push(node);
            }
        }

        function _findNode(node, pathArray, retArr, key, value, deepin) {
            if (!node) return;
            if (pathArray[0] === '$') {
                pathArray = pathArray.slice(1);
                deepin = true;
            }

            if (pathArray.length === 0) {
                _findNode2(node, retArr, key, value, deepin);
            } else {
                let cp = pathArray[0];
                if (node instanceof Array) {
                    let nextPath = pathArray.slice(1);
                    for (let tmp of node) {
                        _findNode(tmp[cp], nextPath, retArr, key, value, deepin);
                    }
                } else if (!node[cp]) {
                    if (deepin) {
                        for (let i in node) {
                            if (node.hasOwnProperty(i) && typeof node[i] === 'object') {
                                _findNode(node[i], pathArray, retArr, key, value, deepin);
                            }
                        }
                    }
                } else {
                    _findNode(node[cp], pathArray.slice(1), retArr, key, value, deepin);
                }
            }
        }
    },

    generateTree(configRule, gxNe) {
        const root = gxNe;
        let tree = {};
        let self = this;
        makeTree(configRule);
        handleSkipWhen(configRule, tree);

        return tree;

        function handleSkipWhen(filter, node) {
            if (Array.isArray(node)) {
                for (let item of node) {
                    handleSkipWhen(filter, item);
                }
                return;
            }
            for (let i in filter) {
                if (!filter.hasOwnProperty(i) || typeof filter[i] !== 'object' || !node.hasOwnProperty(i)) continue;

                if (filter[i].hasOwnProperty("skipWhen")) {
                    if (Array.isArray(node[i])) {
                        for (let j = node[i].length - 1; j >= 0; --j) {
                            if (node[i][j][filter[i]["skipWhen"]]) {
                                node[i].splice(j, 1);
                            } else {
                                handleSkipWhen(filter[i], node[i]);
                            }
                        }
                    } else if (node[i][filter[i]["skipWhen"]]) {
                        delete node[i];
                    } else {
                        handleSkipWhen(filter[i], node[i]);
                    }
                } else {
                    handleSkipWhen(filter[i], node[i]);
                }
            }
        }

        function makeTree(filter) {
            for (let i in filter) {
                if (!filter.hasOwnProperty(i) || typeof filter[i] !== 'object') continue;

                if (filter[i].hasOwnProperty('refAkey')) {
                    const srcObj = self.findNode(root, filter[i].ypath, null, null);
                    if (!srcObj) continue;

                    if (srcObj instanceof Array) {
                        for (let j of srcObj) {
                            makeRefTree(j, i, filter);
                        }
                    } else {
                        makeRefTree(srcObj, i, filter);
                    }
                } else if (!filter[i].hasOwnProperty("nochange") && filter[i].hasOwnProperty("type")) {
                    let path = filter[i].ypath;
                    const srcObj = self.findNode(root, path, null, null);
                    if (!srcObj) continue;

                    let dstObj = self.findNode(tree, filter.tpath, null, null);
                    dstObj = dstObj ? dstObj : tree;

                    if (srcObj instanceof Array) {
                        for (let j of srcObj) {
                            deepCopyObject(j, dstObj, i, filter);
                        }
                    } else {
                        deepCopyObject(srcObj, dstObj, i, filter);
                    }
                }

                if (filter[i].hasOwnProperty("type")) {
                    makeTree(filter[i]);
                }
            }
        }

        function makeRefTree(src, tag, filter) {
            let node = tree;
            let refArr = filter[tag].refZkey.split(' ');
            let keyArr = filter[tag].refAkey.split(' ');

            let refKey = '';
            for (let k in refArr) {
                if (refArr.hasOwnProperty(k)) {
                    let idx = refArr[k].lastIndexOf('.');
                    refKey = refArr[k].substr(idx + 1);
                    let path = refArr[k].substr(0, idx);
                    if (k > 0) {
                        let preIdx = refArr[k - 1].lastIndexOf('.');
                        path = path.replace(refArr[k - 1].substr(0, preIdx + 1), '');
                    }

                    let refValue = src[keyArr[k]];
                    node = self.findNode(node, path, refKey, refValue);
                }
            }

            if (!node) {
                return;
            }

            // find node by match key
            if (Array.isArray(node)) {
                if (!filter[tag].hasOwnProperty("refMatch")) return;

                let matchKey = filter[tag]["refMatch"];
                let found = null;
                for (let item of node) {
                    for (let key of matchKey) {
                        if (!item.hasOwnProperty(key.Zkey) || !src.hasOwnProperty(key.Akey)) continue;
                        if (!src[key.Akey].match(item[key.Zkey])) continue;
                        found = item;
                    }
                    if (found) break;
                }

                if (!found) return;
                node = found;
            }

            let obj = cloneObject(src, tag, filter[tag]);
            if (node[tag]) {
                if (Array.isArray(node[tag])) {
                    node[tag].push(obj);
                } else {
                    node[tag] = [node[tag], obj];
                }
            } else {
                node[tag] = obj;
            }

            if (filter[tag].hasOwnProperty("children")) {
                let childrenKey = filter[tag].children;
                findChildren(obj, childrenKey);
            }
        }

        function findChildren(dst, childrenKey) {
            let resource = dst[childrenKey];
            if (resource) {
                if (Array.isArray(resource)) {
                    for (let item of resource) {
                        findChild(dst, item, childrenKey);
                    }
                } else {
                    findChild(dst, resource, childrenKey);
                }
            }
        }

        function findChild(dst, resource, childrenKey) {
            let findNode = findResource(resource, root);
            if (findNode.node) {
                let key = findNode.name;
                let filter = {
                    ypath: findNode.ypath
                }
                let obj = cloneObject(findNode.node, key, filter);
                if (dst[key]) {
                    if (Array.isArray(dst[key])) {
                        dst[key].push(obj);
                    } else {
                        dst[key] = [dst[key], obj];
                    }
                } else {
                    dst[key] = obj;
                }
                findChildren(obj, childrenKey);
            }
        }
    },

    /**
     *
     * @param node
     * @param parentValue
     * @param deepin If true, calculate children; if no, only calculate if self, default value is true
     */
    generateStatistic(node, parentValue, deepin = true) {
        if (!node) return;

        function initStatus(dt) {
            dt.statusCount || (dt.statusCount = {});
            Config.equipmentState.map(st => {
                dt.statusCount[st] = dt.statusCount[st] ? dt.statusCount[st] : 0;
            });

            dt.alarmCount || (dt.alarmCount = {});
            Config.AlarmConfig.AlarmSeverityValues.map(svty => {
                dt.alarmCount[svty] = dt.alarmCount[svty] ? dt.alarmCount[svty] : 0;
            });
        }

        /***
         *
         *   | admin-state | WebGUI State
         * ----------------------------------------------------
         *   | lock        | Lock
         *   | maintenance | Maintenance
         *   | unlock      | [oper-state]
         *   | -           | [oper-state]
         * ----------------------------------------------------
         */
        function calculateStatus(node, retValue) {
            initStatus(retValue);

            if (node.hasOwnProperty(Config.operState)) {
                if (node[Config.adminState] === 'maintenance' || node[Config.adminState] === 'lock') {
                    retValue.statusCount[node[Config.adminState]] += 1;
                } else {
                    retValue.statusCount[node[Config.operState]] += 1;
                }
            }

            if (node.alarms) {
                for (let i of node.alarms) {
                    let srt = i[Config.AlarmConfig.AlarmSeverity];
                    retValue.alarmCount[srt] += 1;
                }
            }
        }

        let ret = {};
        calculateStatus(node, ret);
        Object.keys(node).map(key => {
            if (typeof node[key] === 'object' && deepin) {
                if (Array.isArray(node[key])) {
                    node[key].map(subnode => {
                        this.generateStatistic(subnode, ret);
                    })
                } else {
                    this.generateStatistic(node[key], ret);
                }
            }
        });

        if (parentValue) {
            Config.equipmentState.map(st => {
                parentValue.statusCount[st] += ret.statusCount[st];
            })

            Config.AlarmConfig.AlarmSeverityValues.map(aps => {
                parentValue.alarmCount[aps] += ret.alarmCount[aps];
            });
        }

        return ret;
    },

    findAlarmRoot(alarmObj) {
        for (let key in alarmObj) {
            if (key === ALARM_ROOT) {
                return alarmObj;
            } else if (alarmObj.hasOwnProperty(key) && typeof alarmObj[key] === 'object') {
                let obj = this.findAlarmRoot(alarmObj[key]);
                if (obj) {
                    return obj;
                }
            }
        }

        return null;
    },

    updateAlarm(data, alarms) {
        if (!alarms) {
            return;
        }
        let curAlarms = alarms[ALARM_ROOT];
        if (data[Config.AlarmConfig.AlarmSeverity] === AlarmStatus_Cleared) {
            if (!curAlarms) return;

            if (Array.isArray(curAlarms)) {
                for (let i in curAlarms) {
                    if (curAlarms[i][Config.AlarmConfig.AlarmID] === data[Config.AlarmConfig.AlarmID]) {
                        curAlarms.splice(i, 1);
                    }
                }
            } else if (data[Config.AlarmConfig.AlarmID] === curAlarms[Config.AlarmConfig.AlarmID]) {
                alarms[ALARM_ROOT] = [];
            }
        } else if (!curAlarms) {
            alarms[ALARM_ROOT] = [data];
        } else if (Array.isArray(curAlarms)) {
            curAlarms.push(data);
        } else {
            alarms[ALARM_ROOT] = [curAlarms, data];
        }
    },

    concatAlarmsToModel(alarms, model) {
        let alarmRoot = this.findAlarmRoot(alarms);
        if (!alarmRoot) return;

        let alarmArray = alarmRoot[ALARM_ROOT];
        if (!alarmArray) {
            return null;
        }
        if (alarmArray instanceof Array) {
            for (let value of alarmArray) {
                this.concatAlarmToModel(value, model);
            }
        } else {
            this.concatAlarmToModel(alarmArray, model);
        }
    },

    /**
     *
     * @param {*} alarm Single alarm
     * @param {*} model The same model with yang definition
     */
    concatAlarmToModel(alarm, model) {
        let fr = findResource(alarm.resource, model);
        let node = fr.node ? fr.node : fr.parentNode;
        if (!node) {
            Logger.error("not found alarm resource: ", alarm.resource);
            return;
        }
        node.alarms = node.alarms ? node.alarms : [];
        if (alarm[Config.AlarmConfig.AlarmSeverity] === 'cleared') {
            for (let i in node.alarms) {
                if (alarm[Config.AlarmConfig.AlarmID] === node.alarms[i][Config.AlarmConfig.AlarmID]) {
                    node.alarms.splice(i, 1);
                }
            }
        } else {
            node.alarms.push(alarm);
        }
    },
};