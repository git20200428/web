import React, {Component} from "react";
import ReactDOM from "react-dom";
import "./modal.css";
import "../../../font/iconfont.css";
import {getHelpUrl, getMappingHelpString} from "../../custom/utils";

export const DialogType = {
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
    QUESTION: "question",
    INFO: "information"
}

export default class ModalDialog extends Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    handleMouseDown = (e) => {
        let obig = this.myRef.current.parentNode.parentNode;
        let osmall = this.myRef.current.parentNode;
        osmall.startX = e.clientX - osmall.offsetLeft;
        osmall.startY = e.clientY - osmall.offsetTop;
        osmall.style.cursor = "move";
        document.onmousemove = function (e) {
            osmall.style.left = e.clientX - osmall.startX + "px";
            osmall.style.top = e.clientY - osmall.startY + "px";
            let x = obig.offsetWidth - osmall.offsetWidth - 1;
            let y = obig.offsetHeight - osmall.offsetHeight - 1;
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
    componentDidMount = () => {
        ReactDOM.findDOMNode(this).parentElement.style.opacity = "1";
        if (this.props.config.autoClose) {
            setTimeout(() => {
                this.handleBtnClick(this.props.config.onClose);
            }, 1000);
        }
        this.myRef.current.parentNode.style.top = (this.myRef.current.parentNode.parentNode.offsetHeight - this.myRef.current.parentNode.offsetHeight) / 2 + "px";
        this.myRef.current.parentNode.style.left = (this.myRef.current.parentNode.parentNode.offsetWidth - this.myRef.current.parentNode.offsetWidth) / 2 + "px";

    }

    handleBtnClick = func => {
        typeof func === "function" && func();
        ReactDOM.findDOMNode(this).parentElement.style.opacity = "0";
        setTimeout(() => {
            ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this).parentElement);
        }, 1000);
    }

    render() {
        let helpString = getMappingHelpString(this.props.config.helpString);
        return (
            <div className="modal-dialog-container">
                <div className="modal-dialog-wrapper">
                    <div className="modal-dialog-item modal-dialog-header" ref={this.myRef}
                         onMouseDown={e => this.handleMouseDown(e)}>
                        <span>{this.props.config.title}</span>
                        <div>
                            {helpString ?
                                <a href={`/webgui_help/${getHelpUrl(helpString)}`} target="_webgui_help">
                                    <span className="iconfont icon-question"/>
                                </a>
                                : ""}
                            <span className="iconfont icon-close"
                                  onClick={() => this.handleBtnClick(this.props.config.onClose)}/>
                        </div>
                    </div>
                    <div className="modal-dialog-item modal-dialog-content">
                        <i className={`iconfont icon-${this.props.config.type}`}/>
                        <div>
                            {this.props.config.message.split("<br>").map((item, idx) =>
                                <p key={idx} className="message" dangerouslySetInnerHTML={{__html: item}}/>
                            )}
                        </div>
                    </div>
                    <div className="modal-dialog-item modal-dialog-footer">
                        {this.props.config.btn.map(item => <button key={item.label}
                                                                   onClick={() => this.handleBtnClick(item.onClick)}>{item.label}</button>)}
                    </div>
                </div>
            </div>);
    }
}

ModalDialog.defaultProps = {
    config: {
        type: "warning",
        title: "",
        message: "",
        btn: []
    },
    autoClose: false
};