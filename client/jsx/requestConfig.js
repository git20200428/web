let requestConfig = {
    "standing-condition": {
        "get": [
            {
                "from": "standing-condition"
            }
        ]
    },
    "equipment": {
        "get": [
            {
                "select": ["name", "actual-type"],
                "from": "slot"
            },
            {
                "select": ["name", "slot-name", "required-type", "admin-state", "oper-state"],
                "from": "card"
            },
            {"from": "led"},
            {
                "select": ["name", "tom", "port-type", "admin-state", "oper-state"],
                "from": "port"
            },
        ]
    },
    "temperature": {
        "get": [
            {
                "select": ["name"],
                "from": "card"
            },
            {
                "select": ["name",],
                "from": "chassis"
            },
        ]

    },

    "facility": {
        "type": "dashboard"
    },
    "filter-alarm": {
        "get": [
            {
                "from": "alarm",
                "where": {
                    "alarm": {
                        "resource": "{0}"
                    }
                }
            }
        ]
    },
    "pm-resource": {
        "get": [
            {
                "select": ["*", "pm-control-entry"],
                "from": "pm-resource",
            }
        ]
    },
    "bandwidth-statistics": {
        "get": [
            {
                "from": "xcon"
            },
            {
                "from": "super-channel"
            },
            {
                "select": ["AID", "name", "slot-name", "chassis-name"],
                "from": "card"
            }
        ]
    },
    "filter-service": {
        "get": [
            {
                "from": "xcon"
            },
            {
                "select": ["AID", "name"],
                "from": "card",
            },
            {
                "select": ["AID", "name"],
                "from": "port",
            }
        ]
    },
}

String.prototype.format = function () {
    if (arguments.length == 0) return this;
    let s = this;
    for (let i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};

let getRequest = function (type, parameters) {
    if (requestConfig.hasOwnProperty(type)) {
        let _cfg = requestConfig[type];
        let _cfgString = JSON.stringify(_cfg);
        if (parameters != null && parameters.length > 0) {
            for (let i = 0; i < parameters.length; i++) {
                _cfgString = _cfgString.format(parameters[i]);
            }
        }
        return JSON.parse(_cfgString);
    } else {
        console.warn("The type '" + type + "' can not found!");
        return null;
    }
}

export default getRequest;
