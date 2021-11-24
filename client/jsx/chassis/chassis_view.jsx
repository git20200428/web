import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import ChassisDiagram from "./chassis_diagram";
import chassisConfig from "../../conf/chassis_config";
import {callRpc, detailsItem, editItem} from "../custom/comm/react_common";
import {DynamicTabPanel} from "../custom/table/dynamicTabPanel"
import {fetch_chassisview, fetch_led} from "../redux/actions";

import {
    checkUserClass,
    getEntityPathByKey,
    getHelpUrl,
    getRelateTableKeys,
    getText,
    getYang,
    isFunction, isNullOrUndefined,
    parseURLParameter,
    removeNS,
    requestData,
    showAlertDialog,
    USER_CLASS_TYPE
} from "../custom/utils";
import {getRpcConfig, getYangConfig} from "../yangMapping";
import {DialogType} from "../components/modal/modal";
import showOLSDiagram from "../ols/diagram_test";
import {useLocation} from "react-router-dom";

const CLASSMAP = {enabled: "up-color", disabled: "down-color", lock: "lock-color", maintenance: "maintenance-color"};

const portType = {
    "comm": {
        title: "comm-eth",
        type: "comm-eth"
    },
    "usb": {
        title: "usb",
        type: "usb"
    }
};

let lastSelectEntity = null;

export default function ChassisView() {
    const [showChassis, setShowChassis] = useState(true);
    const [chassisSide, setChassisSide] = useState("front");
    const [menuState, setMenuState] = useState({
        menuPosition: {left: "0", top: "0"},
        menuItemList: [],
        curSelItem: {
            type: "",
            data: {}
        }
    });
    const [relatedConfig, setRelatedConfig] = useState();
    const ne = useSelector(state => state.neinfo.ne);
    const led = useSelector(state => state.neinfo.led);
    const dispatch = useDispatch();

    function handleSideClick() {
        setChassisSide(chassisSide === "front" ? "rear" : "front");
    }

    function handleRefresh() {
        dispatch(fetch_chassisview());
    }

    function handleChassisShrink(e) {
        e.target.classList.contains("icon-rotate-180") ? e.target.classList.remove("icon-rotate-180") : e.target.classList.add("icon-rotate-180");

        setShowChassis(!showChassis);
    }

    function findData(objKey) {
        if (!objKey) return null;
        let objType = objKey.split("-")[0];
        return _findDataByAID(ne, "ne", objType, objKey);

        function _findDataByAID(node, tag, objType, objKey) {
            if (Array.isArray(node)) {
                for (let item of node) {
                    let obj = _findDataByAID(item, tag, objType, objKey);
                    if (obj) {
                        return obj;
                    }
                }
            } else if (tag === objType) {
                if (`${objType}-${node.AID}` === objKey) {
                    return node;
                }
            } else if (typeof node === "object") {
                for (let key in node) {
                    if (typeof node[key] === "object") {
                        let obj = _findDataByAID(node[key], key, objType, objKey);
                        if (obj) {
                            return obj;
                        }
                    }
                }
            }
            return null;
        }
    }

    function handleContextMenu(e) {
        let chassisContainer = document.getElementsByClassName("chassis-view-container")[0];

        chassisContainer.classList.add("my-open");
        const eleType = e.target.getAttribute("object-type");
        if (eleType) {
            let menuItems = [];
            let menuConfig = chassisConfig.contextMenu[eleType];
            if( !isNullOrUndefined(menuConfig) ) {
                let objData = e.target.getAttribute("object-data");
                let _data = findData(objData);
                Object.keys(menuConfig).forEach(item => {
                    let checkType = eleType;
                    if (menuConfig[item].hasOwnProperty("show")) {
                        if ((isFunction(menuConfig[item].show) && _data && (!menuConfig[item].show(_data)))
                            || (menuConfig[item].show === false)) {
                            return;
                        }
                    }

                    let enable = true;
                    if (menuConfig[item].hasOwnProperty("enable")) {
                        if (isFunction(menuConfig[item].enable) && _data) {
                            enable = menuConfig[item].enable(_data);
                        }
                    }

                    if (item.startsWith("create") || item.startsWith("properties") || item.startsWith("delete")) {
                        if (item.indexOf("_") > -1) {
                            checkType = item.substring(item.indexOf("_") + 1);
                        }
                    } else {
                        checkType = item.replaceAll("_", "-");
                    }
                    let _yangConfig;
                    if (["enable-led", "disable-led", "restart"].includes(checkType)) {
                        _yangConfig = getRpcConfig(checkType);
                    } else {
                        _yangConfig = getYangConfig(checkType);
                    }
                    let userClass = true;
                    let userRole = true;
                    if (_yangConfig != null) {
                        userClass = checkUserClass(_yangConfig, USER_CLASS_TYPE.write);
                        userRole = userClass;
                        if (item.startsWith("properties")) {
                            userClass = true;
                        }
                    }

                    menuItems.push({
                        type: item,
                        userClass: userClass,
                        userRole: userRole,
                        enable: enable
                    })
                });
                if (menuItems) {
                    const Rect = e.currentTarget.getBoundingClientRect();
                    const x = e.nativeEvent.clientX - Rect.left;
                    const y = e.nativeEvent.clientY - Rect.top;
                    setMenuState({
                        menuPosition: {left: `${x}px`, top: `${y}px`},
                        menuItemList: menuItems,
                        curSelItem: {
                            type: eleType,
                            data: _data
                        }
                    });
                    return;
                }
            }
        }
        chassisContainer.classList.remove("my-open");
    }

    function onMenuSel(e) {
        let userClass = e.target.getAttribute('data-class');
        if (userClass != null && userClass === "false") {
            return;
        }

        let userRole = e.target.getAttribute('data-role');
        userRole = (userRole === "true");
        let id = e.target.getAttribute('menu-id');

        let type = menuState.curSelItem.type;
        let contextMenu = chassisConfig.contextMenu[type][id];
        let curItemData = menuState.curSelItem.data;
        if (contextMenu.exec) {
            contextMenu.exec(curItemData, userRole);
            return;
        }

        if (id === "properties") {
            let initKey = {};
            initKey[type] = {
                name: curItemData.name
            };
            let callFunc = userRole ? editItem : detailsItem;
            callFunc(type, {
                initKey: initKey,
                title: type + "-" + curItemData.AID
            });
            return;
        }

        if (id === "enable_led") {
            enableLED({
                type: type,
                name: curItemData.name
            });
            return;
        }

        if (id === "disable_led") {
            disableLED({
                type: type,
                name: curItemData.name
            });
            return;
        }

        if (id === "Show OLS Diagram") {
            showOLSDiagram();
        }
    }

    function enableLED(obj) {
        let type = obj.type;
        let keys = {};
        keys[type] = {name: obj.name};
        callRpc("enable-led", {
            'initData': {
                "entity": getEntityPathByKey(obj.type, keys)
            },
            'title': getText("confirm.enable_led").format(getText(obj.type) + '-' + obj.name),
            helpString: "enableled"
        });
    }

    function disableLED(obj) {
        let type = obj.type;
        let keys = {};
        keys[type] = {name: obj.name};
        callRpc("disable-led", {
            'initData': {
                "entity": getEntityPathByKey(obj.type, keys)
            },
            'title': getText("confirm.disable_led").format(getText(obj.type) + '-' + obj.name)
        });
    }

    function enter(e) {
        if (e.target && !e.target.className.match("entity-selected")
            && !e.target.className.match("entity-hovered")
            && !e.target.className.match("iconfont")
            && e.target.className !== "chassis-diagram-wrapper"
            && e.target.className.match("entity-common")) {
            let eleStyle = window.getComputedStyle(e.target, null);
            if (eleStyle) {
                let hoverBoxShadow = "0px 0px 3px 5px rgba(153, 153, 153, 0.6)";
                if (eleStyle.boxShadow === "none") {
                    e.target.style.boxShadow = hoverBoxShadow;
                } else if (eleStyle.boxShadow.match(hoverBoxShadow) == null) {
                    e.target.style.boxShadow = eleStyle.boxShadow + ", " + hoverBoxShadow;
                }
                e.target.classList.add("entity-hovered");
            }
            e.stopPropagation();
        }
    }

    function out(e) {
        if (e.target && !e.target.className.match("entity-selected")) {
            e.target.style.boxShadow = "";
            e.target.classList.remove("entity-hovered");
            e.stopPropagation();
        }
    }

    function showStatus(status) {
        if (status)
            return Object.keys(status).map(item =>
                    <span key={item}>
                <input type="button"
                       className={(CLASSMAP[item] ? CLASSMAP[item] : item) + " status-button"} value={status[item]}
                       title={getText(item)}/>
            </span>
            );
    }

    function handleClick(e) {
        if (e.button === 0) {
            const eleType = e.target.getAttribute("object-type");
            if (eleType) {
                let _data = findData(e.target.getAttribute('object-data'));
                setRelatedConfig(initRelateTableConfig(eleType, _data));
            }

            if (e.target && e.target.classList.contains("entity-common")) {
                if (lastSelectEntity && lastSelectEntity.classList.contains("entity-selected")) {
                    lastSelectEntity.classList.remove("entity-selected");
                    lastSelectEntity.style.boxShadow = "";
                }

                if (!e.target.classList.contains("entity-selected")) {
                    e.target.classList.add("entity-selected");

                    e.target.style.boxShadow = "";
                    let eleStyle = window.getComputedStyle(e.target, null);
                    let boxshdow = "0px 0px 0px 3px rgba(0, 0, 255)";

                    if (eleStyle && (eleStyle.boxShadow !== "none")) {
                        e.target.style.boxShadow = eleStyle.boxShadow + ", " + boxshdow;
                    } else {
                        e.target.style.boxShadow = boxshdow;
                    }
                    lastSelectEntity = e.target;
                }
            }
        }
    }

    function initRelateTableConfig(type, data) {
        let _title = type;
        let _realType = type;
        if (data.hasOwnProperty("port-type") && portType[data["port-type"]] != null) {
            _title = portType[data["port-type"]].title;
            if (portType[data["port-type"]].type != null) {
                _realType = portType[data["port-type"]].type;
            }
        }
        let selectedObjTitle = _title + "-" + (data.AID != null ? data.AID : data.name);
        let _items = getRelateTableKeys(getYangConfig(type), data);
        let _expandItems = chassisConfig.relate[type];
        if (_expandItems != null && _expandItems.items) {
            let afterItems = [];
            let beforeItems = [];
            for (let i = 0; i < _expandItems.items.length; i++) {
                let _obj = _expandItems.items[i];
                if (_obj[Object.keys(_obj)[0]].insert === "after") {
                    afterItems.push(_obj);
                } else {
                    beforeItems.push(_obj);
                }
            }
            _items = afterItems.concat(_items).concat(beforeItems);
        }
        if (_items == null) {
            return;
        }
        let relatedTabConfig = [];
        let _keys = _expandItems ? (isFunction(_expandItems.xpath) ? _expandItems.xpath(data) : _expandItems.xpath) : "";
        for (let i = 0; i < _items.length; i++) {
            let _type = _items[i];
            let _obj = {};
            let containerKey = _realType;
            if (typeof (_items[i]) != "string") {
                _type = Object.keys(_items[i])[0];
                if (_items[i][_type].hasOwnProperty("enable")) {
                    if (!_items[i][_type].enable(data)) {
                        continue;
                    }
                }
                if (_items[i][_type].hasOwnProperty("request")) {
                    _obj.request = _items[i][_type].request(_keys, _realType);
                }
                if (_items[i][_type].hasOwnProperty("containerKey")) {
                    containerKey = _items[i][_type].containerKey;
                }
                if (_items[i][_type].hasOwnProperty("extends")) {
                    _obj["extends"] = _items[i][_type].extends;
                }
            }
            if (_type === "inventory") {
                _type = type + "." + _type;
            }
            _obj.key = _keys;
            _obj["AID"] = data.AID;
            _obj["containerKey"] = containerKey;
            _obj["type"] = _type;
            _obj["isRelateTable"] = true;
            relatedTabConfig.push(_obj)
        }
        return {
            configs: relatedTabConfig,
            panelTitle: getText("related-data") + " : " + selectedObjTitle
        };
    }

    function selectObject(selectID, foundId) {
        if (foundId == null) {
            foundId = selectID
        }
        if (document.getElementsByName(selectID).length > 0) {
            document.getElementsByName(selectID)[0].click();
        } else {
            let config = {
                dialogType: DialogType.ERROR,
                showText: "Can not found the object '" + foundId + "'"
            }
            showAlertDialog(config);
        }
    }

    const location = useLocation();

    function parseChassisViewUrl() {
        setTimeout(function () {
            let _urlSearch = location.search.trim().toString();
            let showConfig = parseURLParameter(_urlSearch);
            if (showConfig.select != null && showConfig.select.id !== "") {
                let selectID = showConfig.select.id;
                if (document.getElementsByName(selectID).length === 0) {
                    let facilitiesTypes = getYang("yang")["facilities"];
                    let _tempKey = selectID;
                    let i = 0;
                    while (_tempKey.indexOf("-") > -1 && i < 10) {
                        i++;
                        if (facilitiesTypes[_tempKey] != null) {
                            let _obj = {};
                            _obj[_tempKey] = {
                                name: selectID.replace(_tempKey, "").substring(1)
                            }
                            requestData({
                                select: ["AID"],
                                from: _tempKey,
                                where: _obj
                            }, function (_rs) {
                                let _id = "";
                                if (_rs.hasOwnProperty(_tempKey) && _rs[_tempKey].length > 0) {
                                    _id = "port-" + _rs[_tempKey][0]["AID"].split("-").slice(0, 3).join("-");
                                }
                                selectObject(_id, selectID);
                            })
                            return;
                        } else {
                            _tempKey = _tempKey.substring(0, _tempKey.lastIndexOf("-"));
                        }
                    }
                    document.getElementsByClassName("icon-switch")[0].click();
                }
                selectObject(selectID);
            }
        }, 1000);
    }

    useEffect(() => {
        dispatch(fetch_led());
        let interval = setInterval(() => dispatch(fetch_led()), 15000);
        parseChassisViewUrl();
        return () => {
            clearInterval(interval);
        }
    }, []);


    let config = ne && ne.chassis && initRelateTableConfig("chassis", ne.chassis[0]);
    return (!ne || !ne.chassis) ? <div/> : (
        <div className="chassis-view-container"
             onContextMenu={handleContextMenu} onClick={handleClick}>
            {/*Component header*/}
            <div className="chassis-view-header">
                <span className="physical-chassis-view marginLeft20">{getText("chassisview")}</span>
                <a href={`/webgui_help/${getHelpUrl("physicalchassis")}`} target="_webgui_help">
                    <span className="iconfont icon-help helpIcon"/>
                </a>
                <span className="marginLR">{ne && showStatus(ne.statusCount)}</span>
                <span className="iconfont icon-refresh" onClick={handleRefresh}/>
            </div>
            {/*Chassis list container*/}
            {ne.chassis.map(chassis => {
                return (
                    <div key={chassis.name}>
                        {/*Chassis header*/}
                        <div className="chassis-header">
                            <span className="chassis-name marginLeft25">
                            {getText("chassis-frame")} {chassis && chassis.name ? chassis.name : ""} : {chassis ? removeNS(chassis["required-type"]) : ""}
                            </span>
                            {chassis.type === "G42" ? <button className="btnSwitch marginLeft20" onClick={handleSideClick}>{getText(chassisSide)}</button> : ""}
                            <span className="marginLR">
                                {showStatus(chassis && chassis.alarmCount)}
                            </span>
                            <span className="marginLR">
                                {showStatus(chassis && chassis.statusCount)}
                            </span>
                            <span className="iconfont icon-collapse-up3" onClick={handleChassisShrink}/>
                        </div>
                        <div className="chassis-diagram-wrapper"
                             onMouseOut={out} onMouseOver={enter}>
                            {showChassis ? <ChassisDiagram chassis={chassis} led={led} side={chassisSide}/> : null}
                        </div>
                    </div>);
            })}
            {/*menu*/}
            <div className="chassis-view-menu" style={menuState.menuPosition}>
                {menuState.menuItemList.map((item, idx) => {
                    return <div className={(!item.userClass || !item.enable) ? 'chassis-view-menu-item-disabled' : ''}
                                key={idx}
                                menu-id={item.type} data-class={item.userClass} data-role={item.userRole}
                                onClick={item.enable ? onMenuSel : null}>
                        {getText(item.type)}
                    </div>
                })}
            </div>
            <div id="react_relate_table">
                {relatedConfig ?
                    <DynamicTabPanel tabConfig={relatedConfig.configs} panelTitle={relatedConfig.panelTitle}/> :
                    <DynamicTabPanel tabConfig={config.configs} panelTitle={config.panelTitle}
                    />}
            </div>
        </div>
    );
};
