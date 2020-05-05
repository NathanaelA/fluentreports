'use strict';

var Report = require('../lib/fluentReports' ).Report;
var displayReport = require('./reportDisplayer');


// ------------------------------------------------------------------------------------------------------
// Here is the DATA
// ------------------------------------------------------------------------------------------------------
var data = [
    {item: 'Bread', count: 5, unit: 'loaf'},
    {item: 'Egg', count: 3, unit: 'dozen'},
    {item: 'Sugar', count: 32, unit: 'gram'},
    {item: 'Carrot', count: 2, unit: 'kilo'},
    {item: 'Apple', count: 3, unit: 'kilo' },
    {item: 'Peanut Butter', count: 1, unit: 'jar'}
];
// ------------------------------------------------------------------------------------------------------



//version_one();
//version_two();
version_three();


/**
 * This is the simple version from the readme.md file
 */
function version_one() {

    var rpt = new Report("grocery1.pdf")
        .data(data)									 // Add our Data
        .pageHeader(["My Grocery List"])    		 // Add a simple header
        .detail("{{count}} {{unit}} of {{item}}");   // Put how we want to print out the data line.

    rpt.render(displayReport);
    if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(true); }

}

/**
 * This is the changed version with the new header/footer
 */
function version_two() {

    var headerFunction = function(Report) {
        Report.print("My Grocery List", {fontSize: 22, bold: true, underline:true, align: "center"});
        Report.newLine(2);
    };

    var footerFunction = function(Report) {
        Report.line(Report.currentX(), Report.maxY()-18, Report.maxX(), Report.maxY()-18);
        Report.pageNumber({text: "Page: {0} of {1}", footer: true, align: "right"});
        Report.print("Printed: "+(new Date().toLocaleDateString()), {y: Report.maxY()-14, align: "left"});
    };

    var rpt = new Report("grocery2.pdf")
        .margins(20)                                  // Change the Margins to 20 pixels
        .data(data)									 // Add our Data
        .pageHeader(headerFunction)    		         // Add a header
        .pageFooter(footerFunction)                  // Add a footer
        .detail("{{count}} {{unit}} of {{item}}");   // Put how we want to print out the data line.

    if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(true); }

    rpt.render(displayReport);

}

/**
 * This is the final version with new everything...
 */
function version_three() {

    var columnCounter = 0;

    var headerFunction = function(Report) {
        Report.print("My Grocery List", {fontSize: 22, bold: true, underline:true, align: "center"});
        Report.newLine(2);
    };

    var footerFunction = function(Report) {
        Report.line(Report.currentX(), Report.maxY()-18, Report.maxX(), Report.maxY()-18);
        Report.pageNumber({text: "Page {0} of {1}", footer: true, align: "right"});
        Report.print("Printed: "+(new Date().toLocaleDateString()), {y: Report.maxY()-14, align: "left"});
        columnCounter = 0;
    };

    // This is a simple stupid pluralizer; you should just NPM install a module for this; but this is a test report so we will use our own simple one.
    var pluralize = function(name) {
        switch (name) {
            case 'Bread':
            case 'dozen':
            case 'Sugar': return name;
            case 'loaf': return 'loaves';
            default: return name + 's';
        }
    };

    // This also is a simple stupid number to text routine, again use NPM install to get a good one..
    var numberToText = function(number) {
        switch (number) {
            case 0: return "Zero";
            case 1: return "One";
            case 2: return "Two";
            case 3: return "Three";
            case 4: return "Four";
            case 5: return "Five";
            case 32: return "Thirty-two";
            default:
                return number;
        }
    };

    var detailFunction = function(Report, Data) {
        if (Data.count !== 1) {
           Data.item = pluralize(Data.item);
           Data.unit = pluralize(Data.unit);
        }

        var x = 0, y = 0;
        if (columnCounter % 3 === 1) {
            x += 200;
            y = (Report.heightOfString() + 1);
        } else if (columnCounter % 3 === 2) {
            x += 400;
            y = (Report.heightOfString() + 1);
        }
        Report.box(Report.currentX()+x , Report.currentY()-y, 10, 10, {});
        Report.print(numberToText(Data.count) + ' ' + Data.unit + ' of ' + Data.item, {addX: x+12, addY: -(y-1)});
        columnCounter++;
    };

    var rpt = new Report("demo06.pdf")
        .margins(20)                                 // Change the Margins to 20 pixels
        .data(data)									 // Add our Data
        .pageHeader(headerFunction)    		         // Add a header
        .pageFooter(footerFunction)                  // Add a footer
        .detail(detailFunction);                     // Put how we want to print out the data line.

    rpt.render((err, name) => {
        const testing = {images: 1, blocks: ["30,1560,280,60"]};
        displayReport(err, name, testing);
        });

    //if (typeof process.env.TESTING !== "undefined") { rpt.printStructure(true); }

}
