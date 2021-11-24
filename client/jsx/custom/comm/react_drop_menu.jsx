import React, {Component} from "react";
import {collapseOthers, getText, isFunction} from "../utils";

class DropMenuButton extends Component {
    constructor(props) {
        super(props);
    }

    handleExportDropMenu = (e) => {
        let parent = e.target.parentElement;
        let realParent = parent.classList.contains("export-menu-parent-div") ? parent : parent.parentElement;
        let contentDiv = realParent.lastElementChild;
        let rect = realParent.getBoundingClientRect();
        contentDiv.style.top = rect.bottom + "px";
        contentDiv.style.right = window.innerWidth - rect.right + "px";
        if (!realParent.classList.contains("my-open")) {
            collapseOthers();
            realParent.classList.add("my-open")
        } else {
            collapseOthers();
            realParent.classList.remove("my-open");
        }
        e.stopPropagation();
    }

    createItemMenu = (item, idx, tools, initDate, showDate, pageInfo, tableConfig) => {
        let disabled = false;
        if (item.enabled != null && !item.enabled) {
            disabled = true;
        }
        if (isFunction(item.enabled) && !item.enabled(initDate)) {
            disabled = true;
        }
        if (!disabled) {
            tools.push(<a className="export-menu-file-a" key={idx}
                          onClick={item.clickFunction.bind(this, initDate, showDate, pageInfo.getSelectedData(), tableConfig)}>{getText(item.label)}</a>)
        } else {
            tools.push(<a className="export-menu-file-a chassis-view-menu-item-disabled"
                          key={idx}>{getText(item.label)}</a>)
        }
    }

    render() {
        let tableConfig = this.props.tableConfig;
        let items = this.props.item;
        let tools = [];
        let pageInfo = this.props.pageInfo;
        let showDate = pageInfo.getShowData();
        let initDate = pageInfo.initData;
        items.forEach((item, idx) => {
            if (item instanceof Array) {
                item.forEach((subItem, idx2) => {
                    if (subItem.buttonLabel != null) {
                        subItem.label = subItem.buttonLabel + "-" + subItem.label
                    }
                    this.createItemMenu(subItem, idx + "_" + idx2, tools, initDate, showDate, pageInfo, tableConfig);
                })
            } else {
                this.createItemMenu(item, idx, tools, initDate, showDate, pageInfo, tableConfig);
            }
        })
        let menuList = <div className="export-menu-div">{tools}</div>
        let _label = getText(items[0].buttonLabel);
        if (this.props.type === 0) {
            return (<div className="export-menu-parent-div">
                <span title={getText("tools")} className="iconfont icon-tool"
                      onClick={this.handleExportDropMenu}/>
                {menuList}
            </div>)
        } else if (this.props.type === 1) {
            return (<div className="export-menu-parent-div">
                <span title={getText("export")} className="iconfont icon-export"
                      onClick={this.handleExportDropMenu}/>
                {menuList}
            </div>)
        } else {
            return (<span className="export-menu-span export-menu-parent-div">
                <a title={_label} className="export-menu-a" onClick={this.handleExportDropMenu}>
                        {_label}
                    <span className="iconfont icon-arrow_down float-right-2"/>
                    </a>
                {menuList}
                </span>)
        }
    }
}

export default DropMenuButton;