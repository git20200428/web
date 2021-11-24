import React, {Component} from 'react';
import PropTypes from "prop-types";
import {
    ActionListener,
    convertToArray,
    currentTimeStamp,
    deepClone,
    excelCellData,
    extendCustomConfig,
    formatDate,
    getMultiHeaderTableDataKey,
    getText,
    getYangActionConfig,
    hashCode,
    icons,
    isEmpty,
    isEmptyObj,
    isFunction,
    isNullOrUndefined,
    isPositiveNum,
    nextDom,
    PLEASE_SELECT_VALUE,
    resource2KeyName,
    showAlertDialog,
    sortFunc,
    uniqueArray,
    validate
} from "../utils";
import LoadingModal from "../loading-modal";
import JSMap from "../js_map";
import {DefaultFormValidator, ModalConfigConstant, ReactModalAlert} from "../modal/react_modal"
import CommonControl from "../comm/index";
import {saveAs} from 'file-saver';
import imgWait from "../../../img/waiting.gif";
import {DataTypeEnum} from "../../tableConfig";
import ReactDOM from "react-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {EventTypeEnum, MyReactEvents} from "../message_util";
import MultiSelect from "../../components/multiSelect";
import PageInfo from "./pageinfo";
import {DialogType} from "../../components/modal/modal";
import DropMenuButton from "../comm/react_drop_menu";

let ModalBodyTypeEnum = ModalConfigConstant.ModalBodyTypeEnum;

let ReactTableEditButton = CommonControl.ReactTableEditButton;

let noneValue = "";

let SortFlag = {
    ASC: "arrow_up",
    DESC: "arrow_down",
    NONE: "none"
};

const cellClassPrefix = "table-cell-c1c-";

let TableFilterTypeEnum = {
    Select: 5,
    TextInput: 1,
    MultiSelect: 3,
    MultiSubItemsSelect: 4
};

let InnerTableFlagValue = "__infinera_inner_table_key__";

let CSV_Separator = ",";
let CSV_Newline = "\n";
let ExportContent_Head = "\uFEFF";

const minColWidth = 2;

let exportCSVFile = function (_start, tableConfig, tableData, fileName) {
    if (fileName == null) {
        fileName = ""
    }
    if (isFunction(fileName)) {
        fileName = fileName();
    }
    let loading = new LoadingModal();
    loading.show();
    let titleConfig = tableConfig.tableHead, multiHead = tableConfig.multiHead;
    let content = [];
    let titleRow = [];
    if (tableConfig.autoCreateIdCol.show) {
        titleRow.push(tableConfig.autoCreateIdCol.label);
    }
    if (!isEmptyObj(titleConfig)) {
        let key = null;
        if (!isNullOrUndefined(multiHead) && multiHead.enabled) {
            let config = multiHead.config;
            Object.keys(config).map(index => {
                let items = config[index];
                if (multiHead.hasOwnProperty("exportRows")) {
                    if (multiHead.exportRows.indexOf(index) < 0) {
                        return true;
                    }
                }
                let multiHeadRow = [];
                if (tableConfig.autoCreateIdCol.show) {
                    multiHeadRow.push("");
                }
                Object.values(items).map(item => {
                    key = item.key;
                    if (typeof (key) != "string") {
                        return true;
                    }
                    if (isNullOrUndefined(titleConfig[key])) {
                        if (item.hasOwnProperty("rowPadding")) {
                            for (let _k = 0; _k < item["rowPadding"]; _k++) {
                                multiHeadRow.push("");
                            }
                        }
                        multiHeadRow.push(item.label);
                        for (let i = 1; i < item.colSpan; i++) {
                            multiHeadRow.push("");
                        }
                    } else {
                        multiHeadRow.push("");
                    }
                });
                if (!isEmpty(multiHeadRow.join(""))) {
                    multiHeadRow.push(CSV_Newline);
                    content.push(multiHeadRow.join(CSV_Separator));
                }
            });
        }
        Object.values(titleConfig).map(item => {
            if (item.show == null || item.show) {
                titleRow.push(item.label);
            }
        });
        titleRow.push(CSV_Newline);
        content.push(titleRow.join(CSV_Separator));
        Object.values(tableData).map(rowData => {
            let dataRow = [];
            if (tableConfig.autoCreateIdCol.show) {
                dataRow.push(_start++);
            }
            Object.keys(titleConfig).map(key => {
                let item = titleConfig[key];
                if (item.show == null || item.show) {
                    let _value;
                    if (item.hasOwnProperty("cellDataFun")) {
                        _value = item["cellDataFun"](rowData, key);
                        if (typeof _value != "string") {
                            _value = rowData[key];
                        }
                    } else {
                        if (rowData[key] instanceof Array) {
                            _value = rowData[key].join(",");
                        } else {
                            _value = rowData[key];
                        }
                    }
                    if (_value == null) {
                        _value = "";
                    }
                    if (_value.indexOf("\n") > -1) {
                        _value = _value.replaceAll("\n", " ");
                    }
                    if (_value.indexOf("\-") > -1&&_value.indexOf("\-")<=2) {   //data like "1-9" will be converted to date format
                        _value=" "+_value
                    }
                    dataRow.push(_value.replaceAll(",", ";"));
                }
            });
            dataRow.push(CSV_Newline);
            content.push(dataRow.join(CSV_Separator));
        });
        content = content.join("");
    }
    // var uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURI(CSV);
    let blob = new Blob([ExportContent_Head + content], {type: "text/plain;charset=utf-8,\ufeff"});
    loading.close();
    saveAs(blob, fileName + "_" + formatDate(new Date(), "yyyyMMddHHmmss") + ".csv");
};

let exportJSONFile = function (_start, tableConfig, tableData, fileName) {
    if (fileName == null) {
        fileName = ""
    }
    if (isFunction(fileName)) {
        fileName = fileName();
    }
    let loading = new LoadingModal();
    loading.show();
    let titleConfig = tableConfig.tableHead, multiHead = tableConfig.multiHead;

    let content = [];
    let id = 0;

    Object.values(tableData).map(rowData => {
        let contentRow = {};
        Object.keys(rowData).map(key => {
            if (key === "_selected") {

            } else {

                if (!isNullOrUndefined(multiHead) && multiHead.enabled) {
                    let resourceList = multiHead["config"][0];
                    let multiTitleLine2 = multiHead["config"][1];
                    let newkey = getMultiHeaderTableDataKey(resourceList, key, multiTitleLine2);
                    contentRow[newkey] = rowData[key];
                }
            }
        });

        Object.keys(titleConfig).map(titleKey => {
            let item = titleConfig[titleKey];
            if (item.show == null || item.show) {
                let _value;
                if (item.hasOwnProperty("cellDataFun")) {
                    _value = item["cellDataFun"](rowData, titleKey);
                    if (typeof _value != "string") {
                        _value = rowData[titleKey];
                    }
                } else {
                    if (rowData[titleKey] instanceof Array) {
                        _value = rowData[titleKey].join(",");
                    } else {
                        _value = rowData[titleKey];
                    }
                }
                if (typeof _value != "string") {
                    _value = JSON.stringify(_value);
                }
                if (typeof _value == "string" && _value.indexOf("\n") > -1) {
                    _value = _value.replaceAll("\n", " ");
                }
                if (isNullOrUndefined(_value)) {
                    _value = ""
                }
                if (_value.indexOf("\"") > -1) {
                    _value = _value.replaceAll("\"", " ");
                }
                if (!isNullOrUndefined(multiHead) && multiHead.enabled) {

                } else {
                    contentRow[titleKey] = _value;
                }
            }
        });
        id++;
        contentRow["@id"] = id;
        content.push(contentRow);
    });

    let _data = {
        "data": content
    }
    let filename = fileName + "_" + formatDate(new Date(), "yyyyMMddHHmmss") + ".json"
    let blob = new Blob([JSON.stringify(_data)], {type: 'text/json'}),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a')
    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e);
    loading.close();
};

let generatePDFFile = function (titleRow, tableData, multiHeader, content, fileName, tableConfig, _start, titleConfig) {
    let loading = new LoadingModal();
    loading.show();
    let tableContent = [];

    let paperSize;
    let width = 1100;
    let height = 1500;
    if (titleRow.length > 100) {
        height = titleRow.length * 20;
        width = height / 1.4;
        paperSize = [width, height];

    } else if (titleRow.length > 80) {
        paperSize = 'a0';
    } else if (titleRow.length > 65) {
        paperSize = 'a1';
    } else if (titleRow.length > 50) {
        paperSize = 'a2';
    } else if (titleRow.length > 20) {
        paperSize = 'a3';
    } else {
        paperSize = 'a4';
    }
    if (titleRow.indexOf("Certificate Bytes") !== -1) {
        paperSize = 'a2';
    }
    let doc = new jsPDF({
        orientation: "landscape",
        //unit: "in",
        // format: ''
        format: paperSize
    })

    Object.values(tableData).map(rowData => {
        let dataRow = [];
        if (tableConfig.autoCreateIdCol.show) {
            dataRow.push(_start++);
        }
        Object.keys(titleConfig).map(key => {
            let item = titleConfig[key];
            if (item.show == null || item.show) {
                let _value;
                if (item.hasOwnProperty("cellDataFun")) {
                    if (item.hasOwnProperty("exportDataTrans")) {
                        _value = excelCellData(item["cellDataFun"]((rowData || item.noneLabel)));
                    } else {
                        _value = excelCellData((rowData[key] || item.noneLabel));
                    }
                } else {
                    if (rowData[key] instanceof Array) {
                        _value = rowData[key].join(",");
                    } else {
                        _value = rowData[key];
                    }
                }
                if (_value == null) {
                    _value = "";
                }
                if (rowData[key] instanceof Array) {
                    if (_value.indexOf("ioa-ne:") > -1) {
                        let sfList = rowData[key];
                        let sfNameArray = [];
                        for (let i = 0; i < rowData[key].length; i++) {
                            sfNameArray.push(resource2KeyName(sfList[i]))
                        }
                        _value = sfNameArray.join(",");
                    } else {
                        _value = rowData[key].join(",");
                    }

                }

                if (_value instanceof Object) {
                    _value = JSON.stringify(_value);
                }
                if (_value.indexOf("\"") > -1) {
                    _value = _value.replaceAll("\"", " ");
                }
                // if (_value.indexOf(",") > -1) {
                //     _value = '"' + _value + '"';
                // }
                if (_value.indexOf("ioa-ne:") > -1) {
                    _value = resource2KeyName(_value);
                }
                if (_value.indexOf("gx:") > -1) {
                    _value = _value.replaceAll("gx:", "");
                }
                if (_value.indexOf("ioa-pm:") > -1) {
                    _value = _value.replaceAll("ioa-pm:", "");
                }
                if (_value.indexOf("ioa-common:") > -1 || _value.indexOf("ioa-eth:") > -1) {
                    _value = _value.substring(_value.indexOf(":") + 1)
                }
                dataRow.push(_value);
            }
        });
        tableContent.push(dataRow);
        content.push(dataRow);
    });

    let columns;
    if (multiHeader.length > 0) {
        columns = multiHeader;
    } else {
        columns = [];
    }

    doc.autoTable(titleRow, tableContent,
        {
            margin: {top: 10},
            height: 'auto',
            head: columns,
            styles: {
                overflow: 'linebreak',
                fontSize: 6,
                valign: 'middle',
                lineColor: 200,
                lineWidth: 0.3,
                theme: 'grid',
                // columnStyles: {
                //     0: {cellWidth: 380},
                //     'Certificate Bytes': {cellWidth: 650},
                //     // "certificate-bytes": {cellWidth: 80}
                // }
                //    1: {cellWidth: 50},
            },
            // columnStyles: {
            //     0: {cellWidth: 8},
            //     // 1: {cellWidth: 650},
            //     // 13: {cellWidth: 650},
            //      "certificate-bytes": {cellWidth: 500}
            // }

        });

    content = content.join("");

    loading.close();
    doc.save(fileName + "_" + formatDate(new Date(), "yyyyMMddHHmmss") + ".pdf");
}

function getEditTdWidth(tableConfig) {
    let rowEdit = tableConfig.rowEdit;
    let rowEditColWidth = 0;
    if (rowEdit && rowEdit.length > 0) {
        rowEditColWidth += rowEdit.length * 18;
    }
    if (tableConfig.isRelateTable) {
        rowEditColWidth += 18;
    }
    if (rowEditColWidth) {
        rowEditColWidth += 18;
    }
    return rowEditColWidth;
}

let exportPDFFile = function (_start, tableConfig, tableData, fileName) {
    if (fileName == null) {
        fileName = ""
    }
    if (isFunction(fileName)) {
        fileName = fileName();
    }
    // let loading = new LoadingModal();
    let titleConfig = tableConfig.tableHead, multiHead = tableConfig.multiHead;

    let content = [];
    let titleRow = [];
    if (tableConfig.autoCreateIdCol.show) {
        titleRow.push(tableConfig.autoCreateIdCol.label);
    }
    if (!isEmptyObj(titleConfig)) {
        let key = null;
        let multiHeader = [];
        if (!isNullOrUndefined(multiHead) && multiHead.enabled) {
            let config = multiHead.config;
            let addID = false;
            Object.keys(config).map(index => {
                let items = config[index];
                if (multiHead.hasOwnProperty("exportRows")) {
                    if (multiHead.exportRows.indexOf(index) < 0) {
                        return true;
                    }
                }

                let multiHeadRow = [];
                let multiHeadRowObj = {}
                if (!addID) {      //ID Column
                    multiHeadRowObj.content = "ID";
                    multiHeadRowObj.colSpan = 1;
                    multiHeadRowObj.rowSpan = multiHead.config.length;
                    multiHeadRowObj.styles = {valign: 'middle', halign: 'center'};
                    multiHeadRow.push(multiHeadRowObj);
                    addID = true;
                }

                Object.values(items).map(item => {
                    key = item.key;
                    let multiHeadRowObj = {};
                    if (isNullOrUndefined(titleConfig[key])) {
                        if (!isNullOrUndefined(item.label)) {
                            multiHeadRowObj.content = item.label;
                            multiHeadRowObj.colSpan = item.colSpan;
                            multiHeadRowObj.rowSpan = item.rowSpan;
                            multiHeadRowObj.styles = {valign: 'middle', halign: 'center'};

                            multiHeadRow.push(multiHeadRowObj);
                        }

                    } else {
                        if (!isNullOrUndefined(item.label) || !isNullOrUndefined(item.key)) {
                            if (!isNullOrUndefined(item.label)) {
                                multiHeadRowObj.content = item.label;
                            } else {
                                multiHeadRowObj.content = item.key;
                            }
                            multiHeadRowObj.colSpan = item.colSpan;
                            multiHeadRowObj.rowSpan = item.rowSpan;
                            multiHeadRowObj.styles = {valign: 'middle', halign: 'center'};
                            multiHeadRow.push(multiHeadRowObj);
                        }

                    }
                });
                if (multiHeadRow.length >= 1) {
                    multiHeader.push(multiHeadRow);
                }

            });
        }
        Object.values(titleConfig).map(item => {
            if (item.show == null || item.show) {
                titleRow.push(item.label);
            }
        });
        titleRow.push(CSV_Newline);
        content.push(titleRow.join(CSV_Separator));


        let config = {
            dialogType: DialogType.WARNING,
            showText: "Exporting too much data to PDF may not fit whole PDF page!",
            okCallBack: function () {
                generatePDFFile(titleRow, tableData, multiHeader, content, fileName, tableConfig, _start, titleConfig);
            },
            closeCallBack: function () {

            }
        }
        if (titleRow.length > 50) {
            showAlertDialog(config);
        } else {
            generatePDFFile(titleRow, tableData, multiHeader, content, fileName, tableConfig, _start, titleConfig);
        }
    }
};

let DefaultTableConfig = {
    defaultTableFilter: {},
    //  {
    //     [key] : {
    //         value : [value] ,
    //         type : [type]
    //     }
    //  }
    defaultTableInitFilter: {},
    defaultTableSelected: {},
    oddAndEven: {
        enabled: true,
        oddTrClass: "oddTrClass",
        evenTrClass: "evenTrClass"
    },
    footPanel: {
        show: true
    },
    headPanel: {
        show: true
    },
    tableHeadEdit: {},
    headInitPanel: {
        show: false,
        defaultFirstOptionLabel: "please-select",
        loadBtn: {
            label: "load"
        },
        defineButtons: [],
        items: {
            /**
             * key : {
             *      firstOptionLabel : ""
             *      show :
             *      label : "",
             *      control_Type : ""
             * }
             */
        }
    },
    pageBtn: {
        show: true
    },
    colSort: {
        enabled: true
    },
    pageSize: {
        show: true,
        option: [10, 20, 50, 100],
        defaultSize: 20
    },
    leftBottomInfo: {
        show: true,
        label: "message.page"
    },
    firstAndLast: {
        show: true,
        firstLabel: "<<",
        lastLabel: ">>"
    },
    previousAndNext: {
        show: true,
        previousLabel: "<",
        nextLabel: ">"
    },
    setPageSelect: {
        show: true
    },
    highlightRow: {
        enabled: false,
        rowClass: "",
        filter: {}
    },
    autoCreateIdCol: {
        show: true,
        label: "",
        width: 30
    },
    showTableBody: true,
    showTableHead: true,
    showTableFoot: false,
    eachColFilter: {
        show: true,
        firstOptionLabel: "label.all",
        showCol: {}
        // { col1 : {
        //  control_Type :
        //  data_Type :
        //  data_Fun :
        // } }
    },
    resetButton: {
        show: true,
        resetButtonLabel: "label.reset"
    },
    multiHead: {
        enabled: false,
        config: [
            []
        ]
    },
    showIDCol: true,
    tableHead: {},
    allTableHead: {},
    showColumnLine: true,
    trDBlClickFun: function () {
        return false;
    },
    trClickFun: function () {
        return false;
    },
    customRow: {
        enabled: false,
        flagList: [  // "attribute","value"
        ],
        getCustomFun: function (data) {
        }
    },
    export: {
        enabled: true,
        export_list: {
            enabled: true,
            label: "export",
            buttonClass: {
                normal: "table_export_csv",
                disabled: "table_export_csv_disabled"
            }
        },
        export_csv: {
            enabled: true,
            buttonLabel: "export",
            label: "export_csv",
            clickFunction: function (initDate, showDate, SelectedData, tableConfig) {
                let title = this.props.tableTitle;
                if (isNullOrUndefined(title)) {
                    title = this.props.tableInfo;
                } else if (title.indexOf(" ") !== -1) {
                    title = title.replaceAll(" ", "-");
                    title = title.toLowerCase();
                }
                exportCSVFile(1, tableConfig, showDate, title);
            },
            buttonClass: {
                normal: "table_export_csv",
                disabled: "table_export_csv_disabled"
            }
        },
        export_pdf: {
            enabled: true,
            buttonLabel: "export",
            label: "export_pdf",
            clickFunction: function (initDate, showDate, SelectedData, tableConfig) {
                let title = this.props.tableTitle;
                if (isNullOrUndefined(title)) {
                    title = this.props.tableInfo;
                } else if (title.indexOf(" ") !== -1) {
                    title = title.replaceAll(" ", "-");
                    title = title.toLowerCase();
                }
                exportPDFFile(1, tableConfig, showDate, title);
            },
            buttonClass: {
                normal: "table_export_csv",
                disabled: "table_export_csv_disabled"
            }
        },
        export_json: {
            enabled: true,
            buttonLabel: "export",
            label: "export_json",
            clickFunction: function (initDate, showDate, SelectedData, tableConfig) {
                let title = this.props.tableTitle
                if (isNullOrUndefined(title)) {
                    title = this.props.tableInfo;
                } else if (title.indexOf(" ") !== -1) {
                    title = title.replaceAll(" ", "-");
                    title = title.toLowerCase();
                }
                exportJSONFile(1, tableConfig, showDate, title);
            },
            buttonClass: {
                normal: "table_export_csv",
                disabled: "table_export_csv_disabled"
            }
        },
    },
    reloadBtn: {
        id: "_reload_btn",
        enabled: true,
        label: "reload",
    },
    globalEdit: [],
    rowEdit: [],
    // autoSetTableColSize: true
};

const INIT_MULTI_SELECT = "initMultiSelect_";

class ReactTable extends Component {
    unmount = false;

    constructor(props) {
        super(props);
        let tableConfig = extendCustomConfig(DefaultTableConfig, this.props.tableConfig);
        let pageInfo = props.pageInfo;
        if (isNullOrUndefined(pageInfo)) {
            pageInfo = new PageInfo();
            pageInfo.init(this.props.tableData, tableConfig);
        }
        this.initTableHead(tableConfig);
        let defaultTableInitFilter = {};
        if (!isEmptyObj(tableConfig.defaultTableInitFilter)) {
            defaultTableInitFilter = tableConfig.defaultTableInitFilter;
        }
        if (this.props.callbackFun) {
            this.props.callbackFun(this);
        }
        this.state = {
            tableData: this.props.tableData,
            tableName: this.props.tableName,
            pageInfo: pageInfo,
            tableConfig: tableConfig,
            defaultTableInitFilter: deepClone(defaultTableInitFilter),
            initFilterInfo: defaultTableInitFilter,
            initLoaData: false,
            refresh: 0,
            initFilterData: this.props.initFilterData,
            resize: currentTimeStamp(),
            loading: false,
            validateMsg: {},
            selectedData: []
        };

        this.reactTreeTableViewDiv = React.createRef();
        this.initPanelFormRef = React.createRef();
        this.initMultiSelectRefs = {};
        if (this.state.tableConfig.hasOwnProperty("headInitPanel")) {
            Object.keys(this.state.tableConfig.headInitPanel).forEach(key => {
                this.initMultiSelectRefs[key] = INIT_MULTI_SELECT + key;
            });
        }

        this.resizeTd = {
            resizing: false,
            obj: null,
            oldWidth: 0,
            xStart: 0
        };

        this.isDBClick = false;
        this.isShiftClick = false;
        this.isCtrlClick = false;
    }

    handleUpdateInitFilterFun = (_type, _key, _fType) => {
        return (event) => {
            switch (_type) {
                case PageInfo.UpdateFlag.InitLoad :
                    this.loadOrClearInitData(true);
                    break;
                case PageInfo.UpdateFlag.InitClear :
                    this.loadOrClearInitData(false);
                    break;
                case PageInfo.UpdateFlag.AddFilter :
                    this.addInitFilter(_key, _fType, event);
                    break;
            }
        };
    }

    loadOrClearInitData = (initLoadData) => {
        this.setState({
            loading: true,
        });
        let tableData = [];
        if (initLoadData) {
            if (this.props.loadMask) {
                this.props.getDataFun.call(this, this.state.initFilterInfo, this.loadData);
                return;
            } else {
                tableData = this.props.getDataFun.call(this, this.state.initFilterInfo);
            }
        }
        this.loadData(tableData, initLoadData);
    }

    setInitFilterData = (initFilterData) => {
        if (!isNullOrUndefined(initFilterData)) {
            this.setState({
                initFilterData: initFilterData
            })
        }
    }

    loadData = (tableData, initLoadData,tableName) => {
        if (tableData == null || this.unmount) {
            this.updateLoadingState(false);
            return;
        }
        if (isNullOrUndefined(initLoadData)) {
            initLoadData = false;
        }
        let pageInfo = this.state.pageInfo;
        pageInfo.setNewPageData(tableData, 1);
        let state = {
            tableData: tableData,
            initLoaData: initLoadData,
            pageInfo: pageInfo,
            loading: false,
        };
        if(tableName) {
            state.tableName = tableName;
        }
        this.setState(state);
        this.updateLoadingState(false);
    }

    updateLoadingState = (state) => {
        if (this.props.propsPushKey.length > 1) {
            return;
        }
        let loadingDiv = document.getElementsByClassName("loading_div_" + this.props.hashCode)[0];
        if (loadingDiv != null) {
            if (state) {
                let img = document.createElement("img");
                img.src = imgWait;
                loadingDiv.append(img);
                loadingDiv.style.display = "block";
            } else {
                if (loadingDiv.firstChild != null) {
                    loadingDiv.firstChild.remove();
                    loadingDiv.style.display = "none";
                }
            }
        }
    }

    addInitFilter(_key, _fType, event) {
        let initFilterInfo = this.state.initFilterInfo;
        let value = event.target.value;
        if (value == null) {
            value = event.target.getAttribute("value");
        }
        if (_fType === TableFilterTypeEnum.TextInput && this.state.initFilterData != null) {
            if (this.state.initFilterData[_key] == null) {
                this.state.initFilterData[_key] = new JSMap();
            }
            this.state.initFilterData[_key].put(_key, value);
        }
        if (isNullOrUndefined(value) || value === "") {
            delete initFilterInfo[_key];
        } else {
            initFilterInfo[_key] = value;
        }
        this.setState({
            initFilterInfo: initFilterInfo
        });
    }

    updateData = () => {
        if (this.state.tableConfig.reloadFunc) {
            this.state.tableConfig.reloadFunc();
        } else {
            let update = (newData,tableName) => {
                let pageInfo = this.state.pageInfo;
                pageInfo.setNewPageData(newData);
                let state = {
                    tableData: newData,
                    pageInfo: pageInfo
                };
                if(tableName) {
                    state.tableName = tableName;
                }
                this.setState(state);
            }

            if (this.props.propsPushKey.length > 0) {
                let newData = this.getPropsStateData();
                if (newData == null) {
                    newData = [];
                }
                update(newData);
            } else {
                this.props.getDataFun(this.state.initFilterInfo, (newData,empty,tableName) => {
                    update(newData,tableName);
                });
            }
        }
    }

    updateDataReload(newData) {
        return () => {
            let pageInfo = this.state.pageInfo;
            pageInfo.setNewPageData(newData);
            this.setState({
                tableData: newData,
                pageInfo: pageInfo
            });
        };
    }

    initTableHead(tableConfig) {
        if (!isEmptyObj(tableConfig.tableHead)) return;
        if (this.state == null) return;
        let data = this.state.tableData;
        if (data || !(data instanceof Array) || data.length === 0) return;
        data = data[0];
        let tableHead = {};
        Object.keys(data).map(key => {
            tableHead[key] = {
                label: key,
                show: true
            };
        });
        tableConfig.tableHead = tableHead;
    }

    handleTableHeadMouseDown = () => {
        return event => {
            this.openTableMenu(event);
        };
    };

    handleColResizeMouseDown = event => {
        const span = event.target;
        const td = span.parentElement;
        this.resizeTd.obj = td;
        this.resizeTd.oldWidth = td.clientWidth;
        this.resizeTd.xStart = event.clientX;
        this.resizeTd.resizing = true;
        document.addEventListener("mousemove", this.handleColResizeMouseMove);
        document.addEventListener("mouseup", this.handleColResizeMouseUp);
    }

    handleColResizeMouseUp = () => {
        this.resizeTd.obj = null;
        this.resizeTd.oldWidth = 0;
        this.resizeTd.xStart = 0;
        this.resizeTd.resizing = false;
        document.removeEventListener("mousemove", this.handleColResizeMouseDown);
        document.removeEventListener("mouseup", this.handleColResizeMouseUp);
    }

    handleColResizeMouseMove = event => {
        if (!this.resizeTd.resizing || this.resizeTd.obj == null) {
            return;
        }
        let resizeTdWidth = this.resizeTd.oldWidth;
        let td = this.resizeTd.obj;
        let xStart = this.resizeTd.xStart;
        let xEnd = event.clientX;
        let resize = xEnd - xStart;
        resizeTdWidth += resize - 1;
        if (resizeTdWidth < minColWidth) {
            resizeTdWidth = minColWidth;
        }

        let tableConfig = this.state.tableConfig;

        // remove resizeWidth for current cell
        let key = td.getAttribute("data-index");
        let config = tableConfig.tableHead[key];
        delete config.resizeWidth;
        delete config.unresizeWidth;

        // remove resizeWidth after moving cell
        let nextTd = td.nextElementSibling;
        let unsetWidth = 0;
        while (nextTd) {
            key = nextTd.getAttribute("data-index");
            if (key && tableConfig.tableHead[key]) {
                config = tableConfig.tableHead[key];
                if (config.resizeWidth) {
                    config.width = config.resizeWidth;
                    delete config.resizeWidth;
                }
                delete config.unresizeWidth;
                if (!config.hasOwnProperty("width")) {
                    unsetWidth += minColWidth + 1;
                }
            }
            nextTd = nextTd.nextElementSibling;
        }

        // fix columns before moving cell
        let prevTd = td.previousSibling;
        while (prevTd) {
            let key = prevTd.getAttribute("data-index");
            if (key && tableConfig.tableHead[key] && !tableConfig.tableHead[key].minWidth && !tableConfig.tableHead[key].resizeWidth) {
                tableConfig.tableHead[key].resizeWidth = parseInt(window.getComputedStyle(prevTd).width.replace("px", "")) - 1;
            }
            prevTd = prevTd.previousSibling;
        }

        if (td.colSpan > 1 && tableConfig.multiHead && tableConfig.multiHead.enabled) {
            // multi headers
            let cellResizing = resizeTdWidth / td.colSpan;
            for (let config of tableConfig.multiHead.config) {
                for (let item of config) {
                    if (!item.hasOwnProperty("colSpan") && item.id && item.id.match(td.id)) { // find it
                        tableConfig.tableHead[item.key].width = cellResizing;
                    }
                }
            }
        } else {
            let totalMinWidth = tableConfig.rownumbers ? 29 : 0;
            for (let key in tableConfig.tableHead) {
                let config = tableConfig.tableHead[key];
                if (config.resizeWidth) {
                    totalMinWidth += config.resizeWidth + 1;
                }
            }
            totalMinWidth += unsetWidth;
            let rowEditColWidth = getEditTdWidth(this.state.tableConfig);
            totalMinWidth += rowEditColWidth;
            let totalWidth = parseFloat(window.getComputedStyle(this.reactTreeTableViewDiv.current).width.replace("px", ""));
            if (totalMinWidth + resizeTdWidth > totalWidth) {
                resizeTdWidth = totalWidth - totalMinWidth - 1;
            }

            // find resizing cell and set width/minWidth
            let tdKey = td.getAttribute("data-index");
            for (let key in tableConfig.tableHead) {
                if (tdKey === key) {
                    tableConfig.tableHead[key].resizeWidth = resizeTdWidth;
                    break;
                }
            }
        }

        // resize other columns
        this.setState({
            tableConfig: tableConfig
        });
    }

    setCheckBoxState(key, state) {
        let tableConfig = this.state.tableConfig;
        tableConfig.tableHead[key].show = Boolean(state);
        if (tableConfig.multiHead.enabled) {
            let multiConf = tableConfig.multiHead.config;
            Object.values(multiConf).forEach(confs => {
                Object.values(confs).map(conf => {
                    if (!isEmpty(conf.items)) {
                        let colSpan = 0;
                        Object.values(conf.items).map(item => {
                            if (!isNullOrUndefined(tableConfig.tableHead[item]) && (isNullOrUndefined(tableConfig.tableHead[item].show) || tableConfig.tableHead[item].show)) {
                                colSpan++;
                            }
                        });
                        conf.colSpan = colSpan;
                    }
                });
            });
        }
        this.setState({
            tableConfig: tableConfig,
        });
    }

    openTableMenu(event) {
        if (event.button !== 2) return;
        let _this = this;
        let menuItem = [
            {
                id: 1,
                label: "Hidden",
                clickFun: function () {
                    let modalConfig = {
                        head: {
                            title: getText("label.show_column")
                        },
                        body: {
                            bodyContentType: ModalBodyTypeEnum.Custom
                        },
                        foot: {
                            show: false,
                            buttons: []
                        }
                    };
                    let diagramPanel = <TableHeadEdit tableConfig={_this.state.tableConfig}
                                                      setCheckBoxState={_this.setCheckBoxState}/>;
                    ReactDOM.render(<ReactModalAlert modalConfig={modalConfig}
                                                     customPanel={diagramPanel}/>, document.getElementById("additionalContent1"));
                }
            }
        ];
        MouseRightMenu.show(menuItem, event);
    }

    handleUpdatePageInfo = (_type, _key, _fType) => {
        return (event) => {
            let pageInfo = this.state.pageInfo;
            let value;
            if (_fType === TableFilterTypeEnum.MultiSelect || _fType === TableFilterTypeEnum.MultiSubItemsSelect) {
                value = event.target.value;
            } else {
                value = event.target.value || event.target.getAttribute("value");
            }
            if (_type === PageInfo.UpdateFlag.PageSize) {
                pageInfo.setPageSize(value);
            } else if (_type === PageInfo.UpdateFlag.CurrentPage) {
                pageInfo.setCurrentPage(value);
            } else if (_type === PageInfo.UpdateFlag.AddFilter) {
                pageInfo.addFilter(_key, value, _fType);
            } else if (_type === PageInfo.UpdateFlag.ResetFilter) {
                pageInfo.resetFilter();
            } else if (_type === PageInfo.UpdateFlag.SortData_ASC) {
                pageInfo.setSort(_key, SortFlag.ASC);
            } else if (_type === PageInfo.UpdateFlag.SortData_DESC) {
                pageInfo.setSort(_key, SortFlag.DESC);
            } else if (_type === PageInfo.UpdateFlag.SortData_NONE) {
                pageInfo.setSort(_key, SortFlag.NONE);
            } else if (_type === PageInfo.UpdateFlag.ChangeSelected) {
                pageInfo.changeSelectedState(_key);
            }
            this.setState({
                pageInfo: pageInfo
            });
        }
    };

    getPropsStateData = () => {
        let _keys = this.props.propsPushKey;
        let newData = this.props.state[_keys[0]];
        let rsData = [];
        if (_keys.length > 1) {
            for (let i = 1; i < _keys.length; i++) {
                let _tmp = convertToArray(_keys[i]);
                for (let j = 0; j < _tmp.length; j++) {
                    if (newData.hasOwnProperty(_tmp[j])) {
                        rsData = rsData.concat(newData[_tmp[j]])
                    }
                }
            }
        } else {
            rsData = newData;
        }
        return rsData;
    }

    filterOnChange = (getNewDataFun) => {
        if (isFunction(getNewDataFun)) {
            getNewDataFun(this.state.initFilterData, this.state.initFilterInfo, function (initFilterData) {
                this.setState({
                    initFilterData: initFilterData
                })
            }.bind(this))
        }
    }

    render() {
        let additionCss = "";
        if (this.props.buttons != null &&
            ((this.props.buttons.noButtons != null && this.props.buttons.noButtons)
                || (this.props.buttons.headButtons != null && !this.props.buttons.headButtons))) {
            additionCss = "no_head_treeTable_panel";
        }
        let tableDivClass = "table-container " + additionCss;
        if (isEmpty(this.state.tableData)) {
            return (<div className={tableDivClass}>Data is empty!</div>);
        }
        if (this.props.propsPushKey.length > 0) {
            if (this.state.pageInfo != null) {
                let pageInfo = this.state.pageInfo;
                let _newData = this.getPropsStateData();
                if (_newData == null) {
                    _newData = [];
                }
                pageInfo.setNewPageData(_newData, this.currentPage);
            }
        }

        let multiHeadClass = (this.state.tableConfig && this.state.tableConfig.multiHead && this.state.tableConfig.multiHead.enabled) ? "scroll-enable" : "";

        let noColumnLine = !(this.state.tableConfig.showColumnLine) ? "noColumnLine" : "";
        return (
            <div className={tableDivClass + " panel-default table-panel-border-show"} ref={this.react}>
                <div className="panel-heading react-table-heading react-table-heading-bootstrap-css-clear">
                    {this.ReactTableHeading()}
                </div>
                <div id={"react_collapse_table_body_" + this.props.id}
                     className={"panel-collapse collapse in " + multiHeadClass} ref={this.reactTreeTableViewDiv}>
                    <table data-table-id={this.props.hashCode}
                           className={"myTable " + (!multiHeadClass ? "normalTable" : "") + " table" + this.props.hashCode + " " + noColumnLine}>
                        {this.ReactTableHead()}
                        {this.ReactTableBody()}
                    </table>
                </div>
                <div className={"loading_content loading_div_" + this.props.hashCode}></div>
                {this.ReactDynamicStyle()}
                <ReactTableFoot {...this.props} {...this.state}
                                handleUpdatePageInfo={this.handleUpdatePageInfo}/>
            </div>
        );
    }

    refreshRowData(rowObj) {
        if (isNullOrUndefined(rowObj)) {
            this.setState({
                    refresh: currentTimeStamp()
                }
            )
        } else {
            let tableData = deepClone(this.state.tableData),
                tableConfig = this.state.tableConfig;
            let tableHead = tableConfig.tableHead,
                dataId = rowObj["@id"], rowData = rowObj;
            Object.keys(tableHead).map(index => {
                if (!isNullOrUndefined(rowObj[index])) {
                    rowObj[index] = (rowData[index] || rowObj[index]);
                }

            });
            tableData[dataId - 1] = rowObj;
            this.updateDataReload(tableData)()
        }
    }

    componentDidMount() {
        if (this.props.getDataFun != null && (this.props.initLoadData == null || this.props.initLoadData)) {
            this.updateLoadingState(true);
            this.props.getDataFun.call(this, this.state.initFilterInfo, this.loadData);
        }
        // this.props.getDataFun(this, this.state.initFilterInfo, this.loadData);  //init the table data.
        if (this.props.initFilterDataFun != null) {    //init filter panel.
            this.props.initFilterDataFun(this, {}, this.setInitFilterData);
        }
        MyReactEvents.registerEvent(EventTypeEnum.RefreshTableData.format(this.props.hashCode), this.props.hashCode, this, this.updateData);
        MyReactEvents.registerEvent(EventTypeEnum.RefreshTableRow.format(this.props.hashCode), this.props.hashCode, this, this.refreshRowData);
        if (!isEmpty(this.props.registerEventName)) {
            MyReactEvents.registerEvent(this.props.registerEventName, this.props.hashCode, this, (this.props.registerEventFun || noop));
        }

        if (!isNullOrUndefined(this.state.initFilterInfo) && this.state.initFilterInfo._load) {
            this.state.initFilterInfo.removeAttribute("_load");
            this.handleLoadDataBtnClick();
        }

        this.resizeTable();
        window.addEventListener("resize", this.resizeTable);
    }

    componentWillUnmount() {
        this.unmount = true;
        MyReactEvents.unRegisterEvent(EventTypeEnum.RefreshTableData.format(this.props.hashCode), this.props.hashCode);
        // MyReactEvents.unRegisterEvent(EventTypeEnum.RefreshTableData4Notif, this.props.hashCode);
        MyReactEvents.unRegisterEvent(EventTypeEnum.RefreshTableRow.format(this.props.hashCode), this.props.hashCode);
        if (!isEmpty(this.props.registerEventName)) {
            MyReactEvents.unRegisterEvent(this.props.registerEventName, this.props.hashCode);
        }
    }

    createHeadIdTd(conf) {
        conf = conf || {};
        let tableConfig = this.state.tableConfig,
            isAutoCreateIdCol = !isEmptyObj(tableConfig.autoCreateIdCol) && tableConfig.autoCreateIdCol.show;
        return (
            <td key="RowNumber" rowSpan={conf.rowSpan} colSpan={conf.colSpan}>
                <div className={"rownumber" + this.props.hashCode}>
                    {isAutoCreateIdCol ? tableConfig.autoCreateIdCol.label : ""}
                </div>
            </td>);
    }

    createMultiSelectFilter(key) {
        let optionList = [],
            tableData = this.state.pageInfo.initData,
            optionValueList = [],
            tableConfig = this.state.tableConfig.tableHead,
            noneValue = "",
            headConfig = tableConfig[key];
        if (!isEmpty(headConfig) && headConfig.hasOwnProperty("noneLabel")) {
            noneValue = tableConfig[key].noneLabel;
        }
        tableData.forEach(data => {
            if (optionValueList.indexOf(data[key]) === -1) {
                optionValueList.push(data[key])
            }
        });

        let dataFun = null;
        if (headConfig != null && headConfig.hasOwnProperty("cellDataFun") && typeof headConfig["cellDataFun"] === "function") {
            dataFun = headConfig["cellDataFun"];
        }
        let titleMapping = {};
        tableData.forEach((data) => {
            let _value = data[key];
            let _title = _value;

            if (_value instanceof Array) {
                optionValueList.push(_value.join(","));
                _title = _value.join(",")

            } else {
                optionValueList.push(_value)
            }

            if (dataFun != null) {
                let newTitle = dataFun(data, key);
                if (typeof (newTitle) == "string") {
                    _title = newTitle;
                }
            }

            titleMapping[_value] = _title;
        });
        optionValueList = uniqueArray(optionValueList);
        let sortOptionValueList = optionValueList.sort(sortFunc);
        Object.keys(sortOptionValueList).map(i => {
            let data = sortOptionValueList[i];
            data = data || noneValue;
            if (data === "") {
                return;
            }
            optionList.push(<option key={key} value={data}
                                    title={titleMapping[data]}>{titleMapping[data]}</option>);
        });
        let obj = {};
        Object.keys(sortOptionValueList).map(i => {
            let data = sortOptionValueList[i];
            data = data || noneValue;
            if (data === "") {
                return;
            }
            obj[titleMapping[data]] = data;
        });
        let defaultValue = this.state.pageInfo.filter ? this.state.pageInfo.filter[key] || [] : [];
        return <MultiSelect keyValue={key} initData={obj} wrapClass="filter-multi-wrapper" borderClass=""
                            initMultiSelectRefs={this.initMultiSelectRefs}
                            defaultValue={defaultValue} disabled={1}
                            handleSetValue={this.handleUpdatePageInfo(3, key, 3)}
        />;
    }

    createFilter(key) {
        let filterShow = "";
        let eachColFilter = this.state.tableConfig.eachColFilter;
        let filterClass = "normal";
        if (!isEmpty(this.state.pageInfo.filter[key])) {
            filterClass = "filter";
            filterShow = "filterButton-show";
        }
        if (eachColFilter != null && eachColFilter.show) {
            let showCol = eachColFilter.showCol;
            if (!isEmptyObj(showCol[key])) {
                let filterControl = this.createFilterControl(key);
                return <div className="react-filter-div">
                    <a className={"filterButton " + filterShow} role="button" onClick={this.handleFilterBtnClick}>
                        <i className={"iconfont icon-filter flex flex-justify-center flex-align-center " + filterClass}/>
                    </a>
                    {filterControl}
                </div>;
            }
        }
        return "";
    }

    handleThClickFunc(key, classStr) {
        return (event) => {
            //------------close the relate table----
            let list1 = document.querySelectorAll("table[data-table-id='" + this.state.tableConfig.tableKey + "'] tr.react-table-edit-row div.collapse.in");
            for (let i = 0; i < list1.length; i++) {//collapse other expand div
                let divId = list1[i].id;
                list1[i].classList.remove("in");
                if (i === 0 && (divId != null && document.getElementById(divId) != null)) {
                    ReactDOM.unmountComponentAtNode(document.getElementById(divId));
                }
            }
            //-------------------------------------
            let sortEnabled = this.state.tableConfig.colSort.enabled;
            if (!sortEnabled) {
                return;
            }
            if (this.state.tableConfig.colSortColumn != null
                && this.state.tableConfig.colSortColumn.indexOf(key) < 0) {
                return;
            }
            //sort
            if (classStr === SortFlag.NONE) {
                this.handleUpdatePageInfo(PageInfo.UpdateFlag.SortData_ASC, key)(event);
            } else if (classStr === SortFlag.ASC) {
                this.handleUpdatePageInfo(PageInfo.UpdateFlag.SortData_DESC, key)(event);
            } else if (classStr === SortFlag.DESC) {
                this.handleUpdatePageInfo(PageInfo.UpdateFlag.SortData_NONE, key)(event);
            }
        };
    }

    /**
     *
     * @param {*} key
     * @param {*} config
     * @param {*} pageInfo
     * @param {*} multiConf
     * @param {*} lastColumn Last element in tableHead
     */
    createHeadTd(key, config, pageInfo, multiConf, lastColumn) {
        multiConf = multiConf || {};
        if (isEmpty(config)) {
            if (multiConf.colSpan === 0) {
                return;
            }
            return (
                <td key={key} id={multiConf.id || ""} data-index={key}
                    className={"title-" + this.props.hashCode + "-" + hashCode(key)}
                    rowSpan={multiConf.rowSpan || ""}
                    colSpan={multiConf.colSpan || ""}
                    title={multiConf.title ? multiConf.title : multiConf.label}
                    onMouseDown={this.handleTableHeadMouseDown}
                    onMouseMove={this.handleColResizeMouseMove}
                    onMouseUp={this.handleColResizeMouseUp}>
                    <div
                        className={(multiConf.className != null ? multiConf.className : "react-table-td-value-div") + " "}>
                        {multiConf.label}
                    </div>
                    {lastColumn ? "" : (
                        <span className="table-col-resize" onMouseDown={this.handleColResizeMouseDown}> &nbsp; </span>)}
                </td>
            );
        } else if (config.hasOwnProperty("show") && !config.show) {
            return null;
        }
        let label = config.label;
        let classStr = null;
        if (!isEmpty(pageInfo.sort)) {
            classStr = pageInfo.sort[key] || SortFlag.NONE;
        }
        //add filter
        let filterSpan = this.createFilter(key);
        return (<td key={key} className={"title-" + this.props.hashCode + "-" + hashCode(key)}
                    data-index={key}
                    onMouseDown={this.handleTableHeadMouseDown}
                    onMouseMove={this.handleColResizeMouseMove}
                    onMouseUp={this.handleColResizeMouseUp}
                    rowSpan={multiConf.rowSpan} colSpan={multiConf.colSpan}
                    id={config.id}
                    title={label + " : " + config.description}>
            <div
                className={(config.className != null ? config.className : "react-table-td-value-div") + " " + cellClassPrefix + this.props.hashCode + "-" + hashCode(key)}
                onClick={this.handleThClickFunc(key, classStr)} title={label + " : " + config.description}>
                <span className={"sort_span iconfont icon-" + classStr}/>
                {label}
            </div>
            {filterSpan}
            {lastColumn ? "" : (
                <span className="table-col-resize" onMouseDown={this.handleColResizeMouseDown}> &nbsp; </span>)}
        </td>);
    }

    createHeadEditTd(conf) {
        conf = conf || {};
        let items = [];
        if (this.state.tableConfig.isRelateTable) {
            items = deepClone(this.state.tableConfig.globalEdit);
            items.push(this.state.tableConfig.export.export_pdf)
            items.push(this.state.tableConfig.export.export_csv)
            items.push(this.state.tableConfig.export.export_json)
        }
        return (
            <td key="EditTd" rowSpan={conf.rowSpan} colSpan={conf.colSpan} className={"editTd" + this.props.hashCode}>
                {this.state.tableConfig.isRelateTable && (
                    <div className="relate_table_bts">
                        <DropMenuButton tableConfig={this.state.tableConfig} item={items} type={0}
                                        tableInfo={this.props.tableInfo} pageInfo={this.state.pageInfo}/>
                        <div>
                            <span className="iconfont icon-reload" title="refresh"
                                  onClick={this.state.tableConfig.reloadFunc ? this.state.tableConfig.reloadFunc : this.updateData}/>
                        </div>
                    </div>)
                }
            </td>);
    }

    createMultiHead(config) {
        let headHTML = [];
        if (isEmpty(config) || !config instanceof Array) {
            return;
        }
        let tableConfig = this.state.tableConfig,
            tableHead = tableConfig.tableHead,
            pageInfo = this.state.pageInfo,
            key = null;
        for (let index = 0; index < config.length; ++index) {
            let conf = config[index];
            let headRow = [];
            if (index === 0) {
                headRow.push(this.createHeadIdTd({rowSpan: config.length}));
            }
            for (let i = 0; i < conf.length; ++i) {
                let obj = conf[i];
                key = obj.key;
                headRow.push(this.createHeadTd(key, tableHead[key], pageInfo, obj));
            }
            if (index === 0) {
                headRow.push(this.createHeadEditTd({rowSpan: config.length}));
            }
            headHTML.push(
                <tr key={"react-table-head-row_" + index}>
                    {headRow}
                </tr>
            );
        }
        return headHTML;
    }

    createSelectFilter(key) {
        const optionList = [];  //option jsx array
        const optionValueList = [];  //all current column data
        const tableConfig = this.state.tableConfig;
        const eachColFilter = tableConfig.eachColFilter;
        const headConfig = tableConfig.tableHead[key];
        const dataFun = headConfig && headConfig["cellDataFun"];
        const titleMapping = {};

        optionList.push(
            <option key={key + "_-1"} value={PLEASE_SELECT_VALUE}>
                {getText(eachColFilter.firstOptionLabel)}
            </option>
        );

        this.state.pageInfo.initData.forEach(data => {
            let _value = data[key];
            if (dataFun != null) {
                let newValue = dataFun(data, key);
                if (typeof (newValue) == "string") {
                    if (_value instanceof Array) {
                        optionValueList.push(newValue);
                        titleMapping[_value] = _value.join(",");
                    } else {
                        optionValueList.push(_value);
                        titleMapping[_value] = newValue;
                    }
                }
            } else {
                if (_value instanceof Array) {
                    _value = _value.join(",");
                }
                optionValueList.push(_value);
                titleMapping[_value] = _value;
            }
        });
        const sortOptionValueList = uniqueArray(optionValueList).sort(sortFunc);
        sortOptionValueList.forEach((data, i) => {
            if (!isNullOrUndefined(data)) {
                optionList.push(
                    <option key={key + "_" + data} value={data} title={titleMapping[data]}>
                        {titleMapping[data]}
                    </option>);
            }
        });
        let _dValue = (typeof this.state.pageInfo.filter[key] === "object") ? PLEASE_SELECT_VALUE : (this.state.pageInfo.filter[key] || PLEASE_SELECT_VALUE);
        let data_Type = DataTypeEnum.Accurate;
        return (
            <select key={key + "_" + tableConfig.tableKey} className="tableSelect" value={_dValue}
                    onChange={this.handleUpdatePageInfo(PageInfo.UpdateFlag.AddFilter, key, data_Type)}>
                {optionList}
            </select>
        );
    }

    createFilterControl(key, config) {
        let filterCol = {}, type = TableFilterTypeEnum.Select;
        if (this.state.tableConfig.eachColFilter != null && !isEmptyObj(this.state.tableConfig.eachColFilter.showCol)) {
            filterCol = this.state.tableConfig.eachColFilter.showCol;
            if (isEmpty(filterCol[key])) {
                return "";
            } else {
                type = filterCol[key].control_Type;
            }
        }
        let _ctrHtml;
        if (type === TableFilterTypeEnum.TextInput) {
            _ctrHtml = this.createInputFilter(key, config);
        } else if ([TableFilterTypeEnum.MultiSelect, TableFilterTypeEnum.MultiSubItemsSelect].includes(type)) {
            _ctrHtml = this.createMultiSelectFilter(key, config);
        } else {
            _ctrHtml = this.createSelectFilter(key, config);
        }

        return (
            <div key={"react-table-tbody-filter-control-key-" + key} className="float-filter-div none" data-flag={key}>
                {_ctrHtml}
            </div>
        );
    }

    ReactTableHead = () => {
        let {multiHead} = this.state.tableConfig;
        if (!isEmpty(multiHead) && multiHead.enabled) {
            let {config} = multiHead;
            return (
                <thead>
                {this.createMultiHead(config)}
                </thead>
            );
        } else if (this.state.tableConfig.tableHead) {
            let columns = this.state.tableConfig.tableHead;
            let headTdList = [];
            let keys = Object.keys(columns);
            for (let i = 0; i < keys.length; ++i) {
                headTdList.push(
                    this.createHeadTd(keys[i], columns[keys[i]], this.state.pageInfo, {}, i === (keys.length - 1)));
            }
            return (
                <thead>
                <tr>
                    {this.createHeadIdTd()}
                    {headTdList}
                    {this.createHeadEditTd()}
                </tr>
                </thead>
            );
        } else {
            return "";
        }
    }

    handleFilterBtnClick(event) {
        event.stopPropagation();
        let fbtn = event.target.parentElement;
        let filterDiv = nextDom(fbtn, "div");
        let td = event.target.parentElement.parentElement.parentElement;
        let divs = document.querySelectorAll("div.float-filter-div");

        for (let i = 0; i < divs.length; ++i) {
            let divItem = divs[i];
            if (!divItem.classList.contains("none")) {
                divItem.classList.add("none");
            }
        } //remove all filter div firstly
        if (filterDiv.classList.contains("none")) { //打开当前需要的filter组件
            filterDiv.classList.remove("none");
            filterDiv.style.width = td.clientWidth + "px";
            filterDiv.style.top = (td.clientHeight - 2) + "px";
        }

        const closeFilterControl = function (event) { //注册document事件，当点击页面的非当前过滤组件时，关闭组件
            event.stopPropagation();//阻止浏览器继续传播,触发底层事件
            let isChild = filterDiv.getElementsByClassName(event.target.className).length; //判断当前点击的组件是不是filter的子组件,如果是，则不进行处理，防止关闭组件框
            if (isChild > 0) {
                return;
            }
            filterDiv.classList.add("none");
            document.removeEventListener("click", closeFilterControl);
        };
        document.addEventListener("click", closeFilterControl);
    }

    createInitSelect(key, initData, itemConfig, validator) {
        let optionList = [],
            optionValueList = initData.keys,
            headInitPanel = this.state.tableConfig.headInitPanel;
        optionList.push(<option key={key}
                                value={PLEASE_SELECT_VALUE}>{itemConfig.firstOptionLabel || getText(headInitPanel.defaultFirstOptionLabel)}</option>);
        let sortOptionValueList = null;
        if (!isNullOrUndefined(itemConfig.sortFun) && isFunction(itemConfig.sortFun)) {
            sortOptionValueList = itemConfig.sortFun(optionValueList);
        } else {
            sortOptionValueList = optionValueList.sort(sortFunc);
        }
        let defaultValue = "";
        if (this.state.initFilterInfo != null && this.state.initFilterInfo.hasOwnProperty(key)) {
            defaultValue = this.state.initFilterInfo[key];
        }
        Object.keys(sortOptionValueList).map(i => {
            let data = sortOptionValueList[i];
            optionList.push(<option key={key + "_" + data}
                                    value={initData.get(data)}>{data || noneValue}</option>);
        });

        const hasValidator = !isEmptyObj(validator);
        let vMsg = this.state.validateMsg[key] || {};

        return (
            <div style={{position: "relative"}}>
                <select id={key} name={key} disabled={itemConfig.disabled} key={key} value={defaultValue}
                        className="my-col-select"
                        onChange={hasValidator ? ActionListener(key, validator, this.changeOption(key, itemConfig.onChange)) : this.changeOption(key, itemConfig.onChange)}>
                    {optionList}
                </select>
                {vMsg.showIcon && <i className={"pm-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                {vMsg.showIcon === "remove" && <small className="pm-help-block">{vMsg.text}</small>}
            </div>
        );
    }

    //multi-selected, child sub items.
    createInitMultiSubItemsSelect(key, initData, itemConfig) {
        let optionList = [];
        let optionValueList = initData.keys;
        let sortOptionValueList;
        if (!isNullOrUndefined(itemConfig.sortFun) && isFunction(itemConfig.sortFun)) {
            sortOptionValueList = itemConfig.sortFun(optionValueList);
        } else {
            sortOptionValueList = optionValueList.sort(sortFunc);
        }
        for (let i = 0; i < sortOptionValueList.length; i++) {
            let _key = sortOptionValueList[i];
            let _value = initData.get(_key);
            let _newValue = _value;
            let parentOptionClass = "";
            if (_value.value != null) {
                _newValue = _value.value;
                parentOptionClass = "parent-item"
            }
            optionList.push(<option className={parentOptionClass} label="" key={key + "_" + _newValue}
                                    value={_newValue}>{_key || noneValue}</option>);
            if (_value.items != null) {  // create sub options.
                let itemsMap = _value.items;
                let _itemsMapKeysList = itemsMap.keys;
                let _sortItemsMapKeysList = _itemsMapKeysList.sort(sortFunc);
                let subItemList = [];
                for (let j = 0; j < _sortItemsMapKeysList.length; j++) {
                    let _item_key = _sortItemsMapKeysList[j];
                    let _item_value = _newValue + "." + itemsMap.get(_item_key);
                    subItemList.push(<option className="sub-item" label={_newValue} parentKey={_newValue}
                                             key={_item_key + "_" + _item_value}
                                             value={_item_value}>{_item_key || noneValue}</option>)
                }
                if (subItemList.length > 0) {
                    optionList.push(subItemList);
                }
            }
        }
        let refsKey = this.initMultiSelectRefs[key];
        let className = "col-xs-7 btn-divClass";
        if (itemConfig.multiSelect_type != null && itemConfig.multiSelect_type === "Normal") {
            className = "col-xs-7 btn-divClass-normal";
        }
        return (
            <select ref={refsKey} name={key} key={key} disabled={this.state.loading}
                    onChange={this.changeOption(key, itemConfig.onChange)} data-size="10"
                    className={className} multiple="multiple">
                {optionList}
            </select>
        );
    }

    createInputFilter(key, initData, itemConfig, validator) {
        if (!initData) {
            return (
                <input type="text" className="filterInputText" key={key}
                       onChange={this.handleUpdatePageInfo(PageInfo.UpdateFlag.AddFilter, key, DataTypeEnum.Fuzzy)}/>
            );
        }

        let _value = "";
        if (initData.get(key) != null) {
            _value = initData.get(key);
        }
        // if( itemConfig.hasOwnProperty("defaultValue") ) {
        //     _value = itemConfig.defaultValue;
        // }
        if (this.state.initFilterInfo != null && this.state.initFilterInfo.hasOwnProperty(key)) {
            _value = this.state.initFilterInfo[key];
        }
        const hasValidator = !isEmptyObj(validator);
        let vMsg = this.state.validateMsg[key] || {};
        return (
            <div style={{position: "relative"}}>
                <input type="text" className="my-input" disabled={itemConfig.disabled} id={key} name={key} key={key}
                       value={_value}
                       onChange={hasValidator ? ActionListener(key, validator, this.changeText(key)) : this.changeText(key)}
                />
                {vMsg.showIcon && <i className={"pm-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                {vMsg.showIcon === "remove" && <small className="pm-help-block">{vMsg.text}</small>}
            </div>
        );
    }

    changeOption = (key, fun) => {
        return (event, vMsg) => {
            let v = {};
            v[key] = vMsg;
            this.setState({
                validateMsg: v
            }) && vMsg.validateMsg[key];
            if (fun != null && isFunction(fun)) {
                fun(event, this, this.initMultiSelectRefs, this.initPanelFormRef, this.resetFilter);
            }
            this.handleUpdateInitFilterFun(PageInfo.UpdateFlag.AddFilter, key, DataTypeEnum.Accurate)(event);
        };
    }

    changeText(key) {
        return (event, vMsg) => {
            this.setState({
                validateMsg: {
                    [key]: vMsg
                }
            }) && vMsg.validateMsg[key];
            this.handleUpdateInitFilterFun(PageInfo.UpdateFlag.AddFilter, key, TableFilterTypeEnum.TextInput)(event);
        };
    }

    resetFilter(key) {
        let select = document.querySelectorAll("select[name=" + key + "]");
        if (!isNullOrUndefined(select) && select.length > 0) {
            if (select[0].options[0].value === PLEASE_SELECT_VALUE) {
                select[0].options[0].selected = true;
            }
        }
        delete this.state.initFilterInfo[key];
    }

    createInitControl(key, itemConfig, optionAllDatas, validator) {
        if (itemConfig.show != null && !itemConfig.show) {
            return null;
        }
        let optionDatas = optionAllDatas[key];
        let type = itemConfig.control_Type || TableFilterTypeEnum.Select;
        let _ctrHtml;
        let disabled = false;
        if (itemConfig.hasOwnProperty("when")) {
            disabled = !getYangActionConfig(itemConfig, key, "when", this.state.initFilterInfo);
        }
        itemConfig.disabled = disabled;
        itemConfig.editEnable = disabled;
        if (type === TableFilterTypeEnum.MultiSelect) {
            let defaultValue = [];
            if (this.state.initFilterInfo[key]) {
                defaultValue = this.state.initFilterInfo[key];
            } else {
                if (this.state.defaultTableInitFilter != null && this.state.defaultTableInitFilter.hasOwnProperty(key)) {
                    defaultValue = this.state.defaultTableInitFilter[key];
                }
            }
            optionDatas = optionDatas || new JSMap();
            _ctrHtml =
                <MultiSelect keyValue={key} initData={optionDatas.data} wrapClass="pm-multi-wrapper" borderClass=""
                             initMultiSelectRefs={this.initMultiSelectRefs}
                             defaultValue={defaultValue} disabled={1}
                             sortFun={itemConfig.sortFun}
                             handleSetValue={this.handleUpdateInitFilterFun(PageInfo.UpdateFlag.AddFilter, key, TableFilterTypeEnum.MultiSelect)}
                             filterOnChange={this.filterOnChange} change={itemConfig.onChange}/>
        } else if (type === TableFilterTypeEnum.MultiSubItemsSelect) {
            _ctrHtml = this.createInitMultiSubItemsSelect(key, optionDatas || new JSMap(), itemConfig);
        } else if (type === TableFilterTypeEnum.TextInput) {
            _ctrHtml = this.createInputFilter(key, optionDatas || new JSMap(), itemConfig, validator);
        } else {
            _ctrHtml = this.createInitSelect(key, optionDatas || new JSMap(), itemConfig, validator);
        }
        let tableHeadConfig = itemConfig || this.state.tableConfig.tableHead[key];
        if (isEmptyObj(tableHeadConfig)) {
            tableHeadConfig = key;
        } else {
            tableHeadConfig = tableHeadConfig.label || key
        }
        let vMsg = (this.state.validateMsg && this.state.validateMsg[key]) || {};
        return (<div key={"_init_select_div_" + key} name={"_init_filter_componet_div_" + key}
                     className={"tableHeadDiv my-col-sm-4 input_font_size " + icons[vMsg.showIcon]}>
            <label className="control-label my-col-label filterSelectLabel">{getText(tableHeadConfig)}</label>
            {_ctrHtml}
        </div>)
    }

    createInitPanel(flag) {
        let headInitPanel = this.state.tableConfig.headInitPanel;
        let controlList = [];
        let initFilterData = this.state.initFilterData || {};
        let initValidators = deepClone(DefaultFormValidator);
        initValidators.message = "";
        let fields = {};
        Object.keys(headInitPanel.items).map(key => {
            let item = headInitPanel.items[key];
            if (item.hasOwnProperty("validators") && !isEmptyObj(item.validators)) {
                let _validators = {};
                _validators.validators = item.validators;
                fields[key] = _validators;
                this.state.validateMsg[key] = this.state.validateMsg[key] || {showIcon: "default", text: null};
            }
            controlList.push(this.createInitControl(key, item, initFilterData, fields[key]));
        });
        initValidators.fields = fields;
        this.initControlValidators = initValidators;

        let initPanelBtn = [];
        if (!isNullOrUndefined(controlList) && controlList.length > 0) {
            initPanelBtn.push(<input key="react-table-init-panel-btn-load" type="button"
                                     className="resetButton react-table-global-btn"
                                     role="button" disabled={this.state.loading}
                                     onClick={this.handleLoadDataBtnClick}
                                     value={getText(headInitPanel.loadBtn.label)}/>);
        }
        if (!isNullOrUndefined(this.state.tableConfig.defineButtons) && this.state.tableConfig.defineButtons.length > 0) {
            for (let i = 0; i < this.state.tableConfig.defineButtons.length; i++) {
                let _btConf = this.state.tableConfig.defineButtons[i];
                let disabled = false;
                if (_btConf.enabled != null && !_btConf.enabled) {
                    disabled = true;
                }
                if (isFunction(_btConf.enabled) && !_btConf.enabled()) {
                    disabled = true;
                }
                initPanelBtn.push(<input key={_btConf.key} type="button"
                                         className="resetButton react-table-global-btn"
                                         role="button" disabled={disabled}
                                         onClick={_btConf.click(this.state.initFilterInfo)}
                                         value={getText(_btConf.label)}/>);
            }
        }
        let lineHeight = "";
        if (isNullOrUndefined(controlList) || controlList.length === 0) {
            lineHeight = " react-table-tool-btn-line-height";
        }
        let filterDivClass = "";
        if (flag === "none") {
            filterDivClass = "react-table-filter-div-width-100";
        }
        return (
            <div key="_init_filter_div_" className={"react-table-filter-div " + filterDivClass}>
                <form ref={this.initPanelFormRef} className="form-inline" role="form">
                    <div className="row react-table-tool-panel-control-row"
                         key="row react-table-tool-panel-control-row">
                        {controlList}
                    </div>
                    <div className={"react-table-tool-panel-btn-row " + lineHeight}
                         key="react-table-tool-panel-btn-row">
                        {this.showSelectText()}
                        {initPanelBtn}
                        {this.createGlobalToolBtns()}
                    </div>
                </form>
            </div>
        );
    }

    showSelectText() {
        let selectedLength = this.state.pageInfo.getSelectedData()().length;
        if (selectedLength === 0) {
            return "";
        }

        let text = getText("selected") + ": " + selectedLength;
        return (
            <span className="selected_text">{text}</span>
        );
    }

    handleLoadDataBtnClick = () => {
        this.state.pageInfo.filter = {};    //remove all filter.
        if (this.initControlValidators) {
            let vob = validate(this.state.initFilterInfo, this.initControlValidators);
            Object.keys(vob.validateMsg).forEach(key => {
                this.state.validateMsg[key] = vob.validateMsg[key];
            });
            this.setState({...this.state});

            if (!vob.validateMsg.pass) {
                return false;
            }
        }
        this.handleUpdateInitFilterFun(PageInfo.UpdateFlag.InitLoad)();
    }

    createGlobalToolBtns = () => {
        let tableConfig = this.state.tableConfig;
        let globalToolBtnArray = [];
        let pageInfo = this.state.pageInfo;
        let showData = pageInfo.getShowData();
        let initData = pageInfo.initData;
        if (tableConfig.globalEdit && tableConfig.globalEdit.length > 0) {
            for (let index = 0; index < tableConfig.globalEdit.length; ++index) {
                let item = tableConfig.globalEdit[index];
                if (item instanceof Array) {
                    globalToolBtnArray.push(<DropMenuButton key={"dropMenuBtn_" + index} item={item}
                                                            tableConfig={this.state.tableConfig}
                                                            tableInfo={this.props.tableInfo}
                                                            pageInfo={this.state.pageInfo}/>)
                } else {
                    let disabled = false;
                    if (item.enabled != null && !item.enabled) {
                        disabled = true;
                    }
                    if (isFunction(item.enabled) && !item.enabled(initData)) {
                        disabled = true;
                    }
                    let btClass = "resetButton react-table-global-btn"
                    if( disabled ) {
                        btClass = btClass + " react-table-global-btn-disabled";
                    }
                    globalToolBtnArray.push(<input type="button" key={"GlobalToolBtns" + item.label}
                                                   disabled={disabled} className={btClass}
                                                   role="button" title={item.label+(disabled?" ("+ getText("permission-denied") +")":"")}
                                                   onClick={item.clickFunction.bind(this, initData, showData, pageInfo.getSelectedData(), tableConfig)}
                                                   value={item.label}/>);
                }
            }
        }

        if (tableConfig.export.enabled) {
            if (tableConfig.export.export_list.enabled && !tableConfig.isRelateTable) {
                let menuList = [tableConfig.export.export_pdf, tableConfig.export.export_csv, tableConfig.export.export_json];
                globalToolBtnArray.push(<DropMenuButton key={"export"}
                                                        tableConfig={this.state.tableConfig} item={menuList}
                                                        tableInfo={this.props.tableInfo}
                                                        tableTitle={this.props.tableTitle}
                                                        pageInfo={this.state.pageInfo}/>)
            }
        }

        if (tableConfig.reloadBtn.enabled) {
            let item = tableConfig.reloadBtn;
            globalToolBtnArray.push(<input type="button"
                                           key={"reloadBtn"}
                                           className="resetButton react-table-global-btn"
                                           role="button" value={getText(item.label)}
                                           onClick={this.updateData}/>);
        }
        return globalToolBtnArray;
    }

    handleCollapseClick(event) {
        let ta = event.target;
        if (ta.classList.contains("icon-rotate-180")) {
            ta.classList.remove("icon-rotate-180");
        } else {
            ta.classList.add("icon-rotate-180");
        }
        let t_body = ta.parentElement.parentElement.parentElement.nextElementSibling;
        t_body.classList.contains("in") ? t_body.classList.remove("in") : t_body.classList.add("in");
    }

    ReactTableHeading = () => {
        let headLess = true;
        if (this.props.buttons == null || this.props.buttons.noButtons == null || !this.props.buttons.noButtons) {
            if (this.props.buttons == null || this.props.buttons.headButtons == null || this.props.buttons.headButtons) {
                headLess = false;
            }
        }
        if (headLess) return "";

        let tableNamePanel = "none", tableNameTitleDiv = "";
        if (!isNullOrUndefined(this.props.tableName)) {
            tableNamePanel = "";
            if (!isNullOrUndefined(this.props.collapse) && this.props.collapse === false) {
                tableNameTitleDiv = (
                    <div className={"react-table-panel-heading-title " + tableNamePanel}
                         title={this.state.tableConfig.description}>
                        {this.state.tableName}
                    </div>
                );
            } else {
                tableNameTitleDiv = (
                    <div className={"react-table-panel-heading-title " + tableNamePanel}
                         title={this.state.tableConfig.description}>
                        <span className="iconfont icon-collapse-up3" onClick={this.handleCollapseClick}/>
                        {this.state.tableName}
                    </div>
                );
            }
        }
        let clearFloatDiv = "";
        if (tableNamePanel === "none") {
            clearFloatDiv = <div className="react-clear-float-div"/>;
        }
        return (
            <div className="react-table-heading-tool-div">
                {tableNameTitleDiv}
                {this.createInitPanel(tableNamePanel)}
                {clearFloatDiv}
            </div>
        );
    }

    doTrClick = (data, event) => {
        this.handleUpdatePageInfo(PageInfo.UpdateFlag.ChangeSelected,
            {
                id: data["@id"],
                shiftClick: this.isShiftClick,
                ctrlClick: this.isCtrlClick
            }
        )(event);
        this.setState({
            selectedData: this.state.pageInfo.getSelectedData()()
        })
    }

    handleTrClick(data, event) {
        let tableConfig = this.state.tableConfig;
        this.isShiftClick = event.shiftKey;
        this.isCtrlClick = event.ctrlKey;
        this.isDBClick = false;
        setTimeout(() => {
            if (this.isDBClick) return;
            if (!isEmpty(tableConfig.trClickFun) && (typeof tableConfig.trClickFun) == "function") {
                this.doTrClick(data, event);
                tableConfig.trClickFun(data, event);
            }
        }, 250);
    }

    handleTrDBClick(data, event) {
        let tableConfig = this.state.tableConfig;
        this.isDBClick = true;
        if (!isEmpty(tableConfig.trDBlClickFun) && (typeof tableConfig.trDBlClickFun) == "function") {
            tableConfig.trDBlClickFun(data, event);
        }
    }

    createEditTd = (_editBtnList, _start, index, _data, editDivID) => {
        return (<td key={"data_row_edit"}
                    className={_editBtnList.length > 0 ? ("editTd" + this.props.hashCode) : ""}>
            {_editBtnList.map((_btnConf, idx) => {
                let btnConf = deepClone(_btnConf);
                btnConf.enable = true;
                if (btnConf.enabled != null && btnConf.enabled === -1) {
                    return true;
                }
                if (btnConf.enabled != null && !btnConf.enabled) {
                    btnConf.enable = false;
                }
                if (isFunction(btnConf.enabled)) {
                    let eb = btnConf.enabled(_data);
                    if (eb === -1) {
                        return true;
                    }
                    if (!eb) {
                        btnConf.enable = false;
                    }
                }
                if (btnConf.hasOwnProperty("type") && (btnConf.type === "link" || btnConf.type === "collapse" || btnConf.type === "dropdown")) {
                    const formatter = btnConf.formatter;
                    if (isFunction(formatter)) {
                        return formatter(btnConf, _data, this.state.pageInfo.getSelectedData(), editDivID);
                    }
                } else {
                    btnConf.normalClass = btnConf.normalClass || btnConf.buttonClass.normal;
                    btnConf.disabledClass = btnConf.disabledClass || btnConf.buttonClass.disabled;
                    btnConf.onClick = btnConf.clickFunction;
                    return (<ReactTableEditButton key={btnConf.label}
                                                  tableHashCode={this.props.hashCode || ""}
                                                  rowData={_data}
                                                  selectedData={this.state.pageInfo.getSelectedData()}
                                                  conf={btnConf}/>);
                }
            })}
        </td>);
    }

    createTrData(_rowID, _colID, editBtnList, _data, editDivID) {
        let tableConfig = this.state.tableConfig,
            configTableHead = tableConfig.tableHead;
        if (!isEmptyObj(tableConfig.customRow) && tableConfig.customRow.enabled) {
            let flagList = tableConfig.customRow.flagList, flag = true;
            Object.values(flagList).map(_item => {
                if (_data[0][_item] !== InnerTableFlagValue) flag = false;
            });
            if (flag) {
                let colSpan = this.getShowHeadColumn() + 2;
                return (
                    <td colSpan={colSpan}>
                        {tableConfig.customRow.getCustomFun(_data)}
                    </td>);
            }
        }
        let tdList = [];
        let _j = 1;
        let showColId = _rowID + _colID + 1, showId = null;
        if (isPositiveNum(showColId)) {
            showId = showColId;
        }

        if (!this.state.tableConfig.hasOwnProperty("showIDCol")
            || this.state.tableConfig.showIDCol) {
            tdList.push(<td key={"react-table-tbody-key-id"} title={showId}>
                <div className={"react-table-id-number-col rownumber" + this.props.hashCode}>{showId}</div>
            </td>);
        }

        Object.keys(configTableHead).map(key => {
            let item = configTableHead[key];
            let noneValue = "";
            let tdClass = "";
            if (!isEmpty(item) && item.hasOwnProperty("noneLabel")) {
                noneValue = item.noneLabel;
            }
            if (!isEmpty(item) && item.hasOwnProperty("className")) {
                tdClass = item.className;
            }

            if (isEmptyObj(item) || !item.hasOwnProperty("show") || item.show) {
                if (_data[0].hasOwnProperty("TDNoDrawConfig") && _data[0]["TDNoDrawConfig"].hasOwnProperty(key)) {
                    return;
                }
                let showValue;
                if (item.hasOwnProperty("cellDataFun") && typeof item.cellDataFun === "function") {
                    showValue = item.cellDataFun(_data[0], key, this.state.pageInfo.getSelectedData());
                } else {
                    showValue = _data[0][key] || noneValue;
                }
                if (showValue instanceof Array) {
                    showValue = showValue.join(",")
                }
                let titleValue = showValue;
                if (typeof showValue != "string") {
                    titleValue = null;
                }
                if (_data[0].hasOwnProperty("TDColorConfig") && _data[0]["TDColorConfig"].hasOwnProperty(key)) {
                    tdClass = _data[0]["TDColorConfig"][key];
                }

                tdList.push(
                    <td data-field={key} title={titleValue}
                        key={"react-table-tbody-key-data-" + key}>
                        <div data-value={titleValue}
                             className={cellClassPrefix + this.props.hashCode + "-" + hashCode(key) + " " + tdClass}>
                            {showValue}
                        </div>
                    </td>);
            }

        });
        if (editBtnList.length > 0) {
            tdList.push(this.createEditTd(editBtnList, _rowID, _colID, _data, editDivID));
        }
        return tdList;
    }

    highlightRowConfig(_data) {
        let tableConfig = this.state.tableConfig;
        if (!tableConfig.highlightRow.enabled) return "";
        let highlightRowClass = "";
        for (let rule of tableConfig.highlightRow.rules) {
            let flag = true;
            Object.keys(rule.filter).some(key => {
                if (_data[key] !== rule.filter[key]) {
                    flag = false;
                    return true;
                }
                return false;
            });
            if (flag) {
                highlightRowClass = highlightRowClass + " " + rule.rowClass;
            }
        }
        return highlightRowClass;
    }

    createTableData(tableData, _rowID, editBtnList) {
        if (isEmptyObj(tableData)) return;
        let tableConfig = this.state.tableConfig,
            tableBody = [];
        for (let index = 0; index < tableData.length; ++index) {
            let _data = tableData[index];
            let trClass = "tr_css ";
            if (!isEmptyObj(tableConfig.oddAndEven) && tableConfig.oddAndEven.enabled) {
                if ((_rowID + index) % 2 === 0) {
                    trClass = tableConfig.oddAndEven.oddTrClass;
                } else {
                    trClass = tableConfig.oddAndEven.evenTrClass;
                }
            }
            trClass += (" " + this.highlightRowConfig(_data));
            if (_data["_selected"]) {
                trClass += " react_table_selected";
                if (this.isShiftClick) {
                    trClass += " shift-selected";
                }
            }
            let editDivID = "react_collapse_div_" + tableConfig.tableKey + "_" + (_rowID + index + 1);
            tableBody.push(
                <tr key={"react-table-body-data-tr-" + (_data.hasOwnProperty("_key") ? _data._key : (_rowID + index))} className={trClass}
                    onClick={this.handleTrClick.bind(this, _data)}
                    onDoubleClick={this.handleTrDBClick.bind(this, _data)}>
                    {this.createTrData(_rowID, index, editBtnList, [_data], editDivID)}
                </tr>
            );
            let editRowDraw = true;
            if (tableConfig.hasOwnProperty("editRowDraw")) {
                editRowDraw = tableConfig["editRowDraw"]
            }

            let extraColCount = 2;
            if (!this.state.tableConfig.showIDCol) {
                extraColCount = 1;
            }

            if (editRowDraw) {
                tableBody.push(
                    <tr key={"edit-row" + (_data.hasOwnProperty("_key") ? _data._key : (_rowID + index))} className="react-table-edit-row">
                        <td colSpan={this.getShowHeadColumn() + extraColCount} className="collapseTd">
                            <div id={editDivID} className="panel-collapse collapse react-collapse-div"/>
                        </td>
                    </tr>
                );
            }
        }
        return tableBody;
    }

    getShowHeadColumn() {
        let tableHead = this.state.tableConfig.tableHead, num = 0;
        Object.values(tableHead).map(config => {
            if (isNullOrUndefined(config.show) || config.show) {
                num++;
            }
        });
        return num;
    }

    ReactTableBody = () => {
        let tableConfig = this.state.tableConfig;
        let pageInfo = this.state.pageInfo,
            pageShowData = this.state.pageInfo.getShowData(),
            _start = (pageInfo.currentPage - 1) * pageInfo.pageSize,
            _end = _start + pageInfo.pageSize;
        let showData = pageShowData.slice(_start, _end);
        let tableData = this.createTableData(showData, _start, tableConfig.rowEdit);
        return (
            <tbody className="minHeight100">
            {tableData}
            </tbody>
        );
    }

    getComputedWidth(node) {
        let viewWidth = window.getComputedStyle(node).width;
        if (viewWidth.match(/%$/)) {
            let width = this.getComputedWidth(node.parentNode);
            return width * parseFloat(viewWidth.replace("%", "")) / 100.0;
        } else if (viewWidth === "auto") {
            return this.getComputedWidth(node.parentNode) - 1;
        } else if (viewWidth.match(/px$/)) {
            return parseFloat(viewWidth.replace("px", ""));
        }
    }

    getStyleList(resize) {
        let _hashCode = this.props.hashCode;
        let classKey = "";
        let unsetWidth = [];
        let totalMinWidth = 0;
        let styleList = [];
        if (this.state.tableConfig.showIDCol) {
            classKey = ".rownumber" + _hashCode;
            let width = 29;
            totalMinWidth += width;
            styleList.push(`${classKey}{width: ${width}px;min-width: ${width}px;}`);
        }
        Object.keys(this.state.tableConfig.tableHead).map(key => {
            let config = this.state.tableConfig.tableHead[key];
            classKey = "." + cellClassPrefix + _hashCode + "-" + hashCode(key);
            if (config.hasOwnProperty("resizeWidth")) {
                styleList.push(classKey + "{width:" + config.resizeWidth + "px; }");
                totalMinWidth += config.resizeWidth;
            } else if (config.hasOwnProperty("minWidth")) {
                styleList.push(classKey + "{width:" + config.minWidth + "px;min-width:" + config.minWidth + "px; }");
                totalMinWidth += config.minWidth;
            } else if (config.hasOwnProperty("width")) {
                styleList.push(classKey + "{width:" + config.width + "px; }");
                totalMinWidth += config.width;
            } else {
                unsetWidth.push(classKey);
            }
        });

        let rowEditColWidth = getEditTdWidth(this.state.tableConfig);
        if (rowEditColWidth) {
            totalMinWidth += rowEditColWidth;
            styleList.push(".editTd" + _hashCode + "{width:" + rowEditColWidth + "px;min-width:" + rowEditColWidth + "px;}");
        }

        if ((!(this.state.tableConfig.multiHead) || !(this.state.tableConfig.multiHead.enabled)) && this.reactTreeTableViewDiv.current) {
            let mainWidth = this.getComputedWidth(this.reactTreeTableViewDiv.current);
            let showWidth = (mainWidth - totalMinWidth - unsetWidth.length) / unsetWidth.length;
            let ceilOrFloor = true;
            unsetWidth.map(key => {
                let realWidth = showWidth < minColWidth ? minColWidth : showWidth;
                styleList.push(key + "{width:" + realWidth + "px; }");
                ceilOrFloor = !ceilOrFloor;
            });
        } else {
            unsetWidth.map(key => {
                let width = 100;
                styleList.push(key + "{width:" + width + "px; }");
            });
        }
        return styleList;
    }

    ReactDynamicStyle() {
        return (
            <style type="text/css">
                {this.getStyleList(this.state.resize).join("\n")}
            </style>
        );
    }

    resizeTable = () => {
        this.setState({
            resize: currentTimeStamp()
        });
    }
}

ReactTable.defaultProps = {
    tableData: [],
    hashCode: 0,
    loadMask: false,
    level: null,
    getDataFun: null,
    propsPushKey: []
};

ReactTable.propTypes = {
    getDataFun: PropTypes.func,
    registerEventFun: PropTypes.func,
    registerEventName: PropTypes.string,
    notifHandler: PropTypes.func
}

class ReactTableFoot extends Component {
    constructor(props) {
        super(props);
    }

    createPageButton = (boolean, id, text) => {
        let pageButton;
        if (boolean) {
            pageButton = (<li key={text}><a className="static">{text}</a></li>);
        } else {
            pageButton = (<li key={text}><a value={id}
                                                    onClick={this.props.handleUpdatePageInfo(PageInfo.UpdateFlag.CurrentPage)}>{text}</a>
            </li>);
        }
        return pageButton;
    }

    render() {
        let pageInfo = this.props.pageInfo;
        let pageConfig = this.props.tableConfig;
        if (!pageConfig.footPanel.show) {
            return <div/>;
        }
        let firstPage, lastPage, previousPage, nextPage, setPageSelect, pageNumbList = [];
        if (pageConfig.firstAndLast != null && pageConfig.firstAndLast.show) {
            firstPage = this.createPageButton(pageInfo.currentPage <= 1, 1, pageConfig.firstAndLast.firstLabel);
            lastPage = this.createPageButton(pageInfo.currentPage >= pageInfo.totalPageSize, pageInfo.totalPageSize, pageConfig.firstAndLast.lastLabel);
        }
        if (pageConfig.previousAndNext != null && pageConfig.previousAndNext.show) {
            previousPage = this.createPageButton(pageInfo.currentPage <= 1, pageInfo.currentPage - 1, pageConfig.previousAndNext.previousLabel);
            nextPage = this.createPageButton(pageInfo.currentPage >= pageInfo.totalPageSize, pageInfo.currentPage + 1, pageConfig.previousAndNext.nextLabel);
        }
        if (pageConfig.setPageSelect != null && pageConfig.setPageSelect.show) {
            let _pArray = [];
            let _st = 1;
            do {
                _pArray.push(<option key={"c_page_" + _st} value={_st}>{_st}</option>);
            } while (++_st <= pageInfo.totalPageSize);
            setPageSelect = (
                <li key={"setPageSelect"}>
                    <select defaultValue={pageInfo.currentPage}
                            onChange={this.props.handleUpdatePageInfo(PageInfo.UpdateFlag.CurrentPage)}
                            className="tableSelect pageSet">
                        {_pArray}
                    </select>
                </li>
            );
        }
        if (pageConfig.pageBtn.show) {
            pageNumbList = pageInfo.pageNumbList.map((key) => {
                return (this.createPageButton(pageInfo.currentPage === key, key, key));
            });
        }
        let leftBottomLabel, pageSizeSelect;
        if (pageConfig.leftBottomInfo && pageConfig.leftBottomInfo.show) {
            leftBottomLabel = getText(pageConfig.leftBottomInfo.label).format(pageInfo.currentPage, pageInfo.totalPageSize, pageInfo.totalSize);
        }
        if (pageConfig.pageSize != null && pageConfig.pageSize.show) {
            let options = [];
            pageConfig.pageSize.option && pageConfig.pageSize.option.forEach(function (option, i) {
                options.push(<option key={"p_size_" + option} value={option}>{option}</option>);
            });
            pageSizeSelect = (
                <select defaultValue={pageInfo.pageSize}
                        onChange={this.props.handleUpdatePageInfo(PageInfo.UpdateFlag.PageSize)}
                        className="tableSelect pageSet">
                    {options}
                </select>
            );
        }
        return (
            <div className="tableFoot">
                <div className="myTableFoot-left">
                    <div className="pageSize">
                        {pageSizeSelect}
                    </div>
                    <div className="pageInfo">
                        {leftBottomLabel}
                    </div>
                </div>
                <div className="myTableFoot-right">
                    <ul className="paging">
                        {setPageSelect}
                        {firstPage}
                        {previousPage}
                        {pageNumbList}
                        {nextPage}
                        {lastPage}
                    </ul>
                </div>
            </div>
        );
    }
}

class TableHeadEdit extends Component {
    constructor(props) {
        super(props);
        let tableHead = this.props.tableConfig.tableHead || {};
        this.state = {
            tableHead: tableHead
        }
    }

    checkIfSelect(obj) {
        return !!(!obj.hasOwnProperty("show") || obj.show);
    }

    render() {
        let tableHeadInfo = this.state.tableHead, checkBoxArray = [];
        let tableHeadEdit = this.props.tableConfig.tableHeadEdit, formatter = null;
        let group = null;
        if (!isNullOrUndefined(tableHeadEdit) && isFunction(tableHeadEdit.formatter)) {
            formatter = tableHeadEdit.formatter;
            group = formatter(this.props.tableConfig);
            /**
             format of group：
             {
                groupName1 : {
                       key1 : value1,
                       key2 : value2
                },
                groupName2 : {
                       key1 : value1,
                       key2 : value2
                }
             }
             */
        }
        if (group == null) {
            let headList = Object.getOwnPropertyNames(tableHeadInfo), _len = headList.length;
            for (let i = 0; i < _len; i++) {
                let item1 = tableHeadInfo[headList[i]];
                checkBoxArray.push(
                    <div className="col-sm-3 col-xs-6" key={"_table_head_checkbox_" + item1.label}>
                        <label className="checkbox-inline textAlignLeft">
                            <input type="checkbox"
                                   name={"checkbox_table_head_" + i} defaultChecked={this.checkIfSelect(item1)}
                                   value={item1.label} />{item1.label}
                        </label>
                    </div>
                );
            }
        } else {
            Object.keys(group).map(groupKey => {
                let itemObj = group[groupKey];
                let headList = Object.getOwnPropertyNames(itemObj), _len = headList.length;
                let checkBoxsHtml = [];
                for (let i = 0; i < _len; i++) {
                    let key = headList[i], item1 = tableHeadInfo[key];
                    checkBoxsHtml.push(
                        <div className="col-sm-3 col-xs-6" key={"_table_head_checkbox_" + groupKey + "_" + key}>
                            <label className="checkbox-inline textAlignLeft">
                                <input type="checkbox"
                                       name={"checkbox_table_head_" + i} defaultChecked={this.checkIfSelect(item1)}
                                       value={key} />{item1.label}
                            </label>
                        </div>
                    );
                }
                checkBoxArray.push(
                    <fieldset key={"__table_head_group_fieldset_" + groupKey} className="normal">
                        {isNullOrUndefined(groupKey) || groupKey === "null" ? "" : <legend>{groupKey}</legend>}
                        {checkBoxsHtml}
                    </fieldset>
                );
            });
        }
        return (
            <div>
                <form ref="react_modal_form" id="react_modal_form" className="form-horizontal" role="form">
                    {checkBoxArray}
                </form>
            </div>
        );
    }
}

export {TableFilterTypeEnum, DataTypeEnum, ReactTable, SortFlag};
