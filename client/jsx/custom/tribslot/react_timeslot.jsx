import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {ActionListener, ActionListener4Ele, isNullOrUndefined} from "../utils";

class ReactTimeslot extends Component {


    selectedBlockArr = [];

    constructor(props) {
        super(props);
        let totalArray = [];

        this.selectedBlockArr = [];
        const odu = {ODU0: 1, ODU1: 1, ODU2: 1,ODU2e: 1, ODU4: 20, ODU4i: 20, ODUflexi: 20};
        let size = odu[this.props.oduType];
        if (isNullOrUndefined(size)) {
            size = 20;
        }
        let totalCount = props.totalCount / size;
        let index = props.availableTimeslot.search(/\d/);
        let selectedTimeSlotBlocks = this.computeTimeSlotBlocks(this.props.value,size);
        let freeTimeSlotBlocks = this.computeTimeSlotBlocks(props.availableTimeslot.substring(index, props.availableTimeslot.length),size);
        for (let k = 0; k < selectedTimeSlotBlocks.length; k++) {
            this.selectedBlockArr.push(freeTimeSlotBlocks[k] + "");
        }
        for (let k = 0; k < totalCount; k++) {
            if (selectedTimeSlotBlocks.indexOf(k + 1) > -1) {
                totalArray[k] = "selected";
            } else if (freeTimeSlotBlocks.indexOf(k + 1) === -1) {
                totalArray[k] = "occupied";
            } else {
                totalArray[k] = "unselected";
            }
        }


        this.state = {
            totalSlots: totalArray,
            selectedSlots: selectedTimeSlotBlocks.length,
            inputCorrect: true,
            blockSize: size,
            inputValue: props.value
        };
    }

    // compute the trib array like "1..40,81-100" to blocks array "[1,2,5]",
    computeTimeSlotBlocks = (timeSlotString, size) => {
        if (isNullOrUndefined(size)) {
            size = 20;
        }
        let timeSlotArray = timeSlotString.split(",");
        let timeSlotBlockArray = [];
        for (let j = 0; j < timeSlotArray.length; j++) {
            let tmpArray = timeSlotArray[j].split('..');
            let startNum = parseInt ((tmpArray[0] - 1) / size + 1);
            if(!isNullOrUndefined(tmpArray[1]))
            {
                let endNum = parseInt(tmpArray[1] / size) ;
                for (let num = startNum; num <= endNum; num++) {
                    timeSlotBlockArray.push(num);
                }
            }else{
                timeSlotBlockArray.push(startNum);
            }

        }
        return timeSlotBlockArray.sort((a, b) => a - b);
    }
    // click OK button to close the time slot selection GUI
    handleOKButton = (event) => {
        let timeSlotDiv = document.getElementsByClassName("time_slot-wrapper")[0];
        let parentDiv = timeSlotDiv.parentElement;
        console.log("parentDIV is " + parentDiv);
        if (parentDiv.classList.contains("my-open")) {
            parentDiv.classList.remove("my-open")
        } else {
            parentDiv.classList.add("my-open");
        }
        event.p
        event.stopPropagation();

    }

    handleOnChange = (event, vo) => {
        let inputTimeSlots = event.target.value;
        this.props.onChange(this.props.idForTimeSlot, inputTimeSlots, vo);
        this.setState({
            inputValue: inputTimeSlots,
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
            let inputReg = new RegExp("^(([0-9]+(\\.\\.[0-9]+)?)(,([0-9]+(\\.\\.[0-9]+)?))*)?$");
            if (!inputReg.test(value)) {
                correctFlag = false;
            }
            for (let j = 0; j < selectedTimeSlotSplitArr.length && correctFlag; j++) {
                let tmpArray = selectedTimeSlotSplitArr[j].split('..');
                if (tmpArray.length !== 0 && tmpArray.length !== 1 && tmpArray.length !== 2) {
                    correctFlag = false;
                } else if (tmpArray.length === 1 || tmpArray.length === 2) {
                    if (this.state.blockSize  > 1 && tmpArray[0] % this.state.blockSize !== 1) {
                        correctFlag = false;
                    }
                    if (this.state.blockSize  > 1 && tmpArray.length === 2 && tmpArray[1] % this.state.blockSize !== 0) {
                        correctFlag = false;
                    }
                }
            }
            if (correctFlag === true) {
                selectedTimeSlotSplitArr = this.computeTimeSlotBlocks(value ,this.state.blockSize);
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
            let startNum = (result[j][0] - 1) * this.state.blockSize + 1;
            if (result[j].length === 1) {
                let endNum = startNum + this.state.blockSize - 1;
                if(startNum === endNum)
                {
                    tmpString += startNum + "," ;
                }else{
                    tmpString += startNum + ".." + endNum + ",";
                }
            } else {
                let endNum = result[j][result[j].length - 1] * this.state.blockSize;
                console.log("endNum is " + endNum);
                tmpString += startNum + ".." + endNum + ",";
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


    clickTimeSlot = (event, needSlotsNum) => {

        let timeSlotDiv = event.target;
        let timeSlotNumber = timeSlotDiv.getAttribute("id");
        let idx = this.selectedBlockArr.indexOf(timeSlotNumber);
        let selectedSlotsNum = this.state.selectedSlots;
        let remainingSlots = needSlotsNum - selectedSlotsNum;
        let totalArray = this.state.totalSlots;
        let isContinue = true;
        if (timeSlotDiv.classList.value.indexOf("selected") > -1) {
            totalArray[timeSlotNumber - 1] = "unselected";
        } else {
            if(this.state.selectedSlots === needSlotsNum)
            {
                return;
            }
            totalArray[timeSlotNumber - 1] = "selected";
            remainingSlots--;
        }
        if (!document.getElementById("continue-option-id").checked) {
            isContinue = false;
        }

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
                for (let i = 1; i <= remainingSlots;) {
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

    componentWillReceiveProps(nextProps) {
        let totalArray = [];
        const odu = {ODU0: 1, ODU1: 1, ODU2: 1, ODU2e: 1, ODU4: 20, ODU4i: 20, ODUflexi: 20};
        let size = odu[nextProps.oduType];
        if (nextProps.oduType !== this.props.oduType) {
            let totalCount = nextProps.totalCount / size;
            let index = nextProps.availableTimeslot.search(/\d/);
            let selectedTimeSlotBlocks = this.computeTimeSlotBlocks(nextProps.value, size);
            let freeTimeSlotBlocks = this.computeTimeSlotBlocks(nextProps.availableTimeslot.substring(index, nextProps.availableTimeslot.length),size);
            for (let k = 0; k < selectedTimeSlotBlocks.length; k++) {
                this.selectedBlockArr.push(freeTimeSlotBlocks[k] + "");
            }
            for (let k = 0; k < totalCount; k++) {
                if (freeTimeSlotBlocks.indexOf(k + 1) === -1) {
                    totalArray[k] = "occupied";
                } else if (selectedTimeSlotBlocks.indexOf(k + 1) > -1) {
                    totalArray[k] = "selected";
                } else {
                    totalArray[k] = "unselected";
                }
            }


            this.setState({
                totalSlots: totalArray,
                selectedSlots: selectedTimeSlotBlocks.length,
                inputCorrect: true,
                blockSize: size,
                inputValue: nextProps.value
            });

        }
        // let totalCount = nextProps.totalCount  / this.state.blockSize;
        //
        // if (totalCount < this.state.totalSlots.length) {
        //     for (let k = 0; k < totalCount; k++) {
        //         totalArray[k] = this.state.totalSlots[k];
        //     }
        //     this.setState({
        //         totalSlots: totalArray
        //     });
        // } else if (totalCount > this.state.totalSlots.length) {
        //     for (let k = 0; k < this.state.totalSlots.length; k++) {
        //         totalArray[k] = this.state.totalSlots[k];
        //     }
        //     for (let k = this.state.totalSlots.length; k < totalCount; k++) {
        //         totalArray[k] = "unselected";
        //     }
        //     this.setState({
        //         totalSlots: totalArray
        //     });
        // }


    }

    render() {
        let disableButton = "false";
        const odu = {ODUflexi: 16, ODU4i: 4, ODU4: 4, ODUflex: 1, ODU0: 1, ODU1: 2, ODU2: 8, ODU2e :8};
        let needSlotsNum = odu[this.props.oduType];
        if (isNullOrUndefined(needSlotsNum)) {
            disableButton = "true";
        }

        let selectedClass = "select-need-slot";


        if (this.state.selectedSlots !== 0 && this.state.selectedSlots !== needSlotsNum) {
            selectedClass = "select-need-slot select-number-error";
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
            <div className="time_slot-wrapper" onClick={(event) => this.stopEvent(event)}>
                <div className="time-slot-content">
                    {this.state.totalSlots.map((item, index) => {
                        let startNum = index * this.state.blockSize + 1;
                        let endNum = startNum + (this.state.blockSize - 1);
                        let divClassName = "time-slot";
                        if (item === "selected") {
                            divClassName = "time-slot selected";
                        }

                        if(startNum!==endNum)
                        {
                            return item === "occupied" ? <div key={index + 1} className="time-slot occupied" id={index + 1}>
                                    {startNum}<br/>{endNum} </div>
                                : <div key={index + 1} className={divClassName} id={index + 1}
                                       onClick={(event) => this.clickTimeSlot(event, needSlotsNum)}>
                                    {startNum}<br/>{endNum}
                                </div>;
                        }else{
                            return item === "occupied" ? <div key={index + 1} className="time-slot blockSize1 occupied" id={index + 1}>
                                    {startNum} </div>
                                : <div key={index + 1} className={divClassName + " blockSize1"} id={index + 1}
                                       onClick={(event) => this.clickTimeSlot(event, needSlotsNum)}>
                                    {startNum}
                                </div>;
                        }


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
                    <div className="continue-option">
                        <input style={{verticalAlign: 'middle'}} id="continue-option-id" type="checkbox"
                               defaultChecked={true}/>
                        Continuous Selection

                    </div>
                    <div className="time-slots-description">
                        Selected/Total:&nbsp;&nbsp;
                        <span className={selectedClass}>{this.state.selectedSlots}/{needSlotsNum}</span>
                    </div>
                </div>
                <div className="timeslot-button-wrapper">
                    <div className={"timeslot-button-content"}>
                        <div
                               onClick={this.handleOKButton}
                               className="clear-time-slot-button">
                            OK
                        </div>
                        <div
                               onClick={this.handleClearTimeSlot}
                               className="clear-time-slot-button">
                            Clear
                        </div>

                    </div>
                </div>
            </div>
        </div>);

    }

}

export default ReactTimeslot;