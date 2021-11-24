import React from "react";
import {useSelector} from "react-redux";
import {extendCustomConfig, getHelpUrl, getText} from "../custom/utils";
import DropMenuButton from "../custom/comm/react_drop_menu";
import {default_export_config} from "../custom/comm/react_export";

export default function ServiceWidget() {
    const serviceUsage = useSelector(state => state.neinfo.dashboard ? state.neinfo.dashboard.serviceUsage : null);
    const xcData = serviceUsage ? serviceUsage.xc : null;
    const pgData = serviceUsage ? serviceUsage.pg : null;

    let data_keys = {
        "id": {
            label: getText("ID"),
        }
    };
    let data_values = {
        "id": "1"
    };
    let multi_head_keys = [];
    if (xcData !== null && Object.keys(xcData).length > 0) {
        let cards = Object.keys(xcData);
        let BW = Object.keys(xcData[cards[0]]);
        cards.forEach(key => {
            let total_value = 0;
            BW.forEach(bw => {
                if (!xcData.hasOwnProperty(key) || !xcData[key].hasOwnProperty(bw)) {
                    return;
                }
                let new_key = key + "_" + bw;
                data_keys[new_key] = {
                    label: getText(bw)
                };
                data_values[new_key] = "" + xcData[key][bw].count;
                total_value = total_value + xcData[key][bw].count;
            });
            let total_key = key + "_" + "total";
            data_keys[total_key] = {
                label: getText("Total")
            };
            data_values[total_key] = "" + total_value;
            multi_head_keys.push({
                key: key,
                label: "card-" + key,
                colSpan: BW.length + 1,
            });
        })

    }


    let exportConfig = extendCustomConfig(default_export_config, {
        tableConfig: {
            tableHead: data_keys,
            multiHead: {
                enabled: true,
                config: {
                    "multihead": multi_head_keys
                }
            },
            autoCreateIdCol: {
                show: true,
                label: "ID"
            }
        },
        dataInfo: {
            getShowData: () => {
                let showData = [];
                if (xcData !== null) {
                    showData.push(data_values);
                }

                return showData;
            },
        }
    });

    function getContent() {
        if (!xcData) {
            return "";
        }

        let content = [];
        for (let x = 0; x < xKeys.length; ++x) {
            if (!xcData.hasOwnProperty(xKeys[x])) continue;
            let total = Object.values(xcData[xKeys[x]]).reduce((c, v) => c + v.rate * v.count, 0) + "Gb";
            total += pgData && pgData[xKeys[x]] ? " | PG: " + pgData[xKeys[x]] : "";
            content.push(
                <div key={`total-${xKeys[x]}`} style={{gridColumnStart: x + 2, gridRowStart: 0}}
                     className="counter-total">
                    {total}
                </div>);
            for (let y = 0; y < yKeys.length; ++y) {
                if (x === 0) {
                    content.push(
                        <div key={yKeys[y]} style={{gridColumnStart: 0, gridRowStart: y + 2}}
                             className="counter-cell counter-row-header">
                            {yKeys[y]}
                        </div>
                    )
                }
                let tmp = xcData[xKeys[x]][yKeys[y]] ? xcData[xKeys[x]][yKeys[y]].count : 0;
                content.push(
                    <div key={`cell-${x}-${y}`} title={`${yKeys[y]}\n    card-${xKeys[x]}: ${tmp}`}
                         className="counter-cell" style={{gridColumnStart: x + 2, gridRowStart: y + 2}}>
                        {tmp}
                    </div>);
            }
            content.push(
                <div key={`${xKeys[x]}`} style={{gridColumnStart: x + 2, gridRowStart: yKeys.length + 2}}
                     className="counter-cell counter-column-header">
                    {xKeys[x]}
                </div>);
        }
        return content;
    }

    let xKeys = xcData ? Object.keys(xcData) : [];
    let yKeys = (xcData && xKeys[0] && xcData[xKeys[0]]) ? Object.keys(xcData[xKeys[0]]) : [];

    return (
        <div className="widget-wrapper">
            <div className="widget-header">
                <span className="glyphicon glyphicon-exclamation-sign"/>
                {getText("service-utilization")}
                <a href={`/webgui_help/${getHelpUrl("dashboard")}`} target="_webgui_help">
                    <span className="iconfont icon-help helpIcon tabHelpIcon"/>
                </a>
                <span className="dashboard-export">
                    <DropMenuButton tableConfig={exportConfig.tableConfig} item={exportConfig.items} type={1}
                                    pageInfo={exportConfig.dataInfo}/>
                </span>
            </div>
            <div className={"widget-content"}>
                <div className="widget-service" style={{
                    gridTemplateColumns: `1fr repeat(${xKeys.length}, 2fr)`,
                    gridTemplateRows: `repeat(${yKeys.length + 1}, 1fr)`
                }}>
                    {getContent()}
                </div>
            </div>
        </div>
    );
}