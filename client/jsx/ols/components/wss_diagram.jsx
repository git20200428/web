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

function WS04SWssDiagram(props) {

    let wssOps = props
    let txOffsetY = wssOps.height / 2;
    let rxOffsetY = wssOps.height / 5;
    let txbaseY = wssOps.y + txOffsetY;
    let rxbaseY = wssOps.y + rxOffsetY;
    //======================Egress Begins===============================

    let rxAde1Ops = {
        x: wssOps.x + wssOps.width,
        y: rxbaseY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: wssOps.x + wssOps.width, y: rxbaseY},

    };
    props.ade.ade1.rxOut = rxAde1Ops

    let rxAde2Ops = {
        x: wssOps.x + wssOps.width,
        y: rxbaseY + rxOffsetY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: wssOps.x + wssOps.width, y: rxbaseY + rxOffsetY},

    };
    props.ade.ade2.rxOut = rxAde2Ops

    let rxAde3Ops = {
        x: wssOps.x + wssOps.width,
        y: rxbaseY + rxOffsetY * 2,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: wssOps.x + wssOps.width, y: rxbaseY + rxOffsetY * 2},

    };
    props.ade.ade3.rxOut = rxAde3Ops

    let rxAde4Ops = {
        x: wssOps.x + wssOps.width,
        y: rxbaseY + rxOffsetY * 3,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: wssOps.x + wssOps.width, y: rxbaseY + rxOffsetY * 3},

    };

    props.ade.ade4.rxOut = rxAde4Ops


    let rxInOps = {
        x: wssOps.x,
        y: txbaseY,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: wssOps.x, y: txbaseY},
    };
    props.rxIn = rxInOps;


    //======================Egress Ends===============================


    function handlePortContext() {
        // alert("This is a Port!")
    }

    if (wssOps.role === "Egress") {
        return (
            <g id="port" key={wssOps.innerInd} onClickCapture={handlePortContext()}>
                {rect(wssOps)}
            </g>
        );
    }

}

export default WS04SWssDiagram;