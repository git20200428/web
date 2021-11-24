import React from "react";
import {useSelector} from "react-redux";
import {extendCustomConfig, getHelpUrl, getText} from "../custom/utils";
import DropMenuButton from "../custom/comm/react_drop_menu";
import {default_export_config} from "../custom/comm/react_export";

export default function EntityStatusWidget() {
    const entityCount = useSelector(state => (state.neinfo && state.neinfo.dashboard) ? state.neinfo.dashboard.entityCount : null);

    let data_keys = {
        "id": {
            label: getText("ID"),
        },
        "entity": {
            label: getText("entity"),
        }
    };
    let key1 = [];
    let key2 = [];
    if (entityCount !== null) {
        for (let key in entityCount) {
            key1.push(key);
        }
        (key1.length > 0) && key1.push("total");
    }

    if (key1.length > 0) {
        if (entityCount[key1[0]]) {
            Object.keys(entityCount[key1[0]]).map(ikey => {
                key2.push(ikey);
            });
        }

        key1.map(key => {
            data_keys[key] = {
                label: getText(key)
            };
        });
    }

    let exportConfig = extendCustomConfig(default_export_config, {
        tableConfig: {
            tableHead: data_keys,
            multiHead: {
                enabled: false
            },
            autoCreateIdCol: {
                show: true,
                label: "ID"
            }
        },
        dataInfo: {
            getShowData: () => {
                let showData = [];
                if (entityCount !== null) {
                    key2.map((key, ind) => {
                        let data_values = {
                            "id": "" + (++ind)
                        };
                        data_values["entity"] = getText(key);
                        let totalValue = 0;
                        if (key !== "total") {
                            key1.map(iKey => {
                                if (iKey !== "total") {
                                    data_values[iKey] = entityCount[iKey][key].total.toString();
                                    totalValue += entityCount[iKey][key].total;
                                }
                            });
                            data_values["total"] = totalValue.toString();
                            showData.push(data_values);
                        }
                    });
                    let data_total = {};
                    data_total["id"] = "" + (showData.length + 1);
                    data_total["entity"] = getText("total");
                    let total_total = 0;
                    Object.keys(entityCount).map(key => {
                        data_total[key] = "" + entityCount[key].total;
                        total_total += entityCount[key].total;
                    });
                    data_total["total"] = "" + total_total;
                    showData.push(data_total);
                }

                return showData;
            }
        }
    });

    const xKeys = entityCount ? Object.keys(entityCount) : [];
    const yKeys = (entityCount && xKeys[0] && entityCount[xKeys[0]]) ? Object.keys(entityCount[xKeys[0]]) : [];
    function getTooltip(xKey, yKey) {
        let str = getText(yKey) + "\n    " + getText(xKey) + ": " + entityCount[xKey][yKey].total + "\n";
        for (let k in entityCount[xKey][yKey]) {
            if (k !== "total" && entityCount[xKey][yKey][k] > 0) {
                str += k + ": " + entityCount[xKey][yKey][k] + "\n"
            }
        }
        return str;
    }

    function getContent() {
        if (!entityCount) {
            return "";
        }

        let content = [];
        for (let x = 0; x < xKeys.length; ++x) {
            if (!entityCount.hasOwnProperty(xKeys[x])) continue;
            let total = entityCount[xKeys[x]].total;
            content.push(
                <div key={`total-${xKeys[x]}`} style={{gridColumnStart: x + 2, gridRowStart: 0}}
                     className={`counter-total ${xKeys[x]}-bgColor`}
                     title={`${getText(xKeys[x])}: ${total}`}
                >
                    {total}
                </div>);
            for (let y = 0; y < yKeys.length; ++y) {
                if (yKeys[y] === "total") continue;
                if (x === 0) {
                    content.push(
                        <div key={yKeys[y]} style={{gridColumnStart: 0, gridRowStart: y + 2}}
                             className="counter-cell counter-row-header">
                            {getText(yKeys[y])}
                        </div>
                    );
                }
                let tmp = entityCount[xKeys[x]][yKeys[y]] ? entityCount[xKeys[x]][yKeys[y]].total : 0;
                content.push(
                    <div key={`cell-${x}-${y}`} title={getTooltip(xKeys[x], yKeys[y])}
                         className={`counter-cell ${xKeys[x]}-bgColor`} style={{gridColumnStart: x + 2, gridRowStart: y + 2}}>
                        {tmp}
                    </div>);
            }
            content.push(
                <div key={`${xKeys[x]}`} style={{gridColumnStart: x + 2, gridRowStart: yKeys.length + 2}}
                     className="counter-cell counter-column-header">
                    {getText(xKeys[x])}
                </div>);
        }
        return content;
    }

    return (
        <div className="widget-wrapper">
            <div className="widget-header">
                <span className="glyphicon glyphicon-exclamation-sign"/>
                {getText("entity-states")}
                <a href={`/webgui_help/${getHelpUrl("dashboard")}`} target="_webgui_help">
                    <span className="iconfont icon-help helpIcon tabHelpIcon"/>
                </a>
                <span className="dashboard-export">
                    <DropMenuButton tableConfig={exportConfig.tableConfig} item={exportConfig.items} type={1}
                                    pageInfo={exportConfig.dataInfo}/>
                </span>
            </div>
            <div className={"widget-content"}>
                <div className="widget-entityStatus" style={{
                    gridTemplateColumns: `80px repeat(${xKeys.length}, minmax(80px, 1fr)`,
                    gridTemplateRows: `repeat(${yKeys.length}, 1fr)`
                }}>
                    {getContent()}
                </div>
            </div>
        </div>
    );
}