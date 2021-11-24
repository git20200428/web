import React, {Component} from "react";
import ReactDOM from "react-dom";
import "./modal.css";
import "../../../font/iconfont.css";

export const DialogType = {
    WARNING: "warning",
    ERROR: "error",
    SUCCESS: "success",
    QUESTION: "question",
    INFO: "information"
}

export default class MessageModalDialog extends Component {
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
        this.props.config.message = this.props.config.message.slice(this.props.config.message.indexOf("result:")+7,this.props.config.message.length);
        this.props.config.message  = this.props.config.message .replaceAll("1;4m", "").replaceAll("0m", "");
        return (
            <div className="modal-dialog-container">
                <div className="message-modal-dialog-wrapper2">
                    <div className="modal-dialog-item modal-dialog-header" ref={this.myRef}
                         onMouseDown={e => this.handleMouseDown(e)}>
                        <span>{this.props.config.title}</span>
                        <i className={`iconfont icon-${this.props.config.type}`}/>
                        <span className="iconfont icon-close"
                              onClick={() => this.handleBtnClick(this.props.config.onClose)}/>
                    </div>
                    <div className="modal-dialog-item message-modal-dialog-content2">

                        <div className="message-content2">
                            {this.props.config.message.split("\\n").map((item, idx) =>
                                <p key={idx} className="message" dangerouslySetInnerHTML={{__html: item}}/>
                            )}
                        </div>
                    </div>
                </div>
            </div>);
    }
}

MessageModalDialog.defaultProps = {
    config: {
        type: "warning",
        title: "",
        message: "",
        btn: []
    },
    autoClose: false
};