import {DialogType} from "../components/modal/modal";
import {mergeYangExpand} from "../yang_user_define";
import {
    _ActionEnum,
    axiosSubmit,
    enumFormControlType,
    getText,
    handleResult,
    initEnvironment,
    initMenuConfig,
    initYangConfig,
    revertLoadingState,
    showAlertDialog,
    isObject, requestData
} from "../custom/utils";
import React from "react";
import ReactDOM from "react-dom";
import {ReactModalAlert} from "../custom/modal/react_modal";
import MESSAGES from "../../../config/message.json";

export const FETCH_CHASSISVIEW = "FETCH_CHASSISVIEW";
export const FETCH_LED = "FETCH_LED";

// messages
export const ON_CHASSISVIEW = "ON_CHASSISVIEW";
export const ON_DASHBOARD = "ON_DASHBOARD";
export const ON_EVENTS = "ON_EVENTS";
export const ON_NOTIFICATION = "ON_NOTIFICATION";
export const FETCH_ALARMS = "FETCH_ALARMS";
export const NE_DISCONNECTED = "NE_DISCONNECTED";
export const TO_LOGIN = "TO_LOGIN";
export const REMOVE_ALERT = "REMOVE_ALERT";
export const FETCH_FILETYPE = "FETCH_FILETYPE";
export const IS_DOC_SUPPORTED = "IS_DOC_SUPPORTED";

const NEW_PASSWD = "new-password";
const OLD_PASSWD = "old-password";
const CONFIRM_PASSWD = "confirm-password";
const USER_NAME = "user-name";

function changePasswd(user, config) {
    const ModalConfigConstant = require("../custom/modal/react_modal").ModalConfigConstant;
    let modalConfig = {
        head: {
            title: config.title
        },
        body: {
            bodyContentType: ModalConfigConstant.ModalBodyTypeEnum.Form,
            bodyContentMessage: ""
        },
        foot: {
            buttons: [
                {
                    type: ModalConfigConstant.ModalButtonTypeEnum.Ok,
                    label: getText("submit"),
                    clickFunction: function (data, fun) {
                        if (data.hasOwnProperty(NEW_PASSWD) && data.hasOwnProperty(CONFIRM_PASSWD)) {
                            if (data[NEW_PASSWD] !== data[CONFIRM_PASSWD]) {
                                showAlertDialog({
                                    dialogType: DialogType.ERROR,
                                    showText: getText("password-mismatch")
                                });
                                revertLoadingState();
                                return;
                            }

                            let newUser = data[USER_NAME] ? data[USER_NAME] : user;
                            axiosSubmit(_ActionEnum._CHANGEPASSWORD, {
                                user: newUser,
                                password: data[OLD_PASSWD] ? data[OLD_PASSWD] : data[NEW_PASSWD],
                                newPassword: data[NEW_PASSWD]
                            }, response => {
                                revertLoadingState();
                                if (response.data.result) {
                                    showAlertDialog({
                                        dialogType: DialogType.SUCCESS,
                                        showText: response.data.message
                                    });
                                    if (fun) fun();
                                } else {
                                    handleResult(response);
                                }
                            }).catch(err => {
                                revertLoadingState();
                                handleResult(err);
                            });
                        }
                    }
                }
            ]
        }
    };
    let formData = {};
    let _config = {};
    if (!user) {
        formData[USER_NAME] = "";
        _config[USER_NAME] = {
            type: enumFormControlType.Text,
            rows: 2,
            label: getText(USER_NAME),
            editEnable: true,
            validators: {
                "regexp": {
                    regexp: "^(?!root$)",
                }
            },
            show: true
        }
    }
    for (let passwd of config.data) {
        formData[passwd] = "";
        _config[passwd] = {
            type: enumFormControlType.NormalPassword,
            rows: 2,
            label: getText(passwd),
            editEnable: true,
            validators: {},
            show: true
        }
    }

    ReactDOM.render(<ReactModalAlert modalConfig={modalConfig} formData={formData} controlConfig={_config}
                                     alertType={ModalConfigConstant.ModalAlertType.Edit}/>, document.getElementById("additionalContent1"));
}

export function to_login(userInfo, config, cb) {
    window.sessionStorage.removeItem("NetworkError");
    return dispatch => {
        let loginButton = document.getElementById("loginButtonId");
        loginButton && loginButton.setAttribute("disabled", "true");

        axiosSubmit(_ActionEnum._LOGIN, userInfo, response => {
            loginButton && loginButton.removeAttribute("disabled");
            if (response.data.result) {
                const out = response.data.data;
                if (out) {
                    sessionStorage.userGroup = out.userGroup;
                    sessionStorage.neType = out.neSWLoad[0];
                    sessionStorage.neVersion = out.neSWLoad[1];
                    sessionStorage.neIP = out.neIP;
                    sessionStorage.username = out.loginUser;
                    sessionStorage.sessionID = out.sessionID;
                    if(isObject(config)) {//filter call from App
                        if (config && config.rememberMe) {
                            localStorage[`${config.prefix}_username`] = userInfo.user;
                            localStorage[`${config.prefix}_password`] = out.passaes;
                            localStorage[`${config.prefix}_isStorePwd`] = true;
                            localStorage["web_interface_replay"] = userInfo.hasOwnProperty("replay") ? userInfo.replay : "";
                        } else {
                            localStorage.removeItem(`${config.prefix}_username`);
                            localStorage.removeItem(`${config.prefix}_password`);
                            localStorage.removeItem(`${config.prefix}_isStorePwd`);
                            localStorage.removeItem("web_interface_replay");
                        }
                    }
                    if (cb) {
                        cb(null, out);
                    } else {
                        initYangConfig(out.neSWLoad.join("-"), () => {
                            initMenuConfig(out.neSWLoad.join("-"), () => {
                                initEnvironment(out);
                                mergeYangExpand();
                                dispatch({type: TO_LOGIN, payload: 2});

                                function newWebSocket() {
                                    let webSocketProtocol = location.protocol === "https:" ? "wss:" : "ws:";
                                    let websocket = new WebSocket(webSocketProtocol + "//" + location.host + _ActionEnum._SUBSCRIBE);
                                    websocket.onmessage = event => {
                                        event.data && dispatch(on_message(JSON.parse(event.data)));
                                    };
                                    return websocket;
                                }

                                let websocket = newWebSocket();
                                setInterval(() => {
                                    if (!websocket || (websocket.readyState !== WebSocket.OPEN)) {
                                        websocket = newWebSocket();
                                    } else {
                                        websocket.send("Are you there?");
                                    }
                                }, 50000);
                            })
                        });
                    }
                }
            } else {
                if (response.data.message) {
                    if (response.data.message.match("password-expired")) {
                        showAlertDialog({
                            dialogType: DialogType.ERROR,
                            showText: getText(response.data.message),
                            okCallBack: () => {
                                changePasswd(userInfo.user, {
                                    title: getText("change-password-for") + " " + userInfo.user,
                                    data: [
                                        OLD_PASSWD,
                                        NEW_PASSWD,
                                        CONFIRM_PASSWD
                                    ]
                                });
                            }
                        });
                    } else if (response.data.message === MESSAGES["first-user-required"]) {
                        showAlertDialog({
                            dialogType: DialogType.WARNING,
                            showText: response.data.data ? response.data.data : response.data.message,
                            okCallBack: () => {
                                changePasswd("", {
                                    title: getText("create-first-user"),
                                    data: [
                                        NEW_PASSWD,
                                        CONFIRM_PASSWD
                                    ]
                                });
                            }
                        });
                    } else {
                        handleResult(response, true);
                    }
                } else {
                    axiosSubmit("/api/isDocSupported", {}, (response) => {
                       dispatch({
                           type: IS_DOC_SUPPORTED,
                           payload: response.data.result
                       })
                    });
                }
                dispatch({type: TO_LOGIN, payload: config ? config.loging : null});
            }
        });
    };
}

export function remove_alert(fileTypeName) {
    return dispatch => {
        dispatch({type: REMOVE_ALERT, payload: fileTypeName});
    };
}

export function fetch_chassisview() {
    return function (dispatch) {
        axiosSubmit("/api/chassisview", "", response => {
            if (response.data && response.data.result) {
                dispatch({
                    type: FETCH_CHASSISVIEW,
                    payload: response.data.data
                });
            } else {
                handleResult(response, true);
            }
        });
    };
}

export function fetch_led() {
    return function (dispatch) {
        axiosSubmit(_ActionEnum._REQUESTJSON, {"get": [{"from": "led"}]}, response => {
            if (response.data && response.data.result) {
                dispatch({
                    type: FETCH_LED,
                    payload: response.data.data
                });
            } else {
                console.error(response);
                handleResult(response, true);
            }
        });
    }
}

export function on_message(msg) {
    switch (msg.type) {
        case "chassisviewSubscribe":
            return {
                type: ON_CHASSISVIEW,
                payload: msg.data
            }
        case "notification":
            return {
                type: ON_NOTIFICATION,
                payload: msg.data
            }
        case "fetchAlarms":
            return {
                type: FETCH_ALARMS,
                payload: msg.data
            }
        case "NEDisconnected":
            return {
                type: NE_DISCONNECTED,
                payload: msg.message
            }
        case "dashboard":
            return {
                type: ON_DASHBOARD,
                payload: msg.data
            }
        case "events":
            return {
                type: ON_EVENTS,
                payload: msg.data
            }
        default: {
            console.error("not handled message type: ", msg);
        }
    }
}
