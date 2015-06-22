Fluent Reports
==============

See: http://www.fluentreports.com for more information.

Fluent Reports - Data Driven PDF Reporting Engine for Node.js

Install

```npm install fluentreports```



Features:

* Completely Data Driven.  You pass in the data; you tell it easily how to print the data, and it generates the PDF report.
* Data agnostic, can be arrays, and/or objects; whatever you prefer.
* Headers, Footers, Title Headers, Summary Footers - Both built-in and totally customizable
* Grouping, nested grouping, and yes even more nested groupings...
* Auto-Summing (and other automatic totals like max/min/count)
* Sane defaults, and the ability to easily override not only the defaults but pretty much every aspect of the report generation.
* Images, Gradients, Text, Fonts, Lines, and many other PDF features supported.
* Page-able data loading
* Sub-Reports, Sub-Sub-Reports, etc...
* Bands (Tables/Grids) & Suppressed Bands (w/ column wrapping or column clipping)
* Free Flow Text
* Ability to override each part of the report for total customization of your report
* Fluent API
* Ability to put data over images; gradients, etc.
* Quickly generate complex reports with minimal lines of code.
* Colorization (& other cell changes) of text per cell in Bands
* Synchronous and Asynchronous support.  If your report doesn't need to do anything Async, you can just code it without any callbacks.   

See the simple & stupid examples for a overview on how to generate a somewhat complex report.
In these reports I tried to throw in a chunk of the kitchen sink to try and give you and
idea how powerful the engine is.

Currently has 5 example reports showing:

* Simple Grid Report with Grouping
* Simple Account Summary Report (w/ color & grid for account balances)
* Simple Fax Cover Sheet (w/ image)
* Grid Report showing off Sub-Reports with auto-queries
* More complex invoice/proposal with grouping, headers, footers.

Please note these following reports are using the simplest report methods; to show how quickly you can create up a simple report.  
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
        .data( data )	       			 // Add some Data (This is required)
        .detail( [[0, 200],[1, 50]])     // Layout the report in a grid of 200px & 50px
        .render();						 // Render the report
```

And one other sample report using a list type output:
```js
  var data = [{item: 'Bread', count: 5, qualifier: 'loaves'}, 
      {item: 'Eggs', count: 3, qualifier: 'dozen'}, 
      {item: 'Sugar', count: 32, qualifier: 'grams'}];
  var rpt = new Report("grocery.pdf")      
          .pageHeader( ["My Grocery List"] )    		 // Add a simple header          
          .data( data )									 // Add our Data
          .detail("{{count}} {{qualifier}} of {{item}}") // Put how we want to print out the data line.
          .render(); 							         // Render the Report (required if you want output...)

```

