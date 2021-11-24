import React, {Component} from 'react';
import {ActionListener} from "../custom/utils";

class CheckboxPwd extends Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
        this.parentOpen = React.createRef();
        this.state = {
            checkedPwd: false,
            changedFlag: false,
            password: ""
        };
    }

    handleOnChange = (event, vo) => {
        this.setState({
            password: event.target.value,
            changedFlag: true
        });
        this.props.onChange(event, vo);
    }

    handleCheckbox = () => {
        this.setState({
            checkedPwd: !this.state.checkedPwd
        });
        this.props.handleRemovedParams(this.props.idForPwd, !this.state.checkedPwd);
    }

    componentDidMount() {
        this.props.handleRemovedParams(this.props.idForPwd);
    }

    render() {
        let vMsg = this.props.validateMsg || {};
        let dataKeyForPsw = this.props.dataKeyForPwd || "";
        return (
            <div className={this.props.classNameForPwd}>
                {
                    <input className={this.props.required ? "form-control required" : "form-control"}
                           type="password"
                           id={this.props.idForPwd}
                           name={this.props.nameForPwd}
                           data-key={this.props.dataKeyForPwd}
                           disabled={!this.state.checkedPwd}
                           value={this.state.password}
                           placeholder={this.props.placeholder}
                           onChange={this.props.validatorState ? ActionListener(this.props.dataKeyForPwd, this.props.validator, this.handleOnChange) : this.handleOnChange}/>

                }
                {vMsg.showIcon && <i className={"icon-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                {vMsg.showIcon === "remove" && <small className="help-block-time-slot">{vMsg.text}</small>}
                <div className="pwd-checkbox">
                    <input type="checkbox" style={{verticalAlign: "middle"}} disabled={this.props.disabled}
                           checked={this.state.checkedPwd} onChange={this.handleCheckbox}/>
                    {dataKeyForPsw === "db-passphrase"  &&  <span>Check to override global db-passphrase option</span>}
                    {dataKeyForPsw !== "db-passphrase"  &&  <span>Select to set new key/password</span>}
                </div>
            </div>
        );
    }

}


export default CheckboxPwd;