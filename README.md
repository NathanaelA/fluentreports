# Fluent Reports

![.github/workflows/renderer.yml](https://github.com/NathanaelA/fluentreports/workflows/fluentReports%20Renderer%20CI/badge.svg)

[![npm](https://img.shields.io/npm/v/fluentreports.svg)](https://www.npmjs.com/package/fluentreports)
[![npm](https://img.shields.io/npm/l/fluentreports.svg)](https://www.npmjs.com/package/fluentreports)
[![npm](https://img.shields.io/npm/dt/fluentreports.svg?label=npm%20d%2fls)](https://www.npmjs.com/package/fluentreports)
[![GitHub last commit](https://img.shields.io/github/last-commit/nathanaela/fluentreports)](https://img.shields.io/github/last-commit/nathanaela/fluentreports)
[![Dependencies](https://img.shields.io/librariesio/github/nathanaela/fluentreports)](https://www.github.com/nathanaela/fluentreports)

---

#### Funding and sponsorship
[![github](https://img.shields.io/badge/Github-Sponsorship-orange)](https://github.com/sponsors/nathanaela)

You can now sponsor us on Github: [https://github.com/sponsors/NathanaelA](https://github.com/sponsors/nathanaela)

---

#### Website and demos
See: [https://www.fluentreports.com](https://FluentReports.com) for more information.

Fluent Reports - Data Driven PDF Reporting Engine for **Node.js** and **Browsers**

Try out the reporting engine in your own browser at [https://www.fluentreports.com/demo.html](https://www.fluentreports.com/demo.html)

## Install

`npm install fluentreports`

## Common JS

Use: `const Report = require( 'fluentReports' ).Report;`

## ESM Support

Please use `import { Report } from 'fluentReports/lib/esm/fluentReports.mjs';` as the ESM wrapper is located in the /lib/esm/ folder...


## Documentation

Please [read the commands.md file](commands.md) for an overview of all the commands. The files in the `docs/` folder are generated from the source code via jsdocs, so they **might** be more up to date.

Please [read the examples readme file](examples) for a list of examples.

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

### Examples
Currently, we ship multiple [examples](examples).

#### Browser Based Examples
There is a `demo_html.htm` file in the `examples` folder that shows how to setup a browser ONLY based report the runs 100% in a browser.
There is a readme.md in the `generator` folder for how to do a browser based reporting system with GUI that runs in the browser. 

### Simple Sample Report
This following report is using the a few of the simplest report methods.   We can show you how quickly you can create a simple report.  
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

One other sample report using a list type output:
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
