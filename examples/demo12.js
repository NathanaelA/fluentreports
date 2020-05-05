// Testing {{Bracket}} detail or Band Detail
"use strict";

const Report = require('../lib/fluentReports' ).Report;
const displayReport = require('./reportDisplayer');

function printreport() {
    var data = [{name: 'Elijah', age: 18}, {name: 'Abraham', age: 22}, {name: 'Gavin', age: 28}];

    // Create a Report
    var rpt = new Report("demo12.pdf")
        // Add a simple page Header, this can also be a function like the detail and/or footers
        .pageHeader( ["Employee Ages"] )
        // Add some Data
        .data( data )
        // Tell it how to print the data
        //.detail("My name is {{name}} and age is {{age}} wow double {{brackets}}");
        .detail( [['name', 200],['age', 50]]);
    /*
    .detail( function(Rpt, data) {
        Rpt.band( [ {data:"", width: 80},
                {data: data.name, width: 200},
                {data: data.age, width: 50, underline: true, align: 3} ],
            {border:1} );
    } ); */


  console.time("Rendered");
  rpt.render(function(err, name) {
      const testing = {images: 1, blocks: ["120,130,300,100"]};
     displayReport(err, name, testing);
  });
}

printreport();


