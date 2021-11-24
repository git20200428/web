import React, {useEffect, useState} from "react";
import dynamicTable from "./dynamicTable";
import {deepClone, getText, isEmptyObj, isNullOrUndefined} from "../utils";

export const DynamicTabPanel = ({tabConfig, panelTitle, contentCss}) => {
    const [actionType, setActionType] = useState(tabConfig != null && tabConfig.length > 0 && tabConfig[0].type);

    const createContentPanel = () => {
        let actionConf = tabConfig.find(conf => conf.type === actionType);
        if (tabConfig.length > 0 && !actionConf) {
            actionConf = tabConfig[0];
            setActionType(tabConfig[0].type);
        }
        const showConfig = deepClone(actionConf);

        if (showConfig.extends != null) {
            showConfig.type = showConfig.extends;
        }
        if (showConfig.buttons == null) {
            showConfig.buttons = [];
        }
        showConfig.buttons.noButtons = !showConfig.showTabButtons;
        return dynamicTable(null, {showConfig});
    };


    const refDiv = React.useRef();

    function resizeListener() {
        let parent = refDiv.current.parentElement;
        let p = parent.getBoundingClientRect();
        let c = refDiv.current.getBoundingClientRect();
        if (p.width < c.width) {
            parent.classList.add("show");
        } else {
            parent.classList.remove("show");
            refDiv.current.lPosition = 0;
            refDiv.current.style.left = "0px";
        }
    }

    useEffect(() => {
        if( tabConfig != null && !isEmptyObj(tabConfig) ) {
            setActionType(tabConfig.length > 0 && tabConfig[0].type);
            refDiv.current.lPosition = 0;
            refDiv.current.style.left = "0px";
            window.addEventListener("resize", resizeListener);
            let p = refDiv.current.parentElement;
            let c = refDiv.current.getBoundingClientRect();
            if (p.getBoundingClientRect().right < c.right + 4) {
                p.classList.add("show");
            } else {
                p.classList.remove("show");
            }
            return () => {
                window.removeEventListener("resize", resizeListener);
            }
        }
    }, [panelTitle]);

    function moveLeft() {
        let child = refDiv.current.lastElementChild;
        if (refDiv.current.lPosition < 0) {
            refDiv.current.lPosition = refDiv.current.lPosition + 10;
            refDiv.current.style.left = refDiv.current.lPosition + "px";
        }
    }

    function moveRight() {
        let child = refDiv.current.lastElementChild;
        let cc = child.getBoundingClientRect();
        if (refDiv.current.parentElement.getBoundingClientRect().right - 30 < cc.right + 4) {
            refDiv.current.lPosition = refDiv.current.lPosition - 10;
            refDiv.current.style.left = refDiv.current.lPosition + "px"
        }

    }

    if( isNullOrUndefined(tabConfig ) || isEmptyObj(tabConfig) || tabConfig.length === 0 ) {
        return <div></div>
    } else {
        return (
            <div className="tab-panel-container">
                <label className="tab-panel-title">{panelTitle ?? ""}</label>
                <div className="service-diagram-panel-row">
                    <div className="relative-position" ref={refDiv}>
                        <ul>
                            {tabConfig.map(conf => (
                                <li className={actionType === conf.type ? "selected" : ""} key={conf.type}
                                    role="button" onClick={() => setActionType(conf.type)}>
                                    <a role="button">{getText((conf.title ?? conf.type).split(".").pop())}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="move">
                        <span className="iconfont icon-chevron_left" onClick={moveLeft}></span>
                        <span className="iconfont icon-chevron_right" onClick={moveRight}></span>
                    </div>
                </div>
                <div className={"related-data-table-div " + (contentCss ?? "")}>
                    {createContentPanel()}
                </div>
            </div>
        );
    }
}