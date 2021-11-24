// 1RU = 1.72inch = 43.6mm
// 1inch = 25.4mm
import {
    findObjByTag,
    getEntityPathByKey,
    getText,
    confirmToast
} from "../jsx/custom/utils";
import {
    createItem,
    deleteItem,
    detailsItem,
    editItem,
    editRpcItem
} from "../jsx/custom/comm/react_common";

const SUPPORTED_TYPE = "supported-type";
const REQ_TYPE = "required-type";

const chassisConfig = {
    G42: {
        height: 275,
        slot: {
            1: {
                type: "xmm4",
                location: "front",
                left: 44,
                top: 3
            },
            2: {
                type: "iopanel",
                location: "front",
                left: 385,
                top: 3
            },
            3: {
                type: "xmm4",
                location: "front",
                left: 563,
                top: 3
            },
            4: {
                type: "chm6",
                location: "front",
                left: 44,
                top: 90
            },
            5: {
                type: "chm6",
                location: "front",
                left: 474,
                top: 90
            },
            6: {
                type: "chm6",
                location: "front",
                left: 44,
                top: 177
            },
            7: {
                type: "chm6",
                location: "front",
                left: 474,
                top: 177
            },
            "PEM-1": {
                type: "pem",
                location: "rear",
                left: 734,
                top: 4
            },
            "PEM-2": {
                type: "pem",
                location: "rear",
                left: 568,
                top: 4
            },
            "FAN-6": {
                type: "xmm4-fan",
                location: "rear",
                left: 473,
                top: 4
            },
            "FAN-7": {
                type: "xmm4-fan",
                location: "rear",
                left: 378,
                top: 4
            },
            "PEM-3": {
                type: "pem",
                location: "rear",
                left: 212,
                top: 4
            },
            "PEM-4": {
                type: "pem",
                location: "rear",
                left: 46,
                top: 4
            },
            "FAN-1": {
                type: "fan",
                location: "rear",
                left: 762,
                top: 90
            },
            "FAN-2": {
                type: "fan",
                location: "rear",
                left: 602,
                top: 90
            },
            "FAN-3": {
                type: "fan",
                location: "rear",
                left: 364,
                top: 90
            },
            "FANCTRL-1": {
                type: "fan-ctrl",
                location: "rear",
                left: 524,
                top: 90
            },
            "FAN-4": {
                type: "fan",
                location: "rear",
                left: 204,
                top: 90
            },
            "FAN-5": {
                type: "fan",
                location: "rear",
                left: 46,
                top: 90
            }
        },
        card: {
            XMM4: {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {
                    "AUX-1": {
                        left: 109,
                        top: 28,
                        rotate: 180
                    },
                    "AUX-2": {
                        left: 68,
                        top: 28,
                        rotate: 180
                    },
                    CRAFT: {
                        left: 188,
                        top: 3
                    },
                    DCN: {
                        left: 109,
                        top: 3
                    },
                    U1: {
                        left: 230,
                        top: 29
                    }
                },
                led: {
                    power: {
                        left: 247,
                        top: 29
                    },
                    "node-ctrl": {
                        left: 247,
                        top: 37
                    },
                    active: {
                        left: 247,
                        top: 45
                    },
                    fault: {
                        left: 247,
                        top: 53
                    }
                }
            },
            IOPANEL: {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {
                    U1: {
                        left: 98,
                        top: 9,
                        rotate: 90
                    },
                    U2: {
                        left: 128,
                        top: 9,
                        rotate: 90
                    }
                },
                led: {
                    power: {
                        left: 27,
                        top: 9
                    },
                    fault: {
                        left: 27,
                        top: 15
                    },
                    "pem-fan-fault": {
                        left: 43,
                        top: 9
                    },
                    "power-fault": {
                        left: 43,
                        top: 15
                    },
                    "chassis-critical": {
                        left: 54,
                        top: 9
                    },
                    "chassis-major": {
                        left: 65,
                        top: 9
                    },
                    "chassis-minor": {
                        left: 76,
                        top: 9
                    },
                    "node-critical": {
                        left: 54,
                        top: 15
                    },
                    "node-major": {
                        left: 65,
                        top: 15
                    },
                    "node-minor": {
                        left: 76,
                        top: 15
                    }
                }
            },
            CHM6: {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {
                    L1: {
                        left: 17,
                        top: 6,
                        led: {
                            active: {
                                left: 4,
                                top: 27
                            },
                            LOS: {
                                left: 16,
                                top: 27
                            }
                        }
                    },
                    L2: {
                        left: 17,
                        top: 52,
                        led: {
                            active: {
                                left: 4,
                                top: -8
                            },
                            LOS: {
                                left: 16,
                                top: -8
                            }
                        }
                    },
                    T1: {
                        left: 57,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T2: {
                        left: 95,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T3: {
                        left: 133,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T4: {
                        left: 171,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T5: {
                        left: 209,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T6: {
                        left: 247,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T7: {
                        left: 285,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T8: {
                        left: 323,
                        top: 4,
                        led: {
                            active: {
                                left: 10,
                                top: 27
                            },
                            FLT: {
                                left: 22,
                                top: 27
                            }
                        }
                    },
                    T9: {
                        left: 323,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    },
                    T10: {
                        left: 285,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    },
                    T11: {
                        left: 247,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    },
                    T12: {
                        left: 209,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    },
                    T13: {
                        left: 171,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    },
                    T14: {
                        left: 133,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    },
                    T15: {
                        left: 95,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    },
                    T16: {
                        left: 57,
                        top: 50,
                        led: {
                            active: {
                                left: 22,
                                top: -7
                            },
                            FLT: {
                                left: 10,
                                top: -7
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 395,
                        top: 39
                    },
                    fault: {
                        left: 384,
                        top: 39
                    },
                    power: {
                        left: 373,
                        top: 39
                    }
                }
            },
            UCM4: {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {
                    T1: {
                        left: 21,
                        top: 13,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T2: {
                        left: 71,
                        top: 13,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T3: {
                        left: 21,
                        top: 42,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T4: {
                        left: 71,
                        top: 42,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T5: {
                        left: 130,
                        top: 13,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T6: {
                        left: 180,
                        top: 13,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T7: {
                        left: 230,
                        top: 13,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T8: {
                        left: 280,
                        top: 13,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T9: {
                        left: 330,
                        top: 13,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T10: {
                        left: 130,
                        top: 42,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T11: {
                        left: 180,
                        top: 42,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T12: {
                        left: 230,
                        top: 42,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T13: {
                        left: 280,
                        top: 42,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    },
                    T14: {
                        left: 330,
                        top: 42,
                        led: {
                            active: {
                                left: -8,
                                top: 13
                            },
                            FLT: {
                                left: -8,
                                top: 6
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 392,
                        top: 36
                    },
                    fault: {
                        left: 392,
                        top: 22
                    },
                    power: {
                        left: 392,
                        top: 50
                    }
                }
            },
            PEM: {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {},
                led: {
                    status: {
                        left: 12,
                        top: 23
                    }
                }
            },
            "XMM4-FAN": {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {},
                led: {}
            },
            FAN: {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {},
                led: {}
            },
            "FAN-CTRL": {
                cfg: {
                    left: 20,
                    top: 0
                },
                port: {},
                led: {
                    power: {
                        left: 16,
                        top: 15
                    },
                    fault: {
                        left: 16,
                        top: 30
                    },
                    "fan6-fault": {
                        left: 16,
                        top: 45
                    },
                    "fan7-fault": {
                        left: 16,
                        top: 60
                    },
                    "fan1-fault": {
                        left: 16,
                        top: 76
                    },
                    "fan2-fault": {
                        left: 16,
                        top: 92
                    },
                    "fan3-fault": {
                        left: 16,
                        top: 107
                    },
                    "fan4-fault": {
                        left: 16,
                        top: 123
                    },
                    "fan5-fault": {
                        left: 16,
                        top: 138
                    }
                }
            },
            BLANK: {
                cfg: {
                    left: 20,
                    top: 0
                }
            }
        },
        fixedPort: {
            XMM4: {
                "NCT-1": {
                    left: 148,
                    top: 3
                },
                "NCT-2": {
                    left: 148,
                    top: 28,
                    rotate: 180
                },
                "RS-232": {
                    left: 188,
                    top: 28,
                    rotate: 180
                }
            }
        }
    },
    G31: {
        height: 242,
        slot: {
            1: {
                type: "chm1r",
                location: "front",
                left: 49,
                top: 3
            },
            2: {
                type: "chm1r",
                location: "front",
                left: 282,
                top: 3
            },
            3: {
                type: "chm1r",
                location: "front",
                left: 515,
                top: 3
            },
            4: {
                type: "chm1r",
                location: "front",
                left: 748,
                top: 3
            },
            5: {
                type: "frcu31",
                location: "front",
                left: 981,
                top: 3
            },
            6: {
                type: "fan",
                location: "rear",
                left: 45,
                top: 3
            },
            7: {
                type: "pem",
                location: "rear",
                left: 235,
                top: 3
            },
            8: {
                type: "fan",
                location: "rear",
                left: 425,
                top: 3
            },
            9: {
                type: "pem",
                location: "rear",
                left: 615,
                top: 3
            },
            10: {
                type: "fan",
                location: "rear",
                left: 805,
                top: 3
            },
            11: {
                type: "iopanel",
                location: "rear",
                left: 995,
                top: 3
            }
        },
        card: {
            FRCU31: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    U1: {
                        left: 42,
                        top: 18
                    },
                    ETH1: {
                        left: 55,
                        top: 14
                    }
                },
                led: {
                    power: {
                        left: 17,
                        top: 50
                    },
                    "node-ctrl": {
                        left: 26,
                        top: 58
                    },
                    active: {
                        left: 17,
                        top: 58
                    },
                    alarm: {
                        left: 26,
                        top: 50
                    }
                }
            },
            IOPANEL: {
                cfg: {
                    left: 0,
                    top: 15
                },
                port: {
                    ETH2: {
                        left: 10,
                        top: 13,
                        rotate: -90
                    },
                    ETH3: {
                        left: 40,
                        top: 13,
                        rotate: 90
                    },
                    ETH4: {
                        left: 10,
                        top: 47,
                        rotate: -90
                    },
                    ETH5: {
                        left: 40,
                        top: 47,
                        rotate: 90
                    }
                },
                led: {
                    active: {
                        left: 43,
                        top: 84
                    },
                    fault: {
                        left: 52,
                        top: 84
                    }
                }
            },
            CHM1R: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    "1": {
                        left: 18,
                        top: 7,
                        led: {
                            port: {
                                left: -11,
                                top: 7
                            }
                        }
                    },
                    "2": {
                        left: 120,
                        top: 7,
                        led: {
                            port: {
                                left: 99,
                                top: 7
                            }
                        }
                    },
                    "3": {
                        left: 33,
                        top: 48,
                        led: {
                            port: {
                                left: -14,
                                top: 4
                            }
                        }
                    },
                    "4": {
                        left: 77,
                        top: 48,
                        led: {
                            port: {
                                left: -58,
                                top: 15
                            }
                        }
                    },
                    "5": {
                        left: 120,
                        top: 48,
                        led: {
                            port: {
                                left: 87,
                                top: 4
                            }
                        }
                    },
                    "6": {
                        left: 164,
                        top: 48,
                        led: {
                            port: {
                                left: 43,
                                top: 15
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 221,
                        top: 52
                    },
                    fault: {
                        left: 221,
                        top: 28
                    }
                }
            },
            PEM: {
                cfg: {
                    left: 0,
                    top: 15
                },
                port: {},
                led: {
                    status: {
                        left: 10,
                        top: 60
                    }
                }
            },
            UTM2: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    "1": {
                        left: 16,
                        top: 7,
                        led: {
                            port: {
                                left: -8,
                                top: 10
                            }
                        }
                    },
                    "2": {
                        left: 112,
                        top: 7,
                        led: {
                            port: {
                                left: 99,
                                top: 12
                            }
                        }
                    },
                    "3": {
                        left: 40,
                        top: 43,
                        led: {
                            port: {
                                left: -12,
                                top: 10
                            }
                        }
                    },
                    "4": {
                        left: 80,
                        top: 43,
                        led: {
                            port: {
                                left: -52,
                                top: 20
                            }
                        }
                    },
                    "5": {
                        left: 120,
                        top: 43,
                        led: {
                            port: {
                                left: 84,
                                top: 10
                            }
                        }
                    },
                    "6": {
                        left: 160,
                        top: 43,
                        led: {
                            port: {
                                left: 44,
                                top: 20
                            }
                        }
                    },
                    "7": {
                        left: 222,
                        top: 17,
                        led: {
                            port: {
                                left: 25,
                                top: -9
                            }
                        }
                    },
                    "8": {
                        left: 260,
                        top: 17,
                        led: {
                            port: {
                                left: 5,
                                top: -9
                            }
                        }
                    },
                    "9": {
                        left: 298,
                        top: 17,
                        led: {
                            port: {
                                left: 25,
                                top: -9
                            }
                        }
                    },
                    "10": {
                        left: 336,
                        top: 17,
                        led: {
                            port: {
                                left: -1,
                                top: -9
                            }
                        }
                    },
                    "11": {
                        left: 374,
                        top: 17,
                        led: {
                            port: {
                                left: 23,
                                top: -9
                            }
                        }
                    },
                    "12": {
                        left: 412,
                        top: 17,
                        led: {
                            port: {
                                left: 5,
                                top: -9
                            }
                        }
                    },
                    "13": {
                        left: 222,
                        top: 45,
                        led: {
                            port: {
                                left: 35,
                                top: 29
                            }
                        }
                    },
                    "14": {
                        left: 260,
                        top: 45,
                        led: {
                            port: {
                                left: 10,
                                top: 29
                            }
                        }
                    },
                    "15": {
                        left: 298,
                        top: 45,
                        led: {
                            port: {
                                left: 35,
                                top: 29
                            }
                        }
                    },
                    "16": {
                        left: 336,
                        top: 45,
                        led: {
                            port: {
                                left: 10,
                                top: 29
                            }
                        }
                    },
                    "17": {
                        left: 374,
                        top: 45,
                        led: {
                            port: {
                                left: 35,
                                top: 29
                            }
                        }
                    },
                    "18": {
                        left: 412,
                        top: 45,
                        led: {
                            port: {
                                left: 10,
                                top: 29
                            }
                        }
                    },
                },
                led: {
                    fault: {
                        left: 454,
                        top: 14
                    },
                    active: {
                        left: 454,
                        top: 56
                    }
                }
            },
            XTM2: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    T16: {
                        left: 189,
                        top: 10,
                        led: {
                            active: {
                                left: 3,
                                top: 28
                            },
                            FLT: {
                                left: 10,
                                top: 28
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 23,
                        top: 5
                    },
                    fault: {
                        left: 33,
                        top: 5
                    },
                    power: {
                        left: 43,
                        top: 5
                    }
                }
            },
            CHM2: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    T16: {
                        left: 189,
                        top: 10,
                        led: {
                            active: {
                                left: 3,
                                top: 28
                            },
                            FLT: {
                                left: 10,
                                top: 28
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 23,
                        top: 5
                    },
                    fault: {
                        left: 33,
                        top: 5
                    },
                    power: {
                        left: 43,
                        top: 5
                    }
                }
            },
            CHM2T: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    T16: {
                        left: 189,
                        top: 10,
                        led: {
                            active: {
                                left: 3,
                                top: 28
                            },
                            FLT: {
                                left: 10,
                                top: 28
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 23,
                        top: 5
                    },
                    fault: {
                        left: 33,
                        top: 5
                    },
                    power: {
                        left: 43,
                        top: 5
                    }
                }
            },
            OCC2: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    T16: {
                        left: 189,
                        top: 10,
                        led: {
                            active: {
                                left: 3,
                                top: 28
                            },
                            FLT: {
                                left: 10,
                                top: 28
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 23,
                        top: 5
                    },
                    fault: {
                        left: 33,
                        top: 5
                    },
                    power: {
                        left: 43,
                        top: 5
                    }
                }
            },
            "OMD48-S": {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    T16: {
                        left: 189,
                        top: 10,
                        led: {
                            active: {
                                left: 3,
                                top: 28
                            },
                            FLT: {
                                left: 10,
                                top: 28
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 23,
                        top: 5
                    },
                    fault: {
                        left: 33,
                        top: 5
                    },
                    power: {
                        left: 43,
                        top: 5
                    }
                }
            },
            OMD96: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    T16: {
                        left: 189,
                        top: 10,
                        led: {
                            active: {
                                left: 3,
                                top: 28
                            },
                            FLT: {
                                left: 10,
                                top: 28
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 23,
                        top: 5
                    },
                    fault: {
                        left: 33,
                        top: 5
                    },
                    power: {
                        left: 43,
                        top: 5
                    }
                }
            },
            RD09SM: {
                cfg: {
                    left: 0,
                    top: 16
                },
                port: {
                    T16: {
                        left: 189,
                        top: 10,
                        led: {
                            active: {
                                left: 3,
                                top: 28
                            },
                            FLT: {
                                left: 10,
                                top: 28
                            }
                        }
                    }
                },
                led: {
                    active: {
                        left: 23,
                        top: 5
                    },
                    fault: {
                        left: 33,
                        top: 5
                    },
                    power: {
                        left: 43,
                        top: 5
                    }
                }
            },
            FAN: {
                cfg: {
                    left: 0,
                    top: 15
                },
                port: {},
                led: {
                    "fan-fault": {
                        left: 169,
                        top: 5
                    }
                }
            },
            BLANK: {
                cfg: {
                    left: 20,
                    top: 0
                }
            }
        },
        fixedPort: {
            FRCU31: {
                CONSOLE: {
                    left: 55,
                    top: 44,
                    rotate: 180
                },
            },
            IOPANEL: {
                ETH2: {
                    left: 10,
                    top: 14,
                    rotate: -90
                },
                ETH3: {
                    left: 40,
                    top: 14,
                    rotate: 90
                }
            }
        }
    },
    contextMenu: {
        func: {
            restart: (initKey, type, name)=> {
                editRpcItem("restart", {
                    title: getText("restart") + ` ${type}-${name}`,
                    initKey: initKey,
                    initData: {
                        resource: getEntityPathByKey(type, initKey)
                    },
                    helpString: "restart"
                });
            }
        },
        chassis: {
            "enable_led": "",
            "disable_led": "",
            "properties": ""
        },
        slot: {
            "create_card": {
                enable: function(slot) {
                    return !slot.card && slot.hasOwnProperty(SUPPORTED_TYPE);
                },
                exec: function(slot, userRole) {
                    createItem("card", {
                        initKey: {
                            chassis: {
                                name: slot.chassisname
                            },
                            slot: {
                                name: slot.name
                            }
                        },
                        initConfigData: {
                            name: slot.name,
                            AID: slot.AID,
                            "supported-type" : slot[SUPPORTED_TYPE]
                        },
                        title: getText("card")
                    });
                }
            },
            "properties": {
                exec: function(slot, userRole) {
                    detailsItem("slot", {
                        initKey: {
                            chassis: {
                                name: slot.chassisname
                            },
                            slot: {
                                name: slot.name
                            }
                        },
                        title: getText("slot") + "-" + slot.AID
                    });
                }
            }
        },
        card: {
            "delete_card": {
                show: function(card) {
                    if( sessionStorage.neType === "G30" ) {
                        let requireType = card['required-type']
                        return !(requireType === "gx:IOPANEL" || requireType === "gx:PEM" || requireType === "gx:FRCU31" || requireType === "gx:FAN")
                    } else {
                        return true;
                    }
                },
                exec: function(card, userRole) {
                    deleteItem("card", {
                        initData: {
                            name: card.name,
                            AID: card.AID,
                            "required-type": card[REQ_TYPE],
                            "category" : card.category
                        },
                        initKey: {
                            card: {
                                name: card.name
                            }
                        },
                        title: "card-" + card.AID,
                        helpString: "deletecard"
                    }, null, null, confirmToast)
                }
            },
            "switch-over": {
                show: function(card) {
                    return sessionStorage.neType === "G40" && card["controller-card"] && (card["controller-card"]["redundancy-status"] === "active")
                        && (card["controller-card"]["redundancy-standby-status"] !== "card-not-present");
                },
                exec: function(card, userRole) {
                    let initKey = {
                        card: {
                            name: card.name
                        }
                    };
                    editRpcItem("manual-switchover", {
                        title: getText("manual-switchover"),
                        initKey: initKey,
                        initData: {
                            resource: getEntityPathByKey("card", initKey)
                        }
                    });
                }
            },
            "create-card-service": {
                show: function(card) {
                    return card["required-type"].match(/UCM4$/);
                },
                exec: function(card, userRole) {
                    console.error("Not implemented");
                }
            },
            "create_super-channel": {
                show: function(card) {
                    return card["required-type"].match(/CHM6$/);
                },
                enable: function(card) {
                    return card.hasOwnProperty("resources") && card.resources.hasOwnProperty("unassigned-carriers")
                },
                exec: function(card, userRole) {
                    chassisConfig.contextMenu.card.func.create(card, "super-channel");
                }
            },
            "create_xcon": {
                show: function(card) {
                    return card.category === "line-card";
                },
                exec: function(card, userRole) {
                    createItem("xcon", {
                        initKey: {
                            card: {
                                name: card.name
                            }
                        },
                        initData: {
                            card: card.name
                        }
                    });
                }
            },
            "enable_led": {
                show: function (card) {
                    return card.ledSupport;
                }
            },
            "disable_led": {
                show: function (card) {
                    return card.ledSupport;
                }
            },
            "restart": {
                show: function(card) {
                    return card.category === "line-card" || card.category === "controller"
                },
                exec: function(card, userRole) {
                    chassisConfig.contextMenu.func.restart({
                        card: {
                            name: card.name
                        }
                    }, "card", card.AID);
                }
            },
            "properties": "",
            "func": {
                show: false,
                create: function(card, type) {
                    createItem(type, {
                        initKey: {
                           card: {
                                name: card.name
                            }
                        },
                        initConfigData: {
                            name: card.name,
                            AID: card.AID,
                            "required-type": card[REQ_TYPE],
                            "category" : card["category"],
                        },
                        title: getText(type)
                    });
                }
            }
        },
        console : {
            "properties": {
                exec: function(card, userRole) {
                    let callFunc = userRole ? editItem : detailsItem;
                    callFunc("console", {
                        initKey: {
                            card: {
                                name: card.name
                            }
                        },
                        title: "console-" + card.AID
                    });
                }
            },
        },
        port: {
            "create_tom": {
                show: function(port) {
                    return port.hasOwnProperty("supported-type");
                },
                exec: function(port, userRole) {
                    createItem("tom", {
                        initKey: {
                            card: {
                                name: port.cardname
                            },
                            port: {
                                name: port.name
                            }
                        },
                        initConfigData: {
                            name: port.name,
                            AID: port.AID,
                            "supported-type" : port[SUPPORTED_TYPE],
                            "port-type": port["port-type"],
                            "hosted-interface": port["hosted-interface"]
                        },
                        title: getText("tom")
                    })
                }
            },
            "properties": {
                exec: function(port, userRole) {
                    let callFunc = userRole ? editItem : detailsItem;
                    callFunc("port", {
                        initKey: {
                            card: {
                                name: port.cardname
                            },
                            port: {
                                name: port.name
                            }
                        },
                        title: "port-" + port.AID
                    });
                }
            },
            func: {
                show: false,
                properties: function(type, port, userRole) {
                    let obj = findObjByTag(port, type);
                    let initKey = {};
                    initKey[type] = {
                        name: obj.name
                    };
                    let callFunc = userRole ? editItem : detailsItem;
                    callFunc(type, {
                        initKey: initKey,
                        title: type + "-" + (obj ? (obj.AID ? obj.AID : obj.name) : port.AID)
                    });
                }
            }
        },
        tom: {
            "delete_tom": {
                exec: function(port, userRole) {
                    deleteItem("tom", {
                        initData: {
                            AID: port.tom.AID,
                            portAID: port.AID,
                        },
                        initKey: {
                            card: {
                                name: port.cardname
                            },
                            port: {
                                name: port.name
                            }
                        },
                        title: "tom-" + port.tom.AID
                    }, null, null, confirmToast);
                }
            },
            "restart": {
                exec: function(port, userRole) {
                    let initKey = {
                        card: {
                            name: port.cardname
                        },
                        port: {
                            name: port.name
                        }
                    };
                    chassisConfig.contextMenu.func.restart(initKey, "tom", port.tom.AID);
                }
            },
            "create_flexo-group": {
                show: function(port) {
                    return port.hasOwnProperty("line-ptp");
                },
                enable: function(port) {
                    return port["line-ptp"]["unassigned-carriers"];
                },
                exec: function(port, userRole) {
                    createItem("flexo-group", {
                        initKey: {
                            card: {
                                name: port.cardname
                            }
                        },
                        initConfigData: {
                            AID: port["line-ptp"].AID
                        },
                        title: getText("flexo-group")
                    });
                }
            },
            "create_eth-zr": {
                show: function(port) {
                    return port.hasOwnProperty("line-ptp");
                },
                enable: function(port) {
                    return port["line-ptp"]["unassigned-carriers"];
                },
                exec: function(port, userRole) {
                    createItem("eth-zr", {
                        initKey: {
                            card: {
                                name: port.cardname
                            }
                        },
                        initConfigData: {
                            AID: port["line-ptp"].AID
                        },
                        title: getText("eth-zr")
                    });
                }
            },
            "properties_port": {
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.properties.exec(port, userRole);
                }
            },
            "properties_trib-ptp": {
                show: function(portData) {
                    return portData.hasOwnProperty("trib-ptp");
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("trib-ptp", port, userRole);
                }
            },
            "properties_line-ptp": {
                show: function(portData) {
                    return portData.hasOwnProperty("line-ptp");
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("line-ptp", port, userRole);
                }
            },
            "properties_ethernet": {
                show: function(portData) {
                    return portData.hasOwnProperty("trib-ptp") && (
                        portData["trib-ptp"].hasOwnProperty("ethernet") ||
                        (portData["trib-ptp"].hasOwnProperty("optical-carrier") && portData["trib-ptp"]["optical-carrier"].hasOwnProperty("ethernet")));
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("ethernet", port, userRole);
                }
            },
            "properties_otu": {
                show: function(portData) {
                    return portData.hasOwnProperty("trib-ptp") && portData["trib-ptp"].hasOwnProperty("otu");
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("otu", port, userRole);
                }
            },
            "properties_odu": {
                show: function(port) {
                    return port.hasOwnProperty("trib-ptp") && port["trib-ptp"].hasOwnProperty("otu") && port["trib-ptp"]["otu"].hasOwnProperty("odu");
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("odu", port, userRole);
                }
            },
            "properties_optical-carrier": {
                show: function(portData) {
                    return findObjByTag(portData, "optical-carrier") !== null;
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("optical-carrier", port, userRole);
                }
            },
            "properties_flexo": {
                show: function(portData) {
                    return findObjByTag(portData, "flexo") !== null;
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("flexo-group", port, userRole);
                }
            },
            "properties_eth-zr": {
                show: function(portData) {
                    return findObjByTag(portData, "eth-zr") !== null;
                },
                exec: function(port, userRole) {
                    chassisConfig.contextMenu.port.func.properties("eth-zr", port, userRole);
                }
            },
            "properties": {
                exec: function(port, userRole) {
                    let callFunc = userRole ? editItem : detailsItem;
                    callFunc("tom", {
                        initKey: {
                            card: {
                                name: port.cardname
                            },
                            port: {
                                name: port.name
                            }
                        },
                        title: "tom-" + port.tom.AID
                    });
                }
            }
        }
    },
    relate: {
        "chassis": {
            xpath: function (chassis) {
                return {
                    chassis: {
                        name: chassis.name
                    }
                }
            },
            items: [{
                "filter-slot": {
                    insert: "after",
                    request: function (data) {
                        return {
                            "requestType": "cache",
                            "select": ["slot"],
                            "from": "chassis",
                            "rsKey": "slot",
                            "where": {
                                "chassis": {"name": data.chassis.name}
                            }
                        }
                    }
                }
            },
            {
                "card": {
                    insert: "after",
                    request: function (data) {
                        return {
                            "requestType": "cache",
                            "from": "card",
                            "where": {
                                "card": {"chassis-name": data.name}
                            }
                        }
                    }
                }
            }]
        },
        "slot": {
            xpath: function(slot) {
                return {
                    chassis: {
                        name: slot.chassisname
                    },
                    slot: {
                        name: slot.name
                    }
                }
            },
            items: [{
                "card": {
                    insert: "after",
                    request: function (data) {
                        return {
                            "requestType": "cache",
                            "from": "card",
                            "where": {
                                "card": {
                                    "chassis-name": data.chassis.name,
                                    "slot-name": data.slot.name,
                                }
                            }
                        }
                    }
                }
            }]
        },
        "card": {
            xpath: function(card) {
                return {
                    card: {
                        name: card.name
                    }
                }
            },
            items: [{
                "filter-port": {
                    insert: "after",
                    enable: function (card) {
                        return !(card != null && (card["required-type"].indexOf("FAN") > -1 || card["required-type"].indexOf("PEM") > -1));
                    },
                    request: function (data) {
                        return {
                            "requestType": "cache",
                            "select": ["port"],
                            "from": "card",
                            "rsKey": "port",
                            "where": {
                                "card": {"name": data.card.name}
                            }
                        }
                    }
                }
            }]
        },
        "console" : {
            xpath: function(card) {
                return {
                    card: {
                        name: card.name
                    }
                }
            },
            items: [
                {
                    "event": {
                        insert: "before",
                        containerKey: "console",
                        extends: "filter-event",

                    }
                },
            ]
        },
        port: {
            xpath: function(port) {
                return {
                    card: {
                        name: port.cardname
                    },
                    port: {
                        name: port.name
                    }
                }
            }
        },
        "tom": {
            xpath: function(port) {
                return {
                    card: {
                        name: port.cardname
                    },
                    port: {
                        name: port.name
                    }
                }
            },
            items: [{
                "port-inventory": {
                    insert: "before",
                    containerKey: "port",
                    extends: "port.inventory"
                }
            },
            {
                "port-alarm": {
                    insert: "before",
                    containerKey: "port",
                    extends: "filter-alarm",
                }
            },
            {
                "port-event": {
                    insert: "before",
                    containerKey: "port",
                    extends: "filter-event",

                }
            },
            {
                "port-facilities": {
                    insert: "before",
                    enable: function (port) {
                        return port != null && (port["port-type"] === "line" ||
                            (port["port-type"] === "tributary" && port.hasOwnProperty("hosted-interface")));
                    },
                    containerKey: "port",
                    extends: "filter-facilities",
                }
            }]
        }
    }
};

export default chassisConfig;
