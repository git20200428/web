/**
 * Created by YaFeng on 2/8/2021.
 */
import React from "react";

export const circle = function (options) {
    return (
        <circle cx={options.cx} cy={options.cy} r={options.r} stroke={options.stroke.color}
                strokeWidth={options.stroke.width} fill={options.fill}/>
    );
}

export const rect = function (options) {
    return (
        <rect x={options.x} y={options.y} rx={options.rx} ry={options.ry} width={options.width} height={options.height}
              stroke={options.stroke.color} strokeWidth={options.stroke.width} fill={options.fill}
            /* style={options.style}*//>
    );
}


export const polygon = function (options) {

    const getPointsString = function (options) {
        let points = options.points;
        let pointsArr = [];
        points.map(point => {
            pointsArr.push(point.x);
            pointsArr.push(point.y);

        });
        // console.log(pointsArr.join(","))
        return pointsArr.join(",");
    }

    return (
        <polygon points={getPointsString(options)} stroke={options.stroke.color} strokeWidth={options.stroke.width}
                 fill={options.fill}
        />
    );
}

export const text = function (options) {
    return (
        <text x={options.x} y={options.y} fill={options.color}>{options.text}</text>
    );
}


const drawLineArrow = function (x1, y1, x2, y2) {
    let path;
    let slopy, cosy, siny;
    let Par = 10.0;
    let x3, y3;
    slopy = Math.atan2((y1 - y2), (x1 - x2));
    cosy = Math.cos(slopy);
    siny = Math.sin(slopy);

    path = "M" + x1 + "," + y1 + " L" + x2 + "," + y2;

    x3 = (Number(x1) + Number(x2)) / 2;
    y3 = (Number(y1) + Number(y2)) / 2;

    path += " M" + x3 + "," + y3;

    path += " L" + (Number(x3) + Number(Par * cosy - (Par / 2.0 * siny))) + "," + (Number(y3) + Number(Par * siny + (Par / 2.0 * cosy)));

    path += " M" + (Number(x3) + Number(Par * cosy + Par / 2.0 * siny) + "," + (Number(y3) - Number(Par / 2.0 * cosy - Par * siny)));
    path += " L" + x3 + "," + y3;

    return path;
}


export const line = function (options) {
    return (
        // <line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2"/>
//


        <line x1={options.x1} y1={options.y1} x2={options.x2} y2={options.y2} width={options.width}
              height={options.height} stroke={options.stroke.color} strokeWidth={options.stroke.width}
              fill={options.fill}
            /* style={options.style}*/ />

    );
}

export const lineWithEndArrow = function (options) {
    return (
        // <line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2"/>
//


        <line x1={options.x1} y1={options.y1} x2={options.x2} y2={options.y2} width={options.width}
              height={options.height} stroke={options.stroke.color} strokeWidth={options.stroke.width}
              fill={options.fill}
            /* style={options.style}*/ markerEnd='url(#markerArrow)'/>

    );
}

export const lineWithStartArrow = function (options) {
    return (
        // <line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2"/>
//


        <line x1={options.x1} y1={options.y1} x2={options.x2} y2={options.y2} width={options.width}
              height={options.height} stroke={options.stroke.color} strokeWidth={options.stroke.width}
              fill={options.fill}
            /* style={options.style}*/ markerStart='url(#markerArrow)'/>

    );
}

export const lineWithMiddleArrow = function (options) {
    let x1, y1, x2, y2;
    x1 = options.x1;
    y1 = options.y1;
    x2 = options.x2;
    y2 = options.y2;
    let path = drawLineArrow(x1, y1, x2, y2);
    return (
        <path d={path} stroke="#4b5159" strokeWidth="2"/>
    );

}

export const arrow = function (options) {

    return (

        <marker id='markerArrow' viewBox="0 0 40 24" markerWidth='20' markerHeight='12' refX='10' refY='6'
                orient='auto'>
            <path d='M2,0 L10,6 L0,10 Z' stroke="#4b5159" strokeWidth="2"/>
        </marker>

    );

}

