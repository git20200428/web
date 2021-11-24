/**
 * Created by jwu on 2020/08/05.
 */
import {callRpc, editRpcItem, refreshTableType} from "../custom/comm/react_common";
import {checkUserClass, getText, isNullOrUndefined, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";


let neInfoView = function (hashCodeStr) {
    let options = {
        globalEdit: [
            {
                label: getText("restart"),
                enabled: function (data) {
                    if (checkUserClass(getRpcConfig("restart"), USER_CLASS_TYPE.write)) {
                        return true;
                    } else {
                        return false;
                    }

                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    editRpcItem("restart", {});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            }
        ],

    };
    return options;
};

let clockView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("Set Time"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("set-time"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        'title': "Set Time"
                    };
                    editRpcItem("set-time", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_editTime",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    };
    return options;
};

let neRecoverView = function (hashCodeStr) {
    let options = {
        globalEdit: [
            {
                label: getText("clear-recover-mode"),
                enabled: function (data) {
                    if (checkUserClass(getRpcConfig("clear-recover-mode"), USER_CLASS_TYPE.write)
                        && !isNullOrUndefined(data[0]) && data[0].hasOwnProperty("recover-mode") && data[0]["recover-mode"] === "true") {
                        return true;
                    } else {
                        return false;
                    }

                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    callRpc("clear-recover-mode", {
                        title: getText("confirm_to").format(getText("clear-recover-mode")),
                        helpString: "sysclearrecover"
                    }, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            }
        ],

    };
    return options;
};

export {neInfoView, neRecoverView, clockView};
