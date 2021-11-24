/**
 * Created by YaFeng on 2/9/2021.
 */
import React from "react";
import {circle, polygon, rect, text} from "../core/svg_core"

const offsetYC = 20;
const textOffsetCircle = 5;
const textOffsetPoly = 6;
const polySize = 12;

const radius = 10;
const strokeWidth = 2;

const normalStatusColor = "green";

const criticalStatusColor = "red";

const normalStatusBgColor = "blue";

function PortDiagram(props) {

    let portOps = props

    let upbaseY = portOps.y + portOps.height / 4;//portOps.y+portOps.height/2 - offsetYC;
    let downbaseY = portOps.y + portOps.height / 4 * 3;//portOps.y+portOps.height/2 + offsetYC;
    //======================Ingress Begins===============================

    let rxOutOps = {
        cx: portOps.x + portOps.width,
        cy: upbaseY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: portOps.x + portOps.width + radius, y: upbaseY},

    };


    let txOutOps = {
        cx: portOps.x + portOps.width,
        cy: downbaseY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: portOps.x + portOps.width + radius, y: downbaseY},

    };


    let rxOutTextOps = {
        x: rxOutOps.cx - textOffsetCircle,
        y: rxOutOps.cy + textOffsetCircle,
        text: "Rx",
        color: normalStatusBgColor
    };
    let txOutTextOps = {
        x: txOutOps.cx - textOffsetCircle,
        y: txOutOps.cy + textOffsetCircle,
        text: "Tx",
        color: normalStatusBgColor
    };

    //   p3======p2
    //   ||            ||      p1
    //   p4======p5
    let rxInPolyOps = {
        points: [
            {x: portOps.x + polySize, y: upbaseY},
            {x: portOps.x, y: upbaseY - polySize},
            {x: portOps.x - polySize, y: upbaseY - polySize},
            {x: portOps.x - polySize, y: upbaseY + polySize},
            {x: portOps.x, y: upbaseY + polySize},
        ],
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: portOps.x - polySize, y: upbaseY},
    };

    //                     p2======p3
    //          p1      ||            ||
    //                   p5======p4
    let txInPolyOps = {
        points: [
            {x: portOps.x - polySize, y: downbaseY},
            {x: portOps.x, y: downbaseY - polySize},
            {x: portOps.x + polySize, y: downbaseY - polySize},
            {x: portOps.x + polySize, y: downbaseY + polySize},
            {x: portOps.x, y: downbaseY + polySize},
        ],
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,

        linkPoint: {x: portOps.x - polySize, y: downbaseY},

    };


    let rxInPolyTextOps = {
        x: portOps.x - 2 * textOffsetPoly,
        y: upbaseY + textOffsetPoly,
        text: "Rx",
        color: normalStatusBgColor
    };
    let txInPolyTextOps = {
        x: portOps.x - textOffsetPoly,
        y: downbaseY + textOffsetPoly,
        text: "Tx",
        color: normalStatusBgColor
    };
    //======================Ingress Ends===============================

    //===================Egress Begins=================================
    let txInOps = {
        cx: portOps.x,
        cy: upbaseY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: portOps.x - radius, y: upbaseY},

    };

    let rxInOps = {
        cx: portOps.x,
        cy: downbaseY,
        r: radius,
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: portOps.x - radius, y: downbaseY},
    };


    let txInTextOps = {
        x: txInOps.cx - textOffsetCircle,
        y: txInOps.cy + textOffsetCircle,
        text: "Tx",
        color: normalStatusBgColor
    };
    let rxInTextOps = {
        x: rxInOps.cx - textOffsetCircle,
        y: rxInOps.cy + textOffsetCircle,
        text: "Rx",
        color: normalStatusBgColor
    };
    //   p3======p2
    //   ||            ||      p1
    //   p4======p5
    let txOutPolyOps = {
        points: [
            {x: portOps.x + portOps.width + polySize, y: upbaseY},
            {x: portOps.x + portOps.width, y: upbaseY - polySize},
            {x: portOps.x + portOps.width - polySize, y: upbaseY - polySize},
            {x: portOps.x + portOps.width - polySize, y: upbaseY + polySize},
            {x: portOps.x + portOps.width, y: upbaseY + polySize},
        ],
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: portOps.x + portOps.width + polySize, y: upbaseY},
    };

    //                     p2======p3
    //          p1      ||            ||
    //                   p5======p4
    let rxOutPolyOps = {
        points: [
            {x: portOps.x + portOps.width - polySize, y: downbaseY},
            {x: portOps.x + portOps.width, y: downbaseY - polySize},
            {x: portOps.x + portOps.width + polySize, y: downbaseY - polySize},
            {x: portOps.x + portOps.width + polySize, y: downbaseY + polySize},
            {x: portOps.x + portOps.width, y: downbaseY + polySize},
        ],
        stroke: {
            color: normalStatusColor,
            width: strokeWidth,
        },

        fill: criticalStatusColor,
        linkPoint: {x: portOps.x + portOps.width + polySize, y: downbaseY},

    };


    let txOutPolyTextOps = {
        x: portOps.x + portOps.width - 2 * textOffsetPoly,
        y: upbaseY + textOffsetPoly,
        text: "Tx",
        color: normalStatusBgColor
    };
    let rxOutPolyTextOps = {
        x: portOps.x + portOps.width - textOffsetPoly,
        y: downbaseY + textOffsetPoly,
        text: "Rx",
        color: normalStatusBgColor
    };

    //===================Egress Ends=================================

    function handlePortContext() {
        // alert("This is a Port!")
    }

    if (portOps.role === "Ingress") {
        props.rxOut = rxOutOps
        props.txOut = txOutOps
        props.rxIn = rxInPolyOps
        props.txIn = txInPolyOps
        return (
            <g id="port" key={portOps.innerInd} onClickCapture={handlePortContext()}>
                {rect(portOps)}
                {polygon(rxInPolyOps)}
                {text(rxInPolyTextOps)}
                {polygon(txInPolyOps)}
                {text(txInPolyTextOps)}
                {circle(rxOutOps)}
                {text(rxOutTextOps)}
                {circle(txOutOps)}
                {text(txOutTextOps)}
            </g>
        );
    } else if (portOps.role === "Egress") {
        props.txIn = txInOps
        props.rxIn = rxInOps
        props.txOut = txOutPolyOps
        props.rxOut = rxOutPolyOps
        return (
            <g id="port" key={portOps.innerInd} onClickCapture={handlePortContext()}>
                {rect(portOps)}
                {circle(txInOps)}
                {text(txInTextOps)}
                {circle(rxInOps)}
                {text(rxInTextOps)}
                {polygon(txOutPolyOps)}
                {text(txOutPolyTextOps)}
                {polygon(rxOutPolyOps)}
                {text(rxOutPolyTextOps)}
            </g>
        );
    }

}

export default PortDiagram;