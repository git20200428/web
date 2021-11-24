import React, {Component} from "react";
import {isFunction} from "../utils";
import ReactCircleIconText from "./react_circle_text";

class ReactSelect extends Component {
    handleOnClick(currentVal) {
        return function (event) {
            event.stopPropagation();
            let state = !(currentVal == this.props.items[true].value);
            let val = this.props.items[state].value;
            if (isFunction(this.props.onClick)) {
                this.props.onClick(val, this.props);
            }
        }.bind(this)
    }

    createItem() {
        let itemList = [];
        Object.values(this.props.items).map(conf => {
            if (conf.value == this.props.value) {
                itemList.push(<option value={conf.value} selected="selected">{conf.label}</option>);
            } else {
                itemList.push(<option value={conf.value}>{conf.label}</option>);
            }
        });
        return <select>{itemList}</select>;
    }

    renderUnPermissions() {
        let color = null, text = null;
        Object.values(this.props.items).map(conf => {
            if (conf.value == this.props.value) {
                color = conf.color;
                text = conf.label;
                return false;
            }
        });
        color = color.replace("background", "color");
        return <ReactCircleIconText color={color} text={text}/>
    }

    render() {
        return (
            <div className="react-radio-div">
                {this.createItem()}
            </div>
        );
    }
}

ReactSelect.defaultProps = {
    title: null,
    value: null,
    items: {},
    onClick: null,
    field: null,
    data: null,
    width: 84,
    level: null
}

export default ReactSelect;
