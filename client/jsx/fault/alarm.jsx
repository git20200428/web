import {detailsItem, editRpcItem, refreshTableType, relateTable} from "../custom/comm/react_common";
import {collapseBtnFormatter4ReactTable} from "../configuration/config_util";
import {
    checkUserClass,
    EditBtnState,
    getHelpUrl,
    getText,
    isNullOrUndefined,
    removeNS,
    showAlertDialog,
    USER_CLASS_TYPE
} from "../custom/utils";
import axios from "axios";
import {getRpcConfig} from "../yangMapping";
import {DialogType} from "../components/modal/modal";

import {ModalConfigConstant} from "../custom/modal/react_modal";

const ModalButtonTypeEnum = ModalConfigConstant.ModalButtonTypeEnum;

let alarmView = function (hashCodeStr) {
    let options = {
        globalEdit: [
            [
                {
                    label: "selected",
                    buttonLabel: getText("set-alarm-state"),
                    enabled: function (data) {
                        return checkUserClass(getRpcConfig("set-alarm-state"), USER_CLASS_TYPE.write)
                    },
                    clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                        let isEnabled = false;
                        if (!isNullOrUndefined(data) && data.length > 0) {
                            Object.values(data).map(row => {
                                if (row.hasOwnProperty("_selected") && row["_selected"]) {
                                    isEnabled = true;
                                }
                            });
                        }
                        if (!isEnabled) {
                            showAlertDialog({
                                dialogType: DialogType.ERROR,
                                showText: getText("pls_select_records_1st")
                            });
                        } else {
                            let alarmList = [];
                            Object.values(data).map(alarm => {
                                if (alarm.hasOwnProperty("_selected") && alarm["_selected"]) {
                                    alarmList.push(alarm["alarm-id"])
                                }
                            });
                            let initConfig = {
                                "all-alarms": {
                                    show: false
                                },
                                "alarm-id-list": {
                                    editEnable: false,
                                },
                                "target": {
                                    disabled: true
                                }
                            };
                            let initData = {
                                'alarm-id-list': alarmList,
                                'target': "alarm-id-list",
                            };
                            let init = {
                                title: getText("set-alarm-state"),
                                initKey: "alarm-id",
                                initData: initData,
                                initConfig: initConfig
                            }
                            editRpcItem("set-alarm-state", init, {tableHashCode: hashCodeStr});
                        }
                    }.bind(this),
                    buttonClass: {
                        normal: "acknowledge",
                        disabled: "acknowledge-disable"
                    }
                },
                {
                    label: "all",
                    buttonLabel: "Set Alarm State",
                    enabled: function () {
                        return checkUserClass(getRpcConfig("set-alarm-state"), USER_CLASS_TYPE.write)
                    },
                    clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                        let initConfig = {
                            "all-alarms": {
                                show: true,
                                emptyValue: {},
                                "mandatory": "true"
                            },
                            "alarm-id-list": {
                                show: false
                            },
                            "target": {
                                disabled: true
                            }
                        };
                        let initData = {
                            'all-alarms': "All Alarms",
                            'target': "all-alarms",
                        };
                        let init = {
                            title: getText("Set Alarm State"),
                            initKey: "alarm-id",
                            initData: initData,
                            initConfig: initConfig
                        }
                        editRpcItem("set-alarm-state", init, {tableHashCode: hashCodeStr});
                    }.bind(this),
                    buttonClass: {
                        normal: "acknowledge",
                        disabled: "acknowledge-disable"
                    }
                }
            ]
        ],
        rowEdit: [
            {
                label: getText("detail"),
                enabled: function (data) {
                    return EditBtnState.Normal;
                },
                clickFunction: function (_data, hashCode, selectedData, attributes, paramObj, event) {
                    let data = _data[0];
                    let init = {
                        initKey: {
                            "alarm": {
                                "alarm-id": data["alarm-id"]
                            }
                        },
                        title: getText("alarm"),
                        buttons: [
                            {
                                type: ModalButtonTypeEnum.Redirect,
                                label: getText("troubleshoot"),
                                href: "/webgui_help/" + getHelpUrl(removeNS(data["alarm-type"])),
                                target: "_webgui_help"
                            }
                        ]
                    }
                    detailsItem("alarm", init
                        , {
                            "tableHashCode": hashCode,
                            "tableTable": refreshTableType.table
                        });
                },
                buttonClass: {
                    normal: "row_edit_d",
                    disabled: "row_edit_d_disabled"
                }
            },
            {
                label: getText("set-alarm-state"),
                enabled: function () {
                    return checkUserClass(getRpcConfig("set-alarm-state"), USER_CLASS_TYPE.write)
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    let alarm = data[0];
                    let initConfig = {
                        "all-alarms": {
                            show: false
                        },
                        "alarm-id-list": {
                            editEnable: false,
                        },
                        "target": {
                            disabled: true
                        }
                    };
                    let initData = {
                        'alarm-id-list': alarm["alarm-id"],
                        'target': "alarm-id-list",
                        'state': alarm["operator-state"],
                        'acknowledge-text': alarm["operator-text"] || ""
                    };

                    let init = {
                        title: getText("set-alarm-state"),
                        initKey: "alarm-id",
                        initData: initData,
                        initConfig: initConfig
                    }
                    editRpcItem("set-alarm-state", init, {tableHashCode: hashCodeStr});
                }.bind(this),
                buttonClass: {
                    normal: "alarm-on",
                    disabled: "alarm-on"
                }
            },
            relateConfig(hashCodeStr)
        ],
        highlightRow: {
            enabled: true,
            rules: [
                {
                    filter: {
                        "alarm-cleared-state": "false" || null,
                    },
                    rowClass: ' defaultHighlightRow'
                },
                {
                    filter: {
                        "alarm-cleared-state": "true",
                    },
                    rowClass: ' defaultHighlightRow removeRowData'
                },
            ]
        },
        reloadFunc: () => {
            axios.post("/api/fetchAlarms", {});
        }
    }

    return options;
};

function relateConfig(hashCodeStr) {
    return {
        type: "collapse",
        label: getText("relate"),
        enable: function (data) {
            return EditBtnState.Normal;
        },
        onClick: (data, tableHashCode, selectedData, blValue, event) => {
            return relateTable("alarm", data[0], {});
        },
        normalClass: "row_expand",
        triggerClass: "row_contract",
        disabledClass: "row_expand_disabled",
        formatter: collapseBtnFormatter4ReactTable(hashCodeStr),
    }
}

export {alarmView, relateConfig}