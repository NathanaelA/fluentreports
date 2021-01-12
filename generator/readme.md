# Gui / Browser

To build the browser version of the engine, you need to run `npm i` on the repository to install all the developer dependencies.  You might also want to install browserfy globally using `npm i -g browserfy`
```
cd lib
browserify fluentReportsBuilder.js -s fluentReports --ignore iconv-lite -o ../generator/fluentReportsBrowser.js
```
Then I minify it with this command:
```
cd ../generator
terser --compress --mangle -- fluentReportsBrowser.js > fluentReportsBrowser.min.js
```

This gives me both an easy to debug version, and a standalone version.   This will give you a full version of the Data Driven engine that runs in a browser and can run both types of reports.
If you want to use the GUI editor in your app, you just need to include:
```
    <link rel="stylesheet" href="fr.css">
    <script src="fluentReportsBrowser.min.js"></script>
    <script src="plain-draggable.min.js"></script>
    <script src="fluentReportsGenerator.js"></script>
``` 

You can also combine all of this together, and then I recommend you minimize it.
   
<b>Please note you DO NOT need to include the `fluentReportBrowser.min.js` file if you do NOT want to do previews from the browser!!!</b> <br>
You can also override the GUI "preview" button to disable it or send the generated report to the server to serve it up for you.

HTML
```
<div id="fluentReportsEditor"></div>
```

To create a new Report on the Browser (see the `reportgenerator.html` for detailed example);
```
 const frg = new window.FluentReportsGenerator({
        id: "fluentReportsEditor",
        data: {your data},
        report: {your report},
        debug: true,
        js: false,
        css: false,
        scale: 1.45,
        multiSelectKey: 'ctrl', // Can be 'ctrl', 'shift', or 'meta'/'alt'.

        // Don't set a "preview" (or set to undefinded) for it to use the built in preview
        preview: undefined,

        // Override the preview function
        preview: (generator, done) => {
            // Do Whatever you need, probably with:
            //    generator.report and generator.data
            done();
        },

        // OR to disable preview functionality...
        preview: false   
        save: (value, done) => {
            console.log("Saving");
            console.dir(value);
            done();
        }
    });
```
  