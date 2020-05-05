# Fluent Reports

![.github/workflows/renderer.yml](https://github.com/NathanaelA/fluentreports/workflows/fluentReports%20Renderer%20CI/badge.svg)

See: [https://www.fluentreports.com](https://FluentReports.com) for more information.

Fluent Reports - Data Driven PDF Reporting Engine for **Node.js** and **Browsers**

Try out the reporting engine in your own browser at [https://www.fluentreports.com/demo.html](https://www.fluentreports.com/demo.html)

## Install

```npm install fluentreports```

## Documentation

Please [read the commands.md file](commands.md) for a overview of all the commands. The files in the `docs/` folder are generated from the source code via jsdocs, so they **might** be more up to date.
Please [read the examples.md file](examples/examples.md) for a list of examples
Please [read the tutorial.md file](tutorials.md) for the tutorials.

## Features:

* **New: JSON based reports**
* **New: Report Generator**
* Testing Harness to verify reports look the same after any updates 
* Completely Data Driven.  You pass in the data; you tell it easily how to print the data, and it generates the PDF report.
* Data agnostic, can be arrays, and/or objects; whatever you prefer.
* Headers, Footers, Title Headers, Summary Footers - Both built-in and totally customizable
* Grouping, nested grouping, and yes even more nested groupings...
* Auto-Summing (and other automatic totals like max/min/count)
* Sane defaults, and the ability to easily override not only the defaults but pretty much every aspect of the report generation.
* Images, Gradients, Text, Fonts, Lines, and many other PDF features supported.
* Data can come from anywhere, and the report engine even support Pageable data loading and related(or sub-query) data loading.
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

## Some Examples
Currently, we ship multiple [examples](examples)

* Simple Grid Report with Grouping ![Example 1](https://github.com/nathanaela/fluentReports/raw/master/examples/Originals/demo01.png)
* Simple Account Summary Report (w/ color & grid for account balances) ![Example 2](https://github.com/nathanaela/fluentReports/raw/master/examples/Originals/demo02.png)
* Simple Fax Cover Sheet (w/ image) ![Example 3](https://github.com/nathanaela/fluentReports/raw/master/examples/Originals/demo03.png)
* Grid Report showing off Sub-Reports with auto-queries, cell colorization and url links. ![Example 4](https://github.com/nathanaela/fluentReports/raw/master/examples/Originals/demo04.png)
* More complex invoice/proposal with grouping, headers, footers. ![Example 5](https://github.com/nathanaela/fluentReports/raw/master/examples/Originals/demo05.png)
* The Grocery Report Example done in stages to see from simple to complex reporting. ![Example 6](https://github.com/nathanaela/fluentReports/raw/master/examples/Originals/demo06.png)
* For many other examples; [click here](examples)

## Simple Sample Report
This following report is using the simplest report methods; to show how quickly you can create a simple report.  
You have the ability to EASILY FULLY override any and all of the Headers, Footers, and Detail bands (and much more).  

Really Simple Report:
```js
  // Our Simple Data in Object format:
  const data = [{name: 'Elijah', age: 18}, {name: 'Abraham', age: 22}, {name: 'Gavin', age: 28}];
  
  // Create a Report  
  const rpt = new Report("Report.pdf")        
        .pageHeader( ["Employee Ages"] )      // Add a simple (optional) page Header...        
        .data( data )	 			 	      // Add some Data (This is required)
		.detail( [['name', 200],['age', 50]]) // Layout the report in a Grid of 200px & 50px
        .render();  				          // Render the Report (required if you want output...)

```

The same report in Array format:
```js
  // Our Simple Data in Array format:
  const data = [['Elijah', 18], ['Abraham', 22], ['Gavin', 28]];
  
  // Create a Report  
  const rpt = new Report("Report.pdf")
        .pageHeader( ["Employee Ages"] ) // Add a simple (optional) page Header...
        .detail( [[0, 200],[1, 50]])     // Layout the report in a grid of 200px & 50px
        .render();						 // Render the report
```

And one other sample report using a list type output:
```js
      const data = [
           {item: 'Bread', count: 5, unit: 'loaf'},
           {item: 'Egg', count: 3, unit: 'dozen'},
           {item: 'Sugar', count: 32, unit: 'gram'},
           {item: 'Carrot', count: 2, unit: 'kilo'},
           {item: 'Apple', count: 3, unit: 'kilo'},
           {item: 'Peanut Butter', count: 1, unit: 'jar'}
      ];
      
      const rpt = new Report("grocery1.pdf")      
          .data( data )									 // Add our Data
          .pageHeader( ["My Grocery List"] )    		 // Add a simple header          
          .detail("{{count}} {{unit}} of {{item}}")      // Put how we want to print out the data line.
          .render(); 							         // Render the Report (required if you want output...)

```


---

### GUI & Browser Implementations

See the [generator](generator) documentation
