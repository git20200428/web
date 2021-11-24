import React from "react";


let alarmProfileView = function (hashCodeStr) {
    let options = {
        pageBtn: {
            show: true
        },
        pageSize: {
            show: true,
            defaultSize: 20
        },
        leftBottomInfo: {
            show: true
        },
        firstAndLast: {
            show: true
        },
        previousAndNext: {
            show: true
        },
        setPageSelect: {
            show: true
        },
        resetButton: {
            show: true
        },
        export: {
            export_csv: {
                enabled: true
            },
            export_pdf: {
                enabled: true
            },
        },
        footPanel: {
            show: true
        },

    }
    return options;

};
export {alarmProfileView};
