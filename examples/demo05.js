var Report = require('../lib/fluentReports' ).Report;
var displayReport = require('./reportDisplayer');

// Thanks to AJ Paglia for the font we are using in our demo
// Aldo the Apache Font is FREE by AJ Paglia
// http://ajpaglia.com/



var primary_data  = [
    {no: 1, date: '08-17-2015', name: "John Doe", type: "Hardware", address_1: "address 1 road 2", address_2: "", city: "city", state: 'ok', zip: '00000', qty: 2, price: 2.21, amount: 4.42, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2015', name: "John Doe", type: "Hardware", address_1: "address 1 road 2", address_2: "", city: "city", state: 'ok', zip: '00000', qty: 1, price: 2.21, amount: 2.21, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-19-2015', name: "John Doe", type: "Software", address_1: "address 1 road 2", address_2: "", city: "city", state: 'ok', zip: '00000', qty: 9, price: 4.21, amount: 37.89, description: "product 2", "product.product_type": 2}
];


function printreport() {
  'use strict';

        var detail = function(x, r, s){
            x.band([
                {data: r.description, width: 240},
                {data: r.qty, width: 60, align: 3},
                {data: r.price, width: 70, align: 3},
                {data: r.amount, width: 90, align: 3},
                {data: r.annual, width: 70, align: 3}
            ], {x: 30} );
        };

        var productTypeHeader = function(x, r){
            x.fontBold();
            x.band([
                {data: r.type, width: 240,fontBold: true }
            ], {x: 20});
            x.fontNormal();
        };

        var productTypeFooter = function(x, r){
            x.fontBold();
            x.band([
                {data: r.type+' Total:', width: 130, align: 3},
                {data: x.totals.amount, width: 90, align: 3}
            ], {x: 270});
            x.fontNormal();
        };

        var proposalHeader = function(x, r) {
            var fSize = 9;
            x.print('Some address in Duncan, OK 73533', {x: 20, fontsize: fSize});
            x.print("PROPOSAL", {x: 40, y: 70, fontSize: fSize+19, fontBold: true, font: "AldotheApache"});
            x.print('THIS IS NOT AN INVOICE', {x: 40, y: 100, fontsize: fSize + 4, fontBold: true});
            x.print('Questions? Please call us.', {x: 40, y: 150, fontsize: fSize});
            x.band([{data: 'Proposal #:', width: 100}, {data: "12345", width: 100, align: "left", fontSize: 9}], {x: 400, y: 60});
            x.band([{data: 'Date Prepared:', width: 100}, {data: r.date, width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared By:', width: 100}, {data: "Jake Snow", width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared For:', width: 100}], {x: 400});
            x.fontSize(9);

            if (r.name) {
                x.band([{data: r.name, width: 150}], {x: 410});
            }
            if (r.address_1) {
                x.band([{data: r.address_1, width: 150}], {x: 410});
            }
            if (r.address_2) {
                x.band([{data: r.address_2, width: 150}], {x: 410});
            }
            if (r.city) {
                x.band([{data: r.city + ", " + r.state + " " + r.zip, width: 150}], {x: 410});
            }

            x.fontSize(8);
            x.print('This quote is good for 60 days from the date prepared. Product availability is subject to change without notice. Due to rapid changes in technology, ' +
            'and to help us keep our prices competitive, we request that you appropriate an additional 5-10% of the hardware shown on the proposal to compensate ' +
            'for possible price fluctuations between the date this proposal was prepared and the date you place your order.  Once a proposal has been approved and  ' +
            'hardware ordered, returned goods are subject to a 15% restocking fee.', {x: 40, y: 175, width: 540});
            x.newline();
            x.print('Any travel fees quoted on this proposal may be reduced to reflect actual travel expenses.', {x: 40});
            x.newline();
            x.fontSize(11);
            x.band([
                {data: 'Description', width: 250},
                {data: 'Qty', width: 60, align: 3},
                {data: 'Price', width: 70, align: 3},
                {data: 'Ext. Price', width: 90, align: 3},
                {data: 'Annual', width: 70, align: 3}
            ], {x: 0});  // , font: "AldotheApache"});
            x.bandLine(1);
        };

var proposalFooter = function(x, r) {
    x.fontSize(7.5);
    x.print('To place an order for the goods and services provided by us, please either contact us to place your order or fax a copy ' +
        'of your PO to 999-555-1212', {x: 40, width: 570});
    x.print('Please call us if you have any other questions about how to order. Thank you for your business!', {x: 40, width: 570});
};

    const reportName = __dirname + "/demo05.pdf";
    const testing = {images: 1};


    var report = new Report(reportName).data(primary_data);

    // Normally you would register a different font for each normal, bold, and italic; but for space size we are registering the same font for all three
    report.registerFont("AldotheApache", {normal: __dirname+'/Fonts/AldotheApache.ttf', bold: __dirname+'/Fonts/AldotheApache.ttf', 'italic': __dirname+'/Fonts/AldotheApache.ttf'});
    report.registerFont("Helvetica", {normal: __dirname+'/Fonts/OpenSans-Regular.ttf', bold: __dirname+'/Fonts/OpenSans-Bold.ttf', 'italic': __dirname+'/Fonts/OpenSans-Italic.ttf'});


    var r = report
    .margins(20)
    .pageheader(function(x){x.print('simple page header');})
    .detail(detail);


    report.groupBy( "no" )
        .header( proposalHeader )
        .footer( proposalFooter )
        .groupBy( "product.product_type" )
        .sum( "amount" )
        .header( productTypeHeader )
          .footer( productTypeFooter );

    if (typeof process.env.TESTING === "undefined") { r.printStructure(); }



    r.render(function(err, name) {
        displayReport(err, name, testing);
    });


}


printreport();