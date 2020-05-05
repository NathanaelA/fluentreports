"use strict";
const displayReport = require('./reportDisplayer');
const Report = require('../lib/fluentReports.js').Report;

//Report.trace = true;


const reportData = [
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXX, XXXXXXX","first_name":"XXXXXXX","last_name":"XXXX","middle_name":"","suffix":"","prefix":"","address_1":"XXXX X XXXXXXX XXXX","address_2":"","city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","ocall":"XX","esall":0,"shcall":"XX"},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXXXXXXX, XXXXXXXXX X.","first_name":"XXXXXXXXX      ","last_name":"XXXXXXXXXX","middle_name":"X              ","suffix":"","prefix":"","address_1":"XXX XXXXXXXX XXX","address_2":"","city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","ocall":"XX","esall":0,"shcall":"XX"},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXXXXXX, XXXXX X.","first_name":"XXXXX","last_name":"XXXXXXXXX","middle_name":"X","suffix":"","prefix":"","address_1":"XX XXX XXX","address_2":"","city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","ocall":"XX","esall":0,"shcall":"XX"},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXX, XXXXXXXX X.","first_name":"XXXXXXXX","last_name":"XXXXX","middle_name":"X","suffix":null,"prefix":null,"address_1":"XXX XXXX XXX XX","address_2":null,"city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","esall":0},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXXXX, XXXXX X.","first_name":"XXXXX","last_name":"XXXXXXX","middle_name":"X","suffix":null,"prefix":null,"address_1":"XXX XXXX XXX XX","address_2":null,"city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","esall":0},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXXXX, XXXXX XXX","first_name":"XXXXX          ","last_name":"XXXXXXX             ","middle_name":"XXX","suffix":"","prefix":"","address_1":"XXX XXXXXXX XXX","address_2":"","city":"XXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","ocall":"XX","esall":0,"shcall":"XX"},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXXXX, XXXXXXX X.","first_name":"XXXXXXX        ","last_name":"XXXXXXX             ","middle_name":"X              ","suffix":"","prefix":"","address_1":"XXX X XXXXX XX","address_2":"","city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","ocall":"XX","esall":0,"shcall":"XX"},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXXXX, XXXXXX X.","first_name":"XXXXXX         ","last_name":"XXXXXXX             ","middle_name":"X              ","suffix":"","prefix":"","address_1":"XXX XXXXXXX","address_2":"","city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","ocall":"XX","esall":0,"shcall":"XX"},
    {"vendorlink":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","employee_master":"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX","ssn":"XXXXXXXXX","name":"XXXXXXX, XXXXXX X.","first_name":"XXXXXX         ","last_name":"XXXXXXX             ","middle_name":"X              ","suffix":"","prefix":"","address_1":"XXX XXXXXXX","address_2":"","city":"XXXXXXXX","state":"XX","zip":"XXXXX","oc1":"XX","es1":0,"shc1":"XX","oc2":"XX","es2":0,"shc2":"XX","oc3":"XX","es3":0,"shc3":"XX","oc4":"XX","es4":0,"shc4":"XX","oc5":"XX","es5":0,"shc5":"XX","oc6":"XX","es6":0,"shc6":"XX","oc7":"XX","es7":0,"shc7":"XX","oc8":"XX","es8":0,"shc8":"XX","oc9":"XX","es9":0,"shc9":"XX","oc10":"XX","es10":0,"shc10":"XX","oc11":"XX","es11":0,"shc11":"XX","oc12":"XX","es12":0,"shc12":"XX","ocall":"XX","esall":0,"shcall":"XX"}
];

var reportHeader = function (r, row) {
    var cellWidth = (r.maxX() - r.minX()) / 15;
    r.newLine();
    r.fontSize(8);
    r.band([
        {data: '', width: cellWidth * 2, align: 1, fontBold: true, border: {bottom: 1}},
        {data: 'All 12', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Jan', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Feb', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Mar', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Apr', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'May', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Jun', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Jul', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Aug', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Sept', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Oct', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Nov', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}},
        {data: 'Dec', width: cellWidth, align: 2, fontBold: true, border: {bottom: 1}}
    ]);
    r.newLine();
};

var standardHeader = function (report, data) {
    var previousSize = report.fontSize();
    report.fontSize(7);
    report.printedAt({header: true, align: 'right', text: '\nPrinted {0}:{1}{2}\nXXXXXX'});
    report.print('XXXXX - XXXX' + '\n' + 'XXXX', {
        width: report.maxX() - report.minX(),
        align: 1,
        fontSize: 8,
        fontBold: true
    });
    report.fontSize(12);

    report.print('XXXXX XXXXX XXXXXX', {fontSize: 16, fontBold: true, align: 2, width: report.maxX() - report.minX()});
    reportHeader.call(this, report, data);
    report.fontSize(previousSize);
};

var detail = function (r, row) {
    var cellWidth = (r.maxX() - r.minX()) / 15;

    r.fontSize(8);
    r.band([
        {data: row.name, width: cellWidth * 5, align: 1, fontBold: true},
        {data: row.ssn, width: cellWidth * 3, align: 1}
    ], {padding: 2});

    r.band([
        {data: 'Offer Code', width: cellWidth * 2, align: 1},
        {data: '', width: cellWidth, align: 2},
        {data: row.oc1, width: cellWidth, align: 2},
        {data: row.oc2, width: cellWidth, align: 2},
        {data: row.oc3, width: cellWidth, align: 2},
        {data: row.oc4, width: cellWidth, align: 2},
        {data: row.oc5, width: cellWidth, align: 2},
        {data: row.oc6, width: cellWidth, align: 2},
        {data: row.oc7, width: cellWidth, align: 2},
        {data: row.oc8, width: cellWidth, align: 2},
        {data: row.oc9, width: cellWidth, align: 2},
        {data: row.oc10, width: cellWidth, align: 2},
        {data: row.oc11, width: cellWidth, align: 2},
        {data: row.oc12, width: cellWidth, align: 2}
    ], {padding: 2});

    r.band([
        {data: 'Employee Part', width: cellWidth * 2, align: 1},
        {data: '', width: cellWidth, align: 2},
        {data: row.es1, width: cellWidth, align: 2},
        {data: row.es2, width: cellWidth, align: 2},
        {data: row.es3, width: cellWidth, align: 2},
        {data: row.es4, width: cellWidth, align: 2},
        {data: row.es5, width: cellWidth, align: 2},
        {data: row.es6, width: cellWidth, align: 2},
        {data: row.es7, width: cellWidth, align: 2},
        {data: row.es8, width: cellWidth, align: 2},
        {data: row.es9, width: cellWidth, align: 2},
        {data: row.es10, width: cellWidth, align: 2},
        {data: row.es11, width: cellWidth, align: 2},
        {data: row.es12, width: cellWidth, align: 2}
    ], {padding: 2});

    r.band([
        {data: 'Safe Harbor', width: cellWidth * 2, align: 1, border: {bottom: 1}},
        {data: '', width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc1, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc2, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc3, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc4, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc5, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc6, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc7, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc8, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc9, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc10, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc11, width: cellWidth, align: 2, border: {bottom: 1}},
        {data: row.shc12, width: cellWidth, align: 2, border: {bottom: 1}}
    ], {padding: 2});
    if (r.getCurrentY() > (r.maxY() - 75)) { //////////////////////// CHANGE THIS TO -200 to cause it to work
        r.newPage();
    } else {
        //r.newLine();
    }
};

const r = new Report('demo25.pdf')
    .data(reportData)
    .margins(20)
    .landscape(true)
    .titleHeader(standardHeader)
    .pageHeader(reportHeader)
    .detail(detail);

    // These two lines are not normally needed for any normal reports unless you want to use your own fonts...
    // We need to add this because of TESTING and making the report consistent for CI environments
    r.registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'})
        .font("Arimo");


if (typeof process.env.TESTING === "undefined") { r.printStructure(); }

    console.time("Rendered");
    r.render().then((name) => {
        console.timeEnd("Rendered");
        const testing = {images: 1, blocks: ["1480,40,150,60"]};
        displayReport(null, name, testing);
    }).catch((err) => {
        console.log(err);}
        );
