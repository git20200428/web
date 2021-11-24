import React, {Component} from 'react';
import PropTypes from "prop-types";
import {
    currentTimeStamp,
    deepClone,
    extendCustomConfig,
    formatDate,
    getNumberFromString,
    getText,
    isEmpty,
    isEmptyObj,
    isFunction,
    isNullOrUndefined,
    nextDom,
    PLEASE_SELECT_VALUE,
    xpath2IdPath,
    formatSortString
} from "../utils";
import LoadingModal from "../loading-modal";
import JSMap from "../js_map";
import {TableFilterTypeEnum} from "./react_table";
import {EventTypeEnum, MyReactEvents} from "../message_util";

let ExpandType = {
    Open: "open",
    Closed: "closed"
};

let cellClassPrefix = "react-treetable-cell-c1c-";

let CSV_Separator = ",";
let CSV_Newline = "\n";
let ExportContent_Head = "\uFEFF";

const PageInfo = function () {
    this.treeTableFilter = {};
    this.tableData = {};
    this.showData = {};
    this.originalData = {}

    this.setTableData = function (_tableData) {
        this.tableData = _tableData;
    }

    this.getTableData = function () {
        return this.tableData;
    }
    this.setOriginalData = function (_originalData) {
        this.originalData = _originalData;
    }

    this.getOriginalData = function () {
        return this.originalData;
    }

    this.setShowData = function (_showData) {
        this.showData = showData;
    }

    this.clearFilter = function () {
        this.treeTableFilter = {};
    }

    this.addFilter = function (key, value) {
        if (value == null || value === undefined || value == "" || value == PLEASE_SELECT_VALUE) {
            delete this.treeTableFilter[key];
        } else {
            this.treeTableFilter[key] = value;
        }
    }

    this.getFilter = function () {
        return this.treeTableFilter;
    }
};

const exportCSVFile = function (_start, columns, treeDatas) {
    let loading = new LoadingModal();
    loading.show();
    let dataRow = [];
    let titleRow = [];
    titleRow.push("ID");
    if (!isEmptyObj(columns)) {
        Object.values(columns).map(column => {
            titleRow.push(column.title);
        });
        if (!isEmpty(treeDatas)) {
            let index = 1;
            getTreeData(treeDatas, columns, index, dataRow);
        }
    }
    let content = titleRow.join(CSV_Separator) + CSV_Newline + dataRow.join(CSV_Newline);
    let blob = new Blob([ExportContent_Head + content], {type: "text/plain;charset=utf-8"});
    loading.close();
    saveAs(blob, formatDate(new Date(), "yyyyMMddHHmmss") + "_export.csv");
};

const getTreeData = function (treeDatas, columns, index, dataRow) {
    Object.values(treeDatas).map(treeData => {
        let _dataRow = [];
        _dataRow.push(index);
        Object.values(columns).map(column => {
            _dataRow.push(treeData[column.field] != null ? treeData[column.field] : "");
        })
        dataRow.push(_dataRow.join(CSV_Separator));
        index++;
        if (treeData.hasOwnProperty("children")) {
            index = getTreeData(treeData["children"], columns, index, dataRow);
        }
    })
    return index;
}

class ReactTreeTable extends Component {
    constructor(props) {
        super(props);

        this.lastSelectIndex = -1;
        this.filterData = {};
        this.initMultiSelectRefs = {};
        let pageInfo = new PageInfo();
        this.reactTreeTableViewDiv = React.createRef();
        this.state = {
            tableData: {}, //hash结构，用于后续查询各节点
            treeDataList: [],
            shiftHold: false,
            pageInfo: pageInfo,
            originalData: {},
            columns: this.props.columns
        };

        this.resizeTd = {
            obj: null,
            resizing: false,
            oldWidth: 0,
            xStart: 0
        };
        this.treeExpandToRef = React.createRef();
    }

    updateStateTableData(tableData, shiftHold) {
        this.setState({
            tableData: tableData,
            shiftHold: shiftHold || false
        });
    }

    change2Expand(id, tableData) {
        let rowData = tableData[id];
        rowData.state = ExpandType.Open;
        if (typeof this.props.onExpand == "function") {
            this.props.onExpand(rowData);
        }
    }

    change2Collapse(id, tableData) {
        let rowData = tableData[id];
        rowData.state = ExpandType.Closed;
        if (typeof this.props.onCollapse == "function") {
            this.props.onCollapse(rowData);
        }
    }

    onExpand = (data) => {
        let tableData = this.state.tableData, nodeId = data.id;
        this.change2Expand(nodeId, tableData);
        this.updateStateTableData(tableData);
    };

    onCollapse = (data) => {
        let tableData = this.state.tableData, nodeId = data.id;
        this.change2Collapse(nodeId, tableData);
        this.updateStateTableData(tableData);
    };

    handleCollapseAll = () => {
        let tableData = this.state.tableData;
        Object.keys(tableData).map(id => {
            this.change2Collapse(id, tableData);
        });
        this.updateStateTableData(tableData);
    }

    handleExpandAll = () => {
        let tableData = this.state.tableData;
        Object.keys(tableData).map(id => {
            this.change2Expand(id, tableData);
        });
        this.updateStateTableData(tableData);
    }


    handleTableColResizeSpanMouseDown = (event) => {
        let td = event.target.parentElement;
        let width = td.clientWidth;
        let xStart = event.clientX;
        this.resizeTd.obj = td;
        this.resizeTd.oldWidth = width;
        this.resizeTd.xStart = xStart;
        this.resizeTd.resizing = true;
        document.addEventListener("mousemove", this.handleTableColResizeSpanMouseMove);
        document.addEventListener("mouseup", this.handleTableColResizeSpanMouseUp);
    }

    handleTableColResizeSpanMouseUp = (event) => {
        this.resizeTd.obj = null;
        this.resizeTd.oldWidth = 0;
        this.resizeTd.xStart = 0;
        this.resizeTd.resizing = false;
        //console.log(this.resizeTd);
        document.removeEventListener("mousemove", this.handleTableColResizeSpanMouseMove);
        document.removeEventListener("mouseup", this.handleTableColResizeSpanMouseUp);
    }

    handleTableColResizeSpanMouseMove = (event) => {
        if (!this.resizeTd.resizing || this.resizeTd.obj == null) {
            return;
        }
        let width = this.resizeTd.oldWidth;
        let td = this.resizeTd.obj;
        let xStart = this.resizeTd.xStart;
        let xEnd = event.clientX;
        width += (xEnd - xStart);
        if (width < 10) {
            width = 10;
        }

        let df = td.getAttribute("data-field");
        if (df) {
            let columns = this.state.columns;
            for (let item of columns) {
                if (item.field === df) {
                    item.minWidth = width;
                    item.width = width;
                    break;
                } else {
                    item.minWidth = item.width;
                }
            }

            this.setState({
                columns: columns
            });
        }
    }


    expandParentNode(id, tableData) {
        let rowData = tableData[id];
        this.change2Expand(id, tableData);
        if (rowData.hasOwnProperty("_parentId")) {
            this.expandParentNode(rowData["_parentId"], tableData);
        }
    }

    expandChildNode(rowData, tableData, state) {
        let id = rowData.id;
        if (state == ExpandType.Closed) {
            this.change2Collapse(id, tableData);
        } else if (state == ExpandType.Open) {
            this.change2Expand(id, tableData);
        }
        let childList = rowData.children;
        Object.values(childList).map(childRowData => {
            if (childRowData.hasOwnProperty("children")) {
                this.expandChildNode(childRowData, tableData, state);
            }
        });
    }

    handleChangeExpandState(state) {
        return function (event) {
            let tableData = this.state.tableData;
            Object.values(tableData).map(rowData => {
                if (rowData.selected) {
                    let id = rowData.id;
                    if (state == ExpandType.Closed) {
                        this.change2Collapse(id, tableData);
                    } else if (state == ExpandType.Open) {
                        this.change2Expand(id, tableData);
                    }
                }
            });
            this.updateStateTableData(tableData);
        }.bind(this)
    }

    handleChangeChildExpandState(state) { //折叠所有
        return function (event) {
            let tableData = this.state.tableData;
            Object.values(tableData).map(rowData => {
                if (rowData.selected) {
                    if (rowData.hasOwnProperty("children")) {
                        this.expandChildNode(rowData, tableData, state); //递归依次展开父节点
                    }
                }
            });
            this.updateStateTableData(tableData);
        }.bind(this);
    }

    handleExpandTo() { //折叠所有
        let id = this.treeExpandToRef.current.value;
        let tableData = this.state.tableData;
        this.expandTo(id, tableData);
    }

    expandTo(id, tableData) {
        if (isEmpty(id)) {
            return;
        }
        id = xpath2IdPath(id);
        let rowData = tableData[id];
        if (isNullOrUndefined(rowData)) {
            return;
        }
        if (rowData.hasOwnProperty("_parentId")) {
            this.expandParentNode(rowData["_parentId"], tableData); //递归依次展开父节点
        }
        this.changeSelectedState(id, tableData, true);
        this.updateStateTableData(tableData);
    }

    changeSelectedState(id, tableData, state, shiftHold, ctrlHold) {
        let rowData = tableData[id];
        let oldDataSelected = rowData.selected;
        if (!ctrlHold && !shiftHold) {
            this.cleanAll();
        }
        if (shiftHold && this.lastSelectIndex != -1 && rowData["index"] != this.lastSelectIndex) {    //按住shift选择一片
            let start = this.lastSelectIndex;
            let end = rowData["index"];
            if (start > end) {
                let _temp = start;
                start = end;
                end = _temp;
            }
            for (let i = start; i <= end; i++) {
                let rowData = this.getRowDataByIndex(i);
                if (!isNullOrUndefined(rowData)) {
                    rowData.selected = true;
                }
            }
            return;
        }
        rowData.selected = state || !oldDataSelected;
        if (rowData.selected) {
            this.lastSelectIndex = rowData["index"];
        } else {
            this.lastSelectIndex = -1;
        }
        if (typeof this.props.onSelected == "function") {
            this.props.onSelected(rowData);
        }
    }

    handleSelected = (data, shiftHold, ctrlHold) => { //折叠所有
        let tableData = this.state.tableData, nodeId = data.id;
        this.changeSelectedState(nodeId, tableData, null, shiftHold, ctrlHold);
        this.updateStateTableData(tableData, shiftHold);
    };

    getRowDataByIndex(index) {
        let allData = this.state.tableData;
        let rowData = null;
        Object.values(allData).map(v => {
            if (v["index"] == index) {
                rowData = v;
                return false;
            }
        });
        return rowData;
    }

    cleanAll() {
        let allData = this.state.tableData;
        Object.values(allData).map(v => {
            v.selected = false;
        })
    }

    getSelectedData() {
        return function () {
            let array = [];
            let allData = this.state.tableData;
            Object.values(allData).map(v => {
                if (v.selected) {
                    array.push(v);
                }
            })
            return array;
        }.bind(this);
    }

    refreshTreeTableRow(rowObj) { //刷新行数据
        if (isNullOrUndefined(rowObj)) {
            return;
        }
        let tableData = this.state.tableData,
            dataId = rowObj.id, rowData = rowObj.rowData, field, newData = {};
        Object.values(this.props.columns).map(config => {
            field = config.field;
            if (!isNullOrUndefined(rowObj[field])) {
                newData[field] = rowData[field]
            }
        });
        newData = extendCustomConfig(rowObj, newData);
        tableData[dataId] = newData;
        this.updateStateTableData(tableData);
    }

    refreshTreeTableData = () => {
        let oldExpandState = {};
        let tableData = this.state.tableData || {};
        Object.keys(tableData).map(key => {
            oldExpandState[key] = tableData[key].state;
        });
        this.queryTreeTableData(oldExpandState, {}, null, null, null, queryData => {
            this.setState({
                tableData: queryData.tableData,
                treeDataList: queryData.treeDataList
            });
        });
    }

    updateTreeTableOriginalData(data) {
        this.state.originalData = data;
    }

    refreshUpdateTreeTableData(updatedata) { //重载表格，保持表格各节点的原有展开状态
        let originalData = deepClone(this.state.originalData)
        let treeData = ""; // need todo
        this.state.originalData = treeData
        let oldExpandState = {};
        let tableData = this.state.tableData || {};
        Object.keys(tableData).map(key => {
            oldExpandState[key] = tableData[key].state;
        });
        this.queryTreeTableData(oldExpandState, null, null, null, treeData, function () {
            this.setState({
                tableData: queryData.tableData,
                treeDataList: queryData.treeDataList
            });
        }.bind(this));//初始化表格 重载时清除所有选中状态


    }

    createToolButton() {
        let btnHtmlArray = [];
        let {tableId} = this.props;
        if (this.props.buttons != null && this.props.buttons.expandToControl) {
            btnHtmlArray.push(
                <label>
                    <input type="text" ref={this.treeExpandToRef} id="react-tree-table-expandTo-tect"
                           key="react-tree-table-expandTo-tect"/>
                    <input type="button" role="button" id={tableId + "-expandTo-btn"} key={tableId + "-expandTo-btn"}
                           className="resetButton" onClick={this.handleExpandTo} value={getText("label.expandTo")}/>

                </label>
            );
        }

        if (this.props.buttons != null) {
            this.props.buttons.forEach(item => {
                if (typeof item != "string") {
                    let disabled = false;
                    if( item.enabled != null ) {
                        if( isFunction(item.enabled) ) {
                            disabled = !item.enabled();
                        } else {
                            disabled = !item.enabled;
                        }
                    }
                    btnHtmlArray.push(<input type="button" role="button" id={tableId + "-" + item.key + "-btn"}
                                             key={tableId + "-" + item.key + "-btn"} disabled={disabled}
                                             className="resetButton" onClick={item.onClick}
                                             value={getText(item.label)}/>);
                } else if (item === "expandButton") {
                    btnHtmlArray.push(<input type="button" role="button" id={tableId + "-expand-btn"}
                                             key={tableId + "-expand-btn"}
                                             className="resetButton"
                                             onClick={this.handleChangeExpandState(ExpandType.Open)}
                                             value={getText("label.expand")}/>);
                } else if (item === "collapseButton") {
                    btnHtmlArray.push(<input type="button" role="button" id={tableId + "-collapse-btn"}
                                             key={tableId + "-collapse-btn"}
                                             className="resetButton"
                                             onClick={this.handleChangeExpandState(ExpandType.Closed)}
                                             value={getText("label.collapse")}/>);
                } else if (item === "expandChildrenButton") {
                    btnHtmlArray.push(<input type="button" role="button" id={tableId + "-expand-children-btn"}
                                             key={tableId + "-expand-children-btn"}
                                             className="resetButton"
                                             onClick={this.handleChangeChildExpandState(ExpandType.Open)}
                                             value={getText("label.expand_children")}/>);
                } else if (item === "collapseChildrenButton") {
                    btnHtmlArray.push(<input type="button" role="button" id={tableId + "-collapse-children-btn"}
                                             key={tableId + "-collapse-children-btn"}
                                             className="resetButton"
                                             onClick={this.handleChangeChildExpandState(ExpandType.Closed)}
                                             value={getText("label.collapse_children")}/>);
                } else if (item === "expandAllButton") {
                    btnHtmlArray.push(<input type="button" role="button" id={tableId + "-expandAll-btn"}
                                             key={tableId + "-expandAll-btn"}
                                             className="resetButton"
                                             onClick={this.handleExpandAll} value={getText("expand_all")}/>);
                } else if (item === "collapseAllButton") {
                    btnHtmlArray.push(<input type="button" role="button" id={tableId + "-collapseAll-btn"}
                                             key={tableId + "-collapseAll-btn"}
                                             className="resetButton" onClick={this.handleCollapseAll}
                                             value={getText("collapse_all")}/>);
                }
            })
        }
        if (this.props.reloadButton) {
            btnHtmlArray.push(<input type="button" role="button" id={tableId + "-reload-btn"}
                                     key={tableId + "-reload-btn"}
                                     className="resetButton"
                                     onClick={this.refreshTreeTableData} value={getText("reload")}/>);
        }
        return btnHtmlArray;
    }

    createTableHeadPanel() {
        if (this.props.noButtons) {
            return <div className="max_width_div"></div>
        }
        if (this.props.initOptions.tableName != null) {
            return (
                <div className="tree-table-head">
                    <div className="tree-table-head-buttons">{this.createToolButton()}</div>
                    <div className="tree-table-head-title">
                        {getText(this.props.initOptions.tableName)}
                    </div>
                </div>);
        } else {
            return this.createToolButton();
        }
    }

    handleLoadDataMaskWaitting() {
        let loadingModal = new LoadingModal();
        loadingModal.show();
        let owner = this;
        setTimeout(function () {
            owner.handleLoadDataBtnClick();
            loadingModal.close();
        }, 200);

    }

    handleLoadDataBtnClick() {
        this.queryTreeTableData(null, null, null, this.filterData, null, function (queryData) {
            this.setState({
                tableData: queryData.tableData,
                treeDataList: queryData.treeDataList
            });
        }.bind(this));
    }

    exportAllBtnClick(columns, treeData, event) {
        exportCSVFile(1, columns, treeData);
    }

    createInitControl(key, itemConfig) {
        if (itemConfig.show != null && itemConfig.show != undefined && !itemConfig.show) {
            return null;
        }
        let type = itemConfig.control_Type || TableFilterTypeEnum.Select;
        let _ctrHtml = null;
        if (type == TableFilterTypeEnum.Select) {
            _ctrHtml = this.createInitSelect(key, itemConfig.optionDatas || new JSMap(), itemConfig);
        } else if (type == TableFilterTypeEnum.MultiSelect) {
            _ctrHtml = this.createInitMultiSelect(key, itemConfig.optionDatas || new JSMap(), itemConfig);
        }
        return (<div key={"_init_select_div_" + key} className="tableHeadDiv form-group col-sm-4 col-xs-6">
            <label className="control-label col-xs-5 filterSelectLabel">{itemConfig.label}</label>
            {_ctrHtml}
        </div>)
    }

    createInitSelect(key, initData, itemConfig) {
        let optionList = [];
        Object.keys(initData).forEach(_key => {
            optionList.push(<option value={initData[_key]}>{_key}</option>);
        });

        return (
            <select name={key} className="col-xs-7" onChange={this.changeOption(key, itemConfig.onChange)}>
                {optionList}
            </select>
        );
    }

    createInitMultiSelect(key, initData, itemConfig) {
        let optionList = [];
        for (let _key in initData) {
            let _value = initData[_key];
            optionList.push(<option label="" key={_key} fKey={_key} value={_value}>{_key}</option>);
        }
        let selectId = "multi_select_" + key;
        this.initMultiSelectRefs[key] = selectId;
        let className = "col-xs-7 btn-divClass-normal";
        return (
            <select ref={selectId} id={selectId} name={key} disabled={this.props.loading}
                    onChange={this.changeOption(key, itemConfig.onChange)} data-size="10"
                    className={className} multiple="multiple">
                {optionList}
            </select>
        );
    }

    changeOption(key, callback) {
        return function (event) {
            let _value = event.target.getAttribute("value") || event.target.value;
            this.filterData[key] = _value;
            if (callback != null && isFunction(callback)) {
                this.state.pageInfo.clearFilter();
                callback(event, _value, this.resetFilter);
            }
        }.bind(this)
    }

    resetFilter(key) {
        delete this.filterData[key];
    }

    resetTreeDate() {
        let _tableDataTemp = this.state.pageInfo.getTableData()//查询数据
        let _filter = this.state.pageInfo.getFilter();
        let treeField = this.props.treeField;
        let tableData = null;

        if (!isEmptyObj(_filter)) {
            tableData = [];
            for (let i = 0; i < _tableDataTemp.length; i++) {
                let _temp = _tableDataTemp[i];
                Object.keys(_filter).map(_key => {
                    if (_temp[_key] == _filter[_key]) {
                        tableData.push(_temp);
                    }
                    if (_temp.hasOwnProperty("_parentId")) {
                        tableData.push(_temp);
                    }
                    if (_key == treeField) {

                    }
                })
            }
        } else {
            tableData = _tableDataTemp;
        }

        if (this.props.sort == null || this.props.sort) {  //sort is set at the treetable config.
            tableData.sort(function (x, y) {
                return getNumberFromString(x._fId) - getNumberFromString(y._fId);
            });
        }
        tableData = this.createHashData(tableData);
        let expendState = this.props.initOptions.expendState || {}; //初始化默认状态
        let selectedState = this.props.initOptions.selectedState || {}; //初始化默认状态
        let treeDataList = this.createTreeTableRowData(tableData, expendState, selectedState, this.props.defaultGlobalExpendState);
        this.initIndexTableData(tableData, treeDataList, 1);

        this.setState({
            tableData: tableData,
            treeDataList: treeDataList
        });
    }

    render() {
        let width = {
            width: this.props.width
        };
        let additionClass = "react-tree-table-div";
        let treeAdditionClass = "react-tree-table-view-div"
        if (this.props.noButtons) {
            additionClass = "react-tree-table-div no_head_treeTable_panel";
            treeAdditionClass = "react-tree-table-view-div no_head_treeTable"
        }
        return (
            <div className={additionClass} style={width}>
                <div className="react-tree-table-tool-div">
                    {this.createTableHeadPanel()}
                </div>
                <div ref={this.reactTreeTableViewDiv} className={treeAdditionClass}>
                    <table className="react-treetable react-tree-lines react-treetable-root-table"
                           data-table-id={this.props.hashCode}>
                        <ReactTreeTableHead columns={this.state.columns}
                                            rownumbers={this.props.rownumbers}
                                            pageInfo={this.state.pageInfo}
                                            idField={this.props.idField}
                                            resetTreeDate={this.resetTreeDate}
                                            eachColFilter={this.props.eachColFilter}
                                            fitColumns={this.props.fitColumns}
                                            treeData={this.state.treeDataList}
                                            onColResizeMouseMove={this.handleTableColResizeSpanMouseMove}
                                            onColResizeMouseDown={this.handleTableColResizeSpanMouseDown}
                                            onColResizeMouseUp={this.handleTableColResizeSpanMouseUp}
                                            hashCode={this.props.hashCode}/>
                        <ReactTreeTableBody treeField={this.props.treeField}
                                            treeData={this.state.treeDataList}
                                            idField={this.props.idField}
                                            pageInfo={this.state.pageInfo}
                                            rownumbers={this.props.rownumbers}
                                            columns={this.state.columns}
                                            fitColumns={this.props.fitColumns}
                                            handleSelected={this.handleSelected}
                                            hashCode={this.props.hashCode}
                                            getSelectedData={this.getSelectedData}
                                            shiftHold={this.state.shiftHold}
                                            showTreeFlag={this.props.showTreeFlag}
                                            onExpand={this.onExpand} onCollapse={this.onCollapse}
                                            originalTreeData={this.state.pageInfo == null ? null : this.state.pageInfo.getTableData()}/>
                    </table>
                    <ReactDynamicStyle fitColumns={this.props.fitColumns}
                                       rownumbers={this.props.rownumbers}
                                       hashCode={this.props.hashCode}
                                       columns={this.state.columns}
                                       container={this.reactTreeTableViewDiv.current}/>
                </div>
            </div>
        );
    }

    getChildNodeList(hashData, parentNodeId) {
        let children = [];
        Object.values(hashData).map(data => {
            if (data["_parentId"] == parentNodeId) {
                children.push(data);
            }
        });
        return children;
    }

    buildChildNodes(hashData, parentNode) {
        let parentNodeId = parentNode["id"];
        let childList = this.getChildNodeList(hashData, parentNodeId);
        if (isNullOrUndefined(childList) || childList.length == 0) {
            return;
        }
        Object.values(childList).forEach(childData => {
            this.buildChildNodes(hashData, childData);
        });
        parentNode["children"] = childList;
    }

    buildTree(hashData) {
        let treeList = [];
        Object.values(hashData).map(data => {
            if (isNullOrUndefined(data["_parentId"])) {
                this.buildChildNodes(hashData, data);
                treeList.push(data);
            }
        });
        return treeList;
    }

    createTreeTableRowData(tableData, expendState, selectedState, defaultGlobalExpendState) {
        let treeDataList = [];
        let regexp = null;
        if (isNullOrUndefined(tableData)) {
            return treeDataList;
        }
        treeDataList = this.buildTree(tableData);
        Object.keys(tableData).map(dataId => {
            let row = tableData[dataId];
            if (!isNullOrUndefined(defaultGlobalExpendState)) {
                row.state = defaultGlobalExpendState;
            }
            Object.keys(expendState).forEach(key => {
                regexp = new RegExp(key);
                if (regexp.test(dataId)) {
                    row.state = expendState[key];
                }
            });
            Object.keys(selectedState).forEach(key => {
                regexp = new RegExp(key);
                if (key == dataId) {
                    row.selected = selectedState[key];
                }
            });
        });
        return treeDataList;
    }

    queryTreeTableData(defaultExpandState, defaultSelectedState, defaultGlobalExpendState, filter, facData, callback) {
        if (isNullOrUndefined(facData)) {
            facData = null;
        }
        this.props.queryData(filter, facData, function (_tableDataTemp) {
            this.state.pageInfo.setTableData(deepClone(_tableDataTemp));
            let _filter = this.state.pageInfo.getFilter();
            let treeField = this.props.treeField;
            let tableData = null;

            if (!isEmptyObj(_filter)) {
                tableData = [];
                for (let i = 0; i < _tableDataTemp.length; i++) {
                    let _temp = _tableDataTemp[i];
                    Object.keys(_filter).map(_key => {
                        if (_temp[_key] == _filter[key]) {
                            tableData.push(_temp);
                        }
                        if (_temp.hasOwnProperty("_parentId")) {
                            tableData.push(_temp);
                        }
                        if (_key == treeField) {

                        }
                    })
                }
            } else {
                tableData = _tableDataTemp;
            }
            if (this.props.sort == null || this.props.sort) {  //sort is set at the treetable config.
                tableData.sort(function (x, y) {
                    // return getNumberFromString(x["_fId"]) - getNumberFromString(y["_fId"]);
                    return formatSortString(x["_fId"]).localeCompare(formatSortString(y["_fId"]))
                });
            }
            tableData = this.createHashData(tableData);
            let expendState = defaultExpandState || {}; //初始化默认状态
            let selectedState = defaultSelectedState || {}; //初始化默认状态
            let treeDataList = this.createTreeTableRowData(tableData, expendState, selectedState, defaultGlobalExpendState);
            this.initIndexTableData(tableData, treeDataList, 1);
            callback(
                {
                    tableData: tableData,
                    treeDataList: treeDataList
                }
            )
        }.bind(this));
    }

    initIndexTableData(tableData, treeDataList, index) {
        let _index = index;
        Object.values(treeDataList).map(v => {
            let key = v["id"];
            if (!isNullOrUndefined(tableData[key])) {
                tableData[key]["index"] = _index;
                _index++;
                if (tableData[key]["children"] != null && tableData[key]["children"].length > 0) {
                    _index = this.initIndexTableData(tableData, tableData[key]["children"], _index)
                }
            }
        });
        return _index;
    }

    initTreeGrid() {
        this.setState({
            tableData: [],
            treeDataList: []
        });
        this.queryTreeTableData(this.props.initOptions.expendState,
            this.props.initOptions.selectedState,
            this.props.defaultGlobalExpendState, null, null, function (queryData) {
                let expandToList = this.props.initOptions.expandTo;
                if (!isNullOrUndefined(expandToList) && expandToList.length != 0) {
                    Object.values(expandToList).map(id => {
                        this.expandTo(id, queryData.tableData);
                    });
                }
                this.setState({
                    tableData: queryData.tableData,
                    treeDataList: queryData.treeDataList
                });
            }.bind(this));

    }

    createHashData(datas) {//创建hash data数据表，方便后续用来查询节点,以ID为key
        let hashData = {}, id;
        if (datas instanceof Array) {
            datas.forEach(data => {
                id = data["id"];
                hashData[id] = data;
            });
        }
        return hashData;
    }

    componentDidMount() {
        this.filterData = {};
        MyReactEvents.registerEvent(EventTypeEnum.UpdateTreeTableOriginalData.format(this.props.hashCode), this.props.hashCode, this, this.updateTreeTableOriginalData);
        this.initTreeGrid();//初始化表格
        MyReactEvents.registerEvent(EventTypeEnum.RefreshTreeTableRow.format(this.props.hashCode), this.props.hashCode, this, this.refreshTreeTableRow);//注册表格刷新行事件
        MyReactEvents.registerEvent(EventTypeEnum.RefreshTreeTableData.format(this.props.hashCode), this.props.hashCode, this, this.refreshTreeTableData);//注册表格重载事件
    }

    componentWillUnmount() {
        MyReactEvents.unRegisterEvent(EventTypeEnum.RefreshTreeTableRow.format(this.props.hashCode), this.props.hashCode);
        MyReactEvents.unRegisterEvent(EventTypeEnum.RefreshTreeTableData.format(this.props.hashCode), this.props.hashCode);
        MyReactEvents.unRegisterEvent(EventTypeEnum.UpdateTreeTableOriginalData.format(this.props.hashCode), this.props.hashCode)
    }
}

ReactTreeTable.propTypes = {
    queryData: PropTypes.func.isRequired,
    hashCode: PropTypes.number.isRequired
};

ReactTreeTable.defaultProps = {
    tableId: "",
    rownumbers: true, //是否显示ID列
    idField: '', //ID列的列标题
    fitColumns: true, //是否自适应表格宽度
    treeField: '', //将折叠按钮增加到那一列上,必选
    showTreeFlag: true,
    columns: [],
    eachColFilter: null,
    expandToControl: false,
    expandButton: false,
    collapseButton: false,
    expandChildrenButton: false,
    collapseChildrenButton: false,
    expandAllButton: false,
    collapseAllButton: false,
    exportAllButton: false,
    reloadButton: true,
    onExpand: function () {

    },
    onCollapse: function () {

    },
    onSelected: function () {

    },
    defaultGlobalExpendState: ExpandType.Closed,
    initOptions: {
        expendState: { //key 对应rowdata的id，其值为正则表达式，value为节点状态
        },
        selectedState: { //key 对应rowdata的id，其值为正则表达式，value为选中状态 true|false

        },
        expandTo: []
    },
    level: null,
    noButtons: false
};

class ReactDynamicStyle extends Component {
    constructor(props) {
        super(props);
        this.state = {
            catchStyleObj: {},
            catchMinWidthStyleObj: {},
            resize: currentTimeStamp()
        };
    }

    getStyleList() {
        let _temp = this.getDynamicStyle();
        let styleList = [];
        let catchStyleObj = _temp.catchStyleObj;
        if (isNullOrUndefined(catchStyleObj)) {
            return styleList;
        }
        let catchMinWidthStyleObj = _temp.catchMinWidthStyleObj;
        if (this.props.fitColumns) {
            let totalWidth = catchStyleObj.totalWidth;
            if (!isNullOrUndefined(this.props.container)) {
                let mainWidth = 0;
                parseInt
                mainWidth = window.getComputedStyle(this.props.container).width;
                mainWidth = mainWidth.replace("px", "");
                mainWidth = parseFloat(mainWidth) - 28;

                let totalMinWidth = 0;
                Object.values(catchMinWidthStyleObj).forEach(value => {
                    totalMinWidth += value;
                });
                mainWidth -= totalMinWidth;
                let showWidth = 0;
                Object.keys(catchStyleObj).map(key => {
                    let width = catchStyleObj[key];
                    if (isNullOrUndefined(catchMinWidthStyleObj[key])) {
                        showWidth = parseInt((width / totalWidth) * mainWidth);
                        styleList.push(key + "{width:" + showWidth + "px; }");
                    } else {
                        styleList.push(key + "{width:" + catchMinWidthStyleObj[key] + "px; min-width:" + catchMinWidthStyleObj[key] + "px; }");
                    }
                });
            }
        } else {
            Object.keys(catchStyleObj).map(key => {
                let width = catchStyleObj[key];
                if (isNullOrUndefined(catchMinWidthStyleObj[key])) {
                    styleList.push(key + "{width:" + width + "px; }");
                } else {
                    styleList.push(key + "{width:" + width + "px; min-width:" + catchMinWidthStyleObj[key] + "px;}");
                }
            });
        }
        return styleList;
    }

    render() {
        return (
            <style type="text/css">
                {this.getStyleList().join("\n")}
            </style>
        );
    }

    getDynamicStyle() {
        let cellClass = cellClassPrefix;
        let catchStyleObj = {},
            catchMinWidthStyleObj = {},
            classKey = "";
        let totalWidth = 0;
        if (this.props.rownumbers) {
            classKey = "." + cellClass + "rownumber";
            catchStyleObj[classKey] = 29;
            catchMinWidthStyleObj[classKey] = 29;
        }
        Object.values(this.props.columns).map(config => {
            classKey = "." + cellClass + config.field;
            catchStyleObj[classKey] = config.width;
            if (config.hasOwnProperty("minWidth")) {
                catchMinWidthStyleObj[classKey] = config.minWidth;
            } else {
                totalWidth += config.width;
            }
        });
        catchStyleObj["totalWidth"] = totalWidth;
        return {
            catchStyleObj: catchStyleObj,
            catchMinWidthStyleObj: catchMinWidthStyleObj
        };
    }

    componentDidMount() {
        this.resizeTable();
        window.addEventListener("resize", this.resizeTable.bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeTable.bind(this));
    }

    resizeTable() {
        this.setState({
            resize: currentTimeStamp()
        });
    }
}

class ReactTreeTableHead extends Component {
    constructor(props) {
        super(props);
    }

    createTDList() {
        let columns = this.props.columns, tdHtmlList = [];
        if (isNullOrUndefined(columns)) {
            return tdHtmlList;
        }
        // idField: 'id', //ID列的列标题
        if (this.props.rownumbers) {
            tdHtmlList.push(
                <td key="react-treetable-header-rownumber">
                    <div className={"react-treetable-cell " + cellClassPrefix + "rownumber"}
                         onMouseMove={this.props.onColResizeMouseMove}
                         onMouseUp={this.props.onColResizeMouseUp}>
                        {this.props.idField}
                    </div>
                    <span className="table-col-resize"
                          onMouseDown={this.props.onColResizeMoveDown}> &nbsp; </span>
                </td>
            );
        }
        let columnList = Object.values(columns);
        columnList.forEach((fieldConf, idx) => {
            let _html;
            let supportResize = (idx + 1) < columnList.length && (columnList[idx + 1].field !== "editBtns");
            if (this.props.eachColFilter != null && this.props.eachColFilter.show && this.props.eachColFilter.showCol[fieldConf.field] != null) {
                let filterSpan = this.createFilter(fieldConf.field);
                _html = <td key={cellClassPrefix + fieldConf.field} data-field={fieldConf.field}
                            onMouseEnter={this.tableHeadMouseEntryEvent.bind(this, fieldConf.field)}
                            onMouseOut={this.tableHeadMouseOutEvent.bind(this, fieldConf.field)}>
                    <div className={"react-treetable-cell " + cellClassPrefix + fieldConf.field}
                         onMouseMove={this.props.onColResizeMouseMove}
                         onMouseUp={this.props.onColResizeMouseUp}
                         onMouseEnter={this.tableHeadMouseEntryEvent.bind(this, fieldConf.field)}
                         onMouseOut={this.tableHeadMouseOutEvent.bind(this, fieldConf.field)}
                    >
                        <span onMouseEnter={this.tableHeadMouseEntryEvent.bind(this, fieldConf.field)}
                              onMouseOut={this.tableHeadMouseOutEvent.bind(this, fieldConf.field)}>{fieldConf.title}</span>
                    </div>
                    {filterSpan}
                    {supportResize ? (
                        <span className="table-col-resize"
                              onMouseDown={this.props.onColResizeMouseDown}> &nbsp; </span>) : ""}
                </td>;
            } else {
                _html = <td key={cellClassPrefix + fieldConf.field} data-field={fieldConf.field}>
                    <div className={"react-treetable-cell " + cellClassPrefix + fieldConf.field}
                         onMouseMove={this.props.onColResizeMouseMove}
                         onMouseUp={this.props.onColResizeMouseUp}>
                        <span>{fieldConf.title}</span>
                    </div>
                    {supportResize ? (
                        <span className="table-col-resize"
                              onMouseDown={this.props.onColResizeMouseDown}> &nbsp; </span>) : ""}
                </td>;
            }

            tdHtmlList.push(_html);
        });
        return tdHtmlList;
    }

    tableHeadMouseEntryEvent(key) {
        let _obj = document.querySelector("[name='react-table-head-th-filter-control-button-key-" + key + "']");
        if (_obj.length > 0) {
            _obj.css("display", "block");
        }
    }

    tableHeadMouseOutEvent(key) {
        let _obj = document.querySelector("[name='react-table-head-th-filter-control-button-key-" + key + "']");
        if (_obj.length > 0) {
            _obj.css("display", "none");
        }
    }

    createFilter(key) {
        let filterList = [];
        let filterShow = "";
        let eachColFilter = this.props.eachColFilter;
        let filterClass = "normal";
        if (this.props.filter != null && !isEmpty(this.props.filter[key])) {
            filterClass = "filter";
            filterShow = "filterButton-show";
        }
        if (eachColFilter != null && eachColFilter.show) {
            let showCol = eachColFilter.showCol;
            if (!isEmptyObj(showCol[key])) {
                let filterControl = this.createFilterControl(key);
                filterList.push(
                    <div key={"react-table-head-th-filter-div-key-" + key} className="react-filter-div">
                        <a key={"react-table-head-th-filter-control-button-key-" + key}
                           name={"react-table-head-th-filter-control-button-key-" + key}
                           className={"filterButton " + filterShow} role="button" onClick={this.handleFilterBtnClick}
                           onMouseEnter={this.tableHeadMouseEntryEvent.bind(this, key)}
                           onMouseOut={this.tableHeadMouseOutEvent.bind(this, key)}>
                            <i className={"iconfont icon-filter flex flex-justify-center flex-align-center " + filterClass}></i>
                        </a>
                        {filterControl}
                    </div>)
            }
        }
        return (
            filterList
        );
    }

    handleFilterBtnClick(event) {
        event.stopPropagation();
        let filterBtn = event.target.parentElement;
        let filterDiv = nextDom(filterBtn, "div");//获取当前点击按钮的兄弟节点，即输入框或下拉框组件
        let td = closestDom(filterBtn, "td");
        document.querySelectorAll("table div.float-filter-div").each(function (index, divItem) {//关闭所有filter组件
            if (!divItem.classList.contains("none")) {
                divItem.classList.add("none");
            }
        }); //remove all filter div firstly
        if (filterDiv.classList.contains("none")) { //打开当前需要的filter组件
            filterDiv.classList.remove("none");
            filterDiv.style.width = td.clientWidth + "px";
            filterDiv.style.top = (td.clientHeight - 2) + "px";
        }
        const close_filter_control = function (event) { //注册document事件，当点击页面的非当前过滤组件时，关闭组件
            event.stopPropagation();//阻止浏览器继续传播,触发底层事件
            if (event.target.parentElement == filterDiv) { //判断当前点击的组件是不是filter的子组件,如果是，则不进行处理，防止关闭组件框
                return;
            }
            filterDiv.classList.add("none");
            document.removeEventListener("click", close_filter_control);
        };
        document.addEventListener("click", close_filter_control);
    }

    createFilterControl(key, config) {
        let filterCol = {}, type = TableFilterTypeEnum.Select;
        if (this.props.eachColFilter != null && !isEmptyObj(this.props.eachColFilter.showCol)) {
            filterCol = this.props.eachColFilter.showCol;
            if (isEmpty(filterCol[key])) {
                return null;
            } else {
                type = filterCol[key].control_Type;
            }
        }
        let _ctrHtml = null;
        if (type == TableFilterTypeEnum.Select) {
            _ctrHtml = this.createSelectFilter(key, config);
        }
        return (
            <div key={"react-table-tbody-filter-control-key-" + key}
                 name={"react-table-tbody-filter-control-key-" + key} className="float-filter-div none" data-flag={key}>
                {_ctrHtml}
            </div>
        );
    }

    createSelectFilter(key) {
        let optionList = [],
            tableData = this.props.pageInfo.getTableData();
        optionList.push(<option key={key + "_" + -1} value={PLEASE_SELECT_VALUE}>{getText("label.all")}</option>);
        Object.values(tableData).map(_item => {
            let selected = false;
            if (!_item.hasOwnProperty("_parentId")) {
                let filters = this.props.pageInfo.getFilter();
                if (!isEmptyObj(filters)) {
                    Object.keys(filters).map(_k => {
                        if (_item[_k] == filters[_k]) {
                            selected = true;
                        }
                    });
                }
                if (selected) {
                    optionList.push(<option value={_item[key]} selected="selected">{_item[key]}</option>);
                } else {
                    optionList.push(<option value={_item[key]}>{_item[key]}</option>);
                }
            }
        });

        return (
            <select key={key + "_" + this.props.tableConfig.tableKey} className="tableSelect"
                    name={"tree_table_filter_select_" + key} onChange={this.onSelectChangeEvent(key)}>
                {optionList}
            </select>
        );
    }

    onSelectChangeEvent(key) {
        return function (event) {
            let _selectValue = event.target.value || event.target.getAttribute("value");
            this.props.pageInfo.addFilter(key, _selectValue);
            this.props.resetTreeDate()
        }.bind(this)
    }

    render() {
        return (
            <thead className="react-table-thead">
            <tr className="react-treetable-header-row">
                {this.createTDList()}
            </tr>
            </thead>
        );
    }
}

class ReactTreeTableBody extends Component {
    constructor(props) {
        super(props);
        this.rowId = 0;
    }

    handleExpendBtnClick(data) {
        let nodeId = data.id;
        return function (event) {
            event.stopPropagation();
            let expentBtn = event.target;
            let div = document.querySelector("div[data-node-id=" + nodeId + "]");
            if (expentBtn.classList.contains("react-tree-expanded")) {
                expentBtn.classList.remove("react-tree-expanded");
                expentBtn.classList.add("react-tree-collapsed");
                div.classList.add("tree-collapsed");
                this.props.onCollapse(data);
            } else if (expentBtn.classList.contains("react-tree-collapsed")) {
                expentBtn.classList.remove("react-tree-collapsed");
                expentBtn.classList.add("react-tree-expanded");
                div.classList.remove("tree-collapsed");
                this.props.onExpand(data);
            }
        }.bind(this);
    }

    handleTreeTableDataRowClick(data) {
        return function (event) {
            event.stopPropagation();
            this.props.handleSelected(data, event.shiftKey, event.ctrlKey)
        }.bind(this)
    }

    createTreeFlag(level, data, lineFlag) {
        let flagHtml = [];
        if (!this.props.showTreeFlag) {
            return flagHtml;
        }
        let stateClass = "";
        for (let i = 1; i <= level; i++) {
            if (i == level) {
                if (isNullOrUndefined(data.children) || data.children.length == 0) {
                    stateClass = "react-tree-join";
                } else {
                    if (data.state == ExpandType.Closed) {
                        stateClass = "react-tree-collapsed";
                    } else {
                        stateClass = "react-tree-expanded";
                    }
                }
                flagHtml.push(<span key={"react-tree-state-" + data.id} onClick={this.handleExpendBtnClick(data)}
                                    className={"react-tree-indent react-tree-hit " + stateClass}></span>);
            } else {
                if (!lineFlag[i]) {
                    flagHtml.push(<span key={"react-tree-indent-" + data.id + "-" + i}
                                        className="react-tree-indent"></span>); //增加空格
                } else {
                    flagHtml.push(<span key={"react-tree-line-" + data.id + "-" + i}
                                        className="react-tree-indent react-tree-line"></span>); //第一级增加竖线
                }
            }
        }
        return flagHtml;
    }

    handleDetailBtnClick(e) {
        e.stopPropagation();//阻止事件传播
    }

    getCellData(data, config, editDivID) {
        if (isNullOrUndefined(config)) {
            return "";
        }
        let field = config.field,
            formatter = config.formatter;
        if (!isNullOrUndefined(formatter)) {
            if (typeof formatter == "function") {
                let btnList = formatter(data, field, this.props.getSelectedData(), editDivID, field, config, this.props.originalTreeData);
                return btnList;
            }
        }
        return data[field];
    }

    createRowTd(rowId, level, data, hasNext, lineFlag, editDivID) {
        let rowTdHtmlList = [];
        if (this.props.rownumbers) {
            rowTdHtmlList.push(
                <td key={"react-table-body-id-cell-" + rowId} data-field="id">
                    <div className={"react-treetable-cell " + cellClassPrefix + "rownumber"} title={rowId}>{rowId}</div>
                </td>
            );
        }
        Object.values(this.props.columns).map(config => {
            let cellData = this.getCellData(data, config, editDivID);
            let cellTitle = cellData;
            if (typeof cellTitle != "string") {
                cellTitle = "";
            }
            if (config.field == this.props.treeField) { //显示折叠按钮的列
                rowTdHtmlList.push(
                    <td key={"react-table-body-" + config.field + "-cell-" + data.id} data-field={config.field}
                        title={cellTitle}>
                        <div key={"react-table-body-" + config.field + "-cell-div-" + data.id}
                             className={"react-treetable-cell " + cellClassPrefix + config.field + " " + (hasNext ? "" : "react-tree-node-last")}>
                            {this.createTreeFlag(level, data, lineFlag)}
                            <span key={"react-table-body-" + config.field + "-cell-title-" + data.id}
                                  className="react-tree-title">{cellData}</span>
                        </div>
                    </td>
                );
            } else {
                rowTdHtmlList.push(
                    <td key={"react-table-body-" + config.field + "-cell-" + data.id} data-field={config.field}
                        title={cellTitle}>
                        <div key={"react-table-body-" + config.field + "-cell-div-" + data.id}
                             className={"react-treetable-cell " + cellClassPrefix + config.field}>
                            {cellData}
                        </div>
                    </td>
                );
            }
        });
        return rowTdHtmlList;
    }

    createTreeTr(treeData, level, lineFlag, shiftHold) {
        let treeHtmlList = [];
        if (isNullOrUndefined(treeData)) {
            return treeHtmlList;
        }
        let hasNext = false, selectedState = [];
        let colSpan = 7;
        if (!isNullOrUndefined(this.props.columns)) {
            colSpan = this.props.columns.length + 2;
        }
        Object.keys(treeData).map(index => {
            let data = treeData[index];
            hasNext = !(index == treeData.length - 1);
            if (data.selected) {
                selectedState.push("treetable-row-selected");
                if (shiftHold) {
                    selectedState.push("shift-selected");
                }
            } else {
                selectedState.splice(0, selectedState.length);
            }
            let rowId = ++this.rowId;
            let {hashCode} = this.props;
            let editDivID = "react_collapse_div_" + (hashCode || currentTimeStamp()) + "_" + rowId;
            treeHtmlList.push(
                <tr key={"react-treetable-row-r2r-" + data.id} id={"react-treetable-row-r2r-" + data.id}
                    onClick={this.handleTreeTableDataRowClick(data)} data-node-id={data.id}
                    className={"react-tree-table-row react-data-row " + selectedState.join(" ")}>
                    {this.createRowTd(rowId, level, data, hasNext, lineFlag, editDivID)}
                </tr>
            );
            treeHtmlList.push(
                <tr key={"react-treetable-row-r2r-edit-" + data.id} className="react-table-edit-row">
                    <td colSpan={colSpan} className="react-table-edit-row-collapseTd">
                        <div id={editDivID} className="panel-collapse collapse react-collapse-div">
                        </div>
                    </td>
                </tr>
            );
            lineFlag[level] = hasNext;
            if (!isNullOrUndefined(data.children) && data.children.length != 0) {
                let newlineFlag = deepClone(lineFlag);
                let expandState = "";
                if (data.state == ExpandType.Closed) {
                    expandState = "tree-collapsed";
                }
                treeHtmlList.push(
                    <tr className="react-treetable-tree" key={"tr" + index}>
                        <td colSpan={colSpan}>
                            <div className={"react-treetable-tree-div " + expandState} data-node-id={data.id}>
                                <table className="react-treetable react-treetable-tree">
                                    <tbody>
                                    {this.createTreeTr(data.children, level + 1, newlineFlag, shiftHold)}
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                );
            }
        });
        return treeHtmlList;
    }

    render() {
        let {shiftHold, treeData} = this.props;
        this.rowId = 0;
        return (
            <tbody className="react-treetable-body-content">
            {this.createTreeTr(treeData, 1, {}, shiftHold)}
            </tbody>
        );
    }

    componentDidUpdate() {
    }

    componentDidMount() {
    }
}

export {ExpandType, ReactTreeTable};
