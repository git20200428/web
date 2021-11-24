import React, {useEffect, useRef, useState} from 'react';
import {
    getEntityPathByKey,
    getRelateTableKeys,
    getText, getYang,
    handleCollapseClick,
    isEmpty,
    isEmptyObj, isFunction,
    isNullOrUndefined,
    isNum,
    requestData, resource2KeyName
} from "../custom/utils";
import {useSelector} from "react-redux";
import {editItem} from "../custom/comm/react_common";
import * as echarts from 'echarts/core';
import {SankeyChart} from 'echarts/charts';
import {CanvasRenderer} from 'echarts/renderers';
import {DynamicTabPanel} from "../custom/table/dynamicTabPanel";
import {getYangConfig} from "../yangMapping";
import chassisConfig from "../../conf/chassis_config";

echarts.use([SankeyChart, CanvasRenderer]);

function ReactTopo() {
    const refObject = useRef();
    const [selectedType, setSelectedType] = useState("");
    const [selectedData, setSelectedData] = useState("");

    const optionlist = useSelector(state => {
        let optionData = ["-Please Select-"];
        let fac_dataJson = null, data = state.neinfo.ne;
        if (!isNullOrUndefined(data)) {
            fac_dataJson = data["chassis"][0]["slot"];
            for (let i = 0, len = fac_dataJson.length; i < len; i++) {
                let card = fac_dataJson[i]["card"];
                if (!isNullOrUndefined(card) && card["category"] === "line-card") {
                    optionData.push(card["AID"]);
                }
            }
        }
        return optionData;
    });

    function resizeListener() {
        refObject.current.myChart.resize();
    }

    function updateRelate(params) {
        if (params.data.name) {
            let temp = params.data.name.split(" ")[0].split("-");
            for(let i=temp.length-1; i>=0; i--) {
                let _key = temp.slice(0,i).join("-");
                if( getYang("yang")[_key] != null ) {
                    let data = {
                        "cardname" : document.getElementById("react-service-view-entity").value,
                        "name" : temp.slice(i).join("-")
                    };
                    setSelectedData(initRelateTableConfig(_key, data, temp.slice(i).join("-")))
                    break;
                }
            }
        }
    }

    function clickFun(params) {
        if (params.data.name) {
            let init = {}, type = null,
                sc = getObj(params.data.name, "super-channel-", refObject.current.sc),
                odu = getObj(params.data.name, "odu-", refObject.current.odus),
                eth = getObj(params.data.name, "ethernet-", refObject.current.eth),
                flexoG = getObj(params.data.name, "flexo-group-", refObject.current.flexoG),
                ethZr = getObj(params.data.name, "eth-zr-", refObject.current.ethZr),
                otus = getObj(params.data.name, "otu-", refObject.current.otus),
                ptp = getObj(params.data.name.slice(0,params.data.name.indexOf("(")), "trib-ptp-", refObject.current.ptp);
            if (sc) {
                type = "super-channel";
                init = {
                    initKey: sc
                };
            } else if (odu) {
                type = "odu";
                init = {
                    initKey: odu
                };
            } else if (eth) {
                type = "ethernet";
                init = {
                    initKey: eth
                };
            } else if (flexoG) {
                type = "flexo-group";
                init = {
                    initKey: flexoG
                };
            } else if (ethZr) {
                type = "eth-zr";
                init = {
                    initKey: ethZr
                };
            } else if (otus) {
                type = "otu";
                init = {
                    initKey: otus
                };
            }else if (ptp) {
                type = "trib-ptp";
                init = {
                    initKey: ptp
                };
            }
            type && editItem(type, init);
        } else {
            let xcon = getXcon(params.data.source, params.data.target, refObject.current.xcons);
            if (xcon) {
                let initData = {
                    initData: xcon,
                    title: getText("xcon")
                }
                editItem("xcon", initData)
            }
        }
    }

    function getObj(name, prefix, arr) {
        name = name.split(" ")[0];
        for (let i = 0; i < arr.length; i++) {
            if (name === prefix + arr[i].name) {
                return arr[i];
            }
        }
        return null;
    }

    function getXcon(source, destination, xcons) {
        for (let i = 0; i < xcons.length; i++) {
            if (source.indexOf(xcons[i].source.substring(xcons[i].source.indexOf("'") + 1, xcons[i].source.lastIndexOf("'"))) !== -1 &&
                destination.indexOf(xcons[i].destination.substring(xcons[i].destination.indexOf("'") + 1, xcons[i].destination.lastIndexOf("'"))) !== -1) {
                return xcons[i];
            }
        }
        return null;
    }

    useEffect(() => {
        refObject.current = {
            "myChart": null,
            "sc": null,
            "odus": null,
            "eth": null,
            "xcons": null,
            "flexoG": null,
            "ethZr": null,
            "otus": null
        };
        refObject.current.myChart = echarts.init(document.getElementById('myChart'));
        refObject.current.myChart.on('click', updateRelate);
        refObject.current.myChart.on('dblclick', clickFun);
        window.addEventListener("resize", resizeListener);
        return () => {
            window.removeEventListener("resize", resizeListener);
        }
    }, [selectedType]);

    useEffect(() => {
        !isEmpty(selectedType) && drawOption(selectedType);
    }, [selectedType]);

    function handleSetValue(event) {
        setSelectedType(event.target.value);
    }

    function drawOption(selectedValue) {
        if (selectedValue === "-Please Select-") {
            refObject.current.myChart.clear();
            return;
        }
        requestData(
            [{
                    requestType: "cache",
                    from: "card",
                    where: {"card": {"name": selectedValue}}
                },{
                    requestType: "cache",
                    from: "super-channel",
                    where: {"super-channel": {"supporting-card": selectedValue}}
                },
                {
                    requestType: "cache",
                    from: "flexo-group",
                    where: {"flexo-group": {"supporting-card": selectedValue}}
                },
                {
                    requestType: "cache",
                    from: "eth-zr",
                    where: {"eth-zr": {"supporting-card": selectedValue}}
                },
                {
                    requestType: "cache",
                    from: "trib-ptp",
                    where: {"trib-ptp": {"supporting-card": selectedValue}}
                },
                {
                    from: "xcon"
                },
                {
                    from: "otu",
                    // where: {"otu":{"supporting-card": selectedValue}}
                },
                {
                    requestType: "cache",
                    from: "ethernet",
                    where: {"ethernet": {"supporting-card": selectedValue}}
                },
                {
                    from: "odu"
                }],
            callback);
    }

    function getOtus (filterStr, otus){
        let otu = [];
        for (let j = 0, len = otus.length; j < len; j++) {
            if (otus[j]["supporting-card"] === filterStr && (otus[j]["otu-type"] == "OTU4"|| otus[j]["otu-type"].indexOf('OTUCn')!=-1)) {
                otu.push(otus[j]);
            }
        }
        return otu;
    }
    function getObj2 (aid, objs){
        for (let j = 0, len = objs.length; j < len; j++) {
            if (objs[j]["name"] === aid) {
                return objs[j];
            }
        }
        return {};
    }
    const curAlarms = useSelector(state => state.neinfo?.alarmPool);
    function findAlarms(entity){
        console.log(entity);
        // let resource = resource2KeyName(entity[0]);
        // console.log(resource);
        console.log(getEntityPathByKey("odu",{
            "odu":{
                name: "123"
            }
        }));
        console.log(curAlarms);
        curAlarms.forEach( alarm =>{
            console.log(alarm.resource)
        })
    }
    function callback(dt) {

        let option = {
            tooltip: {
                trigger: "item",
                triggerOn: "mousemove"
            },
            series: {
                type: 'sankey',
                layout: 'none',
                nodeWidth: 20,
                emphasis: {focus: 'adjacency'},
                orient: 'vertical',
                label: {position: 'inside'},
                animationDelayUpdate: 300,
                // nodeWidth: 40,
                layoutIterations: 0
            }
        };
        let data = [], links = [];
        let card = dt["card"],sc = dt["super-channel"], flexoG = dt["flexo-group"], ethZr = dt["eth-zr"], eth = dt["ethernet"],
            ptp = dt["trib-ptp"],otus = getOtus(selectedType, dt["otu"]), odus = dt["odu"], xcons = dt["xcon"];
            refObject.current.sc = sc, refObject.current.odus = odus, refObject.current.xcons = xcons, refObject.current.eth = eth,
            refObject.current.flexoG = flexoG, refObject.current.ethZr = ethZr, refObject.current.otus = dt["otu"];
        let oudArray = [], portPrefix = "port-" + selectedType + "-", ptpPrefix = "trib-ptp-" + selectedType + "-";
        findAlarms(odus);
        //g30-5.0
        if (!isEmptyObj(flexoG)) {
            flexoG.sort((f1, f2)=>{
                return parseInt(f1['supporting-port']) - parseInt(f2['supporting-port']);
            });
            fillG30Lineflexo(data, links, flexoG, oudArray, portPrefix, otus,odus, 0, "flexo-group-", "line-ptp-");
            if (!isEmptyObj(odus)) {
                fillG30Clientflexo(data, links, odus, xcons, oudArray, 7, portPrefix, ptpPrefix, "odu-");
            }
        }
        if (!isEmptyObj(ethZr)) {
            fillG30Ethzr(data, links, ethZr, eth, portPrefix, 0, "eth-zr-", "ethernet-", ptpPrefix);
        }

        //g40-5.0
        if (!isEmptyObj(sc)) {
            fillLine(data, links, sc,oudArray,  otus, portPrefix, odus, 0, "super-channel-", "super-channel-group-");
            let clients = [];
            clients.splice(0, 0, ...otus);
            clients.splice(0, 0, ...eth);
            fillClient(data, links, clients, xcons, oudArray, 7, portPrefix, ptpPrefix, "odu-");
        }
        //for card UCM4
        if(card[0]['required-type'].indexOf('UCM4')!== -1){
            let [linePTPs,lineOdus] = getLinePTP(ptp,odus);
            refObject.current.ptp = linePTPs;
            if(linePTPs) {
                fillUCM4Line(data, links,linePTPs,lineOdus,xcons, dt["otu"],odus);
            }
        }

        option.series.data = data;
        option.series.links = links;
        refObject.current.myChart.clear();
        refObject.current.myChart.setOption(option);
    }
    function getLinePTP(ptps,odus){
        let linePTPs = [],lineOdus=[],supportPorts=['T1','T2','T3','T4'];
        ptps.forEach( item =>{
            if(item['service-type']==='OTU4'&& supportPorts.indexOf(item['supporting-port'])!==-1){
                linePTPs.push(item);
            }
        });
        odus.forEach( item =>{
            if(item['supporting-card']===selectedType && item['parent-odu'] && supportPorts.indexOf(item['supporting-port'])!==-1){
                lineOdus.push(item);
            }
        });
        return [linePTPs,lineOdus];
    }
    function fillUCM4Line(data, links, linePTPs, odus, xcons,otus,allOdus) {
        let oduArray=[];
        for (let j = 0, len = linePTPs.length; j < len; j++) {
            let aid = linePTPs[j]['name'],hasODU=false,
                ptpType = linePTPs[j]['service-type'],port = linePTPs[j]['supporting-port'];
            odus.forEach( item =>{
                if(item['parent-odu']===aid){
                    hasODU = true;
                    oduArray.push('odu-' + item['name']);
                    data.push({name: 'odu-' + item['name'], depth: 4});
                    links.push({source: port + '/1..80', target: 'odu-' + item['name'], value: parseInt(item['rate'])});
                }
            });
            if(hasODU){
                let otuObj = getObj("otu-"+aid,"otu-",otus),oduObj = getObj("odu-"+aid,"odu-",allOdus),
                    ptp = 'trib-ptp-' + aid + "(" + ptpType + ")",
                    otu = 'otu-' + aid + "(" + otuObj['otu-type'] + ")",
                    odu = 'odu-' + aid + "(" + oduObj['odu-type'] + ")",
                    timeslot = port + '/1..80';
                data.push({name: ptp, depth: 0});
                data.push({name: otu, depth: 1});
                data.push({name: odu, depth: 2});
                data.push({name: timeslot, depth: 3});
                links.push({source: ptp, target: otu, value: 100});
                links.push({source: otu, target: odu, value: 100});
                links.push({source: odu, target: timeslot, value: 100});
            }
        }

        oduArray.forEach( odu => {
            xcons.forEach( xcon=> {
                let source = xcon["source"], destination = xcon["destination"],
                    aid = xcon["AID"].split(",")[0], payload = parseInt(xcon["payload-type"]);
                let souc = "odu-" + source.substring(source.indexOf("'") + 1, source.lastIndexOf("'")),
                    dest = destination.substring(destination.indexOf("'") + 1, destination.lastIndexOf("'"));
                if (odu=== souc || odu === dest) {
                    if(odu === dest) {
                        let temp = dest;
                        dest = souc;
                        souc = temp;
                    }
                    let oduObj = getObj("odu-"+dest,"odu-",allOdus),
                        parent = resource2KeyName(oduObj['supporting-facilities']);
                    data.push({name: "odu-"+dest, depth: 5});
                    data.push({name: parent, depth: 6});
                    data.push({name: "trib-ptp-"+ dest, depth: 7});
                    links.push({source: souc, target: "odu-"+dest, value: 10});
                    links.push({source: "odu-"+dest, target: parent, value: 10});
                    links.push({source: parent, target: "trib-ptp-"+ dest, value: 10});
                }
            });
        });
    }
    function fillG30Ethzr(data, links, sc, clients, portPrefix, depth, channelPrefix, clientPrefix, ptpPrefix) {
        for (let j = 0, len = sc.length; j < len; j++) {
            depth = 0;
            let carMode = parseInt(sc[j]["rate"]);
            let sch = channelPrefix + sc[j].name;
            let topPort = portPrefix + sc[j]["supporting-port"], lineP = "line-ptp-" + sc[j]["AID"];
            sch += " (" + sc[j]["rate"] + ")";
            data.push({name: topPort, depth: depth++});
            data.push({name: lineP, depth: depth++});
            // depth++;
            data.push({name: sch, depth: depth++});
            links.push({source: topPort, target: lineP, value: carMode});
            links.push({source: lineP, target: sch, value: carMode});
            let rate = parseInt(sc[j]["rate"])/100;

            //oducni to timeslot
            let space = j < 1 ? " " : "  ";
            let start = 0;
            while(rate-- > 0){
                start++;
                data.push({name: start+space, depth: depth});
                links.push({source: sch, target: start+space, value: 100});
            }

            //get destination to put into data and links
            for (let k = 0, len = clients.length; k < len; k++) {
                depth = 5;
                let dest = clientPrefix + clients[k]["name"];
                let slots = clients[k]["time-slots"], speed = parseInt(clients[k]["speed"]);
                if (clients[k]["line-port"] == sc[j]["supporting-port"] && !isNullOrUndefined(slots)) {
                    data.push({name: dest, depth: depth++});
                    slots = slots.split(",");
                    if (Array.isArray(slots)) {
                        for (let i = 0; i < slots.length; i++) {
                            let slot = slots[i];
                            if(slot.indexOf("..") === -1) {
                                let start = slots[i];
                                links.push({source: start+space, target: dest, value: 100});
                            }else {
                                let timeSlot = slot.split('..');//like 1..4
                                let startNum = parseInt(timeSlot[0]),
                                    endNum = parseInt(timeSlot[1]);
                                while (startNum <= endNum){
                                    links.push({source: startNum+space, target: dest, value: 100});
                                    startNum ++;
                                }
                            }
                        }
                    } else {
                        let start = slots;
                        links.push({source: start, target: dest, value: 100});
                    }
                    let ptp = ptpPrefix + clients[k]["supporting-port"],
                        port = portPrefix + clients[k]["supporting-port"];
                    // depth++;
                    data.push({name: ptp, depth: depth++});
                    data.push({name: port, depth: depth});
                    links.push({source: dest, target: ptp, value: speed});
                    links.push({source: ptp, target: port, value: speed});
                }

            }
        }
    }
    function fillG30Lineflexo(data, links, sc, oudArray, portPrefix, otus,odus, depth, channelPrefix, channelGroupPrefix) {
        for (let j = 0, len = sc.length; j < len; j++) {
            depth = 0;
            let carMode = parseInt(sc[j]["rate"]);
            let sch = channelPrefix + sc[j].name;
            let oudArr = getOdu(sc[j].AID, odus);
            let otu = 'otu-' + getOtu(sc[j].AID,otus);
            let lay = sc[j]["supporting-port"], carrier = sc[j]["carriers"];
            lay = portPrefix + lay;
            let car = channelGroupPrefix + carrier;
            data.push({name: lay, depth: depth++});
            sch += " (" + sc[j]["rate"] + ")";
            data.push({name: car, depth: depth++});
            links.push({source: lay, target: car, value: carMode});
            links.push({source: car, target: sch, value: carMode});

            let oduN = "odu-" + oudArr[0], odu = oduN + " (" + carMode + "G)";
            data.push({name: sch, depth: depth++});
            data.push({name: otu, depth: depth++});
            data.push({name: odu, depth: depth++});
            //oducni to timeslot
            let space = j < 1 ? ".." : "...";
            links.push({source: sch, target: otu, value: carMode});
            links.push({source: otu, target: odu, value: carMode});
            let times = parseInt(oudArr[1])/20;
            for (let start =1; start <=times; start++) {
                data.push({name: start+'.1' + space + start+'.20', depth: depth});
                links.push({source: odu, target: start+'.1' + space + start+'.20', value: 100});
            }
            depth++;
            // timeslot to odu
            for (let j = 0, len = odus.length; j < len; j++) {
                let name = "odu-" + odus[j]["name"], spCard = odus[j]["supporting-card"],
                    parent = "odu-" + odus[j]["parent-odu"];
                if (selectedType === spCard && ("ODU4i".indexOf(odus[j]["odu-type"]) >= 0 || odus[j]["odu-type"] === "ODUflex") && oduN === parent) {
                    data.push({name: name, depth: depth});
                    oudArray.push(name);
                    let timeSlotArr = odus[j]["opucn-time-slots"].split(",");
                    for (let i = 0; i < timeSlotArr.length; i++) {
                        let [start,end] = timeSlotArr[i].split('..');
                        if(end){//1.1..4.20, 1.2..2.6, 1.8..2.12
                            let st = start.split('.'), ed = end.split('.'),firstFlag = true,value=100;
                            let stLeft = parseInt(st[0]),stRight = parseInt(st[1]), edLeft = parseInt(ed[0]),edRight = parseInt(ed[1]);
                            if(stLeft===edLeft){
                                value = (edRight-stRight +1) * 5;
                                links.push({source: stLeft + '.1' + space + stLeft + '.20', target: name, value: value});
                            }else{
                                let value = (20-stRight +1) * 5;
                                links.push({source: stLeft + '.1' + space + stLeft + '.20', target: name, value: value});
                                stLeft ++;
                                while(stLeft < edLeft){
                                    links.push({source: stLeft + '.1' + space + stLeft + '.20', target: name, value: 100});
                                    stLeft ++;
                                }
                                links.push({source: edLeft + '.1' + space + edLeft + '.20', target: name, value: edRight * 5});
                            }
                        }else{//1.1, 2.12
                            let stNum = start.split('.');//2.18
                            links.push({source: stNum[0] +'.1' + space + stNum[0] + '.20', target: name, value: 5});
                        }
                    }
                }
            }
        }
    }
    function linkWithTimeslot(timeSlotArr,space,name,links,weight){
        let timeSlot = timeSlotArr.split('..');

        if(timeSlot.length===1){
            let startArr1 = timeSlot[0].split(".");
            let startNum1 = (startArr1[0] - 1) * 20 + 1;
            let start1 = parseInt(startNum1 / 20) * 20 + 1, end1 = start1 + 19;
            links.push({source: start1 + space + end1, target: name, value: weight});
        }else {
            let startArr = timeSlot[0].split("."), endArr = timeSlot[1].split(".");//like 1.1
            let startNum = (startArr[0] - 1) * 20 + parseInt(startArr[1]),
                endNum = (endArr[0] - 1) * 20 + parseInt(endArr[1]);
            if (startArr.length == 1) {
                startNum = parseInt(timeSlot[0]);
                endNum = parseInt(timeSlot[1]);
            }
            let start = parseInt(startNum / 20) * 20 + 1, end = start + 19;
            let value = 0, firstFlag = true;
            while (end <= endNum) {
                if (firstFlag) {
                    value = (end - startNum + 1) * weight;
                } else {
                    value = (end - start + 1) * weight;
                }
                links.push({source: start + space + end, target: name, value: value});
                start = end + 1;
                end = end + 20;
                firstFlag = false;
            }
            if (endNum >= start) {
                value = (endNum - start + 1) * weight;
                links.push({source: start + space + end, target: name, value: value});
            }
        }
    }
    function fillG30Clientflexo(data, links, clients, xcons, oudArray, depth, portPrefix, ptpPrefix, clientPrefix) {
        let ports = [],breakOdu=[];
        for (let i = 0, len = oudArray.length; i < len; i++) {
            if(breakOdu.indexOf(oudArray[i])>=0){
                continue;
            }
            let prefix = clientPrefix;
            for (let j = 0, len = xcons.length; j < len; j++) {
                let source = xcons[j]["source"], destination = xcons[j]["destination"],
                    aid = xcons[j]["AID"].split(",")[0], payloade = parseInt(xcons[j]["payload-type"]);/////////////////////////////////////000008888888888888888

                let souc = "odu-" + source.substring(source.indexOf("'") + 1, source.lastIndexOf("'")),
                    dest = prefix + destination.substring(destination.indexOf("'") + 1, destination.lastIndexOf("'"));
                if (aid.indexOf("ODU") < 0) {
                    souc = "odu-" + destination.substring(destination.indexOf("'") + 1, destination.lastIndexOf("'"));
                    dest = prefix + source.substring(source.indexOf("'") + 1, source.lastIndexOf("'"));
                }
                if (oudArray[i] === souc || oudArray[i] === dest) {
                    if(oudArray[i] === dest) {
                        let temp = dest;
                        dest = souc;
                        souc = temp;
                    }
                    if (!isNum(payloade)) {// only for clients==otus{payloade="OTU4"}
                        payloade = 100;
                    }
                    let sOdu = getOdu(souc.split("-")[1],clients);
                    //get destination to put into data and links
                    let xcon = 'XCON-' + xcons[j]["name"];// +'(' +  xcons[j]["type"] +')';

                    for (let k = 0, len = clients.length; k < len; k++) {
                        if (dest === prefix + clients[k]["name"]) {
                            breakOdu.push(dest);
                            let ptp = ptpPrefix + clients[k]["supporting-port"],
                                port = portPrefix + clients[k]["supporting-port"],
                                speed = parseInt(clients[k]["speed"]) || parseInt(clients[k]["rate"]);
                                data.push({name: xcon, depth: depth});
                                data.push({name: dest, depth: depth+1});

                                links.push({source: souc, target: xcon, value: speed});
                                links.push({source: xcon, target: dest, value: speed});
                                if (ports.indexOf(port) == -1) {
                                    ports.push(port);
                                    data.push({name: ptp, depth: depth + 2});
                                    data.push({name: port, depth: depth + 3});
                                }
                                links.push({source: dest, target: ptp, value: speed});
                                links.push({source: ptp, target: port, value: speed});
                                break;
                        }
                    }
                    break;
                }
            }
        }
    }

    function getOtu(id, otus) {
        for (let j = 0, len = otus.length; j < len; j++) {
            if (otus[j].AID === id ) {
                return otus[j].name;
            }
        }
    }
    function getOdu(id, odus) {
        for (let j = 0, len = odus.length; j < len; j++) {
            if ( (odus[j].AID === id || odus[j].name === id)) {//ODUCn|ODUCni "ODUCni".indexOf(odus[j]["odu-type"]) != -1 &&
                return [odus[j].name, odus[j]["total-time-slots"],odus[j]["supporting-port"]];
            }
        }
    }

    function fillLine(data, links, sc, oudArray, otus, portPrefix, odus, depth, channelPrefix, channelGroupPrefix) {
        for (let j = 0, len = sc.length; j < len; j++) {
            let carMode = parseInt(sc[j]["carrier-mode"]);
            let sch = channelPrefix + sc[j].name;
            let oduArr = getOdu(sc[j].AID, odus);
            let lay = sc[j]["supporting-port"], carrier = sc[j]["carriers"];
            if (typeof (lay) === "string") {
                lay = portPrefix + lay;
                let car = channelGroupPrefix + carrier.substring(0, carrier.lastIndexOf("-"));
                data.push({name: lay, depth: depth});
                // if(sc[j]["alarms"]){
                //     data.push({name: car, depth: depth + 1, itemStyle:{color:"red"}});
                // }else{
                    data.push({name: car, depth: depth + 1});
                //     data.push({name: car, depth: depth + 1, itemStyle:{color:"red"}});
                // }
                links.push({source: lay, target: car, value: carMode});
                sch += " (" + sc[j]["carrier-mode"] + ")";
                links.push({source: car, target: sch, value: carMode});
            } else {//array
                lay.sort();
                carrier.sort();
                let car1 = channelGroupPrefix + carrier[0].substring(0, carrier[0].lastIndexOf("-")),
                    car2 = channelGroupPrefix + carrier[1].substring(0, carrier[1].lastIndexOf("-"));
                lay[0] = portPrefix + lay[0];
                lay[1] = portPrefix + lay[1];
                data.push({name: lay[0], depth: depth});
                data.push({name: lay[1], depth: depth});
                data.push({name: car1, depth: depth + 1});
                data.push({name: car2, depth: depth + 1});

                links.push({source: lay[0], target: car1, value: carMode});
                links.push({source: lay[1], target: car2, value: carMode});
                carMode *= 2;
                sch += " (" + sc[j]["carrier-mode"] + ")";
                carMode = carMode / 2;
                links.push({source: car1, target: sch, value: carMode});
                links.push({source: car2, target: sch, value: carMode});
                carMode *= 2;
            }
            let oduN="odu-" + oduArr[0],otu= 'otu-' + getOtu(sc[j].AID, otus) + " (" + carMode + "G)",odu = oduN + " (" + carMode + "G)";
            data.push({name: sch, depth: depth + 2});
            data.push({name: otu, depth: depth + 3});
            data.push({name: odu, depth: depth + 4});
            //oducni to timeslot
            let space = j < 1 ? "\n..\n" : "\n...\n";
            for (let start = 1, end = 20; end <= parseInt(oduArr[1]); start = end + 1, end = end + 20) {
                data.push({name: start + space + end, depth: depth + 5});
            }
            links.push({source: sch, target: otu, value: carMode});
            links.push({source: otu, target: odu, value: carMode});
            for (let start = 1, end = 20; end <= parseInt(oduArr[1]); start = end + 1, end = end + 20) {
                links.push({source: odu, target: start + space + end, value: 25});
            }
            //timeslot to odu
            for (let j = 0, len = odus.length; j < len; j++) {
                let name = "odu-" + odus[j]["name"], spCard = odus[j]["supporting-card"],
                    parent = "odu-" + odus[j]["parent-odu"];
                if (selectedType === spCard && ("ODU4i".indexOf(odus[j]["odu-type"]) >= 0 || odus[j]["odu-type"] === "ODUflexi") && oduN === parent) {
                    data.push({name: name, depth: depth + 6});
                    oudArray.push(name);
                    let timeSlotArr = odus[j]["time-slots"].split(",");
                    for (let i = 0; i < timeSlotArr.length; i++) {
                        linkWithTimeslot(timeSlotArr[i],space,name,links,1.25);
                    }
                }
            }
        }
    }

    function fillClient(data, links, clients, xcons, oduArray, depth, portPrefix, ptpPrefix, clientPrefix) {
        let ports = [], ptps = [], payloads = {}, usedEth = [];
        for (let i = 0, len = oduArray.length; i < len; i++) {
            let prefix = clientPrefix;
            for (let j = 0, len = xcons.length; j < len; j++) {
                let source = xcons[j]["source"], destination = xcons[j]["destination"],
                    aid = xcons[j]["AID"].split(",")[0], payload = parseInt(xcons[j]["payload-type"]);
                let souc = "odu-" + source.substring(source.indexOf("'") + 1, source.lastIndexOf("'")),
                    dest = destination.substring(destination.indexOf("'") + 1, destination.lastIndexOf("'"));
                if (aid.indexOf("ODU") < 0) {
                    souc = "odu-" + destination.substring(destination.indexOf("'") + 1, destination.lastIndexOf("'"));
                    dest = source.substring(source.indexOf("'") + 1, source.lastIndexOf("'"));
                }

                if (oduArray[i] === souc || oduArray[i] === dest) {
                    if(oduArray[i] === dest) {
                        let temp = dest;
                        dest = souc;
                        souc = temp;
                    }
                    let xcon =  'XCON-' + xcons[j]["name"] +'(' +  xcons[j]["payload-type"] +')';
                    data.push({name: xcon, depth: depth});
                    //destination to trib-ptp
                    for (let k = 0, len = clients.length; k < len; k++) {
                        let ptp = ptpPrefix + clients[k]["supporting-port"],
                            port = portPrefix + clients[k]["supporting-port"];
                        let eth = clients[k]["name"], type = clients[k]["odu-type"] || clients[k]["otu-type"];
                        if (dest === eth) {//get one xcon
                            if (isNullOrUndefined(type)) {
                                dest = "ethernet-" + dest;
                            } else {
                                if (type = "OTU4") {
                                    payload = 100;
                                    dest = "otu-" + dest;
                                } else {//ODU4
                                    dest = "odu-" + dest;
                                }
                            }

                            data.push({name: dest, depth: depth+1});
                            links.push({source: souc, target: xcon, value: payload});
                            links.push({source: xcon, target: dest, value: payload});
                            links.push({source: dest, target: ptp, value: payload});
                            if (ports.indexOf(port) == -1) {
                                ports.push(port);
                                ptps.push(ptp);
                            }
                            break;
                        }
                    }
                    break;
                }
            }
        }
        for (let i = 0; i < ports.length; i++) {
            data.push({name: ptps[i], depth: depth+2});
            data.push({name: ports[i], depth: depth+3 });
            links.push({source: ptps[i], target: ports[i], value: getPayLoad(portPrefix, ports[i], clients)});
        }
    }

    function getPayLoad(portPrefix, port, clients) {
        let payLoad = 0;
        for (let k = 0, len = clients.length; k < len; k++) {
            let portp = portPrefix + clients[k]["supporting-port"],
                speed = parseInt(clients[k]["speed"]) || parseInt(clients[k]["rate"]);
            if (portp == port) {
                payLoad += speed;
            }
        }
        return payLoad;
    }

    function initEntityList() {
        let links = [];
        Object.keys(optionlist).map((key) => {
            links.push(<option key={key}>{optionlist[key]}</option>);
        });
        return links;
    }

    function initRelateTableConfig(type, data, title) {
        let _title = type;
        let _realType = type;
        let selectedObjTitle = _title + "-" + title;
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
        if( _keys === "" ) {
            _keys = {};
            _keys[type] = {
                "name" : data.name
            }
        }
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

    let tableHead = "react-table-heading";
    let tablePanelBackground = " table-panel-border-show";
    let entityOptionlist = initEntityList();
    return (
        <div className="table-server-view-flex">
            <div className="table-server-view">
                <div className={"table-container panel-default tablePanel" + tablePanelBackground}>
                    <div className={"panel-heading " + tableHead}>
                        <span className="iconfont icon-collapse-up3" onClick={handleCollapseClick}/>
                        {getText("service-view")}
                    </div>
                    <div id={"react_collapse_table_body_topo"} className="collapse in">
                        <label id="react-service-view-label" title="type">Card</label>
                        <select type="select" id="react-service-view-entity" disabled={false}
                                onChange={handleSetValue}>
                            {entityOptionlist}
                        </select>
                    </div>
                </div>
                <div id="myChart" className="myChart"/>
                {/*<div id="line" ></div>*/}
            </div>
            <div className="table-server-view-relate">
                <DynamicTabPanel tabConfig={selectedData.configs} panelTitle={selectedData.panelTitle}/>
            </div>
        </div>
    );
}

ReactTopo.defaultProps = {
    id: "ToolView",
    Title: "Tool View"
};

let createTopoView = function (_config, showPanelConfig, tableHashCode) {
    return (
        <ReactTopo key={"react_rpc_tool_" + tableHashCode}/>
    );
}


export {createTopoView as serviceView};
