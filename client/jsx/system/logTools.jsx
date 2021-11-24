import React, {useState} from 'react';
import {
    checkParameterUserClass,
    checkUserClass,
    getText,
    handleCollapseClick,
    USER_CLASS_TYPE
} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";
import {editRpcItem} from "../custom/comm/react_common";
import dynamicPanel from "../custom/table/dynamicTable";
import "../../css/system/logTools.css";

let timeStampRegexp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}/

const btnList = [
    {
        type: "get-log",
        title: "view-log",
        init: {
            title: getText("view-log")
        }
    }, {
        type: "clear-log",
        init: {
            title: getText("clear-log")
        }
    }, {
        type: "upload",
        title: "upload-log",
        init: {
            title: getText("log-file-upload"),
            initKey: "logfile"
        }
    }
];

const logDataHandler = function (data, callback) {
    let resData = {};
    let lineArr = data.split("\n");
    lineArr.forEach(item => {
        let logTypeNum = item.match(/<(\d+)>/);
        if (logTypeNum) {
            let num = Number.parseInt(logTypeNum[1]);
            let key = "";
            if (num >= 176 && num <= 182) {
                // local6, event
                key = "event";
            } else if (num >= 152 && num <= 158 && item.match("<CLI>")) {
                // local3, cli, netconf, shell
                key = "cli";
            } else if (num >= 144 && num <= 150) {
                // local2, configuration
                key = "configuration";
            } else if (num >= 136 && num <= 142) {
                // local1, alarm
                key = "alarm";
            }
            if (key && GetLogConfig[key]) {
                if (GetLogConfig[key].hasOwnProperty("dataHandler")) {
                    resData[key] = resData[key] ? resData[key] : [];
                    let formatData = GetLogConfig[key].dataHandler(item);
                    if (formatData) {
                        resData[key].push(formatData);
                    }
                }
            }
        }
    });
    if (callback) callback(resData);
}

const GetLogConfig = {
    alarm: {
        dataHandler: function (data) {
            let idx = data.indexOf("alarm-");
            if (idx != -1) {
                let alarmStr = data.substr(idx, data.length - idx);
                let arr = alarmStr.split(";");
                if (arr) {
                    let alarm = {};
                    for (let i = 0; i < arr.length; i += 2) {
                        alarm[arr[i]] = arr[i + 1];
                    }

                    return alarm;
                }
            }
            return null;
        },
        tableType: "alarm-log"
    },
    event: {
        dataHandler: function (data) {
            let idx = data.indexOf('"time-stamp"');
            let endIdx = data.indexOf(';"attributes"');
            if (idx > -1) {
                let str = data.slice(idx, endIdx > -1 ? endIdx : undefined);
                let arr = str.split(";");
                if (arr) {
                    let ev = {};
                    arr.forEach(item => {
                        let kv = item.match(/"([\w-]+)":([\s\S]+)?/);
                        ev[kv[1]] = kv[2] ? kv[2] : "";
                    });
                    if (endIdx > -1) {
                        ev.attributes = data.match(/"attributes":"([\s\S]+)"/)[1];
                    }
                    return ev;
                }
            }
            return null;
        },
        tableType: "event-log"
    },
    cli: {
        dataHandler: function (data) {
            let timeArr = data.match(timeStampRegexp);
            if (timeArr) {
                let str = data.slice(data.indexOf("<CLI>") + 6);
                let arr = str.split(" ");
                if (arr) {
                    return {
                        time: timeArr[0],
                        user: arr[0],
                        ip: arr[1],
                        command: arr.slice(2).join(" ")
                    };
                }
            }
        },
        tableType: "cli-log"
    },
    configuration: {
        dataHandler: function (data) {
            // "time-stamp":2021-01-25T00:56:47Z;"duration":2054;"user-name":root;"nbi":CLI;"session-id":127.0.0.1:12523;"id":91;"result":success;"error-message":;"type":ACTION;"entity":change-ztp-mode;"attributes":"ztp-mode;disabled;"
            let attrIndex = data.indexOf('"attributes"');
            let configDataWithoutAttr = data.slice(data.indexOf('"time-stamp"'), attrIndex > -1 ? attrIndex : undefined);
            let obj = {};
            configDataWithoutAttr.split(";").forEach(item => {
                let arr = item.match(/"([\w-]+)":([\s\S]+)/);
                if (arr) {
                    obj[arr[1]] = arr[2];
                }
            });
            if (attrIndex != -1) {
                let arr = data.slice(attrIndex).match(/"([\w-]+)":"([\s\S]+)"/);
                if (arr) {
                    obj[arr[1]] = arr[2];
                }
            }
            return Object.keys(obj).length > 0 ? obj : null;
        },
        tableType: "configuration-log"
    }
}

const ShowType = {
    SHOW_TEXT: 0,
    SHOW_TABLE: 1
}

let ShowLogView = function (props) {
    const [result, setResult] = useState({
        text: "",
        table: null
    });
    const [showType, setShowType] = useState(ShowType.SHOW_TEXT);

    const clearResult = () => {
        setResult({
            text: "",
            table: null
        });
        setShowType(ShowType.SHOW_TEXT);
    }

    const clickBtn = event => {
        let button = event.target;
        if (button) {
            let data = JSON.parse(button.getAttribute("data"));
            editRpcItem(data.type, data.init, null, (_resultData) => {
                setShowType(ShowType.SHOW_TEXT);
                if (_resultData.result) {
                    if (data.type === "get-log") {
                        if (_resultData.hasOwnProperty("data")) {
                            let logResult = _resultData.data[0]["log-entries"];
                            if (logResult) {
                                logDataHandler(logResult, logEntries => {
                                    let logTypes = Object.keys(logEntries);
                                    setResult({
                                        text: logResult,
                                        table: logTypes.length === 1 ? {
                                            type: GetLogConfig[logTypes[0]].tableType,
                                            data: logEntries[logTypes[0]],
                                            buttons: {
                                                globalButtons: {
                                                    "create": {
                                                        enabled: false
                                                    }
                                                }
                                            }
                                        } : null
                                    });
                                });
                            } else {
                                setResult({
                                    text: "No data found.",
                                    table: null
                                });
                            }
                        } else {
                            setResult({
                                text: "No data found.",
                                table: null
                            });
                        }
                    } else {
                        let n = new Date();
                        let now = new Date(n - n.getTimezoneOffset() * 60 * 1000).toISOString().replace("T", " ").substr(0, 23);
                        let resultDataStr = "";
                        if (_resultData.result) {
                            if (Array.isArray(_resultData.data)) {
                                _resultData.data.forEach(item => {
                                    resultDataStr += JSON.stringify(item) + ";";
                                });
                            } else {
                                resultDataStr += JSON.stringify(_resultData.data) + ".";
                            }
                        } else {
                            resultDataStr = _resultData.message;
                        }
                        setResult({text: `[${now}] ` + resultDataStr + "\n", table: null});
                    }
                } else {
                    let n = new Date();
                    let now = new Date(n - n.getTimezoneOffset() * 60 * 1000).toISOString().replace("T", " ").substr(0, 23);
                    setResult({text: `[${now}] ` + _resultData.data["error-message"], table: null});
                }
            });
        }
    }

    const showTypeChange = () => {
        setShowType(showType === ShowType.SHOW_TEXT ? ShowType.SHOW_TABLE : ShowType.SHOW_TEXT);
    }

    return (
        <div className="table-container panel panel-default table-panel-border-show">
            <div className="panel-heading react-table-heading">
                <span className="iconfont icon-collapse-up3" onClick={handleCollapseClick}></span>
                {getText(props.config.title)}
                <div key="_init_filter_div_" className="react-table-filter-div">
                    <form className="form-inline" role="form">
                        <div className="row react-table-tool-panel-btn-row delete-margin-bottom intiDiv"
                             key="row react-table-tool-panel-btn-row intiDiv">
                            {
                                btnList.map(item => {
                                    let disabled = !checkUserClass(getRpcConfig(item.type), USER_CLASS_TYPE.write);
                                    if (item.type === "upload") {
                                        disabled = disabled
                                            && !checkParameterUserClass(getRpcConfig("upload"), USER_CLASS_TYPE.write, "filetype", "logs");
                                    }
                                    let buttonTitle = getText(item.title ? item.title : item.type);
                                    return (
                                        <input type="button" key={props.tableId + buttonTitle}
                                               disabled={disabled} className="resetButton react-table-global-btn"
                                               role="button" defaultValue={buttonTitle}
                                               onClick={clickBtn} data={JSON.stringify(item)}/>);
                                })
                            }
                        </div>
                    </form>
                </div>
            </div>
            <div id={"react_collapse_table_body_ping"} className="panel-collapse collapse in react-ping-trace-tool">
                <div className="logToolsContent">
                    {showType === ShowType.SHOW_TABLE ?
                        dynamicPanel(null, {
                            showConfig: result.table
                        })
                        :
                        <form id="logForm" className="react-ping-trace-form">
                            <div className="form-group">
                                <textarea type="text" disabled={true} rows="40"
                                          className="form-control" id="result" name="result"
                                          value={result ? result.text : ""}/>
                            </div>
                        </form>}
                    <div className="row react-table-tool-panel-clear-result-btn-row intiDiv"
                         key="row react-table-tool-panel-btn-row intiDiv" id="log-tool-footer">
                        <input type="button" key={props.tableId + "_change"}
                               disabled={showType === ShowType.SHOW_TEXT && (!result || !result.table)}
                               className="resetButton react-table-global-btn"
                               role="button"
                               defaultValue={getText(showType === ShowType.SHOW_TEXT ? "show-table" : "show-text")}
                               onClick={showTypeChange}
                               data={getText(showType === ShowType.SHOW_TEXT ? "show-table" : "show-text")}/>
                        <input type="button" key={props.tableId + "clear"}
                               disabled={false} className="resetButton react-table-global-btn"
                               role="button" defaultValue={getText("clear-result")}
                               onClick={clearResult} data={getText("clear-result")}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

let createLogTab = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    return (
        <ShowLogView key={"react_rpc_tool_" + tableHashCode} config={_config} yangConfig={yangConfig}/>
    );
}

export {createLogTab as LogToolView};
