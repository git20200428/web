import React, {useEffect, useRef, useState} from "react";
import getPosition from "./getPosition";

export default function ToolTip(props) {
    const refRoot = useRef();
    const [tip, setTip] = useState("");
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [tooltipClass, setTooltipClass] = useState(null);
    let timeout;
    let loopTimeout;
    (props != null && props.timeout != null) ? timeout = props.timeout : timeout = 1000;
    const onMouseMove = e => {
        clearTimeout(loopTimeout);
        if (e.target.getAttribute("data-tip")) {
            loopTimeout = setTimeout(function () {
                let place = "right";
                setTip(e.target.getAttribute("data-tip"));
                let result = getPosition(
                    e,
                    e.target,
                    refRoot.current,
                    "right",
                    "right",
                    "float",
                    null
                );

                if (result.isNewState) {
                    // Switch to reverse placement
                    // setPlace(result.newState.place);
                    place = result.newState.place;
                    result = getPosition(
                        e,
                        e.target,
                        refRoot.current,
                        result.newState.place,
                        result.newState.place,
                        "float",
                        null
                    );

                }

                // Set tooltip position
                setX(result.position.left);
                setY(result.position.top);
                setTooltipClass("__react_component_tooltip uuid show place-" + place + " type-dark");
                const type = e.target.getAttribute("tooltip-type") || props.type;
                const toolTipType = {
                    dark: "#222", success: "#8DC572", warning: "#F0AD4E",
                    error: "#BE6464", info: "#337AB7", light: "#fff"
                };
                document.body.style.setProperty('--border-color', toolTipType[type]);
                document.body.style.setProperty('--background-color', toolTipType[type]);

            }, timeout);

        } else {
            setTip("");
            setTooltipClass("__react_component_tooltip");
        }
    };

    const onMouseLeave = () => {
        clearTimeout(loopTimeout);

        setTip("");
        setTooltipClass("__react_component_tooltip");
    };

    useEffect(() => {
        const element = refRoot.current.parentElement;
        element.addEventListener("mousemove", onMouseMove);
        element.addEventListener("mouseout", onMouseLeave);
        element.addEventListener("click", onMouseLeave);
        element.addEventListener("contextmenu", onMouseLeave);

        return () => {
            element.removeEventListener("mousemove", onMouseMove);
            element.removeEventListener("mouseout", onMouseLeave);
            element.removeEventListener("click", onMouseMove);
            element.removeEventListener("contextmenu", onMouseLeave);
        };
    }, []);

    return (
        <div ref={refRoot}
             className={tooltipClass}
             style={{left: x + "px", top: y + "px"}}
             dangerouslySetInnerHTML={{__html: tip}}
        >
        </div>
    );
}
