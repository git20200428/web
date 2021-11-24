import React from 'react';
import {getText, hashCode} from "../custom/utils";
import ReactRpcComponent from "../custom/comm/rpcComponent";

let createRpcPingTable = function (_config, showPanelConfig, tableHashCode, yangConfig) {
    let timeStamp = hashCode("rpc_ping");
    let btnList = [{
        type: "ping",
        init: {
            title: getText("ping")
        }
    }, {
        type: "traceroute",
        init: {
            title: getText("trace-route")
        }
    }];

    return (
        <ReactRpcComponent key={"react_rpc_tool_" + timeStamp} btnList={btnList} type={_config.title}
                           yangConfig={yangConfig}/>
    );
}

export {createRpcPingTable as rpcPingView};
