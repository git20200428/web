/**
 * Created by jwu on 2020/08/20.
 */
import {callRpc} from "../custom/comm/react_common";
import {
    checkUserClass,
    collapseOthers,
    getEntityPathByKey,
    getText,
    isNullOrUndefined,
    resource2KeyName,
    USER_CLASS_TYPE
} from "../custom/utils";
import {getRpcConfig} from "../yangMapping";
import React from "react";

let lldpNeighborView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("clear-topology"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-topology"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let path = getEntityPathByKey("lldp-neighbor", "lldp-port");
                    const indtanceID = path + "[ioa-ne:lldp-port" + "=" + "\"" + (data[0]["lldp-port"]) + "\"]"
                        + "[ioa-ne:direction=\'" + data[0]["direction"] + "\']";
                    let label = "lldp-neighbor-" + resource2KeyName(data[0]["lldp-port"]) + "/" + data[0]["direction"];
                    let initdata = {
                        'target': indtanceID
                    };
                    let init = {
                        'initData': initdata,
                        'title': "Clear Topology：" + label
                    }
                    callRpc("clear-topology", init, {tableHashCode: hashCodeStr}, function (_resultData) {

                    });
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

let portStaticsView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("clear-topology"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-topology"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let path = getEntityPathByKey("lldp-port-statistics", "lldp-port");
                    const indtanceID = path + "[ioa-ne:lldp-port" + "=" + "\"" + data[0]["lldp-port"] + "\"]"
                        + "[ioa-ne:direction=\'" + data[0]["direction"] + "\']";
                    let label = "lldp-port-statistics-" + resource2KeyName(data[0]["lldp-port"]) + "/" + data[0]["direction"];
                    let initdata = {
                        'target': indtanceID
                    };
                    let init = {
                        'initData': initdata,
                        'title': "Clear Topology：" + label
                    }
                    callRpc("clear-topology", init, {tableHashCode: hashCodeStr}, function (_resultData) {

                    });
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

let carrierNeighborView = function (hashCodeStr) {
    let options = {
        rowEdit: [
            {
                label: getText("clear-topology"),
                enabled: function (data) {
                    return checkUserClass(getRpcConfig("clear-topology"), USER_CLASS_TYPE.write);
                },
                clickFunction: function (data, event) {
                    let path = getEntityPathByKey("carrier-neighbor", "local-carrier");
                    const indtanceID = path + "[ioa-ne:local-carrier" + "=" + "\"" + data[0]["local-carrier"] + "\"]";
                    let label = "carrier-neighbor-" + resource2KeyName(data[0]["local-carrier"]);
                    let initdata = {
                        'target': indtanceID
                    };
                    let init = {
                        'initData': initdata,
                        'title': "Clear Topology：" + label
                    }
                    callRpc("clear-topology", init, {tableHashCode: hashCodeStr}, function (_resultData) {

                    });
                },
                buttonClass: {
                    normal: "row_clearInstance",
                    // disabled: "row_resetPassword_disabled"
                }

            },
            {
                label: getText("Launch new WEBGUI"),
                type: "dropdown",
                formatter: function (buttonConf, _data) {
                    let conf = ["Launch WebGUI (IPv4)", "Launch WebGUI (IPv6)"];
                    let options = [];
                    let ipv4Address = _data[0]["ipv4-loopback-address"];
                    let ipv6Address = _data[0]["ipv6-loopback-address"];
                    if (!isNullOrUndefined(ipv4Address) && ipv4Address !== "") {
                        ipv4Address = "https:\/\/" + ipv4Address;
                    }

                    if (!isNullOrUndefined(ipv6Address) && ipv6Address !== "") {
                        ipv6Address = "https:\/\/" + "[" + ipv6Address + "]";
                    }
                    let iconDisabled = false;
                    if ((isNullOrUndefined(ipv4Address) || ipv4Address === "") && (isNullOrUndefined(ipv6Address) || ipv6Address === "")) {
                        iconDisabled = true;
                    }
                    if (ipv4Address !== "") {
                        options.push(<a className="export-menu-file-a dropdown-menu-file-a" target="_blank"
                                        href={ipv4Address} key={"ipv4"}
                                        onClick={handleExportDropMenu2}>
                            {"Launch WebGUI (IPv4)"}
                        </a>);
                    }
                    if (ipv6Address !== "") {
                        options.push(<a className="export-menu-file-a dropdown-menu-file-a" target="_blank"
                                        href={ipv6Address} key={"ipv6"}
                                        onClick={handleExportDropMenu2}>
                            {"Launch WebGUI (IPv6)"}
                        </a>);
                    }

                    let iclass = "iconfont icon-chrome";
                    if (iconDisabled) {
                        iclass = "iconfont icon-chrome color_disabled"
                    } else {
                        iclass = "iconfont icon-chrome"
                    }

                    let btnHtml = <span role="button" key={"dropdown"} title="Open new WEBGUI"
                                        onClick={handleExportDropMenu}>
                                <i className={iclass}/>
                               <div className="export-menu-div export-dropdown-menu-div">
                                   {options}
                               </div>
                             </span>;
                    return btnHtml;
                },
                enabled: function (data) {
                    return false;
                },
                buttonClass: {
                    normal: "row_create",
                    disabled: "row_create_disabled"
                }
            }
        ],

    };
    return options;
};

function handleExportDropMenu(e) {
    let aParent = e.target.parentElement;
    if (aParent.classList.contains("my-open")) {
        collapseOthers();
        aParent.classList.remove("my-open");
    } else {
        aParent.classList.add("my-open");
    }
    e.stopPropagation();
}

function handleExportDropMenu2(e) {
    let aParent = e.target.parentElement.parentElement.parentElement;
    let bParent = e.target.parentElement.parentElement;
    if (aParent.classList.contains("my-open")) {
        collapseOthers();
        aParent.classList.remove("my-open");
    }
    if (bParent.classList.contains("my-open")) {
        collapseOthers();
        bParent.classList.remove("my-open");
    }
    e.stopPropagation();
}

export {lldpNeighborView, carrierNeighborView, portStaticsView};