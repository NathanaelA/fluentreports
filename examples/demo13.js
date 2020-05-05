// Test {{Bracket}} Details

"use strict";

const Report = require('../lib/fluentReports' ).Report;
const displayReport = require('./reportDisplayer');

function printreport() {
    var data = [{item: 'Bread', count: 5, qualifier: 'loaves'},
        {item: 'Eggs', count: 3, qualifier: 'dozen'},
        {item: 'Sugar', count: 32, qualifier: 'grams'}];
    var rpt = new Report("demo13.pdf", {font: "Arimo"})
        .registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'})

    // Add a simple (optional) page Header...
        .pageHeader( ["Grocery List"] )
        // Add some Data (This is required)
        .data( data )
        // Tell it how to print the data (this is optional)
        .detail("{{count}} {{qualifier}} of {{item}}");


  console.time("Rendered");
  rpt.render(function(err, name) {
      console.timeEnd("Rendered");
      const testing = {images: 1, blocks: ["120,130,300,100"]};
      displayReport(err, name, testing);
  });
}

printreport();


