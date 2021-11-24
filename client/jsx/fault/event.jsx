import React, {Component} from "react";
import {connect} from "react-redux";
import {detailsForDataItem, relateTable} from "../custom/comm/react_common";
import {convertToArray, EditBtnState, extendCustomConfig, getText, hashCode, isEmpty, key2Name} from "../custom/utils";
import {ReactTable, TableFilterTypeEnum} from "../custom/table/react_table";
import {FormControlTypeEnum} from "../yang_user_define";
import {collapseBtnFormatter4ReactTable} from "../configuration/config_util";

class ReactEventTable extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        let isRelateTable = this.props.isRelateTable;
        let tableHashCode = hashCode(this.props.id);
        let tableConfig = {
            eachColFilter: {
                showCol: {
                    eventType: {control_Type: TableFilterTypeEnum.MultiSelect},
                    type: {control_Type: TableFilterTypeEnum.MultiSelect},
                    entityType: {control_Type: TableFilterTypeEnum.MultiSelect},
                    entity: {control_Type: TableFilterTypeEnum.MultiSelect},
                    time: {control_Type: TableFilterTypeEnum.TextInput},
                    changedby: {control_Type: TableFilterTypeEnum.MultiSelect},
                    detail: {control_Type: TableFilterTypeEnum.TextInput},
                }
            },
            tableHead: {
                "eventType": {
                    width: 80,
                    label: getText("event-type")
                },
                "type": {
                    width: 50,
                    label: getText("type")
                },
                "entityType": {
                    width: 100,
                    label: getText("entity-type")
                },
                "entity": {
                    label: getText("entity")
                },
                "time": {
                    width: 150,
                    label: getText("time")
                },
                "changedby": {
                    width: 80,
                    label: getText("changed-by")
                },
                "detail": {
                    label: getText("detail")
                }
            },
            reloadBtn: {
                enabled: false
            },
            rowEdit: [
                {
                    label: getText("detail"),
                    enabled: function (data) {
                        return EditBtnState.Normal;
                    },
                    clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                        detailsForDataItem({
                            "type": {
                                editEnable: false,
                                label: getText("type"),
                                type: FormControlTypeEnum.Text,
                                "description": "",
                                value: ""
                            },
                            "entityType": {
                                editEnable: false,
                                label: getText("entity-type"),
                                type: FormControlTypeEnum.Text,
                                "description": "",
                                value: ""
                            },
                            "entity": {
                                editEnable: false,
                                label: getText("entity"),
                                type: FormControlTypeEnum.Text,
                                "description": "",
                                value: ""
                            },
                            "time": {
                                editEnable: false,
                                label: getText("time"),
                                type: FormControlTypeEnum.Text,
                                "description": "",
                                value: ""
                            },
                            "changedby": {
                                editEnable: false,
                                label: getText("changed-by"),
                                type: FormControlTypeEnum.Text,
                                "description": "",
                                value: ""
                            },
                            "details": {
                                editEnable: false,
                                label: getText("detail"),
                                type: FormControlTypeEnum.TextArea,
                                "description": "",
                                rows: 5,
                                value: "",
                                editInitConfig: function (data, callback) {
                                    if (data != null) {
                                        callback(
                                            {
                                                "fixedValue": data["detail"]
                                            }
                                        )
                                    } else {
                                        callback({});
                                    }
                                }
                            }
                        }, data[0], "event");
                    },
                    buttonClass: {
                        normal: "row_edit_d",
                        disabled: "row_edit_d_disabled"
                    }
                },
                {
                    type: "collapse",
                    label: getText("relate"),
                    enabled: function (data) {
                        if (isRelateTable != null && isRelateTable) {
                            return EditBtnState.Hidden;
                        } else if (isEmpty(data[0]) || isEmpty(data[0].detail) || data[0].entityType === "rpc") {
                            return EditBtnState.Disabled;
                        } else {
                            return EditBtnState.Normal;
                        }
                    },
                    onClick: function (data, event) {
                        let rowData = data[0];
                        rowData["resource"] = data[0]["resource"];
                        rowData["realtype"] = "event";
                        let initKeyObj = {};
                        if (rowData.entityType === "alarm") {
                            initKeyObj = {
                                "alarm-id": rowData["entity"].split("-")[1]
                            }
                        }
                        return relateTable("alarm", rowData, initKeyObj);//fake as alarm because event is not in Yang
                    },
                    normalClass: "row_expand",
                    triggerClass: "row_contract",
                    disabledClass: "row_expand_disabled",
                    formatter: collapseBtnFormatter4ReactTable(tableHashCode),
                }
            ],
            highlightRow: {
                enabled: true,
                rules: [
                    {
                        filter: {
                            e_new: true,
                        },
                        rowClass: ' defaultHighlightRow'
                    }
                ]
            },
        };
        if (this.props.config.buttons != null) {
            tableConfig = extendCustomConfig(tableConfig, this.props.config.buttons)
        }
        let propsPushKey = [];
        let mapStateToProps = state => ({state: state.neinfo});
        if (this.props.filterKey == null) {
            propsPushKey.push("events");
        } else {
            tableConfig.isRelateTable = true;
            propsPushKey.push("eventSummary");
            propsPushKey.push(this.props.filterKey);

        }
        const ReactEventView = connect(mapStateToProps, {})(ReactTable);
        return <ReactEventView tableName={getText("event")} key={"_react_key_event_table_" + tableHashCode}
                               hashCode={tableHashCode} propsPushKey={propsPushKey}
                               buttons={this.props.config.buttons} tableDivClass="minHeight100"
                               tableInfo={getText("event")}
                               tableData={[]} id="eventTable" tableConfig={tableConfig}/>;
    }
}

let needRequirePortType = ["comm-eth", "usb"];

let eventTable = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    let filterKey = null;
    if (showPanelConfig.hasOwnProperty("showConfig")) {
        filterKey = key2Name(showPanelConfig.showConfig.containerKey, showPanelConfig.showConfig.key);
        if (needRequirePortType.indexOf(showPanelConfig.showConfig.containerKey) > -1) {
            filterKey = convertToArray(filterKey);
            filterKey.push(key2Name("port", showPanelConfig.showConfig.key))
        }
    }
    return (
        <ReactEventTable
            isRelateTable={showPanelConfig.showConfig == null ? null : showPanelConfig.showConfig.isRelateTable}
            key={"react_event_table_" + tableHashCode} id={tableHashCode} filterKey={filterKey} config={_config}
            yangConfig={yangConfig}/>
    );
}

export {eventTable as eventView};


