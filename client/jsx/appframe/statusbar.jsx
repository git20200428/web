import React from "react";
import {useSelector} from "react-redux";

export default function StatusBar() {
    const msg = useSelector(state => state.neinfo.msg);

    function isOngoing(str) {
        return str && str.endsWith("...");
    }

    return (
        <div className="statusbar-body side-background">
            {msg ?
                <div className={!isOngoing(msg) ? "hideIn5Seconds" : ""}>
                    <span className={`nav-icon ${isOngoing(msg) ? "span-loading" : ""}`}>+</span>
                    <span className="nav-text">{msg}</span>
                </div> : ""}
        </div>
    );
}