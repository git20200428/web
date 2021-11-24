/**
 * event object
 * @param _eKey
 * @param _eComp
 * @param _eFn
 * @constructor
 */

let EventObject = function (_eKey, _eComp, _eFn) {
    this.eventKey = _eKey;
    this.entity = _eComp;
    this.fn = _eFn;
    this.date = new Date();
};

let InfineraEventPrefix = "__infinera__";

export const MyReactEvents = function () {
    let _event_cIdList = {};
    let _eventCid_Obj = {};

    /**
     * register event
     * @param _eKey
     * @param _eFn
     * @param _eComp
     */
    function registerEvent(_eKey, _eCompId, _eComp, _eFn) {
        if (_eKey == null || _eCompId == null || _eComp == null || _eFn == null ||
            _eKey == undefined || _eCompId == undefined || _eComp == undefined || _eFn == undefined) {
            return false;
        }
        let eCIDList = getCidListFromEventKey(_eKey);
        if (eCIDList.indexOf(_eCompId) == -1) {
            eCIDList.push(_eCompId);
            _event_cIdList[_eKey] = eCIDList;
        }
        let eObj = new EventObject(_eKey, _eComp, _eFn);
        _eventCid_Obj[(InfineraEventPrefix + _eKey + _eCompId)] = eObj;
    }

    function unRegisterEvent(_eKey, _eCompId) {
        let eCIDList = getCidListFromEventKey(_eKey);
        for (let i = 0; i < eCIDList.length; i++) {
            if (_eCompId == eCIDList[i]) {
                eCIDList.splice(i, 1);
                break;
            }

        }
        _event_cIdList[_eKey] = eCIDList;
        _eventCid_Obj[(InfineraEventPrefix + _eKey + _eCompId)] = null;
    }

    function emitEvent(_eKey) {
        let params = Array.prototype.slice.call(arguments).splice(1);
        let eCIDList = getCidListFromEventKey(_eKey);
        for (let _i = 0, _j = eCIDList.length; _i < _j; _i++) {
            let eventObj = _eventCid_Obj[(InfineraEventPrefix + _eKey + eCIDList[_i])];
            if (typeof eventObj.fn == "function") {
                eventObj.fn.apply(eventObj.entity, params);
            }
        }
    }

    let getCidListFromEventKey = function (_eKey) {
        let eCIDList = _event_cIdList[_eKey];
        if (eCIDList == null) eCIDList = [];
        return eCIDList;
    };
    return {
        registerEvent: registerEvent,
        unRegisterEvent: unRegisterEvent,
        emitEvent: emitEvent,

    }
}();

export const EventTypeEnum = {
    RefreshTableData: "__1__infinera_event_msg_refresh_table_data_{0}_",//used in reacttable
    RefreshTableRow: "__2__infinera_event_msg_refresh_table_row_data_{0}_",//used in react_common
    RefreshTreeTableData: "__3__infinera_event_msg_refresh_tree_table_data_{0}_",//used in treetable
    RefreshTreeTableRow: "__4__infinera_event_msg_refresh_tree_table_row_data_{0}_",//used in treetable
    UpdateTreeTableOriginalData: "__5__infinera_event_msg_refresh_update_tree_table_original_data_{0}_",//used in facility
    RefreshReactModelData: "__6__infinera_event_msg_refresh_dialog_data_{0}_",//used in head-component
};



