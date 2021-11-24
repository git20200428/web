import React, {Component} from 'react';
import dynamicPanel from "../custom/table/dynamicTable";
import {getText, handleCollapseClick, PLEASE_SELECT_VALUE} from "../custom/utils";
import "../../css/system/report.css";

class ReactReportTool extends Component {
    menuConfig = {
        "G30": {
            "Equipment": ["all-equipments","card", "slot", "port", "tom"],
            "Facility": ["all-facilities", "optical-carrier","optical-channel", "comm-channel", "otu", "odu", "ethernet", "trib-ptp","line-ptp",
            "flexo","flexo-group","eth-zr","oc","stm"],
            "PM": ["pm-control-entry-report", "pm-threshold-profile-report"],
            "SW": ["all-software-loads"],
            "Topology": ["management-address-report", "custom-tlv-report"]
        },
        "G40": {
            "Equipment": ["all-equipments","card", "slot", "port", "tom"],
            "Facility": ["all-facilities", "super-channel-group", "super-channel", "optical-carrier", "optical-channel", "comm-channel", "otu", "odu",
                "ethernet", "trib-ptp","line-ptp","flexo","flexo-group","zth-zr","oc","stm"],
            "PM": ["pm-control-entry-report", "pm-threshold-profile-report"],
            "SW": ["all-software-loads"],
            "Topology": ["management-address-report", "custom-tlv-report"]
        }

    }
    constructor(props) {
        super(props);
        this.state = {
            tableType: "",
            reactShowTable: null,
            entityList: [],
            selectedType: ""
        };
    }

    initShowPanel() {
        let tableTypes = [];
        if (this.state.tableType == "-Please Select-") {
            return null;
        } else if (this.state.tableType != "" && this.state.tableType != null) {
            tableTypes.push(this.state.tableType);
            let reactFacililtyTable = dynamicPanel(null, {
                showConfig: {
                    type: this.state.tableType,
                    buttons: {onlyBaseButtons: true}
                }
            });
            return reactFacililtyTable;
        }
    };

    handleSelectTypeValue = (event) => {
        let selectedValue = event.target.value;
        let links = [];
        if (this.menuConfig[sessionStorage.neType].hasOwnProperty(selectedValue)) {
            links.push(<option key="please-select" value={PLEASE_SELECT_VALUE}>{getText("please-select")}</option>);
            this.menuConfig[sessionStorage.neType][selectedValue].forEach(item => {
                links.push(<option key={getText(item)} value={item}>{getText(item)}</option>);
            })
        }
        this.setState({
            entityList: links,
            selectedType: selectedValue
        })
    }


    handleSetValue = (event) => {
        let selectedValue = event.target.value;
        this.setState({
            tableType: selectedValue
        });
    }

    initTypeList = () => {
        let links = [];
        links.push(<option key="please-select" value={PLEASE_SELECT_VALUE}>{getText("please-select")}</option>);
        Object.keys(this.menuConfig[sessionStorage.neType]).map(key => {
            links.push(<option key={key} value={key}>{getText(key)}</option>);
        });

        return links;
    }

    initEntityList = () => {
        if (this.state.selectedType !== "-Please Select-" && this.state.selectedType !== "") {
            return this.state.entityList;
        }
        let links = [];
        links.push(<option key="please-select" value={PLEASE_SELECT_VALUE}>{getText("please-select")}</option>);
        return links;
    }

    render() {
        let tableHead = "react-table-heading";
        let tablePanelBackground = " table-panel-border-show";
        let showPanel = this.initShowPanel();
        let entityOptionlist = this.initEntityList();
        let typeList = this.initTypeList();

        return (
            <div className={"table-container panel-default tablePanel" + tablePanelBackground}>
                <div className={"panel-heading " + tableHead}>
                    <span className="iconfont icon-collapse-up3" onClick={handleCollapseClick}></span>
                    {getText("report")}
                </div>
                <div id="react_collapse_table_body_ping"
                     className="panel-collapse collapse in react-ping-trace-tool reportToolContent">
                    <div className="reactTabBox">
                        <form id="logForm" className="react-ping-trace-form">
                            <div className="col-sm-10 padding-none">
                                <div className="form-group">
                                    <div className="my-col-sm padding-none" id="button_div">
                                        <label id="react-report-label"
                                               title="type">{getText("type")}</label>
                                        <select type="select" id="react-report-select-type" disabled={false}
                                                onChange={this.handleSelectTypeValue}>
                                            {typeList}
                                        </select>
                                        <label id="react-report-label"
                                               title="type">{getText("entity")}</label>
                                        <select type="select" id="react-report-select-entity"
                                                disabled={false} onChange={this.handleSetValue}>
                                            {entityOptionlist}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    {showPanel}
                </div>
            </div>
        );
    }
}


ReactReportTool.defaultProps = {
    yangConfig: {},
    id: "ToolView",
    Title: "Tool View"
};

let createExportReport = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    return (
        <ReactReportTool key={"react_rpc_tool_" + tableHashCode} yangConfig={yangConfig}/>
    );
}

export {createExportReport as exportReportView};
