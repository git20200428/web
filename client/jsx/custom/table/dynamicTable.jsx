import React from 'react';
import {connect} from "react-redux";
import {ReactTable, TableFilterTypeEnum} from "./react_table";
import {ExpandType, ReactTreeTable} from "./treetable";
import TABLECONFIG, {tableType} from "../../tableConfig";
import {getPathKey, getRpcConfig, getYangConfig, SpecificParameter} from "../../yangMapping";
import {
    callRpc,
    createItem,
    deleteItem,
    detailsItem,
    editItem,
    refreshTableType,
    relateTable
} from "../comm/react_common";
import {collapseBtnFormatter4ReactTable, upDownFormatter4ReactTable} from "../../configuration/config_util";
import CommonControl from "../comm/index";
import {
    checkUserClass,
    convertToArray,
    deepClone,
    EditBtnState,
    extendCustomConfig,
    getEntityPathByKey,
    getRelateTableKeys,
    getText,
    getYang,
    hashCode,
    isEmptyObj,
    isFunction,
    isNullOrUndefined,
    merge,
    parseColonValues,
    requestData,
    resource2KeyName,
    showAlertDialog,
    USER_CLASS_TYPE
} from "../utils";
import {EventTypeEnum} from "../message_util";
import {DialogType} from "../../components/modal/modal";
import PageInfo from "./pageinfo";

let ReactSwitchButton = CommonControl.ReactSwitchButton;
let ReactSelectEdit = CommonControl.ReactSelectEdit;

let createDynamicTable = function (type, showPanelConfig, tableTypes) {
    let htmlList = [];
    if (type == null && showPanelConfig != null && showPanelConfig.hasOwnProperty("showConfig")) {
        type = showPanelConfig["showConfig"]["type"];
        htmlList.push(createTable(type, type, showPanelConfig));
        return htmlList;
    }
    if (tableTypes != null) {
        for (let i = 0; i < tableTypes.length; i++) {
            let checkUserYangType = tableTypes[i];
            if (TABLECONFIG[tableTypes[i]] != null && TABLECONFIG[tableTypes[i]]["extendsType"] != null) {
                checkUserYangType = TABLECONFIG[tableTypes[i]]["extendsType"];
            }
            let _yang = getYangConfig(checkUserYangType);
            if (isEmptyObj(_yang)) {
                _yang = getRpcConfig(checkUserYangType);
            }
            if (checkUserClass(_yang, USER_CLASS_TYPE.read)) {
                htmlList.push(createTable(tableTypes[i], type, showPanelConfig));
            } else {
                htmlList.push(getText("permission_denied"));
            }
        }
    } else {
        return null;
    }
    return htmlList;
}

let createTable = function (configKey, type, showPanelConfig) {
    let _config = TABLECONFIG[configKey];
    let tableId = "react-" + configKey + "-table";
    if (showPanelConfig != null && showPanelConfig.showConfig != null) {   // get table ID;
        if (showPanelConfig.showConfig.AID != null) {
            tableId += "-" + showPanelConfig.showConfig.AID;
        } else if (showPanelConfig.showConfig.key != null) {
            for (let _key1 in showPanelConfig.showConfig.key) {
                let p1 = showPanelConfig.showConfig.key[_key1];
                if (p1 != null && typeof p1 != "string") {
                    for (let _key2 in p1) {
                        tableId += "-" + p1[_key2];
                    }
                }
            }
        }
    }
    let tableHashCode = hashCode(tableId);
    if (_config == null || !_config.hasOwnProperty("tableType")
        || (_config.hasOwnProperty("tableType") && (_config["tableType"] == "minTable" ||
            _config["tableType"] == tableType.minTable || _config["tableType"] == tableType.pageTable))) {

        return createNormalTable(configKey, _config, showPanelConfig, tableHashCode)
    }
    if (_config != null && _config.hasOwnProperty("tableType")) {
        if (_config["tableType"] == tableType.treeTable) {
            return createTreeTable(_config, showPanelConfig, tableHashCode);
        }
        if (_config["tableType"] == tableType.view) {
            return createView(configKey, _config, showPanelConfig, tableHashCode)
        }
        if (_config["tableType"] == tableType.userdefine) {
            return createUserDefineView(configKey, _config, showPanelConfig, tableHashCode)
        }
    }
    console.error("Table type is error, please check the TableConfig.js!")
}

let createUserDefineView = function (configKey, _config, showPanelConfig, tableHashCode) {
    let selectKeys = null;
    let requestKey = null;
    let buttons = {};
    let _initData = null;
    let tableConfig = null;

    if (_config != null && _config.hasOwnProperty("extendsType")) {
        configKey = _config["extendsType"];
    }

    if (showPanelConfig.hasOwnProperty("showConfig")) {
        requestKey = showPanelConfig["showConfig"]["key"];
        selectKeys = showPanelConfig["showConfig"]["select"];
        if (showPanelConfig["showConfig"].hasOwnProperty("buttons")) {
            buttons = extendCustomConfig(buttons, showPanelConfig["showConfig"]["buttons"]);
        }
        if (showPanelConfig["showConfig"].hasOwnProperty("data")) {
            _initData = showPanelConfig["showConfig"]["data"];
        }
    }
    if (_config != null && _config.hasOwnProperty("tableConfig")) {
        tableConfig = _config.tableConfig(tableHashCode);
        tableConfig.tableKey = tableHashCode;
    }

    if (_config.hasOwnProperty("viewClass")) {
        let viewClass = _config.viewClass(tableHashCode);
        if (isFunction(viewClass.tableHead)) {
            viewClass.tableHead = viewClass.tableHead(_config);
        }
        margeConfig(tableConfig, viewClass);
    }

    if (_config.hasOwnProperty("columnSort")) {
        let _sortList = _config["columnSort"];
        let _heads = tableConfig["tableHead"];
        let newHeads = {};

        for (let i = 0; i < _sortList.length; i++) {
            if (_heads.hasOwnProperty(_sortList[i])) {
                newHeads[_sortList[i]] = _heads[_sortList[i]];
                delete _heads[_sortList[i]];
            }
        }
        merge(newHeads, _heads);
        tableConfig["tableHead"] = newHeads;
    }

    let _request = {};
    if (selectKeys != null) {
        _request["select"] = selectKeys
    }
    if (configKey != null) {
        _request["from"] = configKey
    }
    if (requestKey != null) {
        if (_config.initRequestFilter != null) {
            requestKey = extendCustomConfig(requestKey, _config.initRequestFilter)
        }
        _request["where"] = requestKey;
    }
    let requestFun = null;
    if (_initData != null) {
        requestFun = function (filter, callback) {
            callback(convertToArray(_initData));
        }
    } else if (tableConfig.hasOwnProperty("expandConfig") && tableConfig["expandConfig"].hasOwnProperty("getDataFun")) {
        requestFun = function (filter, callback) {
            tableConfig["expandConfig"]["getDataFun"](_request, this, filter, {tableConfig: _config}, callback);
        }
    } else {
        requestFun = refreshDataFun(_request);
    }

    return <ReactTable key={"table" + tableHashCode} tableName={getText(_config.title)}
                       hashCode={tableHashCode} id={"table_id_" + tableHashCode}
                       tableInfo={getRequestKeys(_request, _config, showPanelConfig)} tableTitle={_config.title}
                       getDataFun={requestFun} tableData={initDataFun(_request)}
                       tableDivClass="minHeight100" noButtons={buttons.noButtons}
                       tableConfig={tableConfig}/>

}

let createView = function (configKey, _config, showPanelConfig, tableHashCode) {
    if (_config.viewClass == null) {
        return "Please set table view!";
    } else {
        let yangConfig = {};
        if (_config.hasOwnProperty("commandType") && _config["commandType"] == "rpc") {
            yangConfig["config"] = getRpcConfig(configKey);
            yangConfig["key"] = configKey
        }
        return _config.viewClass(_config, showPanelConfig, tableHashCode, yangConfig);
    }
}

let createNormalTable = function (configKey, _config, showPanelConfig, tableHashCode) {
    let selectKeys = null;
    let requestKey = null;
    let buttons = {};
    let _initData = null;
    let isRelateTable = false;
    //used for related table
    if (_config != null && _config.hasOwnProperty("extendsType")) {
        configKey = _config["extendsType"];
    }
    if (showPanelConfig != null && showPanelConfig.hasOwnProperty("showConfig")) {
        requestKey = showPanelConfig["showConfig"]["key"];
        selectKeys = showPanelConfig["showConfig"]["select"];
        if (showPanelConfig["showConfig"].hasOwnProperty("buttons")) {
            buttons = extendCustomConfig(buttons, showPanelConfig["showConfig"]["buttons"]);
        }

        if (showPanelConfig["showConfig"].hasOwnProperty("data")) {
            _initData = showPanelConfig["showConfig"]["data"];
        }

        if (showPanelConfig["showConfig"].hasOwnProperty("isRelateTable")) {
            isRelateTable = showPanelConfig["showConfig"]["isRelateTable"];
        }
    }
    let originalYang = getYang("yang")[configKey];
    let keyWords = getPathKey(configKey);
    let _entity = getYangConfig(configKey);
    if (_config == null) {
        _config = {
            "title": getText(configKey)
        }
    }
    if (_entity == null) {
        return "can't find config!"
    }
    if (!checkUserClass(_entity, USER_CLASS_TYPE.read)) {
        return getText("permission_denied");
    }
    let writeRole = checkUserClass(_entity, USER_CLASS_TYPE.write)
    let showCol = {};
    let tableHead = {};
    let allTableHead = {};   //for export all data
    let _keyList = [];
    if (isRelateTable && _config["relateTableColumns"]) {
        _keyList = _config["relateTableColumns"]
    } else if (_config["include"] != null) {
        _keyList = _config["include"]
    } else {
        for (let _key in _entity) {
            if (SpecificParameter.indexOf(_key) < 0 && _entity[_key].hasOwnProperty("type")) {
                if (_entity[_key]["password"] != null && _entity[_key]["password"] == "true") {
                    continue;
                }
                if (keyWords[configKey] != null && keyWords[configKey].indexOf(_key) > -1) {
                    _keyList.unshift(_key);
                } else {
                    _keyList.push(_key);
                }
            }
        }
    }
    if (_config.hasOwnProperty("additionColumn")) {
        _keyList = _keyList.concat(_config.additionColumn)
    }
    for (let i = 0; i < _keyList.length; i++) {
        let _key = _keyList[i];
        if (_config["filterConfig"] != null && _config["filterConfig"][_key] != null) {
            showCol[_key] = {control_Type: _config["filterConfig"][_key].control_Type};
        } else {
            showCol[_key] = {control_Type: TableFilterTypeEnum.Select};
        }
        if (_entity.hasOwnProperty(_key)) {
            let _label = getText(_entity[_key].label);
            if (_entity[_key].hasOwnProperty("units")) {
                _label += "(" + _entity[_key]["units"] + ")"
            }
            allTableHead[_key] = {
                label: _label,
                description: _key.description
            }
        }
        if (SpecificParameter.indexOf(_key) > -1) {
            continue;
        }
        if (_config["exclude"] != null && _config["exclude"].indexOf(_key) > -1) {
            continue;
        }
        if (_config["include"] != null && _config["include"].indexOf(_key) < 0) {
            continue;
        }
        if (_entity.hasOwnProperty(_key)) {
            let _label = getText(_entity[_key].label);
            if (_entity[_key].hasOwnProperty("units")) {
                _label += "(" + _entity[_key]["units"] + ")"
            }
            tableHead[_key] = {
                label: _label,
                description: (_entity[_key].description != null ? _entity[_key].description : _label)
            }
            if (_entity[_key].hasOwnProperty("cellDataFun")) {
                tableHead[_key]["cellDataFun"] = _entity[_key]["cellDataFun"];
            } else if (_config["formatColumns"] != null && _config["formatColumns"].hasOwnProperty(_key)) {
                tableHead[_key]["cellDataFun"] = _config["formatColumns"][_key](configKey, tableHashCode);
            } else if (_entity[_key].yangOriginaType != null && _entity[_key].yangOriginaType == "boolean") {
                if ((_entity[_key].hasOwnProperty("set-on-create-only") && _entity[_key]["set-on-create-only"] == "true")
                    || (_entity[_key].hasOwnProperty("config") && (_entity[_key]["config"] == "false" || _entity[_key]["config"] == false))) {
                    tableHead[_key]["cellDataFun"] = upDownFormatter4ReactTable(tableHashCode);
                } else {
                    if (writeRole) {
                        tableHead[_key]["cellDataFun"] = upDownCheckFormatter(configKey, requestKey, tableHashCode);
                    } else {
                        tableHead[_key]["cellDataFun"] = upDownFormatter4ReactTable(tableHashCode);
                    }
                }
            }
        } else {
            tableHead[_key] = {
                label: getText(_key),
                description: getText(_key)
            }
        }
    }
    let tableConfig = {
        autoCreateIdCol: {
            show: true,
            label: " "
        },
        eachColFilter: {
            show: true,
            showCol: showCol
        },
        tableHead: tableHead,
        allTableHead: allTableHead,
        tableKey: tableHashCode,
        isRelateTable: isRelateTable,
        description: (_entity.definition != null && _entity.definition.description != null ? _entity.definition.description : _config.title)
    };

    if (_config.hasOwnProperty("buttons")) {
        buttons = extendCustomConfig(buttons, _config.buttons)
    }

    if (!buttons.hasOwnProperty("noRowButtons") || !buttons["noRowButtons"]) {
        let rowsBts = [];
        let addEditButton = false;
        if (!buttons.hasOwnProperty("rowButtons")
            || !buttons["rowButtons"].hasOwnProperty("edit")
            || (buttons["rowButtons"].hasOwnProperty("edit") && buttons["rowButtons"]["edit"]["enabled"])) {
            if (originalYang != null && originalYang["definition"] != null && ((originalYang["definition"].hasOwnProperty("config")
                && originalYang["definition"]["config"] == "false"))) {
                //no edit bt.
            } else if (writeRole) {
                addEditButton = true;
                rowsBts.push(
                    {
                        label: getText("edit"),
                        enabled: function (data) {
                            return EditBtnState.Normal;
                        },
                        clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                            editFun(_entity, configKey, keyWords, data[0], tableHashCode, paramObj, event, _config,
                                requestKey, showPanelConfig.showConfig != null ? showPanelConfig.showConfig.parentData : null);
                        },
                        buttonClass: {
                            normal: "row_edit_e",
                            disabled: "row_edit_e_disabled"
                        }
                    }
                )
            }
        }

        if (!addEditButton && (
            !buttons.hasOwnProperty("rowButtons")
            || !buttons["rowButtons"].hasOwnProperty("details")
            || (buttons["rowButtons"].hasOwnProperty("details") && buttons["rowButtons"]["details"]["enabled"])
        )) {
            rowsBts.push(
                {
                    label: getText("detail"),
                    enabled: function (data) {
                        return EditBtnState.Normal;
                    },
                    clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                        detailsFun(_entity, configKey, keyWords, data[0], tableHashCode, paramObj, event, _config, requestKey);
                    },
                    buttonClass: {
                        normal: "row_edit_d",
                        disabled: "row_edit_d_disabled"
                    }
                }
            )
        }

        if (!buttons.hasOwnProperty("rowButtons")
            || !buttons["rowButtons"].hasOwnProperty("delete")
            || (buttons["rowButtons"].hasOwnProperty("delete") && buttons["rowButtons"]["delete"]["enabled"])) {
            if (originalYang != null && originalYang["definition"] != null && ((originalYang["definition"].hasOwnProperty("config")
                && originalYang["definition"]["config"] == "false")
                || (originalYang["definition"].hasOwnProperty("system-managed") || originalYang["definition"]["system-managed"] == "true"))) {
                //no edit bt.
            } else {
                rowsBts.push(
                    {
                        label: getText("delete"),
                        enabled: function (data) {
                            return writeRole ? EditBtnState.Normal : EditBtnState.Disabled;
                        },
                        clickFunction: function (data, event) {
                            deleteFun(_entity, configKey, keyWords, data[0], tableHashCode, event, _config.title, requestKey);
                        },
                        buttonClass: {
                            normal: "row_delete",
                            disabled: "row_delete_disabled"
                        }
                    }
                )
            }
        }
        if (!buttons.hasOwnProperty("rowButtons")
            || !buttons["rowButtons"].hasOwnProperty("default")
            || (buttons["rowButtons"].hasOwnProperty("default") && buttons["rowButtons"]["default"]["enabled"])) {
            if (originalYang != null && originalYang["definition"] != null && originalYang["definition"].hasOwnProperty("config")
                && originalYang["definition"]["config"] == "false") {

            } else {
                rowsBts.push(
                    {
                        label: getText("default"),
                        enabled: function (data) {
                            return (checkUserClass(getRpcConfig("default"), USER_CLASS_TYPE.write) && checkUserClass(getYangConfig(configKey), USER_CLASS_TYPE.write)) ? EditBtnState.Normal : EditBtnState.Disabled
                        },
                        clickFunction: function (data, event) {
                            defaultFun(_entity, configKey, keyWords, data[0], tableHashCode, event, _config.title, requestKey);
                        },
                        buttonClass: {
                            normal: "row_default",
                            disabled: "row_default_disabled"
                        }
                    }
                )
            }
        }


        let globalBts = [];
        if (!buttons.hasOwnProperty("globalButtons")
            || !buttons["globalButtons"].hasOwnProperty("create")
            || (buttons["globalButtons"].hasOwnProperty("create") && buttons["globalButtons"]["create"]["enabled"])) {
            if (originalYang != null && originalYang["definition"] != null && ((originalYang["definition"].hasOwnProperty("config")
                && originalYang["definition"]["config"] == "false")
                || (originalYang["definition"].hasOwnProperty("system-managed") || originalYang["definition"]["system-managed"] == "true"))) {
                //no create bt.
            } else {
                let _label = getText("create");
                if (_config.hasOwnProperty("buttons") && _config.buttons.hasOwnProperty("globalButtons") && _config.buttons["globalButtons"].hasOwnProperty("create") && _config.buttons["globalButtons"]["create"].hasOwnProperty("label")) {
                    _label = getText(_config["buttons"]["globalButtons"]["create"]["label"]);
                }
                globalBts.push(
                    {
                        label: _label,
                        enabled: function (data) {
                            return writeRole ? EditBtnState.Normal : EditBtnState.Disabled;
                        },
                        clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                            createFun(_entity, configKey, keyWords, data, tableHashCode, paramObj, event, _config.title,
                                requestKey, showPanelConfig.showConfig != null ? showPanelConfig.showConfig.parentData : null);
                        },
                        buttonClass: {
                            normal: "row_create",
                            disabled: "row_create_disabled"
                        }
                    }
                )
            }
        }

        if (!buttons.hasOwnProperty("globalButtons")
            || !buttons["globalButtons"].hasOwnProperty("default")
            || (buttons["globalButtons"].hasOwnProperty("default") && buttons["globalButtons"]["default"]["enabled"])) {
            if (originalYang != null && originalYang["definition"] != null && originalYang["definition"].hasOwnProperty("config")
                && originalYang["definition"]["config"] == "false") {

            } else {
                globalBts.push([
                        {
                            label: "selected",
                            buttonLabel: "default",
                            enabled: function (data) {
                                return writeRole ? EditBtnState.Normal : EditBtnState.Disabled;
                            },
                            clickFunction: function (data, hashCode, selectedData, attributes) {
                                executeDefault(_entity, configKey, keyWords, selectedData(), requestKey, tableHashCode, "confirm-default-select");
                            },
                            buttonClass: {
                                normal: "row_default",
                                disabled: "row_default_disabled"
                            }
                        },
                        {
                            label: "all",
                            buttonLabel: "default",
                            enabled: function (data) {
                                return writeRole ? EditBtnState.Normal : EditBtnState.Disabled;
                            },
                            clickFunction: function (data, hashCode, selectedData, attributes) {
                                executeDefault(_entity, configKey, keyWords, data, requestKey, tableHashCode, "confirm-default-all");
                            },
                            buttonClass: {
                                normal: "row_default",
                                disabled: "row_default_disabled"
                            }
                        }
                    ]
                )
            }
        }

        tableConfig["rowEdit"] = rowsBts;
        tableConfig["globalEdit"] = globalBts;
    } else {
        if (showPanelConfig != null && showPanelConfig["showConfig"] != null && (!showPanelConfig["showConfig"].hasOwnProperty("pageEnable")
            || !showPanelConfig["showConfig"]["pageEnable"])) {
            tableConfig["footPanel"] = {
                show: false
            }
        }
    }

    if (_config.hasOwnProperty("defaultTableFilter")) {
        tableConfig["defaultTableFilter"] = _config.defaultTableFilter;
    }

    if (showPanelConfig != null) {
        if (showPanelConfig.filter != null) {
            tableConfig["defaultTableFilter"] = showPanelConfig.filter;
        }
        if (showPanelConfig.selected != null) {
            tableConfig["defaultTableSelected"] = showPanelConfig.selected;
        }
        if (showPanelConfig.initFilter != null) {
            tableConfig["defaultTableInitFilter"] = showPanelConfig.initFilter;
        }
    }

    if (!_config.hasOwnProperty("tableType")) {
        _config.tableType = "min";
    }
    margeConfig(tableConfig, deepClone(tableFootConfig[_config.tableType]));
    if (_config.hasOwnProperty("viewClass")) {
        let viewClass = _config.viewClass(tableHashCode);
        if (isFunction(viewClass.tableHead)) {
            viewClass.tableHead = viewClass.tableHead(_config);
        }
        margeConfig(tableConfig, viewClass);
    }
    if (_config.hasOwnProperty("columnSort")) {
        let _sortList = _config["columnSort"];
        let _heads = tableConfig["tableHead"];
        let newHeads = {};

        for (let i = 0; i < _sortList.length; i++) {
            if (_heads.hasOwnProperty(_sortList[i])) {
                newHeads[_sortList[i]] = _heads[_sortList[i]];
                delete _heads[_sortList[i]];
            }
        }
        merge(newHeads, _heads);
        tableConfig["tableHead"] = newHeads;
    }

    if (!isRelateTable || (isRelateTable && buttons["rowButtons"] != null && buttons["rowButtons"]["relate"] != null && buttons["rowButtons"]["relate"].enabled)) {
        let relateKeys = getRelateTableKeys(_entity);
        if (relateKeys.length > 0) {
            if (!buttons.hasOwnProperty("rowButtons") ||
                !buttons["rowButtons"].hasOwnProperty("relate")
                || (buttons["rowButtons"].hasOwnProperty("relate") && buttons["rowButtons"]["relate"]["enabled"])) {
                tableConfig["rowEdit"].push(
                    {
                        type: "collapse",
                        label: getText("relate"),
                        enabled: function (data) {
                            if (getRelateTableKeys(_entity, data[0]).length > 0) {
                                return EditBtnState.Normal;
                            } else {
                                return EditBtnState.Disabled;
                            }
                        },
                        onClick: function (data, event) {
                            return relateTable(configKey, data[0], generateKeys(configKey,data[0], keyWords, requestKey), null, showPanelConfig.showConfig != null ? showPanelConfig.showConfig.parentData : null);
                        },
                        normalClass: "row_expand",
                        triggerClass: "row_contract",
                        disabledClass: "row_expand_disabled",
                        formatter: collapseBtnFormatter4ReactTable(tableHashCode),
                    }
                )
            }
        }
    }
    let _request = {};
    if (selectKeys != null) {
        _request["select"] = selectKeys
    }
    if (configKey != null) {
        _request["from"] = configKey
    }
    if (requestKey != null) {
        if (_config.initRequestFilter != null) {
            requestKey = extendCustomConfig(requestKey, _config.initRequestFilter)
        }
        _request["where"] = requestKey;
    }
    if (showPanelConfig != null && showPanelConfig.hasOwnProperty("showConfig")) {
        if (showPanelConfig["showConfig"].hasOwnProperty("request")) {
            _request = showPanelConfig["showConfig"]["request"];
        }
        if (showPanelConfig["showConfig"].hasOwnProperty("containerKey")) {
            tableConfig["containerKey"] = showPanelConfig.showConfig.containerKey;
            _request["containerKey"] = showPanelConfig.showConfig.containerKey;
        }
    }
    let requestFun = null, eventName = null, notificationFun = null;
    if (_initData != null) {
        requestFun = function (filter, callback) {
            callback(convertToArray(_initData));
        }
    } else if (tableConfig.hasOwnProperty("expandConfig") && tableConfig["expandConfig"].hasOwnProperty("getDataFun")) {
        requestFun = function (filter, callback) {
            if (showPanelConfig != null && showPanelConfig.hasOwnProperty("showConfig") && !isEmptyObj(showPanelConfig.showConfig["containerKey"])) {
                tableConfig["containerKey"] = showPanelConfig.showConfig["containerKey"];
            }
            tableConfig["expandConfig"]["getDataFun"](_request, this, filter, {tableConfig: _config}, callback);
        }
    } else if (tableConfig.hasOwnProperty("eventConfig") && tableConfig["eventConfig"].hasOwnProperty("registerEventFun")) {
        eventName = tableConfig["eventConfig"]["registerEventName"];
        notificationFun = tableConfig["eventConfig"]["registerEventFun"];
    } else {
        requestFun = refreshDataFun(_request);
    }
    if (buttons.hasOwnProperty("onlyBaseButtons")) {
        tableConfig["rowEdit"] = [];
        tableConfig["globalEdit"] = [];
    }

    let tableLabel = "";
    if (_config.title != null) {
        tableLabel = getText(_config.title);
    } else {
        tableLabel = getText(configKey);
    }
    let tableDivClass = "minHeight120";
    if (_config.hasOwnProperty("tableDivClass")) {
        tableDivClass = _config.tableDivClass;
    }
    if (_config.hasOwnProperty("propsFromStore") && !isNullOrUndefined(_config["propsFromStore"])) {
        let pageInfo = new PageInfo();
        pageInfo.init([], tableConfig);
        let propsPushKey = [];
        let mapStateToProps = state => ({state: state.neinfo});
        propsPushKey.push(_config["propsFromStore"]);
        const ReactTableContainer = connect(mapStateToProps, {})(ReactTable);

        return <ReactTableContainer tableName={tableLabel} key={"table" + tableHashCode}
                                    tableInfo={getRequestKeys(_request, _config, showPanelConfig)}
                                    tableTitle={_config.title}
                                    hashCode={tableHashCode} propsPushKey={propsPushKey}
                                    tableDivClass={tableDivClass} pageInfo={pageInfo}
                                    tableData={[]} id={configKey + "Table"} tableConfig={tableConfig}/>;

    } else {
        return <ReactTable key={"table" + tableHashCode} tableName={tableLabel}
                           tableInfo={getRequestKeys(_request, _config, showPanelConfig)} tableTitle={_config.title}
                           hashCode={tableHashCode} id={"table_id_" + tableHashCode} buttons={buttons}
                           getDataFun={requestFun} tableData={initDataFun(_request)}
                           tableDivClass={tableDivClass} registerEventName={eventName}
                           registerEventFun={notificationFun}
                           tableConfig={tableConfig}/>
    }


}

let createTreeTable = function (_config, showPanelConfig, tableHashCode) {
    let tableConfig = {};
    if (_config.hasOwnProperty("viewClass")) {
        margeConfig(tableConfig, _config.viewClass(tableHashCode));
    }
    let defaultExpendState = {},
        defaultSelectedState = {},
        defaultExpandTo = [];
    if (_config.hasOwnProperty("expendState")) {
        for (let i = 0; i < _config.expendState.length; i++) {
            defaultExpendState[_config.expendState[i]] = ExpandType.Open;
        }
    }
    if (_config.hasOwnProperty("defaultSelected")) {
        for (let i = 0; i < _config.defaultSelected.length; i++) {
            //defaultSelectedState[_config.defaultSelected[i]] = "selected";
        }
    }
    if (_config.hasOwnProperty("defaultExpandTo")) {
        defaultExpandTo = _config["defaultExpandTo"];
    }

    if (showPanelConfig.hasOwnProperty("expendState")) {
        defaultExpendState = extendCustomConfig(defaultExpendState, showPanelConfig.expendState);
    }
    if (showPanelConfig.hasOwnProperty("selectedState")) {
        defaultSelectedState = extendCustomConfig(defaultSelectedState, showPanelConfig.selectedState);
    }
    if (showPanelConfig.hasOwnProperty("expandTo")) {
        defaultExpandTo = defaultExpandTo.concat(showPanelConfig.expandTo);
    }
    let initOptions = {
        expendState: defaultExpendState,
        selectedState: defaultSelectedState,
        expandTo: defaultExpandTo
    };
    let tableSort = true;
    if (_config.hasOwnProperty("tableSort")) {
        tableSort = _config["tableSort"];
    }
    let buttons = [];
    if (tableConfig.hasOwnProperty("buttons")) {
        buttons = tableConfig.buttons;
    }
    if (showPanelConfig.hasOwnProperty("showConfig") && showPanelConfig["showConfig"]["buttons"]) {
        buttons = showPanelConfig["showConfig"]["buttons"];
        if (showPanelConfig["showConfig"]["buttons"]["noButtons"]) {
            //don't show the last edit button cloumn.
            if (tableConfig.options.columns[tableConfig.options.columns.length - 1]["field"] == 'editBtns') {
                tableConfig.options.columns.splice(tableConfig.options.columns.length - 1, 1);
            }
        }
    }

    if (_config.hasOwnProperty("title")) {
        initOptions.tableName = _config.title;
    }
    return (
        <ReactTreeTable id={"table_id_" + tableHashCode} key={"table" + tableHashCode} buttons={buttons}
                        hashCode={tableHashCode} treeField={tableConfig.options.treeField}
                        columns={tableConfig.options.columns} initOptions={initOptions} sort={tableSort}
                        queryData={tableConfig.getDataFun}/>
    );
}

let getRequestKeys = function (request, _config, _data) {
    try {
        let keys = request.rsKey || request.from;
        let expandList = [];
        if (_config != null && _config.exportName != null
            && _data != null && _data.showConfig != null && _data.showConfig.parentData != null) {
            _config.exportName.forEach(_key => {
                if (_data.showConfig.parentData[_key] != null) {
                    let _v = _data.showConfig.parentData[_key];
                    if (_v.indexOf(":") > -1) {
                        _v = parseColonValues(_v);
                    }
                    expandList.push(_v)
                }
            })
        }
        let _where = [];
        if (request.where != null) {
            for (let key in request.where) {
                if (key != keys) {
                    _where.push(key);
                }
                for (let key2 in request.where[key]) {
                    let _v = request.where[key][key2];
                    if (_v.startsWith("/ioa-ne")) {
                        _v = resource2KeyName(_v);
                    }
                    if (_v.indexOf(":") > -1) {
                        _v = parseColonValues(_v);
                    }
                    // let label = key2;
                    // if (key != keyName) {
                    //     label = key + "." + key2
                    // }
                    // _where.push(label + "=" + _v);
                    _where.push(_v);
                }
            }
        }
        if (_where.length > 0) {
            keys += "_" + _where.join("_")
        }
        if (expandList.length > 0) {
            keys += "_" + expandList.join("_");
        }
        return keys;
    } catch (er) {
        return "";
    }
}

let initDataFun = function (_requestParameter, callback) {
    return [];
}

let refreshDataFun = function (_requestParameter) {
    return function (filter, callback) {
        return getDataFun(_requestParameter, callback)
    }
}

let getDataFun = function (_requestParameter, callback) {
    return requestData(_requestParameter, function (_data) {
        if (_data == null) {
            callback();
            return;
        }
        if (_requestParameter.hasOwnProperty("rsKey")) {
            callback(_data[_requestParameter.rsKey])
        } else {
            callback(_data[_requestParameter.from])
        }
    });
}

let detailsFun = function (entity, configKey, keyWords, data, tableHashCode, paramObj, event, config, parentKey) {
    let initKey = {};
    for (let _key in keyWords) {
        if (parentKey != null && _key != configKey && parentKey.hasOwnProperty(_key)) {
            initKey[_key] = parentKey[_key];
        }
    }
    let init = {
        initKey: initKey,
        initData: data,
        title: (config.title != null ? getText(config.title) : getText(configKey))
    }
    if (config != null && config["initConfig"] != null) {
        init["initConfig"] = config["initConfig"];
    }
    detailsItem(configKey, init
        , {
            "tableHashCode": tableHashCode,
            "tableTable": refreshTableType.treeTable
        })
}

let editFun = function (entity, configKey, keyWords, data, tableHashCode, paramObj, event, config, parentKey, parentData) {
    let initKey = {};
    if (parentKey == null) {
        parentKey = {};
    }
    for (let _key in keyWords) {
        if (_key != configKey && parentKey.hasOwnProperty(_key)) {
            initKey[_key] = parentKey[_key];
        }
    }
    let init = {
        initData: data,
        title: config.title,
        parentData: parentData
    }
    if (!isEmptyObj(initKey)) {
        init["extendsKey"] = initKey;
    }
    editItem(configKey, init, tableHashCode)
};

let defaultConditionKeys = {
    "pm-control-entry" : {
        "pm-resource" : function (data) {
            return {
                "resource": getEntityPathByKey(Object.keys(data)[0], data)
            }
        }
    }
}

let defaultFun = function (entity, configKey, keyWords, data, tableHashCode, event, title, parentKey) {
    let keys = deepClone(parentKey);
    if (parentKey == null) {
        keys = {};
    }
    keys[configKey] = data;
    let titleList = keyWords.hasOwnProperty(configKey) ? keyWords[configKey].map(key => {
        let value = data[key];
        if (entity[key].hasOwnProperty("cellDataFun")) {
            value = entity[key]["cellDataFun"](data, key);
        }
        return value;
    }) : [configKey];
    if( titleList[0] != configKey ) {
        titleList.unshift(configKey)
    }
    if( defaultConditionKeys[configKey] != null && isNullOrUndefined(keys[Object.keys(defaultConditionKeys[configKey])[0]])) {
        let _key = Object.keys(defaultConditionKeys[configKey])[0];
        let _obj = {};
        _obj[_key] = defaultConditionKeys[configKey][_key](parentKey)
        keys = extendCustomConfig(keys,_obj)
    }
    const resource = getEntityPathByKey(configKey, keys);
    callRpc("default", {
        'initData': {
            "entity-id": resource
        },
        'title': getText("confirm_default").format(titleList.join("-"))
    }, {
        "tableHashCode": tableHashCode,
        "tableTable": refreshTableType.table
    })
}

let deleteFun = function (entity, configKey, keyWords, data, tableHashCode, event, title, parentKey) {
    let initKey = {};
    for (let _key in keyWords) {
        if (_key != configKey && parentKey.hasOwnProperty(_key)) {
            initKey[_key] = parentKey[_key];
        }
    }
    let init = {
        initData: data,
    }
    if (!isEmptyObj(initKey)) {
        init["extendsKey"] = initKey;
    }
    deleteItem(configKey, init, tableHashCode)
};

let executeDefault = function (entity, configKey, keyWords, executeData, parentKey, tableHashCode, warningMsg) {
    let keys = deepClone(parentKey);
    if (parentKey == null) {
        keys = {};
    }
    let resourceList = [];
    executeData.forEach(item => {
        let _keys = deepClone(keys);
        _keys[configKey] = item;
        resourceList.push(getEntityPathByKey(configKey, _keys));
    })
    if (resourceList.length > 0) {
        callRpc("default", {
            'initData': {
                "entity-id": resourceList
            },
            'title': getText(warningMsg).format(resourceList.length)
        }, {
            "tableHashCode": tableHashCode,
            "tableTable": refreshTableType.table
        })
    } else {
        let config = {
            dialogType: DialogType.ERROR,
            showText: getText("pls_select_records_1st")
        };
        showAlertDialog(config);
    }
}

let createFun = function (entity, configKey, keyWords, data, tableHashCode, paramObj, event, title, parentKey, parentData) {
    let initKey = {};
    for (let _key in keyWords) {
        if (_key != configKey && parentKey.hasOwnProperty(_key)) {
            initKey[_key] = parentKey[_key];
        }
    }
    let init = {
        title: title,
        initConfigData: data,
        parentData: parentData,
    }
    if (!isEmptyObj(initKey)) {
        init["initKey"] = initKey;
    }
    createItem(configKey, init, tableHashCode)
};


let margeConfig = function (config1, config2) {
    for (let _key in config2) {
        if (config1.hasOwnProperty(_key)) {
            if (config1[_key] instanceof Array) {
                if (_key == "globalEdit") {
                    config1[_key] = config2[_key].concat(config1[_key])
                } else {
                    config1[_key] = config1[_key].concat(config2[_key])
                }
            } else {
                merge(config1[_key], deepClone(config2[_key]));
            }
        } else {
            config1[_key] = config2[_key]
        }
    }
}

let createRequestList = function (idList, keyList, data) {
    for (let i = 0; i < keyList.length; i++) {
        for (let _key in keyList[i]) {
            let obj = {};
            obj[_key] = data[_key];
            idList.push(obj);
        }
    }
}

let generateKeys = function (key,data, keysList, parentKey) {
    let retObj = {};
    for (let _key in keysList) {
        let _keylist = convertToArray(keysList[_key]);
        let keyObj = {};
        for (let i = 0; i < _keylist.length; i++) {
            if (_key === key && data.hasOwnProperty(_keylist[i])) {
                keyObj[_keylist[i]] = data[_keylist[i]];
            } else if (!isNullOrUndefined(parentKey) && parentKey.hasOwnProperty(_key)) {
                keyObj[_keylist[i]] = parentKey[_key][_keylist[i]];
            }
        }
        retObj[_key] = keyObj
    }
    return retObj
}


let parseXpath = function (xmlStr) {
    xmlStr = "<root>" + xmlStr + "</root>";
    let idList = [];
    let keyList = [];
    let _json = xml2JSON(xmlStr);
    getItems(idList, _json);

    return {
        idList: idList,
        keyList: keyList
    }

    function getItems(idList, _json) {
        for (let _key in _json) {
            if (_key == "@value" || _key == "@key") {
                continue;
            }
            let _value = _json[_key];
            let _itemValue = "";
            if (_value.hasOwnProperty("@value")) {
                _itemValue = _value["@value"];
            }
            if (_value.hasOwnProperty("@key")) {
                let _obj = {};
                _obj[_key] = _value["@key"];
                keyList.push(_obj);
                continue;
            }
            let _obj = {};
            _obj[_key] = _itemValue;
            idList.push(_obj);
            if (typeof _value == 'string' && (_value instanceof String)) {
                return;
            }
            getItems(idList, _value);
        }
    }

}

let AdminState = {
    true: {
        label: "true",
        value: "true",
        color: "background_green"
    },
    false: {
        label: "false",
        value: "false",
        color: "background_red"
    }
};

let upDownCheckFormatter = function (updateKey, requestKey, hashCodeStr) {
    return function (rowData, field, getSelectedFun) {
        let _data = deepClone(rowData);
        if (requestKey != null) {
            _data = extendCustomConfig(_data, requestKey)
        }
        let saveParameters = {
            "setKey": field,
            "from": updateKey,
            "initKeyData": _data
        }
        let val = rowData[field];
        return <ReactSwitchButton value={val} items={AdminState} saveParameters={saveParameters}
                                  getSelectedFun={getSelectedFun} eventType={EventTypeEnum.RefreshTableData}
                                  hashCode={hashCodeStr}/>
    }
};
let upDownCheckFormatterForSelect = function (updateKey, requestKey, hashCodeStr, writeRole) {
    return function (rowData, field, getSelectedFun) {
        let _data = deepClone(rowData);
        if (requestKey != null) {
            _data = extendCustomConfig(_data, requestKey)
        }
        let saveParameters = {
            "setKey": field,
            "from": updateKey,
            "initKeyData": _data
        }
        let val = rowData[field];
        if (isNullOrUndefined(writeRole)) {
            writeRole = true;
        }
        return <ReactSelectEdit value={val} enabled={writeRole} saveParameters={saveParameters}
                                eventType={EventTypeEnum.RefreshTableData} getSelectedFun={getSelectedFun}
                                hashCode={hashCodeStr}/>
    }
};


let tableFootConfig = {
    min: {
        pageBtn: {
            show: true
        },
        pageSize: {
            show: false,
            defaultSize: 1000
        },
        leftBottomInfo: {
            show: false
        },
        firstAndLast: {
            show: false
        },
        previousAndNext: {
            show: false
        },
        setPageSelect: {
            show: false
        },
        resetButton: {
            show: true
        },
        export: {
            export_csv: {
                enabled: true
            },
            export_pdf: {
                enabled: true
            },
            export_json: {
                enabled: true
            },
        },
        footPanel: {
            show: false
        }
    },
    page: {}
}

export default createDynamicTable;
