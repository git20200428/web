import React from 'react';
import {checkParameterUserClass, checkUserClass, getText, hashCode, USER_CLASS_TYPE} from "../custom/utils";
import ReactRpcComponent from '../custom/comm/rpcComponent';
import {getRpcConfig} from "../yangMapping";
import {editRpcItem} from "../custom/comm/react_common";

let createRpcDBTable = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    let timeStamp = hashCode("database_table");
    let btnList = [{
        type: "upload",
        init: {
            title: getText("upload"),
            initKey: "db"
        }
    }, {
        type: "download",
        init: {
            title: getText("download"),
            initKey: "db",
        }
    }, {
        type: "activate-file",
        init: {
            title: getText("activate-file"),
            initKey: "db"
        }
    }, {
        type: "take-snapshot",
        init: {
            title: getText("take-snapshot"),
        }
    }, {
        type: "activate-snapshot",
        init: {
            title: getText("activate-snapshot"),
        }
    }, {
        type: "clear-database",
        init: {
            title: getText("clear-database")
        }
    }];

    return (
        <ReactRpcComponent key={timeStamp} type={_config.title} btnList={btnList} yangConfig={yangConfig}/>
    );
}

let databaseView = function (hashCodeStr) {
    let options = {
        globalEdit: [
            {
                label: getText("upload"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write)
                        && checkParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "filetype", "database");
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("upload-database"),
                        initKey: "db",
                        showMessage: true
                    }
                    editRpcItem("upload", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "upload",
                }
            },
            {
                label: getText("download"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write)
                        && checkParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "filetype", "database");
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("download-database"),
                        initKey: "db",
                        showMessage: true
                    }
                    editRpcItem("download", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
            {
                label: getText("activate"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("activate-file"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("activate-database"),
                        initKey: "db",
                        showMessage: true
                    }
                    editRpcItem("activate-file", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
            {
                label: getText("clear"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-database"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("clear-database"),
                        showMessage: true
                    }
                    editRpcItem("clear-database", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            },
            {
                label: getText("take-snapshot"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("activate-file"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("take-snapshot"),
                        showMessage: true
                        // initKey: "db"
                    }
                    editRpcItem("take-snapshot", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },

        ],
        rowEdit: [
            // {
            //     label: getText("take-snapshot"),
            //     enabled: function (data) {
            //         return checkUserClass(getRpcConfig("take-snapshot"),USER_CLASS_TYPE.write);
            //     },
            //     clickFunction: function (data, event) {
            //         let dbInstance=data[0]["database-type"];
            //         let initData={
            //             'db-instance' : dbInstance
            //         };
            //         let init={
            //             'title': getText("take-snapshot"),
            //             'initData':initData,
            //         };
            //         editRpcItem("take-snapshot",init,{tableHashCode:hashCodeStr});
            //     },
            //     buttonClass: {
            //         normal: "snapshot",
            //         // disabled: "row_resetPassword_disabled"
            //     }
            // },
            // {
            //     label: getText("activate-snapshot"),
            //     enabled: function (data) {
            //         return checkUserClass(getRpcConfig("activate-snapshot"), USER_CLASS_TYPE.write);
            //     },
            //     clickFunction: function (data, event) {
            //         let dbInstance = data[0]["database-type"];
            //         let initData = {
            //             'db-instance': dbInstance
            //         };
            //         let init = {
            //             title: getText("activate-snapshot"),
            //             'initData': initData,
            //             showMessage: true
            //         }
            //         editRpcItem("activate-snapshot", init, {tableHashCode: hashCodeStr});
            //     },
            //     buttonClass: {
            //         normal: "activate-file"
            //     }
            // },
        ],
    };
    return options;
};

export {createRpcDBTable as rpcDbView, databaseView};
