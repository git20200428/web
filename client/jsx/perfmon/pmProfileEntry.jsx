import {
    checkUserClass,
    convertToArray,
    deepClone,
    editCommitQueue,
    getText,
    isEmptyObj,
    parseColonValues,
    requestJson,
    revertLoadingState,
    showAlertDialog,
    USER_CLASS_TYPE
} from "../custom/utils";
import {FormControlTypeEnum} from "../yang_user_define";
import React from "react";
import ReactDOM from "react-dom";
import {ModalConfigConstant, ReactModalAlert} from "../custom/modal/react_modal";
import {EventTypeEnum, MyReactEvents} from "../custom/message_util";
import {DialogType} from "../components/modal/modal";
import {getYangConfig} from "../yangMapping";

let ModalAlertType = ModalConfigConstant.ModalAlertType;
let ModalBodyTypeEnum = ModalConfigConstant.ModalBodyTypeEnum;
let ModalButtonTypeEnum = ModalConfigConstant.ModalButtonTypeEnum;

let pmProfileEntryTable = function (hashCodeStr) {
    let parseExecuteUpdate = function (updateList, refreshData) {
        let updateObj = updateList[0];
        if (updateObj.edit.set.hasOwnProperty("default-tca-supervision")) {
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
                    if (rs.data != null && rs.data[0] != null && rs.data[0]["pm-profile-entry"] != null) {
                        let rsList = convertToArray(rs.data[0]["pm-profile-entry"])
                        rsList.forEach(pmResource => {
                            if (pmResource.hasOwnProperty("default-tca-supervision")) {
                                newUpdateList.push({
                                    "edit": {
                                        "set": updateObj.edit.set,
                                        "from": "pm-profile-entry",
                                        where: {
                                            "pm-profile-entry": {
                                                "period": pmResource["period"],
                                                "direction": pmResource["direction"],
                                                "location": pmResource["location"],
                                                "resource-type": pmResource["resource-type"]
                                            }
                                        }
                                    }
                                })
                            }
                        })

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
        let period = [
            {
                label: "pm-15min",
                value: "pm-15min",
            }, {
                label: "pm-24h",
                value: "pm-24h",
            }
        ];
        let direction = [];
        let location = [];
        let existResourceType = [];
        let existDirection = [];
        let existLocation = [];
        allData.forEach(item => {
            if (existResourceType.indexOf(item["resource-type"]) < 0) {
                resourceType.push({
                    label: parseColonValues(item["resource-type"]),
                    value: item["resource-type"]
                })
            }
            if (existDirection.indexOf(item["direction"]) < 0) {
                direction.push({
                    label: parseColonValues(item["direction"]),
                    value: item["direction"]
                })
            }
            if (existLocation.indexOf(item["location"]) < 0) {
                location.push({
                    label: parseColonValues(item["location"]),
                    value: item["location"]
                })
            }
        })
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
                defaultValue: "default-data-supervision",
                enumValue: [
                    {
                        label: getText("default-data-supervision"),
                        value: "default-data-supervision"
                    },
                    {
                        label: getText("default-tca-supervision"),
                        value: "default-tca-supervision"
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
            },
            "period": {
                type: FormControlTypeEnum.MultiSelect,
                label: getText("period"),
                placeholder: "",
                defaultValue: "",
                enumValue: period,
                editEnable: true
            },
            "direction": {
                type: FormControlTypeEnum.MultiSelect,
                label: getText("direction"),
                placeholder: "",
                defaultValue: "",
                enumValue: direction,
                editEnable: true
            },
            "location": {
                type: FormControlTypeEnum.MultiSelect,
                label: getText("location"),
                placeholder: "",
                defaultValue: "",
                enumValue: location,
                editEnable: true
            }
        };
        let formData = {
            "status": "true",
            "type": "default-data-supervision",
            "resource-type": [],
            "period": [],
            "direction": [],
            "location": []
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

                            let updateConfig = [];
                            let requestList = [];
                            let setObj = {};
                            setObj[data.type] = data.status;

                            if ((data["resource-type"] == null || data["resource-type"].length == 0)
                                && (data["period"] == null || data["period"].length == 0)
                                && (data["direction"] == null || data["direction"].length == 0)
                                && (data["location"] == null || data["location"].length == 0)
                            ) {
                                updateConfig.push({
                                    "edit": {
                                        "set": setObj,
                                        "from": "pm-profile-entry",
                                        "wildcard": true
                                    }
                                })
                            } else {
                                let _resourceTypeList = data["resource-type"];
                                if (data["resource-type"] == null || data["resource-type"].length == 0) {
                                    _resourceTypeList = [];
                                    _resourceTypeList.push("");
                                }
                                let _periodList = data["period"];
                                if (data["period"] == null || data["period"].length == 0) {
                                    _periodList = [];
                                    _periodList.push("");
                                }
                                let _directionList = data["direction"];
                                if (data["direction"] == null || data["direction"].length == 0) {
                                    _directionList = []
                                    _directionList.push("");
                                }
                                let _locationList = data["location"];
                                if (data["location"] == null || data["location"].length == 0) {
                                    _locationList = []
                                    _locationList.push("");
                                }

                                _resourceTypeList.forEach(_resourceType => {
                                    _periodList.forEach(_period => {
                                        _directionList.forEach(_direction => {
                                            _locationList.forEach(_location => {
                                                let _where = {};
                                                if (_resourceType != "") {
                                                    _where["resource-type"] = _resourceType;
                                                }
                                                if (_period != "") {
                                                    _where["period"] = _period;
                                                }
                                                if (_direction != "") {
                                                    _where["direction"] = _direction;
                                                }
                                                if (_location != "") {
                                                    _where["location"] = _location
                                                }
                                                if (!isEmptyObj(_where)) {
                                                    requestList.push({
                                                        "from": "pm-profile-entry",
                                                        "where": {
                                                            "pm-profile-entry": _where
                                                        }
                                                    });

                                                }
                                            })
                                        })
                                    })
                                })
                            }
                            if (requestList.length > 0) {
                                requestJson({
                                    "get": requestList
                                }, function (_rs) {
                                    if (_rs.data != null && _rs.data[0] != null) {
                                        convertToArray(_rs.data[0]["pm-profile-entry"]).forEach(item => {
                                            updateConfig.push({
                                                "edit": {
                                                    "set": setObj,
                                                    "from": "pm-profile-entry",
                                                    "where": {
                                                        "pm-profile-entry": {
                                                            "location": item.location,
                                                            "direction": item.direction,
                                                            "period": item.period,
                                                            "resource-type": item["resource-type"]
                                                        }
                                                    }
                                                }
                                            })
                                        })
                                    }
                                    if (updateConfig.length > 0) {
                                        parseExecuteUpdate(updateConfig, refreshData);
                                    } else {
                                        let config = {
                                            dialogType: DialogType.ERROR,
                                            showText: getText("no-matching-objects")
                                        }
                                        showAlertDialog(config);
                                        revertLoadingState();
                                    }
                                })
                            } else if (updateConfig.length > 0) {
                                parseExecuteUpdate(updateConfig, refreshData);
                            } else {
                                let config = {
                                    dialogType: DialogType.ERROR,
                                    showText: getText("no-matching-objects")
                                }
                                showAlertDialog(config);
                                revertLoadingState();
                            }
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
                    return checkUserClass(getYangConfig("pm-profile-entry"), USER_CLASS_TYPE.write);
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

export {pmProfileEntryTable};
