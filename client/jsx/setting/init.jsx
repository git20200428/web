import React from 'react';
import ReactDOM from "react-dom";
import {DialogType} from '../components/modal/modal';
import {
    CookKeyEnum,
    EditBtnState,
    extendCustomConfig,
    getText,
    hashCode,
    isEmptyObj,
    isFunction,
    revertLoadingState,
    showAlertDialog
} from "../custom/utils";
import {FormControlTypeEnum} from "../yang_user_define";
import {ModalConfigConstant, ReactModalAlert} from "../custom/modal/react_modal";
import {ReactTable, TableFilterTypeEnum} from "../custom/table/react_table";

let ModalAlertType = ModalConfigConstant.ModalAlertType;
let ModalBodyTypeEnum = ModalConfigConstant.ModalBodyTypeEnum;
let ModalButtonTypeEnum = ModalConfigConstant.ModalButtonTypeEnum;

let EditType = {
    "Setting": {
        "theme": {
            type: FormControlTypeEnum.Select,
            label: "webTheme",
            placeholder: "",
            defaultValue: "bright",
            enumValue: [
                {
                    label: "dayTime",
                    value: "bright"
                },
                {
                    label: "night",
                    value: "dark"
                }
            ],
            editEnable: true,
            validators: {}
        },
        "language": {
            type: FormControlTypeEnum.Select,
            label: "webLanguage",
            placeholder: "",
            defaultValue: "en",
            enumValue: [
                {
                    label: "English",
                    value: "en"
                },
                {
                    label: "中文",
                    value: "zh"
                }
            ],
            editEnable: true,
            validators: {
                notEmpty: {
                    message: function () {
                        return getText("error.config.empty").format(getText("value"))
                    }
                }
            }
        }
    }
}

let submitEditSetFunction = function (action, conf, idList, data, fun, type) {
    let settingType = null;
    Object.keys(conf).map(_index => {
        localStorage[CookKeyEnum[_index]] = data[_index];
        settingType = _index;
    });
    let alertConfig = {
        dialogType: DialogType.SUCCESS,
        showText: getText("operation_success"),
        okCallBack: function () {
            fun();
            settingSuccess(settingType, type);
        },
        closeCallBack: function () {
            fun();
            settingSuccess(settingType, type);
        }
    };
    showAlertDialog(alertConfig);
};

let refreshThisPanel = function (type) {
    return function () {
        setTimeout(function () {
            // MyReactEvents.emitEvent(EventTypeEnum.FootPanelItemClick, type);
            window.location.reload();
        }, 200);
    }
};

let settingSuccess = function (settingType, type) {
    if (settingType == "theme") {
        loadWebTheme(refreshThisPanel(type));
    } else {
        refreshThisPanel(type)();
    }
};

let loadWebTheme = function (fn) {
    let themeVal = localStorage[CookKeyEnum.theme] || "bright";
    let links = document.querySelectorAll("link[title]");
    links.forEach(link => {
        if (link.title === themeVal) {
            link.removeAttribute("disabled");
        } else {
            link.setAttribute("disabled", "disabled");
        }
    });
    if (fn && isFunction(fn)) {
        fn();
    }
};

let editSettingBtnFun = function (type, data, paramObj, successCallback, event) {
    let idList = {};
    let editConf = {};
    editConf[data.key] = EditType.Setting[data.key];
    let setConfig = extendCustomConfig(editConf, {});
    let formData = {};
    formData[data.key] = data.realValue;
    let modalConfig = {
        head: {
            title: getText("edit_setting")
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
                        let submitData = extendCustomConfig(data, {});
                        submitEditSetFunction("edit", setConfig, idList, submitData, successCallback, type);
                    }
                }
            ]
        }
    };
    ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} paramObj={paramObj} formData={formData}
                                     controlConfig={setConfig}
                                     alertType={ModalAlertType.Edit}/>, document.getElementById("additionalContent2"));
    //ReactDOM.unmountComponentAtNode(document.getElementById("additionalContent2"));

};

let getEnumValueWithValue = function (conf, key, val) {
    if (conf[key].type != FormControlTypeEnum.Select) return;
    let valueList = conf[key].enumValue;
    for (let i = 0, j = valueList.length; i < j; i++) {
        let _enum = valueList[i];
        if (_enum.value == val) {
            return _enum;
        }
    }
};

let getElement = function (_key, _data) {
    let cookieKey = CookKeyEnum[_key];
    let cookieVal = localStorage[cookieKey] || _data.defaultValue;
    let _d = {}, enumVal = getEnumValueWithValue(EditType.Setting, _key, cookieVal);
    if (isEmptyObj(enumVal)) {
        _d.attribute = getText(_data.label);
        _d.value = cookieVal;
        _d.realValue = cookieVal;
        return _d;
    }
    _d.attribute = getText(_data.label);
    _d.value = getText(enumVal.label);
    _d.realValue = enumVal.value;
    return _d;
};

let initData = function () {
    let resultList = [];
    Object.keys(EditType.Setting).map(_key => {
        let _data = EditType.Setting[_key];
        let _d = getElement(_key, _data);
        _d.key = _key;
        resultList.push(_d);
    });
    return resultList;
};

let createSettingListTable = function (type) {
    let tableId = "react-setting-table";
    let tableHashCode = hashCode(tableId);
    let resultList = initData();

    let tableConfig = {
        tableKey: tableHashCode,
        autoCreateIdCol: {
            show: false
        },
        eachColFilter: {
            showCol: {
                "attribute": {control_Type: TableFilterTypeEnum.Select},
                "value": {control_Type: TableFilterTypeEnum.Select},
            }
        },
        tableHead: {
            "attribute": {
                label: getText("attribute")
            },
            "value": {
                label: getText("value")
            }
        },
        headPanel: false,
        rowEdit: [
            {
                id: "setting-setting-edit-setting",
                label: getText("edit"),
                enabled: function (data) {
                    if (data.key === "theme") {
                        return EditBtnState.Normal;
                    }
                    return EditBtnState.Normal;
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    editSettingBtnFun(type, data[0], paramObj, function () {
                        revertLoadingState();
                    }, event);
                },
                buttonClass: {
                    normal: "row_edit_e",
                    disabled: "row_edit_e_disabled"
                }
            }
        ],
        export: {
            enabled: false
        },
        reloadBtn: {
            enabled: false
        },
        footPanel: {
            show: false
        }
    };
    return <ReactTable compontType={type} tableName={getText("theme-setting")}
                       id="SetTable" tableData={resultList}
                       tableDivClass="minHeight100" key={"table" + tableHashCode}
                       hashCode={tableHashCode}
                       tableConfig={tableConfig}/>;
};

export {loadWebTheme, createSettingListTable};
