/***
 * This report tests fixedHeight option and the Height of a section
 */

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


const reportData = {
    "type": "report",
    "fontSize": 0,
    "version": 1,
    "autoPrint": false,
    "name": "demo29.pdf",
    "paperSize": "letter",
    "paperOrientation": "portrait",
    "fonts": [],
    "variables": {},
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
                    "detail": {
                        height: 100,
                        fixedHeight: true,
                        children: [
                            {
                                "text": "Subreport items/blah Data",
                                "settings": {
                                    "absoluteX": 0,
                                    "absoluteY": 0
                                },
                                "type": "print"
                            },
                            {
                                "image": "data:image/jpeg;base64,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",
                                "settings": {
                                    "top": 1,
                                    "left": 55,
                                    "width": 100,
                                    "height": 100,
                                    "aspect": "scale",
                                    "imgScale": 0.25,
                                    "usesSpace": true
                                },
                                "type": "image"
                            }
                        ]
                    }
                }
            ]
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
                    "detail": {
                        children: [
                            {
                                "text": "Subreport itemsold/blah2 Data",
                                "settings": {
                                    "absoluteX": 0,
                                    "absoluteY": 0
                                },
                                "type": "print"
                            }
                        ]
                    }
                }
            ]
        }
    ],
    "header": {
        children: [
            {
                "type": "raw",
                "values": [
                    "Sample Header"
                ]
            },
            {
                "settings": {
                    "shape": "line",
                    "radius": 50,
                    "width": 50,
                    "height": 50
                },
                "type": "shape"
            }
        ]
    },
    "footer": {
        children: [
            {
                "type": "raw",
                "values": [
                    "Sample Footer"
                ]
            }
        ]
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

