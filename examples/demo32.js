/***
 * This report tests using a pageBreak, "before" and "after" values
 */

"use strict";

const ReportBuilder = require('../lib/fluentReportsBuilder').ReportBuilder;
const displayReport = require('./reportDisplayer');

const data = [
    {
        "id": 1,
        "name": "John Doe",
        "emphours": [
            {
                "week": 20,
                "day": "Monday",
                "hours": 4
            },
            {
                "week": 20,
                "day": "Tuesday",
                "hours": 8
            },
            {
                "week": 20,
                "day": "Wednesday",
                "hours": 8
            },
            {
                "week": 21,
                "day": "Thursday",
                "hours": -2
            },
            {
                "week": 21,
                "day": "Friday",
                "hours": 8
            },
            {
                "week": 22,
                "day": "Monday",
                "hours": 4
            },
            {
                "week": 22,
                "day": "Tuesday",
                "hours": 8
            },
            {
                "week": 22,
                "day": "Wednesday",
                "hours": 8
            },
            {
                "week": 23,
                "day": "Thursday",
                "hours": 2
            },
            {
                "week": 23,
                "day": "Friday",
                "hours": 8
            },
            {
                "week": 25,
                "day": "Monday",
                "hours": 4
            },
            {
                "week": 25,
                "day": "Tuesday",
                "hours": 8
            },
            {
                "week": 25,
                "day": "Wednesday",
                "hours": 8
            },
            {
                "week": 26,
                "day": "Thursday",
                "hours": 2
            },
            {
                "week": 26,
                "day": "Friday",
                "hours": 8
            }
        ]
    },
    {
        "id": 3,
        "name": "Sarah Williams",
        "emphours": [
            {
                "week": 20,
                "day": "Monday",
                "hours": 8
            }
        ]
    }
];

const reportData = {
    "type": "report",
    "dataUUID": 10002,
    "version": 1,
    "fontSize": 8,
    "autoPrint": false,
    "name": "demo32.pdf",
    "paperSize": "letter",
    "paperOrientation": "portrait",
    "fonts": [],
    "variables": {
        "counter": 0
    },
    "subReports": [
        {
            "dataUUID": 10003,
            "dataType": "parent",
            "data": "emphours",
            "groupBy": [
                {
                    "type": "group",
                    "groupOn": "week",
                    "header": {
                        "children": [
                            {
                                "skip": true,
                                "type": "function",
                                "function": "vars.counter=0;",
                                "async": false,
                                "name": "counter reset"
                            }
                        ]
                    }
                }
            ],
            "type": "report",
            "detail": {
                "children": [
                    {
                        "type": "function",
                        "function": "vars.counter++;",
                        "name": "increase counter"
                    }
                ]
            },
            "calcs": {
                "sum": [
                    "hours"
                ]
            }
        }
    ],
    "pageHeader": {
        "children": [
            {
                "type": "raw",
                "values": [
                    "Employee Hours"
                ]
            }
        ]
    },
    "groupBy": [
        {
            "type": "group",
            "groupOn": "name",
            "footer": {
                "children": [
                    {
                        "type": "calculation",
                        "op": "concat",
                        "name": "totals",
                        "fields": [
                            {
                                "text": "Totals for "
                            },
                            {
                                "field": "name"
                            }
                        ]
                    }
                ]
            }
        }
    ],
    "finalSummary": {
        "children": [
            {
                "text": "Label",
                "settings": {
                    "absoluteX": 0,
                    "absoluteY": 0
                },
                "type": "print"
            },
            {
                "text": "Label",
                "settings": {
                    "absoluteX": 0,
                    "absoluteY": 15
                },
                "type": "print"
            },
            {
                "text": "Label",
                "settings": {
                    "absoluteX": 0,
                    "absoluteY": 30
                },
                "type": "print"
            },
            {
                "active": true,
                "type": "newPage"
            },
            {
                "text": "Label",
                "settings": {
                    "absoluteX": 0,
                    "absoluteY": 91
                },
                "type": "print"
            },
            {
                "text": "Label",
                "settings": {
                    "absoluteX": 0,
                    "absoluteY": 111
                },
                "type": "print"
            },
            {
                "text": "Label",
                "settings": {
                    "absoluteX": 0,
                    "absoluteY": 134
                },
                "type": "print"
            }
        ]
    },
    "formatterFunctions": {
        "NameDisplay": "callback('Name: ' + row.name)",
        "HoursDisplay": "callback('Hours: ' + input)"
    }
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

