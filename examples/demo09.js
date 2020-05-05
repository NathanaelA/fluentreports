"use strict";
// This tests the importing of other PDF's into the current report and it is working.

const fs = require('fs');
const displayReport = require('./reportDisplayer');
const Report = require('../lib/fluentReports' ).Report;
const pdfkit = require('../lib/fluentReports.pdfkit');


let inFile = __dirname + '/demo09a.pdf';
let outFile = __dirname + '/demo09.pdf';
const testing = {images: 4, blocks: ["210,330,240,60"]};

let createImgPDF = true;

if (process.argv.length > 2) {
  inFile = process.argv[2];
    if (process.argv.length > 3) {
        outFile = process.argv[3];
    }
    createImgPDF = false;
}
console.log("Reading", inFile, " --- Writing: ", outFile);

let P;
if (createImgPDF) {
    const header = function(rpt) {
        const img = __dirname + "/example_image.jpg";

        if (fs.existsSync(img)) {
            rpt.image(img, {width: 200, x: 200, y: 200});
        } else {
            throw new Error("Missing Example_Image.jpg");
        }
    };

    const rpt = new Report(inFile);

    rpt.header(header).data([{}]);
    P = rpt.render((err, name) => {
        console.log("Here", name);
    });
} else {
    P = Promise.resolve();
}


P.then(() => {
    console.log("Here 2");
    const buffer = fs.readFileSync(inFile);

    const pdf = new pdfkit();
    pdf.font(__dirname + '/Fonts/Arimo-Regular.ttf');

    pdf.text("Page 1, Prior to Importing PDF");
    pdf.addPage();
    console.log("- Import PDF1");
    let result = pdf.importPDF(buffer);
    console.log("- Writing to Page 2", result);
    pdf.text("Page 3, After Importing PDF");
//pdf.deletePage(0);
    pdf.addPage();
    pdf.text("Page 4, Manually adding a new page");


    writeReport(pdf, () => {
        displayReport(null, outFile, testing);
    });
});

function writeReport(PDF, callback) {
    const writeStream = fs.createWriteStream(outFile);
    writeStream.once('finish', callback);
    PDF.pipe(writeStream);
    PDF.end();
}


