import React from 'react';
import ReactDOM from 'react-dom';
import {EditBtnState, getText, isFunction, isNullOrUndefined, isObject, requestJson,} from "../custom/utils";
import {editRpcItem, runRpcItem} from "../custom/comm/react_common";
import "../../css/system/logTools.css";
import {ReactTable} from "../custom/table/react_table";
import {ReactModalAlert} from "../custom/modal/react_modal";

let ShowScriptView = function (props) {
    const getScriptList = (_requestParameter, callback) => {
        let _requestConfig = {
            "rpc": {
                "get-script": {
                    "list-scripts": ""
                }
            }
        };
        requestJson(_requestConfig, function (_result) {
            if (!isNullOrUndefined(callback) && isFunction(callback)) {
                let data = _result["data"][0]["script-list"];
                if (isObject(data)) {
                    data = [data];
                }
                if(isNullOrUndefined(data)){
                    data=[];
                }
                callback(data);
            }
        }, function (error) {
            console.log(error);
        });
    }
    let col = {
        "script": {
            label: "Script",
            description: props.yangConfig.config.input["script"]["description"]
        },
        "script-type": {
            label: "Script Type",
            description: props.yangConfig.config.input["script-type"]["description"]
        },
        "file-size": {
            label: "File Size",
            description: props.yangConfig.config.input["file-size"]["description"]
        },
        "created": {
            label: "Created",
            description: props.yangConfig.config.input["created"]["description"]
        },
        "description": {
            label: "Description",
            description: props.yangConfig.config.input["description"]["description"]
        }
    };
    let tableConfig = {
        tableKey: props.hashCode,
        tableHead: col,
        eachColFilter: {
            show: true,
            showCol: col
        },
        globalEdit: [
            {
                label: getText("download"),
                enabled: function (data) {
                    return EditBtnState.Normal;
                },
                clickFunction: function () {
                    let init = {
                        title: "Download Script",
                        initKey: "script",
                        showMessage: true
                    }
                    editRpcItem("download", init, {tableHashCode: props.hashCode});
                }
            }
        ],
        rowEdit: [
            {
                label: getText("view"),
                buttonClass: {
                    normal: "row_edit_d",
                    disabled: "row_edit_d_disabled"
                },
                enabled: function (data) {
                    return EditBtnState.Normal;
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    let _requestConfig = {
                        "rpc": {
                            "get-script": {
                                "script-name": data[0].script
                            }
                        }
                    };
                    requestJson(_requestConfig, function (_result) {
                        let modalConfig = {
                                "head": {title: data[0].script},
                                "body": {
                                    "bodyContentMessage": "",
                                    "bodyContentType": 1
                                }
                            },
                            _config = {
                                "script-content": {"config": false, "type": 10, "icss": "minHeight300"},
                                "inputCSS": "text-div",
                            };
                        ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={_result["data"][0]}
                                                         controlConfig={_config} alertType={2}/>,
                            document.getElementById("additionalContent1"));
                    }, function (error) {
                        console.log(error);
                    });
                }
            },
            {
                label: getText("delete"),
                buttonClass: {
                    normal: "row_delete",
                    disabled: "row_delete_disabled"
                },
                enabled: function (data) {
                    return EditBtnState.Normal;
                },
                clickFunction: function (data, hashCode) {
                    let init = {
                        title: "Clear Script",
                        initKey: "script",
                        showMessage: true,
                        initData: {"filetype": "script", "target-file": data[0].script},
                        initConfig: {filetype: {editEnable: "false"}, "target-file": {editEnable: "false"}}
                    }
                    editRpcItem("clear-file", init, {tableHashCode: hashCode});
                }
            },
            {
                label: getText("run"),
                buttonClass: {
                    normal: "run",
                    disabled: "run_disabled"
                },
                enabled: function (data) {
                    return EditBtnState.Normal;
                },
                clickFunction: function (data, hashCode) {
                    let init = {
                        title: "Run Script",
                        initKey: "script",
                        showMessage: true,
                        initData: {"script-name": data[0].script},
                        initConfig: {"script-name": {editEnable: "false"}}
                    }
                    runRpcItem("run-script", init, {tableHashCode: hashCode});
                }
            }
        ]
    };
    return <ReactTable key={"react_rpc_tool_" + props.hashCode} hashCode={props.hashCode} tableName={getText("script")}
                       loadMask="true" tableData={[]}
                       getDataFun={getScriptList}
                       tableConfig={tableConfig}
                       tableDivClass="minHeight100"/>
        ;
};

let createScriptTab = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    return (
        <ShowScriptView key={tableHashCode} hashCode={tableHashCode} config={_config} yangConfig={yangConfig}/>
    );
};

export {createScriptTab as scriptView};
