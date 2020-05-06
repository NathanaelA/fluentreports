# Tutorials

Data Driven reporting is created, in basically a couple steps:

1. Get your initial data. 
    So in the above example we are setting the data to grocery items; this data can come from databases, data stores, files, web services, anywhere ever you store your data.   
2. Then you are defining the report/page overall structure.  So do you want headers or footers on all pages; are you grouping, totalling, or just printing raw data.
     So in the above example; we are setting a fixed page header that prints on every page that uses the reporting engine defaults and puts "My Grocery List" in the center of the top.
3. Then we choose how we want to display each detail record; again you can decide to use the simpler built in system like I did in the three above reports or you can use a function that will allow you to control it entirely.         

So, now looking at the above simple grocery list report; and lets spruce it up a bit.

First lets change from the default header to make a look a bit nicer for a Grocery List; so we need to create a function that will control how the header looks.

```js
    const headerFunction = function(Report) {
        Report.print("My Grocery List", {fontSize: 22, bold: true, underline:true, align: "center"});
        Report.newLine(2);
    };
```

This function changes the font size to 22 point, bolds and underlines the text and centers the words "My Grocery List" on the page.  Then we add 2 new blank lines to space the header from the detail records.   This looks so much cleaner.   


Next, I think I actually do want to continue to have the date and page number printed.  But, I think I would prefer them on the bottom of the page, so let's add a footer for these items.  Here is our footer function that also will be printed on every page, just like the header function above.

```js
    const footerFunction = function(Report) {
        Report.line(Report.currentX(), Report.maxY()-18, Report.maxX(), Report.maxY()-18);
        Report.pageNumber({text: "Page {0} of {1}", footer: true, align: "right"});
        Report.print("Printed: "+(new Date().toLocaleDateString()), {y: Report.maxY()-14, align: "left"});
    };
```  

Now in this function we print a line across the bottom of the page; then we use the "pageNumber" helper function to print the current page number and total number of page, then we print the current date.
A couple things to point out; Report.maxY and maxX are the largest location that can be printed to before entering the margins.  If you attempt to create your footer beyond the maxY coordinate; it WILL let you; but it WILL send a error to the Report.error system stating that you exceeded the margin by however many pixels so that you can fix your report.

So our new report is:

```js
    const data = [
          {item: 'Bread', count: 5, unit: 'loaf'},
          {item: 'Egg', count: 3, unit: 'dozen'},
          {item: 'Sugar', count: 32, unit: 'gram'},
          {item: 'Carrot', count: 2, unit: 'kilo'},
          {item: 'Apple', count: 3, unit: 'kilo'},
          {item: 'Peanut Butter', count: 1, unit: 'jar'}
      ];

    const headerFunction = function(Report) {
        Report.print("My Grocery List", {fontSize: 22, bold: true, underline:true, align: "center"});
        Report.newLine(2);
    };

    const footerFunction = function(Report) {
        Report.line(Report.currentX(), Report.maxY()-18, Report.maxX(), Report.maxY()-18);
        Report.pageNumber({text: "Page {0} of {1}", footer: true, align: "right"});
        Report.print("Printed: "+(new Date().toLocaleDateString()), {y: Report.maxY()-14, align: "left"});
    };

    const rpt = new Report("grocery2.pdf")
        .margins(20)                                 // Change the Margins to 20 pixels
        .data(data)									 // Add our Data
        .pageHeader(headerFunction)    		         // Add a header
        .pageFooter(footerFunction)                  // Add a footer
        .detail("{{count}} {{unit}} of {{item}}")    // Put how we want to print out the data line.
        .render();                                   // Render it out
```
 
 
 Wow, this report looks a **lot** cleaner and sharper.   However, I think we can spruce it up a still bit more...
   
```js
    const detailFunction = function(Report, Data) {
        if (Data.count !== 1) {
           Data.item = pluralize(Data.item);
           Data.unit = pluralize(Data.unit);
        }
        
        Report.box(Report.currentX()-1, Report.currentY()-1, 10, 10, {});
        Report.print(numberToText(Data.count) + ' ' + Data.unit + ' of ' + Data.item, {addX: 12});
    };
```

This is our new Detail function.  I first use a simple pluralizer to make any singular words plural if they need be.  The next thing it does is draw a box for your check marks.   Then it spits out your detail line with changes.
Now since I can have a really large grocery list; I can make this two or three columns, so we lets modify the code to make it three columns like so:

```js
    const detailFunction = function(Report, Data) {
        if (Data.count !== 1) {
           Data.item = pluralize(Data.item);
           Data.unit = pluralize(Data.unit);
        }

        let x = 0, y = 0;
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

Basically it is the same functions as the prior version, but we are changing the X and Y coordinates for column 2 & 3 to make them end up on the same line just in a different column.  So the finished report looks this.
[examples/demo06.js](../master/examples/demo06.js) contains this report in its three different iterations.
