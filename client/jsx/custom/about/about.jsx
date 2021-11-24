import React, {useEffect, useState} from "react";

import imgURL from "../../../img/about_infinera.png";
import {requestData} from "../utils";
import ReactDOM from "react-dom";

export default function AboutComponent(props) {
    const [swInfo, setSwInfo] = useState("");

    useEffect(() => {
        requestData({
            select: ["swload-label", "swload-delta-label"],
            from: "sw-management.software-load",
            where: {"swload-state": "active"}
        }, data => {
            let activeLoad;
            let swload = data["sw-management.software-load"][0];
            if (swload["swload-delta-label"]) {
                activeLoad = swload["swload-label"] + "/" + swload["swload-delta-label"];
            } else {
                activeLoad = swload["swload-label"];
            }
            setSwInfo(activeLoad);
        });
    }, []);

    return ReactDOM.createPortal(
        <div className="about-container">
            <div className="about-main">
                <div className="about-head">
                    <div className="about-close-btn-div">
                        <a role="button" onClick={() => props.func(false)}
                           className="about-close-btn iconfont icon-remove"/>
                    </div>
                    <img className="aboutImg" src={imgURL} alt=""/>
                </div>
                <div className="about-foot">
                    <p>
                        {swInfo}
                    </p>
                    <p>
                        <a role="button">
                            <i className="iconfont icon-lightbulb-o" aria-hidden="true"/>
                        </a>
                        Copyright &copy; 2021 | <a target="_blank" href="http://www.infinera.com">Infinera</a> | All
                        Rights Reserved
                    </p>
                </div>
            </div>
        </div>, document.getElementById("additionalContent1")
    );
}