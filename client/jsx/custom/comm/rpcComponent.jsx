import React, {useState} from 'react';
import {checkUserClass, getText, handleCollapseClick, isNullOrUndefined, USER_CLASS_TYPE} from "../utils";
import {callRpc, editRpcItem} from "./react_common";
import {getRpcConfig} from "../../yangMapping";

let ReactRpcComponent = function (props) {
    const [result, setResult] = useState("");

    let logTypeChange = () => {
        return event => {
            let _select = event.target;
            document.querySelector("#clear").disabled = (_select.nodeValue === "security");
        };
    }

    let createGlobalToolBtns = () => {
        let globalToolBtnArray = [];
        for (let i = 0; i < props.btnList.length; ++i) {
            let item = props.btnList[i];
            let disabled = false;
            if (!checkUserClass(getRpcConfig(item.type), USER_CLASS_TYPE.write)) {
                disabled = true;
            }
            let buttonTitle = getText(item.type);
            if (!isNullOrUndefined(item.prefixTitle)) {
                buttonTitle = item.prefixTitle + " " + buttonTitle;
            }
            globalToolBtnArray.push(
                <input type="button" key={props.tableId + buttonTitle}
                       disabled={disabled} className="resetButton react-table-global-btn"
                       role="button" defaultValue={buttonTitle}
                       onClick={showResult} data={JSON.stringify(item)}/>);
        }
        return globalToolBtnArray;
    }

    let showResult = event => {
        let button = event.target;
        if (button) {
            let data = JSON.parse(button.getAttribute("data"));
            edit(data.type, data.init, data.rpctype);
        }
    }

    let clearResult = event => {
        setResult("");
    }

    let edit = (type, init, rpctype) => {
        let callback = _resultData => {
            if (_resultData.data != null) {
                let n = new Date();
                let now = new Date(n - n.getTimezoneOffset() * 60 * 1000).toISOString().replace("T", " ").substr(0, 23);
                let resultDataStr = "";
                for (let i = 0; i < _resultData.data.length; i++) {
                    let dataStr = JSON.stringify(_resultData.data[i]).replaceAll("\"", "");
                    resultDataStr += dataStr.replace(/\\n/g, "\n");
                }
                resultDataStr = resultDataStr.substr(1, resultDataStr.length - 2);
                resultDataStr = `[${now}] ` + resultDataStr + "\n";
                resultDataStr = result + resultDataStr;
                setResult(resultDataStr);
            } else {
                setResult("Commands '" + type + "' error!");
            }
        };

        if (rpctype === "call") {
            callRpc(type, init, null, callback);
        } else {
            editRpcItem(type, init, null, callback);
        }
    }

    let tableHead = "react-table-heading";
    let tablePanelBackground = " table-panel-border-show";
    let lineHeight = "";
    let filterDivClass = "";

    return (
        <div className={"table-container panel-default tablePanel" + tablePanelBackground}>
            <div className={"panel-heading panel-head-line " + tableHead}>
                <span className="iconfont icon-collapse-up3" onClick={handleCollapseClick}></span>
                {getText(props.type)}
                <div key="_init_filter_div_" className={"react-table-filter-div " + filterDivClass}>
                    <form className="form-inline" role="form">
                        <div className={"row react-table-tool-panel-btn-row intiDiv " + lineHeight}
                             key="row react-table-tool-panel-btn-row intiDiv">
                            {createGlobalToolBtns()}
                        </div>
                    </form>
                </div>
            </div>
            <div id={"react_collapse_table_body_" + "ping"}
                 className="panel-collapse collapse in react-ping-trace-tool">
                <div className="rpctool-panel-body ">
                    <div className="reactTabBox margin-20">
                        <form id="logForm" className="react-ping-trace-form">
                            <div className="form-group col-lg-12 col-md-12">
                                <div>
                                    <textarea type="text" disabled={true} rows="40"
                                              className="form-control" id="result" name="result"
                                              defaultValue={result}/>
                                </div>
                                <div
                                    className={"row react-table-tool-panel-clear-result-btn-row intiDiv " + lineHeight}
                                    key="row react-table-tool-panel-btn-row intiDiv">
                                    <input type="button" key={props.tableId + "clear"}
                                           disabled={false} className="resetButton react-table-global-btn"
                                           role="button" defaultValue={getText("clear-result")}
                                           onClick={clearResult} data={getText("clear-result")}/>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReactRpcComponent;
