import React, {Component} from 'react';
import {confirmToast, editCommit, getText, isFunction, isNullOrUndefined} from "../utils";
import ReactCircleIconText from "./react_circle_text";
import {getRequestKeys} from "../../yangMapping";
import {MyReactEvents} from "../message_util";

class ReactSwitchButton extends Component {

    handleOnClick(currentVal) {
        return function (event) {
            event.stopPropagation();
            let state = !(currentVal == this.props.items[true].value);
            let val = this.props.items[state].value;
            if (isFunction(this.props.onClick)) {
                this.props.onClick(val, this.props);
            }
            if (!isNullOrUndefined(this.props.saveParameters)) {
                confirmToast(getText("confirm_to_change_value").format(getText(this.props.saveParameters.setKey), val), function () {
                    let setObj = {};
                    setObj[this.props.saveParameters.setKey] = val;
                    let _edit = {
                        "edit": {
                            "set": setObj,
                            "from": this.props.saveParameters.from,
                            "where": getRequestKeys(this.props.saveParameters.from, this.props.saveParameters.initKeyData)
                        }
                    }
                    let refreshEvent = this.props.eventType.format(this.props.hashCode);
                    editCommit(_edit, function () {
                        // callbackRefresh();
                        setTimeout(function () {
                            MyReactEvents.emitEvent(refreshEvent);
                        }, 1000);
                    });
                }.bind(this))
            }
        }.bind(this)
    }

    createButton(color, val) {
        return (
            <button role="button" className={"react-switch-btn " + color} onClick={this.handleOnClick(val)}
                    title={getText("click_change")}/>
        );
    }

    createText(text) {
        if (isNullOrUndefined(text)) {
            return;
        }
        return <span className="react-table-td-span-font">{text}</span>
    }

    createItem() {
        let itemList = [];
        Object.keys(this.props.items).map(key => {
            let conf = this.props.items[key];
            if (conf.value == this.props.value) {
                itemList.push(
                    <div className="react-table-td-span react-radio-item" key={key}>
                        {this.createButton(conf.color, conf.value)}
                        {this.createText(conf.label)}
                    </div>
                );
            }
        });

        return itemList;
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

ReactSwitchButton.defaultProps = {
    title: null,
    value: null,
    items: {},
    onClick: null,
    field: null,
    data: null,
    width: 84,
    level: null
};

export default ReactSwitchButton;
