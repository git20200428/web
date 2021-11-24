import React, {useEffect, useRef} from "react";
import {useSelector} from "react-redux";
import {
    CookKeyEnum,
    extendCustomConfig,
    formatterTimeData,
    getHelpUrl,
    getText,
    isNullOrUndefined
} from "../custom/utils";
import {Link} from "react-router-dom";

import * as echarts from "echarts/core";
import {BarChart} from "echarts/charts";
import {
    DataZoomComponent,
    DataZoomInsideComponent,
    DataZoomSliderComponent,
    GridComponent,
    TitleComponent,
    TooltipComponent
} from "echarts/components";
import {CanvasRenderer} from "echarts/renderers";
import DropMenuButton from "../custom/comm/react_drop_menu";
import {default_export_config} from "../custom/comm/react_export";

echarts.use([GridComponent, TooltipComponent, DataZoomComponent, DataZoomInsideComponent, DataZoomSliderComponent, BarChart, CanvasRenderer, TitleComponent]);

export default function AlarmWidget() {

    const alarmTrendChart = useRef();
    const alarmCount = useSelector(state => state.neinfo.ne ? state.neinfo.ne.alarmCount : {
        critical: 0,
        major: 0,
        minor: 0,
        warning: 0
    });
    const alarmTrend = useSelector(state => state.neinfo.alarmTrend ? state.neinfo.alarmTrend.data : null);

    const getSeverityDiagramHtml = (alarm) => {
        let htmlArr = [];
        Object.keys(alarm).map(function (ala) {
            htmlArr.push(
                <div className={ala} key={ala}
                     title={getText(ala) + ": " + alarm[ala]}><Link className="widget-counter"
                                                                    to={"/fault/current-alarm?filter=perceived-severity&value=" + ala}>{alarm[ala]}</Link>
                </div>);
        });
        return htmlArr;
    };

    const getSeveritySpanHtml = (alarm) => {
        let htmlArr = [];
        Object.keys(alarm).map(function (ala) {
            htmlArr.push(
                <span key={ala}>{getText(ala)}</span>)
        });
        return htmlArr;
    };

    const resizer = () => {
        alarmTrendChart.current.resize();
    };

    useEffect(() => {
        alarmTrendChart.current = echarts.init(document.getElementById("AlarmStatistics"));
        addEventListener("resize", resizer);
        return () => removeEventListener("resize", resizer);
    }, []);

    useEffect(() => {
        drawOption();
        resizer();
    }, [alarmCount, alarmTrend]);


    const drawOption = () => {
        if (!alarmTrend) {
            return;
        }
        let criticalNewAlarmQueue = [];
        let majorNewAlarmQueue = [];
        let minorNewAlarmQueue = [];
        let warningNewAlarmQueue = [];

        let criticalClearAlarmQueue = [];
        let majorClearAlarmQueue = [];
        let minorClearAlarmQueue = [];
        let warningClearAlarmQueue = [];
        let lastDay = "";
        let curDay = "";
        let alarmTimeSlots = [];
        let realTimeSlots = [];
        Object.keys(alarmTrend).map((ts, ind) => {
            let timeStr = formatterTimeData(ts);
            timeStr = timeStr.substring(0, timeStr.length - 3);
            if (ind === 0) {
                alarmTimeSlots.push(timeStr);
                let tsList = timeStr.split(" ");
                lastDay = tsList[0];
            } else {
                let tsList = timeStr.split(" ");
                let times = tsList[1];
                curDay = tsList[0];
                if (curDay === lastDay) {
                    alarmTimeSlots.push(times);
                } else {
                    alarmTimeSlots.push(timeStr);
                }
                lastDay = tsList[0];
            }
            realTimeSlots.push(timeStr);
            let oneAlarm = alarmTrend[ts];
            criticalNewAlarmQueue.push(oneAlarm.critical.new);
            majorNewAlarmQueue.push(oneAlarm.major.new);
            minorNewAlarmQueue.push(oneAlarm.minor.new);
            warningNewAlarmQueue.push(oneAlarm.warning.new);
            criticalClearAlarmQueue.push(-oneAlarm.critical.clear);
            majorClearAlarmQueue.push(-oneAlarm.major.clear);
            minorClearAlarmQueue.push(-oneAlarm.minor.clear);
            warningClearAlarmQueue.push(-oneAlarm.warning.clear);


        });

        const colorStr = localStorage[CookKeyEnum.theme] || "bright" ? "#333" : "#fff";

        let option = {
            title: {
                text: 'Alarm Trend',
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowBlur: 10,
                x: 'center',
                y: 'bottom',
                top: '95%',
                show: false
            },
            grid: {
                borderWidth: 0,
                y: 6,
                y2: 60,
                left: 50
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 90,
                    end: 100,
                },
                {
                    // type: 'slider',
                    start: 90,
                    end: 100,
                }
            ],
            xAxis: [{
                type: 'category',
                boundaryGap: ['10%', '10%'],
                data: alarmTimeSlots,
                axisLine: {
                    onZero: true,
                    lineStyle: {color: colorStr}
                },
                axisTick: {
                    show: true,
                    alignWithLabel: true,
                    interval: 0
                },
                axisLabel: {
                    show: true,
                    interval: 0,
                }
            }],
            tooltip: {
                trigger: "axis",
                formatter: (params) => {
                    let res = "";
                    let dataArr = [criticalNewAlarmQueue, criticalClearAlarmQueue, majorNewAlarmQueue, majorClearAlarmQueue, minorNewAlarmQueue, minorClearAlarmQueue, warningNewAlarmQueue, warningClearAlarmQueue];
                    Object.values(params).map((param, indx) => {
                        let ind = param.dataIndex;
                        let color = param.color;
                        let marker = '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' + color + ';"></span>';
                        if (indx === 0) {
                            res = res + realTimeSlots[ind] + '<br>';
                        }
                        if (indx % 2 === 0) {
                            let bwTxt = ", ";
                            if (Object.is(dataArr[indx + 1][ind], -0)) {
                                bwTxt = ", -"
                            }
                            res = res + marker + " " + param.seriesName.split("(")[0];
                            res = res + ': (+' + dataArr[indx][ind] + bwTxt + dataArr[indx + 1][ind] + ")";
                        } else {
                            res = res + '<br>'
                        }

                    });

                    return res;
                }
            },
            yAxis:
                [
                    {
                        type: 'value',
                        axisLine: {lineStyle: {color: colorStr}},
                        axisTick: {
                            show: true,
                            alignWithLabel: true,
                            interval: 0
                        },
                        axisLabel: {
                            show: true,
                            interval: 0
                            // align:'right'
                        },
                        minInterval: 1,
                        boundaryGap: ['10%', '10%'],
                        scale: true
                        // axisLine:{
                        //     lineStyle:{
                        //         zIndex: 1000,
                        //     }
                        // },
                    }
                ],
            series: [
                {
                    name: 'Critical(new)',
                    type: 'bar',
                    barWidth: 10,
                    stack: 'critical',
                    data: criticalNewAlarmQueue,
                    itemStyle: {
                        color: '#db3a27'
                    }
                },
                {
                    name: 'Critical(clear)',
                    type: 'bar',
                    stack: 'critical',
                    barWidth: 10,
                    data: criticalClearAlarmQueue,
                    itemStyle: {
                        color: '#db3a27'
                    }
                },
                {
                    name: 'Major(new)',
                    type: 'bar',
                    stack: 'major',
                    barWidth: 10,
                    data: majorNewAlarmQueue,
                    itemStyle: {
                        color: '#ffa500'
                    }
                },
                {
                    name: 'Major(clear)',
                    type: 'bar',
                    stack: 'major',
                    barWidth: 10,
                    data: majorClearAlarmQueue,
                    itemStyle: {
                        color: '#ffa500'
                    }
                },
                {
                    name: 'Minor(new)',
                    type: 'bar',
                    stack: 'minor',
                    barWidth: 10,
                    data: minorNewAlarmQueue,
                    itemStyle: {
                        color: '#fce029'
                        // color: '#29b1ff'
                    }
                },
                {
                    name: 'Minor(clear)',
                    type: 'bar',
                    stack: 'minor',
                    barWidth: 10,
                    data: minorClearAlarmQueue,
                    itemStyle: {
                        color: '#fce029'
                        // color: '#29b1ff'
                    }
                },
                {
                    name: 'Warning(new)',
                    type: 'bar',
                    stack: 'warning',
                    barWidth: 10,
                    data: warningNewAlarmQueue,
                    itemStyle: {
                        color: '#29b1ff'
                        // color: '#fce029'
                    }
                },
                {
                    name: 'Warning(clear)',
                    type: 'bar',
                    stack: 'warning',
                    barWidth: 10,
                    data: warningClearAlarmQueue,
                    itemStyle: {
                        color: '#29b1ff'
                        // color: '#fce029'
                    }
                },
            ]
        };

        alarmTrendChart.current.setOption(option);

    };
    let data_keys = {
        "id": {
            label: getText("ID"),
        },
        "date": {
            label: getText("Date"),
        },

    };
    if (alarmCount !== null && Object.keys(alarmCount).length > 0) {
        Object.keys(alarmCount).map(key => {
            data_keys[key] = {
                label: getText(key)
            };
        });
    }
    let exportConfig = extendCustomConfig(default_export_config, {
        tableConfig: {
            tableHead: data_keys,
            multiHead: {
                enabled: false,
            },
            autoCreateIdCol: {
                show: true,
                label: "ID"
            }
        },
        dataInfo: {
            getShowData: () => {
                let showData = [];
                if ((alarmCount !== null && Object.keys(alarmCount).length > 0) && (!isNullOrUndefined(alarmTrend) && Object.keys(alarmTrend).length > 0)) {
                    Object.keys(alarmTrend).map((ts, ind) => {
                        let data_values = {
                            "id": "" + (++ind)
                        };
                        data_values["date"] = ts;
                        let oneAlarm = alarmTrend[ts];
                        Object.keys(alarmCount).map(key => {
                            data_values[key] = "(+" + oneAlarm[key].new + ",-" + oneAlarm[key].clear + ")";
                        });

                        showData.push(data_values);

                    });
                }

                return showData;
            },
        },

    });

    return (
        <div className="widget-wrapper">
            <div className="widget-header">
                <span className="glyphicon glyphicon-exclamation-sign"/>
                {getText("alarm-counters")}
                <a href={`/webgui_help/${getHelpUrl("dashboard")}`} target="_webgui_help">
                    <span className="iconfont icon-help helpIcon tabHelpIcon"/>
                </a>
                <span className="dashboard-export">
                    <DropMenuButton tableConfig={exportConfig.tableConfig} item={exportConfig.items} type={1}
                                    pageInfo={exportConfig.dataInfo}/>
                </span>
            </div>
            <div className={"widget-content"}>
                <div className="widget-counter counter-alarm">
                    {getSeverityDiagramHtml(alarmCount)}
                </div>
                <div className="widget-counter">
                    {getSeveritySpanHtml(alarmCount)}
                </div>
                <div id="AlarmStatistics">
                </div>
            </div>
        </div>
    );
}

