# fluentReports Commands

## Report Configuration and Setup Commands


### Report
#### new Report(Destination, Options)

##### Parameters
* Destination - can be one of the following:
  - A File Name - Where to Save it (Any name other than "buffer")
  - Literal string "buffer" - meaning it is buffered into a buffer Object to your "render" callback (see render command)
  - pipe - any valid pipe that can be written too.
  - Parent report - making this a child report of the parent report.

* Options - Default is in (parentheses)
  * landscape: true or (false); to make the report landscaped.
  * paper: (letter), legal, A0-A10, B0-B10, C0-C10, Executive, Folio, Tabloid, RA0-RA4, SRA0-SRA4
  * font: (Helvetica), Courier, Times-Roman, Symbol, ZapfDingbats or a external font file that you provide and add to the report via the "registerFont" command.
  * fontSize: (12), any number from 1-128.
  * margins: (72), can be a single number for all four sides; or a object array like: {left:72, top:72, bottom:72, right: 72}
  * autoPrint: true or (false); to make the report automatically bring up the print dialog
  * fullScreen: true or (false); to make the report automatically full screen when it loads
  * negativeParentheses: true or (false); to make negative number show up like (20) rather than -20.
  * info - object; you can set some of the pdf info

<br><br>

#### Report.x
##### Constants:
* show.
  * once - Show the header/footer only once
  * newPageOnly - Show on all new pages if this reportGroup is the current reportGroup
  * always - show on all new pages even if this reportGroup is a parent of the current reportGroup

* alignment.
  * LEFT, CENTER, RIGHT

* renderType.
  * file - render to a file
  * pipe - render to a pipe
  * buffer - render to a buffer

* trace: true or (false) - output tracing statements to the console
* callbackDebugging: true or (false) - output callback tracing statements; trace needs to be true to use this option; and of course these two affect ALL reports.

Please note; this actually returns the a ReportGroup object; not the Report object -- this is by design since creating a new Report creates the entire structure as such:
- Primary Report Object -> ReportSection -> ReportDataSet -> ReportGroup and so all methods are as such off of the ReportGroup object. 
 
##### Example:
var MyReportObject = new Report("MyCoolReport.pdf", {autoPrint: true});
Would create the report called "MyCoolReport.pdf" and auto print it when it is opened in a pdf reader.

<br><br><br>

### The functions below are methods on the above created and returned ReportGroup object...

<br><br><br>

#### .userData( Data )
##### Description
This allows you to set userData on the report that you might want at some later point in the report -- this is rarely used.
##### Parameters
* Data - whatever extra user data you need access to in the report

<br><br><br>

#### .totalFormatter( function(data, callback(err, data) {}) {} ) 
##### Description
This allows you to set a formatting function to deal with any total values and formatting
##### Parameters
* function - this is a function that will format your totals before it print them.  The function prototype needs to be: function(dataIn, callback(err, formattedDataOut))

<br><br><br>

#### .data ( Data ) 
##### Description
THIS IS MANDANTORY - you need to set a data object otherwise there is no point to the report.

##### Parameters
* Data - this can be an array of arrays; and array of objects, an object, a string/number value or one of the two more advanced data class:
  * a simple query function; the report system calls this function with (currentData, callback) and the prototype callback(err, data) -- when this function is called you can either call the callback with the data OR return ALL the needed data directly from this function. 
  * pageable class; your class needs to implement a "count", "loadRange" methods as a minimum; and optionally can have a "query" method.   
  ** count is called with a callback(err, data) where data needs to be the count of record that are too be printed.
  ** loadRange is called (start, end, callback), start = first record needed, end = last record needed, callback is (err, resultData) 
  ** query is called with (currentData, callback) where callback only has (err) as it just needs to be called when the query is done being prepared.
    
##### Example:
MyReportObject.data([{id: 1, name: 'Nathanael'}, {id: 2, name: 'Anderson'}]);

<br><br><br>


#### .recordCount(recordCountCallback(count, continueCallback))
##### Description
This allows you to be notified of the query result count before the printing actually happens.  This is useful where you can't know the report data count before the report starts, because you are passing in a object that does all the queries itself.  The report when it queries the data count, will call your *RecordCountCallback* function, this function will receive a record count, and a callback function.  You MUST call the continueCallback function.  You can optionally pass the continueCallback a boolean "false" to actually cancel the report, any other value (and no value) is considered that you want to continue printing.
In the event you choose to cancel the report no report will be is generated; and the final render callback done will be passed "false" instead of a filename or buffer.
##### Parameters
* recordCountCallback function
##### continueCallback
* dummy (the callback does not use the dummy; but to keep the same normal type of node callback (err, value))
* continueReport - boolean false = cancel report; any other value (and no value) will continue the report.

##### Example:

function rcCount(count, continueCallback) {
  if (count === 0) { console.log("No records");  callback(null, false); }
  else if (count > 250) { console.log("Too many records") callback(null, false); }
  else callback();
}
MyReportObject.recordCount(rcCount);

<br><br><br>

#### .keys ( keys )
##### Description
This is so you can set a key or keys that get passed to sub-report data query functions/class objects.
##### Parameters
* Keys - A single string key, or array of string keys, this is used to know which data to send to the "query" functions that you can pass into the .data function above -- this is used for sub-reports. 

##### Example:
MyReportObject.keys("id");

<br><br><br>

#### .addReport( Report, options )
##### Description
This is used to add a sub-report; however you can use the easier method of "new Report(parentReport)" rather this "parentReport.addReport(x)" 
##### Parameters
* Report - the Report object you created
* options
  * isSibling - true or (false) -- this allows you to make this report a "sibling" report rather than the normal child report.

<br><br><br>

#### .info ( info )
##### Description
This allows you to set the pdf information and can be passed in as one of the Report(..., OPTIONS)
##### Parameters
* info - this is the object that contains the pdf header information you might want to change or add to the report

<br><br><br>

#### .detail ( detailOutput )
##### Description
This is used so that the report system know how to output each detail record.  This is used in most reports; but in some you might not need it.
##### Parameters
* detailOutput - this can be a array, a string or a function
* array = [[Data Key, Data Width, Data Alignment],[...],...]   Key is the key of the data to use for output, width is how wide to make this, alignment is right, (left), or center.
* string = "some text {{key_1}} more text {{key_2}}...." - where key_1 & key_2 are the index names of the data to use.
* function = This is prototyped  (ReportRenderer, Data, State, Done_Callback) for Asynchronous and (ReportRenderer, Data, State) for synchronous reporting.  The whole report must be either Sync or Async.
  * The ReportRenderer has multiple methods for outputting to your report.   Please see the ReportRenderer section for its methods.
  * The Data is the current line/row of data; you will deal with a SINGLE row of data each time this function is called.
  * The State is the state of the engine; it is a object with multiple keys -- please see the "State" of the engine section for the values in this.
  * Done_Callback - Again, this is only on ASYNC reports; it is Done_Callback(err).
##### Examples
MyReportObject.detail([["name", 120], ["address", 200], ["state", 20]]);
or
MyReportObject.detail("{{name}} lives in the state of {{state}}");

<br><br><br>

#### .titleHeader ( headerOutput, options )
##### Description
This is printed for the FIRST PAGE ONLY (if set); this prints first!
##### Parameters
* headerOutput - this can be a string, array of two strings or a function.  Function is prototyped identical to .detail
* options -
  * pageBreak - true or (false) - this will cause the header to page break before printing it.
  * pageBreakBefore - true or (false) - this will cause the header to page break before printing it.
  * pageBreakAfter - true or (false) - this will cause the header to page break after printing it.
##### Example
MyReportObject.titleHeader("This is my Cool Report");

<br><br><br>

#### .pageHeader ( headerOutput, options )
##### Description
This is printed for EVERY page except if the titleHeader is set, if the titleHeader is set then this header is skipped on the very first page; this prints first on the page!
##### Parameters
* headerOutput - this can be a string, array of two strings or a function.  Function is prototyped identical to .detail
* options -
  * pageBreak - true or (false) - this will cause the header to page break before printing it.
  * pageBreakBefore - true or (false) - this will cause the header to page break before printing it.
  * pageBreakAfter - true or (false) - this will cause the header to page break after printing it.
##### Example
MyReportObject.pageHeader(["This is my", "cool report"]);

<br><br><br>

#### .header ( headerOutput, options )
##### Description
This is printed as the header object to any group objects.  So while grouping you might need a header for who/what this is grouping on. 
##### Parameters
* headerOutput - this can be a string, array of two strings or a function.  Function is prototyped identical to .detail
* options -
  * pageBreak - true or (false) - this will cause the header to page break before printing it.
  * pageBreakBefore - true or (false) - this will cause the header to page break before printing it.
  * pageBreakAfter - true or (false) - this will cause the header to page break after printing it.

<br><br><br>

#### .finalSummary ( footerOutput, options )
##### Description
This is printed as the footer object on the final page (if set).
##### Parameters
* footerOutput - this can be a string, array of strings or a function.  Function is prototyped identical to .detail
* options -
  * pageBreak - true or (false) - this will cause the header to page break before printing it.
  * pageBreakBefore - true or (false) - this will cause the header to page break before printing it.
  * pageBreakAfter - true or (false) - this will cause the header to page break after printing it.

<br><br><br>

#### .pageFooter ( footerOutput, options )
##### Description
This is printed as the footer object on all pages (except for the last page if the finalSummary is set).
##### Parameters
* footerOutput - this can be a string, array of strings or a function.  Function is prototyped identical to .detail
* options -
  * pageBreak - true or (false) - this will cause the header to page break before printing it.
  * pageBreakBefore - true or (false) - this will cause the header to page break before printing it.
  * pageBreakAfter - true or (false) - this will cause the header to page break after printing it.
##### Example
MyReportObject.pageFooter(function(Rpt) { Rpt.print("Hey, this page is done!"); });

<br><br><br>

#### .footer ( footerOutput, options )
##### Description
This is printed as the footer object to any group objects.  So while grouping you might need a footer for who/what this is grouping on. 
##### Parameters
* footerOutput - this can be a string, array of strings or a function.  Function is prototyped identical to .detail
* options -
  * pageBreak - true or (false) - this will cause the header to page break before printing it.
  * pageBreakBefore - true or (false) - this will cause the header to page break before printing it.
  * pageBreakAfter - true or (false) - this will cause the header to page break after printing it.

<br><br><br>

#### .outputType( type )
##### Description
This allows you to change the output type of the report; this is rarely used as when you create the report you set it at creation.
##### Parameters
* type - this is one of the Report.renderType constants

<br><br><br>

#### .render(callback) 
##### Description
This is what actually starts the rendering of the document when you are done setting it up with all these class methods.
##### Parameters
* callback - this is called when the report is done being rendered; the callback will be
  * If rendering to disk (err, reportName) 
  * if Rendering to buffer (err, Buffer)
  * if rendering to pipe (err, pipe)
  * If rendering is CANCELLED (i.e. like via the .recordCount callback) it will return (err, false);
##### Example
MyReportObject.render(function(Err, name) {  if (name === false) { console.log("Report was cancelled"); } else { console.log("The report was saved to", name);  });

<br><br><br>

#### .printStructure ( asRendered )
##### Description
This prints out the structure of your report for debugging purposes to the console; it can see if you messed up your groupings or some other issues with your layout of the report.
##### Parameters 
* asRendered: true or (false) - If true this lays out the output in actual output order; if false (default) this lays it out in group order so you can easily see what is attached to what object.

<br><br><br>

#### .landscape ( landscape )
##### Description
Gets or sets landscape or portrait mode, This can be passed in as a Report(..., OPTIONS)
##### Parameters
* landscape: true or (false) - false = portrait, true is landscape.

<br><br><br>

#### .paper ( paper )
##### Description
Gets or sets the paper size, This can be passed in as a Report(..., OPTIONS)
##### Parameters
* paper - can be (letter), legal, A0-A10, B0-B10, C0-C10, Executive, Folio, Tabloid, RA0-RA4, SRA0-SRA4

<br><br><br>

#### .font ( font )
##### Description
This gets or sets the default font for the report, This can be passed in as a Report(..., OPTIONS) 
##### Parameters
* font: (helvetica), courier, times, symbol, dingbats or a external font file that you provide and add to the report via the "registerFont" command

<br><br><br>

#### .fontSize ( size )
##### Description
This sets the Default font size for the report, This can be passed in as a Report(..., OPTIONS)
##### Parameters
* size: any number from 1-128, with (12) being the default.

<br><br><br>

#### .registerFont ( name, definition )
##### Description
This allows you to register a external font to use in your report
##### Parameters
* name - this is the name
* definition - is a object structure {normal: './normal.ttf', bold: './bold.ttf', 'bolditalic': './bi.ttf', 'italic': './italic.ttf'} with any of the four keys for font types.
##### Example:
MyReportObject.registerFont("Aparajita", {normal: './aparaj.ttf', bold: './aparajb.ttf', 'italic': './aparaji.ttf'});

<br><br><br>

#### .margins ( margins )
##### Description
This allows you to set all the margins or some of them, This can be passed in as a Report(..., OPTIONS)
##### Parameters
* margins: (72), can be a single number for all four sides; or a object array like: {left:72, top:72, bottom:72, right: 72}

<br><br><br>

#### .autoPrint ( autoPrint ) 
##### Description
This will cause the print dialog to show up when you first open the pdf document, This can be passed in as a Report(..., OPTIONS)
##### Parameters
* autoPrint - true or (false)

<br><br><br>

#### .fullScreen ( fullScreen )
##### Description
This will cause the pdf document to go to full screen on opening it up, This can be passed in as a Report(..., OPTIONS)
##### Parameters
* fullScreen - true or (false)

<br><br><br>

#### .negativeParentheses ( negativeParentheses )
##### Description
This will print negatives as (20) rather than -20, This can be passed in as a Report(..., OPTIONS)
##### Parameters
* negativeParentheses - true or (false)

<br><br><br>

#### .importPDF ( pdfFile )
##### Description
This will import the "pdfFile" into this report
##### Parameters
* pdfFile - the path to the pdf file

 <br><br><br>

#### .groupBy ( field, options )
##### Description
This will allow you to create grouping on fields so that you can have group headers, footers, details for each group of records.  
IMPORTANT: this will RETURN a brand NEW ReportGroup object, which will then allow you to customize it with any of these commands listed here.  Please keep this in mind when doing function chaining.
##### Parameters
* field - this is the key field to group by.  Anytime this field changes; it will run the prior values footer, then this values header and start doing the details in this group.
* options - this allows you to set if you want the header to be printed only show.once at the beginning of the group, (show.newPageOnly) which means at the beginning of the group and anytime a new page occurs while this is the current group, and show.always same as "newPageOnly" but always shows as long as it is a parent of the current group. 

<br><br><br>

#### .sum ( field )
##### Description
This allows you to have a running Sum of the field; this value is propagated through the totals system allowing access to the correct total value per group.
##### Parameters
* field - this is the key for the field name you are tracking

<br><br><br>

#### .min ( field )
##### Description
This allows you to have a running minimum value of the field; this value is propagated through the totals system allowing access to the correct total value per group.
##### Parameters
* field - this is the key for the field name you are tracking

<br><br><br>
  
#### .max ( field )
##### Description
This allows you to have a running maximum value of the field; this value is propagated through the totals system allowing access to the correct total value per group.
##### Parameters
* field - this is the key for the field name you are tracking

<br><br><br>

#### .count ( field )
##### Description
This allows you to have a running count of the field; this value is propagated through the totals system allowing access to the correct total value per group.
##### Parameters
* field - this is the key for the field name you are tracking

<br><br><br>

#### .average ( field )
##### Description
This allows you to have a running average of the field; this value is propagated through the totals system allowing access to the correct total value per group.
##### Parameters
* field - this is the key for the field name you are tracking

<br><br><br><br>

## Rendering Commands
These commands are available to the header, title header, page header, page summary, page footer, footer, and detail functions while the report is running.  The first object passed to your function is the ReportRenderer object; this object has the following methods you can run.

#### .image ( name, options )
##### Description
This displays a image on the current page
##### Parameters
* name - this is the image location of disk to use or image buffer
* options - 
  * x - X coordinate to start
  * y - Y coordinate to start
  * width - the width of the image
  * height - the height of the image
  * scale - scale value
  * fit - fit the image inside the coords, width and height
  * align - align the image, left, right, center
  * valign - vertically align the image, top, center or bottom.

<br><br><br>

#### .font ( name, [size] )
##### Description
This allow you to get or change the default font (and optionally change the font size)
##### Parameters
* name - is a valid font name
* size - OPTIONAL, the new font size 

<br><br><br>

#### .fontSize ( [size] )
##### Description
This allows you to get or change the current font size
##### Parameters
* size - the new size of the font.  Called without to get teh current font size.

<br><br><br>

#### .fontBold ( )
##### Description
This sets the font to be Bold; if the font supports Bold & Italic at the same time and you already have Italic set, it will set it to bold-italic.

<br><br><br>

#### .fontItalic ( )
##### Description
This sets the font to be Italic; if the font was already set to bold AND the font supports Bold and Italic it will add italic to the bold fond, otherwise it will just make it italic.

<br><br><br>

#### .fontNormal ( )
##### Description
This resets the font back to normal; eliminating any Bold and Italic attributes

<br><br><br>

#### .fillAndStroke ( fillColor, [strokeColor] )
##### Description
This sets the fill & stroke colors
##### Parameters
* fillColor - the color for fills
* strokeColor - the color for strokes, called without to only set the fill color

<br><br><br>

#### .fill ( [color] )
##### Description
Forces a fill with either the current color or the optionally provided color.
##### Parameters
* color - the color for the fill, or called without to use the current color to do the fill

<br><br><br>

#### .fillColor ( [color] )
##### Description
Gets or sets the fill color
##### Parameters
* color - the fill color to set, or called without to get the current value

<br><br><br>

#### .fillOpacity ( [opacity] )
##### Description
Gets or sets the current fill opacity
##### Parameters
* Opacity - a decimal number between 0 and 1, or called without to get the current value
##### Example
R.fillOpacity(0.5)

<br><br><br>

#### .strokeColor ( [color] )
##### Description
This set or gets the stroke color
##### Parameter
* color - the color to set the strokes, or called without to get the current value 

<br><br><br>

#### .setNegativeParentheses ( [negativeParentheses] )
##### Description
This is used to switch between -30 and (30) for display of negative numbers.
##### Parameters
* negativeParentheses - true enables using parentheses, (false) disables and uses the normal minus sign, or called without to get the current value

<br><br><br>

#### .setMargins ( margins )
##### Description
This will allow you to override the default margins and set the margins for the   *NEXT  * page
##### Parameters
* margins - can be a number for all four sides or a object specifying each side {left: 25, right: 25, top: 50, bottom: 50} 
 
<br><br><br>

#### .paper ( [paper] )
##### Description
This allows you to get or change the paper for the   *NEXT  * page
##### Parameters
* paper - can be (letter), legal, A0-A10, B0-B10, C0-C10, Executive, Folio, Tabloid, RA0-RA4, SRA0-SRA4, or called without to get the current value

<br><br><br>

#### .landscape ( [landscape] )
##### Description
This allows you to get or change the landscape mode for the   *NEXT  * page
##### Parameters
* landscape - true is landscape, (false) is portrait mode, or called without to get the current value

<br><br><br>

#### .saveState ( )
##### Description
Allows you to save the current state of the engine -- This saves font, colors, and the x coordinate.   This is a STACK, so you can save multiple states; and then restore them.  Make sure any state you save you use a resetState or deleteState on afterwords, as the engine uses this code a lot to keep things correct.

<br><br><br>

#### .resetState ( )
##### Description
This resets the state of the engine to the last saved state in the saved stack.

<br><br><br>

#### .deleteState ( )
##### Description
This deletes the last saved state of the engine.

<br><br><br>

#### .hasChanges ( [includeHeader] )
##### Description
This can tell you if the page has any changes on it.  
##### Parameters
* includeHeader - true or (false).   If true, this will include any header changes also; as you may want to know if the page only had any record changes on the page vs any change at all. 

<br><br><br>

#### .currentPage ( )
##### Description
this returns the current page that is being worked on.

<br><br><br>

#### .newPage ( [saveOptions], [callback] )
##### Description
This adds a new page for you to start working on.   Please note; if you are using ASYNC functions then you must have a callback function for when the newPage is done, it will call your callback so you can continue.
##### Parameters
* saveOptions - true or (false) this will save the state while it creates a new page and then reset it back after it is done -- this allows you to keep any font, or color changes over a page change.
* callback - used for ASYNC reports; this is called when the newPage is done creating the new page.   You can optionally use this in a SYNC report; but it is REQUIRED in a ASYNC report.
##### Examples:
R.newPage();
R.newPage(function() { R.print("Hi, I'm on a new page"); });

<br><br><br>
 
#### .standardHeader ( text, [callback] )
#### .standardFooter ( text, [callback] )
##### Description
This runs the standard header or footer code so you can keep the default header/footers but make some minor changes
##### Parameters
* text - the string or array of two strings you want printed
* callback - used for ASYNC reports; this is called when the header/footer printing is done.   You can optionally use this in a SYNC report; but it is REQUIRED in a ASYNC report.
 
<br><br><br>

#### .getCurrentX ( )
#### .getCurrentY ( )
##### Description
This returns the current X or Y coordinate

<br><br><br>

#### .setCurrentX ( new )
#### .setCurrentY ( new )
##### Description
This sets the current X or Y coordinate
##### Parameters
* new - the new x or y coordinate

<br><br><br>

#### currentX ( [new] )
#### currentY ( [new] )
##### Description
This sets or gets the current X or Y coordinates
##### Parameters
* new - the new x or y coordinate, or called without for the current x or y coordinate

<br><br><br>

#### addX ( new )
#### addY ( new )
##### Description
This adds a number to either the X or Y coordinate
##### Parameters
* new - the value to ADD or SUBTRACT (if negative) to the existing X or Y coordinate

<br><br><br>

#### newLine ( [count], [callback] )
##### Description
This adds a newLine or multiple new lines
##### Parameters
* count - the number of lines; or if unset it will default to 1 line
* callback - used for ASYNC reports; this is called when the newLine addition(s) is/are done.   You can optionally use this in a SYNC report; but it is REQUIRED in a ASYNC report.

<br><br><br>

#### widthOfString ( string )
##### Description
This calculates how long this string will be with the current font and font size.
##### Parameters
* string - the string to size

<br><br><br>

#### heightOfString ( )
##### Description
This tells you how big a current string will be using the current font and font size; it doesn't actually need a string to tell you this as all string printed using this font & font size will use this space.

<br><br><br>

#### bandLine ( [thickness], [verticalGap] )
##### Description
This allow you to print a line the size of the last band command
##### Parameters
* thickness - the thickness of the line; defaults to 1
* verticalGap - the gap between the prior printed item and this line

<br><br><br>

#### line ( startX, startY, endX, endY, options )
##### Description
This prints a line from startX,startY to endX, endY
##### Parameters
* startX - Starting X coordinate
* startY - Starting Y coordinate
* endX   - End X coord
* endY   - End Y coord
* options:
  * fillOpacity - the Opacity
  * borderColor - the border color
  * fillColor - The fill color
  * thickness - the Line thickness
  * textColor - the text color
  * fill - to fill the shape

<br><br><br>


#### box ( startX, startY, width, height, options)
##### Description
This prints a box from startX,startY with a width and height
##### Parameters
* startX - Starting X coordinate
* startY - Starting Y coordinate
* width  - Width of Box
* height - Height of Box
* options:
  * fillOpacity - the Opacity
  * borderColor - the border color
  * fillColor - The fill color
  * thickness - the Line thickness
  * dash - to make Line dashed
  * textColor - the text color
  * fill - to fill the shape

<br><br><br>

#### circle ( startX, startY, radius, options )
##### Description
This prints a circle from startX,startY using the radius 
##### Parameters
* startX - Starting X coordinate
* startY - Starting Y coordinate
* radius - the radius of the circle
* options:
  * fillOpacity - the Opacity
  * borderColor - the border color
  * fillColor - The fill color
  * thickness - the Line thickness
  * textColor - the text color
  * fill - to fill the shape

<br><br><br>

#### lineWidth ( width )
##### Description
This sets or gets the gap between lines
##### Parameters
* width - the width to set it to, without this parameter it will return the current line width

<br><br><br>

#### getLastBandWidth ( )
##### Description
Gets the last width of the band that was printed.

<br><br><br>

#### maxX ( )
#### maxY ( )
#### minX ( )
#### minY ( )
##### Description
This returns the minimum or maximum X or Y coordinate allowed.

<br><br><br>

#### printedAt ( options ) 
##### Description
This will print the date time at the current location or header or footer locations
##### Parameters
* options -
  * align - alignment, "left", "right", "center"
  * header - true or false, print in the header
  * footer - true or false, print in the footer
  * text - the text to print this: defaults to: "Printed At: {0}:{1}{2}\non {3}"  where {0} is replaces with Hour, {1} minutes, {2} am/pm and {3} the current date.

<br><br><br>

#### pageNumber ( options )
##### Description
This will print the current page number at the current location, or the header / footer locations
##### Parameters
* options
  * align - alignment, "left", "right", "center"
  * header - true or false, print in the header
  * footer - true or false, print in the footer
  * text - the text to print this: defaults to: "Page: {0}"  where {0} is the current page number
         - You can optionally use {1} for Total number of printed pages; this increases the memory usage as the report system.
         Examples: "Page {0} of {1}" will print, Page 1 of 200 on page 1, and "Page 55 of 200" on page 55 if the report had 200 pages.

<br><br><br>

#### importPDF ( name )
##### Description
Imports a PDF in the current location, if this page has any printing on it - it will end this page and import after it.  
##### Parameters
* name - the file name to import

<br><br><br>

#### print ( text, options, callback )
##### Description
This is one of the primary methods to put any text of the page; you pass it your text and any options you want applied to the text
##### Parameters
* text - this can be a string or an array of strings
* options -
  * x - x coordinate to print at
  * y - y coordinate to print at
  * addX - add this x to the x coord before printing
  * addY - add this y to the y coord before printing
  * align - alignment (left, center, or right)
  * textWidth - the gap between characters
  * width - the maximum size you want the string to be; it will wrap it after this.
  * textColor - the font color of the text
  * underline - make this text underlined
  * strike - make this text striked through
  * fontSize - the font Size to use
  * fill - the background fill color
  * link - make this text a link, this is the url that the click will activate
  * font - the font to use
  * fontBold - true or false to be bold
  * fontItalic - true or false to be italic
  * ignoreEmptyStrings - ignore printing any empty strings in arrays
  * opacity - the opacity of the text
  * rotate - the rotation of the text  (Rotated text can exceed page dimensions)
* callback - used for ASYNC reports; this is called when the printing is done.   You can optionally use this in a SYNC report; but it is REQUIRED in a ASYNC report.

<br><br><br>

#### band ( dataIn, options, callback )
##### Description
This is the other primary method of displaying data on a report; this creates bands of cells like a spreadsheet
##### Parameters
* dataIn - this is an array of each cell; each cell can override the below options with most of the below options so  [ { data: "Data to Print", width: "width of cell", align: "alignment", border: 1, ...}, {data:...}, ...] 
* options:
  * gutter - gutter between cells
  * collapse - (true) or false; collapse the borders between cells
  * border - the width of all the border, it can also be a object with specifics for each side {left: 2, right: 0, top: 1, bottom: 1}
  * dash - true or (false); make the border line dashed
  * borderColor - the color of the border
  * fill - the fill color of the cell
  * fillOpacity - fill Opacity decimal value of 0 to 1.
  * padding - padding inside the cell
  * x - X coordinate
  * y - Y coordinate
  * addX - add to the X coordinate
  * addY - add to the Y coordinate
  * font - font to use
  * fontBold - true or (false)
  * fontItalic - true or (false)
  * textColor - the text color
  * link - the url to link this cell too. 
* callback - used for ASYNC reports; this is called when the printing is done.   You can optionally use this in a SYNC report; but it is REQUIRED in a ASYNC report.

<br><br><br>

#### suppressionBand ( dataIn, options, callback )
##### Description
This is exactly the same as the band() command; other than it will skip printing any repeated data; so if row 1 has the name "Nathanael" and row 2 has the name "Nathanael" it will skip printing row 2's "Nathanael".
##### Parameters
* SAME as the above band() command other than it has one addition option
  * duplicatedTextValue - this is the value to print in the suppressed cell; defaults to one quote (")
 
 
