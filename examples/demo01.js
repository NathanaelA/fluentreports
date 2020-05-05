"use strict";

const Report = require('../lib/fluentReports' ).Report;
const displayReport = require(__dirname + '/reportDisplayer');

function printreport() {
  var mydata =
      [
        {name: "John Doe", week: 20, day: "Monday\nthis is some really long text that shouldn't\noverflow the text container but be wrapped", hours: 4},
        {name: "John Doe", week: 20, day: "Tuesday", hours: 8},
        {name: "John Doe", week: 20, day: "Wednesday", hours: 8},
        {name: "John Doe", week: 21, day: "Thursday", hours: 2},
        {name: "John Doe", week: 21, day: "Friday", hours: 8},

        {name: "Jane Doe", week: 20, day: "Monday", hours: 5},
        {name: "Jane Doe", week: 20, day: "Tuesday", hours: 8},
        {name: "Jane Doe", week: 21, day: "Wednesday", hours: 7},
        {name: "Jane Doe", week: 21, day: "Thursday", hours: 8},
        {name: "Jane Doe", week: 21, day: "Friday", hours: 8},

        {name: "John Doe", week: 22, day: "Monday", hours: 4},
        {name: "John Doe", week: 22, day: "Tuesday", hours: 8},
        {name: "John Doe", week: 22, day: "Wednesday", hours: 8},
        {name: "John Doe", week: 23, day: "Thursday", hours: 2},
        {name: "John Doe", week: 23, day: "Friday", hours: 8},
        {name: "Jane Doe", week: 22, day: "Monday", hours: 5},
        {name: "Jane Doe", week: 22, day: "Tuesday", hours: 8},
        {name: "Jane Doe", week: 23, day: "Wednesday", hours: 7},
        {name: "Jane Doe", week: 23, day: "Thursday", hours: 8},
        {name: "Jane Doe", week: 23, day: "Friday", hours: 8},

        {name: "John Doe", week: 25, day: "Monday", hours: 4},
        {name: "John Doe", week: 25, day: "Tuesday", hours: 8},
        {name: "John Doe", week: 25, day: "Wednesday", hours: 8},
        {name: "John Doe", week: 26, day: "Thursday", hours: 2},
        {name: "John Doe", week: 26, day: "Friday", hours: 8},
        {name: "Jane Doe", week: 25, day: "Monday", hours: 5},
        {name: "Jane Doe", week: 25, day: "Tuesday", hours: 8},
        {name: "Jane Doe", week: 26, day: "Wednesday", hours: 7},
        {name: "Jane Doe", week: 26, day: "Thursday\nis- this is some really long text that shouldn't\noverflow the text container but be wrapped", hours: 8},
        {name: "Jane Doe", week: 26, day: "Friday\nis- this is some really long text that shouldn't\noverflow the text container but be wrapped", hours: 8}

      ];

  var daydetail = function ( report, data ) {
    report.band( [
        {data:"", width: 80},
            {data: data.day, width: 100, zborder:{left:1, right: 1, top: 1, bottom: 0}},
        {data: data.hours, width: 100, underline: true, align: 3, zborder:{left:1, right: 1, top: 0, bottom: 1}}
    ], {border:1, width: 0, wrap: 1} );
  };

  var namefooter = function ( report, data, state ) {
      report.band([
          ["Totals for " + data.name, 180],
          [report.totals.hours, 100, 3]
      ], {addY: 1});
      report.newLine();
  };

  var nameheader = function ( report, data ) {
          report.print( data.name, {fontBold: true, underline: true} );
  };

  var weekdetail = function ( report, data ) {
    // We could do this -->  report.setCurrentY(report.getCurrentY()+2);   Or use the shortcut below of addY: 2
    report.print( ["Week Number: " + data.week], {x: 100, addY: 2} );
  };

  var totalFormatter = function(data, callback) {
   // if (data.hours) { data.hours = ': ' + data.hours; }
    callback(null, data);
  };




  // You don't have to pass in a report name; it will default to "report.pdf"
  const reportName = "demo01.pdf";
  const testing = {images: 2, blocks: ["130,140,180,60"]};


  var rpt = new Report(reportName)//, {margins: {left:20, top:20, right: 20, bottom:20}})
      //.margins({left:20, top:20, bottom:20, right: 0})
      .autoPrint(false) // Optional
      .pageHeader( ["Employee Hours"] )// Optional
      .pageFooter( "PageFooter" )
      .finalSummary( ["Total Hours:", "hours", 3] )// Optional
      .userdata( {hi: 1} )// Optional 
      .data( mydata )	// REQUIRED
      .sum( "hours" )	// Optional
      .detail( daydetail ) // Optional
      .totalFormatter( totalFormatter ) // Optional
      .fontSize(8); // Optional

  rpt.groupBy( "name" )
      .sum('hours')
      .header( nameheader) //, {runHeader: Report.show.always} )
      .footer( namefooter )
      .groupBy( "week" )
         .header( weekdetail );


 //
 //  var fs = require('fs');
 // var pipe = fs.createWriteStream(reportName);
 // rpt.outputType(Report.renderType.buffer);


  // This does the MAGIC...  :-)
  console.time("Rendered");
  rpt.render(function(err, name) {
      console.timeEnd("Rendered");
      displayReport(err, name, testing);
  });


    // Debug output is always nice (Optional, to help you see the structure)
   if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(true); }



}


printreport();


