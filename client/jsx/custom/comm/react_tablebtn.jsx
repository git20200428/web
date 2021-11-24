import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {collapseOthers, EditBtnState, isFunction} from "../utils";

/**
 * onClick
 * normalClass
 * disabledClass
 * label
 * rowData
 * enable ： EditBtnState.Normal || EditBtnState.Disabled || function(){ return EditBtnState.Normal || EditBtnState.Disabled; }
 */
export default class ReactTableEditButton extends Component {
    renderContentToDiv(event) {
        let {selectedData, tableHashCode, rowData, showDivId} = this.props;
        let {onClick, id} = this.props.conf;
        let content = onClick(rowData, tableHashCode, selectedData, true, event);
        let div = document.getElementById(showDivId);
        ReactDOM.render(content, div, function () { //渲染视图并显示
            div.classList.add("in");
            div.setAttribute("data-show-id", id);
        });
    }

    handleEditClickFun = (event) => {
        collapseOthers();
        const onClickFun = this.props.conf.onClick,
            data = this.props.rowData || {},
            selectedData = this.props.selectedData,
            tableHashCode = this.props.tableHashCode || "",
            attributes = this.props.attributes;
        if (isFunction(onClickFun)) {
            if (this.props.conf.type === "collapse") {
                let divId = this.props.showDivId,
                    div = document.getElementById(divId),
                    tgt = event.target.tagName === "A" ? event.target.firstElementChild : event.target,
                    trigger = "icon-" + this.props.conf.triggerClass,
                    normal = "icon-" + this.props.conf.normalClass;
                if (div.classList.contains("in")) {//collapse
                    div.classList.remove("in");
                    ReactDOM.unmountComponentAtNode(document.getElementById(divId));
                    if (this.props.conf.triggerClass != null) {
                        tgt.classList.remove(trigger);
                        tgt.classList.add(normal);
                    }
                } else {//expand
                    let list1 = document.querySelectorAll("table[data-table-id='" + tableHashCode + "'] tr.react-table-edit-row div.collapse.in");
                    for (let i = 0; i < list1.length; i++) {//collapse other expand div
                        list1[i].classList.remove("in");
                        ReactDOM.unmountComponentAtNode(document.getElementById(divId));
                    }
                    if (this.props.conf.triggerClass != null) {//
                        let list2 = document.querySelectorAll("table[data-table-id='" + tableHashCode + "'] i.icon-row_contract");
                        for (let i = 0; i < list2.length; i++) {
                            list2[i].classList.remove(trigger);
                            list2[i].classList.add(normal);
                        }
                        tgt.classList.remove(normal);
                        tgt.classList.add(trigger);
                    }
                    this.renderContentToDiv(event);
                }
            } else {
                onClickFun(data, tableHashCode, selectedData, attributes, true, event);
            }
        }
        event.stopPropagation();
    }

    renderButton = (conf, rowData) => {
        let enable = conf.enable;
        if (typeof enable == "function") {
            enable = enable(rowData);
        }
        if (enable === EditBtnState.Normal) {
            return (<a role="button" id={conf.id} title={conf.label}
                       onClick={this.handleEditClickFun}>
                <i className={"iconfont icon-" + conf.normalClass}/>
            </a>);
        } else if (enable === EditBtnState.Disabled) {
            return (<a role="button" id={conf.id} title={conf.label}>
                <i className={"iconfont icon-" + conf.normalClass + " disabled-color"}/>
            </a>);
        } else {
            return (
                <a id={conf.id} className="none"/>
            );
        }
    }

    handleExportDropMenu = (event) => {

        // const exportMenuParentDiv = event.target.parentElement.parentElement;
        // const exportMenuParentDiv1 = event.target.parentElement.parentElement.parentElement;
        // const exportDiv = document.getElementsByClassName("export-menu-div")[0];
        // const dropDiv = document.getElementsByClassName("dropdown-menu-div")[0];
        let aParent = event.target.parentElement, body = aParent.offsetParent,topPosition=0,
            aParentRect = aParent.getBoundingClientRect();
        if( body === null ) {
            return;
        }
        let bodyRect = body.getBoundingClientRect();
        topPosition = aParentRect.bottom;
        if(bodyRect.bottom - aParentRect.bottom < 55){
            topPosition = aParentRect.top - 55;
        }
        event.target.nextSibling.style.top = topPosition + "px";
        if (aParent.classList.contains("my-open")) {
            collapseOthers();
            aParent.classList.remove("my-open");
        } else {
            collapseOthers();
            aParent.classList.add("my-open");
            if (this.props.rowData.hasOwnProperty("state") && this.props.rowData["state"] === "closed") {
                if (aParent.classList.contains("my-expand")) {
                    aParent.classList.remove("my-expand");
                }
                // if(exportMenuParentDiv1.classList.contains("my-expand")){
                //     exportMenuParentDiv1.classList.remove("my-expand");
                // }
            } else if (this.props.rowData.hasOwnProperty("state") && this.props.rowData["state"] === "open") {
                // exportMenuParentDiv1.classList.add("my-expand");
                aParent.classList.add("my-expand");
            }
        }
        event.stopPropagation();
    }

    handleClickFun = (conf, event) => {
        collapseOthers();
        const onClickFun = conf.onClick,
            data = this.props.rowData || {},
            selectedData = this.props.selectedData,
            tableHashCode = this.props.tableHashCode || "",
            attributes = this.props.attributes;
        onClickFun(data, tableHashCode, selectedData, attributes, true, event);
    }

    render() {
        if (this.props.conf instanceof Array) {
            let options = [];
            this.props.conf.forEach((item, index) => {
                options.push(<a className="export-menu-file-a" key={this.props.keyName + index}
                                onClick={this.handleClickFun.bind(this, item)}>{item.label}</a>)
            });
            return (<span role="button" className="relative-position" key={this.props.keyName + "_span"}
                          title={this.props.conf[0].buttonLabel} onClick={this.handleExportDropMenu}>
                <i className={"iconfont icon-" + this.props.conf[0].normalClass}/>
                <div className="dropdown-menu-div">
                    {options}
                </div>
            </span>);

        } else {
            return this.renderButton(this.props.conf, this.props.rowData);
        }
    }

}
