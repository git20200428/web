/**
 * Created by YaFeng on 2/9/2021.
 */
import React from "react";
import {rect} from "../core/svg_core"

const offsetYC = 20;
const offsetHC = 40;
const textOffsetCircle = 5;
const textOffsetPoly = 6;
const polySize = 12;

const radius = 10;
const strokeWidth = 2;

const normalStatusColor = "green";

const criticalStatusColor = "red";

const normalStatusBgColor = "blue";

function WS04SSplitterDiagram(props) {

    let splitterOps = props
    let rxOffsetY = splitterOps.height / 2;
    let txOffsetY = splitterOps.height / 5;
    let rxbaseY = splitterOps.y + rxOffsetY;
    let txbaseY = splitterOps.y + txOffsetY;
    //======================Egress Begins===============================

    let txAde1Ops = {
        x: splitterOps.x + splitterOps.width,
        y: txbaseY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: splitterOps.x + splitterOps.width, y: txbaseY},

    };
    props.ade.ade1.txOut = txAde1Ops

    let txAde2Ops = {
        x: splitterOps.x + splitterOps.width,
        y: txbaseY + txOffsetY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: splitterOps.x + splitterOps.width, y: txbaseY + txOffsetY},

    };
    props.ade.ade2.txOut = txAde2Ops

    let txAde3Ops = {
        x: splitterOps.x + splitterOps.width,
        y: txbaseY + txOffsetY * 2,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: splitterOps.x + splitterOps.width, y: txbaseY + txOffsetY * 2},

    };
    props.ade.ade3.txOut = txAde3Ops

    let txAde4Ops = {
        x: splitterOps.x + splitterOps.width,
        y: txbaseY + txOffsetY * 3,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: splitterOps.x + splitterOps.width, y: txbaseY + txOffsetY * 3},

    };

    props.ade.ade4.txOut = txAde4Ops


    let txInOps = {
        x: splitterOps.x,
        y: rxbaseY,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: splitterOps.x, y: rxbaseY},
    };
    props.txIn = txInOps;


    //======================Egress Ends===============================


    function handlePortContext() {
        // alert("This is a Port!")
    }

    if (splitterOps.role === "Egress") {
        return (
            <g id="port" key={splitterOps.innerInd} onClickCapture={handlePortContext()}>
                {rect(splitterOps)}
            </g>
        );
    }

}

export default WS04SSplitterDiagram;