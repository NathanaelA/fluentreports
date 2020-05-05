"use strict";

// This prints the measurement on bands / footer for printing and paging purposes
// Currently working

const Report = require('../lib/fluentReports.js' ).Report;
const displayReport = require('./reportDisplayer');

const primary_data  = [
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


function printReport() {

        const detail = function(x, r){
            x.band([
                {data: r.description, width: 240},
                {data: r.qty, width: 60, align: 3},
                {data: r.price, width: 70, align: 3},
                {data: r.amount.toFixed(2), width: 90, align: 3},
                {data: r.annual, width: 70, align: 3}
            ], {x: 30});
        };

        const insideHeader = function(rpt){
            rpt.fontSize(11);
            rpt.band([
                {data: 'Description', width: 250},
                {data: 'Qty', width: 60, align: 3},
                {data: 'Price', width: 70, align: 3},
                {data: 'Ext. Price', width: 90, align: 3},
                {data: 'Annual', width: 70, align: 3}
            ],{x: 0});
            rpt.bandLine(1);
        };

      const proposalHeader = function(rpt, data ) {
            const fSize = 9;
            rpt.print('Some Proposal Header', {x: 40, fontsize: fSize});
            rpt.print('THIS IS NOT AN INVOICE', {x: 40, y: 100, fontsize: fSize + 4, fontBold: true});
            rpt.print('Questions? Please call us.', {x: 40, y: 150, fontsize: fSize});
            rpt.band([{data: 'Proposal #:', width: 100}, {data: data.no, width: 100}], {x: 400, y: 60});
            rpt.band([{data: 'Date Prepared:', width: 100}, {data: data.date, width: 100, fontSize: 9}], {x: 400});
            rpt.band([{data: 'Prepared By:', width: 100}, {data: data.name, width: 100, fontSize: 9}], {x: 400});
            rpt.band([{data: 'Prepared For:', width: 100}], {x: 400});
            rpt.fontSize(9);
            if (data.name) {
                rpt.band([{data: data.name, width: 150}], {x: 400});
            }
            if (data.address_1) {
                rpt.band([{data: data.address_1, width: 150}], {x: 400});
            }
            if (data.address_2) {
                rpt.band([{data: data.address_2, width: 150}], {x: 400});
            }
            if (data.city) {
                rpt.band([{data: data.city + ", " + data.state + " " + data.zip, width: 150}], {x: 400});
            }

            rpt.fontSize(8);
            rpt.print('This quote is good for 60 days from the date prepared. Product availability is subject to change without notice. Due to rapid changes in technology, ' +
            'and to help us keep our prices competitive, we request that you appropriate an additional 5-10% of the hardware shown on the proposal to compensate ' +
            'for possible price fluctuations between the date this proposal was prepared and the date you place your order.  Once a proposal has been approved and  ' +
            'hardware ordered, returned goods are subject to a 15% restocking fee.', {x: 40, y: 175, width: 540});
            rpt.newline();
            rpt.print('Any travel fees quoted on this proposal may be reduced to reflect actual travel expenses.', {x: 40});
            rpt.newline();
        };

const proposalFooter = function(rpt) {
    rpt.saveState();
    rpt.fontSize(7.5);
    rpt.print('*If your office accepts this proposal and it contains equipment for purchase through state contract, please contact KellPro for ' +
        'state contract ordering information.', {x: 40, width: 570});
    rpt.print('To place an order for the goods and services provided by us, please either contact us to place your order or fax a copy ' +
        'of your PO to ', {x: 40, width: 570});// + company.fax + '.');
    rpt.print('Please call us if you have any other questions about how to order. Thank you for your business!', {x: 40, width: 570});
    rpt.resetState();
};

    const reportName = __dirname + "/demo08.pdf";

    const report = new Report(reportName, {font: "Arimo"}).data([{name: 'Test Client',  no: 'a12345', date: '2015-01-01'}])
        .registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'});

    const r = report
        .margins(20)
        .pageheader(function(rpt){
            rpt.pageNumber({header:true, text: "Page {0} of {1}"});
            rpt.printedAt({true:true});
            rpt.print('Here\'s the Main page header', {align: "center"});
            rpt.newLine();
        })
    .pagefooter(function(x){x.print(new Date().toString());});

 	const subReport = new Report(report).data(primary_data);

	subReport
        .pageheader(insideHeader)
		.detail(detail);

	report
        .header( proposalHeader )
        .footer( proposalFooter );

    r.render(function(err, name) {
	console.log("Name:", name);
        const testing = {images: 2, debugImage: true, blocks: ["27,33,288,75", "30,1545,800,50", "30,909,800,60"]};

        displayReport(err, name, testing);

        });

    if (typeof process.env.TESTING === "undefined") { r.printStructure(1); }

}


printReport();