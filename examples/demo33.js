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
    "name": "demo33.pdf",
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
            "type": "report",
            "detail": {
                "children": [
                    {
                        "type": "function",
                        "function": "vars.counter++;",
                        "name": "increase counter"
                    },
                    {
                        "settings": {
                            "fillOpacity": 1,
                            "absoluteX": 0,
                            "absoluteY": 0,
                            "fill": {
                                "type": "function",
                                "function": "return (vars.counter % 2 === 0 ? '#f0f0f0' : '#e0e0e0');",
                                "name": "fill"
                            },
                            "textColor": "#0000ff",
                            "wrap": true
                        },
                        "type": "band",
                        "fields": [
                            {
                                "text": "",
                                "width": 80
                            },
                            {
                                "field": "day",
                                "width": 100
                            },
                            {
                                "field": "hours",
                                "width": 100,
                                "align": 3,
                                "textColor": {
                                    "type": "function",
                                    "function": "return data.hours < 0 ? '#FF0000' : '#000000';",
                                    "name": "textColor"
                                },
                                "formatFunction": "NumberFunction"
                            }
                        ]
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
            "header": {
                "children": [
                    {
                        "field": "name",
                        "settings": {
                            "formatFunction": "NameDisplay",
                            "absoluteX": 0,
                            "absoluteY": 0,
                            "fontBold": true,
                            "fill": "#6f6f6f",
                            "textColor": "#ffffff",
                            "link": "http://www.fluentReports.com/"
                        },
                        "type": "print"
                    }
                ]
            },
            "detail": {
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
                            "absoluteY": 21
                        },
                        "type": "print"
                    },
                    {
                        "text": "Label",
                        "settings": {
                            "absoluteX": 0,
                            "absoluteY": 42
                        },
                        "type": "print"
                    },
                    {
                        "active": {
                            "type": "function",
                            "name": "Function",
                            "function": "return vars.counter % 5 === 0;",
                            "async": false
                        },
                        "type": "newPage"
                    },
                    {
                        "text": "Label",
                        "settings": {
                            "absoluteX": 0,
                            "absoluteY": 80
                        },
                        "type": "print"
                    },
                    {
                        "text": "Label",
                        "settings": {
                            "absoluteX": 0,
                            "absoluteY": 102
                        },
                        "type": "print"
                    }
                ]
            },
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
                    },
                    {
                        "settings": {
                            "fillOpacity": 1,
                            "absoluteX": 0,
                            "absoluteY": 0
                        },
                        "type": "band",
                        "fields": [
                            {
                                "function": {
                                    "type": "function",
                                    "name": "Totals for data.name",
                                    "function": "return `Totals for ${data.name}`",
                                    "async": false
                                },
                                "width": 180
                            },
                            {
                                "total": "hours",
                                "width": 100,
                                "align": 3
                            }
                        ]
                    },
                    {
                        "type": "newLine"
                    }
                ]
            }
        }
    ],
    "finalSummary": {
        "children": [
            {
                "type": "raw",
                "values": [
                    "Total Hours:",
                    "hours",
                    3
                ]
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

