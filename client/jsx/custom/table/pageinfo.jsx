import {deepClone, isEmptyObj, isNullOrUndefined, PLEASE_SELECT_VALUE} from "../utils";
import {DataTypeEnum} from "../../tableConfig";
import {SortFlag} from "./react_table";

let compareObject = function (c_key, flag, formatConfig) {
    return function (obj1, obj2) {
        let v1 = obj1[c_key], v2 = obj2[c_key];
        if (Array.isArray(v1)) {
            v1 = v1.toString();
        }
        if (Array.isArray(v2)) {
            v2 = v2.toString();
        }
        let f = (flag == SortFlag.ASC) ? 1 : -1;
        if (isNullOrUndefined(v1)) {
            v1 = "";
        }
        if (isNullOrUndefined(v2)) {
            v2 = "";
        }
        if (formatConfig != null) {
            let obj1 = {};
            obj1[c_key] = v1;
            let _v1 = formatConfig(obj1, c_key);
            if (!isNullOrUndefined(_v1) && typeof (_v1) === "string") {
                v1 = _v1;
            }
            let obj2 = {};
            obj2[c_key] = v2;
            let _v2 = formatConfig(obj2, c_key);
            if (!isNullOrUndefined(_v2) && typeof (_v1) === "string") {
                v2 = _v2;
            }
        }
        if (v1 != null) {
            if (!isNaN(v1) && !isNaN(v2)) {
                if( v1 === "" && v2 === "" ) {
                    return 0;
                }
                if( v1 === "" && v2 != ""  ) {
                    return 0 - f
                }
                if( v1 != "" && v2 === "" ) {
                    return f;
                }
                if (parseFloat(v1) >= parseFloat(v2)) {
                    return f
                } else {
                    return 0 - f
                }
            }
            if (!(v1).localeCompare) {
                return 0;
            } else if ((v1).localeCompare(v2) >= 0) {
                return f;
            } else if ((v1).localeCompare(v2) < 0) {
                return 0 - f;
            }
        } else {
            return 0;
        }
    }
};

let PageInfo = function () {
    this.idDataObj = {};
    this.initData = {};
    this.showData = {};
    this.pageSize = 10000;
    this.currentPage = 1;
    this.totalPageSize = 0;
    this.totalSize = 0;
    this.pageNumbList = [];
    this.filter = {};
    this.filterType = {};
    this.sort = {};
    this.tableConfig = {};

    PageInfo.UpdateFlag = {
        PageSize: 1,
        CurrentPage: 2,
        AddFilter: 3,
        ResetFilter: 4,
        SortData_ASC: 5,
        SortData_DESC: 6,
        InitLoad: 7,
        InitClear: 8,
        ChangeSelected: 9,
        SortData_NONE: 10
    };

    this.initDataAddTagFlag = function (dataList, defaultTableSelected) {
        let id = 0;
        for (let index = 0; index < dataList.length; ++index) {
            let data = dataList[index];
            id = index + 1;
            data["@id"] = id;
            this.idDataObj[id] = data;
            if (!isNullOrUndefined(defaultTableSelected)) {
                Object.keys(defaultTableSelected).map(field => {
                    if (data[field] == defaultTableSelected[field]) {
                        data["_selected"] = true;
                    }
                });
            }
        }
    };

    this.init = function (initData, tableConfig) {
        this.initDataAddTagFlag(initData, tableConfig.defaultTableSelected);
        this.tableConfig = tableConfig;
        this.initData = initData;
        this.showData = initData;
        this.totalSize = this.showData.length;
        this.updatePageInfo();
        this.setCurrentPage(this.currentPage);
        if (tableConfig.hasOwnProperty("sort")) {
            this.setSort(tableConfig.sort.sortKey, tableConfig.sort.sortFlag);
        }
        if (!isEmptyObj(tableConfig.defaultTableFilter)) {
            this.addFilterList(tableConfig.defaultTableFilter);
        }
        this.setPageSize(tableConfig.pageSize ? tableConfig.pageSize.defaultSize : 20);
    };

    this.setNewPageData = function (newData, currentPage) {
        this.initDataAddTagFlag(newData);
        this.initData = newData;
        this.updateShowDataWithFilter();
        this.setCurrentPage(currentPage || this.currentPage);
    };

    this.updatePageInfo = function () {
        this.totalSize = this.showData.length;
        this.totalPageSize = Math.floor(this.totalSize / this.pageSize);
        (this.totalSize % this.pageSize) > 0 ? this.totalPageSize++ : this.totalPageSize;
    };

    this.setCurrentPage = function (currentPage) {
        this.currentPage = parseInt(currentPage);
        if (this.totalPageSize === 0) {
            updatePageNumList(1, 1);
        }
        if (this.totalPageSize < 5) {
            updatePageNumList(1, this.totalPageSize);
        } else {
            if (this.currentPage < 3) {
                updatePageNumList(1, 5);
            } else {
                if (this.currentPage + 2 > this.totalPageSize) {
                    updatePageNumList(this.totalPageSize - 4, this.totalPageSize);
                } else {
                    updatePageNumList(this.currentPage - 2, this.currentPage + 2);
                }
            }
        }
    };

    this.addFilter = function (key, value, type, notUpdated = false) {
        if (value == null || value.length === 0 || value === PLEASE_SELECT_VALUE) {
            delete this.filter[key];
            delete this.filterType[key];
        } else {
            this.filter[key] = value;
            this.filterType[key] = type || DataTypeEnum.Accurate
        }

        if (!notUpdated) {
            this.updateShowDataWithFilter();
            this.setCurrentPage(1);
        }
    };

    /**
     * 一次增加多个过滤条件
     * @param filters 过滤条件集合 {[key] : { value : [val], type : [type]}}  type默认为DataTypeEnum.Accurate全匹配， （DataTypeEnum.Fuzzy）表示模糊匹配
     */
    this.addFilterList = function (filters) {
        if (isEmptyObj(filters)) return;
        Object.keys(filters).map(key => {
            let obj = filters[key];
            if (isEmptyObj(obj)) return;
            let value = obj.value, type = obj.type;
            this.addFilter(key, value, type, true);
        });
        this.updateShowDataWithFilter();
        this.setCurrentPage(1);
    };

    this.resetFilter = function () {
        this.filter = {};
        this.sort = {};
        this.updateShowDataWithFilter();
        this.setCurrentPage(1);
    };

    this.updateShowDataWithFilter = function () {
        this.showData = [];
        let fileKeys = Object.getOwnPropertyNames(this.filter);
        let key, data, flag = true;
        if (this.initData == null) {
            this.initData = [];
        }
        for (let _num = 0, _len = this.initData.length; _num < _len; _num++) {
            flag = true;
            data = this.initData[_num];
            for (let _start = 0, _end = fileKeys.length; _start < _end; _start++) {
                key = fileKeys[_start];
                if (this.filterType[key] === DataTypeEnum.Fuzzy) {
                    if (data[key].indexOf(this.filter[key]) === -1) {
                        flag = false;
                        break;
                    }
                } else if (this.filterType[key] == DataTypeEnum.MultiMatch) {
                    if (this.filter[key] && this.filter[key].length > 0 && (this.filter[key]).indexOf(data[key]) === -1) {
                        flag = false;
                        break;
                    }
                } else if (this.filterType[key] == DataTypeEnum.Accurate) {
                    if (this.filter[key] != data[key]) {
                        flag = false;
                        break;
                    }
                }
            }
            if (flag) {
                this.showData.push(data);
            }
        }
        this.updatePageInfo();
    };

    this.setPageSize = function (pageSize) {
        this.pageSize = parseInt(pageSize);
        this.updatePageInfo();
        this.setCurrentPage(1);
    };

    this.setSort = function (key, sortType) {
        if (sortType === SortFlag.NONE) {
            key = "@id";
            sortType = SortFlag.ASC;
        }

        this.sort = {[key]: sortType};
        this.showData.sort(compareObject(key, sortType,
            (this.tableConfig.tableHead[key] != null ? this.tableConfig.tableHead[key]["cellDataFun"] : null)));
    };

    let updatePageNumList = (start, end) => {
        this.pageNumbList = [];
        do {
            this.pageNumbList.push(start++);
        } while (start <= end);
    };

    this.getShowData = function () {
        let showData = this.showData.concat([]);
        Object.keys(this.sort).map(key => {
            showData.sort(compareObject(key, this.sort[key], (this.tableConfig.tableHead[key] != null ? this.tableConfig.tableHead[key]["cellDataFun"] : null)));
        });
        return showData;
    };

    this.lastSelectIndex = -1;

    this.changeSelectedState = function (obj) {   //obj : id, shiftClick, ctrlClick
        if (isNullOrUndefined(obj)) return;
        let id = obj["id"];
        let ctrlHold = obj["ctrlClick"];
        let shiftHold = obj["shiftClick"];

        let rowData = this.getShowDataById(id);
        if (isNullOrUndefined(rowData)) {
            return;
        }
        let oldDataSelected = rowData["_selected"];
        if (!ctrlHold && !shiftHold) {
            this.cleanAllSelected();
        }
        if (shiftHold && this.lastSelectIndex !== -1 && rowData["@id"] != this.lastSelectIndex) {    //按住shift选择一片
            let start = this.lastSelectIndex;
            let end = rowData["@id"];
            let findState = 0;
            Object.values(this.getShowData()).some(v => {
                let index = v["@id"];
                if (index === start || index === end) {
                    findState++;
                }
                if (findState === 1 || findState === 2) {
                    if (!v["_selected"]) {
                        v["_selected"] = true;
                    }
                }
                return findState > 1;
            });
            return;
        }
        rowData["_selected"] = !oldDataSelected;
        if (rowData["_selected"]) {
            this.lastSelectIndex = id;
        } else {
            this.lastSelectIndex = -1;
        }
    };

    this.cleanAllSelected = function () {
        Object.values(this.showData).map(v => {
            v["_selected"] = false;
        })
    };

    this.getShowDataById = function (id) {
        for (let i = 0; i < this.showData.length; i++) {
            if (this.showData[i]["@id"] == id) {
                return this.showData[i];
            }
        }
        return null;
    };

    this.getSelectedData = function () {
        return () => {
            let array = [];
            Object.values(this.showData).map(v => {
                if (v["_selected"]) {
                    array.push(v);
                }
            });
            return array;
        };
    };

    this.toString = function () {
        return "Total:" + this.totalSize + "Records" + ",The current page shows:" + this.pageSize + "Records, The current page number is:" + this.currentPage + ", Total page number is:" + this.totalPageSize;
    };
};

export default PageInfo;