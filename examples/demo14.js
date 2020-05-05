"use strict";

const Report = require('../lib/fluentReports' ).Report;
const displayReport = require('./reportDisplayer');


var data = {
    today: "Today",
    tomorrow: "Tomorrow",
    meta:
        { high: "85", low: '50' }
};



function printreport() {

    var header = function(rpt, row) {
        //rpt.font(Report.fonts.times);
        //rpt.fontBold();
        rpt.print("Today is "+row.today, {font: Report.fonts.times});
        rpt.fontBold();
        rpt.print("Tomorrow is "+row.tomorrow);
        rpt.fontNormal();
    };


     var subDetail = function(rpt, row){
            rpt.band([
                {data: "high", width: 240},
                {data: row.high, width: 60, align: 3},
            ], {x: 30});
            rpt.band([
               {data: "low", width: 240},
               {data: row.low, width: 60, align: 3},
            ], {x: 30});
     };

    var subHeader = function(rpt, row) {
        rpt.print("Sub Report Header");
    };


    var report = new Report("demo14.pdf", {font: "Arimo"})
        .registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'})
        .data(data)
        .pageHeader(["Daily Report"])
        .header(header)
        .footer("main footer");


    var subRpt = new Report(report)
            .data(data.meta)
            .detail(subDetail)
            .pageheader(subHeader)
            .pagefooter("footer");




    if (typeof process.env.TESTING === "undefined") { report.printStructure(); }
    report.render((err, name) => {
        const testing = {images: 1, blocks: ["120,130,300,100"]};
        displayReport(err, name, testing);
        });


}


printreport();