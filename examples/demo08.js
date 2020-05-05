// This prints the measurement on bands / footer for printing and paging purposes
// Currently working

var Report = require('../lib/fluentReports.js' ).Report;
var displayReport = require('./reportDisplayer');

var primary_data  = [
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1},    
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 10, amount: 10.10, description: "product 1", "product.product_type": 1}
];


function printreport() {
  'use strict';

        var detail = function(x, r){
            x.band([
                {data: r.description, width: 240},
                {data: r.qty, width: 60, align: 3},
                {data: r.price, width: 70, align: 3},
                {data: r.amount.toFixed(2), width: 90, align: 3},
                {data: r.annual, width: 70, align: 3}
            ], {x: 30});
        };

        var insideheader = function(x, r, y){
            x.fontSize(11);
            x.band([
                {data: 'Description', width: 250},
                {data: 'Qty', width: 60, align: 3},
                {data: 'Price', width: 70, align: 3},
                {data: 'Ext. Price', width: 90, align: 3},
                {data: 'Annual', width: 70, align: 3}
            ],{x: 0});
            x.bandLine(1);
        };

        var productTypeHeader = function(x, r){
            x.fontBold();
            x.band([
                {data: r.name, width: 240,fontBold: true },
                {data: x.totals.amount, width: 90,fontBold: true },                
            ], {x: 20});
            x.fontNormal();
        };

        var productTypeFooter = function(x, r){
            x.fontBold();
            x.band([
                {data: x.totals.amount_cnt, width: 50, align: 3},
                {data: r.name+' Total:', width: 130, align: 3},
                {data: x.totals.amount.toFixed(2), width: 90, align: 3}
            ], {x: 270});
            x.fontNormal();
            x.totals.amount = null;
        };
      var proposalHeader = function(x, r, s) {
            var fSize = 9;
            x.print('Some Proposal Header', {x: 40, fontsize: fSize});
            x.print('THIS IS NOT AN INVOICE', {x: 40, y: 100, fontsize: fSize + 4, fontBold: true});
            x.print('Questions? Please call us.', {x: 40, y: 150, fontsize: fSize});
            x.band([{data: 'Proposal #:', width: 100}, {data: r.no, width: 100}], {x: 400, y: 60});
            x.band([{data: 'Date Prepared:', width: 100}, {data: r.date, width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared By:', width: 100}, {data: r.name, width: 100, fontSize: 9}], {x: 400});
            x.band([{data: 'Prepared For:', width: 100}], {x: 400});
            x.fontSize(9);
            if (r.name) {
                x.band([{data: r.name, width: 150}], {x: 400});
            }
            if (r.address_1) {
                x.band([{data: r.address_1, width: 150}], {x: 400});
            }
            if (r.address_2) {
                x.band([{data: r.address_2, width: 150}], {x: 400});
            }
            if (r.city) {
                x.band([{data: r.city + ", " + r.state + " " + r.zip, width: 150}], {x: 400});
            }

            x.fontSize(8);
            x.print('This quote is good for 60 days from the date prepared. Product availability is subject to change without notice. Due to rapid changes in technology, ' +
            'and to help us keep our prices competitive, we request that you appropriate an additional 5-10% of the hardware shown on the proposal to compensate ' +
            'for possible price fluctuations between the date this proposal was prepared and the date you place your order.  Once a proposal has been approved and  ' +
            'hardware ordered, returned goods are subject to a 15% restocking fee.', {x: 40, y: 175, width: 540});
            x.newline();
            x.print('Any travel fees quoted on this proposal may be reduced to reflect actual travel expenses.', {x: 40});
            x.newline();
        };

var proposalFooter = function(x, r) {
    x.saveState();
    x.fontSize(7.5);
    x.print('*If your office accepts this proposal and it contains equipment for purchase through state contract, please contact KellPro for ' +
        'state contract ordering information.', {x: 40, width: 570});
    x.print('To place an order for the goods and services provided by us, please either contact us to place your order or fax a copy ' +
        'of your PO to ', {x: 40, width: 570});// + company.fax + '.');
    x.print('Please call us if you have any other questions about how to order. Thank you for your business!', {x: 40, width: 570});
    x.resetState();
};

    var report = new Report("demo08.pdf").data([{name: 'Test Client',  no: 'a12345', date: '2015-01-01'}]);

    var r = report
    .margins(20)
    .pageheader(function(x){
            x.pageNumber({header:true, text: "Page {0} of {1}"});
            x.printedAt({true:true});
            x.print('Here\'s the Main page header', {align: "center"});
            x.newLine();
        })
    .pagefooter(function(x){x.print(new Date().toString());});

 	var subreport = new Report(report).data(primary_data);

	var s = subreport
        .pageheader(insideheader)
		.detail(detail);

	report
    	//.detail(function(x, r){})
        .header( proposalHeader )
        .footer( proposalFooter );


  /*  subreport.groupBy( "no" )
        .groupBy( "product.product_type" )
       	//.header(insideheader)
        .sum( "amount" )
        .count( "amount" ); */


    r.render(function(err, name) {
	console.log("Name:", name);
        const testing = {images: 2, blocks: ["27,33,288,75","30,1545,760,50", "30,909,680,60"]};

        displayReport(err, name, testing);

        });

    if (typeof process.env.TESTING === "undefined") { r.printStructure(1); }

}


printreport();