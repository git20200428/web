import React, {useEffect, useState} from "react";
import {_ActionEnum, axiosSubmit, getText, handleResult} from "../custom/utils";

export default function AdminView(props) {
    const [adminState, setAdminState] = useState({
        enableDebug: false,
        user: "",
        startTime: "",
        endTime: ""
    });

    const [message, setMessage] = useState("");
    const [log, setLog] = useState("");

    let request = (req) => {
        axiosSubmit(_ActionEnum._ADMIN, req, response => {
            setMessage(response.data.message);
            if (response.data.result) {
                if (!response.data.data) {
                    setAdminState({
                        enableDebug: false
                    });
                } else {
                    setAdminState(response.data.data);
                }
            } else {
                handleResult(response.data);
            }
        });
    }

    useEffect(() => {
        request({});
    }, []);

    let handleClick = () => {
        request({
            enableDebug: !adminState.enableDebug,
            startTime: adminState.enableDebug ? "" : Date.now(),
            endTime: adminState.enableDebug ? Date.now() : ""
        });
    }

    let uploadLog = () => {
        axiosSubmit("/download", {file: "../log/LOG"}, (response) => {
            setLog(response.data);
        });
    }

    return (
        <div className="admin-view">
            <span>Status</span>
            <div>{message}</div>
            <div>{getText("start-time")} : {adminState.startTime ? (new Date(adminState.startTime)).toString() : ""}</div>
            <div>{getText("end-time")} : {(!(adminState.enableDebug) && adminState.endTime) ? (new Date(adminState.endTime)).toString() : ""} </div>
            <button onClick={handleClick}>{adminState.enableDebug ? "Disable debug" : "Enable debug"}</button>
            <div>
                <button onClick={uploadLog}>Get Log</button>
                {log ? <textarea disabled={true} type="text" rows="30"
                                 className="form-control" value={log}/> : ""}
            </div>
        </div>
    );
}
