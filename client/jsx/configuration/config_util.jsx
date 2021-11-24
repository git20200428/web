import React from 'react';
import CommonControl from "../custom/comm/index";
import {
    checkUserClass,
    deepClone,
    defaultEnums,
    getText,
    isEmpty,
    isNullOrUndefined,
    USER_CLASS_TYPE,
    xPathToKeys
} from "../custom/utils";

import {EventTypeEnum} from "../custom/message_util";
import {getYangConfig} from "../yangMapping";

let {ReactCircleIconText, ReactTableEditButton, ReactSelectEdit} = CommonControl;

let ReactCircleText = CommonControl.ReactCircleIconText;

let loopbackFormatter4ReactTable = function (hashCodeStr) {
    return function (rowData, field, getSelectedFun) {
        if (isEmpty(rowData) || rowData == "none") {
            return "";
        }
        let val = rowData[field];
        if (isNullOrUndefined(val)) {
            return;
        }
        if (val==="none") {
            return <ReactCircleIconText color="color_green" text={getText(val)}/>;
        } else {
            return <ReactCircleIconText color="color_red" text={getText(val)}/>;
        }
    }
};

let upDownFormatter4ReactTable = function (hashCodeStr) {
    return function (rowData, field, getSelectedFun) {
        if (isEmpty(rowData) || rowData == "none") {
            return "";
        }
        let val = rowData[field];
        if (isNullOrUndefined(val)) {
            return;
        }
        if (val == "true" || val == "enabled" || val==="installed") {
            return <ReactCircleIconText color="color_green" text={getText(val)}/>;
        } else {
            return <ReactCircleIconText color="color_red" text={getText(val)}/>;
        }
    }
};


let upDownCheckFormatter = function (updateKey, requestKey, hashCodeStr) {
    return function (rowData, field, getSelectedFun, editDivID, config) {
        let val = rowData[field]
        if (isEmpty(val)) {
            return "";
        }
        if (!checkUserClass(getYangConfig(updateKey), USER_CLASS_TYPE.write)) {
            if (val == "true" || val == "enabled") {
                return <ReactCircleIconText color="color_green" text={getText(val)}/>;
            } else {
                return <ReactCircleIconText color={defaultEnums[val]} text={getText(val)}/>;
            }
        }else{
            return <ReactCircleIconText color={defaultEnums[val]} text={getText(val)}/>;
        }

        Object.keys(requestKey).map(key => {
            requestKey[key] = rowData[key];
        });


        let saveParameters = {
            "setKey": field,
            "from": updateKey,
            "initKeyData": xPathToKeys(requestKey)
        }
        // return <ReactSelectEdit value={val} saveFun={cellClickFunction} data={rowData}  getSelectedFun={getSelectedFun} hashCode={hashCodeStr} />
        return <ReactSelectEdit value={val} saveParameters={saveParameters}
                                eventType={EventTypeEnum.RefreshTableData} getSelectedFun={getSelectedFun}
                                hashCode={hashCodeStr}/>
    }
};

let severityFormatter4ReactTable = function (hashCodeStr) {
    return function (rowData, field, getSelectedFun) {
        if (isEmpty(rowData) || rowData == "none") {
            return "";
        }
        let val = rowData[field];

        let alarm_color = {
            "indeterminate": {
                color: "color_gray",
            },
            "critical": {
                color: "color_red",
            },
            "major": {
                color: "color_orange",
            },
            "minor": {
                color: "color_yellow",
            },
            "warning": {
                color: "color_blue",
            },
            "not-reported": {
                color: "color_purple",
            },
            "cleared": {
                color: "color_green",
            },
            "event": {
                color: "color_green",
            }
        };

        if (isNullOrUndefined(val)) {

        } else {
            return <ReactCircleText color={alarm_color[val] != null ? alarm_color[val].color : null}
                                    text={getText(val)}/>
        }

    }
};

let collapseBtnFormatter4ReactTable = function (treeTableHashcode) {
    return function (conf, data, selectedData, showDivId) {
        return (<ReactTableEditButton key={treeTableHashcode + "_" + Math.random()}
                                      tableHashCode={treeTableHashcode}
                                      showDivId={showDivId}
                                      rowData={data}
                                      selectedData={selectedData}
                                      conf={deepClone(conf)}/>
        );
    }
};

export {
    collapseBtnFormatter4ReactTable,
    upDownFormatter4ReactTable,
    severityFormatter4ReactTable,
    upDownCheckFormatter,
    loopbackFormatter4ReactTable
};
