import React, {useRef, useState} from "react";
import {deepClone, getText, getYang, isEmptyObj, requestJson} from "../custom/utils";
import {FormControlTypeEnum, YangUserGroupDefine} from "../yang_user_define";
import {ModalConfigConstant, ReactModalAlert} from "../custom/modal/react_modal";
import ReactDOM from "react-dom";
import {getRpcConfig, getYangConfig} from "../yangMapping";

const {ModalAlertType, ModalBodyTypeEnum, ModalButtonTypeEnum} = ModalConfigConstant;

export default function TestView() {
    const yang = useRef(getYang("yang"));
    const [mo, setMo] = useState();
    const [keys, setKeys] = useState();
    const [key, setKey] = useState();
    const [editCondition, setEditCondition] = useState();
    const [parsedCondition, setParsedCondition] = useState();

    const handleSQLTest = () => {
        let title = "SQL Test";
        let formData = {};

        let _config = {
            "sqls": {
                type: FormControlTypeEnum.TextArea,
                rows: 5,
                label: "SQL",   //显示名称
                placeholder: "", //预输入提示名称
                defaultValue: '{"get":[{"from":"port","where":{"card":{"name":"1-4"}}}]}',  //默认值 用于Radio, CheckBox, Select
                enumValue: [], //枚举类型，用于Radio, CheckBox, Select
                editEnable: true,
                validators: {    //校验规则

                }
            }
        };
        Object.keys(_config).map(key => {
            if (_config[key].editEnable) {
                formData[key] = _config[key].defaultValue;
            }
        });
        let modalConfig = {
            head: {
                title: title
            },
            body: {
                bodyContentType: ModalBodyTypeEnum.Form,
                bodyContentMessage: ""
            },
            foot: {
                buttons: [
                    {
                        type: ModalButtonTypeEnum.Ok,
                        label: getText("submit"),
                        clickFunction: function (data) {
                            requestJson(JSON.parse(data["sqls"]), function (_data) {
                                console.log(_data)
                            });
                        }
                    }
                ]
            }
        };
        ReactDOM.render(<ReactModalAlert id="SQLTestDialog" modalConfig={modalConfig} formData={formData}
                                         controlConfig={_config}
                                         alertType={ModalAlertType.Create}/>, document.getElementById("additionalContent1"));
    };

    const handleGroupTest = () => {
        console.log("Check start......")
        for (let key in YangUserGroupDefine) {
            let alliItems = [];
            let yangConfig = getYangConfig(key);
            if (isEmptyObj(yangConfig)) {
                yangConfig = getRpcConfig(key).input;
            }
            if (isEmptyObj(yangConfig)) {
                yangConfig = null;
            }
            yangConfig = deepClone(yangConfig);
            if (YangUserGroupDefine[key].items != null) {
                YangUserGroupDefine[key].items.forEach(item => {
                    if (item.items != null) {
                        item.items.forEach(subItem => {
                            if (yangConfig != null) {
                                if (!yangConfig.hasOwnProperty(subItem)) {
                                    console.warn(key + "." + subItem + " cannot found in Yang!");
                                } else {
                                    delete yangConfig[subItem];
                                }
                            }
                            if (alliItems.indexOf(subItem) < 0) {
                                alliItems.push(subItem);
                            } else {
                                console.error(key + "." + subItem + " is repeated!")
                            }
                        })
                    } else {
                        console.warn(key + "'s items is null")
                    }
                })
                if (yangConfig != null) {
                    for (let ikey in yangConfig) {
                        if (ikey !== "definition" && ikey !== "expandConfig") {
                            console.warn(key + "." + ikey + " is not added to group!");
                        }
                    }
                }
            } else {
                console.warn(key + "'s items is null")
            }
        }
        console.log("Check completed!")
    }

    const handleMoChange = e => {
        const selectedMo = e.target.value;
        setMo(selectedMo);
        const allKeys = Object.entries((yang.current[selectedMo])).slice(1).map(item => {
            return {value: item[0], title: item[0] + (item[1]["edit-condition"] ? " *" : "")};
        });
        setKeys(allKeys);
        setKey(allKeys[0]);
    };

    const handleKeyChange = e => {
        const selectedKey = e.target.value;
        setKey(selectedKey);
        const cond = yang.current[mo][selectedKey]["edit-condition"] ?? {value: ""};
        setEditCondition(JSON.stringify(cond, null, 4));
        const parser = new ParseCondition();
        if (Array.isArray(cond)) {
            setParsedCondition(JSON.stringify(parser.parse(cond[0].value), null, 4));
        } else {
            setParsedCondition(JSON.stringify(parser.parse(cond.value), null, 4));
        }
    };

    return (
        <div className="test-view">
            <div>
                <div>SQL Test :</div>
                <button onClick={handleSQLTest}>Test</button>
            </div>
            <div>
                <div>Group Check :</div>
                <button onClick={handleGroupTest}>Check</button>
            </div>
            <div>
                <div>Edit Condition :</div>
                <select name="mo-name" id="mo-name" style={{width: "30%"}} onChange={handleMoChange}>
                    {Object.keys(yang.current).sort().map(mo => <option key={mo} value={mo}>{mo}</option>)}
                </select>
                <select style={{width: "30%"}} onChange={handleKeyChange} value={key}>
                    {keys != null ? keys.map(key => <option key={key.value}
                                                            value={key.value}>{key.title}</option>) : null}
                </select>
                <textarea name="c" id="f" cols="100" rows="10" style={{display: "block", marginTop: "30px"}}
                          value={editCondition}/>
                <textarea name="c" id="f" cols="100" rows="10" style={{display: "block", marginTop: "30px"}}
                          value={parsedCondition}/>
            </div>
        </div>
    );
}

class ParseCondition {
    parseIf(str) {
        const matched = /^([\s\S]+?)\s*(\band|or\b)\s*([\s\S]+?)$/.exec(str);
        return  matched ? {condition1: this.parseIf(matched[1]), operator: matched[2], condition2: this.parseIf(matched[3])} : str;
    }

    parse(str) {
        const matched = /^\s*if\s*\(([\s\S]+?)\)\s*then\s*([\s\S]+?)\s*(else\s*([\s\S]+?))?\s*$/.exec(str);
        return matched ? {if: this.parseIf(matched[1]), then: this.parse(matched[2]), else: this.parse(matched[4])} : str;
    }
}