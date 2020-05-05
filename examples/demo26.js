'use strict';
const Report = require('../lib/fluentReports' ).Report;
const displayReport = require('./reportDisplayer');

function printreport() {

    var myTotalFormatter = function (data, callback) {
        //console.log("myTotalFormatter: ", data);
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (key === 'total') {
                    data[key] = '$ ' + data[key].toFixed(2);
                }
            }
        }
        callback(null, data);
    };

    let runTotals = function(rpt) {
        rpt.standardFooter([
            ['BWshade$',1,3],
            ['sleeve$', 2, 3],
            ['cash$', 3, 3],
            ['credit$', 4, 3],
            ['total', 6, 3],
        ]);
    };

    let detail = function(rpt, data) {
        rpt.band([
            {data: data['BWshade$'], width: 60},
            {data: data['sleeve$'], width: 60},
            {data: data['cash$'], width: 60},
            {data: data['credit$'], width: 60},
            {data: data['total'], width: 100},
            {data: data['total'].toFixed(2), width: 60},
            ], {border: 1});
    };

    let artData = [
        {
            'BWshade$': 0,
            'sleeve$': 0,
            'cash$': 15.37,
            'credit$': 0,
            'total': 15.37
        },
        {
            'BWshade$': 1,
            'sleeve$': 0,
            'cash$': 0,
            'credit$': 60,
            'total': 60
        },
        {
            'BWshade$': 1,
            'sleeve$': 7,
            'cash$': 123.39,
            'credit$': 180,
            'total': 303.39
        },
        {
            'BWshade$': 8,
            'sleeve$': 6,
            'cash$': 190,
            'credit$': 295,
            'total': 485
        },
        {
            'BWshade$': 2,
            'sleeve$': 1,
            'cash$': 85.17,
            'credit$': 60,
            'total': 145.17000000002
        }
    ];

    let rptName = "demo26.pdf";

    // Create a Report
    const resultReport = new Report(rptName)
        .data(artData)	 			 	       // Add some Data (This is required)
        .pageFooter(runTotals)
        .detail(detail)
        .sum('BWshade$')
        .sum('sleeve$')
        .sum('cash$')
        .sum('credit$')
        .sum('total')
        .totalFormatter(myTotalFormatter);

  // Hey, everyone needs to debug things occasionally -- creates debug output so that you can see how the report is built.
    if (typeof process.env.TESTING === "undefined") { resultReport.printStructure(); }


  console.time("Rendered");
  resultReport.render(function(err, name) {
      console.timeEnd("Rendered");
      const testing = {images: 1};
      displayReport(err, name, testing);
  });

}



printreport();