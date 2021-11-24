import React, {Component} from 'react';
import {isNullOrUndefined} from "../utils";

class ReactCircleIconText extends Component {
    createColorCircle() {
        let colorClass = [
            "iconfont",
            "icon-circle",
            this.props.color || ""
        ];
        let {circleTitle} = this.props;
        return <span className={colorClass.join(" ")} title={circleTitle || ""}></span>;
    }

    createText() {
        let text = this.props.text;
        if (isNullOrUndefined(text)) {
            return;
        }
        return <span className="react-table-td-span-font" title={text}>{text}</span>
    }

    render() {
        return (
            <div className="react-table-td-span">
                {this.createColorCircle()}
                {this.createText()}
            </div>
        );
    }
}

export default ReactCircleIconText;
