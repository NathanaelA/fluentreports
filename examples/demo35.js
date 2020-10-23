/***
 * This report tests using formatterFunctions with each print type
 */

"use strict";


const ReportBuilder = require('../lib/fluentReportsBuilder').ReportBuilder;
const displayReport = require('./reportDisplayer');

const data = [
    {
        "id": 1,
        "name": "John Doe",
    }
];

const reportData = {
    "type": "report",
    "dataUUID": 10002,
    "version": 2,
    "fontSize": 0,
    "autoPrint": false,
    "name": "demo35.pdf",
    "paperSize": "letter",
    "paperOrientation": "portrait",
    "fonts": [],
    "variables": {
        "test": "12345"
    },

    "header": {
        "children": [
            {
                "type": "raw",
                "values": [
                    "Sample Header"
                ]
            }
        ]
    },
    "detail": {
        "children": [
            {
                "type": "print",
                "settings": {
                    "formatFunction": "NumberFunction",
                    "absoluteX": 14,
                    "absoluteY": 1
                },
                "variable": "test"
            },

            {
                "type": "print",
                "settings": {
                    "formatFunction": "NumberFunction",
                    "absoluteX": 104,
                    "absoluteY": 1
                },
                "text": "1000"
            },

            {
                "type": "print",
                "settings": {
                    "formatFunction": "NumberFunction",
                    "absoluteX": 204,
                    "absoluteY": 1
                },
                "field": "id",
            }


        ]
    },
    "footer": {
        "children": [
            {
                "type": "raw",
                "values": [
                    "Sample Footer"
                ]
            }
        ]
    }
};
reportData.formatterFunctions = {
    'NumberFunction': function(input, data, callback) {
        callback (input + '.00');
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

