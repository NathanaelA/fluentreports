"use strict";

// This tests measurement of headers

const Report = require('../lib/fluentReports.js').Report;
const displayReport = require('./reportDisplayer');

function constructReport() {

    var orderItems = [
        {number: 1, description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum Lorem ipsum dolor sit amet, consectetur adipisicing el", quantity: 1, amount: 100, common: 1},
        {number: 2, description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum Lorem ipsum dolor sit amet, consectetur adipisicing el", quantity: 1, amount: 100, common: 1},
        {number: 3, description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum Lorem ipsum dolor sit amet, consectetur adipisicing el", quantity: 1, amount: 100, common: 1},
        {number: 4, description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum Lorem ipsum dolor sit amet, consectetur adipisicing el", quantity: 1, amount: 100, common: 1}
    ];

    var pageHeader = function(report) {
        report.fontSize(14);
        report.setCurrentY(50);

        //Company Name, INVOICE
        report.band([
            {data: "Best Products, Inc.", width: 270, fontBold: true},
            {data: "INVOICE", align: 3, width: 260, fontBold: true}
        ], {border: 0, wrap: 1});

        report.fontSize(10);

        //Company Address, Invoice Date
        report.band([
            {data: "#35", width: 270},
            {data: "12/01/2013", align: 3, width: 260}
        ], {border: 0, wrap: 1});

        report.band([
            {data: "City, State Zip Code", width: 270},
            {data: "Invoice #001", align: 3, width: 260}
        ], {border: 0, wrap: 1});

        report.band([
            {data: "85-23923-3102923", width: 270},
            {data: "12345", align: 3, width: 260}
        ], {border: 0, wrap: 1});

        report.band([
            {data: "1232193210-01", width: 530}
        ], {border: 0, wrap: 1});

        report.newLine(5);

    };

    var detailBondBody = function(report, data) {
        report.fontSize(11);
        //console.log("InBody", data.number);

        report.band([
            {data: data.number, width: 50, align: 2},
            {data: data.description, width: 300},
            {data: data.quantity, width: 60},
            {data: data.amount, width: 120}], {border: 0, width: 0, wrap: 1});
    };

    var pageFooter = function(report, data, state) {
      //  report.newLine();
      //  console.log("Report Y", report.getCurrentY(), report.maxY());
        var y = 720;
        report.print("Invoice #001", {width: 530, y: y, align: "right"});
        //console.log("Report Y2", state.isCalc, report.getCurrentY(), report.maxY(), report._PDF.page.maxY());
        report.print("Company slogan here!", {width: 530, align: "right"});
        report.newLine();
        //console.log("Report Y2", report.getCurrentY(), report.maxY(), report._PDF.page.maxY());

    };

    var finalSummary = function(report) {
        //report.newLine();

        report.band([
            {data: "", width: 350},
            {data: "Subtotal", width: 60},
            {data: "1000", width: 120}], {border: 0, width: 0, wrap: 1});

        report.band([
            {data: "", width: 350},
            {data: "Taxable", width: 60},
            {data: "1000", width: 120}], {border: 0, width: 0, wrap: 1});

        report.band([
            {data: "", width: 350},
            {data: "Tax Rate", width: 60},
            {data: "1000", width: 120}], {border: 0, width: 0, wrap: 1});

        report.band([
            {data: "", width: 350},
            {data: "Tax Due", width: 60},
            {data: "1000", width: 120}], {border: 0, width: 0, wrap: 1});

        report.band([
            {data: "", width: 350},
            {data: "Other", width: 60},
            {data: "1000", width: 120}], {border: 0, width: 0, wrap: 1});

        report.band([
            {data: "", width: 350},
            {data: "Total Due", width: 60},
            {data: "1000", width: 120}], {border: 0, width: 0, wrap: 1});
    };

    //Report.trace =true;
    var report = new Report("demo10.pdf", {paper: "letter", font: "Arimo"});
    report.registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'});

    report.pageHeader(pageHeader)
        .data(orderItems)
        .detail(detailBondBody)
        .pageFooter(pageFooter)
        .margins(40);

    report.groupBy("common")
        .footer(finalSummary);

//    report.printStructure();

    global._done = false;
    report.render(function(err, name) {
        const testing = {images: 1};
        displayReport(err, name, testing);
    });
}



constructReport();