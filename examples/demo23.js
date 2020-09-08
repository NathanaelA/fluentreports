"use strict";

const ReportBuilder = require('../lib/fluentReportsBuilder').ReportBuilder;
const displayReport = require('./reportDisplayer');


const data = [
    {
        "date": "01/01/2020",
        "items": [
            {
                "group": 1,
                "number": 1,
                "blah": [
                    {"hi": 11},
                    {"hi": 12}
                ]
            },
            {
                "group": 2,
                "number": 2,
                "blah": [
                    {"hi": 22},
                    {"hi": 23}
                ]
            }
        ],
        "itemsold": [
            {
                "group": 3,
                "number": 3,
                "blah2": [
                    {"hi": 33},
                    {"hi": 34}
                ]
            },
            {
                "group": 4,
                "number": 4,
                "blah2": [
                    {"hi": 44},
                    {"hi": 45}
                ]
            }

        ]
    }
];

// Reports can have multiple States; by default they have one State, so all states will be directed to this value
// However, a specific "type" can have its own state; called "state: <number>"
// All functions that are created should be "function (report, data, state, vars)"

let reportData =
    {
        "type": "report",
        "dataUUID": 10002,
        "fontSize": 0,
        "autoPrint": false,
        "name": "demo23.pdf",
        "paperSize": "letter",
        "paperOrientation": "portrait",
        "fonts": [],
        "variables": {
            "test": "1",
            "temp": "5"
        },
        "subReports": [
            {
                "dataUUID": 10003,
                "dataType": "parent",
                "data": "items",
                "subReports": [
                    {
                        "dataUUID": 10004,
                        "dataType": "parent",
                        "data": "blah",
                        "type": "report",
                        "detail": [
                            {
                                "text": "Subreport items/blah Data",
                                "settings": {
                                    "align": 0,
                                    "absoluteY": 0,
                                },
                                "type": "print"
                            },
                            {
                                "type": "print",
                                "settings": {
                                    "absoluteX": 210,
                                    "absoluteY": 0,
                                    "align": 0
                                },
                                "field": "hi"
                            },
                            {
                                "type": "print",
                                "settings": {
                                    "absoluteX": 190,
                                    "absoluteY": 0,
                                    "align": 0
                                },
                                "variable": "temp"
                            }
                        ]
                    }
                ],
                "calcs": {
                    "sum": [
                        "group"
                    ]
                }
            },
            {
                "dataUUID": 10005,
                "dataType": "parent",
                "data": "itemsold",
                "subReports": [
                    {
                        "dataUUID": 10006,
                        "dataType": "parent",
                        "data": "blah2",
                        "type": "report",
                        "detail": [
                            {
                                "text": "Subreport itemsold/blah2 Data",
                                "settings": {
                                    "align": 0
                                },
                                "type": "print"
                            }
                        ]
                    }
                ],
                "calcs": {
                    "sum": [
                        "group"
                    ]
                }
            }
        ],
        "header": [
            {
                "type": "raw",
                "values": [
                    "Sample Header"
                ]
            }
        ],
        "footer": [
            {
                "type": "raw",
                "values": [
                    "Sample Footer"
                ]
            }
        ]
    };

let rpt = new ReportBuilder(reportData, data);

// These two lines are not normally needed for any normal reports unless you want to use your own fonts...
// We need to add this because of TESTING and making the report consistent for CI environments
rpt.registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'})
    .font("Arimo");


if (typeof process.env.TESTING === "undefined") { rpt.printStructure(); }

console.time("Rendered");
rpt.render().then((name) => {
    console.timeEnd("Rendered");
    const testing = {images: 1, blocks: ["120,130,300,100"]};
    displayReport(null, name, testing);
}).catch((err) => {
    console.error("Your report had errors while running", err);
});

