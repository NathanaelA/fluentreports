var Report = require('../lib/fluentReports' ).Report;
var displayReport = require('./reportDisplayer');

var primary_data  = [
    {id: 1, name: "John Doe"},
    {id: 3, name: "Sarah Williams"},
    {id: 5, name: "Jane Doe"}
];

var secondary_data = {
   1: [
       {week: 20, day: "Monday", hours: 4},
       {week: 20, day: "Tuesday", hours: 8},
       {week: 20, day: "Wednesday", hours: 8},
       {week: 21, day: "Thursday", hours: -2},
       {week: 21, day: "Friday", hours: 8},

       {week: 22, day: "Monday", hours: 4},
       {week: 22, day: "Tuesday", hours: 8},
       {week: 22, day: "Wednesday", hours: 8},
       {week: 23, day: "Thursday", hours: 2},
       {week: 23, day: "Friday", hours: 8},

       {week: 25, day: "Monday", hours: 4},
       {week: 25, day: "Tuesday", hours: 8},
       {week: 25, day: "Wednesday", hours: 8},
       {week: 26, day: "Thursday", hours: 2},
       {week: 26, day: "Friday", hours: 8}
   ],
   3: [
       {week:20, day: "Monday", hours: 8}
   ],
   5: [
       {week: 20, day: "Monday", hours: 5},
       {week: 20, day: "Tuesday", hours: 8},
       {week: 21, day: "Wednesday", hours: 7},
       {week: 21, day: "Thursday", hours: 8},
       {week: 21, day: "Friday", hours: 8},

       {week: 22, day: "Monday", hours: 5},
       {week: 22, day: "Tuesday", hours: 8},
       {week: 23, day: "Wednesday", hours: 7},
       {week: 23, day: "Thursday", hours: 8},
       {week: 23, day: "Friday", hours: 8},

       {week: 25, day: "Monday", hours: 5},
       {week: 25, day: "Tuesday", hours: 8},
       {week: 26, day: "Wednesday", hours: 7},
       {week: 26, day: "Thursday", hours: 8},
       {week: 26, day: "Friday", hours: 8}

   ]
};

// We are going to pretend that we are running queries to get this data.  ;-)
function sql_select(query) {
    "use strict";
    if (query === 0 || query == null) {
        return primary_data;
    }
    if (secondary_data[query]) {
        return secondary_data[query];
    }
    return [];
}



function printreport() {
  'use strict';
  var counter = 0;
  var daydetail = function ( report, data ) {
      counter++;
    report.band( [
        {data: "", width: 80},
        {data: data.day, width: 100},
        {data: data.hours, width: 100, align: 3, textColor: data.hours < 0 ? '#FF0000' : "#000000"}
    ], {border:0, width: 0, wrap: 1, fill: counter % 2 === 0 ? '#f0f0f0' : '#e0e0e0', textColor: '#0000ff'} );
  };

  var nameFooter = function ( report, data ) {
    report.band( [
      ["Totals for " + data.name, 180],
      [report.totals.hours, 100, 3]
    ] );
      report.newLine();
  };

  var nameHeader = function ( report, data ) {
    report.print( data.name, {fontBold: true, fill: '#6f6f6f', textColor: '#ffffff', link: "http://www.fluentReports.com/"} );
  };

  var weekDetail = function ( report, data ) {
    // We could do this -->  report.setCurrentY(report.getCurrentY()+2);   Or use the shortcut below of addY: 2
    report.print( ["Week Number: " + data.week], {x: 100, addY: 2} );
  };

  var totalFormatter = function(data, callback) {
   // if (data.hours) { data.hours = ': ' + data.hours; }
    callback(null, data);
  };


  // You don't have to pass in a report name; it will default to "report.pdf"
  var reportName = "demo04.pdf";
  const testing = {images: 2, blocks: ["130,140,180,60"]};


    var results = sql_select(0 /* select id,name from employees */);
   // Report.trace = true;

  var rpt = new Report(reportName)
      .autoPrint(false) // Optional
      .fullScreen(false) // Optional
      .pageHeader( ["Employee Hours"] )// Optional
      .finalSummary( ["Total Hours:", "hours", 3] )// Optional
      .userdata( {hi: 1} )// Optional 
      .data( results )	// REQUIRED
      .totalFormatter( totalFormatter ) // Optional
      .fontSize(8); // Optional

  var subRpt = new Report(rpt)
      .data(sql_select)
      .keys(['id'])
      .detail(daydetail)
      .sum('hours');


  rpt.groupBy( "name" )
      .header( nameHeader )
      .footer( nameFooter );


   subRpt.groupBy( "week" )
         .header( weekDetail )
         .footer(function(Rpt) { Rpt.print("\n"); });



  // Debug output is always nice (Optional, to help you see the structure)
  if (typeof process.env.TESTING === "undefined") { rpt.printStructure(); }


  // This does the MAGIC...  :-)
  console.time("Rendered");
  rpt.render(function(err, name) {
      console.timeEnd("Rendered");
      displayReport(err, name, testing);
  });
}



printreport();