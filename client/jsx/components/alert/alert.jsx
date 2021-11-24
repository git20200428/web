import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";

import "./alert.css";
import "../../../css/layout/main.css";
import {remove_alert} from "../../redux/actions";

const Alert = () => {
    const alertPool = useSelector(state => state.neinfo ? state.neinfo.alertPool : {});
    const dispatch = useDispatch();

    useEffect(() => {
        if (alertPool) {
            for (let key in alertPool) {
                if (alertPool[key].status.trim().toUpperCase() === "SUCCESS") {
                    // remove success alert in 5 seconds
                    setTimeout(() => {
                        dispatch(remove_alert(key));
                    }, 5000);
                }
            }
        }
    }, [alertPool]);

    let getStatusIcon = (status) => {
        let stt = status.trim().toUpperCase();
        return stt === "SUCCESS" ? "check-mark" :
            (stt === "IN-PROGRESS" ? "refresh icon-loading" : "error");
    }

    return (
        <div className={"alert-main " + ((Object.keys(alertPool).length === 0) ? "alert-none" : "")}>
            {Object.keys(alertPool).map(key =>
                <div key={key} className={"alert-item"}>
                     <span className={`iconfont icon-${
                         getStatusIcon(alertPool[key].status)
                     }`}/>
                    <p key={key} title={alertPool[key].message} className="alert-content">
                        {(alertPool[key].operation ? (alertPool[key].operation + " ") : "") + alertPool[key].name + " " + alertPool[key].message}
                    </p>
                    <span className="iconfont alert-close"
                          onClick={() => {
                              dispatch(remove_alert(key));
                          }}/>
                </div>
            )}
        </div>);
};

export default Alert;