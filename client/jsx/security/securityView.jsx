import {callRpc, editRpcItem} from "../custom/comm/react_common";
import {
    checkParameterUserClass,
    checkUserClass, EditBtnState,
    editCommit,
    extendCustomConfig,
    getText,
    hashCode,
    USER_CLASS_TYPE
} from "../custom/utils";
import ReactRpcComponent from "../custom/comm/rpcComponent";
import React from "react";
import {getRpcConfig} from "../yangMapping";
import ReactDOM from "react-dom";
import {ModalConfigConstant, ReactModalAlert} from "../custom/modal/react_modal";
import {FormControlTypeEnum} from "../yang_user_define";

let ModalBodyTypeEnum = ModalConfigConstant.ModalBodyTypeEnum;
let ModalButtonTypeEnum = ModalConfigConstant.ModalButtonTypeEnum;
let ModalAlertType = ModalConfigConstant.ModalAlertType;
let EditType = {
    "Setting": {
        "root_password": {
            type: FormControlTypeEnum.Password,
            label: "Root Password",
            placeholder: "",
            defaultValue: "",
            editEnable: true,
            validators: {}
        },
    }
}

let securityPolicyView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("change-root-password"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("security-policies"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    setRootPswBtnFun(data.type, data[0], paramObj, hashCodeStr, function () {
                    }, event);
                },
                buttonClass: {
                    normal: "row_resetPassword",
                    disabled: "row_resetPassword_disabled"
                }
            }
        ],
    };
    return options;
};

let setRootPswBtnFun = function (type, data, paramObj, hashCodeStr, successCallback, event) {
    let idList = {};
    let editConf = {};
    editConf["root-password"] = EditType.Setting["root_password"];
    let setConfig = extendCustomConfig(editConf, {});
    let formData = {};
    data.key = "root-password";
    formData[data.key] = ""
    let committing = false;
    let modalConfig = {
        head: {
            title: getText("change-root-password")
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
                        //  confirmToast(getText("confirm_to_change_value").format(data.type,data.status),function(){
                        if (committing) {
                            return;
                        }
                        committing = true;
                        let setObj = {};
                        setObj["root-password"] = data["root-password"];
                        let updateConfig = {
                            "edit": {
                                "set": data,
                                "from": "security-policies",
                                // "wildcard" :true
                            }
                        };
                        editCommit(updateConfig, function (_result) {
                            if (_result.result) {
                                fun();
                                //           refresh(hashCodeStr);
                            }
                        },);
                        //   });
                    }
                }
            ]
        }
    };
    ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} paramObj={paramObj} formData={formData}
                                     controlConfig={setConfig} helpString={"changerootpwd"}
                                     alertType={ModalAlertType.Edit}/>, document.getElementById("additionalContent1"));
    //ReactDOM.unmountComponentAtNode(document.getElementById("additionalContent2"));

};


let ISKView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("Delete ISK"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("delete-isk"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const iskName = data[0]["name"];
                    let initData = {
                        'isk-name': iskName
                    };
                    let init = {
                        'initData': initData,
                        'title': "Delete ISK"
                    }
                    editRpcItem("delete-isk", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    };
    return options;
};

let sshKeyGenView = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    let timeStamp = hashCode("ssh-keygen");
    let btnList = [
        {
            type: "ssh-keygen",
            init: {
                title: getText("ssh-keygen")
            }
        },
    ];

    return (
        <ReactRpcComponent key={"react_ssh-keygen" + timeStamp} type={_config.title} btnList={btnList}
                           yangConfig={yangConfig}/>
    );
}

let cerDownloadView = function (tableHashCode) {
    let options = {
        globalEdit: [
            {
                label: getText("download-trusted-certificate"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("download-trusted-certificate"),
                        initKey: "trusted-certificate",
                        showMessage: true
                    }
                    editRpcItem("download", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
        ],
    }
    return options;
}

let peerCerDownloadView = function (tableHashCode) {
    let options = {
        globalEdit: [
            {
                label: getText("download"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("download-peer-certificate"),
                        initKey: "peer-certificate",
                        showMessage: true
                    }
                    editRpcItem("download", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
        ],
        rowEdit: [
            {
                label: getText("clear-certificate"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-certificate"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const name = data[0]["id"];
                    let initData = {
                        'id': name,
                        'type': "peer"
                    };
                    let init = {
                        title: getText("clear-certificate"),
                        initKey: "peer",
                        'initData': initData,
                    }
                    editRpcItem("clear-certificate", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    }
    return options;
}

let localCerView = function (tableHashCode) {
    let options = {
        globalEdit: [
            {
                label: getText("download"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write)
                        && checkParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "filetype", "local-certificate");
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("download-local-certificate"),
                        initKey: "local-certificate",
                        showMessage: true
                    }
                    editRpcItem("download", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
            {
                label: getText("generate"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("cert-gen"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("cert-gen"),
                        showMessage: true
                    }
                    editRpcItem("cert-gen", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
        ],
        rowEdit: [
            {
                label: getText("clear-certificate"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-certificate"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const name = data[0]["id"];
                    let initData = {
                        'id': name,
                        'type': "local"
                    };
                    let init = {
                        title: getText("clear-certificate"),
                        initKey: "local",
                        'initData': initData,
                    }
                    editRpcItem("clear-certificate", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    }
    return options;
}
let trustedCerView = function (tableHashCode) {
    let options = {
        globalEdit: [
            {
                label: getText("download"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write)
                        && checkParameterUserClass(getRpcConfig("download"), USER_CLASS_TYPE.write, "filetype", "trusted-certificate");
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("download-trusted-certificate"),
                        initKey: "trusted-certificate",
                        showMessage: true
                    }
                    editRpcItem("download", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
        ],
        rowEdit: [
            {
                label: getText("clear-certificate"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-certificate"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const name = data[0]["id"];
                    let initData = {
                        'id': name,
                        'type': "trusted"
                    };
                    let init = {
                        title: getText("clear-certificate"),
                        'initData': initData,
                        initKey: "trusted",
                    }
                    editRpcItem("clear-certificate", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    }
    return options;
}


let sshView = function (tableHashCode) {
    let options = {
        globalEdit: [
            {
                label: getText("ssh-keygen"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("ssh-keygen"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        title: getText("ssh-keygen"),
                        showMessage: true
                    }
                    editRpcItem("ssh-keygen", init, {tableHashCode: tableHashCode});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
        ],
    }
    return options;
}


let sessionTableView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("delete"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("ioa-rpc.kill-session"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const sessionID = data[0]["session-id"];
                    let initData = {
                        'session-id': sessionID
                    };
                    let init = {
                        'initData': initData,
                        'title': getText("confirm_kill_session").format(sessionID)
                    }
                    let refreshConfig = {
                        tableHashCode: hashCodeStr
                    }
                    callRpc("ioa-rpc.kill-session", init, refreshConfig);
                },
                buttonClass: {
                    normal: "row_delete",
                    disabled: "row_delete_disabled"
                }
            }
        ],
    };
    return options;
};

let krpView = function (hashCodeStr) {
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
                        title: getText("download-krp"),
                        initKey: "krp",
                        showMessage: true,
                        // helpString: "downloadmanifest"
                    }
                    editRpcItem("download", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            },
            {
                label: getText("activate-file"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("activate-file"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let init = {
                        'title': getText("activate-file"),
                        initKey: "krp",
                        showMessage: true
                    };
                    editRpcItem("activate-file", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "activate-file",
                }
            },
            {
                label: getText("clear-krp"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-file"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, hashCode) {
                    let initData = {
                        "filetype": "krp",
                        // "target-file": krpName,
                    };
                    let init = {
                        title: getText("clear-krp"),
                        initKey: "krp",
                        'initData': initData,
                        showMessage: true,
                    }
                    editRpcItem("clear-file", init, {tableHashCode: hashCode});
                },
                buttonClass: {
                    normal: "activate-file",
                }
            },
        ],
    };
    return options;
};


export {
    sessionTableView,
    ISKView,
    sshKeyGenView,
    cerDownloadView,
    peerCerDownloadView,
    securityPolicyView,
    localCerView,
    sshView,
    trustedCerView,
    krpView
};
