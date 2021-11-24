import React, {Component} from 'react';
import ReactDOM from "react-dom";
import {Provider,useSelector} from "react-redux";
import {
    ActionListener,
    collapseOthers,
    ControlStateEnum,
    deepClone,
    DisabledState,
    extendCustomConfig,
    getHelpUrl,
    getMappingHelpString,
    getText,
    icons,
    isEmpty,
    isEmptyObj, isFunction,
    isNullOrUndefined,
    parseWhenAction,
    parseYangParameterAction,
    PLEASE_SELECT_VALUE,
    removeArrayItem,
    sortFunc,
    uniqueArray,
    validate
} from "../utils";
import imgWait from "../../../img/waiting.gif";
import {FormControlTypeEnum, YangUserGroupDefine} from "../../yang_user_define";
import ReactTimeslot from "../tribslot/react_timeslot";
import ReactOpucnTimeslot from "../tribslot/react_opucn_timeslot";
import "./react_modal.css";
import "../../../font/iconfont.css";

import MultiSelect from "../../components/multiSelect";
import ToolTip from "../../components/tooltip/Tooltip";
import InputSelect from "../../components/inputSelect";
import CheckboxPwd from "../../components/checkboxPassword";
import store from "../../redux/store";


let ModalConfigConstant = {
    ModalBodyTypeEnum: {
        Form: 1,
        Message: 2,
        Custom: 3
    },
    ModalButtonTypeEnum: {
        Ok: 1,
        Yes: 2,
        No: 3,
        Refresh: 4,
        Apply: 5,
        Redirect: 6
    },
    ModalAlertType: {
        Create: 1,
        Edit: 2,
        FC_TOPO: 3
    },
    HeadShowType: {
        Normal: 1,
        Multiple: 2
    }
};

let DefaultModalConfig = {
    dragEnable: true,
    head: {
        title: "Dialog",
        closeFunction: function () {
        }
    },
    body: {
        bodyContentType: null,
        bodyContentMessage: ""
    },
    foot: {
        show: true,
        buttons: []
    }

};

const ReactReduxModalAlert = (props) => {
    const ne = useSelector(state => state.neinfo.ne);
    return <ReactModalAlert {...props} neData={ne}/>
}

class ReactModalAlert extends Component {

    constructor(props) {
        super(props);
        this.state = {
            modalConfig: isNullOrUndefined(this.props.modalConfig) ? DefaultModalConfig : extendCustomConfig(DefaultModalConfig, this.props.modalConfig),
            formData: this.props.formData,
            validateMsg: {}
        };
        this.validator = null;
        this.removedParams = {};
        this.reactModelFormRef = React.createRef();
        this.myRef = React.createRef();
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    handlerOnClose = () => {
        this.state.modalConfig.head.closeFunction();
        try {
            let r_node = ReactDOM.findDOMNode(this);
            ReactDOM.unmountComponentAtNode(r_node.parentNode);
        } catch (error) {
            console.error(error);
        }
    }

    handleRemovedParams = (key, val) => {
        if (val) {
            if(key==="db-passphrase"){
                delete this.validator.fields["db-passphrase"].validators.notRequired;
            }
            delete this.removedParams[key];
        } else {
            this.removedParams[key] = "";
        }
        this.props.controlConfig[key].commitEnable = val;
    }

    handleOkButtonClick(fun, type) {
        return () => {
            let controlConfig = null;
            let _formData = null;
            if (type === ModalConfigConstant.ModalButtonTypeEnum.Refresh) {
                fun(this.refreshNewData)
                return;
            }
            if (this.props.modalConfig.body.bodyContentType === ModalConfigConstant.ModalBodyTypeEnum.Form) {
                controlConfig = this.props.controlConfig;

                let origData = deepClone(this.state.formData)
                if (!isEmptyObj(this.removedParams)) {
                    Object.keys(this.removedParams).forEach(key => {
                        delete origData[key];
                    })
                }
                _formData = deepClone(origData);
                let _formData2 = deepClone(origData);
                let validator = deepClone(DefaultFormValidator);
                Object.keys(_formData).map(prop => {
                    if (!isEmptyObj(controlConfig[prop])) {
                        if (controlConfig[prop].hasOwnProperty("validators") && !isEmptyObj(controlConfig[prop].validators)) {
                            validator.fields[prop] = {
                                "validators": controlConfig[prop].validators
                            };
                        }
                        if (controlConfig[prop].commitEnable === false) {
                            delete _formData[prop];
                            delete _formData2[prop];
                        }
                        if (controlConfig[prop].type == FormControlTypeEnum.Select && (controlConfig[prop].mandatory != "true" && controlConfig[prop].mandatory!=true)) {
                            delete _formData2[prop];
                        }
                    }
                });
                if (this.validator) {
                    let vob = validate(_formData2, this.validator);
                    Object.keys(vob.validateMsg).forEach(key => {
                        this.state.validateMsg[key] = vob.validateMsg[key];
                    });
                    this.setState({...this.state});
                    if (!vob.validateMsg.pass) {
                        return false;
                    }
                }
            }

            if (type != ModalConfigConstant.ModalButtonTypeEnum.No && this.props.alertType != ModalConfigConstant.ModalAlertType.Delete) {
                // this.setWaitingState();
                fun(_formData, this.handlerOnClose);
            } else {
                // this.setWaitingState();
                fun(_formData);
                this.handlerOnClose();
            }
        };
    }

    // setWaitingState() {
    //     if (document.getElementById("modal_btn_ok") != null) {
    //         document.getElementById("modal_btn_ok").disabled = "disabled";
    //         document.getElementById("modal_btn_ok").className += " btn_disabled"
    //     }
    //     if (document.getElementsByClassName("loading_icon").length > 0) {
    //         document.getElementsByClassName("loading_icon")[0].style.display = "block";
    //     }
    // }

    handleSetValue = (event, vo) => {
        let control = event.target;
        let formData = this.state.formData;
        let data_id = control.getAttribute("data-key");
        let data_value = (control.value != null) ? control.value : control.getAttribute("value");
        if (control.type === "checkbox") {
            let array = formData[data_id];
            if (!(array instanceof Array)) {
                array = array.split(" ");
            }
            if (control.checked) {
                if (array.indexOf(data_value) === -1) array.push(data_value);
            } else {
                removeArrayItem(array, data_value);
            }
            formData[data_id] = array;
        } else if (control.type === "select-multiple") {
            // let text = control.parentElement.
            data_value = [];
            for (let i = 0; i < control.options.length; i++) {
                if (control.options[i].selected) {
                    data_value.push(control.options[i].value);
                }
            }
            formData[data_id] = data_value;
        } else if (control.type === "datetime-local" && control.name === "datetimezone") {
            let timezone = null;
            if (!isNullOrUndefined(formData["new-time"])) {
                if (formData["new-time"].indexOf("Z") != -1) {
                    timezone = formData["new-time"].substr(formData["new-time"].indexOf("Z"), formData["new-time"].length);
                } else if (formData["new-time"].indexOf("+") != -1) {
                    timezone = formData["new-time"].substr(formData["new-time"].indexOf("+"), formData["new-time"].length);
                } else {
                    timezone = formData["new-time"].substr(formData["new-time"].lastIndexOf("-"), formData["new-time"].length);
                }
                if (data_value.length == 16) {               //hh:mm:ss  when ss=00, value doesn't contain :00
                    data_value += ":00";
                }
                formData["new-time"] = data_value + timezone;
            } else if (isNullOrUndefined(timezone) || timezone.indexOf("+") == -1 && timezone.indexOf("-") == -1) {
                if (data_value.length == 16) {               //hh:mm:ss  when ss=00, value doesn't contain :00
                    formData["new-time"] = data_value + ":00Z";
                } else {
                    formData["new-time"] = data_value + "Z";
                }
            }
        } else if (control.type === "select-one" && control.name === "timezone" && control.id === "new-timetimezone") {  //timezone for set-time
            let datetime = null;
            if (!isNullOrUndefined(formData["new-time"]) && formData["new-time"] != PLEASE_SELECT_VALUE) {
                if (formData["new-time"].indexOf("Z") != -1) {
                    datetime = formData["new-time"].substr(0, formData["new-time"].indexOf("Z"));
                } else if (formData["new-time"].indexOf("+") != -1) {
                    datetime = formData["new-time"].substr(0, formData["new-time"].indexOf("+"));
                } else if (formData["new-time"].indexOf("-") != -1) {
                    datetime = formData["new-time"].substr(0, formData["new-time"].lastIndexOf("-"));
                }
                let timezoneValue;
                if (data_value.indexOf("GMT+") != -1 || data_value.indexOf("GMT-") != -1) {
                    timezoneValue = data_value.substr(data_value.indexOf("GMT") + 3, 6);
                } else if (data_value.indexOf("GMT") == -1) {
                    timezoneValue = "Z"
                } else if (data_value.indexOf("GMT") != -1) {
                    timezoneValue = "Z"
                }
                formData["new-time"] = datetime + timezoneValue;
            } else if (isNullOrUndefined(formData["new-time"]) || formData["new-time"] === PLEASE_SELECT_VALUE) {
                let defautTime = control.getAttribute("defaulttimevalue");
                if (data_value.indexOf("+") != -1 || data_value.indexOf("-") != -1) {
                    formData["new-time"] = defautTime + data_value;
                } else {
                    if (defautTime.length == 16) {               //hh:mm:ss  when ss=00, value doesn't contain :00
                        formData["new-time"] = defautTime + ":00Z";
                    } else {
                        formData["new-time"] = defautTime + "Z";
                    }
                }

            }
        } else if (control.type === "select-one" && control.name === "timezone" && control.id === "timezone") {
            formData[data_id] = data_value;
        } else if (control.type === "datetime-local" && control.name === "start-end-time") {
            if (data_value.length == 16) {               //hh:mm:ss  when ss=00, value doesn't contain :00
                formData[data_id] = data_value + ":00Z";
            } else {
                formData[data_id] = data_value + "Z";
            }
        } else if (control.type === "select") {  //when controlConfig has attribute "when"select-multiple
            formData[data_id] = data_value;
        } else if (control.type === "radio") {  //when controlConfig has attribute "radio" for userdefine
            formData[data_id] = data_value;
        } else {
            formData[data_id] = data_value;
        }

        //set validate message to state
        vo && Object.keys(vo.validateMsg).forEach(key => {
            this.state.validateMsg[key] = vo.validateMsg[key];
        });

        this.setState({formData: formData, validateMsg: this.state.validateMsg});
    };


    handleSetFormData = (dataId, dataValue, vo) => {
        if (isEmpty(dataId)) {
            return;
        }
        let formData = this.state.formData;
        formData[dataId] = dataValue;
        //set validate message to state
        vo && Object.keys(vo.validateMsg).forEach(key => {
            this.state.validateMsg[key] = vo.validateMsg[key];
        });

        this.setState({formData: formData, validateMsg: this.state.validateMsg});
    }

    refreshNewData(newFormData) {
        this.setState({formData: newFormData});
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
    getScroll = (e) => {
        collapseOthers();
        e.stopPropagation();
    }

    render() {
        let modalConfig = this.state.modalConfig;
        let showTitle;
        let headShowType = modalConfig.headShowType;
        if (headShowType != null && headShowType === ModalConfigConstant.HeadShowType.Multiple) {
            showTitle = "";
        } else {
            showTitle = modalConfig.head.title;
        }
        let contentCss = this.props.objectType == "log-console" ? "react-modal-dialog-content-no-overflow" : "react-modal-dialog-content";
        let modalContentCss = this.props.objectType == "ols-diagram" ? "react-modal-content ols-diagram-react-modal-content" : "react-modal-content"
        let helpString = getMappingHelpString(this.props.helpString);
        return (
            <div className="react-modal-dialog-container" onClick={this.actionClick}>
                <div className="react-modal-dialog-wrapper">
                    <ToolTip type="info"/>
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
                        <span
                            data-tip={(this.props.controlConfig != null && this.props.controlConfig.definition != null && this.props.controlConfig.definition.description != null) ? this.props.controlConfig.definition.description : showTitle}>
                            {showTitle}</span>
                    </div>
                    <div className={"react-modal-dialog-item " + contentCss} onScroll={e => this.getScroll(e)}>
                        <div className={modalContentCss}>
                            {this.getContent(modalConfig)}
                        </div>
                    </div>
                    <div className="react-modal-dialog-foot">
                        {modalConfig.body.bodyContentType === ModalConfigConstant.ModalBodyTypeEnum.Form ?
                            <img className="loading_icon" src={imgWait}/> : ""}
                        {modalConfig.foot.show ? this.createButton(this.props, modalConfig) : null}
                    </div>
                </div>
            </div>
        );
    }

    actionClick = () => {
        const myOpenList = document.getElementsByClassName("my-open");
        for (let index = myOpenList.length - 1; index >= 0; index--) {
            myOpenList.item(index).classList.remove("my-open");
        }
    };

    createButton(paramObj, modalConfig) {
        let buttons = [];
        modalConfig.foot.buttons.map(item => {
            let key = null, className = null;
            switch (item.type) {
                case ModalConfigConstant.ModalButtonTypeEnum.Ok:
                    key = "modal_btn_ok";
                    className = "okBtn"
                    break;
                case ModalConfigConstant.ModalButtonTypeEnum.No:
                    key = "modal_btn_no";
                    className = "noBtn";
                    break;
                case ModalConfigConstant.ModalButtonTypeEnum.Yes:
                    key = "modal_btn_yes";
                    className = "yesBtn";
                    break;
                case ModalConfigConstant.ModalButtonTypeEnum.Apply:
                    key = "modal_btn_apply";
                    className = "";
                    break;
                case ModalConfigConstant.ModalButtonTypeEnum.Redirect:
                    buttons.push(
                        <button key="modal-btn-redirect" className="modal-button">
                            <a href={item.href} target={item.target} style={{color: 'inherit'}}>{item.label}</a>
                        </button>);
                    return;
                default:
                    break;
            }

            buttons.push(<button key={key} className={`modal-button ${className}`}
                                 onClick={this.handleOkButtonClick(item.clickFunction, item.type)}>{item.label}</button>);

        });
        return buttons;
    }

    getContent(modalConfig) {
        switch (modalConfig.body.bodyContentType) {
            case ModalConfigConstant.ModalBodyTypeEnum.Form:
                return (
                    <form ref={this.reactModelFormRef} className="form-horizontal react-modal-form" role="form"
                          onSubmit={() => {
                              return false;
                          }}>
                        <input type="text" style={{display: "none"}}/>
                        {this.createFormControl()}
                    </form>
                );
            case ModalConfigConstant.ModalBodyTypeEnum.Message:
                return <ReactModalMessage message={modalConfig.body.bodyContentMessage}/>;
            case ModalConfigConstant.ModalBodyTypeEnum.Custom:
                return this.props.customPanel || "";
            default:
                console.error(`not able to handle ${modalConfig.body.bodyContentType}`);
        }
    }

    createFormControl() {
        let validator = deepClone(DefaultFormValidator), formData = deepClone(this.state.formData),
            controlConfig = this.props.controlConfig;
        for (let _key in controlConfig) {    //prose when.
            if (!controlConfig.hasOwnProperty(_key)) continue;
            if( isNullOrUndefined(controlConfig[_key].config) || controlConfig[_key].config === "true" || this.props.alertType != ModalConfigConstant.ModalAlertType.Create ) {
                if (controlConfig[_key].hasOwnProperty("when")) {
                    let _enable = parseWhenAction(controlConfig, _key, "when", this.state.formData, this.props.parentData,this.props.neData);
                    if (_enable && isNullOrUndefined(this.state.formData[_key])) {
                        if( controlConfig[_key].defaultValue != null
                            && !controlConfig[_key].defaultValue.startsWith("if (")
                            && !controlConfig[_key].defaultValue.startsWith("$")) {
                            this.state.formData[_key] = controlConfig[_key].defaultValue;
                            formData[_key] = controlConfig[_key].defaultValue;
                        } else {
                            this.state.formData[_key] = "";
                            formData[_key] = "";
                        }
                    }
                    controlConfig[_key].showEnable = _enable;
                    controlConfig[_key].commitEnable = _enable;
                }
            }
        }
        let groupIndex = 0;
        let groupControlList = [];
        if (this.props.objectType != null && YangUserGroupDefine[this.props.objectType] != null) {
            let groupItems = YangUserGroupDefine[this.props.objectType]["items"];
            groupItems.forEach(itemsConfig => {
                let items = itemsConfig.items;
                let itemList = [];
                let className = ""
                items.forEach(prop => {
                    let controlFactory = this.createControlFactory(controlConfig, this.state.formData, prop, validator,this.props.parentData,this.props.neData);
                    if (controlFactory != null) {
                        itemList.push(controlFactory);
                    }
                    delete formData[prop];
                })
                if (itemsConfig.groupName == null) {
                    className += "fieldset-no-legend";
                }
                if (itemList.length == 0) {
                    className += " none";
                }
                groupControlList.push(
                    <fieldset key={'group_fieldset_' + groupIndex} className={className}>
                        {itemsConfig.groupName == null ? null : <legend>{getText(itemsConfig.groupName)}</legend>}
                        {itemList}
                    </fieldset>
                );
                groupIndex++;
            })
        }
        let noGroupControlList = [];
        let expandGroupControlObj = {};
        if (!isEmptyObj(formData)) {
            for (let prop in formData) {
                if (controlConfig[prop] == null) {
                    continue;
                }
                if (controlConfig[prop].hasOwnProperty("expandType")) {
                    let expandType = controlConfig[prop].expandType;
                    if (expandGroupControlObj[expandType] == null) {
                        expandGroupControlObj[expandType] = [];
                    }
                    let controlFactory = this.createControlFactory(controlConfig, this.state.formData, prop, validator,this.props.parentData,this.props.neData);
                    if (controlFactory != null) {
                        expandGroupControlObj[expandType].push(controlFactory);
                    }
                } else {
                    let controlFactory = this.createControlFactory(controlConfig, this.state.formData, prop, validator,this.props.parentData,this.props.neData);
                    if (controlFactory != null) {
                        noGroupControlList.push(controlFactory);
                    }
                }
            }
        }
        this.validator = validator;
        if (isEmptyObj(expandGroupControlObj) && groupControlList.length == 0) {
            return noGroupControlList;
        }
        if (noGroupControlList.length > 0) {
            groupControlList.push(
                <fieldset key={'group_fieldset_' + groupIndex} className='fieldset-no-legend'>
                    {noGroupControlList}
                </fieldset>
            );
            groupIndex++;
        }
        if (!isEmptyObj(expandGroupControlObj)) {
            for (let groupName in expandGroupControlObj) {
                groupControlList.push(
                    <fieldset key={'group_fieldset_' + groupIndex}>
                        <legend>{getText(groupName)}</legend>
                        {expandGroupControlObj[groupName]}
                    </fieldset>
                );
                groupIndex++;
            }
        }
        return groupControlList;
    }

    createControlFactory(controlConfig, formData, prop, validator,parentData,neData) {
        let value = formData[prop];
        if (value == null) {
            return;
        }
        let dataConfig = controlConfig[prop];
        if (isEmptyObj(dataConfig) || (dataConfig.hasOwnProperty("show") && !dataConfig.show)) return;
        let hidden = false;
        if (dataConfig.hasOwnProperty("showEnable")) {
            if (!componentIsEnable(formData, dataConfig.showEnable)) {
                hidden = true;
            }
        }
        let _mandatory = parseYangParameterAction(dataConfig, "mandatory", "when", formData);
        if (dataConfig.hasOwnProperty("min-elements")) {
            _mandatory = true;
        }
        if (_mandatory != null) {
            dataConfig.mandatory = _mandatory;
            if (_mandatory) {
                if (dataConfig.initValidators != null) {
                    dataConfig["validators"] = dataConfig.initValidators;
                } else {
                   if(!isNullOrUndefined(dataConfig["validators"]) &&  dataConfig["validators"].hasOwnProperty("notRequired")){
                       delete dataConfig["validators"]["notRequired"];
                   }
                    let _validators = {
                        "notEmpty": {
                            message: function () {
                                return getText("error_required").format(getText(prop))
                            }
                        }
                    }
                    if (dataConfig.type == FormControlTypeEnum.Select
                        || dataConfig.type == FormControlTypeEnum.MultiSelect) {
                        _validators["regexp"] = {
                            regexp: "^(?!" + PLEASE_SELECT_VALUE + "$)",
                            message: function () {
                                return getText("error_required").format(getText(prop))
                            }
                        }
                    }
                    dataConfig["validators"] = extendCustomConfig(_validators,dataConfig["validators"]);
                }
            } else {
                dataConfig["validators"] = null;
            }
        }
        if (dataConfig.initValidators != null) {
            dataConfig["validators"] = dataConfig.initValidators;
        }
        if (dataConfig.firstValidators != null) {
            let org = dataConfig["validators"];
            dataConfig["validators"] = dataConfig.firstValidators;
            for (let va in org) {
                dataConfig["validators"][va] = org[va];
            }
        }
        if (!isEmptyObj(dataConfig) && dataConfig.hasOwnProperty("validators") && !isEmptyObj(dataConfig.validators) && dataConfig.editEnable) {
            validator.fields[prop] = {
                validators: dataConfig.validators
            };
            this.state.validateMsg[prop] = this.state.validateMsg[prop] || {showIcon: "default", text: null};
        }
        return <ReactFormControlFactory
            labelCSS={controlConfig.hasOwnProperty("labelCSS") ? controlConfig.labelCSS : ""}
            inputCSS={controlConfig.hasOwnProperty("inputCSS") ? controlConfig.inputCSS : ""} hidden={hidden}
            formObj={this.reactModelFormRef.current}
            data-alertType={this.props.alertType}
            handleSetFormData={this.handleSetFormData}
            handleSetValue={this.handleSetValue}
            key={"modal_form_control_" + prop} data_key={prop}
            form_data={formData} data_value={value}
            data_config={dataConfig}
            validator={validator.fields[prop]}
            validateMsg={this.state.validateMsg[prop]}
            neData={neData} parentData={parentData}
            handleRemovedParams={this.handleRemovedParams}/>;
    }

    componentDidMount() {
        collapseOthers();
        let parent = ReactDOM.findDOMNode(this).parentNode;
        parent.classList.add("modal-parent2");
        this.myRef.current.parentNode.style.top = (this.myRef.current.parentNode.parentNode.offsetHeight - this.myRef.current.parentNode.offsetHeight) / 2 + "px";
    }
}

let DefaultFormValidator = {
    message: 'This value is not valid',
    feedbackIcons: {
        valid: 'iconfont icon-check-mark',
        invalid: 'iconfont icon-remove',
        validating: 'iconfont icon-refresh',
    },
    fields: {}
};

let controlIsEnable = function (data, editEnable) {
    let disabled = true;
    if (typeof editEnable === "function") {
        disabled = editEnable(data);
    } else if (typeof editEnable === "boolean") {
        disabled = !editEnable;
    } else if (typeof editEnable === "number") {
        disabled = editEnable;
    }
    if (typeof disabled === "boolean") {
        disabled = disabled ? ControlStateEnum.Disabled : ControlStateEnum.Enabled;
    }
    return disabled;
};

let componentIsEnable = function (data, showEnable) {
    let disabled = true;
    if (typeof showEnable === "function") {
        disabled = showEnable(data);
    } else if (typeof showEnable === "boolean") {
        disabled = !showEnable;
    } else if (typeof showEnable === "number") {
        disabled = showEnable;
    }
    if (typeof disabled === "boolean") {
        disabled = disabled ? ControlStateEnum.Disabled : ControlStateEnum.Enabled;
    }
    return disabled;
};

class ReactFormControlFactory extends Component {
    constructor(props) {
        super(props);
        this.initMultiSelectRefs = {};
        this.inputCSS = "col-sm-7";
        this.labelCSS = "control-label col-sm-4 col-xs-4";
        this.unitsCSS = "modal_unit_label";
    }

    createText(disabled, hidden) {
        let dataConfig = deepClone(this.props.data_config);
        let defaultValue = dataConfig.defaultValue;
        if (typeof defaultValue === "function") {
            defaultValue = defaultValue(this.props.form_data);
        }
        let textValue = isFunction(this.props.data_value) ? null : this.props.data_value;
        textValue = isNullOrUndefined(textValue) ? defaultValue : textValue;
        let _validator = this.props.validator || {};
        if (dataConfig.hasOwnProperty("afterUpdate")) {
            let _config = dataConfig.afterUpdate(this.props.form_data, dataConfig,this.props.parentData,this.props.neData);
            if (_config != null) {
                if( _config.validators != null ) {
                    _validator = extendCustomConfig(_validator, {validators : _config.validators});
                    delete _config["validators"]
                }
                dataConfig = extendCustomConfig(dataConfig, _config)
            }
        }
        if (dataConfig.inputCSS != null) {
            this.inputCSS = dataConfig.inputCSS;
        }
        let icss = dataConfig.mandatory && disabled ? "form-control required" : "form-control";
        const hasValidator = !isEmptyObj(_validator);
        let vMsg = this.props.validateMsg || {};
        if( isNullOrUndefined(textValue) ) {
            textValue = ""
        }
        return (
            <div className={this.inputCSS}>
                <input type="text" hidden={hidden}
                       onChange={hasValidator ? ActionListener(this.props.data_key, _validator, this.props.handleSetValue) : this.props.handleSetValue}
                       disabled={DisabledState[disabled]} id={this.props.data_key} name={this.props.data_key}
                       className={icss} data-key={this.props.data_key} value={textValue}
                       placeholder={dataConfig.placeholder} data-tip={textValue}/>
                {vMsg.showIcon && <i className={"icon-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                {vMsg.showIcon == "remove" && <small className="help-block">{vMsg.text}</small>}
            </div>
        );
    }

    createPassword(disabled, hidden) {
        let defaultValue = this.props.data_config.defaultValue;
        let textValue;
        if (typeof defaultValue === "function") {
            textValue = defaultValue(this.props.form_data);
        } else {
            textValue = this.props.data_value;
            textValue = isNullOrUndefined(textValue) ? defaultValue : textValue;
        }
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        let icss = this.props.data_config.mandatory && disabled ? "form-control required" : "form-control";
        const hasValidator = !isEmptyObj(this.props.validator);
        let vMsg = this.props.validateMsg || {};
        return (
            <div className={this.inputCSS}>
                <input type="password" hidden={hidden}
                       onChange={hasValidator ? ActionListener(this.props.data_key, this.props.validator, this.props.handleSetValue) : this.props.handleSetValue}
                       disabled={DisabledState[disabled]} id={this.props.data_key} name={this.props.data_key}
                       className={icss} data-key={this.props.data_key} value={textValue}
                       placeholder={getText(this.props.data_config.placeholder)}
                       autoComplete={"new-password"}/>
                {vMsg.showIcon && <i className={"icon-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                {vMsg.showIcon == "remove" && <small className="help-block">{vMsg.text}</small>}
            </div>
        );
    }

    createRadio(disabled, hidden) {
        let data_config = this.props.data_config;
        let radioItemList = [];
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        this.props.data_config.enumValue.map((item, index) => {
            radioItemList.push(
                <label className="radio-inline" key={this.props.data_key + "_radio_" + index}>
                    <input type="radio" hidden={hidden} onChange={this.props.handleSetValue}
                           disabled={DisabledState[disabled]} name={this.props.data_key}
                           value={item.value} data-key={this.props.data_key}
                           checked={item.value === (this.props.data_value || data_config.defaultValue)}/>{item.label}
                </label>
            )
        });

        return (
            <div className={this.inputCSS}>
                {radioItemList}
            </div>
        );
    }

    createCase(disabled, hidden) {
        this.createSelect(disabled, hidden);
        this.createText(disabled, hidden)

    }

    createChoiceRadio(disabled, hidden) {
        let data_config = this.props.data_config;
        let radioItemList = [];
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        let disabled_new = data_config.disabled || DisabledState[disabled];
        this.props.data_config.enumValue.map((item, index) => {
            radioItemList.push(
                <label className="radio-inline" key={this.props.data_key + "_radio_" + index}>
                    <input type="radio" hidden={hidden} onChange={this.props.handleSetValue}
                           disabled={disabled_new} id={this.props.data_key + index}
                           name={this.props.data_key} value={item.value} data-key={this.props.data_key}
                           checked={item.value === (this.props.data_value || data_config.defaultValue)}/><label
                    data-tip={item.description}>{item.label}</label>
                </label>
            )
        });
        return (
            <div className={this.inputCSS} type="radio" id="radio-group">
                {radioItemList}
            </div>
        );
    }

    createSelect(disabled, hidden) {
        let dataConfig = deepClone(this.props.data_config);
        let enumConfig = this.props.data_config.enumValue;
        let enumValue;
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        if (typeof enumConfig === "function") {
            enumValue = enumConfig(this.props.form_data);
        } else {
            enumValue = enumConfig;
        }

        if (this.props.data_config.hasOwnProperty("afterUpdate")) {
            enumValue = this.props.data_config.afterUpdate(this.props.form_data, dataConfig,this.props.parentData,this.props.neData);
            if( enumValue != null && enumValue.length > 0 && enumValue[0].defaultValue && this.props.form_data[this.props.data_key] === PLEASE_SELECT_VALUE) {
                this.props.form_data[this.props.data_key] = enumValue[0].defaultValue;
            } else if( enumValue != null && enumValue.length > 0 && this.props.form_data[this.props.data_key] != PLEASE_SELECT_VALUE) {
                if (enumValue.filter(item=>item.value === this.props.form_data[this.props.data_key]).length === 0 ) {
                    this.props.form_data[this.props.data_key] = enumValue[0].value;
                }
            }
        }
        let optionList;
        let submitValue = (this.props.data_config.hasOwnProperty("afterUpdate") ? this.props.form_data[this.props.data_key]
            : this.props.data_value) || this.props.data_config.defaultValue;
        // let submitValue = this.props.data_value || this.props.data_config.defaultValue;
        if (!isNullOrUndefined(enumValue)) {
            enumValue.sort(function (a, b) {
                if (this.props.data_config.hasOwnProperty("sortFunc")) {
                    return this.props.data_config.sortFunc(a.label, b.label);
                } else {
                    return sortFunc(a.label, b.label)
                }
            }.bind(this))
            optionList = enumValue.map((item, idx) => (
                <option key={idx} value={item.value}>{getText(item.label, false)}</option>
            ));
            if (isNullOrUndefined(this.props.data_config.defaultValue)) {
                optionList.splice(0, 0,
                    <option key={"select_option_" + "please_select_"}
                            value={PLEASE_SELECT_VALUE}>{getText("please-select")}</option>
                )
            }
        } else {
            optionList =
                <option key={"select_option_" + "please_select_"}
                        value={PLEASE_SELECT_VALUE}>{getText("please-select")}</option>;
        }

        let icss = this.props.data_config.mandatory && disabled ? "form-control required" : "form-control";
        let selectMd = this.props.data_config.mandatory && disabled ? 1 : 0;
        const hasValidator = !isEmptyObj(this.props.validator);
        let vMsg = this.props.validateMsg || {};
        if (!isNullOrUndefined(enumValue) && !enumValue.some(item => {return item.value === submitValue})
            && !isNullOrUndefined(submitValue) && submitValue !== PLEASE_SELECT_VALUE) {
            this.reRender = true;
        } else {
            this.reRender = false;
        }
        return (
            <div className={this.inputCSS}>
                <select className={icss} type="select" hidden={hidden} disabled={DisabledState[disabled]}
                        id={this.props.data_key} name={this.props.data_key}
                        data-key={this.props.data_key} value={submitValue}
                        data-tip={submitValue}
                        onChange={hasValidator ? ActionListener(this.props.data_key, this.props.validator, this.props.handleSetValue, selectMd) : this.props.handleSetValue}>
                    {optionList}
                </select>
                {vMsg.showIcon && <i className={"icon-control-feedback iconfont icon-" + vMsg.showIcon}/>}
                {vMsg.showIcon == "remove" && <small className="help-block">{vMsg.text}</small>}
            </div>
        );
    }

    createMultiSelect(disabled, hidden) {
        let dataConfig = deepClone(this.props.data_config);
        let enumConfig = this.props.data_config.enumValue;
        let enumValue;
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        if (typeof enumConfig === "function") {
            enumValue = enumConfig(this.props.form_data);
        } else {
            enumValue = enumConfig;
        }

        if (this.props.data_config.hasOwnProperty("afterUpdate")) {
            enumValue = this.props.data_config.afterUpdate(this.props.form_data, dataConfig,this.props.parentData,this.props.neData);
        }

        let submitValue = this.props.data_value || this.props.data_config.defaultValue;
        if (submitValue instanceof Array) {
        } else {
            submitValue = [submitValue];
        }
        let options = {};
        Array.isArray(enumValue) && enumValue.map(item => {
            options[item.label] = item.value;
        });
        this.props.data_config.mandatory = this.props.data_config.mandatory || this.props.data_config["min-elements"] ? true : false;
        return <MultiSelect keyValue={this.props.data_key} initData={options || {}} disabled={disabled}
                            required={this.props.data_config.mandatory ? true : false}
                            wrapClass="modal-multi-wrapper" borderClass="modal-border"
                            validator={this.props.validator}
                            initMultiSelectRefs={this.initMultiSelectRefs}
                            defaultValue={submitValue}
                            handleSetValue={this.props.handleSetValue}
                            validateMsg={this.props.validateMsg}/>;
    }

    createTribInput(disabled, hidden) {
        let defaultValue = this.props.data_config.defaultValue;
        let textValue = null;
        let total = 0;
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        if (!isNullOrUndefined(this.props.data_config.total)) {
            total = this.props.data_config.total;
        }else{
            total = 80;
        }

        if (typeof defaultValue === "function") {
            textValue = defaultValue(this.props.form_data);
        } else {
            textValue = (isNullOrUndefined(this.props.data_value)) ? defaultValue : this.props.data_value;
        }

        let oduType = this.props.form_data["odu-type"];

        let updateCallBack = null;
        //
        // if (this.props.data_config.hasOwnProperty("afterUpdate")) {
        //     updateCallBack = function () {
        //         return function (fun) {
        //             this.props.data_config.afterUpdate(this.props.form_data, {},fun);
        //         }.bind(this)
        //     }.bind(this)
        // }

        let validatorStates = !isEmptyObj(this.props.validator);
        let vMsg = this.props.validateMsg || {};
        if (this.props.data_key === "time-slots") {
            return (
                <ReactTimeslot
                    onChange={this.props.handleSetFormData}
                    classNameForTimeSlot={this.inputCSS}
                    disabled={DisabledState[disabled]}
                    idForTimeSlot={this.props.data_key}
                    nameForTimeSlot={this.props.data_key}
                    dataKeyForTimeslot={this.props.data_key}
                    validatorState={validatorStates}
                    validator={this.props.validator}
                    hidden={hidden}
                    required={this.props.data_config.mandatory}
                    value={textValue}
                    placeholder={this.props.data_config.placeholder.indexOf("undefined") > -1 ?
                        "Available Time Slots 1..80" : getText(this.props.data_config.placeholder)
                        }
                    totalCount={total}
                    availableTimeslot={this.props.data_config.placeholder.indexOf("undefined") > -1 ?
                    "Available Time Slots 1..80" : this.props.data_config.placeholder}
                    oduType={oduType}
                    validateMsg={vMsg}

                />
            );
        } else {
            return (
                <ReactOpucnTimeslot
                    onChange={this.props.handleSetFormData}
                    classNameForTimeSlot={this.inputCSS}
                    disabled={DisabledState[disabled]}
                    idForTimeSlot={this.props.data_key}
                    nameForTimeSlot={this.props.data_key}
                    dataKeyForTimeslot={this.props.data_key}
                    validatorState={validatorStates}
                    validator={this.props.validator}
                    hidden={hidden}
                    required={this.props.data_config.mandatory}
                    value={textValue}
                    placeholder={getText(this.props.data_config.placeholder)}
                    totalCount={total}
                    availableTimeslot={this.props.data_config.placeholder}
                    oduType={oduType}
                    validateMsg={vMsg}
                    updateCallBack={updateCallBack}
                />
            );
        }

    }

    createTextSelect(disabled, hidden) {//no default value, enum value list, and input value
        let dataConfig = deepClone(this.props.data_config);
        let enumConfig = this.props.data_config.enumValue || [], enumValue = null;
        if (typeof enumConfig === "function") {
            enumValue = enumConfig(this.props.form_data);
        } else {
            enumValue = enumConfig;
        }

        if (this.props.data_config.hasOwnProperty("afterUpdate")) {
            enumValue = this.props.data_config.afterUpdate(this.props.form_data ,dataConfig,this.props.parentData, this.props.neData);
        }

        if (!isNullOrUndefined(enumValue)) {
            enumValue.sort(function (a, b) {
                if (this.props.data_config.hasOwnProperty("sortFunc")) {
                    return this.props.data_config.sortFunc(a.label, b.label);
                } else {
                    return sortFunc(a.label, b.label)
                }
            }.bind(this))
        }
        let submitValue = this.props.data_value;
        submitValue = (submitValue == undefined || submitValue == null) ? this.props.data_config.defaultValue : submitValue;
        return <InputSelect keyValue={this.props.data_key} defaultValue={submitValue} enumValue={enumValue || {}}
                            required={this.props.data_config.mandatory ? true : false}
                            disabled={DisabledState[disabled]}
                            wrapClass="modal-multi-wrapper"
                            placeholder={this.props.data_config.placeholder}
                            initMultiSelectRefs={this.initMultiSelectRefs}
                            handleSetValue={this.props.handleSetValue}
                            validator={this.props.validator}
                            validateMsg={this.props.validateMsg}/>;
    }

    createCheckedPwd(disabled, hidden) {
        let defaultValue = this.props.data_config.defaultValue;
        let textValue = null;
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        if (typeof defaultValue === "function") {
            textValue = defaultValue(this.props.form_data);
        } else {
            textValue = (isNullOrUndefined(this.props.data_value)) ? defaultValue : this.props.data_value;
        }

        let validatorStates = !isEmptyObj(this.props.validator);
        let vMsg = this.props.validateMsg || {};

        return (
            <CheckboxPwd
                onChange={this.props.handleSetValue}
                classNameForPwd={this.inputCSS}
                disabled={DisabledState[disabled]}
                idForPwd={this.props.data_key}
                nameForPwd={this.props.data_key}
                dataKeyForPwd={this.props.data_key}
                validatorState={validatorStates}
                validator={this.props.validator}
                hidden={hidden}
                required={this.props.data_config.mandatory}
                value={textValue}
                placeholder={getText(this.props.data_config.placeholder)}
                validateMsg={vMsg}
                handleRemovedParams={this.props.handleRemovedParams}
            />
        );


    }

    createTextArea(disabled, hidden) {
        let defaultValue = this.props.data_config.defaultValue;
        let textValue;
        if (typeof defaultValue === "function") {
            textValue = defaultValue(this.props.form_data);
        } else {
            textValue = this.props.data_value;
            textValue = isNullOrUndefined(textValue) ? defaultValue : textValue;
        }
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        let rows = 4;
        if (this.props.data_config.rows != null) {
            rows = this.props.data_config.rows
        }
        let icss = this.props.data_config.mandatory && disabled ? "form-control required" : "form-control";
        icss = icss + " " + this.props.data_config.icss;
        return (
            <div className={this.inputCSS}>
                <textarea hidden={hidden} rows={rows} onChange={this.props.handleSetValue}
                          disabled={DisabledState[disabled]} id={this.props.data_key} name={this.props.data_key}
                          className={icss} data-key={this.props.data_key} value={textValue}
                          placeholder={getText(this.props.data_config.placeholder)}/>
            </div>
        );
    }

    createDateTimeZoneSelect(disabled, hidden) {
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        let enumConfig = this.props.data_config.enumValue;
        let timezoneList = [];
        if (typeof enumConfig === "function") {
            timezoneList = enumConfig(this.props.form_data);
        } else {
            timezoneList = enumConfig;
        }

        let textValue;
        if (typeof this.props.data_config.currentTimeDefaultValue === "function") {
            textValue = this.props.data_config.currentTimeDefaultValue(this.props.form_data);
        } else {
            textValue = this.props.data_config.currentTimeDefaultValue;
            if (!isNullOrUndefined(textValue)) {
                if (textValue.indexOf("+") != -1) {
                    textValue = textValue.substr(0, textValue.indexOf("+"));
                } else {
                    textValue = textValue.substr(0, textValue.lastIndexOf("-"));
                }
            }

            textValue = isNullOrUndefined(textValue) ? this.props.data_value : textValue;
        }

        let timeZoneOption = [];
        timeZoneOption.push(<option value="-please-select-">Please Select Timezone</option>);
        let newtimezonelist = [];
        for (let i = 0; i < timezoneList.length; i++) {
            let timezonevalue = timezoneList[i].label;
            if (timezonevalue.indexOf("GMT") > -1) {
                timezonevalue = timezonevalue.substr(timezonevalue.lastIndexOf("[") + 1)
                timezonevalue = timezonevalue.substr(0, timezonevalue.length - 1)
            }
            newtimezonelist.push(timezonevalue);
        }

        newtimezonelist = uniqueArray(newtimezonelist);
        Object.keys(newtimezonelist).map(i => {
            let data = newtimezonelist[i];
            data = data || noneValue;
            if (data == "") {
                return;
            }
            timeZoneOption.push(
                <option key={"select_option_" + i}>{data}</option>
            )
        });

        let className = this.props.data_config.mandatory && disabled ? "form-control required" : "form-control";
        return (
            <div className={this.inputCSS} data-key="datetimelocal">
                {/*<div id={"timediv"}>*/}
                <input type="datetime-local" name="datetimezone" step="01" hidden={hidden}
                       onChange={this.props.handleSetValue}
                       disabled={DisabledState[disabled]} id={this.props.data_key + "time"} key={"time"}
                       className={className} data-key="datetime" defaultValue={textValue}
                       placeholder={getText(this.props.data_config.placeholder)}/>
                {/*</div>*/}
                {/*<div id={"timezonediv"}>*/}
                <select type="timezone-select" name="timezone" id={this.props.data_key + "timezone"} key={"timezone"}
                        data-key="timezone" className={className}
                        onChange={this.props.handleSetValue}>
                    {timeZoneOption}</select>
                {/*</div>*/}
            </div>
        );
    }

    createDateTimeSelect(disabled, hidden) {
        if (this.props.data_config.inputCSS != null) {
            this.inputCSS = this.props.data_config.inputCSS;
        }
        let icss = this.props.data_config.mandatory && disabled ? "form-control required" : "form-control";
        return (
            <div className={this.inputCSS}>
                <input type="datetime-local" name="start-end-time" step="01" hidden={hidden}
                       onChange={this.props.handleSetValue}
                       disabled={DisabledState[disabled]} id={this.props.data_key}
                       className={icss} data-key={this.props.data_key}
                       placeholder={getText(this.props.data_config.placeholder)}/>

            </div>
        );
    }

    createControl() {
        let control = null;
        let disabled = controlIsEnable(this.props.form_data, this.props.data_config.editEnable);
        let hidden = this.props.hidden || false;
        if (typeof disabled === "number" && disabled != ControlStateEnum.None) {
            switch (this.props.data_config.type) {
                case FormControlTypeEnum.Text:
                    control = this.createText(disabled, hidden);
                    break;
                case FormControlTypeEnum.Password:
                    control = this.createCheckedPwd(disabled, hidden);
                    break;
                case FormControlTypeEnum.NormalPassword:
                    control = this.createPassword(disabled, hidden);
                    break;
                case FormControlTypeEnum.Radio:
                    control = this.createRadio(disabled, hidden);
                    break;
                case FormControlTypeEnum.Select:
                    control = this.createSelect(disabled, hidden);
                    break;
                case FormControlTypeEnum.MultiSelect:
                    control = this.createMultiSelect(disabled, hidden);
                    break;
                case FormControlTypeEnum.TribInput:
                    control = this.createTribInput(disabled, hidden);
                    break;
                case FormControlTypeEnum.TextArea:
                    control = this.createTextArea(disabled, hidden);
                    break;
                case FormControlTypeEnum.DateTimeZoneSelect:
                    control = this.createDateTimeZoneSelect(disabled, hidden);
                    break;
                case FormControlTypeEnum.DateTimeSelect:
                    control = this.createDateTimeSelect(disabled, hidden);
                    break;
                case FormControlTypeEnum.ChoiceRadio:
                    control = this.createChoiceRadio(false, false);
                    break;
                case FormControlTypeEnum.TextSelect :
                    control = this.createTextSelect(disabled, hidden);
                    break;
            }
        }
        return control;
    }


    render() {
        let hiddenClass = "";
        if (!isNullOrUndefined(this.props.hidden) && this.props.hidden) {
            hiddenClass = " none";
        }
        if (this.props.labelCSS != "") {
            this.labelCSS = this.props.labelCSS
        }
        if (this.props.inputCSS != "") {
            this.inputCSS = this.props.inputCSS
        }
        if (this.props.data_config.labelCSS != null) {
            this.labelCSS = this.props.data_config.labelCSS;
        }
        let _title = "";
        let _units = "";
        if (!isNullOrUndefined(this.props.data_config)) {
            if (!isNullOrUndefined(this.props.data_config.description)) {
                _title = this.props.data_config.description.replace(/[\r\n]/g, "<br \>").replace(/\s+/g, ' ');
            }
            if (!isNullOrUndefined(this.props.data_config.units)) {
                _units = <label className={this.unitsCSS}
                                data-tip={this.props.data_config.units}>{this.props.data_config.units}</label>
            }
        }
        let vMsg = this.props.validateMsg || {};
        if (icons[vMsg.showIcon] != null) {
            hiddenClass += " " + icons[vMsg.showIcon];
        }
        return (
            <div className={"form-group " + hiddenClass}>
                <label className={this.labelCSS}
                       data-tip={_title + (this.props.data_config.placeholder != null ? "<br>" + this.props.data_config.placeholder : "")}>{getText(this.props.data_config.label)}</label>
                {this.createControl()}{_units}
            </div>
        );
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.reRender) {
            let vMsg = {validateMsg: {}};
            vMsg.validateMsg[this.props.data_key] = {showIcon: null, text: null};
            this.props.handleSetFormData(this.props.data_key, PLEASE_SELECT_VALUE, vMsg);
        }
    }
}

class ReactModalMessage extends Component {
    render() {
        return (
            <div className="react-warning-box">
                <div className="react-warning-img modal-warning-icon"/>
                <p className="react-warning-message">{this.props.message}</p>
            </div>
        );
    }
}

export {ReactModalAlert,ReactReduxModalAlert, ModalConfigConstant, DefaultFormValidator};
