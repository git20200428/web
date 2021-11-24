import React from "react";
import ChassisConfig from "../../conf/chassis_config";
import {EnvironmentConfig, getText, removeNS} from "../custom/utils";
import Tooltip from "../components/tooltip/Tooltip";

const ALARM_SEVERITY = {critical: 1, major: 2, minor: 3, warning: 4, none: 5};

const REQ_TYPE = "required-type";
const REQ_SUBTYPE = "required-subtype";
const BLANK = /BLANK/;
const INSTALLED_TYPE = "installed-type";
const SUPPORTED_TYPE = "supported-type";
const PORT_TYPE = "port-type";
const ACT_TYPE = "actual-type";
const ACT_SUBTYPE = "actual-subtype";

const ToolTipParameter = {
    chassis: {
        "Required Type": REQ_TYPE,
        "PON": "PON"
    },
    slot: {
        "Installed Type": INSTALLED_TYPE,
        "Provisioned Type": SUPPORTED_TYPE,
        "PON": "PON"
    },
    card: {
        "Required Type": REQ_TYPE,
        "Required Subtype": REQ_SUBTYPE,
        "Installed PON": "PON"
    },
    port: {
        "Port Type": PORT_TYPE,
        "PON": "PON"
    },
    tom: {
        "Required Type": REQ_TYPE,
        "Required Subtype": "required-subtype",
        "Phy Mode": "phy-mode",
        "Installed PON": "PON"
    },
    led: {
        "Status": "status"
    }
}

export default function ChassisDiagram(props) {
    const chassis = props.chassis;
    let chassisType = removeNS(chassis[REQ_TYPE]);
    let _chassisConfig = chassis ? ChassisConfig[chassisType] : null;
    const allLED = props.led;
    let specialType = {
        "port": ["usb", "comm"]
    }

    // critical > major > minor
    function getObjTopAlarm(data) {
        if (data.alarms) {
            let ret = "none";
            data.alarms.map(alarm => {
                const srvt = alarm["perceived-severity"];
                if (ALARM_SEVERITY.hasOwnProperty(srvt)) {
                    ret = ALARM_SEVERITY[srvt] > ALARM_SEVERITY[ret] ? ret : srvt;
                }
            });
            return (ret !== "none") ? ret : "";
        }

        return "";
    }

    function showSlotWithoutProvision(slot) {
        if (slot.hasOwnProperty("inventory") && slot.inventory[ACT_TYPE]) {
            let cardConfig = _chassisConfig.card[slot.type.toUpperCase()];
            return <div
                className={`entity-common card-common card-${slot.type.toUpperCase()} card-real-no-provision`}
                style={{left: cardConfig.cfg.left + "px", top: cardConfig.cfg.top + "px"}}
                object-data={`slot-${slot.AID}`} object-type={"slot"}
                data-tip={toolTip("slot", slot)} > {slot[INSTALLED_TYPE]} </div>
        }
    }

    function toolTip(eleType, element) {
        let tt = "";
        let newType = eleType;
        if (specialType.hasOwnProperty(eleType)) {
            if (specialType[eleType].indexOf(element[PORT_TYPE]) > -1) {
                newType = element[PORT_TYPE];
            }
        }
        if (element.hasOwnProperty("AID")) {
            tt += "ID: " + newType + "-" + element.AID;
        } else if (element.hasOwnProperty("name")) {
            tt += "Name: " + newType + "-" + element.name;
        }
        let config = ToolTipParameter[eleType];
        if (config) {
            Object.keys(config).map(key => {
                if (key === "PON") {
                    tt += "<br />" + key + ": " + (element.hasOwnProperty("inventory") ? element.inventory["PON"] : "NA");
                } else if (eleType === "slot") {
                    if (config[key] === SUPPORTED_TYPE && element.card) {
                        let subtype = removeNS(element.card[REQ_SUBTYPE]);
                        tt += "<br />" + key + ": " + removeNS(element.card[REQ_TYPE])
                            + (subtype ? "(" + subtype + ")" : "");

                    } else if (config[key] === INSTALLED_TYPE && element.inventory) {
                        let subtype = removeNS(element.inventory[ACT_SUBTYPE]);
                        tt += "<br />" + key + ": " + removeNS(element.inventory[ACT_TYPE])
                            + (subtype ? "(" + subtype + ")" : "");
                    } else {
                        tt += "<br />" + key + ": NA";
                    }
                } else if (element[config[key]]) {
                    if (Array.isArray(element[config[key]])) {
                        tt += "<br />" + key + ": " + element[config[key]].join(",");
                    } else {
                        tt += "<br />" + key + ": " + removeNS(element[config[key]]);
                    }
                } else {
                    tt += "<br />" + key + ": NA";
                }
            });
        }

        if (element.hasOwnProperty("admin-state")) tt += "<br />Admin: " + element["admin-state"];
        if (element.hasOwnProperty("oper-state")) tt += "<br />Oper: " + element["oper-state"];
        if (eleType !== "led") {
            let topAlarm = getObjTopAlarm(element);
            tt += "<br />Alarm Severity: " + (topAlarm ? topAlarm : "NA");
            if (topAlarm) {
                let alarmCount = {};
                for (let i = 0; i < element.alarms.length; ++i) {
                    let sv = element.alarms[i]["perceived-severity"];
                    if (ALARM_SEVERITY.hasOwnProperty(sv)) {
                        alarmCount[sv] = alarmCount[sv] ? (alarmCount[sv] + 1) : 1;
                    }
                }
                tt += "<br />Alarm Count: ";
                for (let svKey in ALARM_SEVERITY) {
                    if (alarmCount.hasOwnProperty(svKey)) {
                        tt += svKey + "(" + alarmCount[svKey] + "), ";
                    }
                }
                tt = tt.substring(0, tt.length - 2);
            }
        }
        return `<div class='chassis-tooltip'>${tt}</div>`;
    }

    function disableClick(e) {
        e.stopPropagation();
    }

    function getStatus(entity) {
        if (entity.hasOwnProperty("oper-state")) {
            let admSts = "admin-state";
            if (!entity[admSts] || entity[admSts] === "unlock") {
                if (entity["oper-state"] === "disabled") return "disabled";
            } else {
                return entity["admin-state"];
            }
        }

        return "none";
    }

    function getLedPos(led, targetConfig) {
        if (targetConfig && targetConfig.led) {
            return {
                left: targetConfig.led[led.name] ? targetConfig.led[led.name].left : 0 + "px",
                top: targetConfig.led[led.name] ? targetConfig.led[led.name].top : 0 + "px"
            };
        }
        return {left: "0px", top: "0px"};
    }

    /**
     * only support for controller card
     * @param card
     * @param slots
     */
    function showCardProtection(card, slots) {
        function findCardByStatus(status) {
            for (let slot of slots) {
                if (slot.card && (slot.card.name !== card.name) && slot.card.hasOwnProperty("controller-card")
                    && slot.card["controller-card"]["redundancy-status"] === status) {
                    return slot.card;
                }
            }
            return null;
        }

        if (card.hasOwnProperty("controller-card")) {
            if ((card["controller-card"]["redundancy-status"] === "standby")) {
                let activeCard = findCardByStatus("active");
                if (activeCard)
                    return <i className={`iconfont icon-moon_zzz`} data-tip={getText("protecting")}
                          onClick={() => {ChassisConfig.contextMenu.card["switch-over"].exec(activeCard)}} />;
            } else if (card["controller-card"]["redundancy-status"] === "active") {
                let standbyCard = findCardByStatus("standby");
                if (standbyCard)
                    return <i className={`iconfont icon-sun`} data-tip={getText("protected")}
                          onClick={() => {ChassisConfig.contextMenu.card["switch-over"].exec(card)}}/>;
            }
        }
    }

    function showFixedPort(card, fixedPort) {
        if (fixedPort) {
            if (fixedPort[card.type]) {
                let portConfig = fixedPort[card.type];
                return Object.keys(portConfig).map(portName => {
                    if (card.port && card.port.some(port => port.name === portName)) {
                        return "";
                    }
                    return <div key={portName} name={"port-" + portName} className="entity-common port-comm"
                                style={{
                                    left: `${portConfig[portName].left}px`, top: `${portConfig[portName].top}px`,
                                    transform: `rotate(${portConfig[portName].rotate ? portConfig[portName].rotate : 0}deg)`
                                }}
                                object-type={portName.toLowerCase()}
                                object-data={`card-${card.AID}`}
                                data-tip={"ID: port-" + portName}/>
                });
            }
        }
    }

    function showPort(port, slot) {
        if (!port) return "";

        port.cardname = slot.card.name;
        if (port.tom) {
            port.tom.PON = port.inventory ? port.inventory.PON : "NA";
        }
        if (port["line-ptp"] && slot.card.resources) {
            if (slot.card.resources.hasOwnProperty("unassigned-carriers")) {
                port["line-ptp"]["unassigned-carriers"] = slot.card.resources["unassigned-carriers"];
            }
        }
        return (
            <div key={port.name} name={"port-" + port.AID}
                 className={`entity-common port-${port[PORT_TYPE]} alarm-${getObjTopAlarm(port)}`}
                 style={{
                     left: `${port.left}px`,
                     top: `${port.top}px`,
                     transform: `rotate(${port.rotate ? port.rotate : 0}deg)`
                 }}
                 data-tip={toolTip("port", port)}
                 object-type={"port"}
                 object-data={`port-${port.AID}`}
            >
                {
                    port[PORT_TYPE] !== "usb" ? <div className={`port-status-${getStatus(port)}-triangle`} object-type={"port"} object-data={`port-${port.AID}`}/>:
                    <div className={`usb-status-${getStatus(port)}-triangle`}/>
                }
                {allLED && allLED[port.AID] ? allLED[port.AID].map(led => {
                    return <div key={led.name}
                         className={`entity-common led-common led-${led.status} led-${led.name}`}
                         style={getLedPos(led, ChassisConfig[removeNS(chassis[REQ_TYPE])].card[removeNS(slot.card[REQ_TYPE])].port[port.name])}
                         data-tip={toolTip("led", led)}
                         onClick={disableClick}
                    />
                }) : null}
                {port.tom ? (
                    <div key={port.tom["phy-mode"]}
                         name={"tom-" + port.tom.AID} object-type={"tom"}
                         object-data={`port-${port.AID}`}
                         className={`entity-common tom-common alarm-${getObjTopAlarm(port.tom)} tom-${removeNS(port.tom[REQ_TYPE])} tom-${removeNS(port.tom[REQ_TYPE])}-${port.tom["phy-mode"]}`}
                         data-tip={toolTip("tom", port.tom)}>
                        <div className={`port-status-${getStatus(port.tom)}-triangle`}
                             object-type={"tom"}   object-data={`port-${port.AID}`}>
                        </div>

                    </div>
                ) : null}
            </div>);
    }

    function getProvisionStatus(slot) {
        let status = null;
        let actType = slot.inventory ? removeNS(slot.inventory[ACT_TYPE]) : "";
        let actSubType = slot.inventory ? removeNS(slot.inventory[ACT_SUBTYPE]) : "";
        let reqType = slot.card ? removeNS(slot.card[REQ_TYPE]) : "";
        let reqSubType = slot.card ? removeNS(slot.card[REQ_SUBTYPE]) : "";
        if (reqType && actType) {
            if (reqType !== actType || actSubType !== reqSubType) {
                status = {
                    class: "icon-mismatch",
                    title: getText("card-mismatch").format(
                        slot.inventory ? slot.inventory["PON"] : actType, reqType + (reqSubType ? ("(" + reqSubType + ")") : ""))
                };
            }
        } else if (reqType) {
            status = {
                class: "icon-pre_card",
                title: getText("card-pre-provision").format(reqType + (reqSubType ? ("(" + reqSubType + ")") : ""))
            };
        } else if (actType && !BLANK.test(actType)) {
            status = {
                class: "icon-real_card",
                title: getText("card-no-pre-provision").format(actType + (actSubType ? ("(" + actSubType + ")") : ""))
            };
        }

        if (!status) return "";
        return <i className={`iconfont ${status.class}`} data-tip={status.title}/>
    }

    function showSlot(slot, side) {
        if (!slot) return "";

        slot.chassisname = chassis.name;
        if (slot.card) {
            slot.card.PON = slot.inventory ? slot.inventory.PON : "NA";
            slot.card.ledSupport = EnvironmentConfig.ledSupportCard.some(lsc => lsc === slot.card["required-type"]);
        }
        return (slot.location === side ? (
            <div key={slot.name} name={"slot-" + slot.AID}
                 className={`entity-common slot-common slot-${slot.type} slot-${getObjTopAlarm(slot)}`}
                 style={{
                     left: `${slot.left}px`,
                     top: `${slot.top}px`,
                     zIndex: `${slot.card ? 100 : ""}`
                 }}
                 object-data={`slot-${slot.AID}`}
                 object-type={"slot"}
                 data-tip={toolTip("slot", slot)}
                 data-id={!(chassisType === "G42" && side !== "front") ? slot.name : ""}
                 data-pon={(slot.inventory && slot.inventory.PON) ? slot.inventory.PON : (slot.card ? "[Empty]" : "")}
            >
                {/* show mismatch/provision icon for slot */}
                {getProvisionStatus(slot)}
                {/*Card*/}
                {slot.card ? (
                    <div name={"card-" + slot.card.AID}
                         className={`entity-common card-common card-${slot.card.type} alarm-${getObjTopAlarm(slot.card)}`}
                         style={{left: `${slot.card.left}px`, top: `${slot.card.top}px`}}
                         object-type={"card"} object-data={`card-${slot.card.AID}`}
                         data-tip={toolTip("card", slot.card)}
                    >
                        {/* show alarm icon for card */}
                        <i className={`iconfont icon-${getStatus(slot.card)}`} data-tip=""/>
                        {/* show protecting and protected */}
                        {showCardProtection(slot.card, chassis.slot)}
                        {/*Port*/}
                        {(slot.card.port && Array.isArray(slot.card.port)) ? slot.card.port.map(port => {
                            return showPort(port, slot);
                        }) : showPort(slot.card.port, slot)}
                        {showFixedPort(slot.card, _chassisConfig.fixedPort)}
                        {allLED && allLED[slot.card.AID] ? allLED[slot.card.AID].map(led => {
                            return <div key={led.name}
                                        className={`entity-common led-common led-${slot.card.type} led-${led.status} led-${slot.card.type}-${led.status}`}
                                        style={getLedPos(led, _chassisConfig.card[removeNS(slot.card[REQ_TYPE])])}
                                        data-tip={toolTip("led", led)}
                                        onClick={disableClick}
                            />
                        }) : null}
                    </div>
                ) : showSlotWithoutProvision(slot)}
            </div>
        ) : null)
    }

    let SIDES = {
        [props.side]: "",
        [props.side === "front" ? "rear" : "front"]: chassis.type === "G42" ? "chassis-G42-scale" : ""
    };

    return (
        <div className="chassis-diagram-container"
             style={{height: _chassisConfig ? _chassisConfig.height : "0" + "px"}}>
            <Tooltip type="info"/>
            {/*Chassis*/}
            {chassis ? <div className={`chassis-all-${chassis.type}`}>
                {Object.keys(SIDES).map(side => {
                    let chassisDiv = <div name={"chassis-" + chassis.AID}
                                          className={`entity-common chassis-${chassis.type} alarm-${getObjTopAlarm(chassis)}`}
                                          object-data={`chassis-${chassis.AID}`}
                                          object-type="chassis"
                                          data-tip={toolTip("chassis", chassis)}
                                          key={side}
                    >
                        {/* show alarm icon for chassis */}
                        <i className={`iconfont icon-${getStatus(chassis)}`}/>
                        {/*Slot*/}
                        {(chassis.slot && Array.isArray(chassis.slot)) ? chassis.slot.map(slot => {
                            return showSlot(slot, side)
                        }) : showSlot(chassis.slot, side)}
                    </div>;
                    if (SIDES[side]) {
                        return <div key={side} className={SIDES[side]}>{chassisDiv}</div>;
                    } else {
                        return chassisDiv;
                    }
                })}
            </div>
                : <div className={`entity-common chassis-G42`} />}
        </div>
    );
};
