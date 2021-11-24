/**
 * Created by jwu on 2020/08/05.
 */
import {callRpc, editRpcItem} from "../custom/comm/react_common";
import {checkParameterUserClass, checkUserClass, getText, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";


let manifestView = function (hashCodeStr) {
    let options = {
        globalEdit: [
            {
                label: getText("download"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write)
                        && checkParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "filetype", "swimage");
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("download-software"),
                        initKey: "sw",
                        showMessage: true,
                        helpString: "downloadmanifest"
                    }
                    editRpcItem("download", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
        ],
        rowEdit: [
            {
                label: getText("prepare-upgrade"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("prepare-upgrade"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let label = data[0]["manifest-file"];
                    let initData = {
                        'manifest': label
                    };
                    let init = {
                        'title': getText("prepare-upgrade"),
                        'initData': initData,
                        showMessage: true
                    };
                    editRpcItem("prepare-upgrade", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "prepare-upgrade",
                    // disabled: "row_resetPassword_disabled"
                }
            },
            {
                label: getText("clear-file"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-file"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let label = data[0]["manifest-file"];
                    let initData = {
                        'target-file': label
                    };
                    let init = {
                        title: getText("clear-file"),
                        'initData': initData,
                        showMessage: true
                        // initKey: "sw"
                    }
                    editRpcItem("clear-file", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_delete",
                    disabled: "row_delete_disabled"
                }
            },
        ],
    };
    return options;
};

let thirdPartyView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("clear-app"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-app"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let name = data[0]["app-name"];
                    let initData = {
                        'app-name': name
                    };
                    let init = {
                        'title': getText("clear-app"),
                        'initData': initData,
                        showMessage: true
                    };
                    editRpcItem("clear-app", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            },
        ]
    }


    return options;
};

let swLoadView = function (hashCodeStr) {
    let options = {
        globalEdit: [
            {
                label: getText("cancel-upgrade"),
                enabled: function (data) {
                    let isActive = data.some(item => (item["swload-state"] === "installable"));
                    return checkUserClass(getRpcConfig("cancel-upgrade"), USER_CLASS_TYPE.write) && isActive;
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("cancel-upgrade"),
                        showMessage: true
                    }
                    callRpc("cancel-upgrade", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            },
        ],
        rowEdit: [
            {
                label: getText("activate-file"),
                enabled: function (data) {
                    if (data[0]["swload-prepared"] !== "true") {
                        return false;
                    }
                    return checkUserClass(getRpcConfig("activate-file"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let label = data[0]["swload-manifest"];
                    let initData = {
                        'label': label
                    };
                    let init = {
                        'title': getText("activate-file"),
                        'initData': initData,
                        showMessage: true
                    };
                    editRpcItem("activate-file", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "activate-file",
                    // disabled: "row_resetPassword_disabled"
                }
            },
        ]
    }


    return options;
};


export {manifestView, swLoadView,thirdPartyView};
