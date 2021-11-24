import {
    collapseOthers,
    getHelpUrl,
    getMappingHelpString,
    getText,
    getYang,
    requestJson
} from "../custom/utils";
import ReactDOM from 'react-dom';
import React, {Component} from "react";
import {ModalConfigConstant, ReactReduxModalAlert} from "../custom/modal/react_modal";
let ModalAlertType = ModalConfigConstant.ModalAlertType;

export const cliView = function () {
    if (document.getElementById("dialog_div") != null) {
        return;
    }

    ReactDOM.render(<CliComponent alertType={ModalAlertType.Edit}/>,document.getElementById("additionalContent3"))

}

class CliComponent extends Component{

    constructor(props) {
        super(props);
        this.reactModelFormRef = React.createRef();
        this.myRef = React.createRef();
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    handlerOnClose = () => {
        try {
            let r_node = ReactDOM.findDOMNode(this);
            ReactDOM.unmountComponentAtNode(r_node.parentNode);
        } catch (error) {
            console.error(error);
        }
    }

    handleMouseDown = (e) => {
        let osmall = this.myRef.current.parentNode.parentNode;
        osmall.startX = e.clientX - osmall.offsetLeft;
        osmall.startY = e.clientY - osmall.offsetTop;
        osmall.style.cursor = "move";
        document.onmousemove = function (e) {
            osmall.style.left = e.clientX - osmall.startX + "px";
            osmall.style.top = e.clientY - osmall.startY + "px";
            let x = window.offsetWidth - osmall.offsetWidth - 1;
            let y = window.offsetHeight - osmall.offsetHeight - 1;
            if (e.clientX - osmall.startX <= 0) {
                osmall.style.left = 0 + "px";
            }
            if (e.clientY - osmall.startY <= 0) {
                osmall.style.top = 0 + "px";
            }
            if (e.clientX - osmall.startX >= x) {
                osmall.style.left = x + "px";
            }
            if (e.clientY - osmall.startY >= y) {
                osmall.style.top = y + "px";
            }
        };
        document.onmouseup = function () {
            osmall.style.cursor = "default";
            document.onmousemove = null;
            document.onmouseup = null;
        };
    }

    render() {
        let showTitle = getText("cli-command")
        let contentCss = "react-modal-dialog-content react-modal-dialog-content-adjust-padding";
        let modalContentCss = "react-modal-content"
        let helpString = getMappingHelpString("cli-command");
        return (
                <div className="react-modal-dialog-wrapper react-modal-dialog-wrapper-padding" onClick={this.actionClick}>
                    <div className="react-modal-dialog-item react-modal-dialog-title" ref={this.myRef}
                         onMouseDown={e => this.handleMouseDown(e)}>
                        <div>
                            {helpString ?
                                <a href={`/webgui_help/${getHelpUrl(helpString)}`} target="_webgui_help">
                                    <span className="iconfont icon-question"/>
                                </a>
                                : ""}
                            <span className="iconfont icon-close" onClick={this.handlerOnClose}/>
                        </div>
                        <span>{showTitle}</span>
                    </div>
                    <div className={"react-modal-dialog-item " + contentCss} onScroll={e => this.getScroll(e)}>
                        <div className={modalContentCss}>
                            <div name='dialog_div' id='dialog_div'></div>
                        </div>
                    </div>
                </div>
        );
    }

    componentDidMount() {
        let parent = ReactDOM.findDOMNode(this).parentNode;
        parent.classList.add("modal-parent2");
        this.create();
        this.myRef.current.parentNode.parentNode.style.top = (document.body.offsetHeight - this.myRef.current.parentNode.offsetHeight) + "px";
        this.myRef.current.parentNode.parentNode.style.left = (document.body.offsetWidth - this.myRef.current.parentNode.offsetWidth) + "px";
        document.getElementsByName("command_input_text")[0].focus()
    }

    getScroll = (e) => {
        collapseOthers();
        e.stopPropagation();
    }


    create() {
        let _dialogDiv = document.getElementById("dialog_div");

        let _table = document.createElement("table");
        _table.className = "dialog_table";

        let _tr1 = document.createElement("tr");
        let _yang = getYang("rpc")["cli-command"]["input"];
        let componentTotal = 1;
        addSelect(_tr1, "source",
            [{label: "commands", value: "commands", selected: true},
                {label: "script-file", value: "script-file"}]
            , {height: "22px"}, _yang.source.description)

        for (let _key in _yang) {
            if (_key == "source") {
                continue;
            }
            componentTotal++;
            if (_yang[_key].hasOwnProperty("enum-value")) {
                let _enums = _yang[_key]["enum-value"];
                let _options = []
                for (let i = 0; i < _enums.length; i++) {
                    let v = Object.keys(_enums[i])[0];
                    let _obj = {
                        label: v,
                        value: v
                    }
                    if (_yang[_key].default == _enums[i]) {
                        _obj.selected = true;
                    }
                    _options.push(_obj)
                }
                addSelect(_tr1, _key, _options, {height: "22px"}, _yang[_key].description)
            } else if (_yang[_key].type == "boolean") {
                let _enums = ["true", "false"];
                let _options = []
                for (let i = 0; i < _enums.length; i++) {
                    let _obj = {
                        label: _enums[i],
                        value: _enums[i]
                    }
                    if (_yang[_key].default == _enums[i]) {
                        _obj.selected = true;
                    }
                    _options.push(_obj)
                }
                addSelect(_tr1, _key, _options, {height: "22px"}, _yang[_key].description)
            } else {
                addText(_tr1, _key, {height: "22px"}, _yang[_key].description)
            }
        }

        _table.appendChild(_tr1);

        let _tr2 = document.createElement("tr");
        let _td21 = document.createElement("td");
        _td21.setAttribute("colspan", componentTotal * 2);
        let _textarea = document.createElement("textarea");
        _textarea.className = "dialog_textarea";
        _textarea.readOnly = true;
        _td21.appendChild(_textarea);
        _tr2.appendChild(_td21);
        _table.appendChild(_tr2);

        let _tr3 = document.createElement("tr");
        let _td31 = document.createElement("td");
        _td31.setAttribute("colspan", componentTotal * 2);
        let elem2 = document.createElement("input");
        elem2.type = "text";
        elem2.name = "command_input_text";
        elem2.className = "dialog_component";
        elem2.style.width = "100%";
        _td31.appendChild(elem2);
        _tr3.appendChild(_td31);
        _table.appendChild(_tr3);


        elem2.onkeypress = function (event) {
            if (event.keyCode == 13) {
                if (elem2.value.trim() == "") {
                    return;
                }
                _textarea.value = "waiting..."
                let components = document.getElementsByClassName("dialog_component")
                let requestKey = {};
                for (let i = 0; i < components.length; i++) {
                    if (components[i].value.trim() == "") {
                        continue;
                    }
                    if (components[i].name == "source") {
                        requestKey[components[i].value] = elem2.value.trim();
                    }
                    if (components[i].name != "source" && components[i].name != "command_input_text") {
                        requestKey[components[i].name] = components[i].value;
                    }
                }
                requestJson({
                    "rpc": {
                        "cli-command": requestKey
                    }
                }, function (_data) {
                    if (_data.hasOwnProperty("data") && _data.data.length > 0) {
                        if( _data.data[0].result.replaceAll("\\n","").trim().startsWith(requestKey["commands"] +"ERROR ") ) {
                            //commands error
                        } else {
                            elem2.value = ""
                        }
                        _textarea.value = _data.data[0].result.replaceAll("\\[1;4m", "").replaceAll("\\[0m", "");
                    } else {
                        _textarea.value = "";
                    }
                },function(err) {
                    _textarea.value = "";
                })
            }
        }

        _dialogDiv.appendChild(_table);
        return _dialogDiv;
    }
}

function addSelect(parentObj, type, options, css, title) {
    let _tdTitle = document.createElement("td");
    _tdTitle.innerHTML = getText(type) + ":";
    _tdTitle.title = title;
    parentObj.appendChild(_tdTitle);
    let _td = document.createElement("td");
    if (css != null) {
        if (css.hasOwnProperty("width")) {
            _td.style.width = css.width;
        }
        if (css.hasOwnProperty("height")) {
            _td.style.height = css.height;
        }
    }
    let elem = document.createElement("select");
    elem.name = type;
    elem.className = "dialog_component";
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        let _option = new Option(option.label, option.value);
        if (option.selected || (type === "error-option" && option.value === "continue-on-error")) {
            _option.setAttribute("selected", "true");
        }
        elem.options.add(_option);
    }
    if( type === "error-option" || type === "replace" ) {
        elem.addEventListener("change", function (event) {
            if( type === "error-option" && event.target.value === "rollback-on-error" ) {
                document.getElementsByName("replace")[0].value = "true";
            }
            if( type === "replace" ) {
                if( event.target.value === "false" ) {
                    document.getElementsByName("error-option")[0].value = "continue-on-error";
                } else {
                    document.getElementsByName("error-option")[0].value = "rollback-on-error";
                }
            }
        })
    }
    _td.appendChild(elem);
    parentObj.appendChild(_td);
}

function addText(parentObj, type, css) {
    let _tdTitle = document.createElement("td");
    _tdTitle.innerHTML = getText(type) + ":";
    parentObj.appendChild(_tdTitle);
    let _td = document.createElement("td");
    if (css != null) {
        if (css.hasOwnProperty("width")) {
            _td.style.width = css.width;
        }
        if (css.hasOwnProperty("height")) {
            _td.style.height = css.height;
        }
    }
    let elem = document.createElement("input");
    elem.type = "text";
    elem.name = type;
    elem.className = "dialog_component";
    elem.style.width = "100%";
    _td.appendChild(elem);
    parentObj.appendChild(_td);
}
