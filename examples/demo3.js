var Report = require('../lib/fluentReports' ).Report;
var fs = require('fs');
var displayReport = require('./reportDisplayer');


function printreport(options) {
    'use strict';
    options = options || {};

    var Current_Date = new Date().toDateString();

    var header = function(rpt, data) {
        // Company Info - Top Left
        rpt.setCurrentY(14);

        if (options.image && fs.existsSync(options.image)) {
            rpt.image(options.image, {width: 200});
        }
        rpt.setCurrentY(rpt.getCurrentY() - 10);

        if (options.address) rpt.print(options.address, {x: 44});
        if (options.address2) rpt.print(options.address2, {x: 44});
        if (options.city && options.state && options.postal) {
            rpt.print(options.city + ', ' + options.state + ' ' + options.postal, {x: 44});
        }
        //var baseY = rpt.getCurrentY();

        rpt.setCurrentY(40);
        rpt.fontSize(80);

        rpt.print('FAX', {x: 400});
        rpt.fontSize(13);
        rpt.newLine(2);

        //rpt.font('Aparajita');
        rpt.fontItalic();
        rpt.band([
            {data: 'Date:', width: 78},
            {data: Current_Date, width: 200},
            {data: '# of Pages:', width: 78}, //, font:"Aparajita"},
            {data: data.number_of_pages || 2, width: 200, align: 1}
        ], {font: "Times-Roman", fontBold: true, fontItalic: true}); //"Aparajita"});
        rpt.newLine();
        rpt.fontNormal();

        rpt.band([
            {data: 'To:', width: 78},
            {data: data.faxTo, width: 200},
            {data: 'Attention:', width: 78},
            {data: data.attention, width: 200}
        ]);
        rpt.newLine();

        rpt.band([
            {data: 'From:', width: 78},
            {data: data.from, width: 200},
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

    // You don't have to pass in a report name; it will default to "report.pdf"
    var reportName = "demo3.pdf";
    var rpt = new Report(reportName);

    rpt
      .margins(30)
      //.autoPrint(true)
      .header(header)
      .pageFooter(footer)
      .registerFont("Aparajita", {normal: './aparaj.ttf', bold: './aparajb.ttf', 'italic': './aparaji.ttf'})
      .data(options.data);

    // Debug output is always nice (Optional, to help you see the structure)
    rpt.printStructure();

    // This does the MAGIC...  :-)
    console.time("Rendered");
    rpt.render(function(err, name) {
        console.timeEnd("Rendered");
        displayReport(err, name);
    });

}

var imgLoc = "";

// Depending on where the report is run from, the image location might be in the wrong folder; so we fix it here
if (fs.existsSync("./example_image.jpg")) {
    imgLoc = "./example_image.jpg";
} else {
    imgLoc = "./examples/example_image.jpg";
}



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
        comments: "Here is the proposal you wanted, it should match what we discussed on the phone."
    }]
});