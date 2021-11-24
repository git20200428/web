import {editRpcItem} from "../custom/comm/react_common";
import {checkUserClass, getText, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";

let routingView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("Clear OSPF Instance"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-ospf-instance"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const indtanceID = data[0]["instance-id"];
                    let initData = {
                        'instance': indtanceID
                    };
                    let init = {
                        'initData': initData,
                        'title': "Clear OSPF Instance"
                    }
                    editRpcItem("clear-ospf-instance", init, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }
            }
        ],
    };
    return options;
};


export {routingView};