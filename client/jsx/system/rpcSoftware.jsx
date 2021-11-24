import React from 'react';
import {getText} from "../custom/utils";
import ReactRpcComponent from "../custom/comm/rpcComponent";

let createRpcSWTable = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    let btnList = [
        {
            type: "download",
            init: {
                title: getText("download"),
                initKey: "sw"
            }
        }, {
            type: "prepare-upgrade",
            init: {
                title: "Prepare Upgrade"
            }
        }, {
            type: "activate-file",
            init: {
                title: getText("activate-file"),
                initKey: "sw"
            }
        }, {
            type: "cancel-upgrade",
            init: {
                title: getText("cancel-upgrade"),
            },
            rpctype: "call"
        },
        // {
        //     type: "upload",
        //     init: {
        //         title: getText("upload"),
        //         initKey: "sw"
        //     }
        // }
    ];

    return (
        <ReactRpcComponent key={"rpc_software_" + tableHashCode} btnList={btnList} type={_config.title}
                           yangConfig={yangConfig}/>
    );
}

export {createRpcSWTable as rpcSwView};
