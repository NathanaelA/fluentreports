"use strict";

/***
 * Demo 21 - Test a dynamic report built from the ReportGenerator
 */


const ReportBuilder = require('../lib/fluentReportsBuilder').ReportBuilder;
const displayReport = require('./reportDisplayer');

const data = [
    {id: 1, name: "John Doe", emphours: [
            {week: 20, day: "Monday", hours: 4},
            {week: 20, day: "Tuesday", hours: 8},
            {week: 20, day: "Wednesday", hours: 8},
            {week: 21, day: "Thursday", hours: -2},
            {week: 21, day: "Friday", hours: 8},

            {week: 22, day: "Monday", hours: 4},
            {week: 22, day: "Tuesday", hours: 8},
            {week: 22, day: "Wednesday", hours: 8},
            {week: 23, day: "Thursday", hours: 2},
            {week: 23, day: "Friday", hours: 8},

            {week: 25, day: "Monday", hours: 4},
            {week: 25, day: "Tuesday", hours: 8},
            {week: 25, day: "Wednesday", hours: 8},
            {week: 26, day: "Thursday", hours: 2},
            {week: 26, day: "Friday", hours: 8}
        ]},
    {id: 3, name: "Sarah Williams", emphours: [
            {week:20, day: "Monday", hours: 8}
        ]},
    {id: 5, name: "Jane Doe", emphours: [
            {week: 20, day: "Monday", hours: 5},
            {week: 20, day: "Tuesday", hours: 8},
            {week: 21, day: "Wednesday", hours: 7},
            {week: 21, day: "Thursday", hours: 8},
            {week: 21, day: "Friday", hours: 8},

            {week: 22, day: "Monday", hours: 5},
            {week: 22, day: "Tuesday", hours: 8},
            {week: 23, day: "Wednesday", hours: 7},
            {week: 23, day: "Thursday", hours: 8},
            {week: 23, day: "Friday", hours: 8},

            {week: 25, day: "Monday", hours: 5},
            {week: 25, day: "Tuesday", hours: 8},
            {week: 26, day: "Wednesday", hours: 7},
            {week: 26, day: "Thursday", hours: 8},
            {week: 26, day: "Friday", hours: 8}
        ]}
];


let reportData = {
    "type": "report",
    "dataUUID": 10002,
    "fontSize": 8,
    "autoPrint": false,
    "name": "demo21.pdf",
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
                    "header": [
                        {
                            "skip": true,
                            "type": "function",
                            "function": "vars.counter=0;",
                            "async": false,
                            "name": "counter reset"
                        },
                        {
                            "name": "Week number: data.week",
                            "settings": {
                                "absoluteX": 0,
                                "absoluteY": 0,
                                "width": "40",
                                wrap: 0
                            },
                            "function": {
                                "function": "return `Week Number: ${data.week}`",
                                "type": "function",
                                "async": false,
                                "name": "Week number: data.week"
                            },
                            "type": "print"
                        }
                    ],
                    "detail": [],
                    "footer": [
                        {
                            "type": "newLine"
                        }
                    ]
                }
            ],
            "type": "report",
            "detail": [
                {
                    "type": "function",
                    "function": "vars.counter++;",
                    "name": "increase counter"
                },
                {
                    "settings": {
                        "fillOpacity": 1,
                        "absoluteX": 72,
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
                            }
                        }
                    ]
                }
            ],
            "calcs": {
                "sum": [
                    "hours"
                ]
            }
        }
    ],
    "pageHeader": [
        {
            "type": "raw",
            "values": [
                "Employee Hours"
            ]
        }
    ],
    "groupBy": [
        {
            "type": "group",
            "groupOn": "name",
            "header": [
                {
                    "field": "name",
                    "settings": {
                        "absoluteX": 0,
                        "absoluteY": 0,
                        "fontBold": true,
                        "fill": "#6f6f6f",
                        "textColor": "#ffffff",
                        "link": "http://www.fluentReports.com/"
                    },
                    "type": "print"
                }
            ],
            "detail": [],
            "footer": [
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
                        "absoluteX": 72,
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
    ],
    "finalSummary": [
        {
            "type": "raw",
            "values": [
                "Total Hours:",
                "hours",
                3
            ]
        }
    ]
};

/*
const frg = new FluentReportsGenerator({
    id: "fluentReportsEditor",
    data: data,
    report: reportData,
    debug: true,
    formatterFunctions: {
        'NumberFunction': function(input, data, callback) {
            if(input !== Math.round(input)){
                callback(input);
            }
            callback (input + '.0');
        }
    },
    save: (value, done) => {
        console.log("Saving");
        const results = document.getElementById("results");
        results.innerText = JSON.stringify(value, null, 4);
        done();
    }
});
*/


let rpt = new ReportBuilder(reportData, data);

// These two lines are not normally needed for any normal reports unless you want to use your own fonts...
// We need to add this because of TESTING and making the report consistent for CI environments
rpt.registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'})
    .font("Arimo");


if (typeof process.env.TESTING === "undefined") { rpt.printStructure(); }

console.time("Rendered");
rpt.render().then((name) => {
    console.timeEnd("Rendered");
    const testing = {images: 2, blocks: ["130,140,180,60"]};
    displayReport(null, name, testing);


}).catch((err) => {
    console.error("Your report had errors while running", err);
});


