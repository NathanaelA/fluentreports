"use strict";

/* global PlainDraggable */

// Notes:
// plainDraggable .top / .left calculations use the parent containers.getBoundingClientRect() + the objects.getBoundingClientRect()


// Need a static element to track all Elements created
let _frElements = [];
let _frItemUUID = 10000; // jshint ignore:line

// Scale the display
let _scale = 1.5;

// Choose what UI Builder class
let _UIBuilder;


class FluentReportsGenerator {
    get uuid() { return this._uuid; }

    get reportLayout() { return this._reportLayout; }
    get reportScroller() { return this._reportScroller; }
    get sectionConstrainer() { return this._sectionConstrainer; }
    // noinspection JSUnusedGlobalSymbols
    get reportData() { return this._reportData; }
    get reportFields() { return this._fields; }
    get reportCalculations() { return this._calculations; }
    get reportVariables() { return this._reportData.variables;}
    get reportTotals() { return this._totals; }
    get reportSections() { return this._sections; }
    // noinspection JSUnusedGlobalSymbols
    get reportGroups() { return this._groupBys; }
    // noinspection JSUnusedGlobalSymbols
    get reportFunctions() { return this._functions; }
    // noinspection JSUnusedGlobalSymbols
    get sectionIn() { return this._sectionIn; }

    get currentSelected() { return this._currentSelected; }
    set currentSelected(val) { this._currentSelected = val; }
    get properties() { return this._properties; }

    get autoPrint() { return this._autoPrint; }
    set autoPrint(val) { this._autoPrint = !!val; }
    get name() { return this._name; }
    set name(val) { this._name = val; }
    get fontSize() { return this._fontSize; }
    set fontSize(val) { this._fontSize = parseInt(val, 10);}

    get paperSize() { return this._paperSize; }
    set paperSize(val) {
        if (val === this._paperSize) {
            return;
        }
        switch (val) {
            case 'letter':
                this._paperDims = [612.00, 792.00];
                break;
            case 'legal':
                this._paperDims = [612.00, 1008.00];
                break;
            default:
                val = 'letter';
                this._paperDims = [612.00, 792.00];

        }
        this._paperSize = val;
        if (this._paperOrientation === "landscape") {
            this._switchOrientation();
        }
        this._resetPaperSizeLocation();
    }

    _switchOrientation() {
        const temp = this._paperDims[0];
        if (this._paperOrientation === 'landscape') {
            if (this._paperDims[1] > temp) {
                this._paperDims[0] = this._paperDims[1];
                this._paperDims[1] = temp;
            }
        } else {
            if (this._paperDims[1] < temp) {
                this._paperDims[0] = this._paperDims[1];
                this._paperDims[1] = temp;
            }
        }
    }

    get paperOrientation() { return this._paperOrientation; }
    set paperOrientation(val) {
        if (val === this._paperOrientation) { return; }
        if (val === 'landscape') {
            this._paperOrientation = "landscape";
        } else {
            this._paperOrientation = "portrait";
        }
        this._switchOrientation();
        this._resetPaperSizeLocation();
    }

    get elementTitle() { return "Report"; }
    get gridSnapping() { return this._gridSnapping; }

    constructor(options) {
        _UIBuilder = UI;

        // Tracking Information
        this._includeCSS = options.css !== false;
        this._includeJS = options.js !== false;
        this._builtUI = false;
        this._fields = {primary: [], levels: 0, titles: []};
        this._reportData = {header: [], footer: [], detail: [], variables: {}};
        this._data = null;
        this._reportScroller = null;
        this._reportLayout = null;
        this._toolBarLayout = null;
        this._sectionConstrainer = null;
        this._propertiesLayout = null;
        this._currentSelected = null;
        this._sectionIn = 0;

        // Internal Data for UI
        this._calculations = [];
        this._totals = {};
        this._functions = [];
        this._groupBys = [];
        this._subReports = {};

        this._saveFunction = (value, done) => { done(); };
        this._uuid = _frItemUUID++;
        this._gridSnapping = {snapping: false, size: 10};
        this._saveTemporaryData = null;

        // Report Properties
        this._paperSize = "letter";
        this._paperOrientation = "portrait";
        this._paperDims = [612.00, 792.00];  // 72px per inch
        this._fontSize = 10;
        this._autoPrint = false;
        this._name = "report.pdf";
        this._properties = [
            {type: 'string', field: 'name', functionable: true},
            {type: 'boolean', field: 'autoPrint', default: false},
            {type: 'number', field: 'fontSize', default: 0},
            {type: 'selection', title: 'Paper Size', field: 'paperSize', values: ['letter', 'legal'], default: 'letter'},
            {type: 'selection', title: 'Orientation', field:'paperOrientation', values: ['portrait', 'landscape'], default: 'portrait'},
            {type: 'button', title: 'Variables', click: this._setVariables.bind(this)},
            {type: 'button', title: 'Totals', click: this._setTotals.bind(this)}
        ];


        /*
        let resize = null;
        window.addEventListener("resize",  () => {
            if (resize) {
                clearTimeout(resize);
            }
            resize = setTimeout( () => {
                resize = null;
                this._resized();
            }, 100);
        }, true);

        window.addEventListener('orientationchange', () => {
            if (resize) {
                clearTimeout(resize);
            }
            resize = setTimeout(() => {
                resize = null;
                this._resized();
            }, 100);
        }, true);
         */

        if (options.scale) {
            _scale = parseFloat(options.scale);
        } else {
            // TODO: Maybe determine size of UI layout and scale dynamically?
            _scale = 1.5;
        }

        // Allows overriding UI System
        if (options.UIBuilder) {
            if (typeof options.UIBuilder.clearArea !== 'undefined') {
                _UIBuilder = options.UIBuilder;
            }
        }

        if (options.data) {
            this.parseData(options.data);
        }
        if (options.report) {
            // TODO - FUTURE: Maybe save & verify report based on parsed data to verify data layout being sent into
            //      - editor matches the report layout's last data, and so we have the field layout in the event no data is passed in.
            this.parseReport(options.report);
        } else {
            this._createReportOnData();
        }
        if (options.save) {
            this._saveFunction = options.save;
        }

        if (options.id) {
            this._id = options.id;
            this.buildUI(this._id);
        }
    }

    parseData(data) {
        if (!Array.isArray(data)) {
            throw new Error("fluentReports: Invalid dataset, should be an array of objects.");
        }
        if (data.length < 1) {
            throw new Error("fluentReports: Invalid dataset, should have at least one record");
        }
        // Reset to No Data Dictionary
        this._fields = {primary: [], levels: 0, titles: []};

        this._data = data;

        // Lets create the data Dictionary
        this._parseDataLevel(data[0], 'primary','primary', 0);
    }

    _createReportOnData() {
        let tempReport;
        if (this._data === null || this._data.length === 0) {
            tempReport = {
                type: "report",
                header: {type: "raw", values: ["Sample Header"]},
                detail: {type: "text", text: "Welcome to fluentReports"},
                footer: {type: "raw", values: ["Sample Footer"]}
            };
            this._data = [];
        } else {
            tempReport = {
                type: "report",
                header: {type: "raw", values: ["Sample Header"]},
                footer: {type: "raw", values: ["Sample Footer"]}
            };
            if (this.reportFields.titles.length === 1) {
                tempReport.detail = {type: "text", text: "Welcome to fluentReports"};
            } else {
                let src = tempReport;
                for (let i=1;i<this.reportFields.titles.length;i++) {
                    src.subReport = {type: 'report', dataType: 'parent', data: this.reportFields.titles[i]};
                    if (i === this.reportFields.titles.length-1) {
                        src.subReport.detail = {type: "text", text: "Welcome to fluentReports"};
                    }
                    src = src.subReport;
                }
            }

        }
        this.parseReport(tempReport);
    }

    /**
     * Parses a Report
     * @param report
     */
    parseReport(report) {
        console.log("Parse Report");
        this._reportData = report;
        if (this._builtUI) {
            this._clearReport();
            // Create the Sections
            this._generateReportLayout(this._reportData, 57, "", 0);
        }

        // TODO: Add rest of properties
        this._copyProperties(report, this, ["name", "fontSize", "autoPrint", "paperSize", "paperOrientation"]);

        if (this._builtUI) {
            this._reportSettings();
        }
    }

    _generateSave() {
        // Setup our temporary data storage
        this._saveTemporaryData = {reports: []};

        const results = {type: 'report', dataSet: 0};
        this._copyProperties(this, results, ["fontSize", "autoPrint", "name", "paperSize", "paperOrientation"]);
        this._saveTemporaryData.reports.push(results);

        results.variables = this.reportVariables;
        frSection.generateSave(results);

        // Save the Totals..
        for (let i=0;i<this._saveTemporaryData.reports.length;i++) {
            this._saveTotals(this._saveTemporaryData.reports[i], this._saveTemporaryData.reports[i].dataSet);
        }

        // Update groups data with any Groups that have no actual sections
        for (let i=0;i<this._groupBys.length;i++) {
            let curData = this._saveTemporaryData.reports[this._groupBys[i].dataSet];
            let found = false;
            if (curData.groupBy) {
                for (let j = 0; j < curData.groupBy.length; j++) {
                    if (curData.groupBy[j].groupOn === this._groupBys[i].name) {
                        found = true;
                        j = curData.groupBy.length;
                    }
                }
            } else {
                curData.groupBy = [];
            }
            if (!found) {
                curData.groupBy.push({type: "group", groupOn: this._groupBys[i].name});
            }
        }

        // Remove Groups in Report, that no longer exist in the groupby data
        for (let i=0;i<this._saveTemporaryData.reports.length;i++) {
            let curData = this._saveTemporaryData.reports[i];
            // No Groups; proceed to the next one...
            if (!curData.groupBy) { continue; }
            for (let j=0;j<curData.groupBy.length;j++) {
                let found = false;
                for (let k=0;k<this._groupBys.length;k++) {
                    if (curData.groupBy[j].groupOn === this._groupBys[k].name) {
                        found = true;
                    }
                }
                if (!found) {
                    curData.groupBy.splice(j, 1);
                    j--;
                }
            }
        }



        // Clear our temporary data storage
        this._saveTemporaryData = null;

        return results;
    }

    _saveTotals(dest, dataSet) {
        const totals = this.reportTotals;
        let fields, calcs=null;

        if (dataSet === 0) {
            fields = this.reportFields.primary;
        } else {
            fields = this.reportFields["level"+dataSet];
        }

        for (let key in totals) {
            if (!totals.hasOwnProperty(key)) { continue; }
            for (let i=0;i<totals[key].length;i++) {
                if (fields.indexOf(totals[key][i]) >= 0) {
                    if (calcs == null) {
                        calcs = {};
                    }
                    if (calcs[key] == null) {
                        calcs[key] = [];
                    }
                    calcs[key].push(totals[key][i]);
                }
            }
        }

        if (calcs != null) {
            dest.calcs = calcs;
        }
    }

    _setVariables() {
        _UIBuilder.variableBrowse(this._reportData.variables, (value) => {
            this._reportData.variables = value;
        });
    }

    _setTotals() {
        _UIBuilder.totalsBrowse(this.reportTotals, this, (value) => {
            this._totals = value;
        });
    }

    _copyProperties(src, dest, props) {
        if (src == null) { return; }
        for (let i=0;i<props.length;i++) {
            if (typeof src[props[i]] !== 'undefined') {
                dest[props[i]] = src[props[i]];
            }
        }
    }

    /**
     * Parses a Dataset to figure out field names, recursively
     * @param rowOfData - A Single record to parse
     * @param title - DataSet title
     * @param dataSet - Where to store the dataset  ('primary' | 'level')
     * @param level - Level of dataset...
     * @private
     */
    _parseDataLevel(rowOfData, title, dataSet, level) {
        let newDataSet = dataSet + (level > 0 ? level : '');
        this._fields.levels = level;
        this._fields.titles.push(title);
        this._fields[newDataSet] = [];
        for (let key in rowOfData) {
            if (!rowOfData.hasOwnProperty(key)) { continue; }
            if (Array.isArray(rowOfData[key])) {
                if (rowOfData[key].length > 0) {
                    this._parseDataLevel(rowOfData[key][0], key, 'level', level+1);
                } else {
                    console.warn("fluentReports: DataSet is empty dataset", dataSet, key);
                }
            } else {
                this._fields[newDataSet].push(key);
            }
        }

    }

    /**
     * Clears a Report
     * @private
     */
    _clearReport() {
        console.log("Clear Report");

        // Reset Tracking Data
        this._groupBys = [];
        this._totals = {};
        this._sectionIn = 0;
        this._calculations = [];
        this._functions = [];
        this._groupBys = [];
        this._subReports = {};

        _UIBuilder.clearArea(this._reportLayout);
        // Read-add our Section Constrainer
        this._reportLayout.appendChild(this._sectionConstrainer);

        _UIBuilder.clearArea(this._propertiesLayout);
        frElement.clearAll();
        frSection.clearAll();
    }

    buildUI(id) {
        if (this._builtUI) {
            console.error("fluentReports: Attempting to call build on an already build _UIBuilder.");
            return true;
        }
        if (id) {
            this._id = id;
        }
        if (!this._id) {
            console.error("fluentReports: Missing id");
            return false;
        }
        const parent = document.getElementById(this._id);
        if (!parent) {
            console.error("fluentReports: Unable to find dev element: ", this._id);
            return false;
        }

        this._frame = document.createElement("div");

        this._frame.style.height = (parent.clientHeight < 300 ? 300 : parent.clientHeight)+"px";

        // Prefix the entire sub-tree with our name space for CSS resolution
        this._frame.classList.add("fluentReports");
        parent.appendChild(this._frame);

        // Keep from running a second time...
        this._builtUI = true;

        if (this._includeCSS) {
            // TODO: Check to see if this file already exists in the head area
            let link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            link.setAttribute('href', './fr.css');
            document.getElementsByTagName('head')[0].appendChild(link);
        }

        if (this._includeJS) {
            // TODO: Check to see if this file already exists in the head area
            let script = document.createElement('script');
            script.src = "./plain-draggable.min.js";
            document.getElementsByTagName('head')[0].appendChild(script);
            let frScript = document.createElement('script');
            frScript.src = "./fluentReportsBuilder.js";
            document.getElementsByTagName('head')[0].appendChild(frScript);
        }
        this._frame.style.alignContent = "top";

        this._toolBarLayout = document.createElement("div");
        this._toolBarLayout.id = "frToolBar";
        this._toolBarLayout.className = "frToolBar";
        this._frame.appendChild(this._toolBarLayout);

        this._propertiesScroller = document.createElement('div');
        this._propertiesScroller.className = "frPropScroller";

        this._propertiesLayout = document.createElement("div");
        this._propertiesLayout.className = "frProperties";
        this._propertiesLayout.id = "frProperties";
        this._propertiesLayout.style.minHeight = (this._frame.clientHeight-51)+"px"; // TODO: Get actual size of toolBarLayout instead of hardcoding it...
        this._propertiesScroller.appendChild(this._propertiesLayout);
        this._frame.appendChild(this._propertiesScroller);


        this._reportScroller = document.createElement("div");
        this._reportScroller.id = "frReport";
        this._reportScroller.className = "frReport";
        this._reportLayout = document.createElement("div");
        this._reportLayout.className = "frReportInner";
        this._reportLayout.style.minHeight = (this._frame.clientHeight-51)+"px"; // TODO: Get actual size of toolBarLayout instead of hardcoding it...
        this._reportLayout.addEventListener("click", this._reportLayoutClicked.bind(this));
        this._reportScroller.appendChild(this._reportLayout);
        this._sectionConstrainer = document.createElement("div");
        this._sectionConstrainer.style.left = "0px";
        this._sectionConstrainer.style.width = "0px";
        this._sectionConstrainer.style.height = "0px";
        this._sectionConstrainer.style.position = "absolute";
        this._reportLayout.appendChild(this._sectionConstrainer);
        this._frame.appendChild(this._reportScroller);

        this._paperWidthLayout = document.createElement('div');
        this._paperWidthLayout.className = "frPaperWidthLayout";
        this._paperWidthLayout.style.position = "absolute";
        this._paperWidthLayout.style.width = "1px";
        this._frame.appendChild(this._paperWidthLayout);
        this._generateInterface();
    }

    /**
     * Fixes up the Size of Page Line Location
     * @private
     */
    _resetPaperSizeLocation() {
        const parent = document.getElementById("frReport");
        const rect = parent.getBoundingClientRect();
        this._paperWidthLayout.style.top = rect.top+"px";
        this._paperWidthLayout.style.left = (rect.left + (this._paperDims[0]*_scale)) + "px";
        this._paperWidthLayout.style.height = rect.height+"px";
        if (rect.width < ((this._paperDims[0]*_scale)+18)) {
            this._paperWidthLayout.style.display = "none";
        } else {
            this._paperWidthLayout.style.display = "";
        }
    }

    _reportLayoutClicked(args) {
        if (this._currentSelected) {
            this._currentSelected.blur();
        }

        const y = (args.clientY - this._reportLayout.offsetTop) + this._reportScroller.scrollTop;
        this._sectionIn = frSection.getSectionIn(y);
        this.showProperties(frSection.getSection(this._sectionIn), true);
    }

    _generateInterface() {
        if (typeof window.PlainDraggable !== 'undefined') {
            this._generateToolBarLayout();
            this._generateReportLayout(this._reportData, 57, "", 0);
            this._reportSettings();
            this._resetPaperSizeLocation();
        } else {
            setTimeout(() => {
                this._generateInterface();
            }, 500);
        }
    }
    
    _openGroupings() {
        //groupBy
        _UIBuilder.groupsBrowse(this._groupBys,  this,    (groups) => {
            let changed = 0;
            for (let i=0;i<this._groupBys.length;i++) {
                for (let j=0;j<groups.length;j++) {
                    if (this._groupBys[i].name === groups[j].name && this._groupBys[i].dataSet === groups[j].dataSet) {
                        j=groups.length; changed++;
                    }
                }
            }

            if (this._groupBys.length !== changed) {
                this._groupBys = groups;
                const newReport = this._generateSave();
                this.parseReport(newReport);
            } else {
                this._groupBys = groups;
            }
        });
    }

    _openSections() {

        // Generate the current layout report so we can easily parse it in the sectionBrowse
        let currentReport = this._generateSave();
        _UIBuilder.sectionBrowse(this, currentReport, (updateReport) => {
            this.parseReport(updateReport);
        } );
    }

    _generateToolBarLayout() {

          this._toolBarLayout.appendChild(_UIBuilder.createSpacer());
          this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue834", "Report settings", () => { this._reportSettings(); }));
          this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue822", "Group data by", () => { this._openGroupings(); }));
          this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue819", "Sections", () => { this._openSections(); }));
          this._toolBarLayout.appendChild(_UIBuilder.createSpacer());

        this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue801", "New line", () => {
            let options = frSection.getSectionOptions(this._sectionIn);
            options.top = 1;
            new frNewLine(this, frSection.getSection(this._sectionIn), options ); // jshint ignore:line
        }));
          this._toolBarLayout.appendChild(_UIBuilder.createSpacer());

        this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue82D", "Print label", () => {
            let options = frSection.getSectionOptions(this._sectionIn);
            new frPrintLabel(this, frSection.getSection(this._sectionIn), options); // jshint ignore:line
        }));
          this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue828", "Print data field", () => {
              let options = frSection.getSectionOptions(this._sectionIn);
              options.label = (this._fields.primary[0] || "????");
              options.field = this._fields.primary[0];
             new frPrintField(this, frSection.getSection(this._sectionIn), options); // jshint ignore:line
          }));
        this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue818", "Print dynamic data", () => {
            let options = frSection.getSectionOptions(this._sectionIn);
            options.variable = "";
            options.type = "variable";
            new frPrintDynamic(this, frSection.getSection(this._sectionIn), options); // jshint ignore:line
        }));


        this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue81F", "Print function", () => {
            let options = frSection.getSectionOptions(this._sectionIn);
            new frPrintFunction(this, frSection.getSection(this._sectionIn), options); // jshint ignore:line
        }));

        this._toolBarLayout.appendChild(_UIBuilder.createSpacer());
        this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue838", "Band", () => {
            let options = frSection.getSectionOptions(this._sectionIn);
            new frBandElement(this, frSection.getSection(this._sectionIn), options); // jshint ignore:line
        }));

        this._toolBarLayout.appendChild(_UIBuilder.createSpacer());

        let snapIcon = _UIBuilder.createToolbarButton("\ue83A", "Snap to grid", () => {
            this._gridSnapping.snapping = !this._gridSnapping.snapping;
            if (this._gridSnapping.snapping) {
                snapIcon.innerText = "\ue839";
            } else {
                snapIcon.innerText = "\ue83A";

            }
        });
        this._toolBarLayout.appendChild(snapIcon);

        this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue833", "Save", () => {
            const topLayer = document.createElement("div");
            const parent = document.getElementById(this._id);
            topLayer.style.zIndex = 100;
            topLayer.style.backgroundColor = "#000000";
            topLayer.style.opacity = 0.7;
            topLayer.style.position = "absolute";
            topLayer.style.cursor = "wait";

            const rect = parent.getBoundingClientRect();
            topLayer.style.top = rect.top;
            topLayer.style.left = rect.left;
            topLayer.style.width = rect.width;
            topLayer.style.height = rect.height;
            parent.appendChild(topLayer);

            const data = this._generateSave();

            this._saveFunction(data, () => {
                parent.removeChild(topLayer);
            });


        }));

        this._toolBarLayout.appendChild(_UIBuilder.createSpacer());

        this._toolBarLayout.appendChild(_UIBuilder.createToolbarButton("\ue809", "Preview", () => {
            const topLayer = document.createElement("div");
            const parent = document.getElementById(this._id);
            topLayer.style.zIndex = 100;
            topLayer.style.backgroundColor = "#000000";
            topLayer.style.opacity = 0.9;
            topLayer.style.position = "absolute";
            topLayer.style.cursor = "wait";

            const rect = parent.getBoundingClientRect();
            topLayer.style.top = rect.top;
            topLayer.style.left = rect.left;
            topLayer.style.width = rect.width;
            topLayer.style.height = rect.height;
            parent.appendChild(topLayer);
            const iFrame = document.createElement('iframe');
            iFrame.style.position = "relative";
            iFrame.style.width = rect.width;
            iFrame.style.height = rect.height;
            const close = document.createElement('input');
            close.type = "button";
            close.value = "Close";
            close.style.position = "absolute";
            close.style.top = (rect.height - 28) + "px";
            close.style.height = "28px";
            close.style.left = "1px";
            close.style.zIndex = "999";
            close.style.fontSize = "14pt";
            close.addEventListener("click", () => {
                parent.removeChild(topLayer);
            });
            topLayer.appendChild(iFrame);
            topLayer.appendChild(close);


            const reportData = this._generateSave();
            const data = this._data;

            let  pipeStream = new window.fluentReports.BlobStream();
            // Create the Report
            let rpt = new window.fluentReports.ReportBuilder(reportData, data);

            // Send it to a pipe stream...
            rpt.outputType(1, pipeStream);

            // Console log the structureu
            rpt.printStructure();

            console.time("Rendered");
            rpt.render().then((pipe) => {
                console.log("Pipe", pipe);
                console.timeEnd("Rendered");
                iFrame.src = pipe.toBlobURL('application/pdf');
            }).catch((err) => {
                console.error("Your report had errors while running", err);
                Dialog.notice("Previewing Report Had Errors: " + err.toString());
            });

//                parent.removeChild(topLayer);


        }));

    }


    _reportSettings() {
        this.showProperties(this, true);
    }

    _generateReportHeaderSectionLayout(data, height, groupName='', dataSet=0) {
        if (typeof data.titleHeader !== 'undefined') {
            this._generateSection("Title Header", height, 1, groupName, dataSet, data.titleHeader);
        }
        if (typeof data.pageHeader !== 'undefined') {
            this._generateSection("Page Header", height, 1, groupName, dataSet, data.pageHeader);
        }
        if (typeof data.header !== 'undefined') {
            this._generateSection("Header", height, 1, groupName, dataSet, data.header);
        }
        if (typeof data.groupBy !== 'undefined') {
            for (let i = 0; i < data.groupBy.length; i++) {
                let found = false;
                for (let j=0;j<this._groupBys.length;j++) {
                    if (this._groupBys[j].dataSet === dataSet && this._groupBys[j].name === groupName) {
                        found=true;
                    }
                }
                if (!found) {
                    this._groupBys.push({name: data.groupBy[i].groupOn, dataSet: dataSet});
                }
                this._generateReportHeaderSectionLayout(data.groupBy[i], height, data.groupBy[i].groupOn, dataSet);
            }
        }
    }

    _generateReportDetailSectionLayout(data, height, groupName='', dataSet=0, isGroup=false) {
        if (typeof data.detail !== 'undefined') {
            this._generateSection("Detail", height, 3, groupName, dataSet, data.detail, isGroup);
        }
        if (typeof data.subReport !== 'undefined') {
            this._generateReportLayout(data.subReport, height, data.subReport.data, dataSet+1);
        }

        if (typeof data.groupBy !== 'undefined') {
            for (let i = 0; i < data.groupBy.length; i++) {
                this._generateReportDetailSectionLayout(data.groupBy[i], height, data.groupBy[i].groupOn, dataSet, true);
            }
        }
    }

    _generateReportFooterSectionLayout(data, height, groupName='', dataSet=0) {
        if (typeof data.groupBy !== 'undefined') {
            for (let i = 0; i < data.groupBy.length; i++) {
                this._generateReportFooterSectionLayout(data.groupBy[i], height, data.groupBy[i].groupOn, dataSet);
            }
        }
        if (typeof data.footer !== 'undefined') {
            this._generateSection("Footer", height, 2, groupName, dataSet, data.footer);
        }
        if (typeof data.pageFooter !== 'undefined') {
            this._generateSection("Page Footer", height, 2, groupName, dataSet, data.pageFooter);
        }
        if (typeof data.finalSummary !== 'undefined') {
            this._generateSection("Final Summary", height, 2, groupName, dataSet, data.finalSummary);
        }
    }

    _generateReportLayout(data, height, groupName, dataSet=0) {

        console.log("GenerateReportLayout", groupName);
        if (dataSet > 0) {
            this._subReports[groupName] = {dataSet: dataSet};
            // TODO: Might need more sub-report properties?
            this._copyProperties(data, this._subReports[groupName], ["type", "dataType", "data", "calcs", "fontSize"]);
            if (this._subReports[groupName].calcs) {
                this._mergeTotals(groupName, this._subReports[groupName].calcs);
            }
        }
        this._generateReportHeaderSectionLayout(data, height, groupName, dataSet);
        this._generateReportDetailSectionLayout(data, height, groupName, dataSet, false);
        this._generateReportFooterSectionLayout(data, height, groupName, dataSet);
    }

    _mergeTotals(groupName, totals) {
        const totalsTypes = ['sum', 'min', 'max', 'average', 'count'];
        for (let i=0;i<totalsTypes.length;i++) {
            if (totals[totalsTypes[i]]) {
                // Fix Names to be TABLE.field
                //for (let j=0;j<totals[totalsTypes[i]].length;j++) {
                //    totals[totalsTypes[i]][j] = groupName + "." + totals[totalsTypes[i]][j];
                //}

                if (!this._totals[totalsTypes[i]]) {
                    this._totals[totalsTypes[i]] = totals[totalsTypes[i]];
                } else {
                    this._totals[totalsTypes[i]].concat(totals[totalsTypes[i]]);
                }
            }
        }
    }


    _generateSection(title, height, type, groupName, dataSet, sectionData, fromGroup=false) {
        const section = new frSection(this, {title: title, height: height, type: type, group: groupName, dataSet: dataSet, fromGroup: fromGroup});
        if (sectionData == null) { return; }
        if (Array.isArray(sectionData)) {
            for (let i=0;i<sectionData.length;i++) {
                section._parseSection(sectionData[i]);
            }
        } else {
            section._parseSection(sectionData);
        }
    }

    showProperties(obj, refresh=false) {
        _UIBuilder.showProperties(obj, this._propertiesLayout, refresh);
    }

}


// ----------------------------------------- [ Sections ] ----------------------------------------------

class frSection { // jshint ignore:line

    // noinspection JSUnusedGlobalSymbols
    static getAll() { return frSection._sections; }
    static clearAll() { frSection._sections = []; }
    static resetSectionIds() {
        for (let i=0;i<frSection._sections.length;i++) {
            frSection._sections[i]._sectionId = i;
        }
    }
    static getSectionIn(offset) {
        let sec = 0;
        const len = frSection._sections.length;
        for (let i=0;i<len;i++) {
            const top = frSection._sections[i].top;
            if (offset >= top && offset <= top + frSection._sections[i].height) {
                sec = i;
                break;
            }
        }
        return sec;
    }
    static getSection(id) {
        return frSection._sections[id];
    }
    static getSectionOptions(sectionIn) {
        let options = {top: "5px"};
        if (sectionIn > 0) {
            const section = frSection._sections[sectionIn-1];
            // TODO: Change to calculated number 25 is 20 for Label and +5 for white space offset
            options.top = (parseInt(section._draggable.element.style.top, 10)+25)+"px";
        }
        return options;
    }
    static generateSave(results) {
        for (let i=0;i<frSection._sections.length;i++) {
            frSection._sections[i]._generateSave(results);
        }
    }

    get properties() {
        return this._properties;
    }

    get top() {
        return parseInt(this._html.style.top, 10);
    }
    set top(val) {
        this._html.style.top = val + "px";
    }

    get height() {
        return parseInt(this._html.style.height, 10);
    }
    set height(val) {
        if (this.height === val) { return; }
        this._html.style.height = val+"px";
        this._frLine.style.top = (val-2)+"px";
        this._resetTops(this._sectionId);
        this._draggable.position();
    }

    get bottom() {
        return (parseInt(this._html.style.top, 10) +  parseInt(this._html.style.height, 10));
    }

    get fixedHeight() { return this._fixedHeight; }
    set fixedHeight(val) { this._fixedHeight = !!val; }

    get sectionId() { return this._sectionId; }
    get uuid() { return this._uuid; }

    get type() { return this._type; }

    get hasStockElement() { return this._stockElement != null; }
    set usingStock(val) {
        this._usingStock = !!val;
        if (this._usingStock) {
            this.createStockElement();
        } else if (this._stockElement) {
            this._stockElement.delete();
            this._stockElement = null;
        }
    }
    get usingStock() { return this._usingStock; }
    get elementTitle() { return this._title; } // Used by Layout Engine
    get title() { return this._title; }
    set title(val) {
        this._title = val;
        this._titleSpan = this._generateTitle();
    }

    get groupName() { return this._groupName; }
    set groupName(val) {
        this._groupName = val;
        this._properties[0].skip = (this._type === 3 /* Detail */ || this._groupName === '');
        this._properties[1].skip = (this._type !== 3 || this._groupName === '');
        this._titleSpan = this._generateTitle();
    }

    createStockElement() {
        if (this._stockElement) { return this._stockElement; }
        let left = (parseInt( (612 *_scale), 10)  / 2) - 45;
        switch (this._type) {
            case 1: // Header
                this._stockElement = new frStandardHeader(this._report, this, {top: parseInt(this._html.style.top,10)+5, left: left });
                break;
            case 3: // Details
                console.error("CreateStockElement called on a Detail section....");
                break;
            case 2: // Footer
                this._stockElement = new frStandardFooter(this._report, this, {top: parseInt(this._html.style.top,10)+5, left: left});
                break;
            default:
                console.error("fluentReports: Unknown type", this._type);
        }
        return this._stockElement;
    }

    _resetTops(startId=0) {
        let top = frSection._sections[startId].bottom;
        const len = frSection._sections.length;
        for (let i=startId+1;i<len;i++) {
            frSection._sections[i].top = top;
            top += frSection._sections[i].height;
            frSection._sections[i]._draggable.position();
        }
        let btm = frSection._sections[len-1].bottom;
        if (parseInt(this._report.reportLayout.clientHeight,10) < btm) {
            this._report.reportLayout.style.height = btm+"px";
        }
    }

    _generateSave(results) {
        if (this._groupName !== '') {
            let group;

            // Is this a subReport or Detail?
            if (this._type === 3 && this._fromGroup === false) {
                let foundReport;
                for (let i = 0; i < this._report._saveTemporaryData.reports.length; i++) {
                    if (this._dataSet === this._report._saveTemporaryData.reports[i].dataSet ) {
                        foundReport = this._report._saveTemporaryData.reports[i];
                        break;
                    }
                }

                if (foundReport) {
                    results.subReport = foundReport;
                    foundReport.type = 'report';
                    if (!Array.isArray(foundReport.detail)) {
                        foundReport.detail = [];
                    }
                } else {
                    results.subReport = {type: 'report', detail: []};
                    this._report._saveTemporaryData.reports.push(results.subReport);
                }

                this._report._copyProperties(this._report._subReports[this._groupName], results.subReport, ["type", "dataType", "data", "fontSize", "dataSet"]);

                // Switch to the subReport
                results = results.subReport;
            } else {
                let found = false;
                for (let i=0;i<this._report._saveTemporaryData.reports.length;i++) {
                    if (this._dataSet === this._report._saveTemporaryData.reports[i].dataSet) {
                        results = this._report._saveTemporaryData.reports[i];
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    results = {dataSet: this._dataSet};
                    this._report._saveTemporaryData.reports.push(results);
                }

                // This is a group
                if (!results.groupBy) {
                    results.groupBy = [];
                }
                for (let i = 0; i < results.groupBy.length; i++) {
                    if (results.groupBy[i].groupOn === this._groupName) {
                        group = results.groupBy[i];
                        break;
                    }
                }
                if (!group) {
                    group = {type: 'group', groupOn: this._groupName};
                    results.groupBy.push(group);
                }
                // Switch to the group level, before we continue on below....
                results = group;
            }
        }

        // Ok now lets process which type of section this is
        let type = '';
        switch (this._title) {
            case 'Detail':
                type = 'detail';
                break;
            case 'Page Header':
                type = 'pageHeader';
                break;
            case 'Title Header':
                type = 'titleHeader';
                break;
            case 'Header':
                type = 'header';
                break;
            case 'Footer':
                type = 'footer';
                break;
            case 'Page Footer':
                type = 'pageFooter';
                break;
            case 'Final Summary':
                type = 'finalSummary';
                break;
            default:
                console.error("Unknown Section type", this._title);
        }
        if (!Array.isArray(results[type])) {
            results[type] = [];
        }
        let group = results[type];
        this._saveSectionInfo(group);

    }


    _saveSectionInfo(results) {
        for (let i=0;i<this._children.length;i++) {
            let child = {};
            results.push(child);
            if (this._children[i] instanceof frStandardHeader || this._children[i] instanceof frStandardFooter) {
                child.type = "raw";
                this._children[i]._saveProperties(child);
            } else {
                this._children[i]._generateSave(child);
            }
        }

    }


    _parseSection(data) {
        let top = (this._children.length * 32) + 6;
        if (top+50 >= this.height) { this.height = top + 50; }

        switch (data.type) {
            case 'raw':
                let stockElement = this.createStockElement();
                if (stockElement) {
                    this._usingStock = true;
                    stockElement._parseElement(data);
                } else {
                    console.error("Create stock element is null", data);
                }
                break;

            case 'print':
                let printElement;
                if (data.field) {
                    printElement = new frPrintField(this._report, this, {ztop: top});
                } else if (data.text) {
                    printElement = new frPrintLabel(this._report, this, {ztop: top});
                } else if (data.function) {
                    printElement = new frPrintFunction(this._report, this, {ztop: top});
                } else if (data.total) {
                    printElement = new frPrintDynamic(this._report, this, {ztop: top, type: 'total'});
                } else if (data.calculation) {
                    printElement = new frPrintDynamic(this._report, this, {ztop: top, type: 'calculation'});
                } else if (data.variable) {
                     printElement = new frPrintDynamic(this._report, this, {ztop: top, type: 'variable'});
                }
                printElement._parseElement(data);
                break;

            case 'band':
                let bandElement = new frBandElement(this._report, this, {ztop: top});
                bandElement._parseElement(data);
                break;

            case 'newLine':
                const newLine = new frNewLine(this._report, this, {top: top});
                newLine._parseElement(data);
                break;

            case 'calculation':
                this._calculations.push(data);
                this.hasCalculations = true;
                break;

            case 'function':
                //let funcs = this._report.reportFunctions;
                this._functions.push(data);
                //funcs.push(data);
                this.hasFunctions = true;
                break;

            default:
                console.error("fluentReports: Unknown", data.type, "in _parseSection");
        }
    }


    _generateTitle() {
        if (this._type === 3 /* Detail */) {
            return this._title + (this._groupName !== '' ? " (" + this._groupName +")" : '');
        }
        return this._title + (this._groupName !== '' ? " [" + this._groupName +"]" : '');
    }

    appendChild(child) {
        this._children.push(child);
        this._html.appendChild(child._html);
    }

    removeChild(child) {
        let idx = this._children.indexOf(child);
        if (idx >= 0) {
            this._children.splice(idx, 1);
        }
        this._html.removeChild(child._html);
    }

    clickFunctions() {
        _UIBuilder.functionBrowse(this._functions, ( funcs ) => {
            this._functions = funcs;
            this.hasFunctions = funcs.length > 0;
            this._refreshProperties();
        });
    }

    clickCalcs() {
        _UIBuilder.calculationBrowse(this._calculations, ( calcs ) => {
            this._calculations = calcs;
            this.hasCalculations = calcs.length > 0;
            this._refreshProperties();
        });
    }

    _refreshProperties() {
        this._report.showProperties(this, true);
   }

    constructor(report, options = {}) {
        // Create Static Shared array to track all Sections
        if (!Array.isArray(frSection._sections)) {
            frSection._sections = [];
        }
        this._sectionId = frSection._sections.length;
        frSection._sections.push(this);


        this._uuid = _frItemUUID++;
        this._report = report;
        this._functions = [];
        this._hasFunctions = false;
        this._calculations = [];
        this._hasCalculations = false;
        this._fromGroup = options && options.fromGroup || false;

        this._children = [];

        this._type = options && options.type || 0;
        this._stockElement = null;
        this._fixedHeight = false;
        this._usingStock = false;
        this._groupName = options && options.group || '';
        this._properties = [
            {
                skip: this._type === 3 || this._groupName === '',
                type: 'display',
                field: 'groupName',
                title: "Grouping",
                display: this._generateDataSetView.bind(this)
            },
            {
                skip: this._type !== 3 || this._groupName === '',
                type: 'display',
                field: 'groupName',
                title: "Data Set",
                display: this._generateDataSetView.bind(this)
            },
            {type: "number", field: "height", functionable: false, default: 0},
            {type: "boolean", field: "fixedHeight", functionable: false, default: false},
            {type: 'display', field: 'hasFunctions', title: 'Functions', display: () => { return this._createSpan(this._hasFunctions, "\ue81f", this.clickFunctions.bind(this)); }},
            {type: 'display', field: 'hasCalculations', title: 'Calculations', display: () => { return this._createSpan(this._hasCalculations, "\uE824", this.clickCalcs.bind(this)); }}
        ];
        this._dataSet = options && options.dataSet || 0;
        if (this._type === 1 || this._type === 2) {
            this._properties.push({
                type: 'display',
                display: this._generateStockCheck.bind(this),
                title: "Standard " + (this._type === 1 ? "Header" : "Footer"),
                properties: this._getProps.bind(this)
            });
        }
        this._title = options.title || (this._type === 1 ? "Header" : (this._type === 2 ? "Footer" : "Detail"));

        let height = options && options.height || 50;
        let top;
        if (this._sectionId === 0) {
            top = 0;
        } else {
            top = frSection._sections[this._sectionId - 1].bottom;
        }

        // Auto-resize report height if the size is bigger than the next section...
        if (top + height > this._report.reportLayout.clientHeight) {
            if (top + height > parseInt(this._report.reportLayout.style.minHeight, 10)) {
                this._report.reportLayout.style.height = (top + height) + "px";
            }
        }

        this._html = document.createElement("div");
        this._html.className = "frLineWrapper";
        this._html.style.top = top + "px";
        this._html.style.height = height + "px";
        this._html.style.position = "absolute";

        this._titleSpan = document.createElement("span");
        this._titleSpan.innerText = this._generateTitle();
        this._titleSpan.className = "frLineText";
        this._titleSpan.style.position = "absolute";
        this._titleSpan.style.bottom = "1px";

        this._optionSpan = document.createElement("span");
        this._optionSpan.className = "frLineIcon frIcon frHidden";
        this._optionSpan.style.position = "absolute";
        this._optionSpan.style.bottom = "1px";
        this._optionSpan.style.right = "1px";

        this._frLine = document.createElement("div");
        this._frLine.className = "frLine";
        this._frLine.style.position = "absolute";
        this._frLine.style.bottom = "0px";
        this._frLine.appendChild(this._titleSpan);
        this._frLine.appendChild(this._optionSpan);
        this._html.appendChild(this._frLine);

        this._report.reportLayout.appendChild(this._html);

        // noinspection ES6ModulesDependencies,JSHint
        this._draggable = new PlainDraggable(this._frLine, {leftTop: true});
        this._draggable.handle = this._titleSpan;

        this._draggable.autoScroll = {target: this._report.reportLayout.parentElement};

        this._draggable.containment = this._report.reportLayout;

        this._draggable.onDragStart = this._onDragStart.bind(this);
        this._draggable.onDragEnd = this._onDragEnd.bind(this);
        this._draggable.onMove = () => {
            const rect = this._html.getBoundingClientRect();
            this._html.style.height = (this._draggable.rect.bottom - (rect.top + window.pageYOffset) )+ 'px';
            let top = (parseInt(this._html.style.height,10)+parseInt(this._html.style.top, 10));
            for (let i=this._sectionId+1;i<frSection._sections.length;i++) {
                let next = frSection._sections[i];
                next._html.style.top = top + "px";
                top += next.height;
                next._draggable.position();
            }

        };
    }

    _createSpan(value, code, func) {
        const span = document.createElement('span');
        if (value === true) {
            span.innerText = "Yes";
        } else {
            span.innerText = "No";
        }
        const innerSpan = document.createElement('span');
        innerSpan.style.position = "absolute";
        innerSpan.style.right = "4px";
        innerSpan.className = "frIcon";
        innerSpan.innerText = code;
        innerSpan.style.border = "solid black 1px";
        innerSpan.style.backgroundColor = "#cacaca";
        if (func) {
            innerSpan.addEventListener("click", func);
        }
        span.appendChild(innerSpan);

        return span;
    }

    get hasFunctions() {
        return this._hasFunctions;
    }

    set hasFunctions(val) {
        this._hasFunctions = !!val;
        this._resetLabelView();
    }

    get hasCalculations() {
        return this._hasCalculations;
    }
    set hasCalculations(val) {
        this._hasCalculations = !!val;
        this._resetLabelView();
    }

    _resetLabelView() {
        let text = "";
        if (this._hasFunctions) {
            // TODO do we want to make this a <a> to toggle the function system?
            text += " \uE81F ";
        }
        if (this._hasCalculations) {
            text += " \uE824 ";
        }

        this._optionSpan.innerHTML = text;
        this._optionSpan.classList.toggle("frHidden", text.length === 0);
    }

    _generateDataSetView() {
        const span = document.createElement('span');
        span.innerText = this._groupName;
        span.style.fontWeight = "bolder";
        return span;
    }

    _generateDataSetSelection() {
        const selectList = document.createElement("select");
        selectList.className = "frSelect";
        const fields = this._report.reportFields;
        let group;

        if (this._dataSet === 0) {
            group = document.createElement("optgroup");
            group.label = "Primary Data";
            selectList.appendChild(group);
            for (let i = 0; i < fields.primary.length; i++) {
                const option = new Option(fields.primary[i]);
                if (this._field === fields.primary[i]) {
                    option.selected = true;
                }
                group.appendChild(option);
            }
        } else {
            if (fields['level' + this._dataSet].length > 0) {
                group = document.createElement("optgroup");
                group.label = fields.titles[this._dataSet];
                for (let j = 0; j < fields['level' + this._dataSet].length; j++) {
                    const option = new Option(fields['level' + this._dataSet][j]);
                    if (this._field === fields['level' + this._dataSet][j]) {
                        option.selected = true;
                    }
                    group.appendChild(option);
                }
                selectList.appendChild(group);
            }
        }

        const variables = this._report.reportVariables;
        if (variables != null) {
            group = document.createElement("optgroup");
            group.label = "- Variables -";
            let count=0;
            for (let key in variables) {
                if (!variables.hasOwnProperty(key)) { continue; }
                count++;
                const option = new Option(key);
                if (this._field === key) {
                    option.selected = true;
                }

                group.appendChild(option);
            }
            if (count) {
                selectList.appendChild(group);
            }
        }

        const calculations = this._report.reportCalculations;
        if (calculations.length) {
            group = document.createElement("optgroup");
            group.label = "- Calculations -";
            for (let i=0;i<calculations.length;i++) {
                const option = new Option(calculations[i]);
                if (this._field === calculations[i]) {
                    option.selected = true;
                }
                group.appendChild(option);
            }
            selectList.appendChild(group);
        }

        return selectList;
    }

    _generateStockCheck() {
        let check = document.createElement("input");
        check.type = "checkbox";

        if (this._usingStock) {
            check.checked = true;
        }
        check.addEventListener("click", () => {
            this._usingStock = check.checked;
            if (this._usingStock) {
                this.createStockElement();
            } else if (this._stockElement) {
                this._stockElement.delete();
                this._stockElement = null;
            }
            this._report.showProperties(this, true);
        });
        return check;
    }

    _getProps() {
        let results = [];
        if (!this._usingStock) { return results; }
        results.push({type: 'button', title: 'Edit Standard ' + (this._type === 1 ? 'Header' : 'Footer'), click: () => {
                this._stockElement.select();
            }});
        return results;
    }

    _onDragStart() {

        let pageEnd = parseInt(this._report.reportScroller.clientHeight,10);
        if (frSection._sections.length) {
            pageEnd = frSection._sections[frSection._sections.length - 1].bottom;
        }

        // Figure out the MIN-Size
        // First set top to be bottom of prior section plus a space to put an object into the section it...
        let top = 22;
        if (this._sectionId) {
            // Bottom of Prior section
            top = frSection._sections[this._sectionId-1].bottom+22;
        }
        // Let top be to bottom of any children elements...
        for (let i=0;i<this._children.length;i++) {
            let newTop = this.top + this._children[i].top + this._children[i].elementHeight;
            if (newTop >= top) { top = newTop+5; }
        }

        // Now attempt to figure out the max size
        let currentHeight = parseInt(this._report.reportLayout.clientHeight, 10);

        // Add another 1000 pixels to bottom of report to allow close to endless scrolling....
        if (currentHeight < pageEnd + 1000) {
            currentHeight = pageEnd + 1000;
            this._report.reportLayout.style.height = currentHeight + "px";
        }

        let end = currentHeight-22 - this.top;
        for (let i=this._sectionId+1;i<frSection._sections.length;i++) {
            end -= frSection._sections[i].height;
        }
        this._report.sectionConstrainer.style.top = top+"px";
        this._report.sectionConstrainer.style.height = end+"px";

        // View the Section Containment
        //this._report.sectionConstrainer.style.left = "1px";
        //this._report.sectionConstrainer.style.width = "5px";
        //this._report.sectionConstrainer.style.backgroundColor = "green";

        this._draggable.containment = this._report.sectionConstrainer;

        this._draggable.position();
    }

    _onDragEnd() {
            // Reset bottom of report to be where the last section is at...
            if (frSection._sections.length) {
                let bottom = frSection._sections[frSection._sections.length - 1].bottom;
                if (bottom < this._report._reportScroller.clientHeight) { bottom = this._report._reportScroller.clientHeight; }
                this._report.reportLayout.style.height = bottom + "px";
            }

            // Clear Containment after we are done dragging, so that scrolling doesn't break them
            this._draggable.containment = {top: 0, left: 0, width: 0, height: 0};
            this._draggable.containment = this._report.reportLayout;
            this._report.sectionConstrainer.style.top = "0px"; // jshint ignore:line
            this._report.sectionConstrainer.style.height = "0px";

            // Refresh Property panel
            this._report.showProperties(this, false);
    }


}



// ----------------------------------------- [ Elements ] ----------------------------------------------



/**
 * FluentReports Base Element
 */
class frElement { // jshint ignore:line

    static clearAll() {
        _frElements = [];
    }

    static getAll() {
        return _frElements;
    }

    
    constructor(report, parent /* , options */) {
        this._uuid = _frItemUUID++;
        this._report = report;
        this._parent = parent;
        this._html = null;
        this._draggable = null;
        this._locked = false;
        this._width = 0;
        this._height = 0;
        this._handlers = {};
        this._properties = [
            {type: 'number', field: 'top', default: 0, destination: "settings"},
            {type: 'number', field: 'left', default: 0, destination: "settings"},
            {type: 'number', field: 'width', default: 0, destination: "settings"},
            {type: 'number', field: 'height', default: 0, destination: "settings"}
            ];
        _frElements.push(this);
    }

    delete() {
        if (this._report.currentSelected === this) {
            this.blur();
            this._report.showProperties(null);
        }
        this._html.parentElement.removeChild(this._html);
        let idx = _frElements.indexOf(this);
        _frElements.splice(idx, 1);
    }

    get uuid() { return this._uuid; }
    get properties() { return this._properties; }

    get draggable() { return this._draggable; }
    get html() { return this._html; }

    get top() { return parseInt(this._html.style.top,10); }
    set top(val) { this._html.style.top = val+"px"; }

    get left() { return parseInt(parseInt(this._html.style.left, 10) / _scale, 10); }
    set left(val) { this._html.style.left = (val*_scale)+"px"; }

    get width() { return this._width; }
    set width(val) {
        if (val == null || val === "" || val === "auto" || val === "0px") { val = 0;}
        this._width = val;
        if (val === 0 || val === "0") {
            this._html.style.width = "";
        } else if (val < 10) {
            this._html.style.width = "10px";
        } else {
            this._html.style.width = (val*_scale)+"px";
        }
    }

    get locked() { return this._locked; }
    set locked(val) {
        this._locked = !!val;
        this._draggable.disabled = this._locked;
    }

    get height() { return this._height; }
    set height(val) {
        if (val == null || val === "" || val === "auto" || val === "0px") { val = 0;}
        this._height = parseInt(val,10);
        if (val === 0 || val === "0") {
            this._html.style.height = "";
        } else {
            this._html.style.height = (val*_scale)+"px";
        }
    }

    get elementHeight() {
        let clientHeight = parseInt(this._html.clientHeight,10);
        return this._height > clientHeight ? this._height : clientHeight;
    }

    get elementWidth() {
        let clientWidth = parseInt(this._html.clientWidth,10);
        return this._width > clientWidth ? this._width : clientWidth;
    }


    on(event, handler) {
        if (typeof this._handlers[event] === 'undefined') {
            this._handlers[event] = [];
        }
        this._handlers[event].push(handler);
    }

    off(event, handler) {
        if (handler == null) {
            this._handlers[event] = [];
        } else {
            for (let i=0;i<this._handlers[event].length; i++) {
                if (this._handlers[event][i] === handler) {
                    this._handlers[event].splice(i, 1);
                    break;
                }
            }
        }
    }

    blur() {
        this._html.blur();
        this._blur(this);
    }

    focus() {
        this._focus();
    }

    select() {
        this._selected();
    }

    _refreshProperties(){
        this._report.showProperties(this, true);
    }

    _generateSave(prop) {
        this._saveProperties(prop);
    }

    _parseElement(data) {
        console.error("Element: ParseElement should be overridden", data);
    }

    _copyProperties(src, dest, props) {
        if (src == null) { return; }
        for (let i=0;i<props.length;i++) {
            if (typeof src[props[i]] !== 'undefined') {
                dest[props[i]] = src[props[i]];
            }
            if (src.settings && typeof src.settings[props[i]] !== 'undefined') {
                dest[props[i]] = src.settings[props[i]];
            }
        }
    }

    _notify(eventName, event) {
        if (this._handlers[eventName]) {
            for (let i=0;i<this._handlers[eventName].length;i++) {
                this._handlers[eventName][i](event);
            }
        }
    }

    _generateSnapping() {
        let targets=[];
        let secs = frSection.getAll();
        for (let i=0;i<secs.length;i++) {
            targets.push(secs[i]._html);
        }
        if (this._report.gridSnapping.snapping) {
            targets.push({step: this._report.gridSnapping.size});
        }
        return  {
            targets: targets,
            gravity: 5
        };
    }

    _assignStandardHandlers(object, listeners) {
        // noinspection ES6ModulesDependencies
        this._draggable = new PlainDraggable(object, {leftTop: true});
        //this._draggable.autoScroll = {target: document.getElementById("frReport")};
        this._draggable.containment = this._parent._html;

        this._draggable.onDragStart = () => {
            if (this._locked) { return; }
            this._draggable.containment = this._report.reportLayout;
            this._draggable.snap = this._generateSnapping();
        };

        this._draggable.onDragEnd = () => {
            if (this._locked) { return; }
            let newSection = this._parent.sectionId;
            if (this.top < 0) {
                newSection = frSection.getSectionIn(this._parent.top + this.top);
            } else if (this.top >= this._parent.height) {
                newSection = frSection.getSectionIn(this._parent.top + this.top+1);
                if (newSection === 0) { newSection = frSection._sections.length-1; }
            }
            if (newSection !== this._parent.sectionId) {
                let top = this._parent.top + this.top;
                this._parent.removeChild(this);
                let sec = frSection.getSection(newSection);
                sec.appendChild(this);
                this._parent = sec;
                top -= this._parent.top;
                this.top = top;
            }

            this._report.showProperties(this, false);

            // While the object is at rest; we want to force it to stay inside its section
            //this._draggable.containment = this._parent._html;
        };

        if (listeners == null || (listeners & 1) === 1) { // jshint ignore:line
            object.addEventListener("click", this._clickHandler.bind(this));
        }
        if (listeners == null || (listeners & 2) === 2) { // jshint ignore:line
            object.addEventListener("dblclick", this._dblClickHandler.bind(this));
        }

        if (listeners == null || (listeners & 4) === 4) { // jshint ignore:line
            object.addEventListener("blur", this._blur.bind(this));
        }

        if (listeners == null || (listeners & 8) === 8) { // jshint ignore:line
            object.addEventListener("mousedown", this._mouseDown.bind(this));
        }

        return this._draggable;
    }

    _mouseDown() {
        this._selected();
    }

    _blur(args) {
        this._report.currentSelected = null;
        this._html.classList.remove("frSelected");

        if (this._handlers.blur && args !== this) {
            this._notify('blur', args);
        }
    }

    _dblClickHandler(args) {
        if (this._handlers.dblclick) {
            this._notify('dblclick', args);
        } else {
            this._focus();
        }
    }

    _clickHandler(args) {
        if (this._handlers.click && this._handlers.click.length) {
            this._notify('click', args);
        } else {
            // We don't want the reportLayout to see this click event; as it will cancel the selection...
            args.stopPropagation();

            this._selected();
        }
    }

    _focus() {
        this._selected();
        this._html.focus();
    }

    _selected() {
        if (this._report.currentSelected !== this && this._report.currentSelected != null) {
            this._report.currentSelected.blur();
        }
        this._report.showProperties(this, true);
        this._report.currentSelected = this;
        this._html.classList.add("frSelected");
    }


    _addProperties(arr, insert=true) {
        if (insert === true) {
            if (Array.isArray(arr)) {
                this._properties = arr.concat(this._properties);
            } else {
                this._properties.unshift(arr);
            }
        } else {
            if (Array.isArray(arr)) {
                this._properties = this._properties.concat(arr);
            } else {
                this._properties.push(arr);
            }
        }
    }

    _saveProperties(props, ignore=[]) {
        for (let i=0;i<this._properties.length;i++) {
            const curProp = this._properties[i];
            if (curProp.field) {
                // Check to see if we passed in this field to be ignored by a descendant
                if (ignore.indexOf(curProp.field) >= 0) { continue; }

                // Check to see if the field has the default value
                if (typeof curProp.default !== 'undefined' && curProp.default === this[curProp.field]) { continue; }

                // Check to see if we have a destination override
                if (typeof curProp.destination !== 'undefined') {
                    // Check to see if the destination override is set to false; meaning we don't save it.
                    if (curProp.destination === false) { continue; }

                    // Ok, use the destination override to save it
                    if (typeof props[curProp.destination] === 'undefined') {
                        props[curProp.destination] = {};
                    }
                    props[curProp.destination][curProp.field] = this[curProp.field];
                } else {
                    // Use the normal save location...
                    props[curProp.field] = this[curProp.field];
                }
            }
        }
    }

    _deleteProperties(arr) {
        if (Array.isArray(arr)) {
            for (let i=0;i<arr.length;i++) {
                let idx = this._properties.indexOf(arr[i]);
                if (idx < 0) {
                    for (let j=0;j<this._properties.length && idx < 0;j++) {
                        if (this._properties[j].field === arr[i]) {
                            idx = j;
                        }
                    }
                }
                if (idx >= 0) {
                    this._properties.splice(idx, 1);
                }
            }

        } else {
            let idx = this._properties.indexOf(arr);
            if (idx >= 0) {
                this._properties.splice(idx, 1);
            }
        }
    }
}

class frTitledElement extends  frElement {
    constructor(report, parent, options = {}) {
        super(report, parent, options);

        this._html = document.createElement("div");
        this._html.className = "frTitledElement " + (options && options.className  || '');
        this._html.style.top = options && options.top || "0px";
        this._html.style.left = options && options.left || "0px";
        this._html.style.position = 'absolute';

        this._elementTitle = document.createElement("span");
        this._elementTitle.innerText = options && options.elementTitle || "Title";
        this._elementTitle.className = "frTitledLabel";
        this._elementTitle.style.maxHeight = "10px";
        this._elementTitle.style.overflow = "hidden";
        this._html.appendChild(this._elementTitle);

        if (options && options.child) {
            this._html.appendChild(options.child);
        }

        parent.appendChild(this);
        this._assignStandardHandlers(this._html, options && options.handlers);
    }

    get elementTitle() { return this._elementTitle.innerText; }
    set elementTitle(val) { this._elementTitle.innerText = val; }

}

class frTitledLabel extends frTitledElement { // jshint ignore:line
    constructor(report, parent, options = {}) {
        super(report, parent, options);

        this._text = document.createElement("div");
        this._text.innerText = options && options.label || "Label";
        this._html.appendChild(this._text);
    }

    get width() {
        return super.width;
    }
    set width(val) {
        super.width = val;
        this._text.style.width = this._html.style.width;
    }

    get height() {
        return super.height;
    }
    set height(val) {
        super.height = val;
        this._text.style.height = this._html.style.height;
    }

    get label() { return this._text.innerText; }
    set label(val) { this._text.innerText = val; }
}

class frStandardHeader extends frTitledLabel { // jshint ignore:line
    constructor(report, parent, options = {}) {
        options.elementTitle = "Standard Header";
        options.handlers = 13;
        options.label = "[ Report ]";
        super(report, parent, options);
        this._title = 'Report';
        this._addProperties({type: 'string', field: 'title'});
        this._deleteProperties(['top', 'left', 'width', 'height']);
//        this._draggable.containment = parent._html;
        this.locked = true;
    }

    get title() { return this._title; }
    set title(val) {
        this._title = val;
        this.label = "[ "+val+" ]";
    }

    _saveProperties(props) {
            props.values = [this.title];
    }
    _parseElement(data) {
        this.title = data.values[0] || "Report";
    }

    delete() {
        if (this._inDelete) { return; }
        this._inDelete = true;
        super.delete();
        this._parent.usingStock = false;
        this._inDelete = false;
    }
}

// TODO: Maybe a descendant of Band?
class frStandardFooter extends frTitledLabel { // jshint ignore:line
    constructor(report, parent, options = {}) {
        options.elementTitle = "Standard Footer";
        options.handlers = 13;
        options.label = "[ Report ]";
        super(report, parent, options);
        this._title = "Report";
        this._totals = [];
        this._addProperties([{type: 'text', field: 'title'}]);
        this._addProperties(  {type: 'button', field: 'totals', title: 'Totals', click: this._setTotals.bind(this), destination: false}, false);
        this._deleteProperties(['top', 'left', 'width', 'height']);
        this.locked = true;
//        this._draggable.containment = parent._html;
    }

    _setTotals() {

        console.log("Set Totals");
    }

    get title() { return this._title; }
    set title(val) {
        this._title = val;
        this.label = "[ "+val+" ]";
    }

    get totals() { return this._totals; }
    set totals(val) { this._totals = val;}

    _saveProperties(props) {
        if (this.title === "Band") {
            props.values = this.totals;
        } else {
            props.values = [this.title, this.totals[0][0], this.totals[2]];
        }
    }

    _parseElement(data) {
        if (Array.isArray(data.values[0])) {
            this.totals = data.values;
            this.title = "Band";
        } else {
            this.title = data.values[0] || "";
            this.totals = [[data.values[1]], -1, data.values[2]];
        }
    }

    delete() {
        if (this._inDelete) { return; }
        this._inDelete = true;
        super.delete();
        this._parent.usingStock = false;
        this._inDelete = false;
    }

}

class frNewLine extends  frTitledLabel { // jshint ignore:line
    get count() { return this._count; }
    set count(val) {
        this._count = parseInt(val, 10);
        this.label = "Lines: ("+this._count+")";
    }

    constructor(report, parent, options={}) {
        super(report, parent, options);
        this.count = 1;
        this.elementTitle = "New/Blank Line";
        this._deleteProperties(["top", "left", "width", "height"]);
        this._addProperties({type: 'number', field: "count", default: 1});
    }

    _saveProperties(props) {
        super._saveProperties(props);
        props.type = "newLine";
    }

    _parseElement(data) {
        if (data.count > 0) { this.count = data.count; }
    }
}

class frPrint extends  frTitledLabel {
    constructor(report, parent, options={}) {
        super(report, parent, options);
        this._addX = 0;
        this._addY = 0;
        this._fontBold = false;
        this._fill = '';
        this._textColor = '';
        this._link = "";
        this._text.style.overflow = "hidden";
//        this._text.style.wordBreak = "keep-all";
        this._text.style.whiteSpace = "nowrap";



        this._border = 0;
        this._wrap = false;

        this._addProperties(
            [{type: 'number', field: "x", default: 0, destination: "settings"},
                {type: 'number', field: "y", default: 0, destination: "settings"},
                {type: 'number', field: "addX", default: 0, destination: "settings"},
                {type: 'number', field: "addY", default: 0, destination: "settings"},
                {type: 'boolean', field: "fontBold", default: false, destination: "settings"}, 
                {type: 'string', field: "fill", functionable: true, default: "", destination: "settings"}, 
                {type: 'string', field: "textColor", functionable: true, default: "", destination: "settings"},
                {type: 'string', field: "link", functionable: true, default: "", destination: "settings"}, 
                {type: 'number', field: "border", default: 0, destination: "settings"},
                {type: 'boolean', field: "wrap", default: false, destination: "settings"}]);
    }

    get x() { return this.left; }
    set x(val) { this.left = val; }
    get y() { return this.top; }
    set y(val) { this.top = val; }


    get addX() { return this._addX; }
    set addX(val) { this._addX = parseInt(val, 10); }
    get addY() { return this._addY; }
    set addY(val) { this._addY = parseInt(val, 10); }
    get fontBold() { return this._fontBold; }
    set fontBold(val) { this._fontBold = !!val; }
    get fill() { return this._fill; }
    set fill(val) { this._fill = val; }
    get textColor() { return this._textColor; }
    set textColor(val) { this._textColor = val; }
    get link() { return this._link; }
    set link(val) { this._link = val; }
    get border() { return this._border; }
    set border(val) { this._border = parseInt(val, 10); }
    get wrap() { return this._wrap; }
    set wrap(val) {
        this._wrap = !!val;
        if (this._text) {
//            this._text.style.wordBreak = this._wrap ? "normal" : "keep-all";
            this._text.style.whiteSpace = this._wrap ? "normal" : "nowrap";
        }
    }

    _parseElement(data) {
        this._copyProperties(data, this, ["x", "y", "addX", "addY", "fontBold", "fill", "textColor", "link", "border", "wrap"]);
    }

    _saveProperties(props) {
        super._saveProperties(props);
        props.type = 'print';

    }


}

class frPrintLabel extends frPrint  { // jshint ignore:line
    constructor(report, parent, options = {}) {
        options.elementTitle = "Label";
        super(report, parent, options);
        this._text.contentEditable = options && typeof options.contentEditable === 'undefined' ? "true" : options.contentEditable || "true";
        this.label = "Label";
        this._addProperties({type: "string", field: 'label'});
    }

    _saveProperties(props) {
        super._saveProperties(props);
    }


    _parseElement(data) {
        if (data.text) {
            this.label = data.text;
        }
        super._parseElement(data);
    }

    _focus(args) {
        super._focus(args);

        // Don't allow dragging because we want to do text editing...
        this._draggable.disabled = true;
    }


    _blur(args) {
        window.getSelection().removeAllRanges();
        const test = this.label;
        let reset = true;
        for (let i=0;i<test.length;i++) {
            const code = test.charCodeAt(i);
            if (code !== 13 && code !== 10 && code !== 32 && code !== 160) {
                reset = false; break;
            }
        }

        if (reset) {
            this.label = "Label";
        }

        // Re-enable Dragging, unless it is locked...
        this._draggable.disabled = this._locked;

        super._blur(args);
    }
}

class frPrintFunction extends frPrint { // jshint ignore:line
    constructor(report, parent, options = {}) {
        options.elementTitle = "Print Function";
        super(report, parent, options);
        this.name = '';
        this._async = false;
        this.function = options && options.function || '';
        this._addProperties(
            [{type: 'boolean', field: "async", default: false}, {type: 'string', field: "name"}]
        );
        this._addProperties({type: 'button', field: 'function', title: "Function Editor", click: this._dblClickHandler.bind(this)}, false);
    }

    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
        if (this._function) {
            this.label = "{ FUNCTION: "+this._name+" }";
        } else {
            this.label = "{ function: "+this._name+" }";
        }
    }

    get function() { return this._function; }
    set function(val) {
        this._function = val;
        if (val == null || val.length === 0) {
            this._function = '';
            this.label = "{ function: "+this._name+" }";
        } else {
            this.label = "{ FUNCTION: "+this._name+" }";
        }
    }

    get async() {
        return this._async;
    }
    set async(val) {
        this._async = !!val;
    }

    _runFunction() {
        try {
            const func = new Function('report', 'data', 'state', 'vars', 'done', this._function);   // jshint ignore:line
            let data = {};

            const fields = this._report.reportFields;

            for (let i=0;i<fields.primary.length;i++) {
                data[fields.primary[i]] = "data."+fields.primary[i];
            }

            for (let i=1;i<=fields.levels;i++) {
                if (fields['level'+i].length > 0) {
                    for (let j = 0; j < fields['level' + i].length; j++) {
                        data[fields['level'+i][j]] = "data."+fields['level'+i][j];
                    }
                }
            }

            let vars = {};
            const variables = this._report.reportVariables;
            if (variables != null) {
                for (let key in variables) {
                    if (!variables.hasOwnProperty(key)) { continue; }
                    vars[key] = "vars."+key;
                }
            }

            if (!this._async) {
                this.label = "{ FUNCTION: " + func({}, data, {}, vars);
            } else {
                func({}, data, {}, vars, (val) => {
                    this.label = "{ FUNCTION: " + val + " }";
                });
            }
        } catch (err) {
            console.error("fluentReports: Error in runFunction", err);
            this.label = "{ FUNCTION }";
        }
    }

    _dblClickHandler() {
        _UIBuilder.functionEditor(this._function, null, this.async, this.skip, (result, name, isAsync, isSkip) => {
            let changed = false;
            if (this._function !== result) {
                this.function = result;
                changed = true;
                this.name = "Print Function";
            }
            if (this.async !== isAsync) {
                this.async = isAsync;
                changed = true;
            }
            if (this.skip !== isSkip) {
                this.skip = isSkip;
                changed = true;
            }
            if (changed) {
                this._report.showProperties(this, true);
            }
        });
    }

    _saveProperties(props) {
        super._saveProperties(props);
        props.function = {
            function: this._function, type: "function"
        };
        this._copyProperties(this, props.function, ['async', 'name', 'function']);
    }


    _parseElement(data) {
        this._copyProperties(data.function, this, ['async', 'name', 'function']);
        super._parseElement(data);
    }
}

class frPrintField extends frPrint { // jshint ignore:line
    constructor(report, parent, options = {}) {
        options.elementTitle = "Data Field";
        super(report, parent, options);
        this.field = options && options.field || 'Unknown';
        this._addProperties({type: 'select', title: 'field', field: 'field', display: this._generateDataFieldSelection.bind(this)});
    }

    _generateDataFieldSelection() {
        return _UIBuilder.createDataSelect(this._report, this._field, 3);
    }

    get field() { return this._field; }
    set field(val) {
        this._field = val;
        this.label = val;
    }


    _dblClickHandler() {
       _UIBuilder.dataFieldEditor(this._generateDataFieldSelection(), (value) => {
            if (this.field !== value) {
                this.field = value;
                this._report.showProperties(this, true);
            }
        });

    }

    _parseElement(data) {
        if (data.field) {
            this.field = data.field;
        }
        super._parseElement(data);
    }
}

class frPrintDynamic extends frPrint { // jshint ignore:line
    constructor(report, parent, options = {}) {
        options.elementTitle = "Dynamic Field";
        super(report, parent, options);
        this.type = options && options.type || 'variable';
        this.other = options && options[this._type] || '-unset-';

        this._addProperties([
            {type: 'select', title: 'type', field: 'type', onchange: this._refreshProperties.bind(this), display: this._generateTypeSelection.bind(this)},
            {type: 'select', title: 'field', field: 'other', display: this._generateDataFieldSelection.bind(this)}
        ]);
    }

    _refreshProperties() {
        // TODO: Maybe get the first valid option of the new type?
        this.other = "-unset-";
        super._refreshProperties();
    }

    get type() { return this._type; }
    set type(val) {
        this._type = val;
        this._elementTitle.innerText = val;
    }

    get other() { return this._total; }
    set other(val) {
        this._other = val;
        this.label = val;
    }

    _generateTypeSelection() {
        const selectList = document.createElement("select");
        selectList.className = "frSelect";

        let option = new Option("variable");
        if (this.type === "variable") {
            option.selected = true;
        }
        selectList.appendChild(option);

        option = new Option("calculation");
        if (this.type === "calculation") {
            option.selected = true;
        }
        selectList.appendChild(option);

        option = new Option("total");
        if (this.type === "total") {
            option.selected = true;
        }
        selectList.appendChild(option);


        return selectList;
    }

    _generateDataFieldSelection() {
        let dataSets = 4;
        switch (this._type) {
            case 'variable':
                dataSets = 4; break;
            case 'calculation':
                dataSets = 8; break;
            case 'total':
                dataSets = 16; break;
        }
        return _UIBuilder.createDataSelect(this._report, this._other, dataSets);
    }

    _dblClickHandler() {
        _UIBuilder.dataFieldEditor(this._generateDataFieldSelection(), (value) => {
            if (this.other !== value) {
                this.other = value;
                this._report.showProperties(this, true);
            }
        });
    }

    _saveProperties(props) {
        super._saveProperties(props, ["other"]);
        props[this.type] = this.other;
    }


    _parseElement(data) {
        if (data.calculation) {
            this.type = "calculation";
            this.other = data.calculation;
        }
        else if (data.variable) {
            this.type = "variable";
            this.other = data.variable;
        }
        else if (data.total) {
            this.type = "total";
            this.other = data.total;
        }

        super._parseElement(data);
    }
}


class frBandElement extends frPrint { // jshint ignore:line
    get columns() { return this._columns; }
    set columns(val) {
        this._columns = parseInt(val, 10);
        this._fixColumns();
    }

    get suppression() { return this._suppression; }
    set suppression(val) {
        this._suppression = !!val;
        if (this._suppression) {
            this._table.style.border = "1px solid black";
        } else {
            this._table.style.border = "1px dot black";
        }
    }

    get bands() {
        return this._bands;
    }

    constructor(report, parent, options = {}) {
        options.elementTitle = "Band";
        super(report, parent, options);
        this._text.style.display="none";
        this._columns = 4;
        this._gridColumns = [];
        this._bands = [];
        this._suppression = false;

        this._table = document.createElement("table");
        this._table.className = "frGrid";
        this._table.style.border = "1px solid black";
        this._table.style.borderCollapse = "collapse";
        this._table.style.backgroundColor = "#808080";


        this._tr = document.createElement("tr");
        this._table.appendChild(this._tr);
        this._fixColumns();

        this._html.appendChild(this._table);

        this._addProperties([{type: 'boolean', field: 'suppression', default: false},
            {type: 'number', field: 'columns', destination: false}]);
        this._addProperties({type: 'button', title: 'Band Editor', click: () => { this._bandEditor(); }}, false);
    }

    _dblClickHandler() {
        this._bandEditor();
    }

    _bandEditor() {
        _UIBuilder.bandBrowse(this._report, this._bands, (value) => {
            this._bands = value;
            this._columns = value.length;
            this._fixColumns();
            for (let i=0;i<this._bands.length;i++) {
                const td = this._getCell(i);
                td.innerText = this._getBandTitle(i);
                this._fixCellProps(td, this._bands[i]);
            }
        });
    }

    _fixColumns() {
            if (this._columns === this._gridColumns) { return;}
            if (this._columns > this._gridColumns.length) {
                for (let i = this._gridColumns.length; i < this._columns; i++) {
                    let td = document.createElement("td");
                    td.style.border = "1px dotted black";
                    td.innerText = this._getBandTitle(i);
                    this._gridColumns.push(td);
                    this._tr.appendChild(td);
                }
            } else {
                while (this._columns < this._gridColumns.length) {
                    let td = this._gridColumns.pop();
                    this._tr.removeChild(td);
                }
            }
    }

    _getBandTitle(index) {
        if (this._bands.length <= index || index < 0) { return "?????"; }
        let bnd = this._bands[index];
        if (bnd.text != null) { return bnd.text; }
        if (bnd.field != null) { return "data."+bnd.field; }
        if (bnd.calculation != null) { return "calc."+bnd.calculation; }
        if (bnd.variable != null) { return "var."+bnd.variable; }
        if (bnd.total != null) { return "total."+bnd.total; }
        if (bnd.function != null) { return "{ FUNCTION }"; }
        return "-???-";
    }

    _saveProperties(props) {
        super._saveProperties(props);
        props.type = "band";
        props.fields = [];

        // Save only what the minimum number of columns selected, or the minimum number of columns that exist...
        let count = Math.min(this.columns, this._bands.length);
        for (let i=0;i<count;i++) {
            props.fields.push(this._bands[i]);
        }
    }


    _parseElement(data) {
        const len = data.fields.length;
        this.columns = len;
        for (let i=0;i<len;i++) {
            this._handleBandCell(data.fields[i]);
        }
        this._copyProperties(data.settings, this, ["x", "y", "addX", "addY", "fontBold", "fill", "textColor", "link", "border", "wrap"]);
    }

    _getCell(id) {
        return this._tr.children[id];
    }

    _handleBandCell(field) {
        const cellId = this._bands.length;
        this._bands.push(field);
        const td = this._getCell(cellId);
        td.innerText = this._getBandTitle(cellId);

        this._fixCellProps(td, field);
    }

    _fixCellProps(td, field) {
        td.width = (field.width*_scale || 80) + "px";
        if (field.align != null) {
            switch(field.align) {
                case 1: // LEFT
                    break;
                case 2:
                    td.style.textAlign = "center";
                    break;
                case 3:
                    td.style.textAlign = "right";
                    break;
            }
        }
        // TODO: Handle rest of properties
    }

}


class UI { // jshint ignore:line

    static variableValueEditor(name, value, ok, cancel) {
        const body = document.createElement('div');


        const nameDiv = document.createElement('div');
        const name1 = document.createElement('span');
        name1.innerText = "Variable name:";
        const variableName = document.createElement('input');
        variableName.value = name;
        nameDiv.appendChild(name1);
        nameDiv.appendChild(variableName);
        body.appendChild(nameDiv);

        const valueDiv = document.createElement('div');
        const value1 = document.createElement('span');
        value1.innerText = "Variable value:";
        const variableValue = document.createElement('input');
        variableValue.value = value;
        valueDiv.appendChild(value1);
        valueDiv.appendChild(variableValue);
        body.appendChild(valueDiv);

        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Value Editor", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(variableName.value, variableValue.value);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static variableBrowse(variables, ok, cancel) {
        const body = document.createElement('div');
        const span = document.createElement('span');
        span.innerText = "Variables:";
        body.appendChild(span);
        body.appendChild(document.createElement('br'));
        const selectDiv = document.createElement('div');

        const select = document.createElement('select');
        select.style.border = "solid black 1px";
        select.style.margin = "5px";
        select.style.left = "5px";
        select.style.right = "5px";
        select.style.height = "200px";
        select.style.width = "200px";
        select.size = 10;
        const resultVariables = {};

        for (let key in variables) {
            if (!variables.hasOwnProperty(key)) {
                continue;
            }
            const option = new Option(key);
            select.appendChild(option);

            // Copy variables
            resultVariables[key] = variables[key];
        }

        selectDiv.appendChild(select);
        selectDiv.style.display = 'inline-block';
        body.appendChild(selectDiv);
        const valueDiv = document.createElement('div');
        valueDiv.margin = "5px";
        const valueTitle = document.createElement('span');
        valueTitle.innerText = 'Value: ';
        const valueValue = document.createElement('span');
        valueDiv.appendChild(valueTitle);
        valueDiv.appendChild(valueValue);
        select.addEventListener('change', () => {
            valueValue.innerText = resultVariables[select.value];
        });


        let addButtons = _UIBuilder.createButtons(["Add", "Edit", "Delete"], {width: "100px", marginTop: "5px"});
        let addBtnContainer = document.createElement('div');
        //addBtnContainer.style.display = ''
        addBtnContainer.style.padding = "5px";
        addBtnContainer.style.display = 'inline-block';
        addBtnContainer.style.verticalAlign = "top";
        addBtnContainer.appendChild(addButtons[0]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[1]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[2]);
        body.appendChild(addBtnContainer);

        body.appendChild(valueDiv);


        // Add
        addButtons[0].addEventListener("click", () => {
            _UIBuilder.variableValueEditor("", "", (name, value) => {
                if (name != null && name !== '') {
                    if (!resultVariables.hasOwnProperty(name)) {
                        select.appendChild(new Option(name));
                    }
                    resultVariables[name] = value;
                }
            });
        });

        // Edit
        addButtons[1].addEventListener("click", () => {
            let key = select.value;
            _UIBuilder.variableValueEditor(key, resultVariables[key], (name, value) => {
                if (name !== key) {
                    delete resultVariables[key];
                    select.options[select.selectedIndex].text = name;
                }
                valueValue.innerText = value;
                resultVariables[name] = value;
            });
        });

        // Delete
        addButtons[2].addEventListener("click", () => {
            if (select.selectedIndex >= 0) {
                let key = select.value;
                delete resultVariables[key];
                select.options[select.selectedIndex] = null;
                valueValue.innerText = '';
            }
        });



        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Variables", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(resultVariables);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static groupsBrowse(groups, report, ok, cancel) {
        const body = document.createElement('div');
        const span = document.createElement('span');
        span.innerText = "Group By:";
        body.appendChild(span);
        body.appendChild(document.createElement('br'));
        const selectDiv = document.createElement('div');

        const select = document.createElement('select');
        select.style.border = "solid black 1px";
        select.style.margin = "5px";
        select.style.left = "5px";
        select.style.right = "5px";
        select.style.height = "200px";
        select.style.width = "200px";
        select.size = 10;
        let resultVariables = [];

        let tempFields = report.reportFields;

        const tempOptGroups = [];
        for (let i=0;i<tempFields.titles.length;i++) {
            const group = document.createElement("optgroup");
            group.label = tempFields.titles[i];
            tempOptGroups.push(group);
            select.appendChild(group);
        }

        for (let i=0;i<groups.length;i++) {
            const optGroup = tempOptGroups[groups[i].dataSet];
            const option = new Option(groups[i].name);
            optGroup.appendChild(option);
            resultVariables.push(shallowClone(groups[i]));
        }

        selectDiv.appendChild(select);
        selectDiv.style.display = 'inline-block';
        body.appendChild(selectDiv);


        let addButtons = _UIBuilder.createButtons(["Add", "Edit", "Delete", "\uE83B", "\uE83C"], {width: "100px", marginTop: "5px"});
        let addBtnContainer = document.createElement('div');
        //addBtnContainer.style.display = ''
        addBtnContainer.style.padding = "5px";
        addBtnContainer.style.display = 'inline-block';
        addBtnContainer.style.verticalAlign = "top";

        // Add Up/Down
        addButtons[3].style.width = "47px";
        addButtons[4].style.width = "47px";
        addBtnContainer.appendChild(addButtons[3]);
        addBtnContainer.appendChild(addButtons[4]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(document.createElement('br'));

        for (let i=0;i<3;i++) {
            addBtnContainer.appendChild(addButtons[i]);
            addBtnContainer.appendChild(document.createElement('br'));
        }

        body.appendChild(addBtnContainer);

        const rebuildGroups = () => {
            // Clear all Select->Options
           for (let i=0;i<tempOptGroups.length;i++) {
               while (tempOptGroups[i].children.length) { tempOptGroups[i].removeChild(tempOptGroups[i].children[0]); }
           }

           // Recreate all Select Options
           for (let i=0;i<resultVariables.length;i++) {
                const optGroup = tempOptGroups[resultVariables[i].dataSet];
                const option = new Option(resultVariables[i].name);
                optGroup.appendChild(option);
           }
        };

        // Move Up
        addButtons[3].addEventListener("click", () => {
            if (select.selectedIndex <= 0) { return; }
            let curIndex = select.selectedIndex;
            let curGroup = resultVariables[curIndex];
            let priorGroup = resultVariables[curIndex-1];
            if (priorGroup.dataSet !== curGroup.dataSet) {
                return;
            }

            // Move names in groups...
            let temp = priorGroup.name;
            priorGroup.name = curGroup.name;
            curGroup.name = temp;

            rebuildGroups();
            select.selectedIndex = curIndex-1;
        });

        // Move Down
        addButtons[4].addEventListener("click", () => {
            const curIndex = select.selectedIndex;
            if (curIndex < 0) { return; }

            if (curIndex >= resultVariables.length-1) { return; }

            let curGroup = resultVariables[curIndex];
            let nextGroup = resultVariables[curIndex+1];
            if (nextGroup.dataSet !== curGroup.dataSet) {
                return;
            }

            // Move names in groups...
            let temp = nextGroup.name;
            nextGroup.name = curGroup.name;
            curGroup.name = temp;

            rebuildGroups();
            select.selectedIndex = curIndex+1;
        });


        // Add
        addButtons[0].addEventListener("click", () => {
            const fields = _UIBuilder.createDataSelect(report, null , 3);
            _UIBuilder.dataFieldEditor(fields,(name, idx, dataSet) => {
                if (name != null && name !== '') {
                    let optGroup = tempOptGroups[dataSet];
                    let found = false;
                    for (let i=0;i<resultVariables.length;i++) {
                        if (resultVariables[i].dataSet === dataSet && resultVariables[i].name === name) {
                            found = true;
                            break;
                        }

                    }
                    if (!found) {
                        // Grab count before adding...
                        let count = optGroup.children.length;
                        optGroup.appendChild(new Option(name));
                        if (count === 0) {
                            // Move to very top
                            resultVariables.unshift({name: name, dataSet: dataSet});
                        } else if (dataSet === tempOptGroups.length-1) {
                            // Move to Bottom
                            resultVariables.push({name: name, dataSet: dataSet});
                        } else {
                            // Move somewhere inside array
                            let temp = resultVariables.splice(0, count);
                            temp.push({name: name, dataSet: dataSet});
                            resultVariables = temp.concat(resultVariables);
                        }
                    }
                }
            });
        });

        // Edit
        addButtons[1].addEventListener("click", () => {
            if (select.selectedIndex < 0) { return; }
            const fields = _UIBuilder.createDataSelect(report, select.value , 3);

            _UIBuilder.dataFieldEditor(fields, (name, idx, dataSet) => {
                let curIndex = select.selectedIndex;
                let curGroup = resultVariables[curIndex];

                // Check to see if already exists; if so -- we cancel the change...
                for (let i=0;i<resultVariables.length;i++) {
                    if (resultVariables[i].dataSet === dataSet && resultVariables[i].name === name) {
                        return;
                    }
                }

                if (dataSet !== curGroup.dataSet) {
                    resultVariables.splice(curIndex, 1);
                    curGroup.dataSet = dataSet;
                    curGroup.name = name;
                    let curOptGroup = tempOptGroups[dataSet];
                    // Move to very top
                    if (dataSet === 0 && curOptGroup.children === 0) {
                        resultVariables.unshift(curGroup);
                    }
                    /// Move to Very bottom
                    else if (dataSet === tempOptGroups.length-1) {
                        resultVariables.push(curGroup);
                    } else {
                        let offset = 0;
                        for (let i=0;i<resultVariables.length;i++) {
                            if (resultVariables[i].dataSet <= dataSet) { offset = i; }
                        }
                        if (offset === 0) {
                            resultVariables.unshift(curGroup);
                        } else if (offset === resultVariables.length-1) {
                            resultVariables.push(curGroup);
                        } else {
                            let temp = resultVariables.splice(0, offset);
                            temp.push(curGroup);
                            resultVariables = temp.concat(resultVariables);
                        }
                    }
                } else {
                    resultVariables[curIndex].name = name;
                }
                rebuildGroups();
            });
        });

        // Delete
        addButtons[2].addEventListener("click", () => {
            if (select.selectedIndex >= 0) {
                resultVariables.splice(select.selectedIndex, 1);
                rebuildGroups();
            }
        });



        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Group data by", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(resultVariables);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static createToolbarButton(txt, hover, fn) {
        const btn = document.createElement("a");
        btn.text = txt;
        btn.className = "frIcon frIconMenu";
        btn.title = hover;
        btn.addEventListener("click", fn);
        return btn;
    }

    static createSpacer() {
        const spacer = document.createElement('span');
        spacer.className = "frIconSpacer";
        return spacer;
    }

    static sectionBrowse(report, reportData, ok, cancel) {
        const body = document.createElement('div');
        const span = document.createElement('span');
        span.innerText = "Sections:";
        body.appendChild(span);
        body.appendChild(document.createElement('br'));
        const elements = {Report: {}};

        const LI = (value, parent) => {
            let li = document.createElement("li");
            let span = document.createElement("div");
            span.innerHTML = value;
            li.appendChild(span);
            parent.appendChild(li);
            return li;
        };

        const A = (value, parent, elementKey, tracking) => {
             let a = document.createElement("a");
             a.addEventListener("click", () => {
                 if (value === "(delete)") {
                     tracking[elementKey].style.display = "none";
                     tracking["add" + elementKey].style.display = "";
                     tracking.Report[elementKey] = false;
                 } else {
                     tracking[elementKey].style.display = "";
                     tracking["add" + elementKey].style.display = "none";
                     tracking.Report[elementKey] = true;
                 }
             });
             a.style.marginLeft = "10px";
             a.style.cursor = "pointer";
             a.innerHTML = value;
             if (parent instanceof HTMLLIElement) {
                 parent.children[0].appendChild(a);
             } else {
                 parent.appendChild(a);
             }
             return a;
        };

        const createSection = (title, elementKey, parent, tracking, reportData) => {
            tracking[elementKey] = LI(title, parent);
            A("(delete)", tracking[elementKey], elementKey, tracking);
            if (reportData[elementKey]) {
                tracking.Report[elementKey] = true;
                tracking[elementKey].style.display = "";
                tracking["add"+elementKey].style.display = "none";
            } else {
                tracking.Report[elementKey] = false;
                tracking[elementKey].style.display = "none";
                tracking["add"+elementKey].style.display = "";
            }
        };

        const buildGroupings = (reportData, tracking, parent) => {
            tracking.groupBy = [];
            const finish = [];
            for (let i = 0; i < reportData.groupBy.length; i++) {
                let gbk = {name: reportData.groupBy[i].groupOn, Report: {}};
                let pd = LI("Group on <b>" + gbk.name+"</b>", parent);
                tracking.groupBy.push(gbk);
                gbk.addheader = A("(Add Header)", pd, "header", gbk);
                gbk.adddetail = A("(Add Detail)", pd, "detail", gbk);
                gbk.addfooter = A("(Add Footer)", pd, "footer", gbk);
                let ndg = document.createElement("ul");
                pd.appendChild(ndg);
                createSection("Header", "header", ndg, gbk, reportData.groupBy[i]);
                createSection("Detail: <b>"+gbk.name+"</b>", "detail", ndg, gbk, reportData.groupBy[i]);
                finish.push({title: "Footer", key: "footer", parent: ndg, data: gbk, report: reportData.groupBy[i]});
//                createSection("Footer", "footer", ndg, gbk, reportData.groupBy[i]);
            }
            return finish;
        };


        const finishFooters = (finish) => {
            if (!finish || finish.length === 0) { return; }
            for (let i=0;i<finish.length;i++) {
                createSection(finish[i].title, finish[i].key, finish[i].parent, finish[i].data, finish[i].report);
            }
        };

        const buildSubReport = (reportData, tracking, parent) => {
            let rbk = {name: reportData.data, Report: {}};
            tracking.subReport = rbk;
            let pd = LI("SubReport: <b>"+rbk.name+"</b>", parent);
            rbk.addheader = A("(Add Header)", pd, "header", rbk);
            rbk.adddetail = A("(Add Detail)", pd, "detail", rbk);
            rbk.addfooter = A("(Add Footer)", pd, "footer", rbk);
            let ndg = document.createElement("ul");
            pd.appendChild(ndg);
            createSection("Header", "header", ndg, rbk, reportData);

            let finish;
            if (reportData.groupBy) {
                finish = buildGroupings(reportData, rbk, ndg);
            }
            createSection( "Detail: <b>"+rbk.name+"</b>", "detail", ndg, rbk, reportData);
            finishFooters(finish);

            createSection( "Footer", "footer", ndg, rbk, reportData);
        };




        let group = document.createElement("ul");
        let pd = LI("Primary Report/Data", group);
        elements.addtitleHeader = A("(Add Title Header)", pd, "titleHeader", elements);
        elements.addpageHeader = A("(Add Page Header)", pd, "pageHeader", elements);
        elements.adddetail = A("(Add Detail)", pd, "detail", elements);
        elements.addpageFooter = A( "(Add Page Footer)", pd, "pageFooter", elements);
        elements.addfinalSummary = A("(Add Final Summary)", pd, "finalSummary", elements);

        let pdg = document.createElement("ul");
        pd.appendChild(pdg);

        createSection("Title Header", "titleHeader", pdg, elements, reportData);
        createSection( "Page Header", "pageHeader", pdg, elements, reportData);
        let finish;
        if (reportData.groupBy) {
            finish = buildGroupings(reportData, elements, pdg);
        }
        createSection( "Page Details", "detail", pdg, elements, reportData);

        if (reportData.subReport) {
            buildSubReport(reportData.subReport, elements, pdg);
        }
        finishFooters(finish);

        createSection("Page Footer", "pageFooter", pdg, elements, reportData);
        createSection( "Final Summary", "finalSummary", pdg, elements, reportData);

        body.appendChild(group);

        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Sections", body);

        const rebuildReportSection = (reportInfo, data) => {
              for (let key in reportInfo) {
                  if (!reportInfo.hasOwnProperty(key)) { continue; }
                  if (reportInfo[key] === true) {
                      if (typeof data[key] === 'undefined') {
                          data[key] = [];
                      }
                  } else {
                      if (typeof data[key] !== 'undefined') {
                          delete data[key];
                      }
                  }
              }
        };

        const rebuildReport = (tracking, reportData) => {
            rebuildReportSection(tracking.Report, reportData);
            if (tracking.groupBy) {
                for (let i = 0; i < tracking.groupBy.length; i++) {
                    let found = false;
                    for (let j = 0; j < reportData.groupBy.length; j++) {
                        if (reportData.groupBy[j].groupOn === tracking.groupBy[i].name) {
                            found = true;
                            rebuildReportSection(tracking.groupBy[i].Report, reportData.groupBy[j]);
                        }
                    }
                    if (!found) {
                        console.log("Didn't find group", tracking.groupBy[i].name);
                    }
                }
            }
            if (tracking.subReport) {
                rebuildReport(tracking.subReport, reportData.subReport);
            }
        };


        buttons[0].addEventListener('click', () => {
            d.hide();
            rebuildReport(elements, reportData);

            if (typeof ok === 'function') {
                ok(reportData);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });


    }

    static bandBrowse(report, bands, ok, cancel) {
        const body = document.createElement('div');
        const span = document.createElement('span');
        let currentBand = null;
        span.innerText = "Band Columns:";
        body.appendChild(span);
        body.appendChild(document.createElement('br'));
        const selectDiv = document.createElement('div');

        const select = document.createElement('select');
        select.style.border = "solid black 1px";
        select.style.margin = "5px";
        select.style.left = "5px";
        select.style.right = "5px";
        select.style.height = "200px";
        select.style.width = "200px";
        select.size = 10;
        let resultVariables = [];

        for (let i = 0; i < bands.length; i++) {
            resultVariables.push(shallowClone(bands[i]));
        }

        // Generates the Dynamic Alignment Select
        const createAlignSelect = () => {
            const curAlign = resultVariables[select.selectedIndex].align;
            let selectGroup = document.createElement('select');

            let item = new Option("Left", "1");
            if (curAlign === "1" || curAlign === 1) { item.selected = true; }
            selectGroup.appendChild(item);

            item = new Option("Right", "3");
            if (curAlign === "3" || curAlign === 3) { item.selected = true; }
            selectGroup.appendChild(item);

            item = new Option("Center", "2");
            if (curAlign === "2" || curAlign === 2) { item.selected = true; }
            selectGroup.appendChild(item);

            return selectGroup;
        };


        const properties = [
            {type: 'number', field: "width"},
            {type: 'select', field: "align", default: 0, display: createAlignSelect},
            {type: 'string', field: "textColor", default: "", functionable: true}
        ];


        selectDiv.appendChild(select);
        selectDiv.style.display = 'inline-block';
        body.appendChild(selectDiv);

        const valueDiv = document.createElement('div');
        valueDiv.margin = "5px";
        valueDiv.style.display = "inline-block";
        valueDiv.style.border = "solid black 1px";
        valueDiv.style.height = "200px";
        valueDiv.style.width = "200px";
        valueDiv.style.overflowX = "hidden";
        valueDiv.style.overflowY = "scroll";
        valueDiv.style.position = "relative";

        const propDiv = document.createElement('div');
        propDiv.style.width = "200px";

        valueDiv.appendChild(propDiv);

        select.addEventListener("change", () => {
            if (select.selectedIndex < 0) { return; }
            currentBand = resultVariables[select.selectedIndex];
            _UIBuilder.showProperties(currentBand, propDiv, true, properties);
        });


        const rebuildOptions = () => {
            while(select.children.length) {
                select.removeChild(select.children[0]);
            }
            for (let i=0;i<resultVariables.length;i++) {
                let option;
                if (typeof resultVariables[i].text !== 'undefined') {
                    option = new Option("TEXT - " + resultVariables[i].text, i.toString());
                } else if (typeof resultVariables[i].field !== 'undefined') {
                    option = new Option("FIELD - " + resultVariables[i].field, i.toString());
                } else if (typeof resultVariables[i].total !== 'undefined') {
                    option = new Option("TOTAL - " + resultVariables[i].total, i.toString());
                } else if (typeof resultVariables[i].calculation !== 'undefined') {
                    option = new Option("CALC - " + resultVariables[i].calculation, i.toString());
                } else if (typeof resultVariables[i].variable !== 'undefined') {
                    option = new Option( "VAR - " + resultVariables[i].variable, i.toString());
                } else if (resultVariables[i].function) {
                    option = new Option("FUNC - " + (resultVariables[i].function.name || "function"), i.toString());
                } else {
                    console.log("Unknown BAND type in bandBrowse", resultVariables[i]);
                }
                if (option) {
                    select.appendChild(option);
                }
            }
            _UIBuilder.clearArea(propDiv);
        };
        rebuildOptions();



        let addButtons = _UIBuilder.createButtons(["Add", "Edit", "Delete", "\uE83B", "\uE83C"], {width: "100px", marginTop: "5px"});
        let addBtnContainer = document.createElement('div');
        addBtnContainer.style.padding = "5px";
        addBtnContainer.style.display = 'inline-block';
        addBtnContainer.style.verticalAlign = "top";

        // Add Up/Down
        addButtons[3].style.width = "47px";
        addButtons[4].style.width = "47px";
        addBtnContainer.appendChild(addButtons[3]);
        addBtnContainer.appendChild(addButtons[4]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(document.createElement('br'));

        addBtnContainer.appendChild(addButtons[0]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[1]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[2]);

        body.appendChild(addBtnContainer);
        body.appendChild(valueDiv);

        // Move Up
        addButtons[3].addEventListener("click", () => {
            if (select.selectedIndex <= 0) { return; }
            let idx = select.selectedIndex;
            let currentBand = resultVariables.splice(idx, 1);
            if (idx-1 === 0) {
                resultVariables.unshift(currentBand[0]);
            } else {
                let temp = resultVariables.splice(0, idx-1);
                temp.push(currentBand[0]);
                resultVariables = temp.concat(resultVariables);
            }
            rebuildOptions();
        });

        // Move Down
        addButtons[4].addEventListener("click", () => {
            if (select.selectedIndex < 0) {
                return;
            }
            if (select.selectedIndex >= bands.length - 1) {
                return;
            }
            let idx = select.selectedIndex;
            let currentBand = resultVariables.splice(idx, 1);
            let temp = resultVariables.splice(0, idx + 1);
            temp.push(currentBand[0]);
            resultVariables = temp.concat(resultVariables);
            rebuildOptions();
        });


        // Add
        addButtons[0].addEventListener("click", () => {
            _UIBuilder.bandValueEditor(report, {text: "", type:"text", width: 100}, (value) => {
                    resultVariables.push(value);
                    rebuildOptions();
            });
        });

        // Edit
        addButtons[1].addEventListener("click", () => {
            if (select.selectedIndex < 0) { return; }
            _UIBuilder.bandValueEditor(report, resultVariables[select.selectedIndex], (value) => {
                resultVariables[select.selectedIndex] = value;
                rebuildOptions();
            });
        });

        // Delete
        addButtons[2].addEventListener("click", () => {
            if (select.selectedIndex >= 0) {
                resultVariables.splice(select.selectedIndex, 1);
                rebuildOptions();
            }
        });


        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Bands", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(resultVariables);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static bandValueEditor(report, fields, ok, cancel) {

        // Figure out Band type...
        let field = null, isTotal = false;
        if (typeof fields.text !== "undefined") {
            field = "text";
        } else if (fields.function) {
            field = "function";
        } else if (fields.field) {
            field = fields.field;
        } else if (fields.variable) {
            field = fields.variable;
        } else if (fields.calculation) {
            field = fields.calculation;
        } else if (fields.total) {
            field = fields.total;
            isTotal = true;
        }
        let select = _UIBuilder.createDataSelect(report, field, 63, isTotal);
        let newField =  shallowClone(fields);
        if (newField.function) {
            newField.function = shallowClone(fields.function);
        }

        const body = document.createElement('div');
        const title = document.createElement("span");
        title.style.marginLeft = "5px";
        title.innerText = "Band cell value:";
        body.appendChild(title);
        body.appendChild(select);
        body.appendChild(document.createElement('br'));

        const textSpan = document.createElement('span');
        textSpan.innerText = "Text value:";
        textSpan.style.marginLeft = "5px";
        textSpan.style.display = "none";
        body.appendChild(textSpan);

        const textInput = document.createElement('input');
        textInput.type = "input";
        textInput.style.display = "none";
        textInput.addEventListener("change", () => {
            newField.text = textInput.value;
        });
        body.appendChild(textInput);

        const functionButton = _UIBuilder.createButtons(["Edit Function"])[0];
        functionButton.style.display = "none";
        functionButton.style.marginLeft = "5px";
        functionButton.addEventListener("click", () => {
            _UIBuilder.functionEditor(newField.function.function || '', newField.function.name, newField.function.async, newField.function.skip,
                (value, name, isAsync, skipped) => {
                    let obj = {};
                    if (isAsync != null) {
                        newField.function.async = isAsync;
                    }
                    if (skipped != null) {
                        newField.function.skip = skipped;
                    }
                    obj.type = 'function';
                    newField.function.name = name;
                    newField.function.function = value;
                });
        });
        body.appendChild(functionButton);
        body.appendChild(document.createElement('br'));


        const setupSubFields = () => {
            if (select.selectedIndex < 0) { return; }
            let option = select.selectedOptions[0];
            if (select.selectedIndex === 0) {
                textSpan.style.display = "";
                textInput.style.display = "";
                functionButton.style.display = "none";
                if (typeof newField.text === 'undefined') {
                    newField.text = "";
                }
                textInput.value = newField.text;
            } else if (select.selectedIndex === 1) {
                textSpan.style.display = "none";
                textInput.style.display = "none";
                functionButton.style.display = "";
                if (typeof newField.function === 'undefined') {
                    newField.function = {type: "function", async: false, function: "", name: "Band Function" };
                }
            } else {
                textSpan.style.display = "none";
                textInput.style.display = "none";
                functionButton.style.display = "none";
                if (typeof option.dataSet !== 'undefined') {
                    // TODO - Future; check to see where the band is located; we could auto-set 'field' to 'parentData'
                    newField.field = select.value;
                 } else {
                    // Variables
                    if (option.tag === 4) {
                        newField.variable = select.value;
                    }
                    // Calculations
                    else if (option.tag === 8) {
                        newField.calculation = select.value;
                    }
                    // Totals
                    else if (option.tag === 16) {
                        newField.total = select.value;
                    }
                 }

            }
        };
        setupSubFields();

        select.addEventListener("change", setupSubFields);

        const buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Band Editor", body);

        // Ok Button
        buttons[0].addEventListener('click', () => {
            d.hide();
            const option = select.selectedOptions[0];
            switch (option.tag) {
                case 1:
                case 2: // Data
                    delete newField.function;
                    delete newField.calculation;
                    delete newField.variable;
                    delete newField.text;
                    delete newField.total;
                    break;

                case 4: // Variables
                    delete newField.function;
                    delete newField.calculation;
                    delete newField.text;
                    delete newField.total;
                    delete newField.field;
                    break;

                case 8: // Calc
                    delete newField.function;
                    delete newField.text;
                    delete newField.total;
                    delete newField.field;
                    delete newField.variable;
                    break;

                case 16:
                    delete newField.function;
                    delete newField.text;
                    delete newField.field;
                    delete newField.variable;
                    delete newField.calculation;
                    break;

                case 32:
                    delete newField.field;
                    delete newField.variable;
                    delete newField.calculation;
                    if (select.selectedIndex === 0) {
                        delete newField.function;
                    } else {
                        delete newField.text;
                    }
                    break;
            }

            if (typeof ok === 'function') {
                ok(newField);
            }
        });
        // Cancel Button
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });

    }

    static TotalsBrowse(totals, report, ok, cancel) {
        const body = document.createElement('div');
        const span = document.createElement('span');
        span.innerText = "Totals:";
        body.appendChild(span);
        body.appendChild(document.createElement('br'));
        const selectDiv = document.createElement('div');

        const select = document.createElement('select');
        select.style.border = "solid black 1px";
        select.style.margin = "5px";
        select.style.left = "5px";
        select.style.right = "5px";
        select.style.height = "200px";
        select.style.width = "200px";
        select.size = 10;
        const resultVariables = {average: [], count:[], min:[], max:[], sum: []};
        const groups = {sum: null, average: null, count: null, min: null, max: null};

        for (let key in resultVariables) { // jshint ignore:line
            if (!resultVariables.hasOwnProperty(key)) {
                console.log("Error: Total type was not found in results", key);
                continue;
            }
            const group = document.createElement("optgroup");
            group.label = key;
            groups[key] = group;
            select.appendChild(group);
            if (!totals.hasOwnProperty(key)) { continue; }

            for (let i=0;i<totals[key].length;i++) {
                const option = new Option(totals[key][i]);
                group.appendChild(option);
                // Copy variables
                resultVariables[key].push(totals[key][i]);
            }

        }

        selectDiv.appendChild(select);
        selectDiv.style.display = 'inline-block';
        body.appendChild(selectDiv);

        let addButtons = _UIBuilder.createButtons(["Add", "Edit", "Delete"], {width: "100px", marginTop: "5px"});
        let addBtnContainer = document.createElement('div');
        //addBtnContainer.style.display = ''
        addBtnContainer.style.padding = "5px";
        addBtnContainer.style.display = 'inline-block';
        addBtnContainer.style.verticalAlign = "top";
        addBtnContainer.appendChild(addButtons[0]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[1]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[2]);
        body.appendChild(addBtnContainer);


        // Add
        addButtons[0].addEventListener("click", () => {
            _UIBuilder.totalFieldEditor(report, "", "sum", (name, type) => {
                if (name != null && name !== '') {

                    // Check to see if total in type already exists
                    if (resultVariables[type].indexOf(name) >= 0) { return; }

                    // Add new Total
                    groups[type].appendChild(new Option(name));
                    resultVariables[type].push(name);
                }
            });
        });

        // Edit
        addButtons[1].addEventListener("click", () => {
            if (select.selectedIndex < 0) { return; }

            let value = select.value, type = "sum", counter=-1;
            for (let key in resultVariables) {
                if (!resultVariables.hasOwnProperty(key)) { continue; }
                counter += resultVariables[key].length;
                if (select.selectedIndex <= counter) {
                    type = key; break;
                }
            }
            _UIBuilder.totalFieldEditor(report, value, type, (name, newType) => {
               if (name == null || name === '') { return; }

               // Find old index location
               const idx = resultVariables[type].indexOf(value);
               if (name !== value) {
                    resultVariables[type][idx] = name;
                    select.options[select.selectedIndex].text = name;
                }
                if (type !== newType) {
                    let option = select.options[select.selectedIndex];
                    groups[type].removeChild(option);
                    resultVariables[type].splice(idx, 1);

                    // Don't re-add existing totals, basically act like we merged them.
                    if (resultVariables[newType].indexOf(name) < 0) {
                        groups[newType].appendChild(option);
                        resultVariables[newType].push(name);
                    }
                } else {
                    resultVariables[type][idx] = name;
                }
            });
        });

        // Delete
        addButtons[2].addEventListener("click", () => {
            let type = "sum", counter = -1;
            if (select.selectedIndex < 0) {
                return;
            }

            for (let key in resultVariables) {
                if (!resultVariables.hasOwnProperty(key)) {
                    continue;
                }
                counter += resultVariables[key].length;
                if (select.selectedIndex <= counter) {
                    type = key;
                    break;
                }
            }

            const idx = resultVariables[type].indexOf(select.value);
            resultVariables[type].splice(idx, 1);
            select.options[select.selectedIndex] = null;
        });



        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Totals", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(resultVariables);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static totalFieldEditor(report, selected, type, ok, cancel) {

        let types = ["sum", "average", "count", "min", "max"];

        const body = document.createElement('div');
        body.style.marginBottom = "5px";

        let title = document.createElement("span");
        title.style.marginLeft = "5px";
        title.innerText = "Total type ";
        body.appendChild(title);
        const selectType = document.createElement("select");
        for (let i=0;i<types.length;i++) {
            let option = new Option(types[i]);
            if (types[i] === type) {
                option.selected = true;
            }
            selectType.appendChild(option);
        }

        body.appendChild(selectType);


        title = document.createElement("span");
        title.innerText = " on field ";
        body.appendChild(title);
        const select = _UIBuilder.createDataSelect(report, selected, 3);
        body.appendChild(select);



        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Total Field", body);

        // Ok Button
        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(select.value, selectType.value);
            }
        });
        // Cancel Button
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });

    }

    static dataFieldEditor(fields, ok, cancel) {
        const body = document.createElement('div');
        const title = document.createElement("span");
        title.style.marginLeft = "5px";
        title.innerText = "Choose your Data field:";
        body.appendChild(title);
        const select = fields;
        body.appendChild(select);
        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Choose DataField", body);

        // Ok Button
        buttons[0].addEventListener('click', () => {
            d.hide();
            const option = select.selectedOptions[0];
            if (typeof ok === 'function') {
                ok(select.value, option.tag, option.dataSet);
            }
        });
        // Cancel Button
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });

    }

    static functionBrowse(functions, ok, cancel) {
        const body = document.createElement('div');
        const span = document.createElement('span');
        span.innerText = "Functions:";
        body.appendChild(span);
        body.appendChild(document.createElement('br'));
        const selectDiv = document.createElement('div');


        const select = document.createElement('select');
        select.style.border = "solid black 1px";
        select.style.margin = "5px";
        select.style.left = "5px";
        select.style.right = "5px";
        select.style.height = "200px";
        select.style.width = "200px";
        select.size = 10;
        const resultFunctions = [];

        for (let i=0;i<functions.length;i++) {
            let temp = shallowClone(functions[i]);
            resultFunctions.push(temp);
            const option = new Option(functions[i].name, i.toString());
            select.appendChild(option);
        }

        selectDiv.appendChild(select);
        selectDiv.style.display = 'inline-block';
        body.appendChild(selectDiv);

        let addButtons = _UIBuilder.createButtons(["Add", "Edit", "Delete"], {width: "100px", marginTop: "5px"});
        let addBtnContainer = document.createElement('div');
        //addBtnContainer.style.display = ''
        addBtnContainer.style.padding = "5px";
        addBtnContainer.style.display = 'inline-block';
        addBtnContainer.style.verticalAlign = "top";
        addBtnContainer.appendChild(addButtons[0]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[1]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[2]);
        body.appendChild(addBtnContainer);

        // Add
        addButtons[0].addEventListener("click", () => {
            _UIBuilder.functionEditor("", "", false, false, (value, name, isAsync, skipped) => {
                let obj = {};
                if (isAsync != null) {
                    obj.async = isAsync;
                }
                if (skipped != null) {
                    obj.skip = skipped;
                }
                obj.type = 'function';
                obj.name = name;
                obj.function = value;
                select.appendChild(new Option(name, resultFunctions.length.toString()));
                resultFunctions.push(obj);
            });
        });


        // Edit
        addButtons[1].addEventListener("click", () => {
            let obj = resultFunctions[select.value];
            _UIBuilder.functionEditor(obj.function, obj.name, obj.async || false, obj.skip || false, (value, name, isAsync, skipped) => {
                if (isAsync != null) {
                    obj.async = isAsync;
                }
                if (skipped != null) {
                    obj.skip = skipped;
                }
                if (name !== obj.name) {
                    select.options[select.selectedIndex].text = name;
                }
                obj.name = name;
                obj.function = value;
            });
        });

        // Delete
        addButtons[2].addEventListener("click", () => {
            if (select.selectedIndex >= 0) {
                let key = select.value;
                resultFunctions[key] = null;
                select.options[select.selectedIndex] = null;
            }
        });



        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Functions", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            for (let i=0;i<resultFunctions.length;i++) {
                if (resultFunctions[i] === null) {
                    resultFunctions.splice(i, 1);
                    i--;
                }
            }

            if (typeof ok === 'function') {
                ok(resultFunctions);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static functionEditor(source, name, async, disabled, ok, cancel) {
        const body = document.createElement('div');
        const functionText = document.createElement('span');
        if (async) {
            functionText.innerText = "function (report, data, state, vars, done) {";
        } else {
            functionText.innerText = "function (report, data, state, vars) {";
        }
        body.appendChild(functionText);
        body.appendChild(document.createElement("br"));
        const textArea = document.createElement('textarea');
        textArea.style.border = "solid black 1px";
        textArea.style.margin = "5px";
        textArea.style.marginLeft = "15px";
        textArea.style.height = "200px";
        textArea.style.width = "475px";
        textArea.style.maxWidth = "475px";
        textArea.value = source;
        let asyncCheckbox, skipCheckbox, nameValue;
        if (name != null) {
            const label = document.createElement('div');
            const span = document.createElement('span');
            span.innerText = "Name: ";
            label.appendChild(span);
            nameValue = document.createElement('input');
            nameValue.value = name;
            label.appendChild(nameValue);
            body.appendChild(label);
        }
        // Add Text Area
        body.appendChild(textArea);
        body.appendChild(document.createElement("br"));
        const closeBracket = document.createElement('span');
        closeBracket.innerText = "}";
        body.appendChild(closeBracket);

        if (async != null) {
            const label = document.createElement('div');
            const span = document.createElement('span');
            span.innerText = "Async Function:";
            label.appendChild(span);
            asyncCheckbox = document.createElement('input');
            asyncCheckbox.type = 'checkbox';
            if (async) { asyncCheckbox.checked = true; }
            asyncCheckbox.addEventListener('change', () => {
                if (asyncCheckbox.checked) {
                    functionText.innerText = "function (report, data, state, vars, done) {";
                } else {
                    functionText.innerText = "function (report, data, state, vars) {";
                }
            });

            label.appendChild(asyncCheckbox);
            body.appendChild(label);
        }
        if (disabled != null) {
            const label = document.createElement('div');
            const span = document.createElement('span');
            span.innerText = "Disable Function:";
            label.appendChild(span);
            skipCheckbox = document.createElement('input');
            skipCheckbox.type = 'checkbox';
            if (disabled) {
                skipCheckbox.checked = true;
            }
            label.appendChild(skipCheckbox);
            body.appendChild(label);
        }
        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Function Editor", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            let text = textArea.value;
            if (typeof ok === 'function') {
                if (async !== null && asyncCheckbox.checked) {
                      if (text.indexOf('done()') < 0) {
                          text += "; done();";
                      }
                }
                ok(text, nameValue ? nameValue.value : null, async == null ? null : asyncCheckbox.checked, disabled == null ? null : skipCheckbox.checked );
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static calculationBrowse(calculations, ok, cancel) {
        const body = document.createElement('div');
        const span = document.createElement('span');
        span.innerText = "Calculations:";
        body.appendChild(span);
        body.appendChild(document.createElement('br'));
        const selectDiv = document.createElement('div');

        const select = document.createElement('select');
        select.style.border = "solid black 1px";
        select.style.margin = "5px";
        select.style.left = "5px";
        select.style.right = "5px";
        select.style.height = "200px";
        select.style.width = "200px";
        select.size = 10;
        const resultFunctions = [];

        for (let i=0;i<calculations.length;i++) {
            let temp = shallowClone(calculations[i]);
            resultFunctions.push(temp);
            const option = new Option(calculations[i].name, i.toString());
            select.appendChild(option);
        }

        selectDiv.appendChild(select);
        selectDiv.style.display = 'inline-block';
        body.appendChild(selectDiv);

        let addButtons = _UIBuilder.createButtons(["Add", "Edit", "Delete"], {width: "100px", marginTop: "5px"});
        let addBtnContainer = document.createElement('div');
        //addBtnContainer.style.display = ''
        addBtnContainer.style.padding = "5px";
        addBtnContainer.style.display = 'inline-block';
        addBtnContainer.style.verticalAlign = "top";
        addBtnContainer.appendChild(addButtons[0]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[1]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[2]);
        body.appendChild(addBtnContainer);

        // Add
        addButtons[0].addEventListener("click", () => {
            _UIBuilder.calculationEditor("", "concat", [],  (name, op, fields) => {
                let obj = {};
                obj.type = 'calculation';
                obj.name = name;
                obj.fields = fields;
                obj.op = op;
                select.appendChild(new Option(name, resultFunctions.length.toString()));
                resultFunctions.push(obj);
            });
        });


        // Edit
        addButtons[1].addEventListener("click", () => {
            let obj = resultFunctions[select.value];
            _UIBuilder.calculationEditor(obj.name, obj.op, obj.fields, (name, op, fields) => {
                if (name !== obj.name) {
                    select.options[select.selectedIndex].text = name;
                }
                obj.name = name;
                obj.op = op;
                obj.fields = fields;
            });
        });

        // Delete
        addButtons[2].addEventListener("click", () => {
            if (select.selectedIndex >= 0) {
                let key = select.value;
                resultFunctions[key] = null;
                select.options[select.selectedIndex] = null;
            }
        });

        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Calculations", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            for (let i=0;i<resultFunctions.length;i++) {
                if (resultFunctions[i] === null) {
                    resultFunctions.splice(i, 1);
                    i--;
                }
            }

            if (typeof ok === 'function') {
                ok(resultFunctions);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static calculationEditor(name, op, fields, ok, cancel) {
        const body = document.createElement('div');
        let nameValue;

        // Handle Name
        let label = document.createElement('div');
        let span = document.createElement('span');
        span.innerText = "Name: ";
        label.appendChild(span);
        nameValue = document.createElement('input');
        nameValue.value = name;
        label.appendChild(nameValue);
        body.appendChild(label);

        // Handle the Operation
        label = document.createElement('div');
        span = document.createElement('span');
        span.innerText = "Operation: ";
        label.appendChild(span);

        const opValue = document.createElement('select');
        let options = ['concat', 'add', 'minus', 'multiply', 'divide'];
        for (let i = 0; i < options.length; i++) {
            // noinspection RedundantConditionalExpressionJS
            let isSelected = options[i] === op ? true : false;
            let opt = new Option(options[i], options[i], isSelected, isSelected);
            opValue.appendChild(opt);
        }
        label.appendChild(opValue);
        body.appendChild(label);

        const getOptionsTitle = function(resultFields) {
            if (resultFields.field) { return "Field: " + resultFields.field; }
            else if (resultFields.text) { return "Text: " + resultFields.text; }
            else if (resultFields.total) { return "Total: " + resultFields.total; }
            else if (resultFields.function) { return "Function: "+ resultFields.function.name; }
            return "Unknown";
        };


        label = document.createElement('div');
        label.style.display = "inline-flex";
        span = document.createElement('span');
        span.style.verticalAlign = "top";
        span.innerText = "Fields:";
        label.appendChild(span);
        const fieldSelect = document.createElement('select');
        fieldSelect.style.border = "solid black 1px";
        fieldSelect.style.margin = "5px";
        fieldSelect.style.left = "5px";
        fieldSelect.style.right = "5px";
        fieldSelect.style.height = "200px";
        fieldSelect.style.width = "200px";
        fieldSelect.size = 10;
        label.appendChild(fieldSelect);
        body.appendChild(label);

        const resultFields = [];
        for (let i=0;i<fields.length;i++) {
            let temp = shallowClone(fields[i]);
            if (fields[i].function) {
                temp.function = shallowClone(fields[i].function);
            }
            resultFields.push(temp);
            const option = new Option(getOptionsTitle(resultFields[i]), i.toString());
            fieldSelect.appendChild(option);
        }


        let addButtons = _UIBuilder.createButtons(["Add", "Edit", "Delete"], {width: "100px", marginTop: "5px"});
        let addBtnContainer = document.createElement('div');
        addBtnContainer.style.padding = "5px";
        addBtnContainer.style.display = 'inline-block';
        addBtnContainer.style.verticalAlign = "top";
        addBtnContainer.appendChild(addButtons[0]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[1]);
        addBtnContainer.appendChild(document.createElement('br'));
        addBtnContainer.appendChild(addButtons[2]);
        body.appendChild(addBtnContainer);



        addButtons[0].addEventListener("click", () => {
            _UIBuilder.calculationValueEditor("Text value", {text: ""}, (name, value) => {
                if (name != null && name !== '') {
                    if (!resultFields.hasOwnProperty(name)) {
                        fieldSelect.appendChild(new Option(name));
                    }
                    resultFields[name] = value;
                }
            });
        });

        // Edit
        addButtons[1].addEventListener("click", () => {
            let key = fieldSelect.value;
            _UIBuilder.calculationValueEditor(key, resultFields[key], (name, value) => {
                if (name !== key) {
                    delete resultFields[key];
                    fieldSelect.options[fieldSelect.selectedIndex].text = name;
                }
                //valueValue.innerText = value;
                resultFields[name] = value;
            });
        });

        // Delete
        addButtons[2].addEventListener("click", () => {
            if (fieldSelect.selectedIndex >= 0) {
                let key = fieldSelect.value;
                delete resultFields[key];
                fieldSelect.options[fieldSelect.selectedIndex] = null;
                //valueValue.innerText = '';
            }
        });




        // TODO: valid ops: concat, add, minus, multiply, divide
        // TODO: Fields, "Add Static", "Add Data Element", "Add Total", "Add Function"

        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Calculation Editor", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(nameValue.value, opValue.value, resultFields);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static calculationValueEditor(name, value, ok, cancel) {
        const body = document.createElement('div');

        const nameDiv = document.createElement('div');
        const name1 = document.createElement('span');
        name1.innerText = "Type:";


        const variableName = document.createElement('input');
        variableName.value = name;
        nameDiv.appendChild(name1);
        nameDiv.appendChild(variableName);
        body.appendChild(nameDiv);

        const valueDiv = document.createElement('div');
        const value1 = document.createElement('span');
        value1.innerText = "Variable value:";
        const variableValue = document.createElement('input');
        variableValue.value = value;
        valueDiv.appendChild(value1);
        valueDiv.appendChild(variableValue);
        body.appendChild(valueDiv);

        let buttons = _UIBuilder.createButtons(["Ok", "Cancel"]);
        let btnContainer = document.createElement('div');
        btnContainer.appendChild(buttons[0]);
        btnContainer.appendChild(buttons[1]);
        body.appendChild(btnContainer);

        let d = new Dialog("Value Editor", body);

        buttons[0].addEventListener('click', () => {
            d.hide();
            if (typeof ok === 'function') {
                ok(variableName.value, variableValue.value);
            }
        });
        buttons[1].addEventListener('click', () => {
            d.hide();
            if (typeof cancel === 'function') {
                cancel();
            }
        });
    }

    static createDataSelect(report, field=null, dataSets=31, isTotal = false) {
        const selectList = document.createElement("select");
        selectList.className = "frSelect";
        const fields = report.reportFields;

        if ((dataSets & 32) === 32) { // jshint ignore:line
            let group = document.createElement("optgroup");
            group.label = "Bands";
            selectList.appendChild(group);
            let option = new Option("Text");
            option.tag = 32;
            if (field === "text") {
                option.selected = true;
            }
            group.appendChild(option);

            selectList.appendChild(group);
            option = new Option("Function");
            option.tag = 32;
            if (field === "function") {
                option.selected = true;
            }
            group.appendChild(option);
        }

        if ((dataSets & 1) === 1) { // jshint ignore:line
            let group = document.createElement("optgroup");
            group.label = "Primary Data";
            selectList.appendChild(group);
            for (let i = 0; i < fields.primary.length; i++) {
                const option = new Option(fields.primary[i]);
                option.tag = 1;
                option.dataSet = 0;
                if (field === fields.primary[i] && isTotal !== true) {
                    option.selected = true;
                }
                group.appendChild(option);
            }


            if ((dataSets & 2) === 2) { // jshint ignore:line
                for (let i = 1; i <= fields.levels; i++) {
                    if (fields['level' + i].length > 0) {
                        group = document.createElement("optgroup");
                        group.label = fields.titles[i];
                        for (let j = 0; j < fields['level' + i].length; j++) {
                            const option = new Option(fields['level' + i][j]);
                            option.tag = 2;
                            option.dataSet = i;
                            if (field === fields['level' + i][j]  && isTotal !== true) {
                                option.selected = true;
                            }
                            group.appendChild(option);
                        }
                        selectList.appendChild(group);
                    }
                }
            }
        }

        if ((dataSets & 4) === 4) { // jshint ignore:line
            const variables = report.reportVariables;
            if (variables != null) {
                if (field === "-unset-") {
                    const option = new Option("-unset-");
                    option.tag = 4;
                    option.selected = true;
                    selectList.appendChild(option);
                }
                let group = document.createElement("optgroup");
                group.label = "- Variables -";
                let count = 0;
                for (let key in variables) {
                    if (!variables.hasOwnProperty(key)) {
                        continue;
                    }
                    count++;
                    const option = new Option(key);
                    option.tag = 4;
                    if (field === key && isTotal !== true) {
                        option.selected = true;
                    }

                    group.appendChild(option);
                }
                if (count) {
                    selectList.appendChild(group);
                }
            }
        }

        if ((dataSets & 8) === 8) { // jshint ignore:line
            const calculations = report.reportCalculations;
            if (calculations.length) {
                if (field === "-unset-") {
                    const option = new Option("-unset-");
                    option.tag = 8;
                    option.selected = true;
                    selectList.appendChild(option);
                }

                let group = document.createElement("optgroup");
                group.label = "- Calculations -";
                for (let i = 0; i < calculations.length; i++) {
                    const option = new Option(calculations[i]);
                    option.tag = 8;
                    if (field === calculations[i] && isTotal !== true) {
                        option.selected = true;
                    }
                    group.appendChild(option);
                }
                selectList.appendChild(group);
            }
        }

        if ((dataSets & 16) === 16) { // jshint ignore:line
            if (field === "-unset-") {
                const option = new Option("-unset-");
                option.tag = 16;
                option.selected = true;
                selectList.appendChild(option);
            }

            const totals = report.reportTotals;
            let totalTypes = ['sum', 'min', 'max', 'count', 'average'];
            for (let s = 0; s < totalTypes.length;s++) {
                if (totals[totalTypes[s]] && totals[totalTypes[s]].length) {
                    let group = document.createElement("optgroup");
                    group.label = "- total " + totalTypes[s] + " -";
                    for (let i = 0; i < totals[totalTypes[s]].length; i++) {

                        const option = new Option(totals[totalTypes[s]][i]);
                        option.tag = 16;
                        if (field === totals[totalTypes[s]][i]) {
                            option.selected = true;
                        }
                        group.appendChild(option);
                    }
                    selectList.appendChild(group);
                }

            }

        }

        return selectList;
    }

    static showProperties(obj, layout, refresh=false, overrideProps=null) {
        if (obj === layout.trackProperties) {
            if (refresh !== true) { return; }
        } else {
            // set refresh if we don't match type...
            refresh = true;
        }
        layout.trackCreated = [];
        if (refresh || obj == null) {
            _UIBuilder.clearArea(layout);
        }
        layout.trackProperties = obj;
        if (obj == null) { return; }

        let table = null;
        const tableCollection = layout.getElementsByClassName("frTableProps");
        if (tableCollection.length) {
            table = tableCollection[0];
        }
        if (!table) {
            table = document.createElement("table");
            table.id = "frTableProps";
        }

        if (!table.children.length) {
            let tr = table.insertRow(-1);
            let td = tr.insertCell(0);
            td.colSpan = 2;

            // TODO: Create list of all elements as a select list to select the element (Quick List at top of elements)
            let div = document.createElement('div');
            if (typeof obj.elementTitle !== 'undefined') {
                let span = document.createElement('span');
                div.appendChild(span);
                span.className = "frPropTitle";
                span.innerText = obj.elementTitle;
                table.className = "frTableProps";
            }
            td.appendChild(div);
            if (obj instanceof frElement) {
                let deleteIcon = document.createElement('span');
                deleteIcon.innerText = "\uE80B";
                deleteIcon.className = "frIcon";
                deleteIcon.style.position = "absolute";
                deleteIcon.style.right = "5px";
                deleteIcon.style.top = "3px";
                deleteIcon.addEventListener("click", () => {
                    obj.delete();
                });
                div.appendChild(deleteIcon);
            }

        }
        const props = overrideProps || obj.properties;
        _UIBuilder._handleShowProperties(props, obj, table, layout);
        layout.appendChild(table);

        // Might be able to scan the TR children
        let children = table.children[0].children;
        // Skip first row because it is our "Title" row....
        for (let i=1;i<children.length;i++) {
            if (layout.trackCreated.indexOf(children[i].id) < 0) {
                children[i].style.display = 'none';
            } else {
                children[i].style.display = '';
            }
        }


    }

    static _fixShowPropertyTitle(name) {
        // TODO: Split on Upper case to add spaces
        return name.charAt(0).toUpperCase()+name.slice(1).split(/(?=[A-Z])/).join(' ');
    }

    static _getShowPropertyId(prop, obj) {
        let name = 'fr_prop_';
        if (typeof prop === "string") {
            name += prop.replace(/\s/g, '');
        } else if (prop.title) {
            name += prop.title.replace(/\s/g, '');
        } else {
            name += prop.field.replace(/\s/g, '');
        }
        return name + "_"+obj.uuid;
    }

    static _handleShowProperties(props, obj, table, layout) {
        for (let i = 0; i < props.length; i++) {
            if (props[i] && props[i].skip === true) { continue; }
            let name = _UIBuilder._getShowPropertyId(props[i],obj);
            let tr = layout.querySelector("#"+name);
            if (!tr) {
                tr = table.insertRow(-1);
                tr.id = name;
            }

            _UIBuilder._handleShowProperty(props[i], obj, name, tr, layout);
        }
    }

    static _handleShowProperty(prop, obj, name, tr, layout) {
        layout.trackCreated.push(name);

        let td1, td2, created=true, value, input;
        if (tr.children.length) {
            if (tr.children.length === 1) {
                td1 = td2 = tr.children[0];
            } else {
                td1 = tr.children[0];
                td2 = tr.children[1];
            }
            input = td2.children[0];
            created = false;
            //return;
        } else {
            td1 = tr.insertCell(0);
            td2 = tr.insertCell(1);
        }

        if (typeof prop === "string") {
            console.error("Should not have any string properties", prop);
        } else {
            // COMPLEX Properties, full Objects passed in here
            if (prop.title || prop.field) {
                let lastProps = [];
                if (created) {
                    // Do we have proper type
                    if (prop.type) {
                        let propType = prop.type;
                        td1.innerText = _UIBuilder._fixShowPropertyTitle(prop.title || prop.field);
                        if (prop.field && obj[prop.field] && obj[prop.field].function) { propType = 'function'; }

                        switch (propType) {
                            case 'button':
                                input = document.createElement("input");
                                input.type = "button";
                                input.value = prop.title;
                                input.className = "frPropButton";
                                input.addEventListener("click", prop.click);
                                td2.appendChild(input);
                                td2.colSpan = 2;
                                td2.style.textAlign = "center";
                                tr.deleteCell(0);
                                break;

                            case 'selection':
                                const tempField = obj[prop.field];
                                input = document.createElement("select");
                                for (let i=0;i<prop.values.length;i++) {
                                    let opt = new Option(prop.values[i]);
                                    if (prop.values[i] === tempField) {
                                        opt.selected = true;
                                    }
                                    input.appendChild(opt);
                                }
                                input.id = name + "_select";
                                input.className = "frPropSelect";
                                input.addEventListener("change", () => {
                                    obj[prop.field] = input.value;
                                    if (prop.onchange) { prop.onchange(input.value); }
                                });
                                td2.appendChild(input);
                                break;

                            case 'select':
                                input = prop.display(prop);
                                input.id = name + "_select";
                                input.className = "frPropSelect";
                                input.addEventListener("change", () => {
                                    obj[prop.field] = input.value;
                                    if (prop.onchange) { prop.onchange(input.value); }
                                });
                                td2.appendChild(input);
                                break;

                            case 'display':
                                input = prop.display(prop);
                                td2.appendChild(input);
                                break;

                            case 'boolean':
                                input = document.createElement('input');
                                input.type = 'checkbox';
                                input.className = "frPropCheck";
                                input.addEventListener('change', () => {
                                    obj[prop.field] = input.checked;
                                });
                                td2.appendChild(input);
                                input.checked = !!obj[prop.field];
                                if (prop.functionable === true) {
                                    td2.appendChild(_UIBuilder._createFunctionSpan(obj, prop, layout));
                                }

                                break;

                            case 'string':
                            case 'number':
                                input = document.createElement('input');
                                input.type = typeof value === 'number' ? 'number' : 'input';
                                input.style.margin = "1px";
                                if (prop.functionable === true) {
                                    input.style.width = "calc(100% - 20px)";
                                } else {
                                    input.style.width = "98%";
                                }
                                input.className = "frPropInput";

                                input.addEventListener('input', () => {
                                    obj[prop.field] = input.value;
                                });

                                td2.appendChild(input);
                                if (prop.functionable === true) {
                                    td2.appendChild(_UIBuilder._createFunctionSpan(obj, prop, layout));
                                }
                                input.value = obj[prop.field] || "";
                                break;

                            case 'function':
                                input = document.createElement('span');
                                input.innerText = "{FUNC}";
                                input.className = "frPropFunction";
                                const innerSpan = document.createElement('span');
                                innerSpan.style.position = "absolute";
                                innerSpan.style.right = "20px";
                                innerSpan.className = "frIcon";
                                innerSpan.innerText = "\ue81f";
                                innerSpan.style.border = "solid black 1px";
                                innerSpan.style.backgroundColor = "#cacaca";
                                innerSpan.addEventListener("click", () => {
                                    _UIBuilder.functionEditor(obj[prop.field].function, null,null, null, (result) => {
                                        if (obj[prop.field].function !== result) {
                                            obj[prop.field].function = result;
                                        }
                                    });
                                });

                                const deleteSpan = document.createElement('span');
                                deleteSpan.style.position = "absolute";
                                deleteSpan.style.right = "4px";
                                deleteSpan.className = "frIcon";
                                deleteSpan.innerText = "\uE80B";
                                deleteSpan.style.border = "solid black 1px";
                                deleteSpan.style.backgroundColor = "#cacaca";
                                deleteSpan.addEventListener("click", () => {
                                    obj[prop.field] = '';
                                    _UIBuilder.showProperties(layout.trackProperties, layout, true);
                                });

                                input.appendChild(innerSpan);
                                input.appendChild(deleteSpan);
                                td2.appendChild(input);
                                break;


                            case 'totals':
                                // TODO: Totals???
                                console.log("TODO: totals in  _handleShowProperty");
                                break;


                            default:
                                console.log("fluentReports: Unknown properties type", prop.type);
                        }

                        // Additional sub-properties because of something changed
                        if (prop.properties) {
                            input.addEventListener('change', () => {
                                let p = prop.properties();
                                for (let i = 0; i < lastProps.length; i++) {
                                    if (p.indexOf(lastProps[i]) < 0) {
                                        let name = _UIBuilder._getShowPropertyId(lastProps[i], obj) + "_sub";
                                        let h = layout.querySelector("#" + name);
                                        if (h) {

                                            h.style.display = 'none';
                                        }
                                    }
                                }
                                if (p.length) {
                                    _UIBuilder._handleShowProperties(p, obj, tr.parentElement, layout);
                                }
                                lastProps = p;
                            });

                            // Check to see if any props need to be added when re-rebuild the layout...
                            let p = prop.properties();
                            if (p.length) {
                                _UIBuilder._handleShowProperties(p, obj, tr.parentElement, layout);
                            }
                            lastProps = p;
                        }
                    }
                } else {  // We are on the update path
                    if (prop.type) {
                        switch (prop.type) {
                            case "selection":
                            case "select":
                                input = layout.querySelector("#" + name + "_select");
                                if (input) {
                                    input.value = obj[prop.field];
                                } else {
                                    console.warn("fluentReports: unable to find ", name + "_select");
                                }
                                break;

                            case 'button': break;
                            case 'display': break;
                            case 'totals': break;
                            case 'boolean': break;
                            case 'string': break;
                            case 'number': break;
                            // These don't have anything to update...

                            default:
                                console.error("fluentReports: Missing update path for properties", prop.type, name);
                        }
                    }
                    if (prop.properties) {
                        let p = prop.properties();
                        if (p.length) {
                            _UIBuilder._handleShowProperties(p, obj, tr.parentElement, layout);
                        }
                        lastProps = p;
                    }
                }
            } else {
                console.error("fluentReports: Unknown property", prop);
            }
        }
    }

    static _createFunctionSpan(obj, prop, layout) {
        const functionSpan = document.createElement('span');
        functionSpan.style.position = "absolute";
        functionSpan.style.right = "4px";
        functionSpan.style.marginTop = "4px";
        functionSpan.className = "frIcon";
        functionSpan.innerText = "\ue81f";
        functionSpan.style.border = "solid black 1px";
        functionSpan.style.backgroundColor = "#cacaca";
        functionSpan.addEventListener("click", () => {
            _UIBuilder.functionEditor("return '"+obj[prop.field]+"';", null,null, null, (result) => {
                obj[prop.field] = {type: 'function', name: 'Function', function: result, async: false};
                _UIBuilder.showProperties(layout.trackProperties, layout, true);
            });
        });
        return functionSpan;
    }

    static createButtons(buttons, styles) {
        let results = [];
        for (let i=0;i<buttons.length;i++) {
            //const tempButton = document.createElement("input");
            const tempButton = document.createElement("button");
            tempButton.type = "button";
            tempButton.innerText = buttons[i];
            tempButton.className = "frIcon";
            tempButton.style.height = "30px";
            tempButton.style.marginRight = "5px";
            if (styles) {
                for (let key in styles) {
                    if (!styles.hasOwnProperty(key)) { continue; }
                    tempButton.style[key] = styles[key];
                }
            }

            //tempButton.style.verticalAlign = "center";
            results.push(tempButton);
        }
        return results;
    }

    /**
     * General function to remove all sub-children, used by many of the functions
     * @param ScreenDiv
     */
    static clearArea(ScreenDiv) { // jshint ignore:line
        // Could be faster by detaching the ScreenDiv; then deleting everything, and re-adding -- but at this point it isn't a big issue.
        while (ScreenDiv.firstElementChild) {
            ScreenDiv.removeChild(ScreenDiv.firstElementChild);
        }
    }
}

/**
 * Simple dialog Class
 */
class Dialog { // jshint ignore:line
    constructor(title, body) {
        if (title && body)  {
            this.show(title, body);
        }
    }

    hide() {
        Dialog.hide();
    }

    show(title, content) {
        Dialog.show(title, content);
    }

    static hide() {
        let dialogBackground = document.getElementById("frDialogBackground"+Dialog._dialogs);
        dialogBackground.style.display="none";
        let dialog = document.getElementById("frDialog"+Dialog._dialogs);
        dialog.style.display="none";
        // Do not do this: clearArea(dialog) - Clearing the dialog means the code following a hide has no access to the data the dialog contains...
        Dialog._dialogs--;
    }

    static show(title, content) {
        if (typeof Dialog._dialogs === 'undefined') {
            Dialog._dialogs = 0;
        }
        Dialog._dialogs++;

        let dialogBackground = document.getElementById("frDialogBackground"+Dialog._dialogs);
        if (!dialogBackground) {
            dialogBackground = document.createElement("div");
            dialogBackground.id = "frDialogBackground"+Dialog._dialogs;
            dialogBackground.style.position = "absolute";
            dialogBackground.style.left = "0px";
            dialogBackground.style.right = "0px";
            dialogBackground.style.top = "0px";
            dialogBackground.style.bottom = "0px";
            dialogBackground.style.backgroundColor = "#000000";
            dialogBackground.style.opacity = "0.7";
            // TODO: Might need to set ZINDEX?
            let tag = document.getElementsByTagName("body");
            tag[0].appendChild(dialogBackground);
        } else {
            dialogBackground.style.display='';
        }

        let dialog = document.getElementById('frDialog'+Dialog._dialogs);
        if (!dialog) {
            dialog = document.createElement("div");
            dialog.id = "frDialog"+Dialog._dialogs;
            dialog.className = "frDialog";
            dialog.style.position = "absolute";
            dialog.style.top = "50%";
            dialog.style.left = "50%";
//            dialog.style.width = content.style.width === "" ? content.style.width : "33%";
            dialog.style.minWidth = "300px";
            //dialog.style.transform = "translate(-50%, -50%);";
            dialog.style.backgroundColor = "#FFFFFF";
            dialog.style.border = "solid 2px black";
            let tag = document.getElementsByTagName("body");
            tag[0].appendChild(dialog);
        } else {
            dialog.style.display = '';
            _UIBuilder.clearArea(dialog);
        }
        let titleElement = document.createElement("div");
        titleElement.style.backgroundColor = "#aaaaaa";
        titleElement.style.textAlign = "center";
        titleElement.style.color = "#000000";
        titleElement.style.borderBottom = "1px solid black";
        titleElement.innerText = title;
        titleElement.style.marginBottom = "20px";
        dialog.appendChild(titleElement);
        let contentElement = document.createElement("div");
        contentElement.style.padding = "5px";
        dialog.appendChild(contentElement);
        if (content instanceof HTMLElement) {
            contentElement.appendChild(content);
        } else {
            contentElement.innerHTML = content;
        }
    }

    static notice(data, color) {
        let notice = document.getElementById("notice");
        if (!notice) {
            if (data === false) { return; }
            notice = document.createElement('div');
            notice.id = 'notice';
            notice.style.background = '#A00';
            notice.style.textAlign = 'center';
            notice.style.position = 'fixed';
            notice.style.left = '0';
            notice.style.right = '0';
            notice.style.top = "0px";
            notice.style.color = '#FFF';
            this._frame.appendChild(notice);
        }
        if (this._noticeId !== null) {
            clearTimeout(this._noticeId);
            this._noticeId = null;
        }

        if (data === false) {
            notice.style.display = 'none';
            return;
        }
        if (color !== null && color !== undefined) {
            notice.style.background = color;
        } else if (notice.style.background !== '#A00') {
            notice.style.background = '#A00';
        }
        notice.style.display = '';
        notice.innerHTML = data;
        this._noticeId = setTimeout(() => {
            notice.style.display = 'none';
            this._noticeId = null;
        }, 7000);
    }
}

/**
 * Simple helper function to do shallow clones
 * @param value
 * @param skipValues
 */
function shallowClone(value, skipValues=[]) { // jshint ignore:line
    let result = {};
    for (let key in value) {
        if (!value.hasOwnProperty(key)) { continue; }
        if (skipValues.indexOf(key) >= 0) { continue; }
        result[key] = value[key];
    }
    return result;
}

window.FluentReportsGenerator = FluentReportsGenerator;