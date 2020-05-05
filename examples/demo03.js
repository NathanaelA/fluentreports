var Report = require('../lib/fluentReports' ).Report;
var fs = require('fs');
var displayReport = require('./reportDisplayer');


function printreport(options) {
    'use strict';
    options = options || {};

    var Current_Date = new Date().toDateString();

    var header = function(rpt, data) {

        // Confidential text, we need this first because everything else prints on top of it
        rpt.print('Confidential', {x: 40, y: 610, rotate: 310, opacity: 0.5, textColor: '#EEEEEE', width: 1000, fontSize: 127});


        // Company Info - Top Left
        rpt.setCurrentY(14);

        if (options.image && fs.existsSync(options.image)) {
            rpt.image(options.image, {width: 200});
        }
        rpt.setCurrentY(rpt.getCurrentY() - 10);

        if (options.address) { rpt.print(options.address, {x: 44}); }
        if (options.address2) { rpt.print(options.address2, {x: 44}); }
        if (options.city && options.state && options.postal) {
            rpt.print(options.city + ', ' + options.state + ' ' + options.postal, {x: 44});
        }

        // Print our nice Fax header
        rpt.print('FAX', {x: 420, y: 40, fontSize: 80});
        



        rpt.fontSize(13);
        rpt.setCurrentY(170);

        //rpt.font('Aparajita');
        rpt.fontItalic();
        rpt.band([
            {data: 'Date:', width: 78},
            {data: Current_Date, width: 240},
            {data: '# of Pages:', width: 78},
            {data: data.number_of_pages || 2, width: 200, align: 1}
        ], {font: "Times-Roman", fontBold: true, fontItalic: true});
        rpt.newLine();
        rpt.fontNormal();

        rpt.band([
            {data: 'To:', width: 78},
            {data: data.faxTo, width: 240},
            {data: 'Attention:', width: 78},
            {data: data.attention, width: 200}
        ]);
        rpt.newLine();

        rpt.band([
            {data: 'From:', width: 78},
            {data: data.from, width: 240},
            {data: 'Phone:', width: 78},
            {data: data.phone, width: 200}
        ]);
        rpt.newLine();

        rpt.newLine();
        rpt.print('Comments:', {fontBold: true});
        rpt.print(data.comments);
};

    var footer = function(rpt) {
        rpt.print(['This material is for the intended recipient.'], {fontBold: true, fontSize: 8, y: 740});
    };

    // If you change the callback to FALSE the report will be cancelled!
    var recordCount = function(count, callback) {
        console.log("We have", count, "records!");
        callback(null, true);
    };

    // You don't have to pass in a report name; it will default to "report.pdf"
    const reportName = "demo03.pdf";
    const testing = {images: 1, blocks: ["210,330,240,60"]};


    var rpt = new Report(reportName);

    console.log(__dirname);
    rpt
      .recordCount(recordCount)
      .margins(30)
      //.autoPrint(true)
      .header(header)
      .pageFooter(footer)

      .data(options.data);

    // Debug output is always nice (Optional, to help you see the structure)
    if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(); }


    // This does the MAGIC...  :-)
    console.time("Rendered");
    rpt.render(function(err, name) {
        console.timeEnd("Rendered");
        if (name === false) {
            console.log("Report has been cancelled!");
        } else {
            displayReport(err, name, testing);
        }
    });

}

const imgLoc = __dirname + "/example_image.jpg";



printreport({
    image: imgLoc,
    name: "James Smith",
    company: "ACME Industries",
    address: "1234 Nowhere St",
    city: "Here",
    state: "Texas",
    postal: "0000",
    data: [{
        phone: "800-555-1212",
        faxTo: "800-555-1211",
        from: "Me",
        attention: "You",
        number_of_pages: 5,
        comments: "Here is the proposal you wanted, it should match what we discussed on the phone.  If this is acceptable; please let me know."
    }]
});