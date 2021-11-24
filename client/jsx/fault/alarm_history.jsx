import {relateConfig} from "./alarm";

function alarmHistoryView(hashCodeStr) {
    let options = {
        resetButton: {
            show: false
        },
        reloadBtn: {
            enabled: false
        },
        rowEdit: [
            relateConfig(hashCodeStr)
        ]
    }

    return options;
}

export {alarmHistoryView}