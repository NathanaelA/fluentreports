"use strict";

var Report = require('../lib/fluentReports').Report;
var displayReport = require('./reportDisplayer');
global.perfTime = 0;

function printReport() {
    var reportData = [],
        firstString = 'First 50',
        secondString = 'Second column 100',
        thirdString = 'Third Column is lengthy at 200';
    for (var i = 0; i < 50; ++i) {
        reportData.push({
            first: firstString + Array(i).join('x'),
            second: secondString + Array(i).join('x'),
            third: thirdString + Array(i).join('x')
        });
        reportData.push({
            first: firstString + Array(i).join('W'),
            second: secondString + Array(i).join('W'),
            third: thirdString + Array(i).join('W')
        });
        reportData.push({
            first: firstString + Array(i).join('i'),
            second: secondString + Array(i).join('i'),
            third: thirdString + Array(i).join('i')
        });
        reportData.push({
            first: firstString + Array(i).join('Wi'),
            second: secondString + Array(i).join('Wi'),
            third: thirdString + Array(i).join('Wi')
        });

    }

    var detailFunction = function (report, data) {
        report.band([
            {data: data.first, width: 50},
            {data: data.second, width: 100},
            {data: data.third, width: 200}
        ], {border: 1, width: 0});
    };

    var reportName = "demo17.pdf";
    var rpt = new Report(reportName)
        .autoPrint(false)
        .data(reportData)
        .detail(detailFunction)
        .fontSize(10);


    console.time("Rendered");
    rpt.render(function (error, name) {
        console.timeEnd("Rendered");
        const testing = {images: 4};
        displayReport(error, name, testing);
    });

    if (typeof process.env.TESTING === "undefined") { rpt.printStructure(true); }

}
printReport();