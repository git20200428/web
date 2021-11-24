import React, {useEffect, useReducer, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";

import {to_login} from "../redux/actions";
import {ActionListener, getText, icons, showAlertDialog, validate} from "../custom/utils";
import {DialogType} from "../components/modal/modal";

const ReplayDuration = ["day", "week", "month", "year", "all"];
const ModePrefix = ["WebGUI", "online-documentation"];

const loginValidator = {
    fields: {
        username: {
            validators: {
                notEmpty: {
                    message: function () {
                        return getText("error.config.required").format("username")
                    }
                }
            }
        },
        password: {
            validators: {
                notEmpty: {
                    message: function () {
                        return getText("error.config.required").format("password")
                    }
                }
            }
        }
    }
};

const reducer = (state, vMsg) => {
    Object.keys(vMsg).forEach(key => {
        if (state[key] instanceof Object) {
            Object.keys(vMsg[key]).forEach(subKey => {
                state[key][subKey] = vMsg[key][subKey];
            });
        } else {
            state[key] = vMsg[key];
        }
    });
    return {...state};
}

export default function Login() {
    let url = window.location.href;
    if (url.match("error=")) {
        let arr = url.match(/error=(.*)/);
        if (arr && arr[1]) {
            showAlertDialog({
                dialogType: DialogType.ERROR,
                showText: arr[1].replaceAll("%20", " ").replace(/#\/$/, ""),
                okCallBack: () => {
                    window.location.href = window.location.href.replaceAll(/\?error=.*/, "");
                }
            });
        }
    }
    const [mode, setMode] = useState(url.match("/documentation/") ? 1 : 0);
    const rememberMe = !!localStorage[`${ModePrefix[mode]}_isStorePwd`];
    const defaultDuration = "day";
    const [state, dispatch] = useReducer(reducer, {
        username: rememberMe ? localStorage[`${ModePrefix[mode]}_username`] : "",
        password: rememberMe ? localStorage[`${ModePrefix[mode]}_password`] : "",
        passAes: rememberMe ? localStorage[`${ModePrefix[mode]}_password`] : undefined,
        rememberMe: rememberMe,
        replayEnable: rememberMe ? (!!localStorage["web_interface_replay"]) : true,
        replay: (rememberMe && (ReplayDuration.indexOf(localStorage["web_interface_replay"]) !== -1)) ? localStorage["web_interface_replay"] : defaultDuration,
        validateMsg: {"username": {showIcon: "default", text: null}, "password": {showIcon: "default", text: null}}
    });
    const refBtn = useRef();
    const reduxDispatch = useDispatch();
    let islogin = useSelector(state => state.neinfo.islogin,
        (pre, cur) => {
            pre !== cur && (refBtn.current.style.backgroundColor = "#5cb85c");
            return pre === cur;
        }
    );
    const isDocSupported = useSelector(state => state.neinfo.isDocSupported);
    useEffect(() => {
        let rmbMe = !!localStorage[`${ModePrefix[mode]}_isStorePwd`];
        dispatch({
            username: rmbMe ? localStorage[`${ModePrefix[mode]}_username`] : "",
            password: rmbMe ? localStorage[`${ModePrefix[mode]}_password`] : "",
            passAes: rmbMe ? localStorage[`${ModePrefix[mode]}_password`] : undefined,
            rememberMe: rmbMe
        })
    }, [mode]);

    const handleChange = (e, vMsg) => {
        let action = e.target, data = {};
        //for username, password, rememberMe
        if (state.passAes !== undefined && action.id === "password") {
            data["passAes"] = undefined;
            data["password"] = action.value;
        } else {
            data[action.id] = action.type === "checkbox" ? action.checked : action.value;
        }
        dispatch({...data, ...vMsg});
    };

    const handleSubmit = e => {
        e.preventDefault();
        let vMsg = validate(state, loginValidator);
        dispatch(vMsg);
        refBtn.current.style.backgroundColor = "grey";
        if (vMsg.validateMsg.pass) {
            reduxDispatch(to_login({
                user: state.username,
                password: state.password,
                passaes: state.passAes,
                replay: (state.replayEnable) ? state.replay : ""
            }, {
                loging: (islogin + 2) % 4,
                rememberMe: state.rememberMe,
                prefix: ModePrefix[mode]
            }, mode === 1 ? () => {
                location.href="/documentation/"
            } : null));
        }
    };

    return (
        <div className="login-container">
            {isDocSupported ?
            <div className="login-mode">
                <span className={mode === 0 ? "selected" : ""} onClick={() => {
                    setMode(0);
                }}>{getText(ModePrefix[0])}</span>
                <span>|</span>
                <span className={mode === 1 ? "selected" : ""} onClick={() => {
                    setMode(1);
                }}>{getText(ModePrefix[1])}</span>
            </div> : ""}
            <form onSubmit={handleSubmit}>
                <div className="login-content">
                    <div className="logo">
                        <div className="logo-description">
                            {`Infinera GX ${getText(ModePrefix[mode])}`}
                        </div>
                    </div>
                    <div className={"login-username " + icons[state.validateMsg["username"].showIcon]}>
                        <label className="login-label">Account</label>
                        <div style={{position: "relative"}}>
                            <input type="text" id="username"
                                   onChange={ActionListener("username", loginValidator.fields["username"], handleChange)}
                                   value={state.username}
                                   placeholder="Please Enter Account"
                                   className="login-input-text"/>
                            {state.validateMsg["username"].showIcon &&
                            <i className={"login-control-feedback iconfont icon-" + state.validateMsg["username"].showIcon}/>}
                            {state.validateMsg["username"].showIcon === "remove" &&
                            <small className="help-block">{state.validateMsg["username"].text}</small>}
                        </div>
                    </div>
                    <div className={"login-password " + icons[state.validateMsg["password"].showIcon]}>
                        <label className="login-label">Password</label>
                        <div style={{position: "relative"}}>
                            <input type="password" id="password"
                                   onChange={ActionListener("password", loginValidator.fields["password"], handleChange)}
                                   value={state.password}
                                   placeholder="Please Enter Password"
                                   className="login-input-text"/>
                            {state.validateMsg["password"].showIcon &&
                            <i className={"login-control-feedback iconfont icon-" + state.validateMsg["password"].showIcon}/>}
                            {state.validateMsg["password"].showIcon === "remove" &&
                            <small className="help-block">{state.validateMsg["password"].text}</small>}
                        </div>
                    </div>
                    <div>
                        {mode === 0 &&
                        <div className="login-checkbox">
                            <input type="checkbox" id="replayEnable"
                                   checked={state.replayEnable} onChange={handleChange}/>
                            <span>{getText("load-history-data")}</span>
                            <select id="replay" disabled={!state.replayEnable} onChange={handleChange}
                                    value={state.replay}>
                                {ReplayDuration.map(item => {
                                    return <option key={item} value={item}>
                                        {item === "all" ? "All" : `In one ${item}`}</option>;
                                })}
                            </select>
                        </div>}
                        <div className="login-checkbox">
                            <input type="checkbox" id="rememberMe" style={{verticalAlign: "middle"}}
                                   checked={state.rememberMe} onChange={handleChange}/>
                            <span>Remember me</span>
                        </div>
                    </div>
                    <button ref={refBtn} className="login-submit" id="loginButtonId">
                        {mode === 0 ? "Login" : "Login Documentation"}
                    </button>
                </div>
            </form>
        </div>
    );
};