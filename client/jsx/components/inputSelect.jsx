import React, {Component} from 'react';
import {ActionListener, isEmpty, isEmptyObj, PLEASE_SELECT_VALUE,} from "../custom/utils";

class InputSelect extends Component {
    constructor(props) {
        super(props);
        this.disabled = this.props.disable
        this.inputRef = React.createRef();
        this.parentOpen = React.createRef();
    }

    render() {
        let optionList = [], selectStyle = null;
        this.props.enumValue.forEach(function (item, i) {
            selectStyle = "iconfont icon-check-mark div-a-span02";
            (this.props.defaultValue === item.value) && (selectStyle += " my-selected");
            optionList.push(
                <a key={i} className="my-form-content-list-a" id="form-list" onClick={this.handleSelect(item.value)}>
                    <span className="div-a-span01">{item.label}</span>
                    <span className={selectStyle}></span>
                </a>);
        }.bind(this))

        this.props.initMultiSelectRefs[this.props.keyValue] = "MultiSelect_" + this.props.keyValue;
        let divClassName = "my-form-div2 my-form-div2-color modal-border"
        divClassName = this.props.required ? divClassName + " required" : divClassName;
        divClassName = this.props.disabled ? divClassName + " disabled-color" : divClassName + " normal-color";
        let vMsg = this.props.validateMsg || {};
        return (
            <div className={this.props.wrapClass}>
                <div className="my-form-div modal-border" ref={this.parentOpen}>
                    <div className={divClassName} onClick={this.props.disabled ? null : this.handleDropMenu}>
                        <input className="my-form-div-span select inputSelect-control" id={this.props.keyValue}
                               name={this.props.keyValue} data-key={this.props.keyValue} ref={this.inputRef}
                               disabled={this.props.disabled}
                               placeholder={this.props.placeholder} onInput={this.handleInput.bind(this)}
                               onClick={e => e.stopPropagation()}></input>
                        {optionList.length > 0 && <span className={"iconfont  icon-arrow_down float-right"}
                                                        disabled={this.props.disabled}></span>}
                        {vMsg.showIcon && <i className={"multi-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                    </div>
                    <div className={"my-form-content-list"}>
                        {optionList}
                    </div>
                    {vMsg.showIcon == "remove" && <small className="small-block">{vMsg.text}</small>}
                </div>
            </div>
        );
    }

    handleInput(e) {
        isEmptyObj(this.props.validator) ? this.props.handleSetValue(e) : ActionListener(this.props.keyValue, this.props.validator, this.props.handleSetValue)(e);
        e.stopPropagation();
    }

    handleSelect(v) {
        return function (e) {
            let selectedItem = this.inputRef.current;
            selectedItem.value = selectedItem.value == v ? "" : v;
            this.parentOpen.current.classList.remove("my-open");
            e.target = selectedItem;
            isEmptyObj(this.props.validator) ? this.props.handleSetValue(e) : ActionListener(this.props.keyValue, this.props.validator, this.props.handleSetValue)(e);
            e.stopPropagation();
        }.bind(this);
    }


    getParentHeight = (elmId) => {
        let paelm = document.getElementById(elmId);
        if (!isEmpty(paelm)) {
            return paelm.height;
        } else {
            return document.body.clientHeight;
        }
    }


    handleDropMenu = (e) => {
        let parent = e.target.parentElement.parentElement;
        let rect = parent.firstElementChild.getBoundingClientRect();
        e.target.parentElement.nextSibling.style.width = rect.width + "px";
        e.target.parentElement.nextSibling.style.top = rect.bottom + "px";
        let documentHeight = document.body.clientHeight;
        let parentHeight = parent.offsetTop;
        let optionlistLength = e.target.parentElement.nextSibling.childNodes.length;
        if (documentHeight - rect.bottom < optionlistLength * 28) {
            e.target.parentElement.nextSibling.style.maxHeight = documentHeight - rect.bottom + "px";
        }

        let openEles = document.getElementsByClassName("my-open");

        for (let index = openEles.length - 1; index >= 0; index--) {
            if (openEles.item(index) != parent)
                openEles.item(index).classList.remove("my-open");
        }
        if (parent.classList.contains("my-open")) {
            parent.classList.remove("my-open");
        } else {
            parent.classList.add("my-open");
        }
        e.stopPropagation();
    }

    componentDidMount() {//only set one time
        this.inputRef.current.value = this.props.defaultValue == PLEASE_SELECT_VALUE ? "" : this.props.defaultValue;
    }
}


export default InputSelect;