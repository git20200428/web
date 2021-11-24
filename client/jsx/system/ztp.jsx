/**
 * Created by jwu on 2020/08/20.
 */
import {editRpcItem} from "../custom/comm/react_common";
import {checkUserClass, getText, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";

let chgZTPModeView = function (hashCodeStr) {
    let options = {
        globalEdit: [
            {
                label: getText("change-ztp-mode"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("change-ztp-mode"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const ztpMode = data[0]["ztp-mode"];
                    let initData = {
                        'ztp-mode': ztpMode
                    };
                    let init = {
                        'initData': initData,
                        'title': getText("change-ztp-mode")
                    }
                    editRpcItem("change-ztp-mode", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],

    };
    return options;
};


export {chgZTPModeView};