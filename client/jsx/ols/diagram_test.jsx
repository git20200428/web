/**
 * Created by YaFeng on 2/9/2021.
 */
import React from "react";
import ReactDOM from 'react-dom';
import "./diagram.css";
import {extendCustomConfig, isEmpty} from "../../jsx/custom/utils";
import cardConfig from "./components/card_config";
import CardDiagram from "./components/card_diagram";
import LinkDiagram from "./components/link_diagram";

import {ModalConfigConstant, ReactModalAlert} from "../custom/modal/react_modal";


let SVGCore = function () {
    function getScreenWidth() {
        return window.screen.width;
    }

    function getScreenHeight() {
        return window.screen.height;
    }

    function getBodyWidth() {
        return document.body.clientWidth;
    }

    function getBodyHeight() {
        return document.body.clientHeight;
    }

    function getParentWidth(elmId) {
        let paelm = document.getElementById(elmId);
        if (!isEmpty(paelm)) {
            return paelm.width;
        } else {
            return getBodyWidth();
        }

    }

    function getParentHeight(elmId) {
        let paelm = document.getElementById(elmId);
        if (!isEmpty(paelm)) {
            return paelm.height;
        } else {
            return getBodyHeight();
        }
    }


    let width = getParentWidth("SVGApp");
    let height = getParentHeight("SVGApp");

    let swidth = getScreenWidth();
    let sheight = getScreenHeight();

    let cardOps = cardConfig.defaultCard;
    let total_cw = 125, total_ch = 20;

    let xxxcardOps = extendCustomConfig(cardConfig.XXXCard);

    xxxcardOps.x = xxxcardOps.x + 800;

    xxxcardOps.ports.map(port => {
        port.x = port.x + 800;
    });

    let wssCardOps = extendCustomConfig(cardConfig.WS04SCard_Ingress);

    wssCardOps.x = wssCardOps.x + 1600;

    wssCardOps.ports.map(port => {
        port.x = port.x + 1600;
    });

    wssCardOps.wss.x = wssCardOps.wss.x + 1600;
    wssCardOps.splitter.x = wssCardOps.splitter.x + 1600;


    let cardSvg = [];
    cardSvg.push(CardDiagram(cardOps));
    total_cw = total_cw + 800 + cardOps.width;
    total_ch = total_ch + cardOps.height + 20;
    cardSvg.push(CardDiagram(xxxcardOps));
    total_cw = total_cw + xxxcardOps.width;
    cardSvg.push(CardDiagram(wssCardOps));
    total_cw = total_cw + wssCardOps.width;


    width = Math.max(total_cw, width);
    height = Math.min(total_ch, height);

    //  Ingress --> Egress
    let rxInLinkOps = extendCustomConfig(cardConfig.defaultLink, {
        x1: cardOps.ports[0].rxIn.linkPoint.x - 40,
        y1: cardOps.ports[0].rxIn.linkPoint.y,
        x2: cardOps.ports[0].rxIn.linkPoint.x,
        y2: cardOps.ports[0].rxIn.linkPoint.y,
    });

    cardSvg.push(LinkDiagram(rxInLinkOps));

    let rxOutLinkOps = extendCustomConfig(cardConfig.defaultLink, {
        x1: cardOps.ports[1].txOut.linkPoint.x,
        y1: cardOps.ports[1].txOut.linkPoint.y,
        x2: xxxcardOps.ports[0].rxIn.linkPoint.x,
        y2: xxxcardOps.ports[0].rxIn.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(rxOutLinkOps));

    let txOutLinkOps_xxx = extendCustomConfig(cardConfig.defaultLink, {
        x1: xxxcardOps.ports[1].txOut.linkPoint.x,
        y1: xxxcardOps.ports[1].txOut.linkPoint.y,
        x2: wssCardOps.ports[0].rxIn.linkPoint.x,
        y2: wssCardOps.ports[0].rxIn.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(txOutLinkOps_xxx));


    let rxOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.ports[0].rxOut.linkPoint.x,
        y1: wssCardOps.ports[0].rxOut.linkPoint.y,
        x2: wssCardOps.splitter.txIn.linkPoint.x,
        y2: wssCardOps.splitter.txIn.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(rxOutLinkOps_ws04s));


    let ade1_txOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.splitter.ade.ade1.txOut.linkPoint.x,
        y1: wssCardOps.splitter.ade.ade1.txOut.linkPoint.y,
        x2: wssCardOps.splitter.ade.ade1.txOut.linkPoint.x + 40,
        y2: wssCardOps.splitter.ade.ade1.txOut.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(ade1_txOutLinkOps_ws04s));

    let ade2_txOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.splitter.ade.ade2.txOut.linkPoint.x,
        y1: wssCardOps.splitter.ade.ade2.txOut.linkPoint.y,
        x2: wssCardOps.splitter.ade.ade2.txOut.linkPoint.x + 40,
        y2: wssCardOps.splitter.ade.ade2.txOut.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(ade2_txOutLinkOps_ws04s));

    let ade3_txOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.splitter.ade.ade3.txOut.linkPoint.x,
        y1: wssCardOps.splitter.ade.ade3.txOut.linkPoint.y,
        x2: wssCardOps.splitter.ade.ade3.txOut.linkPoint.x + 40,
        y2: wssCardOps.splitter.ade.ade3.txOut.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(ade3_txOutLinkOps_ws04s));

    let ade4_txOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.splitter.ade.ade4.txOut.linkPoint.x,
        y1: wssCardOps.splitter.ade.ade4.txOut.linkPoint.y,
        x2: wssCardOps.splitter.ade.ade4.txOut.linkPoint.x + 40,
        y2: wssCardOps.splitter.ade.ade4.txOut.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(ade4_txOutLinkOps_ws04s));


    // Egress --> Ingress

    let ade1_rxOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.wss.ade.ade1.rxOut.linkPoint.x + 40,
        y1: wssCardOps.wss.ade.ade1.rxOut.linkPoint.y,
        x2: wssCardOps.wss.ade.ade1.rxOut.linkPoint.x,
        y2: wssCardOps.wss.ade.ade1.rxOut.linkPoint.y,

    });
    cardSvg.push(LinkDiagram(ade1_rxOutLinkOps_ws04s));

    let ade2_rxOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.wss.ade.ade2.rxOut.linkPoint.x + 40,
        y1: wssCardOps.wss.ade.ade2.rxOut.linkPoint.y,
        x2: wssCardOps.wss.ade.ade2.rxOut.linkPoint.x,
        y2: wssCardOps.wss.ade.ade2.rxOut.linkPoint.y,

    });
    cardSvg.push(LinkDiagram(ade2_rxOutLinkOps_ws04s));

    let ade3_rxOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.wss.ade.ade3.rxOut.linkPoint.x + 40,
        y1: wssCardOps.wss.ade.ade3.rxOut.linkPoint.y,
        x2: wssCardOps.wss.ade.ade3.rxOut.linkPoint.x,
        y2: wssCardOps.wss.ade.ade3.rxOut.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(ade3_rxOutLinkOps_ws04s));

    let ade4_rxOutLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.wss.ade.ade4.rxOut.linkPoint.x + 40,
        y1: wssCardOps.wss.ade.ade4.rxOut.linkPoint.y,
        x2: wssCardOps.wss.ade.ade4.rxOut.linkPoint.x,
        y2: wssCardOps.wss.ade.ade4.rxOut.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(ade4_rxOutLinkOps_ws04s));

    let rxInLinkOps_ws04s = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.wss.rxIn.linkPoint.x,
        y1: wssCardOps.wss.rxIn.linkPoint.y,
        x2: wssCardOps.ports[0].txOut.linkPoint.x,
        y2: wssCardOps.ports[0].txOut.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(rxInLinkOps_ws04s));

    let rxOutLinkOps_xxx = extendCustomConfig(cardConfig.defaultLink, {
        x1: wssCardOps.ports[0].txIn.linkPoint.x,
        y1: wssCardOps.ports[0].txIn.linkPoint.y,
        x2: xxxcardOps.ports[1].rxOut.linkPoint.x,
        y2: xxxcardOps.ports[1].rxOut.linkPoint.y,
    });

    cardSvg.push(LinkDiagram(rxOutLinkOps_xxx));


    let txInLinkOps_xxx = extendCustomConfig(cardConfig.defaultLink, {
        x1: xxxcardOps.ports[0].txIn.linkPoint.x,
        y1: xxxcardOps.ports[0].txIn.linkPoint.y,
        x2: cardOps.ports[1].rxOut.linkPoint.x,
        y2: cardOps.ports[1].rxOut.linkPoint.y,

    });
    cardSvg.push(LinkDiagram(txInLinkOps_xxx));

    let txInLinkOps = extendCustomConfig(cardConfig.defaultLink, {
        x1: cardOps.ports[0].txIn.linkPoint.x,
        y1: cardOps.ports[0].txIn.linkPoint.y,
        x2: cardOps.ports[0].txIn.linkPoint.x - 40,
        y2: cardOps.ports[0].txIn.linkPoint.y,
    });
    cardSvg.push(LinkDiagram(txInLinkOps));

    return (
        //<div  id="SVGApp" className="ols-diagram-component">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="SVGApp" className="ols-diagram-component"
             width={width} height={height}>
            <defs>
                <marker id='markerArrow' viewBox="0 0 40 24" markerWidth='20' markerHeight='12' refX='10' refY='6'
                        orient='auto'>
                    <path d='M2,0 L10,6 L0,10 Z' stroke="#4b5159" strokeWidth="2"/>
                </marker>
            </defs>
            {cardSvg}

        </svg>

        //</div>
    );
}

export default function showOLSDiagram() {
    let title = "Show OLS Diagram";
    let modalConfig = {
        head: {
            title: title
        },
        body: {
            bodyContentType: ModalConfigConstant.ModalBodyTypeEnum.Custom,
            bodyContentMessage: ""
        },
        foot: {
            buttons: []
        }
    };
    ReactDOM.render(<ReactModalAlert id="showOLSDiagramDialog" modalConfig={modalConfig}
                                     customPanel={SVGCore()}
                                     objectType={"ols-diagram"}/>, document.getElementById("additionalContent1"));
}

