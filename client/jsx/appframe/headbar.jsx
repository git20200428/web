import React, {useState} from "react";
import ReactDOM from "react-dom";
import {NavLink} from "react-router-dom";
import {useSelector} from "react-redux";

import {ModalConfigConstant, ReactModalAlert} from "../custom/modal/react_modal";
import AboutComponent from "../custom/about/about";
import {editRpcItem} from "../custom/comm/react_common";
import {createSettingListTable} from "../setting/init";
import {cliView} from "../system/cli"
import {collapseOthers, getText, loginOut, parseColonValues, showAlertDialog} from "../custom/utils";
import {DialogType} from "../components/modal/modal";

export default function HeadComponent() {
    const [showAbout, setShowAbout] = useState(false);
    const neinfo = useSelector(state => state.neinfo);

    const handleThemeSetting = () => {
        let title = getText("theme-setting");
        let html = createSettingListTable();
        let modalConfig = {
            head: {
                title: title
            },
            body: {
                bodyContentType: ModalConfigConstant.ModalBodyTypeEnum.Custom,
                bodyContentMessage: ""
            },
            foot: {
                buttons: []
            }
        };
        ReactDOM.render(<ReactModalAlert id="ThemeSettingDialog" modalConfig={modalConfig} helpString={"settheme"}
                                         customPanel={html}/>, document.getElementById("additionalContent1"));
    };

    const handleLoginOut = () => {
        showAlertDialog({
            showText: getText("confirm.logout"),
            dialogType: DialogType.WARNING,
            btn: [
                {label: getText("ok"), onClick: loginOut},
                {label: getText("cancel")}
            ]
        });
    };

    const handleChgPsw = () => {
        let init = {
            'title': getText("change-password"),
            helpString: "changepassword"
        };
        editRpcItem("password", init, null, function (_resultData) {
        });

    };

    const handleCollapseBtnClick = e => {
        const appMain = document.getElementById("webGUIApp");
        const sidebar = document.getElementsByClassName("sidebar-frame")[0];
        if (sidebar.classList.contains("my-hide")) {
            sidebar.classList.remove("my-hide");
            appMain.style.gridTemplateColumns = "200px 1fr";
        } else {
            sidebar.classList.add("my-hide");
            appMain.style.gridTemplateColumns = "55px 1fr";
        }
        window.dispatchEvent(new Event("resize"));
        e.stopPropagation();
    };

    const handleDropMenu = e => {
        let realParent = document.getElementById("dropdown-menufont");
        if (!realParent.classList.contains("my-open")) {
            collapseOthers();
            realParent.classList.add("my-open")
        } else {
            collapseOthers();
            realParent.classList.remove("my-open");
        }

        e.stopPropagation();
    };

    const alarm = neinfo.ne ? neinfo.ne.alarmCount : {
        critical: 0,
        major: 0,
        minor: 0,
        warning: 0
    };
    document.title = "WebGUI-" + sessionStorage.neIP;

    return (
        <nav id="headContent">
                <span className="headItem headIcon">
                    <a role="button" id="react-navbar-btn" title={getText("collapse")}
                       onClick={handleCollapseBtnClick} className="btn-lg menuBtn">
                         <i className="iconfont icon-list"/>
                    </a>
                </span>

            <span className="headItem headIcon">
                    <NavLink to="/chassisboardview" title={getText("home")} className="btn-lg menuBtn">
                        <i className="iconfont icon-home"/>
                    </NavLink>
                </span>

            <span id="dashboardNeIP" className="headLabel">
                    {parseColonValues(sessionStorage.neType)} - {neinfo.ne ? neinfo.ne["ne-name"] : ""} / {sessionStorage.neIP}
                </span>

            <span className="headItem headItemRight headAlarm">
                    {Object.keys(alarm).map(key => {
                        return <NavLink key={key} to={"/fault/current-alarm?filter=perceived-severity&value=" + key}
                                        className={key} title={getText(key) + ": " + alarm[key]}>{alarm[key]}</NavLink>
                    })}
                </span>
            <span id="dropdown-menufont" className="dropdown-menufont">
                    <a title={sessionStorage.username + " : " + sessionStorage.userGroup}
                       className="btn-lg head-menu-Btn" onClick={handleDropMenu}>
                          <i className="iconfont icon-head"/>
                    </a>
                    <div className="dropdown-menu-div" style={{top: "27px", right: "0px"}}>
                        <a className="head-menu-a" title={getText("CLI")} onClick={cliView}>
                            <span className="iconfont icon-cli head-menu-icon"/>
                            <span className="head-menu-text">&nbsp; {getText("CLI")}</span>
                        </a>
                        <a className="head-menu-a" title={getText("password")} onClick={handleChgPsw}>
                            <span className="iconfont icon-password head-menu-icon"/>
                            <span className="head-menu-text">&nbsp; {getText("password")}</span>
                        </a>
                        <a className="head-menu-a" title={getText("theme-setting")}
                           onClick={handleThemeSetting}>
                            <span className="iconfont icon-change head-menu-icon"/>
                            <span className="head-menu-text">&nbsp; {getText("theme-setting")}</span>
                        </a>
                        <a className="head-menu-a" title={getText("logout")} onClick={handleLoginOut}>
                            <span className="iconfont icon-logout head-menu-icon"/>
                            <span className="head-menu-text">&nbsp; {getText("logout")}</span>
                        </a>
                        <a className="head-menu-a" title={getText("about")} onClick={() => setShowAbout(true)}>
                            <span className="iconfont icon-about head-menu-icon"/>
                            <span className="head-menu-text">&nbsp; {getText("about")}</span>
                        </a>
                    </div>
                </span>
            {showAbout ? <AboutComponent func={setShowAbout}/> : null}
        </nav>
    );
};
