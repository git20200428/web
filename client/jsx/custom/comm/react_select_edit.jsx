import React, {Component} from "react";
import {closestDom, confirmToast, editCommit, getText, isEmptyObj, isNullOrUndefined} from "../utils";
import {getRequestKeys} from "../../yangMapping";
import {MyReactEvents} from "../message_util";

class ReactSelectEditButton extends Component {
    constructor(props) {
        super(props);
        this.defaultEnums = {
            "lock": {
                label: "lock",
                value: "lock",
                color: "background_red"
            },
            "unlock": {
                label: "unlock",
                value: "unlock",
                color: "background_green"
            },
            "maintenance": {
                label: "maintenance",
                value: "maintenance",
                color: "background_blue"
            },
        };
    }

    handleOnClick() {
        function find(element, filter) {
            if (element.children.length > 0) {
                for (let i = 0; i < element.children.length; ++i) {
                    if ((element.children[i].localName === filter) ||
                        (element.children[i].className.match(filter))) {
                        return element.children[i];
                    }
                }

                for (let i = 0; i < element.children.length; ++i) {
                    let node = find(element.children[i], filter);
                    if (node) return node;
                }
            }
        }

        return event => {
            event.stopPropagation();
            let enums = isEmptyObj(this.props.items) ? this.defaultEnums : this.props.items;
            let div = closestDom(event.target, "td").firstElementChild;
            let obj = event.target;
            let selectValue = obj.value;
            let spanDiv = div.firstChild;
            let orgianCom = spanDiv.firstChild;
            let removeInput = function (data) {
                let enumValues = Object.values(enums);
                for (let x = 0; x < enumValues.length; ++x) {
                    let v = enumValues[x];
                    if (v.value === data) {
                        let b = find(orgianCom, "react-switch-btn");
                        b.className = "react-switch-btn " + v.color;
                        b = find(orgianCom, "react-table-td-span-font");
                        b.innerHTML = v.label;
                        obj.nodeValue = v.value;
                        break;
                    }
                }
                div.removeChild(div.firstChild);
                div.appendChild(spanDiv);
            };
            let showInput = () => {
                div.removeChild(div.firstChild);
                let input = document.createElement("select");
                input.className = "react-select table-edit-cell-input height20";
                let inputSpanCancel = document.createElement("span");
                inputSpanCancel.className = "iconfont icon-remove ";
                Object.values(enums).map(v => {
                    let option = new Option(v.label, v.value);
                    if (v.value === selectValue) option.selected = selectValue;
                    input.options.add(option);
                });
                let inputDiv = document.createElement("div");
                inputDiv.className = "input-group  table-edit-cell-input-div";
                inputDiv.appendChild(input);
                let inputSpan = document.createElement("span");
                inputSpan.className = "input-group-addon paddingTop3";
                inputSpan.appendChild(inputSpanCancel);
                div.appendChild(inputDiv);
                inputDiv.appendChild(inputSpan);
                let callbackRefresh = function () {
                    removeInput(input.value);
                }
                input.addEventListener("change", () => {
                    let selectValueTmp = input.value;
                    confirmToast(getText("confirm_to_change_value").format(getText(this.props.saveParameters.setKey), selectValueTmp), () => {
                        if (this.props.saveFun != null) {
                            this.props.saveFun(input.value, this.props.data, this.props.hashCode, function () {
                                selectValue = input.value;
                                callbackRefresh();
                            }, function () {
                                removeInput(selectValue);
                            })
                        } else if (this.props.saveParameters != null) {
                            /** the saveParameters define, e.g.
                             *  {
                                        "setKey"        : "admin-state,
                                        "from"          : "card",
                                        "initKeyData"   : {
                                                             card : { name : "1-1" }
                                                          }
                                     }
                             */
                            let setObj = {};
                            setObj[this.props.saveParameters.setKey] = selectValueTmp;
                            let _edit = {
                                "edit": {
                                    "set": setObj,
                                    "from": this.props.saveParameters.from,
                                    "where": getRequestKeys(this.props.saveParameters.from, this.props.saveParameters.initKeyData)
                                }
                            }
                            let refreshEvent = this.props.eventType.format(this.props.hashCode);
                            editCommit(_edit, function () {
                                selectValue = selectValueTmp;
                                callbackRefresh();
                                setTimeout(function () {
                                    MyReactEvents.emitEvent(refreshEvent);
                                }, 1000);
                            }, function () {
                                removeInput(selectValue);
                            });
                        } else {
                            alert("error,please implement save function!")
                        }
                    }, function () {
                        removeInput(selectValue);
                    })
                });
                inputSpanCancel.addEventListener("click", function () {
                    removeInput(selectValue);
                });
            };
            showInput();
        };
    }

    createButton(color, val) {
        return (
            <button role="button" className={"react-switch-btn " + color} value={val}
                    onClick={this.props.enabled == false ? null : this.handleOnClick()} title="Switch Button"/>
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
        let enums;
        if (isEmptyObj(this.props.items)) {
            enums = this.defaultEnums;
        } else {
            enums = this.props.items;
        }
        Object.keys(enums).map(key => {
            let conf = enums[key];
            if (conf.value == this.props.value) {
                itemList.push(
                    <div key={key} className="react-table-td-span react-radio-item">
                        {this.createButton(conf.color, conf.value)}
                        {this.createText(conf.label)}
                    </div>
                );
            }
        });
        return itemList;
    }

    render() {
        return (
            <div className="react-radio-div">
                {this.createItem()}
            </div>
        );
    }
}

ReactSelectEditButton.defaultProps = {
    title: null,
    value: null, //当前选中的值
    items: {}, //枚举项
    onClick: null, //点击事件
    field: null,
    data: null, //data数据
    saveParameters: null,
    width: 84,
    level: null,
    saveFun: null,
};

export default ReactSelectEditButton;
