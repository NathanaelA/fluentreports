# Fluent Reports


See: http://www.fluentreports.com for more information.

Fluent Reports - Data Driven PDF Reporting Engine for Node.js and Browsers

## Install

```npm install fluentreports```

## Documentation

Please [read the commands.md file](commands.md) for a overview of all the commands. The files in the `docs/` folder are generated from the source code via jsdocs, so they **might** be more up to date.

## Features:

* Completely Data Driven.  You pass in the data; you tell it easily how to print the data, and it generates the PDF report.
* Data agnostic, can be arrays, and/or objects; whatever you prefer.
* Headers, Footers, Title Headers, Summary Footers - Both built-in and totally customizable
* Grouping, nested grouping, and yes even more nested groupings...
* Auto-Summing (and other automatic totals like max/min/count)
* Sane defaults, and the ability to easily override not only the defaults but pretty much every aspect of the report generation.
* Images, Gradients, Text, Fonts, Lines, and many other PDF features supported.
* Data can come from anywhere and the report engine even support Pageable data loading and related(or sub-query) data loading.
* Sub-Reports, Sub-Sub-Reports, etc...
* Bands (Tables/Grids) & Suppressed Bands (w/ column wrapping or column clipping)
* Free Flow Text
* Ability to override each part of the report for total customization of your report
* Fluent API
* Ability to put data over images; gradients, etc.
* Quickly generate complex reports with minimal lines of code.
* Colorization, Font & other changes of text per cell in Bands
* Synchronous and Asynchronous support.  If your report doesn't need to do anything Async, you can just code it without any callbacks.
* Group Headers can be (re)printed on every new page, always, and only once.
* Page Numbers and total number of pages
* Text rotation
* Cancelling of report

See the simple & stupid examples for a overview on how to generate a somewhat complex report.
In these reports I tried to throw in a chunk of the features to try and give you and idea how powerful the engine is and how to use certain features.

## Examples
Currently has 6 example reports showing:

* Simple Grid Report with Grouping ![Example 1](https://github.com/nathanaela/fluentReports/raw/master/examples/demo1.png)
* Simple Account Summary Report (w/ color & grid for account balances) ![Example 2](https://github.com/nathanaela/fluentReports/raw/master/examples/demo2.png)
* Simple Fax Cover Sheet (w/ image) ![Example 3](https://github.com/nathanaela/fluentReports/raw/master/examples/demo3.png)
* Grid Report showing off Sub-Reports with auto-queries, cell colorization and url links. ![Example 4](https://github.com/nathanaela/fluentReports/raw/master/examples/demo4.png)
* More complex invoice/proposal with grouping, headers, footers. ![Example 5](https://github.com/nathanaela/fluentReports/raw/master/examples/demo5.png)
* The Grocery Report Example done in stages to see from simple to complex reporting. ![Example 6](https://github.com/nathanaela/fluentReports/raw/master/examples/GroceryList3.png)

Please note these following reports are using the simplest report methods; to show how quickly you can create a simple report.  
You have the ability to EASILY FULLY override any and all of the Headers, Footers, and Detail bands.  

Really Simple Report:
```js
  // Our Simple Data in Object format:
  var data = [{name: 'Elijah', age: 18}, {name: 'Abraham', age: 22}, {name: 'Gavin', age: 28}];
  
  // Create a Report  
  var rpt = new Report("Report.pdf")        
        .pageHeader( ["Employee Ages"] )      // Add a simple (optional) page Header...        
        .data( data )	 			 	      // Add some Data (This is required)
		.detail( [['name', 200],['age', 50]]) // Layout the report in a Grid of 200px & 50px
        .render();  				          // Render the Report (required if you want output...)

```

The same report in Array format:
```js
  // Our Simple Data in Array format:
  var data = [['Elijah', 18], ['Abraham', 22], ['Gavin', 28]];
  
  // Create a Report  
  var rpt = new Report("Report.pdf")
        .pageHeader( ["Employee Ages"] ) // Add a simple (optional) page Header...
        .detail( [[0, 200],[1, 50]])     // Layout the report in a grid of 200px & 50px
        .render();						 // Render the report
```

And one other sample report using a list type output:
```js
      var data = [
           {item: 'Bread', count: 5, unit: 'loaf'},
           {item: 'Egg', count: 3, unit: 'dozen'},
           {item: 'Sugar', count: 32, unit: 'gram'},
           {item: 'Carrot', count: 2, unit: 'kilo'},
           {item: 'Apple', count: 3, unit: 'kilo'},
           {item: 'Peanut Butter', count: 1, unit: 'jar'}
      ];
      
      var rpt = new Report("grocery1.pdf")      
          .data( data )									 // Add our Data
          .pageHeader( ["My Grocery List"] )    		 // Add a simple header          
          .detail("{{count}} {{unit}} of {{item}}")      // Put how we want to print out the data line.
          .render(); 							         // Render the Report (required if you want output...)

```


## Tutorial

Data Driven reporting is done in basically a couple steps:
1. Get your initial data. 
    So in the above example we are setting the data to grocery items; this data can come from databases, data stores, files, web services, anywhere ever you store your data.   
2. Then you are defining the report/page overall structure.  So do you want headers or footers on all pages; are you grouping, totalling, or just printing raw data.
     So in the above example; we are setting a fixed page header that prints on every page that uses the reporting engine defaults and puts "My Grocery List" in the center of the top.
3. Then we choose how we want to display each detail record; again you can decide to use the simpler built in system like I did in the three above reports or you can use a function that will allow you to control it entirely.         

So, now looking at the above simple grocery list report; and lets spruce it up a bit.

First lets change from the default header to make a look a bit nicer for a Grocery List; so we need to create a function that will control how the header looks.

```js
    var headerFunction = function(Report) {
        Report.print("My Grocery List", {fontSize: 22, bold: true, underline:true, align: "center"});
        Report.newLine(2);
    };
```

This function changes the font size to 22 point, bolds and underlines the text and centers the words "My Grocery List" on the page.  Then we add 2 new blank lines to space the header from the detail records.   This looks so much cleaner.   


Next, I think I actually do want to continue to have the date and page number printed.  But I think I would prefer them on the bottom of the page, so lets add a footer for these items.  Here is our footer function that also will be printed on every page, just like the header function above.

```js
    var footerFunction = function(Report) {
        Report.line(Report.currentX(), Report.maxY()-18, Report.maxX(), Report.maxY()-18);
        Report.pageNumber({text: "Page {0} of {1}", footer: true, align: "right"});
        Report.print("Printed: "+(new Date().toLocaleDateString()), {y: Report.maxY()-14, align: "left"});
    };
```  

Now in this function we print a line across the bottom of the page; then we use the "pageNumber" helper function to print the current page number and total number of page, then we print the current date.
A couple things to point out; Report.maxY and maxX are the largest location that can be printed to before entering the margins.  If you attempt to create your footer beyond the maxY coordinate; it WILL let you; but it WILL send a error to the Report.error system stating that you exceeded the margin by however many pixels so that you can fix your report.

So our new report is:

```js
    var data = [
          {item: 'Bread', count: 5, unit: 'loaf'},
          {item: 'Egg', count: 3, unit: 'dozen'},
          {item: 'Sugar', count: 32, unit: 'gram'},
          {item: 'Carrot', count: 2, unit: 'kilo'},
          {item: 'Apple', count: 3, unit: 'kilo'},
          {item: 'Peanut Butter', count: 1, unit: 'jar'}
      ];

    var headerFunction = function(Report) {
        Report.print("My Grocery List", {fontSize: 22, bold: true, underline:true, align: "center"});
        Report.newLine(2);
    };

    var footerFunction = function(Report) {
        Report.line(Report.currentX(), Report.maxY()-18, Report.maxX(), Report.maxY()-18);
        Report.pageNumber({text: "Page {0} of {1}", footer: true, align: "right"});
        Report.print("Printed: "+(new Date().toLocaleDateString()), {y: Report.maxY()-14, align: "left"});
    };

    var rpt = new Report("grocery2.pdf")
        .margins(20)                                 // Change the Margins to 20 pixels
        .data(data)									 // Add our Data
        .pageHeader(headerFunction)    		         // Add a header
        .pageFooter(footerFunction)                  // Add a footer
        .detail("{{count}} {{unit}} of {{item}}")    // Put how we want to print out the data line.
        .render();                                   // Render it out
```
 
 
 Wow, this report looks a **lot** cleaner and sharper.   However, I think we can spruce it up a still bit more...
   
```js
    var detailFunction = function(Report, Data) {
        if (Data.count !== 1) {
           Data.item = pluralize(Data.item);
           Data.unit = pluralize(Data.unit);
        }
        
        Report.box(Report.currentX()-1, Report.currentY()-1, 10, 10, {});
        Report.print(numberToText(Data.count) + ' ' + Data.unit + ' of ' + Data.item, {addX: 12});
    };
```

This is our new Detail function.  I first uses a simple pluralizer to make any singular words plural if they need be.  The next thing it does is draw a box for your check marks.   Then it spits out your detail line with changes.
Now since I can have a really large grocery list; I can make this two or three columns, so we lets modify the code to make it three columns like so:

```js
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
```

Basically it is the same functions as the prior version but we are changing the X and Y coordinates for column 2 & 3 to make them end up on the same line just in a different column.  So the finished report looks this.
example\demo6.js contains this report in its three different iterations. 