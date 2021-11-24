/**
 * Created by YaFeng on 2/22/2021.
 */
import React from "react";
import {line, lineWithEndArrow, lineWithMiddleArrow, lineWithStartArrow} from "../core/svg_core"

function LinkDiagram(props) {

    let linkOps = props;

    function handleLinkContext() {
        // alert("This is a Card!")
    }


    if (props.arrow.at === "middle") {
        return (
            <g id="card" key={linkOps.innerInd} onClickCapture={handleLinkContext()}>
                {lineWithMiddleArrow(linkOps)}
            </g>
        );
    } else if (props.arrow.at === "start") {
        return (
            <g id="card" key={linkOps.innerInd} onClickCapture={handleLinkContext()}>
                {lineWithStartArrow(linkOps)}
            </g>
        );
    } else if (props.arrow.at === "end") {
        return (
            <g id="card" key={linkOps.innerInd} onClickCapture={handleLinkContext()}>
                {lineWithEndArrow(linkOps)}
            </g>
        );
    } else {
        return (
            <g id="card" key={linkOps.innerInd} onClickCapture={handleLinkContext()}>
                {line(linkOps)}
            </g>
        );
    }

}

export default LinkDiagram;