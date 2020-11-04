/***
 * This report tests using a align "center" with a width and absoluteX position
 *   absoluteX should be ignored when alignment is set.
 *   absoluteX should be calculate when width & alignment is set to put text box in proper alignment
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

const reportData = {"name":"demo34.pdf","type":"report","fonts":[],"detail":{
    "children":[
        {"text":"Align Left","type":"print","settings":{"align":"left","width":50,"absoluteX":234,"absoluteY":0}},
        {"text":"Align Center","type":"print","settings":{"align":"center","width":50,"absoluteX":234,"absoluteY":15}},
        {"text":"Align Right","type":"print","settings":{"align":"right","width":50,"absoluteX":234,"absoluteY":30}},
        {"text":"Align None, AX: 234","type":"print","settings":{"align":"none","width":50,"absoluteX":134,"absoluteY":45, border: true}}
        ]
    },"footer":{"children":[{"type":"raw","values":["Sample Footer"]}]},"header":{"children":[{"type":"raw","values":["Sample Header"]}]},"version":2,"fontSize":0,"autoPrint":false,"paperSize":"letter","variables":{},"paperOrientation":"portrait"};

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

