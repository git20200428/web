import {
    checkUserClass,
    confirmToast,
    convertToArray,
    deepClone,
    editCommitQueue,
    getText,
    parseColonValues,
    requestJson,
    resource2KeyName,
    revertLoadingState,
    showAlertDialog,
    USER_CLASS_TYPE
} from "../custom/utils";
import {FormControlTypeEnum} from "../yang_user_define";
import React from "react";
import ReactDOM from "react-dom";
import {ModalConfigConstant, ReactModalAlert} from "../custom/modal/react_modal";
import {EventTypeEnum, MyReactEvents} from "../custom/message_util";
import {getYangConfig} from "../yangMapping";
import {DialogType} from "../components/modal/modal";

let ModalAlertType = ModalConfigConstant.ModalAlertType;
let ModalBodyTypeEnum = ModalConfigConstant.ModalBodyTypeEnum;
let ModalButtonTypeEnum = ModalConfigConstant.ModalButtonTypeEnum;

let pmResourceTable = function (hashCodeStr) {
    let parseExecuteUpdate = function (updateList,data,allData, refreshData) {
        let updateObj = updateList[0];
        if (updateObj.edit.set.hasOwnProperty("tca-supervision")) {
            let requestQueue = [];
            updateList.forEach(item => {
                let newRq = deepClone(item.edit);
                delete newRq["set"];
                delete newRq["wildcard"];
                requestQueue.push(newRq);
            })
            requestJson(
                {
                    "get": requestQueue
                }, function (rs) {
                    let newUpdateList = [];
                    let noSupportTypeList = [];
                    let noSupportResourceList = [];
                    if (rs.data != null && rs.data[0] != null && rs.data[0]["pm-resource"] != null) {
                        let rsList = convertToArray(rs.data[0]["pm-resource"])
                        rsList.forEach(pmResource => {
                            if (pmResource["pm-control-entry"] != null) {
                                let pmEntryList = convertToArray(pmResource["pm-control-entry"]);
                                pmEntryList.forEach(pmEntry => {
                                    if (pmEntry.hasOwnProperty("tca-supervision")) {
                                        newUpdateList.push({
                                            "edit": {
                                                "set": updateObj.edit.set,
                                                "from": "pm-control-entry",
                                                where: {
                                                    "pm-resource": {
                                                        "resource": pmResource["resource"]
                                                    },
                                                    "pm-control-entry": {
                                                        "period": pmEntry["period"],
                                                        "direction": pmEntry["direction"],
                                                        "location": pmEntry["location"]
                                                    }
                                                }
                                            }
                                        })
                                    } else {
                                        if (data["resource-type"] != null && data["resource-type"].length > 0) {
                                            for(let i=0;i<allData.length;i++) {
                                                if( allData[i].resource === pmResource["resource"]
                                                    && noSupportTypeList.indexOf(parseColonValues(allData[i]["resource-type"])) < 0 ) {
                                                    noSupportTypeList.push(parseColonValues(allData[i]["resource-type"]));
                                                }
                                            }
                                        } else if (data["resource"] != null && data["resource"].length > 0) {
                                            if( noSupportResourceList.indexOf(resource2KeyName(pmResource["resource"])) < 0 ) {
                                                noSupportResourceList.push(resource2KeyName(pmResource["resource"]))
                                            }
                                        }
                                    }
                                })
                            }
                        })

                    }
                    if( noSupportTypeList.length > 0) {
                        let config = {
                            dialogType: DialogType.INFO,
                            showText: getText("dose-not-support").format(noSupportTypeList.join(","))
                        };
                        showAlertDialog(config);
                        revertLoadingState();
                        return;
                    }
                    if( noSupportResourceList.length > 0) {
                        let config = {
                            dialogType: DialogType.INFO,
                            showText: getText("dose-not-support").format(noSupportResourceList.join(","))
                        };
                        showAlertDialog(config);
                        revertLoadingState();
                        return;
                    }
                    if (newUpdateList.length > 0) {
                        editCommitQueue(newUpdateList, function (_data) {
                            refreshData();
                            MyReactEvents.emitEvent(EventTypeEnum.RefreshTableData.format(hashCodeStr));
                        })
                    } else {
                        let config = {
                            dialogType: DialogType.INFO,
                            showText: getText("no-matching-objects")
                        };
                        showAlertDialog(config);
                        revertLoadingState();
                    }
                }
            )
        } else {
            editCommitQueue(updateList, function (_data) {
                refreshData();
                MyReactEvents.emitEvent(EventTypeEnum.RefreshTableData.format(hashCodeStr));
            })
        }
    }

    let updateAll = function (allData) {
        let resourceType = [];
        let resource = [];
        allData.forEach(item => {
            resourceType.push({
                label: parseColonValues(item["resource-type"]),
                value: item["resource-type"]
            })
            resource.push({
                label: resource2KeyName(item["resource"]),
                value: item["resource"]
            })
        })

        let period = [
            {
                label: "pm-15min",
                value: "pm-15min",
            }, {
                label: "pm-24h",
                value: "pm-24h",
            }
        ];
        let _config = {
            "status": {
                type: FormControlTypeEnum.Radio,
                label: getText("status"),
                placeholder: "",
                defaultValue: "true",
                enumValue: [
                    {
                        label: getText("true"),
                        value: "true"
                    },
                    {
                        label: getText("false"),
                        value: "false"
                    }
                ],
                editEnable: true
            },
            "type": {
                type: FormControlTypeEnum.Radio,
                label: getText("type"),
                placeholder: "",
                defaultValue: "real-time-supervision",
                enumValue: [
                    {
                        label: getText("real-time-supervision"),
                        value: "real-time-supervision"
                    },
                    {
                        label: getText("data-supervision"),
                        value: "data-supervision"
                    },
                    {
                        label: getText("tca-supervision"),
                        value: "tca-supervision"
                    }
                ],
                editEnable: true
            },
            "resource-type": {
                type: FormControlTypeEnum.MultiSelect,
                label: getText("resource-type"),
                placeholder: "",
                defaultValue: "",
                enumValue: resourceType,
                editEnable: true,
                afterUpdate: function (_data, config) {
                    if (_data["resource"] == null
                        || _data["resource"] == ""
                        || (_data["resource"] instanceof Array && _data["resource"].length == 0)) {
                        return config.enumValue;
                    } else {
                        let filterEnum = [];
                        let existResourceType = [];
                        let resources = convertToArray(_data["resource"]);
                        for (let i = 0; i < resources.length; i++) {
                            allData.forEach(item => {
                                if (item["resource"] == resources[i]) {
                                    if (existResourceType.indexOf(item["resource-type"]) < 0) {
                                        existResourceType.push(item["resource-type"]);
                                        filterEnum.push({
                                            label: parseColonValues(item["resource-type"]),
                                            value: item["resource-type"]
                                        })
                                    }
                                }
                            })
                        }
                        return filterEnum;
                    }
                }
            },
            "resource": {
                type: FormControlTypeEnum.MultiSelect,
                label: getText("resource"),
                placeholder: "",
                defaultValue: "",
                enumValue: resource,
                editEnable: true,
                afterUpdate: function (_data, config) {
                    if (_data["resource-type"] == null
                        || _data["resource-type"] == ""
                        || (_data["resource-type"] instanceof Array && _data["resource-type"].length == 0)) {
                        return config.enumValue;
                    } else {
                        let filterEnum = [];
                        let existResource = [];
                        let resourceTypes = convertToArray(_data["resource-type"]);
                        for (let i = 0; i < resourceTypes.length; i++) {
                            allData.forEach(item => {
                                if (item["resource-type"] == resourceTypes[i]) {
                                    if (existResource.indexOf(item["resource"]) < 0) {
                                        existResource.push(item["resource"]);
                                        filterEnum.push({
                                            label: resource2KeyName(item["resource"]),
                                            value: item["resource"]
                                        })
                                    }
                                }
                            })
                        }
                        return filterEnum;
                    }
                }
            },
            "period": {
                type: FormControlTypeEnum.MultiSelect,
                label: getText("period"),
                placeholder: "",
                defaultValue: "",
                enumValue: period,
                editEnable: true,
                "when": "",
                "initwhen": function (data) {
                    if (data.type == "real-time-supervision") {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        };
        let formData = {
            "status": "true",
            "type": "real-time-supervision",
            "resource-type": [],
            "resource": [],
            "period": [],
        }
        let modalConfig = {
            head: {
                title: getText("enable-disable-all")
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
                        clickFunction: function (data, refreshData) {
                            confirmToast(getText("confirm_to_change_value").format(data.type, data.status), function () {
                                let setObj = {};
                                setObj[data.type] = data.status;
                                let updateConfig = [];
                                let requestList = [];
                                let whereType = (data.type == "real-time-supervision" ? "pm-resource" : "pm-control-entry");
                                if (data.resource != null && data.resource.length > 0) {
                                    data.resource.forEach(item => {
                                        let _where = {}
                                        _where["pm-resource"] = {};
                                        _where["pm-resource"].resource = item;
                                        if (data.period == null || data.period.length == 0 || data.period.length == 2) {
                                            updateConfig.push({
                                                "edit": {
                                                    "set": setObj,
                                                    "from": whereType,
                                                    "wildcard": true,
                                                    where: deepClone(_where)
                                                }
                                            })
                                        } else {
                                            requestList.push({
                                                from: "pm-control-entry",
                                                where: {
                                                    "pm-resource": {
                                                        "resource": item
                                                    },
                                                    "pm-control-entry": {
                                                        "period": data.period[0]
                                                    }
                                                }
                                            })
                                        }
                                    })

                                } else if (data["resource-type"] != null && data["resource-type"].length > 0) {
                                    data["resource-type"].forEach(item => {
                                        if (data.period == null || data.period.length == 0 || data.period.length == 2) {
                                            allData.forEach(_d => {
                                                if (_d["resource-type"] == item) {
                                                    let _where = {
                                                        "pm-resource": {
                                                            "resource": _d["resource"]
                                                        }
                                                    }
                                                    updateConfig.push({
                                                        "edit": {
                                                            "set": setObj,
                                                            "from": whereType,
                                                            "wildcard": true,
                                                            where: deepClone(_where)
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            allData.forEach(_d => {
                                                if (_d["resource-type"] == item) {
                                                    requestList.push({
                                                        from: "pm-control-entry",
                                                        where: {
                                                            "pm-resource": {
                                                                "resource": _d["resource"]
                                                            },
                                                            "pm-control-entry": {
                                                                "period": data.period[0]
                                                            }
                                                        }
                                                    })
                                                }
                                            })

                                        }
                                    })
                                } else if (data["period"] != null && data["period"].length > 0) {
                                    if (data.period == null || data.period.length == 0 || data.period.length == 2) {
                                        updateConfig.push({
                                            "edit": {
                                                "set": setObj,
                                                "from": whereType,
                                                "wildcard": true
                                            }
                                        })
                                    } else {
                                        allData.forEach(_d => {
                                            requestList.push({
                                                from: "pm-control-entry",
                                                where: {
                                                    "pm-resource": {
                                                        "resource": _d["resource"]
                                                    },
                                                    "pm-control-entry": {
                                                        "period": data.period[0]
                                                    }
                                                }
                                            })
                                        })
                                    }
                                } else {
                                    updateConfig.push({
                                        "edit": {
                                            "set": setObj,
                                            "from": whereType,
                                            "wildcard": true
                                        }
                                    })
                                }
                                if (requestList.length > 0) {
                                    requestJson({
                                        "get": requestList
                                    }, function (_rs) {
                                        if (_rs.data != null && _rs.data[0] != null) {
                                            let pmRsourceList = convertToArray(_rs.data[0]["pm-resource"]);
                                            pmRsourceList.forEach(item => {
                                                let _where = {}
                                                _where["pm-resource"] = {};
                                                _where["pm-resource"].resource = item.resource;
                                                convertToArray(item["pm-control-entry"]).forEach(_item => {
                                                    _where[whereType] = {
                                                        "period": _item.period,
                                                        "location": _item.location,
                                                        "direction": _item.direction
                                                    }
                                                    updateConfig.push({
                                                        "edit": {
                                                            "set": setObj,
                                                            "from": whereType,
                                                            where: deepClone(_where)
                                                        }
                                                    })
                                                })
                                            })
                                        }
                                        if (updateConfig.length > 0) {
                                            parseExecuteUpdate(updateConfig,data,allData, refreshData)
                                        }

                                    })
                                } else if (updateConfig.length > 0) {
                                    parseExecuteUpdate(updateConfig, data,allData,refreshData)
                                }
                            });

                        }
                    }
                ]
            }
        };
        ReactDOM.render(<ReactModalAlert id="enable_disable_all" modalConfig={modalConfig} formData={formData}
                                         controlConfig={_config} helpString="enabledisableall"
                                         alertType={ModalAlertType.Edit}/>, document.getElementById("additionalContent1"));


    }
    return {
        globalEdit: [
            {
                label: getText("enable-disable-all"),
                enabled: function (data) {
                    return checkUserClass(getYangConfig("pm-resource"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    updateAll(data);
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            }
        ],

    };
}

export {pmResourceTable};
