import React from "react";
import {NavLink} from "react-router-dom";

import {getText, MENUCONFIG} from "../custom/utils";

export default function Sidebar() {
    return (
        <div className="sidebar-body side-background">
            {Object.values(MENUCONFIG).map(m => {
                    const label = getText(`${m.name}`);
                    return (
                        <NavLink
                            key={m.name}
                            activeClassName="sidebar_selected"
                            title={label}
                            to={`/${m.name}`}
                        >
                            <span className={`nav-icon iconfont ${m.icon}`}/>
                            <span className="nav-text">{label}</span>
                        </NavLink>
                    );
                }
            )}
            <a href="/webgui_help/" target="_webgui_help" rel="help">
                <span className={`nav-icon iconfont icon-help`}/>
                <span className="nav-text">{getText("help")}</span>
            </a>
        </div>
    );
}
