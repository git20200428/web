import {editRpcItem} from "../custom/comm/react_common";
import {checkUserClass, getText, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";

let protocolView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("call-home"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("call-home"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const serverName = data[0]["name"];
                    let initData = {
                        'dial-out-server-name': serverName
                    };
                    let init = {
                        'initData': initData,
                        'title': getText("call-home")
                    }
                    editRpcItem("call-home", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "call",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    };
    return options;
};


export {protocolView};