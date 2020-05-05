"use strict";

// Tests to verify that "\n" in lines break the line properly...

var Report = require('../lib/fluentReports' ).Report;
var displayReport = require('./reportDisplayer');


var pageHeader = function(r) {
    r.fontSize(9);
    r.print("the Top Left band should print 4 lines, and is now working!");
    r.band([
        {data: 'Seriously famous Favorite\nIce Cream', width: 70, align: 'left'},
        {data: 'Least Favorite Ice Cream', width: 70, align: 'right'}
    ], {fontBold: true, wrap: true, border: 1});
};

var detail = function(r, row) {
    r.fontsize(9);
    r.band([
        {data: row.favorite, width: 70, align: 'left'},
        {data: row.least, width: 70, align: 'right'}
    ],{border: 1});
};

var report = new Report("demo16.pdf")
    .data([{favorite: 'Butter Pecan', least: 'Pistachio'}])
    .pageHeader(pageHeader)
    .detail(detail);

report.render((err, name) => {
    const testing = {images: 1};
    displayReport(err, name, testing);
});
