import React, {Component} from 'react';
import {
    ActionListener4MultiSelect,
    isEmptyObj,
    isFunction,
    isNullOrUndefined,
    PLEASE_SELECT_VALUE,
    sortFunc
} from "../custom/utils";

class MultiSelect extends Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
        this.parentOpen = React.createRef();
    }

    render() {
        let optionList = [], optionValueList = Object.keys(this.props.initData), sortOptionValueList = null;
        if (!isNullOrUndefined(this.props.sortFun) && isFunction(this.props.sortFun)) {
            sortOptionValueList = this.props.sortFun(optionValueList);
        } else {
            sortOptionValueList = optionValueList.sort(sortFunc);
        }
        let defaultSelectedValue = "", defaultSelectedKey = "", selectStyle = "iconfont icon-check-mark div-a-span02";
        for (let i = 0; i < sortOptionValueList.length; i++) {
            let _key = sortOptionValueList[i];
            let _value = this.props.initData[_key];
            selectStyle = "iconfont icon-check-mark div-a-span02";
            if (this.props.defaultValue.indexOf(_value) > -1) {
                defaultSelectedKey += defaultSelectedKey ? "," + _key : _key;
                defaultSelectedValue += defaultSelectedValue ? "," + _value : _value;
                selectStyle += " my-selected";
            }
            optionList.push(
                <a key={i} className="my-form-content-list-a" onClick={this.handleSelect(_value)}>
                    <span className="div-a-span01">{_key}</span>
                    <span className={selectStyle}></span>
                </a>);
        }
        this.props.initMultiSelectRefs[this.props.keyValue] = "MultiSelect_" + this.props.keyValue;
        let classValue = defaultSelectedKey ? "my-form-div2 my-form-div2-color " + this.props.borderClass : "my-form-div2 " + this.props.borderClass;
        classValue = this.props.required ? classValue + " required" : classValue;
        classValue = this.props.disabled ? classValue + " normal-color" : classValue + " disabled-color";
        let classNames = "my-form-div ";
        let vMsg = this.props.validateMsg || {};
        return (
            <div className={this.props.wrapClass}>
                <div className={classNames} ref={this.parentOpen}>
                    <div className={classValue} onClick={this.props.disabled ? this.handleDropMenu : null}>
                        <span className="my-form-div-span" id={this.props.keyValue} data-key={this.props.keyValue}
                              ref={this.inputRef}
                              value={defaultSelectedValue}>{defaultSelectedKey ? defaultSelectedKey : PLEASE_SELECT_VALUE}</span>
                        <span className="iconfont  icon-arrow_down float-right"></span>
                        {vMsg.showIcon && <i className={"multi-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                    </div>
                    <div className="my-form-content-list">
                        {optionList}
                    </div>
                    {vMsg.showIcon == "remove" && <small className="small-block">{vMsg.text}</small>}
                </div>
            </div>
        );
    }

    handleSelect(k) {
        return function (e) {
            if (this.props.defaultValue.indexOf(k) > -1) {
                this.props.defaultValue.splice(this.props.defaultValue.indexOf(k), 1);
            } else {
                this.props.defaultValue.push(k);
            }
            if (this.props.defaultValue.indexOf(PLEASE_SELECT_VALUE) != -1) {
                this.props.defaultValue.splice(this.props.defaultValue.indexOf(PLEASE_SELECT_VALUE), 1);
            }
            let selectedItem = this.inputRef.current;
            selectedItem.value = this.props.defaultValue;
            e.target = selectedItem;
            isEmptyObj(this.props.validator) ? this.props.handleSetValue(e) : ActionListener4MultiSelect(this.props.keyValue, this.props.validator, this.props.handleSetValue)(e);
            e.stopPropagation();
            if (isFunction(this.props.filterOnChange)) {
                this.props.filterOnChange(this.props.change);
            }
        }.bind(this);
    }

    handleDropMenu = (e) => {
        let parent = this.parentOpen.current;
        let rect = parent.getBoundingClientRect();
        parent.firstElementChild.nextSibling.style.width = rect.width + "px";
        parent.lastElementChild.style.top = rect.bottom + "px";
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
}


export default MultiSelect;