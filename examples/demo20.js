"use strict";

// Test 20 - Opacity
// Test 20 - Report Pipes

const Report = require('../lib/fluentReports' ).Report;
const displayReport = require('./reportDisplayer');

function printreport() {
  const mydata =
      [
          {
              "group": 1,
              "amount": 5
          },
          {
              "group": 1,
              "amount": 10
          }
      ];

  const groupfooter = function ( report, data, state ) {
//      report.print("hi this is a test", {opacity: 0.5});
      report.band([
          ["Totals for " + data.group, 180],
          [report.totals.amount, 100, 3]
      ], {addY: 1, opacity: 0.4});
      report.newLine();
  };




  // Example showing how to use report w/ PIPEs
  const reportName = "demo20.pdf";

  const fs = require('fs');
  const pipe = fs.createWriteStream(reportName);

  const rpt = new Report(pipe)//, {margins: {left:20, top:20, right: 20, bottom:20}})

      .autoPrint(false) // Optional
      .userdata( {hi: 1} )// Optional
      .data( mydata )	// REQUIRED
        .sum('amount');

  rpt.groupBy( "group" )
      .sum('amount')
      .footer( groupfooter );



  // This does the MAGIC...  :-)
  console.time("Rendered");
  rpt.render(function(err) {
      console.timeEnd("Rendered");
      const testing = {images: 1};
      pipe.close();

      displayReport(err, reportName, testing);
  });

    // Debug output is always nice (Optional, to help you see the structure)
   if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(true); }


}


printreport();


