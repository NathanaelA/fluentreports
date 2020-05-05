"use strict";
const displayReport = require('./reportDisplayer');
const Report = require('../lib/fluentReports.js').Report;

//Report.trace = true;

let reportId = 2;

let r;
if (reportId === 0) {
     r = new Report("demo24.pdf")
        /*   .pageHeader((report) => {
                report.print('Header');
            }) */
        .detail((report, data) => {
            report.currentY(report.maxY() - report.heightOfString() - 2);
            report.band([
                {
                    data: 'Detail'
                }
            ], {
                gutter: 1
            });
//        report.print('This will keep the PDF from coming out corrupted, but the header will not appear.');
        })
        .data({});
} else if (reportId === 1) {
    r = new Report("demo24.pdf")
        .groupBy()
        .header((report) => {
            report.print('Header');
        })
        .detail((report, data) => {
            report.print('Detail', {
                y: report.maxY() - report.heightOfString()
            });
        })
        .data({});
} else if (reportId === 2) {
    r = new Report("demo24.pdf")
        .groupBy()
        .header((report) => {
            report.print('Header');
        })
        .detail((report, data, state) => {
            if (state.isCalc) {
                console.log("calc");
                report.print("detail");
            } else {
                report.print('Detail', {
                    y: report.maxY() - report.heightOfString()
                });
            }
        })
        .pageFooter((report) => {
            report.print('Footer');
        })
        .data({});

} else {
    r = new Report("demo24.pdf")
        .groupBy()
        .header((report) => {
            report.print('Header');
        })
        .detail((report, data) => {
            report.print('Page 1');
            report.addY(1000);
            report.print('Page 2');
        })
        .data({});
}

    if (typeof process.env.TESTING !== "undefined") { r.printStructure(); }

    console.time("Rendered");
    r.render().then((name) => {
        console.timeEnd("Rendered");
        const testing = {images: 2};

        displayReport(null, name, testing);
    }).catch((err) => {
        console.log(err);}
        );
