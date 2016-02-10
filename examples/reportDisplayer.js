"use strict";

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

// ----------------------------------------------------------------------------------------------
// Need to populate this with Application paths for popular PDF readers
// ----------------------------------------------------------------------------------------------
var PDFApplications = ["C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\Foxit Reader.exe",
    "C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\FoxitReader.exe"];

module.exports = function(err, reportName) {
    if (err) {
        console.error("Your report", reportName, "had errors", err);
        return;
    }
    var found = false;

    for (var i=0;i<PDFApplications.length;i++) {
        if (fs.existsSync(PDFApplications[i])) {
            child_process.execFile(PDFApplications[i], [reportName], function () {  });
            found = true;
            break;
        }
    }
    if (!found) {
        console.log("Your report has been rendered to", reportName);
    }

};