import React, {useState} from "react";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import {extendCustomConfig, getHelpUrl, getText} from "../custom/utils";
import DropMenuButton from "../custom/comm/react_drop_menu";
import {default_export_config} from "../custom/comm/react_export";


export default function NEInfoWidget() {
    const systemInfo = useSelector(state => state.neinfo.dashboard ? state.neinfo.dashboard.systemInfo : null);
    const [show1, setShow1] = useState(true);
    const [show2, setShow2] = useState(true);
    const [show3, setShow3] = useState(true);

    let ospfStr = "";
    if (systemInfo && systemInfo.ospf.length > 0) {
        systemInfo.ospf.map(ospf => {
            ospfStr += "Instance-" + ospf.insId + ":  " + "Router ID - " + ospf.rtId + "\n";
        });
    } else {
        ospfStr += "Not configured";
    }

    let exportConfig = extendCustomConfig(default_export_config, {
        tableConfig: {
            tableHead: {
                "id": {
                    label: getText("ID"),

                },
                "ip": {
                    label: getText("IP"),

                },
                "software": {
                    label: getText("software"),

                },
                "version": {
                    label: getText("version"),

                },
                "dcn": {
                    label: getText("DCN"),

                },
                "ospf": {
                    label: getText("OSPF"),

                },
                "user": {
                    label: getText("user"),

                },
                "session": {
                    label: getText("session"),

                }
            },
            multiHead: {
                enabled: true,
                config: {
                    "multihead": [
                        {
                            key: "system",
                            label: getText("system"),
                            colSpan: 3,
                        },
                        {
                            key: "network",
                            label: getText("network"),
                            colSpan: 2
                        },
                        {
                            key: "security",
                            label: getText("security"),
                            colSpan: 2,
                        }
                    ]
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
                if (systemInfo !== null) {
                    showData.push({
                        "id": "1",
                        "ip": sessionStorage.neIP,
                        "software": systemInfo.swLabel,
                        "version": systemInfo.swVersion,
                        "dcn": systemInfo.dcn,
                        "ospf": ospfStr,
                        "user": systemInfo.user,
                        "session": systemInfo.session
                    });
                }
                return showData;
            },
        }
    });
    return (
        <div className="widget-wrapper NEInfoWrapper">
            <div className="widget-header">
                <span className="glyphicon glyphicon-exclamation-sign"/>
                {getText("system-properties")}
                <a href={`/webgui_help/${getHelpUrl("dashboard")}`} target="_webgui_help">
                    <span className="iconfont icon-help helpIcon tabHelpIcon"/>
                </a>
                <span className="dashboard-export">
                    <DropMenuButton tableConfig={exportConfig.tableConfig} item={exportConfig.items} type={1}
                                    pageInfo={exportConfig.dataInfo}/>
                </span>
            </div>
            <div className={"widget-content"}>
                <div className={"widget-content-frag"}>
                    <div className="widget-sub-title">
                        <div className="info-title">{"System"}</div>
                        <div className="info-button" onClick={() => setShow1(!show1)}>
                            <span className={`iconfont icon-arrow_${show1 ? "up" : "down"}`}/>
                        </div>
                    </div>
                    {show1 && <div className="widget-sub-content">
                        <table className="myTable neinfoTable">
                            <tbody className="neInfoTableBody">
                            <tr className="neInfoTableTr" title={sessionStorage.neIP}>
                                <td className="neInfoTableLabelTd">IP</td>
                                <td className="neInfoTableValueTd">
                                    {sessionStorage.neIP}
                                </td>
                            </tr>
                            <tr>
                                <td className="neInfoTableLabelTd">Software</td>
                                <td title={systemInfo ? systemInfo.swLabel : ""}>
                                    <Link
                                        key={"dashboard_system_props"}
                                        to={`/system/sw_fw`}
                                    >{systemInfo ? systemInfo.swLabel : ""}
                                    </Link>
                                </td>
                            </tr>
                            <tr>
                                <td className="neInfoTableLabelTd">Version</td>
                                <td title={systemInfo ? systemInfo.swVersion : ""}>
                                    {systemInfo ? systemInfo.swVersion : ""}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>}
                </div>
                <div className={"widget-content-frag"}>
                    <div className="widget-sub-title">
                        <div className="info-title">{"Network"}</div>
                        <div className="info-button" onClick={() => setShow2(!show2)}>
                            <span className={`iconfont icon-arrow_${show2 ? "up" : "down"}`}/>
                        </div>
                    </div>
                    {show2 && <div className="widget-sub-content">
                        <table className="myTable neinfoTable">
                            <tbody className="neInfoTableBody">
                            <tr className="neInfoTableTr">
                                <td className="neInfoTableLabelTd">DCN</td>
                                <td className="neInfoTableValueTd" title={systemInfo && systemInfo.dcn ?
                                    systemInfo.dcn : "Not configured"}>
                                    {systemInfo && systemInfo.dcn ?
                                        <Link key={"dashboard_system_props"}
                                              to={`/network/interface/?filter=if-name&value=DCN`}>{systemInfo.dcn}</Link> : "Not configured"}
                                </td>
                            </tr>
                            <tr>
                                <td className="neInfoTableLabelTd">OSPF</td>
                                <td className="neInfoTableValueTd" title={ospfStr}>
                                    {(systemInfo && (systemInfo.ospf.length > 0)) ? systemInfo.ospf.map((ospf, idx) => {
                                        return <div className="ospf-instance" key={idx}>
                                                <span
                                                    className="ospf-instance">{"Instance-" + ospf.insId + ":  "}</span>
                                            <Link key={"dashboard_system_props"}
                                                  to={`/network/routing`}>{"Router ID - " + ospf.rtId}</Link>
                                        </div>
                                    }) : "Not configured"}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>}
                </div>
                <div className={"widget-content-frag"}>
                    <div className="widget-sub-title">
                        <div className="info-title">{"Security"}</div>
                        <div className="info-button" onClick={() => setShow3(!show3)}>
                            <span className={`iconfont icon-arrow_${show3 ? "up" : "down"}`}/>
                        </div>
                    </div>
                    {show3 && <div className="widget-sub-content">
                        <table className="myTable neinfoTable">
                            <tbody className="neInfoTableBody">
                            <tr className="neInfoTableTr">
                                <td className="neInfoTableLabelTd">User</td>
                                <td className="neInfoTableValueTd" title={systemInfo ? systemInfo.user : ""}>
                                    <Link key={"dashboard_system_props"} to={`/security/user`}
                                    >{systemInfo ? systemInfo.user : ""}
                                    </Link>
                                </td>
                            </tr>
                            <tr>
                                <td className="neInfoTableLabelTd">Session</td>
                                <td title={systemInfo ? systemInfo.session : ""}>
                                    <Link
                                        key={"dashboard_system_props"}
                                        // className="iconfont icon-arrow_right"
                                        to={`/security/session`}
                                    >{systemInfo ? systemInfo.session : ""}
                                    </Link>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>}
                </div>
            </div>
        </div>
    );
};