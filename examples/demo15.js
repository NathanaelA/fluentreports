"use strict";
var Report = require('../lib/fluentReports' ).Report;
var displayReport = require('./reportDisplayer');




function printreport() {

    var formData = {
        today: "Today",
        tomorrow: "Tomorrow",
        meta: { high: "85", low: '50' }
    };



    var mainReport = new Report('demo15.pdf')
        .data(formData)
        .pageheader('test')
        .footer('test')
        .pageFooter('test');

    var overviewReport = new Report(mainReport)
        .data(formData)
        .titleHeader((a,b, c) => {
            //console.log("titleHeader", b, c);
        });

    var introductionReport = new Report(mainReport)
        .data(formData);



    if (typeof process.env.TESTING !== "undefined") { mainReport.printStructure(); }

    mainReport.render((err, name) => {
        const testing = {images: 1, blocks: ["120,130,300,100"]};
        displayReport(err, name, testing);
    });

}


printreport();