import React from 'react';
import {
    confirmToast,
    EditBtnState,
    getText,
    isFunction,
    isNullOrUndefined,
    requestJson, showAlertDialog,
} from "../custom/utils";
import {editRpcItem, refresh} from "../custom/comm/react_common";
import "../../css/system/logTools.css";
import {ReactTable} from "../custom/table/react_table";
import ReactDOM from "react-dom";
import {ReactModalAlert} from "../custom/modal/react_modal";

let FileOperationView = function (props) {
    let filePath = "",closeFun = null,firstLoad = true;
    const setFilePath = (path,first) =>{
        filePath = path;
        firstLoad = first;
    }
    const setCloseFun = (fun) =>{
        closeFun = fun;
    }
    const getScriptList = (_requestParameter, callback) => {
        if(isNullOrUndefined(filePath)){
            callback([]);
            return;
        }
        let _requestConfig = {
            "rpc": {
                "file-operation": {
                    "operation": "view",
                    "file-path":filePath
                }
            }
        };
        requestJson(_requestConfig, function (_result) {
            if (!isNullOrUndefined(callback) && isFunction(callback)) {
                let res = _result["data"][0]["result"],data=[];
                if(res.indexOf("cannot") !== -1){
                    let config = {
                        dialogType: "information",
                        showText: _result["data"][0]["result"],
                    };
                    showAlertDialog(config);
                    closeFun && closeFun();
                    callback([]);
                    return;
                }
                if(res.indexOf("total") !== -1) {
                    res = res.slice(res.indexOf("\n") + 1, res.length - 1);
                }
                res = res.split("\n");
                res.forEach(item => {
                    let its = item.split(/[ ]+/);
                    if (!isNullOrUndefined(its[8]) && its[8] !== "." && its[8] !== "..") {
                        data.push({"permission": its[0],"owner": its[2],"group": its[3],"file-size": its[4],
                            "last-modification": its[5] + " " + its[6] + " " + its[7],"file-name": its[8]});
                    }
                });

                let config = {
                    dialogType: "success",
                    showText: "Operation Success"
                };
                if(!firstLoad) {
                    showAlertDialog(config);
                }
                callback(data, null, getText("File-Operation")) ;
                closeFun && closeFun();

            }
        }, function (error) {
            console.log(error);
        });
    }
    let col = {
        "permission": {
            label: "Permission",
            description : "Permission"
        },
        "owner": {
            label: "Owner",
            description : "Owner"
        },
        "group": {
            label: "Group",
            description : "Group"
        },
        "file-size": {
            label: "File Size",
            description: "File Size",
        },
        "last-modification": {
            label: "Last Modification",
            description: "Last Modification",
        },
        "file-name": {
            label: "File Name",
            description: "File Name",
        },
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
                        title: "Download File",
                        initKey: "file",
                        showMessage: true,
                        initData:{"destination": ""}
                    }
                    editRpcItem("download", init, {tableHashCode: props.hashCode,setFilePath});
                }
            },
            {
                label: "View",
                enabled: function (data) {
                    return EditBtnState.Normal;
                },
                clickFunction: function () {
                    let modalConfig = {
                        head: {
                            title: "List File",
                        },
                        body: {
                            bodyContentType: 1,
                            bodyContentMessage: ""
                        },
                        foot: {
                            buttons: [
                                {
                                    type: 1,
                                    label: getText("submit"),
                                    clickFunction: function (data, fun) {
                                        setFilePath(data["file-path"]);
                                        setCloseFun(fun);
                                        refresh(props.hashCode);
                                    }
                                }
                            ]
                        }
                    };
                    let _config = {
                        "operation": {"type": 5, "label": "operation","enumValue":[{"label":"view","value":"view"}]},
                        "file-path": {"type": 1, "label": "file-path","editEnable":true,"mandatory":"true","validators":{ "notEmpty": {
                                                    message: function () {
                                                        return getText("error_required").format(getText("file-path"))
                                                    }
                                                }}}
                    };
                    ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={{"operation": "view", "file-path": ""}} controlConfig={_config}
                                                     objectType="file-operation" alertType={2}/>, document.getElementById("additionalContent1"));
                }
            }
        ],
        rowEdit: [
            {
                label: getText("rename"),
                buttonClass: {
                    normal: "rename",
                    disabled: "rename_disabled"
                },
                enabled: function (data) {
                    return EditBtnState.Normal;
                },
                clickFunction: function (data) {
                    let file = null;
                    if(filePath.indexOf(".")!==-1){
                        file = filePath;
                    }else{
                        if(filePath.lastIndexOf("/") == filePath.length-1){
                            file = filePath + data[0]["file-name"];
                        }else{
                            file = filePath + "/" +data[0]["file-name"];
                        }
                    }
                    let modalConfig = {
                        head: {
                            title: "Rename",
                        },
                        body: {
                            bodyContentType: 1,
                            bodyContentMessage: ""
                        },
                        foot: {
                            buttons: [
                                {
                                    type: 1,
                                    label: getText("submit"),
                                    clickFunction: function (data, fun) {
                                        let updateConfig = {"rpc": {"file-operation":{"operation":"rename","file-path":data["file-path"],"new-file-path":data["new-file-path"]}}};
                                        requestJson(updateConfig, function (_result) {
                                            if (_result.data[0].result.indexOf("cannot")!==-1) {
                                                fun();
                                                let config = {
                                                    dialogType: "information",
                                                    showText: _result["data"][0]["result"],
                                                };
                                                showAlertDialog(config);
                                                fun();
                                            }else{
                                                fun();
                                                setCloseFun(null);
                                                refresh(props.hashCode);
                                            }
                                        });

                                    }
                                }
                            ]
                        }
                    };
                    let _config = {
                        "operation": {"type": 5, "label": "operation","enumValue":[{"label":"rename","value":"rename"}]},
                        "file-path": {"type": 1, "label": "file-path","validators":{ "notEmpty": {
                                    message: function () {
                                        return getText("error_required").format(getText("file-path"))
                                    }
                                }}},
                        "new-file-path": {"type": 1, "label": "new-file-path","editEnable":true,"mandatory":"true","validators":{ "notEmpty": {
                                    message: function () {
                                        return getText("error_required").format(getText("new-file-path"))
                                    }
                                }}}
                    };
                    ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={{"operation": "rename", "file-path": file,"new-file-path":""}} controlConfig={_config}
                                                     objectType="file-operation" alertType={2}/>, document.getElementById("additionalContent1"));
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
                    let file = null;
                    if(filePath.indexOf(".")!==-1){
                        file = filePath;
                    }else{
                        if(filePath.lastIndexOf("/") == filePath.length-1){
                            file = filePath + data[0]["file-name"];
                        }else{
                            file = filePath + "/" +data[0]["file-name"];
                        }
                    }
                    let title = getText("confirm_delete").format(file);
                    confirmToast(title, ()=>{
                        let updateConfig = {"rpc": {"file-operation":{"operation":"delete","file-path":file}}};
                        requestJson(updateConfig, function (_result) {
                            if (_result.data[0].result.indexOf("cannot")!==-1) {
                                let config = {
                                    dialogType: "information",
                                    showText: _result["data"][0]["result"],
                                };
                                showAlertDialog(config);
                                return;
                            }else{
                                setCloseFun(null);
                                refresh(props.hashCode);
                            }
                        });
                    }, ()=>{
                        setCloseFun(null);
                    });
                }
            }
        ]
    };
    return <ReactTable key={"react_rpc_tool_" + props.hashCode} hashCode={props.hashCode} tableName={getText("File-Operation")}
                       loadMask="true" tableData={[]}
                       getDataFun={getScriptList}
                       tableConfig={tableConfig}
                       tableDivClass="minHeight100"/>
        ;
};

let fileOperationTab = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    return (
        <FileOperationView key={tableHashCode} hashCode={tableHashCode} config={_config} yangConfig={yangConfig}/>
    );
};

export {fileOperationTab as fileOperationView};
