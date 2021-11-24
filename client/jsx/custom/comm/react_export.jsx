/**
 * Created by YaFeng on 4/16/2021.
 */
import LoadingModal from "../loading-modal";
import {
    excelCellData,
    formatDate,
    getMultiHeaderTableDataKey,
    isEmpty,
    isEmptyObj,
    isFunction,
    isNullOrUndefined,
    resource2KeyName,
    showAlertDialog
} from "../utils";
import {DialogType} from "../../components/modal/modal";
import jsPDF from 'jspdf';

const export_csv = {
    enabled: true,
    buttonLabel: "export",
    label: "export_csv",
    clickFunction: function (initDate, showDate, SelectedData, tableConfig) {
        exportCSVFile(1, tableConfig, showDate, this.props.tableInfo);
    },
    buttonClass: {
        normal: "table_export_csv",
        disabled: "table_export_csv_disabled"
    }
};
const export_pdf = {
    enabled: true,
    buttonLabel: "export",
    label: "export_pdf",
    clickFunction: function (initDate, showDate, SelectedData, tableConfig) {
        exportPDFFile(1, tableConfig, showDate, this.props.tableInfo);
    },
    buttonClass: {
        normal: "table_export_csv",
        disabled: "table_export_csv_disabled"
    }
};
const export_json = {
    enabled: true,
    buttonLabel: "export",
    label: "export_json",
    clickFunction: function (initDate, showDate, SelectedData, tableConfig) {
        exportJSONFile(1, tableConfig, showDate, this.props.tableInfo);
    },
    buttonClass: {
        normal: "table_export_csv",
        disabled: "table_export_csv_disabled"
    }
};
const default_export_config = {
    enabled: true,
    export_list: {
        enabled: true,
        label: "export",
        buttonClass: {
            normal: "table_export_csv",
            disabled: "table_export_csv_disabled"
        }
    },
    items: [export_csv, export_pdf, export_json],
    dataInfo: {
        getShowData: () => {
        },
        initData: {},
        getSelectedData: () => {
        }
    },
    tableConfig: {
        tableHead: {},
        multiHead: {
            enabled: true,
            config: {
                "multihead": []
            }
        },
        autoCreateIdCol: {
            show: true,
            label: "ID"
        }
    }
};

let CSV_Separator = ",";
let CSV_Newline = "\n";
let ExportContent_Head = "\uFEFF";


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
            // if (tableConfig.autoCreateIdCol.show) {
            //     dataRow.push(_start++);
            // }
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
                    dataRow.push(_value.replaceAll(",", ";"));
                }
            });
            dataRow.push(CSV_Newline);
            content.push(dataRow.join(CSV_Separator));
        });
        content = content.join("");
    }
    let blob = new Blob([ExportContent_Head + content], {type: "text/plain;charset=utf-8"});
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
            if (key == "_selected") {

            } else {

                if (!isNullOrUndefined(multiHead) && multiHead.enabled) {
                    let resourceList = multiHead["config"][0];
                    let multiTitleLine2 = multiHead["config"][1];
                    let newkey = getMultiHeaderTableDataKey(resourceList, key, multiTitleLine2);
                    let _value = rowData[key];
                    contentRow[newkey] = _value;
                } else {
                    let _value = rowData[key];
                    if (!isNullOrUndefined(_value.label)) {
                        _value = _value.label;
                    }

                    if (typeof _value != "string") {
                        _value = JSON.stringify(_value);
                    }
                    if (_value.indexOf("ioa-") > -1 && _value.indexOf(":") > -1) {
                        _value = _value.substring(_value.indexOf(":") + 1);
                        contentRow[key] = _value;
                    } else if (key == "@id") {
                        id++;
                        contentRow[key] = id;
                    } else {

                        contentRow[key] = rowData[key];
                    }

                }

            }
        });
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
                if (typeof _value != "string") {
                    _value = JSON.stringify(_value);
                }
                if (typeof _value == "string" && _value.indexOf("\n") > -1) {
                    _value = _value.replaceAll("\n", " ");
                }
                if (isNullOrUndefined(_value)) {
                    _value = ""
                }
                if (!isNullOrUndefined(multiHead) && multiHead.enabled) {

                } else {
                    contentRow[key] = _value;
                }


            }
        });
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
    if (titleRow.indexOf("Certificate Bytes") != -1) {
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
        // if (tableConfig.autoCreateIdCol.show) {
        //     dataRow.push(_start++);
        // }
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

let exportPDFFile = function (_start, tableConfig, tableData, fileName) {
    if (fileName == null) {
        fileName = ""
    }
    if (isFunction(fileName)) {
        fileName = fileName();
    }
    let loading = new LoadingModal();
    let titleConfig = tableConfig.tableHead, multiHead = tableConfig.multiHead;


    let content = [];
    let titleRow = [];
    let doc = new jsPDF({
        orientation: "landscape",
        unit: "in",
        // format: ''
        format: 'a4'
    })
    // let doc = new jsPDF('landscape');
    let tableContent = [];
    // if (tableConfig.autoCreateIdCol.show) {
    //     titleRow.push(tableConfig.autoCreateIdCol.label);
    // }
    let colomnNum = 0;
    if (!isEmptyObj(titleConfig)) {

        let key = null;
        let multiHeader = [];
        if (!isNullOrUndefined(multiHead) && multiHead.enabled) {
            let config = multiHead.config;

            // let addID = false;
            Object.keys(config).map(index => {
                let items = config[index];
                if (multiHead.hasOwnProperty("exportRows")) {
                    if (multiHead.exportRows.indexOf(index) < 0) {
                        return true;
                    }
                }

                let multiHeadRow = [];
                let multiHeadRowObj = {}
                // if (!addID) {      //ID Column
                //     multiHeadRowObj.content = "ID";
                //     multiHeadRowObj.colSpan = 1;
                //     multiHeadRowObj.rowSpan = multiHead.config.length;
                //     multiHeadRowObj.styles = {valign: 'middle', halign: 'center'};
                //     multiHeadRow.push(multiHeadRowObj);
                //     addID = true;
                // }

                if (tableConfig.autoCreateIdCol.show) {
                    multiHeadRow.push("");
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
                        // if (!isNullOrUndefined(item.label) || !isNullOrUndefined(item.key)) {
                        //     if (!isNullOrUndefined(item.label)) {
                        //         multiHeadRowObj.content = item.label;
                        //     } else {
                        //         multiHeadRowObj.content = item.key;
                        //     }
                        //     multiHeadRowObj.colSpan = item.colSpan;
                        //     multiHeadRowObj.rowSpan = item.rowSpan;
                        //     multiHeadRowObj.styles = {valign: 'middle', halign: 'center'};
                        //     multiHeadRow.push(multiHeadRowObj);
                        // }

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
        multiHeader.push(titleRow);
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

export {default_export_config};

