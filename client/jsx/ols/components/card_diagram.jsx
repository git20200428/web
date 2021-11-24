/**
 * Created by YaFeng on 2/9/2021.
 */
import React from "react";
import PortDiagram from "./port_diagram";
import WS04SWssDiagram from "./wss_diagram";
import WS04SSplitterDiagram from "./splitter_diagram";
import {rect} from "../core/svg_core"

function CardDiagram(props) {

    let cardOps = props;
    let portSvg = [];

    cardOps.ports.map(port => {
        // console.log("port:", port);
        portSvg.push(PortDiagram(port));
    });


    let htmlEles = []
    if (cardOps.hasOwnProperty("wss")) {
        htmlEles.push(WS04SWssDiagram(cardOps.wss));
    }

    if (cardOps.hasOwnProperty("splitter")) {
        htmlEles.push(WS04SSplitterDiagram(cardOps.splitter));
    }


    function handleCardContext() {
        // alert("This is a Card!")
    }


    return (
        <g id="card" key={cardOps.innerInd} onClickCapture={handleCardContext()}>
            {rect(cardOps)}
            {htmlEles}
            {portSvg}
        </g>
    );
}

export default CardDiagram;