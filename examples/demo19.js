"use strict";

/***
 * Demo 19 - Test a dynamic report built from the ReportGenerator
 */


const ReportBuilder = require('../lib/fluentReportsBuilder').ReportBuilder;
const displayReport = require('./reportDisplayer');

const data = [
    {id: 1, name: "John Doe", emphours: [
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
   ]},
    {id: 3, name: "Sarah Williams", emphours: [
       {week:20, day: "Monday", hours: 8}
   ]},
    {id: 5, name: "Jane Doe", emphours: [
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
   ]}
];

// Reports can have multiple States; by default they have one State, so all states will be directed to this value
// However, a specific "type" can have its own state; called "state: <number>"
// All functions that are created should be "function (report, data, state, vars)"

let reportData =
    {
        type: 'report',
        name: 'demo19.pdf',
        autoPrint: false,
        fontSize: 8,

        variables: {counter: 0},

        //titleHeader: [],
        finalSummary: {type: 'raw', values: ["Total Hours:", "hours", 3]},
        pageHeader: {type: 'raw', values: ["Employee Hours"]},
        //pageFooter: null,

        groupBy: [{
            type: 'group',
            groupOn: 'name',
            header: [
                {
                type: "print",
                field: 'name',
                settings: {fontBold: true, fill: '#6f6f6f', textColor: '#ffffff', link: 'http://www.fluentReports.com/'}
            } ],
//            detail: [],
            footer: [
                {type: 'calculation', op: "concat", name: 'totals', fields: [{text: "Totals for "}, {field: "name"}]},
                {
                type: "band",
                fields: [
                    {function: {type: 'function', function: "return `Totals for ${data.name}`", async: false}, width: 180},
                    {total: "hours", width: 100, align: 3}
                ]},
                {type: 'newLine'}
            ],
        }],
//        header: [],
        detail: [],
        subReports:[
            {
                type: 'report',
                dataType: 'parent',
                data: 'emphours',
                calcs: {sum: ['hours']},
                groupBy: [
                    {
                        type: "groupfunction",
                        groupOn: "week",
                        header: [
                            {
                                skip: true, type: 'function', function: "vars.counter=0;", async: false
                            },
                            {
                            type: 'print',
                            function: {type: 'function', function: 'return `Week Number: ${data.week}`'},
                            settings: {x: 100, addY: 2}
                        }],
                        footer: [ {
                            type: 'newLine'
                        }]
                    }
                ],
                detail: [
                    {
                        type: 'function', function: "vars.counter++;"
                    },
                    {
                        type: 'band',
                        fields: [
                            {state: 'parentData.name', width: 80},
                            {field: 'day', width: 100},
                            {field: 'hours', align: 3, width: 100, textColor: {type: 'function', function: "return data.hours < 0 ? '#FF0000' : '#000000';"}}
                        ],
                        settings:
                            {
                                border:0, width: 0, wrap: true, textColor: '#0000ff',
                                fill: {type: 'function', function: "return (vars.counter % 2 === 0 ? '#f0f0f0' : '#e0e0e0');"}
                            }
                    },
                ]
            }],
//        footer: []
    };


let rpt = new ReportBuilder(reportData, data);
if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(); }

console.time("Rendered");
rpt.render().then((name) => {
    console.timeEnd("Rendered");
    const testing = {images: 2, blocks: ["130,140,180,60"]};
    displayReport(null, name, testing);
}).catch((err) => {
    console.error("Your report had errors while running", err);
});


/*
function printreport() {
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
  var reportName = "demo19.pdf";

  //Report.trace = true;

  var rpt = new Report(reportName)
      .autoPrint(false) // Optional
      .fullScreen(false) // Optional
      .pageHeader( ["Employee Hours"] )// Optional
      .finalSummary( ["Total Hours:", "hours", 3] )// Optional
      .userdata( {hi: 1} )// Optional 
      .data( data )	// REQUIRED
      .totalFormatter( totalFormatter ) // Optional
      .fontSize(8); // Optional


  var subRpt = rpt.subDetail('emphours')
      .detail(daydetail)
      .sum('hours');


  rpt.groupBy( "name" )
      .header( nameHeader )
      .footer( nameFooter );


   subRpt.groupBy( "week" )
         .header( weekDetail )
         .footer(function(Rpt) { Rpt.newLine(); });



  // Debug output is always nice (Optional, to help you see the structure)
  if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(); }


  // This does the MAGIC...  :-)
 console.time("Rendered");
  rpt.render().then((name) => {
      console.timeEnd("Rendered");
      displayReport(null, name);
  }).catch((err) => {
      console.error("Your report had errors while running", err);
  });
}
*/
//printreport();