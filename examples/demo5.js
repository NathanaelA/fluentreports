var Report = require('../lib/fluentReports' ).Report;

var primary_data  = [
    {no: 1, date: '08-17-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 5, price: 2.21, amount: 5.55, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-18-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 1, price: 2.21, amount: 2.21, description: "product 1", "product.product_type": 1},
    {no: 1, date: '08-19-2014', name: "John Doe", address_1: "add 1", address_2: "addd_2", city: "city", state: 'ok', zip: '00000', qty: 15, price: 4.21, amount: 15.55, description: "product 2", "product.product_type": 2},
];


function printreport() {
  'use strict';

        var detail = function(x, r){
            x.band([
                {data: r.description, width: 240},
                {data: r.quantity, width: 60, align: 3},
                {data: r.price, width: 70, align: 3},
                {data: r.amount, width: 90, align: 3},
                {data: r.annual, width: 70, align: 3}
            ], {x: 30});
        };

        var productTypeHeader = function(x, r){
            x.fontBold();
            x.band([
                {data: r.name, width: 240,fontBold: true }
            ], {x: 20});
            x.fontNormal();
        };

        var productTypeFooter = function(x, r){
            x.fontBold();
            x.band([
                {data: r.name+' Total:', width: 130, align: 3},
                {data: x.totals.amount, width: 90, align: 3},
            ], {x: 270});
            x.fontNormal();
        };

        var proposalHeader = function(x, r){
            var fSize = 9;
            x.print('Some address in Duncan OK 73533',{x: 0, fontsize: fSize});
            x.print('THIS IS NOT AN INVOICE',{x: 40, y: 100 , fontsize: fSize+4, fontBold: true });
            x.print('Questions? Please call us.',{x: 40, y: 150 , fontsize: fSize });
            x.band([{data: 'Proposal #:', width: 100}, {data: r.no, width: 100}], {x: 400, y: 60});
            //HELP: band() fontsize needs to be case insensitive
            x.band([{data: 'Date Prepared:', width: 100}, {data: r.date, width: 100, fontSize: 9}], {x: 400});
        x.band([{data: 'Prepared By:', width: 100}, {data: r.name, width: 100, fontSize: 9}], {x: 400});
    x.band([{data: 'Prepared For:', width: 100}], {x: 400});
    x.fontSize(9);
    if(r.name){
        x.band([{data: r.name, width: 150}], {x: 400});
    }
    if(r.address_1){
        x.band([{data: r.address_1, width: 150}], {x: 400});
    }
    if(r.address_2){
        x.band([{data: r.address_2, width: 150}], {x: 400});
    }
    if(r.city){
        x.band([{data: r.city + ", " + r.state + " " + r.zip , width: 150}], {x: 400});
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
    ],{x: 0});
    x.bandLine(1);
};

var proposalFooter = function(x, r) {
    x.fontSize(7.5);
    x.print('*If your office accepts this proposal and it contains equipment for purchase through state contract, please contact KellPro for ' +
        'state contract ordering information.', {x: 40, width: 570});
    x.print('To place an order for the goods and services provided by us, please either contact us to place your order or fax a copy ' +
        'of your PO to ', {x: 40, width: 570});// + company.fax + '.');
    x.print('Please call us if you have any other questions about how to order. Thank you for your business!', {x: 40, width: 570});
};



    var report = new Report("demo5.pdf").data(primary_data);


    var r = report
    .margins(20)
    .pageheader(function(x){x.print('simple page header');})
    .detail(detail);


    report.groupBy( "no" )
        .sum( "invoice.amount_due" )
        .header( proposalHeader )
        .footer( proposalFooter )
        .groupBy( "product.product_type" )
        .sum( "amount" )
        .header( productTypeHeader )
          .footer( productTypeFooter );


    r.printStructure();
    r.render();


}


printreport();