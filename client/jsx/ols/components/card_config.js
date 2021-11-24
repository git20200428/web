/**
 * Created by YaFeng on 2/9/2021.
 */
const cardConfig = {
    defaultCard: {
        innerInd: 1,
        x: 125,
        y: 20,
        rx: 2,
        ry: 2,
        width: 450,
        height: 450,
        stroke: {
            color: "green",
            width: 2,
        },
        fill: "#E0F3FF",
        ports: [
            {
                innerInd: "1-1",
                x: 50,
                y: 180,
                rx: 2,
                ry: 2,
                width: 150,
                height: 150,
                stroke: {
                    color: "green",
                    width: 2,
                },
                fill: "#E0F3FF",
                contextMenu: [],
                role: "Ingress",
                rxIn: {},
                txIn: {},
                rxOut: {},
                txOut: {}

            },
            {
                innerInd: "1-2",
                x: 50 + 450,
                y: 180,
                rx: 2,
                ry: 2,
                width: 150,
                height: 150,
                stroke: {
                    color: "green",
                    width: 2,
                },
                fill: "#E0F3FF",
                contextMenu: [],
                role: "Egress",
                rxIn: {},
                txIn: {},
                rxOut: {},
                txOut: {}
            }
        ],
        contextMenu: [],

    },

    XXXCard: {
        innerInd: 2,
        x: 125,
        y: 20,
        rx: 2,
        ry: 2,
        width: 450,
        height: 450,
        stroke: {
            color: "green",
            width: 2,
        },
        fill: "#E0F3FF",
        ports: [
            {
                innerInd: "2-1",
                x: 50,
                y: 180,
                rx: 2,
                ry: 2,
                width: 150,
                height: 150,
                stroke: {
                    color: "green",
                    width: 2,
                },
                fill: "#E0F3FF",
                contextMenu: [],
                role: "Ingress",
                rxIn: {},
                txIn: {},
                rxOut: {},
                txOut: {}

            },
            {
                innerInd: "2-2",
                x: 50 + 450,
                y: 180,
                rx: 2,
                ry: 2,
                width: 150,
                height: 150,
                stroke: {
                    color: "green",
                    width: 2,
                },
                fill: "#E0F3FF",
                contextMenu: [],
                role: "Egress",
                rxIn: {},
                txIn: {},
                rxOut: {},
                txOut: {}

            }
        ],
        contextMenu: [],

    },

    WS04SCard_Ingress: {
        innerInd: 3,
        x: 125,
        y: 20,
        rx: 2,
        ry: 2,
        width: 450,
        height: 450,
        stroke: {
            color: "green",
            width: 2,
        },
        fill: "#E0F3FF",
        splitter: {
            innerInd: "3-2",
            x: 455,
            y: 75,
            rx: 2,
            ry: 2,
            width: 100,
            height: 150,
            stroke: {
                color: "green",
                width: 2,
            },
            fill: "#E0F3FF",
            text: {
                text: "splitter",
                rotate: 90
            },
            ade: {
                "ade1": {
                    innerInd: 1,
                    x1: 455,
                    y1: 105,
                    x2: 485,
                    y2: 105,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade2": {
                    innerInd: 1,
                    x1: 455,
                    y1: 135,
                    x2: 485,
                    y2: 135,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade3": {
                    innerInd: 1,
                    x1: 455,
                    y1: 165,
                    x2: 485,
                    y2: 165,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade4": {
                    innerInd: 1,
                    x1: 455,
                    y1: 195,
                    x2: 485,
                    y2: 195,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
            },
            role: "Egress",
            rxIn: {},
            txIn: {},
            rxOut: {},
            txOut: {}

        },
        wss: {
            innerInd: "3-1",
            x: 455,
            y: 265,
            rx: 2,
            ry: 2,
            width: 100,
            height: 150,
            stroke: {
                color: "green",
                width: 2,
            },
            fill: "#E0F3FF",
            text: {
                text: "wss",
                rotate: 90
            },
            ade: {
                "ade1": {
                    innerInd: 1,
                    x1: 485,
                    y1: 295,
                    x2: 455,
                    y2: 295,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade2": {
                    innerInd: 1,
                    x1: 485,
                    y1: 325,
                    x2: 455,
                    y2: 325,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade3": {
                    innerInd: 1,
                    x1: 485,
                    y1: 355,
                    x2: 455,
                    y2: 355,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade4": {
                    innerInd: 1,
                    x1: 485,
                    y1: 385,
                    x2: 455,
                    y2: 385,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
            },

            role: "Egress",
            rxIn: {},
            txIn: {},
            rxOut: {},
            txOut: {}

        },
        ports: [
            {
                innerInd: "2-1",
                x: 50,
                y: 100,
                rx: 2,
                ry: 2,
                width: 150,
                height: 300,
                stroke: {
                    color: "green",
                    width: 2,
                },
                fill: "#E0F3FF",
                contextMenu: [],
                role: "Ingress",
                rxIn: {},
                txIn: {},
                rxOut: {},
                txOut: {}

            },
        ],
        contextMenu: [],
        text: {
            text: "WS04S",
            direction: "horizontal",
            color: "green"

        },
        role: "Ingress"

    },

    WS04SCard_Egress: {
        innerInd: 3,
        x: 125,
        y: 20,
        rx: 2,
        ry: 2,
        width: 450,
        height: 450,
        stroke: {
            color: "green",
            width: 2,
        },
        fill: "#E0F3FF",
        wss: {
            innerInd: "3-2",
            x: 455,
            y: 75,
            rx: 2,
            ry: 2,
            width: 100,
            height: 150,
            stroke: {
                color: "green",
                width: 2,
            },
            fill: "#E0F3FF",
            text: {
                text: "splitter",
                rotate: 90
            },
            ade: {
                "ade1": {
                    innerInd: 1,
                    x1: 455,
                    y1: 105,
                    x2: 485,
                    y2: 105,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade2": {
                    innerInd: 1,
                    x1: 455,
                    y1: 135,
                    x2: 485,
                    y2: 135,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade3": {
                    innerInd: 1,
                    x1: 455,
                    y1: 165,
                    x2: 485,
                    y2: 165,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade4": {
                    innerInd: 1,
                    x1: 455,
                    y1: 195,
                    x2: 485,
                    y2: 195,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
            },
            role: "Egress",
            rxIn: {},
            txIn: {},
            rxOut: {},
            txOut: {}

        },
        splitter: {
            innerInd: "3-1",
            x: 455,
            y: 265,
            rx: 2,
            ry: 2,
            width: 100,
            height: 150,
            stroke: {
                color: "green",
                width: 2,
            },
            fill: "#E0F3FF",
            text: {
                text: "wss",
                rotate: 90
            },
            ade: {
                "ade1": {
                    innerInd: 1,
                    x1: 485,
                    y1: 295,
                    x2: 455,
                    y2: 295,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade2": {
                    innerInd: 1,
                    x1: 485,
                    y1: 325,
                    x2: 455,
                    y2: 325,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade3": {
                    innerInd: 1,
                    x1: 485,
                    y1: 355,
                    x2: 455,
                    y2: 355,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
                "ade4": {
                    innerInd: 1,
                    x1: 485,
                    y1: 385,
                    x2: 455,
                    y2: 385,
                    stroke: {
                        color: "green",
                        width: 2,
                    },
                    fill: "#E0F3FF",
                    contextMenu: [],
                    arrow: {
                        at: "end",
                        color: "green",
                        width: 2
                    },
                    rxIn: {},
                    txIn: {},
                    rxOut: {},
                    txOut: {}
                },
            },

            role: "Egress",
            rxIn: {},
            txIn: {},
            rxOut: {},
            txOut: {}

        },
        ports: [
            {
                innerInd: "2-1",
                x: 50,
                y: 100,
                rx: 2,
                ry: 2,
                width: 150,
                height: 300,
                stroke: {
                    color: "green",
                    width: 2,
                },
                fill: "#E0F3FF",
                contextMenu: [],
                role: "Ingress",
                rxIn: {},
                txIn: {},
                rxOut: {},
                txOut: {}

            },
        ],
        contextMenu: [],
        text: {
            text: "WS04S",
            direction: "horizontal",
            color: "green"

        },
        role: "Egress"

    },

    defaultLink: {
        innerInd: 1,
        x1: 20,
        y1: 20,
        x2: 40,
        y2: 40,
        stroke: {
            color: "green",
            width: 2,
        },
        fill: "#E0F3FF",
        contextMenu: [],
        arrow: {
            at: "middle",
            color: "green",
            width: 2
        }

    },
}
export default cardConfig;