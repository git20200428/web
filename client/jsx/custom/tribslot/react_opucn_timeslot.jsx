import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {ActionListener, ActionListener4Ele, isNullOrUndefined} from "../utils";

class ReactOpucnTimeslot extends Component {


    selectedBlockArr = [];
    odu = {ODUflexi: 80, ODU4i: 20, ODU4: 20, ODUflex: 80};

    constructor(props) {
        super(props);
        let totalArray = [];

        this.selectedBlockArr = [];
        let totalCount = props.totalCount;
        let index = props.availableTimeslot.search(/\d/);
        let selectedTimeSlotBlocks = [];
        if (this.props.value !== "") {
            selectedTimeSlotBlocks = this.computeTimeSlotBlocks(this.props.value);
        }
        let freeTimeSlotBlocks = [];
        if (props.availableTimeslot !== "" && props.availableTimeslot.substring(index, props.availableTimeslot.length) !== "0") {
            freeTimeSlotBlocks = this.computeTimeSlotBlocks(props.availableTimeslot.substring(index, props.availableTimeslot.length));
        }
        for (let k = 0; k < selectedTimeSlotBlocks.length; k++) {
            this.selectedBlockArr.push(freeTimeSlotBlocks[k] + "");
        }
        for (let k = 0; k < totalCount; k++) {
            totalArray[k] = "occupied";
        }
        for (let k = 0; k < selectedTimeSlotBlocks.length; k++) {
            totalArray[selectedTimeSlotBlocks[k] - 1] = "selected";
        }
        for (let k = 0; k < freeTimeSlotBlocks.length; k++) {
            totalArray[freeTimeSlotBlocks[k] - 1] = "unselected";
        }

        let tmp = this.odu[this.props.oduType];

        this.state = {
            totalSlots: totalArray,
            selectedSlots: selectedTimeSlotBlocks.length,
            inputCorrect: true,
            continuousValue: this.odu[this.props.oduType],
            inputValue: props.value
        };
    }

    // compute the trib array like "1..40,81-100" to blocks array "[1,2,5]",
    computeTimeSlotBlocks = (timeSlotString) => {
        let inputReg = new RegExp("^((([0-9]+(\.[0-9]+)?)+(\.\.([0-9]+(\.[0-9]+)?))?)(,(([0-9]+(\.[0-9]+)?)+(\.\.([0-9]+(\.[0-9]+)?))?))*)?$");
        if (!inputReg.test(timeSlotString)) {
            return [];
        }
        let timeSlotArray = timeSlotString.split(",");

        let timeSlotBlockArray = [];

        for (let j = 0; j < timeSlotArray.length; j++) {
            let tmpArray = timeSlotArray[j].split('..');
            let startBlock = tmpArray[0].split('.')[0];
            let startSlot = tmpArray[0].split('.')[1];
            let startNum = (startBlock - 1) * 20 + startSlot / 1;
            let endNum = startNum;
            if (!isNullOrUndefined(tmpArray[1])) {
                let endBlock = tmpArray[1].split('.')[0];
                let endSlot = tmpArray[1].split('.')[1];
                endNum = (endBlock - 1) * 20 + endSlot / 1;
            }
            for (let num = startNum; num <= endNum; num++) {
                timeSlotBlockArray.push(num);
            }

        }
        return timeSlotBlockArray.sort((a, b) => a - b);
    }
    // click OK button to close the time slot selection GUI
    handleOKButton = (event) => {
        let timeSlotDiv = document.getElementsByClassName("opucn-time-slot-wrapper")[0];
        let parentDiv = timeSlotDiv.parentElement;
        if (parentDiv.classList.contains("my-open")) {
            parentDiv.classList.remove("my-open")
        } else {
            parentDiv.classList.add("my-open");
        }
        event.stopPropagation();

    }

    handleOnChange = (event, vo) => {
        let inputTimeSlots = event.target.value;
        this.props.onChange(this.props.idForTimeSlot, inputTimeSlots, vo);
        this.setState({
            inputValue: inputTimeSlots,
        })

    }

    handleContinuousValue = (event) => {
        console.log("the continuous value is " + event.target.value);
        this.setState({
            continuousValue: event.target.value,
        })

    }


    setInputCorrectFlag = (value) => {
        //clear the data
        this.selectedBlockArr = [];
        let totalArray = this.state.totalSlots;
        for (let i = 0; i < totalArray.length; i++) {
            if (totalArray[i] === "selected") {
                totalArray[i] = "unselected";
            }
        }

        let selectedTimeSlotSplitArr = value.split(",");
        let correctFlag = true;
        if (value !== "") {

            let inputReg = new RegExp("^((([0-9]+(\.[0-9]+)?)+(\.\.([0-9]+(\.[0-9]+)?))?)(,(([0-9]+(\.[0-9]+)?)+(\.\.([0-9]+(\.[0-9]+)?))?))*)?$");
            if (!inputReg.test(value)) {
                correctFlag = false;
            }
            if (correctFlag === true) {
                selectedTimeSlotSplitArr = this.computeTimeSlotBlocks(value);
                for (let k = 0; k < selectedTimeSlotSplitArr.length; k++) {
                    if (this.state.totalSlots[selectedTimeSlotSplitArr[k] - 1] === "occupied") {
                        correctFlag = false;
                    }
                }
            }
            if (correctFlag === true) {
                for (let k = 0; k < selectedTimeSlotSplitArr.length; k++) {
                    if (this.selectedBlockArr.indexOf(selectedTimeSlotSplitArr[k] + "") === -1) {
                        this.selectedBlockArr.push(selectedTimeSlotSplitArr[k] + "");
                    }
                }
                for (let k = 0; k < totalArray.length; k++) {
                    if (selectedTimeSlotSplitArr.indexOf(k + 1) > -1) {
                        totalArray[k] = "selected";
                    }
                }
            }
        }

        this.setState({
            totalSlots: totalArray,
            selectedSlots: this.selectedBlockArr.length,
            inputCorrect: correctFlag
        });

        this.props.onChange(this.props.idForTimeSlot, value);

    }
    // click the button to show or close the time slot selection GUI
    handleShowTimeSlot = event => {
        let parentDiv;
        let timeSlotDiv;
        if (event.target.childElementCount === 1) //click on div
        {
            parentDiv = ReactDOM.findDOMNode(event.target).parentElement;
            timeSlotDiv = ReactDOM.findDOMNode(event.target).nextElementSibling;
        } else {  //click on icon
            parentDiv = ReactDOM.findDOMNode(event.target).parentElement.parentElement;
            timeSlotDiv = ReactDOM.findDOMNode(event.target).parentElement.nextElementSibling;
        }

        if (parentDiv.classList.contains("my-open")) {
            parentDiv.classList.remove("my-open")
            timeSlotDiv.style.opacity = "0";
        } else {
            parentDiv.classList.add("my-open");
            timeSlotDiv.style.opacity = "1";
        }
        let rect = event.target.getBoundingClientRect();
        let top = rect.top + 30;
        let left = rect.left - 260;

        timeSlotDiv.style.left = left + "px";
        timeSlotDiv.style.top = top + "px";
        event.stopPropagation();
        if (parentDiv.classList.contains("my-open")) {
            this.setInputCorrectFlag(this.state.inputValue);
        }

    }
    // to list the block array like [1,2,3,7,8,9] to continuous time slot array like [1..60],[121-180]
    listArray = (arr) => {
        let tmpString = "";
        let result = [],
            i = 0;
        const list = arr.sort((a, b) => a - b);

        list.forEach((item, index) => {
            if (index === 0) {
                result[0] = [item];
            } else if (item - list[index - 1] === 1) {
                result[i].push(item);
            } else {
                result[++i] = [item];
            }
        })

        for (let j = 0; j < result.length; j++) {
            let startNum = result[j][0];
            let endNum = result[j][result[j].length - 1];

            if (startNum % 20 !== 0) {
                tmpString += (parseInt(startNum / 20) + 1) + "." + startNum % 20 + "..";
            } else {
                tmpString += parseInt(startNum / 20) + ".20" + "..";
            }
            if (endNum % 20 !== 0) {
                tmpString += (parseInt(endNum / 20) + 1) + "." + endNum % 20 + ",";
            } else {
                tmpString += parseInt(endNum / 20) + ".20" + ",";
            }

        }
        return tmpString.substring(0, tmpString.length - 1);
    }

    // when click clear button , to clear all selections
    handleClearTimeSlot = () => {
        this.selectedBlockArr = [];
        let totalArray = this.state.totalSlots;
        for (let i = 0; i < totalArray.length; i++) {
            if (totalArray[i] === "selected") {
                totalArray[i] = "unselected";
            }
        }

        this.setState({
            totalSlots: totalArray,
            selectedSlots: 0,
            inputValue: "",
            inputCorrect: true
        });
        ActionListener4Ele(this.props.validator, this.props.onChange)(this.props.idForTimeSlot, "");

    }

    stopEvent = (event) => {
        event.stopPropagation();
    }


    clickTimeSlot = (event) => {
        event.stopPropagation();
        let timeSlotDiv = event.target;
        let timeSlotNumber = timeSlotDiv.getAttribute("id");
        let idx = this.selectedBlockArr.indexOf(timeSlotNumber);
        let selectedSlotsNum = this.state.selectedSlots;
        let totalArray = this.state.totalSlots;
        let isContinue = true;
        if (timeSlotDiv.classList.value.indexOf("selected") > -1) {
            totalArray[timeSlotNumber - 1] = "unselected";
        } else {
            totalArray[timeSlotNumber - 1] = "selected";
        }

        let needSlotsNum = document.getElementById("opucn-continuous-number").value;
        let listInputValue;
        if (totalArray[timeSlotNumber - 1] === "unselected" && idx > -1) { //unselected
            this.selectedBlockArr.splice(idx, 1);
            totalArray[timeSlotNumber - 1] = "unselected";
            selectedSlotsNum--;
            if (isContinue) {
                for (let i = 1; i < needSlotsNum;) {
                    timeSlotNumber++;
                    idx = this.selectedBlockArr.indexOf(timeSlotNumber + "");
                    if (timeSlotNumber > totalArray.length) {
                        i = needSlotsNum;
                    } else if (idx > -1 && totalArray[timeSlotNumber - 1] !== "occupied") {
                        totalArray[timeSlotNumber - 1] = "unselected";
                        this.selectedBlockArr.splice(idx, 1);
                        selectedSlotsNum--;
                        i++;
                    } else if (totalArray[timeSlotNumber - 1] === "unselected") {
                        i++;
                    }
                }
            }

            listInputValue = this.listArray(this.selectedBlockArr);

            this.setState({
                selectedSlots: selectedSlotsNum,
                totalSlots: totalArray,
                inputValue: this.listArray(this.selectedBlockArr),
                inputCorrect: true
            })
        } else if (totalArray[timeSlotNumber - 1] === "selected") { // selected
            this.selectedBlockArr.push(timeSlotNumber);
            selectedSlotsNum++;
            totalArray[timeSlotNumber - 1] = "selected";
            if (isContinue) {
                for (let i = 1; i < needSlotsNum;) {
                    timeSlotNumber++;
                    idx = this.selectedBlockArr.indexOf(timeSlotNumber + "");
                    if (timeSlotNumber > totalArray.length) {
                        i = needSlotsNum;
                    } else if (idx === -1 && totalArray[timeSlotNumber - 1] !== "occupied") {
                        totalArray[timeSlotNumber - 1] = "selected";
                        this.selectedBlockArr.push(timeSlotNumber + "");
                        selectedSlotsNum++;
                        i++;
                    } else if (totalArray[timeSlotNumber - 1] === "selected") {
                        i++;
                    }

                }
            }
            listInputValue = this.listArray(this.selectedBlockArr);

            this.setState({
                selectedSlots: selectedSlotsNum,
                totalSlots: totalArray,
                inputValue: listInputValue,
                inputCorrect: true
            })
        }
        ActionListener4Ele(this.props.validator, this.props.onChange)(this.props.idForTimeSlot, listInputValue);


    }


    render() {
        let disableButton = "false";
        let needSlotsNum = this.odu[this.props.oduType];
        if (isNullOrUndefined(needSlotsNum) || this.props.disabled === true) {
            disableButton = "true";
        }

        let selectedClass = "select-need-slot";


        if (this.state.selectedSlots !== 0 && this.state.selectedSlots !== needSlotsNum) {
            selectedClass = "select-need-slot select-number-error";
        }
        let continuousList = [];
        for (let i = 0; i < needSlotsNum; i++) {
            continuousList[i] = i + 1;
        }

        let trMap = [1, 2];
        let tdMap = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let totalBlock = [];
        for (let i = 1; i <= this.state.totalSlots.length / 20; i++) {
            totalBlock[i - 1] = i;
        }

        let vMsg = this.props.validateMsg || {};

        return (<div className={this.props.classNameForTimeSlot}>
            <input className={this.props.required ? "form-control required" : "form-control"}
                   id={this.props.idForTimeSlot}
                   name={this.props.nameForTimeSlot}
                   data-key={this.props.dataKeyForTimeslot}
                   disabled={this.props.disabled}
                   value={this.state.inputValue}
                   style={{display: "inline"}}
                   placeholder={this.props.placeholder}
                   onChange={this.props.validatorState ? ActionListener(this.props.dataKeyForTimeslot, this.props.validator, this.handleOnChange) : this.handleOnChange}/>
            {vMsg.showIcon && <i className={"icon-control-feedback iconfont icon-" + vMsg.showIcon}/>}
            {vMsg.showIcon === "remove" && <small className="help-block-time-slot">{vMsg.text}</small>}

            {disableButton === "true" ?
                <div className="icon-font-div" style={{display: "inline"}}
                >
                    <i className="iconfont icon-timeSlot" style={{color: "gray"}}
                       data-tip="You should choose correct ODU type" tooltip-type="warning"/>
                </div> :
                <div onClick={(event) => this.handleShowTimeSlot(event)}
                     className="icon-font-div">
                    <i className="iconfont icon-timeSlot" data-tip=""/>

                </div>
            }
            <div className="opucn-time-slot-wrapper" onClick={(event) => this.stopEvent(event)}>
                <div className="opucn-time-slot-content">
                    {totalBlock.map((item, index) => {
                        return <div className={"time-slots-block"} key={index}>
                            <div id="item1"> {item} </div>

                            <div id="item2">
                                {
                                    tdMap.map((tdNumber, index) => {
                                        let slotNumber = (item - 1) * 20;
                                        let keyIndex = slotNumber + tdNumber;
                                        let divClassName;
                                        let centerClass = "";
                                        if (tdNumber !== 10) {
                                            centerClass = " timeslot-center";
                                        }
                                        if (this.state.totalSlots [keyIndex - 1] === "selected") {
                                            divClassName = "opucn-time-slot selected" + centerClass;
                                        } else if (this.state.totalSlots [keyIndex - 1] === "occupied") {
                                            divClassName = "opucn-time-slot occupied" + centerClass;
                                        } else {
                                            divClassName = "opucn-time-slot" + centerClass;
                                        }

                                        return divClassName.indexOf("occupied") !== -1 ? <div className={divClassName}
                                                                                              key={slotNumber + tdNumber}
                                                                                              id={slotNumber + tdNumber}>
                                                {tdNumber}
                                            </div>:
                                            <div className={divClassName}
                                                 key={slotNumber + tdNumber}
                                                 id={slotNumber + tdNumber}
                                                 onClick={(event) => this.clickTimeSlot(event)}>
                                                {tdNumber}
                                            </div>;

                                    })
                                }

                            </div>
                            <div id="item3">
                                {
                                    tdMap.map((tdNumber, index) => {
                                        let slotNumber = (item - 1) * 20;
                                        let keyIndex = slotNumber + 10 + tdNumber;
                                        let divClassName;
                                        let centerClass = "";
                                        if (tdNumber !== 10) {
                                            centerClass = " timeslot-center";
                                        }
                                        if (this.state.totalSlots [keyIndex - 1] === "selected") {
                                            divClassName = "opucn-time-slot selected" + centerClass;
                                        } else if (this.state.totalSlots [keyIndex - 1] === "occupied") {
                                            divClassName = "opucn-time-slot occupied" + centerClass;
                                        } else {
                                            divClassName = "opucn-time-slot" + centerClass;
                                        }

                                        return divClassName.indexOf("occupied") !== -1 ? <div className={divClassName}
                                                                                              key={slotNumber + 10 + tdNumber}
                                                                                              id={slotNumber + 10 + tdNumber}>
                                                {10 + tdNumber}</div> :
                                            <div className={divClassName}
                                                 key={slotNumber + 10 + tdNumber}
                                                 id={slotNumber + 10 + tdNumber}
                                                 onClick={(event) => this.clickTimeSlot(event, this.state.continuousValue)}>
                                                {10 + tdNumber}</div>;
                                    })
                                }
                            </div>
                        </div>


                    })}

                </div>
                <div className={"timeslot-tooltip"}>
                    <div className="show-case">
                        <div className="show-case-item">
                            <div className="time-slot"/>
                            <span>Free</span>

                        </div>
                        <div className="show-case-item">
                            <div className="time-slot selected"/>
                            <span>Selected</span>

                        </div>
                        <div className="show-case-item">
                            <div className="time-slot occupied"/>
                            <span>Used</span>
                        </div>
                    </div>
                    <div className={"opucn-continue-option"}>
                        Continuous Slots:
                        {/*<input className={"continuous-number"} value={this.state.continuousValue}*/}
                        {/*              onChange={this.handleContinuousValue}/>*/}

                        <select className={"continuous-number"} id={"opucn-continuous-number"}
                                onChange={this.handleContinuousValue}>
                            {
                                continuousList.map((number) => {
                                    if (continuousList.length == 20 && number === 20) {
                                        return <option key={number + ""} value={number + ""} selected>{number}</option>;
                                    } else if (continuousList.length == 80 && number === 80) {
                                        return <option key={number + ""} value={number + ""} selected>{number}</option>;
                                    } else {
                                        return <option key={number + ""} value={number + ""}>{number}</option>;
                                    }

                                })
                            }
                        </select>

                    </div>
                    <div className="time-slots-description">
                        <div>
                            Selected&nbsp;/&nbsp;Total:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span
                            className={selectedClass}>{this.state.selectedSlots}&nbsp;/&nbsp;{needSlotsNum}</span>
                        </div>


                    </div>
                </div>
                <div className="opcun-timeslot-button-wrapper">
                    <div className={"timeslot-button-content"}>
                        <div
                            onClick={(event) => this.handleOKButton(event)}
                            className="clear-time-slot-button">
                            OK
                        </div>
                        <div
                            onClick={(event) => this.handleClearTimeSlot(event)}
                            className="clear-time-slot-button">
                            Clear
                        </div>

                    </div>
                </div>
            </div>
        </div>);

    }

    //
    // componentDidMount() {
    //     if( this.props.updateCallBack != null ) {
    //         this.props.updateCallBack()(function (rs) {
    //             console.log(rs)
    //         })
    //     }
    // }
}

export default ReactOpucnTimeslot;