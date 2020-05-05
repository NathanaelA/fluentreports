"use strict";

const ReportBuilder = require('../lib/fluentReportsBuilder').ReportBuilder;
const displayReport = require('./reportDisplayer');

const data = JSON.parse('[{"name":"Everywhere","hotkeys":[{"keys1":"WinKey","help1":"Tap to show Start","keys2":"CTRL-F4","help2":"Close Panels & Menus"},{"keys1":"?","help1":"Bring up this help","keys2":"ALT+F4","help2":"Quit Application"},{"keys1":"ALT+TAB","help1":"Cycle through Applications","keys2":"Ctrl+Space","help2":"Toggle the App Menu"},{"keys1":"Win+L","help1":"Lock Screen","keys2":"","help2":""}]},{"name":"More navigation","hotkeys":[{"keys1":"Ctrl+Shift-Esc","help1":"Task Manager","keys2":"Alt+Print Screen","help2":"Take Snapshot"}]}]');

const reportData = {
    "type": "report",
    "fontSize": 8,
    "autoPrint": false,
    "name": "demo27.pdf",
    "paperSize": "letter",
    "paperOrientation": "portrait",
    "margins": {
        "left": 40,
        "top": 40,
        "right": 40,
        "bottom": 40
    },
    "fonts": [],
    "variables": {},
    "subReports": [
        {
            "dataUUID": 10003,
            "dataType": "parent",
            "data": "hotkeys",
            "type": "report",
            "detail": [
                {
                    "settings": {
                        "fillOpacity": 1,
                        "absoluteX": 1,
                        "absoluteY": 0,
                        "border": 1,
                        "wrap": true,
                        "padding": 4
                    },
                    "type": "band",
                    "fields": [
                        {
                            "field": "keys1",
                            "width": 100,
                            "align": 3
                        },
                        {
                            "function": {
                                "name": "Band Function",
                                "type": "function",
                                "async": false,
                                "function": "return (data.keys1 ? `:` : ``)"
                            },
                            "width": 15,
                            "align": 2
                        },
                        {
                            "field": "help1",
                            "width": 150
                        },
                        {
                            "field": "keys2",
                            "width": 100,
                            "align": 3
                        },
                        {
                            "function": {
                                "name": "Band Function",
                                "type": "function",
                                "async": false,
                                "function": "return (data.keys2 ? `:` : ``)"
                            },
                            "width": 15,
                            "align": 2
                        },
                        {
                            "field": "help2",
                            "width": 150
                        }
                    ]
                }
            ]
        }
    ],
    "titleHeader": [
        {
            "type": "raw",
            "values": [
                "Windows Keyboard Shortcuts"
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
                        "fontSize": 10,
                        "fontBold": true,
                        "align": "center"
                    },
                    "type": "print"
                }
            ],
            "footer": [
                {
                    "thickness": 0.5,
                    "type": "bandLine"
                },
                {
                    "type": "newLine"
                }
            ]
        }
    ]
};


let rpt = new ReportBuilder(reportData, data);
if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(); }

console.time("Rendered");
rpt.render().then((name) => {
    console.timeEnd("Rendered");
    const testing = {images: 1, blocks: ["60,60,180,70"]};
    displayReport(null, name, testing);
}).catch((err) => {
    console.error("Your report had errors while running", err);
});

