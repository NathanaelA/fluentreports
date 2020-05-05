// Array version of demo1

"use strict";

const Report = require('../lib/fluentReports' ).Report;
const displayReport = require('./reportDisplayer');

function printreport() {
  var mydata =
      [
          ["John Doe", 20, "Monday\nis- this is some really long text that shouldn't\noverflow the text container but be wrapped", 4],
          ["John Doe", 20, "Tuesday", null],
          ["John Doe", 20, "Wednesday", 8],
          ["John Doe", 21, "Thursday", 2],
          ["John Doe", 21, "Friday", 8],

          ["Jane Doe", 20, "Monday", 5],
          ["Jane Doe", 20, "Tuesday", 8],
          ["Jane Doe", 21, "Wednesday", 7],
          ["Jane Doe", 21, "Thursday", 8],
          ["Jane Doe", 21, "Friday", 8],

          ["John Doe", 22, "Monday", 4],
          ["John Doe", 22, "Tuesday", 8],
          ["John Doe", 22, "Wednesday", 8],
          ["John Doe", 23, "Thursday", 2],
          ["John Doe", 23, "Friday", 8],

          ["Jane Doe", 22, "Monday", 5],
          ["Jane Doe", 22, "Tuesday", 8],
          ["Jane Doe", 23, "Wednesday", 7],
          ["Jane Doe", 23, "Thursday", 8],
          ["Jane Doe", 23, "Friday", 8],

          ["John Doe", 25, "Monday", 4],
          ["John Doe", 25, "Tuesday", 8],
          ["John Doe", 25, "Wednesday", 8],
          ["John Doe", 26, "Thursday", 2],
          ["John Doe", 26, "Friday", 8],

          ["Jane Doe", 25, "Monday", 5],
          ["Jane Doe", 25, "Tuesday", 8],
          ["Jane Doe", 26, "Wednesday", 7],
          ["Jane Doe", 26, "Thursday\nis- this is some really long text that shouldn't\noverflow the text container but be wrapped", 8],
          ["Jane Doe", 26, "Friday\nis- this is some really long text that shouldn't\noverflow the text container but be wrapped", 8]
      ];

  var daydetail = function ( report, data, state, cb ) {

    report.band( [
        {data:"", width: 80},
            {data: data[2], width: 100, zborder:{left:1, right: 1, top: 1, bottom: 0}},
        {data: data[3], width: 100, underline: true, align: 3, zborder:{left:1, right: 1, top: 0, bottom: 1}}
    ], {border:1, width: 0, wrap: 1}, cb  );

  };

  var namefooter = function ( report, data, state, cb ) {
      report.band([
          ["Totals for " + data[0], 180],
          [report.totals[3], 100, 3]
      ], function() {
          report.newLine(cb);
      });

  };

  var nameheader = function ( report, data, state, cb ) {
          report.print( data[0], {fontBold: true, underline: true}, cb );
  };

  var weekdetail = function ( report, data, state, cb ) {
    // We could do this -->  report.setCurrentY(report.getCurrentY()+2);   Or use the shortcut below of addY: 2
    //  console.log("PRinting Week", data[1]);
    report.print( ["Week Number: " + data[1]], {x: 100, addY: 2}, cb );
  };

  var totalFormatter = function(data, callback) {
   // if (data.hours) { data.hours = ': ' + data.hours; }
    callback(null, data);
  };


  // You don't have to pass in a report name; it will default to "report.pdf"
  var reportName = "demo11.pdf";


  var rpt = new Report(reportName)//, {margins: {left:20, top:20, right: 20, bottom:20}})
      //.margins({left:20, top:0, bottom:20, right: 0})
      .autoPrint(false) // Optional
      .pageHeader( ["Employee Hours"] )// Optional
      .finalSummary( ["Total Hours:", 3, 3] )// Optional
      .userdata( {hi: 1} )// Optional 
      .data( mydata )	// REQUIRED
      .sum( 3 )	// Optional
      .detail( daydetail ) // Optional
      .totalFormatter( totalFormatter ) // Optional
      .fontSize(8); // Optional

  rpt.groupBy( 0 )
      .sum(3)
      .header( nameheader )
      .footer( namefooter )
      .groupBy( 1 )
         .header( weekdetail );




  // Debug output is always nice (Optional, to help you see the structure)
  if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(); }


//  var fs = require('fs');
 // var pipe = fs.createWriteStream('demo1.pdf');

 // rpt.outputType(Report.renderType.buffer);


  // This does the MAGIC...  :-)
    //Report.trace = true;
    //Report.callbackDebugging = true;

  rpt.render(function(err, name) {
      const testing = {images: 2, blocks: ["130,140,180,60"]};
      displayReport(err, name, testing);
  });
}





printreport();

