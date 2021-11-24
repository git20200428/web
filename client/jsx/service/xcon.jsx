import {editRpcItem} from "../custom/comm/react_common";
import {checkUserClass, EnvironmentConfig, getText, requestData, USER_CLASS_TYPE} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";

let DNATestConfig = {
    "xcon" : ["CLR","CDM"]
}

function DNATestEnable() {
    return navigator.userAgent.indexOf("dna") > -1;
}

let xconView = function (hashCodeStr) {
    let options = {}
    if (EnvironmentConfig.supportAutoXCON[sessionStorage.neType]) {
        options.globalEdit = [
            {
                label: getText("auto-create-xcon"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("create-xcon"), USER_CLASS_TYPE.write);

                },
                clickFunction: function (data, hashCode, selectedData, attributes, paramObj, event) {
                    editRpcItem("create-xcon", {
                        title: getText("auto-create-xcon")
                    }, {tableHashCode: hashCodeStr});
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            }
        ]
    }

    if( DNATestEnable() ) {
        options.rowEdit = [];
        DNATestConfig.xcon.forEach(item=>{
            options.rowEdit.push(
                {
                    label: getText(item),
                    enabled: true,
                    clickFunction: function (data, event) {
                        requestData({
                            select : ["ne-name"],
                            from : "ne"
                        },function (rs) {
                            alert(item + " "+ rs.ne[0]["ne-name"] +" "+ "xcon" +" " + data[0].AID )
                        })
                    },
                    buttonClass: {
                        normal: "alarm-on",
                        disabled: "alarm-on"
                    }
                }
            )
        })
    }

    return options;
};

export {xconView};
