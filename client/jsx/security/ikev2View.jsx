/**
 * Created by jwu on 2020/08/05.
 */
import {callRpc, editRpcItem, refreshTableType} from "../custom/comm/react_common";
import {checkUserClass, getText, isNullOrUndefined, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";


let IKEV2View = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("re-auth"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("re-auth"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let label = data[0]["name"];
                    let initData = {
                        'ikev2-peer': label
                    };
                    let init = {
                        'title': getText("re-auth"),
                        'initData': initData,
                        showMessage: true
                    };
                    editRpcItem("re-auth", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_editTime",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    };
    return options;
};



export {IKEV2View};
