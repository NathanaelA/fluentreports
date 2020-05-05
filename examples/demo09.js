"use strict";
// This tests the importing of other PDF's into the current report and it is working.

var fs = require('fs');
const displayReport = require('./reportDisplayer');


var pdfkit = require('../lib/fluentReports.pdfkit');


var inFile = __dirname + '/demo05.pdf';
var outFile = 'demo09.pdf';
const testing = {images: 4, blocks: ["210,330,240,60"]};

var showPDFs = true;

if (process.argv.length > 2) {
  inFile = process.argv[2];
    if (process.argv.length > 3) {
        outFile = process.argv[3];
    }
    showPDFs = false;
}
console.log("Reading", inFile, " --- Writing: ", outFile);





var buffer = fs.readFileSync(inFile);

var pdf = new pdfkit();



pdf.text("Page 1, Prior to Importing PDF");
pdf.addPage();
console.log("- Import PDF1");
var result = pdf.importPDF(buffer);
console.log("- Writing to Page 2", result);
pdf.text("Page 3, After Importing PDF");
//pdf.deletePage(0);
pdf.addPage();
pdf.text("Page 4, Manually adding a new page");
/*  console.error("- Import PDF2");
var buffer2 = fs.readFileSync('test/1.pdf');
pdf.importPDF(buffer2);
console.error("- Done Import 2");  */


function writeReport(PDF, callback) {
    const writeStream = fs.createWriteStream(outFile);
    writeStream.once('finish', callback);
    PDF.pipe(writeStream);
    PDF.end();
}

writeReport(pdf, () => {
    displayReport(null, outFile, testing);
});


