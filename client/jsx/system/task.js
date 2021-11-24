/**
 * Created by jwu on 2020/09/02.
 */
import {editRpcItem} from "../custom/comm/react_common";
import {checkUserClass, getText, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";

let taskView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("Run Task"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("run-task"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    const taskName = data[0]["name"];
                    let initData = {
                        'task-name': taskName
                    };
                    let init = {
                        'initData': initData,
                        'title': "Run Task"
                    }
                    editRpcItem("run-task", init, {tableHashCode: hashCodeStr}, function (_resultData) {

                    });
                },
                buttonClass: {
                    normal: "iconfont icon-run",
                }
            }
        ],

    };
    return options;
};

export {taskView};