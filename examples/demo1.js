var Report = require('../lib/fluentReports' ).Report;


function printreport() {
  'use strict';
  var mydata =
      [
        {name: "John Doe", week: 20, day: "Monday\nis- this is some really long text that shouldn't\noverflow the text container but be wrapped", hours: 4},
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
      ["", 80],
      [data.day, 100],
      [data.hours, 100, 3]
    ], {border:1, width: 0, wrap: 1} );
  };

  var namefooter = function ( report, data, state ) {
    report.band( [
      ["Totals for " + data.name, 180],
      [report.totals.hours, 100, 3]
    ] );
    report.newLine();
  };

  var nameheader = function ( report, data ) {
    report.print( data.name, {fontBold: true} );
  };

  var weekdetail = function ( report, data ) {
    report.print( ["Week Number: " + data.week], {x: 100} );
  };

  var totalFormatter = function(data, callback) {
   // if (data.hours) { data.hours = ': ' + data.hours; }
    callback(null, data);
  };


  // You don't have to pass in a report name; it will default to "report.pdf"
  var reportName = "demo1.pdf";

  var rpt = new Report(reportName)
	  .autoPrint(false) // Optional
      .pageHeader( ["Employee Hours"] )// Optional
      .finalSummary( ["Total Hours:", "hours", 3] )// Optional
      .userdata( {hi: 1} )// Optional 
      .data( mydata )	// REQUIRED
      .sum( "hours" )	// Optional
      .detail( daydetail ) // Optional
      .totalFormatter( totalFormatter ) // Optional
      .fontSize(8); // Optional

  rpt.groupBy( "name" )
      .sum( "hours" )
      .header( nameheader )
      .footer( namefooter )
      .groupBy( "week" )
         .header( weekdetail );

  // Debug output is always nice (Optional, to help you see the structure)
  rpt.printStructure();


  // This does the MAGIC...  :-)
  console.time("Rendered");
  var a= rpt.render(function(err, name) {
      console.timeEnd("Rendered");
      if (err) {
          console.error("Report had an error",err);
      } else {
        console.log("Report is named:",name);
      }
  });

}



printreport();