/*
 --------------------------------------
 (c)2012-2013, Kellpro, Inc.
 --------------------------------------
 FluentReport is under The MIT License (MIT)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

(function (_global) {


    "use strict";

// Layout:
    /*
     Report ->
     Section ->
     DataSet ->
     Group   ->

     (Optional) DataSet (or Sub-Report) ->
     Group  ->
     ...
     */

// ------------------------------------------------------
// Helper Functions
// ------------------------------------------------------

    /**
     * Gets a setting from a setting collection, checks for the normal case; and then a lower case version
     * @param settingsObject
     * @param setting
     * @param defaultValue
     * @return {*} defaultValue if no setting exists
     */
    function getSettings(settingsObject, setting, defaultValue) {
        if (!settingsObject) {
            return (defaultValue);
        }
        if (settingsObject[setting]) {
            return settingsObject[setting];
        } else {
            var lsetting = setting.toLowerCase();
            if (settingsObject[lsetting]) {
                return settingsObject[lsetting];
            }
        }
        return defaultValue;
    }


    /**
     * Lowercases all the function names in the collection
     * @param prototype
     */
    function lowerPrototypes(prototype) {
        var proto, lowerProto;
        for (proto in prototype) {
            if (prototype.hasOwnProperty(proto)) {
                lowerProto = proto.toLowerCase();
                if (lowerProto === proto) {
                    continue;
                }
                if (typeof prototype[proto] === "function") {
                    prototype[lowerProto] = prototype[proto];
                }
            }
        }
    }

    /** Debug Code **/
    function printStructure(reportObject, level) {
        if (reportObject === null) {
            return;
        }
        var i, j, added = (2 * level), pad = "", spad = '';
        for (i = 0; i < added; i++) {
            pad += "-";
            spad += " ";
        }

        if (reportObject._isReport) {
            console.log(pad + "> Report");
        } else if (reportObject._isSection) {
            console.log(pad + "> Section");
        } else if (reportObject._isDataSet) {
            console.log(pad + "> DataSet");
        } else if (reportObject._isGroup) {
            console.log(pad + "> Group = " + reportObject._groupOnField);
        } else {
            console.log(pad + "> Unknown");
        }
        if (reportObject._detail !== null && reportObject._detail !== undefined) {
            console.log(spad + "  | Has Detail");
        }
        if (reportObject._theader !== null && reportObject._theader !== undefined) {
            console.log(spad + "  | Has Title Header");
        }
        if (reportObject._header !== null && reportObject._header !== undefined) {
            console.log(spad + "  | Has Header");
        }
        if (reportObject._footer !== null && reportObject._footer !== undefined) {
            console.log(spad + "  | Has Footer");
        }
        if (reportObject._tfooter !== null && reportObject._tfooter !== undefined) {
            console.log(spad + "  | Has Summary Footer");
        }

        if (reportObject._child) {
            printStructure(reportObject._child, level + 1);
        } else if (reportObject._children) {
            for (j = 0; j < reportObject._children.length; j++) {
                printStructure(reportObject._children[j], level + 1);
            }
        }
    }

    /**
     * Returns true if object is an array object
     * @param obj
     * @return {Boolean} True or False
     */
    function isArray(obj) {
        return (Object.prototype.toString.apply(obj) === '[object Array]');
    }

    /**
     * returns true if this is a number
     * @param num
     * @return {Boolean}
     */
    function isNumber(num) {
        return ((typeof num === 'string' || typeof num === 'number') && num !== null && !isNaN((num - 0)) && num !== '' );
    }

    /**
     * Clones the data -- this is a simple clone, it does *NOT* do any really DEEP copies;
     * but nothing in the report module needs a deep copy.
     * @param value
     * @return {*}
     */
    function clone(value) {
        var key, target = {}, i, aTarget = [];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || Object.prototype.toString.call(value) === '[object Date]') {
            return value;
        }
        if (isArray(value)) {
            for (i = 0; i < value.length; i++) {
                aTarget.push(clone(value[i]));
            }
            return (aTarget);
        } else if (typeof aTarget === "object") {
            for (key in value) {
                if (value.hasOwnProperty(key)) {
                    target[key] = value[key];
                }
            }
            return target;
        } else {
            // Currently this path is not used in the clone...
            return JSON.parse(JSON.stringify(value));
        }
    }


    function error() {
        if (!console || !console.error || arguments.length === 0) {
            return;
        }
        console.error.apply(console, arguments);
    }

// -------------------------------------------------------
// Report Objects
// -------------------------------------------------------

    /**
     * This is a Report Section that allows multiple DataSets for laying out a report.
     * @param parent object, typically another section, group or report object
     * @constructor
     */
    function ReportSection(parent) {
        this._children = [];
        this._parent = parent;
    }

    /**
     * This is the Wrapper around the PDFKit, could be used to wrap any output library
     * @constructor
     */
    function PDFWrapper(primaryReport, options) {
        this.totals = {};
        this._priorValues = {};
        this._pageHasRendering = false;
        this._curBand = [];
        this._primaryReport = primaryReport;
        this._pageBreaking = false;
        this._landscape = false;
        this._paper = "letter";
        this._margins = 72;
        this._lineWidth = 1;
        this._level = 0;
        this._totalLevels = 0;

        var opt = {};
        if (options) {
            if (options.paper) {
                this._paper = options.paper;
                if (this._paper !== "letter") {
                    opt.size = this._paper;
                }
            }
            if (options.landscape) {
                this._landscape = true;
                opt.layout = "landscape";
            }
            if (options.margins && options.margins !== this._margins) {
                this._margins = options.margins;
                opt.margin = options.margins;
            }
        }

        this._PDF = new this._PDFKit(opt);

        // This is a PDFDoc emulated page wrapper so that we can detect how it will wrap things.
        var lwdoc = this._LWDoc = {
            count: 0, pages: 1, x: this._PDF.page.margins.left, y: this._PDF.page.margins.top, page: this._PDF.page, _PDF: this._PDF,
            currentLineHeight: function (val) { return this._PDF.currentLineHeight(val); },
            widthOfString: function (d, o) { return this._PDF.widthOfString(d, o); },
            addPage: function () { this.pages++;  this.x = this._PDF.page.margins.left; this.y = this._PDF.page.margins.top; },
            reset: function () { this.count = 0; this.pages = 0;  this.addPage(); }
        };

        // Create a new Line Wrapper Object
        this._LineWrapper = new this._LineWrapperObject(lwdoc);
        this._LineWrapper.on('line', function () {
            lwdoc.count++;
        });


    }

    /**
     * Creates a Object for tracking Header/Footer instances
     * @constructor
     */
    function ReportHeaderFooter(isHeader) {
        this._part = null;
        this._isFunction = false;
        this._partHeight = -1;
        this._partWidth = -1;
        this._pageBreakBefore = false;
        this._pageBreakAfter = false;
        this._isHeader = isHeader;
    }

    /**
     * This creates a Report Grouping
     * @param parent
     * @constructor
     */
    function ReportGroup(parent) {
        this._parent = parent;
        this._header = null;
        this._footer = null;
        this._detail = null;
        this._groupOnField = null;
        this._groupChecked = false;
        this._groupLastValue = null;
        this._child = null;
        this._hasRanHeader = false;
        this._afterSubgroup = false;
        this._lastData = {};
        this._math = [];
        this._totals = {};
        this._curBandWidth = [];
        this._level = -1;
    }

    /**
     * This creates a Dataset Element for the Report
     * @param parent
     * @return {ReportGroup}
     * @constructor
     */
    function ReportDataSet(parent) {
        this._parent = parent;
        this._data = null;
        this._dataType = 0;
        this._child = new ReportGroup(this);
        if (this._parent && this._parent._parent === null) {
            this._child.header = this._child.pageHeader;
            this._child.footer = this._child.pageFooter;
        }
        this._totalFormatter = function (data, callback) {
            callback(null, data);
        };
        return (this._child);
    }

    /** Custom Data Object
     *  This is a example method that is a paged data object
     *  this is a linked to internal Kellpro data and functions;
     *  but you can base your own page-able data object off of it (see prototype)
     **/
    function ScopedDataObject(data, scope, formattingState) {
        this._scope = scope;
        this._data = data;
        this._dataType = 0;
        this._formatters = null;
        if (formattingState !== null && formattingState !== undefined) {
            this._formattingState = formattingState;
        } else {
            this._formattingState = 0;
        }
        if (data._isQuery || data._isquery || typeof data === "string") {
            this._dataType = 2;
        }
        else if (data.isRows) {
            this._dataType = 1;
            this.isPaged = true;
        }
        else {
            if (this.error) {
                this.error(scope, null, 'warn', "Unknown scoped data type: " + Object.prototype.toString.apply(data));
            } else {
                error("Unknown data type: ", Object.prototype.toString.apply(data), data);
            }
        }
    }

    // -----------------------------------------------------------
    // Report Class
    // -----------------------------------------------------------
    function Report(parent) {
        this._child = new ReportSection(this);
        this._reportName = "report.pdf";
        if (arguments.length) {
            if (typeof parent === "string") {
                this._parent = null;
                this._reportName = parent;
            } else {
                this._parent = parent;
            }
        } else {
            this._parent = null;
        }

        this._theader = null;
        this._tfooter = null;
        this._header = null;
        this._footer = null;
        this._userdata = null;
        this._curBandWidth = [];
        this._state = {};
        this._landscape = false;
        this._paper = "letter";
        this._font = "Helvetica";
        this._fontSize = 12;
        this._margins = 72;
        this._autoprint = false;


        // We want to return a fully developed simple report (Report->Section->DataSet->Group) so we create it and then return the Group Object
        this._detailGroup = this._child.addDataSet();
        return (this._detailGroup);
    }

    Report.prototype = {
        _isReport: true,

        isRootReport: function () {
            return (this._parent === null);
        },

        autoPrint: function (value) {
            if (arguments.length) {
                this._autoprint = value;
                return this;
            }
            return this._autoprint;
        },

        render: function (callback) {

            if (this.isRootReport()) {
                var self = this;
                if (!callback) {
                    callback = null;
                }

                this._state = { isTitle: false, isFinal: false, headerSize: 0, footerSize: 0, isCalc: false,
                    resetGroups: true, startX: 0, startY: 0, currentX: 0, currentY: 0, priorStart: []};

                // Find out Sizes of all the Headers/Footers
                var testit = new PDFWrapper(this);
                testit.font(this._font, this._fontSize);

                // Catch the Printing so that we can see if we can track the "offset" of the Footer in case the footer
                // is moved to a literal Y position (without it being based on the prior Y position)
                var offset = false;
                var oPrint = testit.print;
                var oBand = testit.band;
                testit.band = function(data, options) {
                    if (offset) return;
                    oBand.call(this, data, options);
                };
                testit.print = function(data, options) {
                    if (offset) return;
                    oPrint.call(this, data, options);
                };
                testit.setCurrentY = function(y) {
                    // Try and guess to see if the report is moving the Y based on a calculation or just a fixed location
                    // If it is "guessed" it is a fixed location, we will ignore it for calculating page sizes since it will always
                    // be a fixed location.
                    var cY = PDFWrapper.prototype.getCurrentY.call(testit);
                    var pS = this._PDF.page.height || 700;
                    if (y > cY+(pS / 3)) { offset = true; }
                    else PDFWrapper.prototype.setCurrentY.call(testit, y);
                };

                this._calculateFixedSizes(testit);
                testit = null;
                if (this._footer !== null) {
                    this._state.footerSize = this._footer._partHeight;
                }
                if (this._header !== null) {
                    this._state.headerSize = this._header._partHeight;
                }

                // Lets Run the Header
                var renderedReport = new PDFWrapper(this, {paper: this._paper, landscape: this._landscape, margins: this._margins});
                renderedReport.font(this._font, this._fontSize);
                renderedReport.setFooterSize(this._state.footerSize);
                renderedReport.setAutoPrint(this._autoprint);
                this._state.isTitle = true;
                if (this._theader !== null) {
                    this._theader.run(renderedReport, this._state, null);
                }
                else if (this._header !== null) {
                    this._header.run(renderedReport, this._state, null);
                }
                this._state.isTitle = false;

                this._renderIt(renderedReport, this._state, null,
                    function () {
                        // Run final Footer!
                        self._state.isFinal = true;

                        var dataSet = self._detailGroup._findParentDataSet();
                        dataSet._totalFormatter(self._detailGroup._totals, function (err, data) {
                            renderedReport.totals = data;

                            renderedReport.bandWidth(self._curBandWidth);
                            if (self._tfooter !== null) {
                                self._tfooter.run(renderedReport, self._state, null);
                            }
                            else if (self._footer !== null) {
                                self._footer.run(renderedReport, self._state, null);
                            }
                            self._state.isFinal = false;

                            renderedReport.write(self._reportName, function (err) {
                                if (callback) {
                                    return callback(err, self._reportName);
                                }
                            });
                        });
                    });
                return (this._reportName);

            } else {
                return this._parent.render(callback);
            }
        },

        userdata: function (value) {
            if (arguments.length) {
                this._userdata = value;
                return this;
            }
            return this._userdata;
        },

        state: function (value) {
            if (arguments.length) {
                this._state = value;
            }
            return this._state;
        },

        paper: function (value) {
            if (arguments.length) {
                this._paper = value;
            }
            return this._paper;
        },

        landscape: function (value) {
            if (arguments.length) {
                this._landscape = value;
            }
            return this._landscape;
        },

        font: function (value) {
            if (arguments.length) {
                this._font = value;
            }
            return this._font;
        },

        fontSize: function (value) {
            if (arguments.length) {
                this._fontSize = value;
            }
            return this._fontSize;
        },

        fontBold: function () {
            var fonts = Report.fonts;
            var font = fonts._index[this._font];
            switch (this._font) {
                case font.italic:
                case font.bolditalic:
                    this._font = font.bolditalic;
                    break;
                default:
                    this._font = font.bold;
                    break;
            }
        },

        fontItalic: function () {
            var fonts = Report.fonts;
            var font = fonts._index[this._font];
            switch (this._font) {
                case font.bold:
                case font.bolditalic:
                    this._font = font.bolditalic;
                    break;
                default:
                    this._font = font.italic;
                    break;
            }
        },

        fontNormal: function () {
            var fonts = Report.fonts;
            var font = fonts._index[this._font];
            this._font = font.normal;
        },

        margins: function (value) {
            if (arguments.length) {
                this._margins = value;
            }
            return this._margins;
        },

        // --------------------------------------
        // Internal Private Variables & Functions
        // --------------------------------------

        _calculateFixedSizes: function (Rpt) {
            if (this._header !== null) {
                Rpt.addPage();
                this._header.run(Rpt, {isCalc: true}, null);
            }
            if (this._footer !== null) {
                Rpt.addPage();
                this._footer.run(Rpt, {isCalc: true}, null);
            }
            this._child._calculateFixedSizes(Rpt);
        },

        _pageHeader: function (value, settings) {
            if (this._header === null) {
                this._header = new ReportHeaderFooter(true);
            }
            if (arguments.length) {
                this._header.set(value, settings);
            }
            return (this._header.get());
        },

        _pageFooter: function (value, settings) {
            if (this._footer === null) {
                this._footer = new ReportHeaderFooter(false);
            }
            if (arguments.length) {
                this._footer.set(value, settings);
            }
            return (this._footer.get());
        },

        _titleHeader: function (value, settings) {
            if (this._theader === null) {
                this._theader = new ReportHeaderFooter(true);
            }
            if (arguments.length) {
                this._theader.set(value, settings);
            }
            return (this._theader.get());
        },

        _finalSummary: function (value, settings) {
            if (this._tfooter === null) {
                this._tfooter = new ReportHeaderFooter(false);
            }
            if (arguments.length) {
                this._tfooter.set(value, settings);
            }
            return (this._tfooter.get());
        },

        _renderIt: function (Rpt, State, currentData, callback) {
            this._child._renderIt(Rpt, State, currentData, callback);
        },

        _setBandSize: function (value) {
            this._curBandWidth = value;
        }

    };

    // -----------------------------------------------------------
    // Header/Footer Prototypes
    // -----------------------------------------------------------
    ReportHeaderFooter.prototype = {
        _isReportHeaderFooter: true,

        set: function (value, settings) {
            this._part = value;
            this._isFunction = (typeof value === "function");
            if (settings !== null) {
                this._pageBreakBefore = getSettings(settings, "pageBreakBefore", false);
                this._pageBreakAfter = getSettings(settings, "pageBreakAfter", false);
                if (this._isHeader) {
                    this._pageBreakBefore = getSettings(settings, "pageBreak", this._pageBreakBefore);
                } else {
                    this._pageBreakAfter = getSettings(settings, "pageBreak", this._pageBreakAfter);
                }
            }
        },

        get: function () {
            return this._part;
        },

        run: function (Rpt, State, Data) {
            var offsetX, offsetY;

            // Setup our current Header/Footer that is running
            Rpt._curheaderfooter = this;

            if (this._pageBreakBefore) {
                Rpt.newPage();
            }
            offsetY = Rpt.getCurrentY();
            if (this._partHeight === -1) {
                offsetX = Rpt.getCurrentX();
            }
            if (offsetY + this._partHeight > Rpt.maxY()) {
                Rpt.newPage(State);
            }

            if (this._isFunction) {
                try {
                    this._part(Rpt, Data, State);
                } catch (err) {
                    if (this._isHeader) {
                        Report.error("REPORTAPI: Error running header in report", err, err.stack);
                    } else {
                        Report.error("REPORTAPI: Error running footer in report", err, err.stack);
                    }

                }
            } else if (this._part !== null) {
                if (this._isHeader) {
                    this.runStockHeader(Rpt, this._part);
                } else {
                    this.runStockFooter(Rpt, this._part);
                }
            }
            if (this._partHeight === -1) {
                this._partHeight = Rpt.getCurrentY() - offsetY;
                this._partWidth = Rpt.getCurrentX() - offsetX;

            }
            if (this._pageBreakAfter) {
                Rpt.newPage();
            }
        },

        runStockHeader: function (Rpt, headers) {

            var NowDate = new Date();

            var mins = NowDate.getMinutes();
            if (mins < 9) {
                mins = "0" + mins;
            }
            var hours = NowDate.getHours();
            var ampm = "am";
            if (hours >= 12) {
                if (hours > 12) {
                    hours -= 12;
                }
                ampm = "pm";
            }
            var Header = "Printed At: " + hours + ":" + mins + ampm;
            var y = Rpt.getCurrentY();
            Rpt.print(Header);
            if (isArray(headers)) {
                Rpt.print(headers[0], {align: "center", y: y});
            }
            else {
                Rpt.print(headers, {align: "center", y: y});
            }
            Rpt.print("Page: " + Rpt.currentPage(), {align: "right", y: y});

            Header = "on " + NowDate.toLocaleDateString();
            y = Rpt.getCurrentY();
            Rpt.print(Header);
            if (isArray(headers) && headers.length > 1) {
                Rpt.print(headers[1], {align: "center", y: y});
            }
            Rpt.newLine();
        },

        runStockFooter: function (Rpt, footer) {
            if (footer === null || footer.length === 0) {
                return;
            }

            var i, bndSizes = Rpt.bandWidth();
            Rpt.newLine();
            Rpt.bandLine(2);


            // Handle a String Passed into it.
            if (!isArray(footer)) {
                this._handleFooterPart(Rpt, [footer], bndSizes);
                return;
            }

            if (isArray(footer) && footer.length >= 1) {

                // Handle a Single Array
                if (!isArray(footer[0])) {
                    this._handleFooterPart(Rpt, footer, bndSizes);
                    return;
                }

                var bndArray = [];
                // Handle a Array of Arrays
                for (i = 0; i < footer.length; i++) {
                    var id = footer[i][1] - 1;
                    while (id > bndArray.length) {
                        bndArray.push(["", bndSizes[bndArray.length]]);
                    }
                    bndArray[id] = [Rpt.totals[footer[i][0]], bndSizes[id]];
                    // Fix Alignment, if set
                    if (footer[i][2] >= 0 && footer[i][2] <= 3) {
                        bndArray[id][2] = footer[i][2];
                    }
                }
                if (bndArray.length > 0) {
                    Rpt.band(bndArray);
                }
            }
        },

        _handleFooterPart: function (Rpt, part, bndSizes) {
            var offset = 0, i;
            if (part.length === 3) {
                if (bndSizes[(part[2] - 1)]) {
                    for (i = 0; i < part[2] - 1; i++) {
                        offset += bndSizes[i];
                    }
                }
            }

            var y = Rpt.getCurrentY(), x = Rpt.getCurrentX();
            if (offset > 0) {
                Rpt.print(part[0], {y: y});
                offset += (bndSizes[part[2] - 1] - Rpt.widthOfString(Rpt.totals[part[1]].toString()) - 2);
                Rpt.print(Rpt.totals[part[1]].toString(), {x: x + offset, y: y});
            } else if (part.length > 1) {
                Rpt.print(part[0] + ' ' + Rpt.totals[part[1]], {y: y});
            } else {
                Rpt.print(part[0].toString(), {y: y});
            }
            Rpt.setCurrentY(y);
            Rpt.setCurrentX(x);

        }
    };


    // -----------------------------------------------------------
    // ScopedDataObject Prototypes
    //
    // -----------------------------------------------------------
    ScopedDataObject.prototype = {

        // Used for Error Reporting (optional)
        error: function () {
            var args = [this._scope, null, 'error'];
            //args = args.concat(arguments);
            //var list = [];
            for (var a in arguments) {
                if (args.length > 3) {
                    args.push(" / ");
                }
                if (arguments.hasOwnProperty(a)) {
                    if (isArray(arguments[a])) {
                        for (var i = 0; i < arguments[a]; i++) {
                            args.push(arguments[a][i]);
                        }
                    } else if (typeof arguments[a] === 'string') {
                        args.push(arguments[a]);
                    } else if (typeof arguments[a] === 'object') {
                        args.push(arguments[a].toString());
                    } else {
                        args.push(arguments[a]);
                    }
                }
            }
            if (console && console.error) {
                console.error.apply(console, args.slice(2));
            }
            this._scope.funcs.logclient.apply(this, args);
        },

        // Helper function, not required to re-implement a SDO interface
        cleanUpData: function (results, callback) {
            var self = this, columns = [], mcolumns = null;

            // Skip ALL Formatting
            if (this._formattingState === 0 || this._formattingState === false) {
                return callback(null, results);
            }

            if (this._dataType === 1) {
                mcolumns = this._data.fields;
                for (var key in mcolumns) {
                    if (mcolumns[key] === true) {
                        columns.push(key);
                    }
                }
            } else {
                var firstRow = results[0];
                if (firstRow) {
                    mcolumns = Object.keys(firstRow);
                    for (var i = 0; i < mcolumns.length; i++) {
                        columns.push(mcolumns[i]);
                    }
                }
            }

            if (this._formatters === null) {
                this._scope.funcs.reportapi_setupformatters(this._scope,
                    function (err, data) {
                        self._formatters = data;
                        self._scope.funcs.reportapi_handleformatters(self._scope, callback, results, self._formatters, self._formattingState);
                    }, columns);
            } else {
                this._scope.funcs.reportapi_handleformatters(this._scope, callback, results, this._formatters, this._formattingState);
            }
        },

        // Used to load the data
        loadRange: function (start, end, callback) {
            var self = this;
            if (!this.isPaged || this._result) {
                this.cleanUpData(this._result, callback);
            } else {
                this._scope.funcs.rowsgetpage(this._scope, function (err, data) {
                    if (!err) {
                        self.cleanUpData(data, callback);
                    } else {
                        callback(err, null);
                    }
                }, this._data, start, end-start, {asarray: true, append: false});
            }
        },

        // Used to get a record count
        count: function (callback) {
            var self = this;

            if (this._dataType === 2) {
                this._scope.funcs.q(this._scope,
                    function (err, data) {
                        // Error Occurred

                        if (err) {
                            Report.error("REPORTAPI: Error in count: ", err);
                            self._result = [];
                            return callback(err, 0);
                        }
                        // Single Record
                        if (!data.length && Object.prototype.toString.apply(data) === "[object Object]") {
                            self._result = [];
                            self._result.push(data);
                        } else {
                            // Result Array
                            self._result = data;
                        }
                        var len = self._result.length;
                        return callback(null, len);
                    }, this._data);
            } else if (this._dataType === 1) {
                this._scope.funcs.rowsgetlength(this._scope, callback, this._data);
            } else {
                Report.error("REPORTAPI: Unknown datatype in scopedDataObject(Count), either extend the scopedDataObject or create your own simple wrapper!");
            }
        },

        // Used to format the total line (Optional)
        totalFormatter: function (data, callback) {
            var self = this;

            try {
                var ndata = [data];
                self._scope.funcs.reportapi_handleformatters(self._scope, function (err, data) {
                    callback(err, data[0]);
                }, [data], self._formatters, self._formattingState);
            } catch (tferr) {
                Report.error("REPORTAPI: Error in totalFormatter", tferr, tferr && tferr.stack);
                callback(null, data);
            }
        }
    };


    // -----------------------------------------------------------
    // Setup our PDFWrapper Prototype functions
    // -----------------------------------------------------------
    PDFWrapper.prototype = {
        _isPDFWrapper: true,

        _PDFKit: require('pdfkit'),

        _LineWrapperObject: require('pdfkit/js/line_wrapper'),

        image: function (name, options) {
            options = options || {};
            this._PDF.image(name, options);
        },

        addPage: function () {
            if (!this._pageHasRendering) {
                return;
            }

            this._pageHasRendering = false;
            var options = {};
            if (this._paper !== "letter") {
                options.size = this._paper;
            }
            if (this._landscape) {
                options.layout = "landscape";
            }
            if (this._margins !== 72) {
                options.margin = this._margins;
            }

            this._PDF.addPage(options);
        },

        font: function (name, size) {
            this._PDF.font(name, size);
        },

        fontSize: function (size) {
            if (size == null) { return this._PDF._fontSize; }
            this._PDF.fontSize(size);
        },

        fontBold: function () {
            var fonts = Report.fonts;
            var font = fonts._index[this._PDF._font.filename];
            switch (this._PDF._font.filename) {
                case font.italic:
                case font.bolditalic:
                    this.font(font.bolditalic);
                    break;
                default:
                    this.font(font.bold);
                    break;
            }
        },

        fontItalic: function () {
            var fonts = Report.fonts;
            var font = fonts._index[this._PDF._font.filename];
            switch (this._PDF._font.filename) {
                case font.bold:
                case font.bolditalic:
                    this.font(font.bolditalic);
                    break;
                default:
                    this.font(font.italic);
                    break;
            }
        },

        fontNormal: function () {
            var fonts = Report.fonts;
            var font = fonts._index[this._PDF._font.filename];
            this.font(font.normal);
        },

        setMargins: function (value) {
            this._margins = value;
        },

        setFooterSize: function (value) {
            if (typeof this._margins === 'number') {
                this._PDF.page.margins.bottom = value + this._margins;
            } else {
                this._PDF.page.margins.bottom = value + this._margins.bottom;
            }
        },

        setAutoPrint: function (value) {
            if (value) {
                this._PDF.store.root.data.OpenAction = this._PDF.ref({Type: 'Action', S: 'Named', N: 'Print'});
            } else {
                if (this._PDF.store && this._PDF.store.root && this._PDF.store.root.data && this._PDF.store.root.data.OpenAction) {
                    delete this._PDF.store.root.data.OpenAction;
                }
            }
        },

        paper: function (value) {
            if (arguments.length) {
                this._paper = value;
            }
            return (this._paper);
        },

        landscape: function (value) {
            if (arguments.length) {
                this._landscape = value;
            }
            return (this._landscape);
        },

        newPage: function () {
            if (!this._pageHasRendering) {
                return;
            }
            if (this._pageBreaking) {
                return;
            }
            this._pageBreaking = true;
            if (this._primaryReport && this._primaryReport._footer) {
                this._primaryReport._footer.run(this, this._primaryReport.state(), null);
            }
            this.addPage();
            if (this._primaryReport && this._primaryReport._header) {
                this._primaryReport._header.run(this, this._primaryReport.state(), null);
            }
            this._pageBreaking = false;
        },

        standardHeader: function (text) {
            this._curheaderfooter.runStockHeader(this, text);
        },

        standardFooter: function (text) {
            this._curheaderfooter.runStockFooter(this, text);
        },

        currentPage: function () {
            return this._PDF.pages.length;
        },

        getCurrentX: function () {
            return this._PDF.x;
        },

        getCurrentY: function () {
            return this._PDF.y;
        },

        write: function (name, callback) {
            this._PDF.write(name, callback);
        },

        setCurrentX: function (x) {
            this._PDF.x = x;
        },

        setCurrentY: function (y) {
            this._PDF.y = y;
        },

        newLine: function (x) {
            x = x || 1;
            for (var i = 0; i < x; ++i) {
                this._PDF.moveDown();
                if (this._PDF.y >= this._PDF.page.maxY()) {
                    this.newPage();
                }
            }
        },

        widthOfString: function (str) {
            return this._PDF.widthOfString(str);
        },


        /**
         * @param {Array} data a list values
         */
        print: function (data, options) {
            var i, max, textOptions = {}, oldFont = null, oldFontSize = null;
            this._pageHasRendering = true;
            this._PDF.x = this._PDF.page.margins.left;
            if (options) {
                if (options.x) {
                    this._PDF.x = options.x;
                }
                if (options.y) {
                    this._PDF.y = options.y;
                }
                if (options.align) {
                    textOptions.align = options.align;
                }
                if (options.textWidth) {
                    textOptions.textWidth = options.textWidth;
                }
                if (options.width) {
                    textOptions.width = options.width;
                }

                oldFont = this._PDF._font;

                if (options.fontsize) {
                    oldFontSize = this._PDF._fontSize;
                    this.fontSize(options.fontsize);
                } else if (options.fontSize) {
                    oldFontSize = this._PDF._fontSize;
                    this.fontSize(options.fontSize);
                }

                if (options.font) {
                    this.font(options.font);
                }
                if (options.fontBold || options.fontbold) {
                    this.fontBold();
                }
                if (options.fontItalic || options.fontitalic) {
                    this.fontItalic();
                }

            }


            if (isArray(data)) {
                for (i = 0, max = data.length; i < max; i++) {
                    if (data[i] !== null && data[i] !== undefined) {
                        this._PDF.text(this.processText(data[i]), textOptions);
                        if (this._PDF.y >= this._PDF.page.maxY()) {
                            this.newPage();
                        }
                    }
                }
            } else if (data !== null && data !== undefined) {
                this._PDF.text(this.processText(data), textOptions);
                if (this._PDF.y >= this._PDF.page.maxY()) {
                    this.newPage();
                }
            }

            // Reset
            if (oldFont !== null) {
                this._PDF._font = oldFont;
            }
            if (oldFontSize !== null) {
                this.fontSize(oldFontSize);
            }
        },

        line: function (startX, startY, endX, endY) {
            var x = this._PDF.x, y = this._PDF.y;
            this._pageHasRendering = true;
            this._PDF.moveTo(startX, startY);
            this._PDF.lineTo(endX, endY).stroke();
            this._PDF.x = x;
            this._PDF.y = y;
        },

        bandLine: function (thickness, vertGap) {
            thickness = thickness || 2;
            vertGap = vertGap || 2;
            var i, bndSizes = this.bandWidth(), width, y = this.getCurrentY(), x = this.getCurrentX();

            for (i = 0, width = 0; i < bndSizes.length; i++) {
                width += bndSizes[i];
            }
            if (vertGap) y += vertGap;
            if (width > 0) {
                var oldLineWidth = this.lineWidth();
                this.lineWidth(thickness);
                this.line(x - 2, y - 2, width + x - 2, y - 2);
                this.lineWidth(oldLineWidth);
            }
            if (vertGap) this.setCurrentY(y + vertGap);
        },

        suppressionBand: function (data, options) {
            options = options || {};
            if (!options.group) {
                options.group = "detail" + this._level;
            }
            var group = options.group;
            var odata = clone(data);


            if (this._priorValues[group] !== undefined) {
                var cdata = this._priorValues[group];

                for (var i = cdata.length - 1; i >= 0; i--) {
                    if (data[i].force === true || data[i].force === 1) continue;
                    if (data[i].data === cdata[i].data && data[i].data !== '' && data[i].data !== null && data[i].data !== undefined) data[i].data = ' " ';
                    //else break;
                }
            }

            this.band(data, options);

            this._priorValues[group] = odata;
        },

        box: function (startX, startY, endX, endY) {
            this._PDF.rect(startX, startY, endX, endY).stroke();
        },

        _truncateText: function (data, width) {
            var curData;
            var offset = data.data.indexOf('\n');
            if (offset > 0) {
                curData = data.data.substr(0, offset);
            } else {
                curData = data.data;
            }
            var wos = this._PDF.widthOfString(curData);
            var dWidth = width - 10;
            if (wos >= dWidth) {
                var len = 1;
                while (wos >= dWidth && len > 0) {
                    var wos_c = parseInt(wos / width, 10) + 1;
                    len = parseInt(curData.length / wos_c, 10) - 1;
                    curData = curData.substr(0, len);
                    wos = this._PDF.widthOfString(curData);
                }
            }
            data.data = curData;
            return 1;
        },

        _wrapText: function (data, width, ldata) {
            this._LWDoc.reset();
            ldata.width = width - 10;
            // TODO: Remove the Split when the underlying Bug https://github.com/devongovett/pdfkit/pull/152 is fixed.
            this._LineWrapper.wrap(data.data.split('\n'), ldata);
            return this._LWDoc.count;
        },

        _cleanData: function (data, options, defaultSize) {
            var len = data.length;

            var formatText;
            var lineData = {width: 0, height: this.maxY()};
            if (options && options.wrap) {
                formatText = this._wrapText;
            } else {
                formatText = this._truncateText;
            }

            var maxLines = 1, curLines, maxFontSize=1;
            var originalFontSize = this.fontSize();
            for (var i = 0; i < len; i++) {
                data[i].data = this.processText(data[i].data);
                var curFontSize = data[i].fontSize || originalFontSize;
                if (curFontSize > maxFontSize) maxFontSize = curFontSize;
                this._PDF.fontSize(curFontSize);

                curLines = formatText.call(this, data[i], data[i].width || defaultSize, lineData);
                if (curLines > maxLines) maxLines = curLines;
            }
            this._PDF.fontSize(maxFontSize);
            var lineSize = maxLines * this._PDF.currentLineHeight(true);
            this._PDF.fontSize(originalFontSize);
            return lineSize;
        },

        /**
         * @param {Array,Object} data a list of Coord, width, datafield
         */
        band: function (dataIn, options) {
            var i = 0, max = dataIn.length, maxWidth = 0, lineWidth = null,
                oldLineWidth = null, padding = 0;
            var defaultSize = 50, data = [], startX = this._PDF.page.margins.left;
            this._pageHasRendering = true;

            options = options || {};
            if (options.defaultSize != null && !isNaN(options.defaultSize + 0)) {
                defaultSize = parseInt(options.defaultSize, 10);
            }

            // Convert old style [[data, width, alignment],[...],...] to [{data:data, width:width, ..},{...},...]
            if (isArray(dataIn[0])) {
                for (i = 0; i < max; i++) {
                    data[i] = {
                        data: dataIn[i][0] || '',
                        width: dataIn[i][1] || defaultSize,
                        align: dataIn[i][2] || 1
                    };
                }
            } else {
                for (i = 0; i < max; i++) {
                    if (typeof dataIn[i] === 'string') {
                        data[i] = {data: dataIn[i], width: defaultSize, align: 1};
                    } else {
                        data[i] = dataIn[i];
                        // if (!data[i].width) data[i].width = defaultSize;
                    }
                }
            }

            // Do Data Fixup / cleanup / Figure wrapping
            var height = this._cleanData(data, options, defaultSize);

            // Check to see if we have a "Settings"
            if (arguments.length > 1 && typeof options === 'object') {
                if (options.border > 0 || options.fill) {
                    maxWidth = 0;
                    for (i = 0; i < max; i++) {
                        maxWidth += (data[i].width || defaultSize);
                    }
                }
                if (options.padding != null && !isNaN(options.padding + 0)) {
                    padding = options.padding;
                }
                if (options.border != null && !isNaN(options.border + 0)) {
                    lineWidth = options.border;
                }
                if (options.x != null && !isNaN(options.x + 0)) {
                    startX += parseInt(options.x, 10);
                }
                if (options.y != null && !isNaN(options.y + 0)) {
                    this._PDF.y = parseInt(options.y, 10);
                }
            }

            height = height + (padding * 2);

            if (this._PDF.y + height >= this._PDF.page.maxY()) {
                this.newPage();
            }

            oldLineWidth = this.lineWidth();
            if (lineWidth !== null) {
                this.lineWidth(lineWidth);
            }
            this._curBand = [];
            var x = startX;
            var y = this._PDF.y - 2;

            var offset = 0, textOffset = 0;

            if (maxWidth > 0) {
                if (options.fill && options.border > 0) {
                    this._PDF.rect(x - 2, y, maxWidth, height).fillAndStroke(options.fill, null);
                    this._PDF.fillColor('black');
                }
                else if (options.fill) {
                    this._PDF.rect(x - 2, y, maxWidth, height).fill(options.fill);
                    this._PDF.fillColor('black');
                }

                else if (options.border > 0) {
                    this._PDF.rect(x - 2, y, maxWidth, height).stroke();
                }
            }
            var originalFontSize = this.fontSize();
            for (i = 0; i < max; i++) {
                var curData = data[i].data;
                var curFontSize = data[i].fontSize || originalFontSize;
                this._PDF.fontSize(curFontSize);
                var curWidth = data[i].width || defaultSize;
                var wos = this._PDF.widthOfString(curData);
                if (!data[i].align || data[i].align === 1) {
                    // Left
                    textOffset = padding;
                } else if (data[i].align === 2) {
                    // Center
                    textOffset = (curWidth / 2) - (wos / 2) - 4 + padding;
                } else if (data[i].align === 3 || isNumber(curData)) {
                    // RIGHT Aligned
                    textOffset = (curWidth - wos) - 4 - padding;
                } else {
                    // Default to left
                    textOffset = padding;
                }
                if (textOffset < 0) {
                    textOffset = 0;
                }

                this._PDF.text(curData, x + offset + textOffset, y + 2 + padding, {width: curWidth - 10}).stroke();
                offset += curWidth;
                this._curBand.push(curWidth);
            }
            this._PDF.fontSize(originalFontSize);
            offset = 0;
            for (i = 0; i < max; i++) {
                var dataElement = data[i];
                if (!isNaN(dataElement.border + 0)) {
                    dataElement.border = {left: dataElement.border, right: dataElement.border,
                        top: lineWidth || dataElement.border, bottom: lineWidth || dataElement.border};
                }
                var currentWidth;
                if (currentWidth = (dataElement.border && dataElement.border.left)) {
                    this.lineWidth(currentWidth);
                    this.line(x + offset - 2, y, x + offset - 2, y + height);
                    this.lineWidth(oldLineWidth);
                }
                if (currentWidth = (dataElement.border && dataElement.border.top)) {
                    this.lineWidth(currentWidth);
                    this.line(x + offset - 2, y, x + (offset + (dataElement.width || defaultSize)) - 2, y);
                    this.lineWidth(oldLineWidth);
                }
                if (currentWidth = (dataElement.border && dataElement.border.bottom)) {
                    this.lineWidth(currentWidth);
                    this.line(x + offset - 2, y + height, x + (offset + (dataElement.width || defaultSize)) - 2, y + height);
                    this.lineWidth(oldLineWidth);
                }
                offset += (dataElement.width || defaultSize);
                if (currentWidth = ((dataElement.border && dataElement.border.right) || lineWidth)) {
                    this.lineWidth(currentWidth);
                    this.line(x + offset - 2, y, x + offset - 2, y + height);
                    this.lineWidth(oldLineWidth);
                }
            }

            this._PDF.x = x;
            this._PDF.y = y + 2 + height;

            if (oldLineWidth !== null) {
                this.lineWidth(oldLineWidth);
            }

            if (this._PDF.y >= this._PDF.page.maxY()) {
                this.newPage();
            }
        },

        processText: function (value) {
            if (value === null || value === undefined) return ('');
            else if (typeof value.format === 'function') {
                if (isNumber(value)) {
                    return value.format({decimals: 2});
                } else {
                    return value.format();
                }
            }
            return value.toString();
        },

        lineWidth: function (value) {
            if (arguments.length) {
                this._lineWidth = value;
                this._PDF.lineWidth(value);
            }
            return this._lineWidth;
        },

        bandWidth: function (value) {
            if (arguments.length) {
                this._curBand = clone(value);
            }
            return clone(this._curBand);
        },

        getLastBandWidth: function () {
            var width, i, sizes = this.bandWidth();
            for (i = 0, width = 0; i < sizes.length; i++) {
                width += sizes[i];
            }
            return width;
        },

        maxY: function () {
            return this._PDF.page.maxY();
        },

        maxX: function () {
            return this._PDF.page.width - this._PDF.page.margins.left;
        },

        pageNumber: function (text, options) {
            options = options || {};
            if (!options.align) {
                options.align = "center";
            }
            this._PDF.text("Page: " + this.currentPage(), options);
        },

        // CONSTANTS
        left: 1,
        right: 3,
        center: 2

    };

    /**
     * This is the DataSet Prototypes
     * @type {Object}
     */
    ReportDataSet.prototype = {
        _isDataSet: true,

        data: function (value) {
            var self = this;
            if (!arguments.length) {
                return (this._data);
            }
            if (isArray(value)) {
                this._dataType = 0;
            } else if (typeof value === 'function' || typeof value === 'object') {
                this._dataType = 1;
                this._data = value;
            } else {
                this._dataType = 0;
            }
            if (value.totalFormatter && typeof value.totalFormatter === 'function') {
                this._totalFormatter = function (data, callback) {
                    self._data.totalFormatter(data, callback);
                };
            }
            if (value.error && typeof value.error === 'function') {
                Report.error = function () {
                    self._data.error.apply(self._data, arguments);
                };
            }
            this._data = value;
            return this._child;
        },

        render: function (callback) {
            return this._parent.render(callback);
        },

        totalFormatter: function (newFormatter) {
            if (!arguments.length) {
                return this._totalFormatter;
            }
            if (newFormatter === null || typeof newFormatter !== 'function') {
                this._totalFormatter = function (data, callback) {
                    callback(null, data);
                };
            } else {
                this._totalFormatter = newFormatter;
            }
            return this._child;
        },

        /**
         * Renders the Current DataSet
         * @param Rpt
         * @param State
         * @param [currentData]
         * @private
         */
        _renderIt: function (Rpt, State, currentData, callback) {

            var self = this;
            var pageData = null;
            var dataLength = 0, pageLength = 0, curRecord = -1;
            var groupCount = 0, groupSize = 0;
            var pageCount = 0, pagedGroups = 1;
            var groupContinueCount = 0;


            var groupContinue = function () {
                groupContinueCount++;


                // We can Exceed the stack if we don't allow it to unwind occasionally; so we breath every 10th call.
                if ((groupContinueCount % 11) === 0) {
                    setImmediate(groupContinue);
                    return;
                }


                curRecord++;
                if (groupCount === groupSize) {
                    if (pageCount === pagedGroups) {
                        // Run the Final Footers
                        return self._child._renderFooter(Rpt, State, callback);

                    } else {
                        // Load next data Page
                        return loadPageData(pageCount);
                    }
                } else {
                    groupCount++;
                    self._child._renderIt(Rpt, State, pageData[curRecord], groupContinue);
                }
            };


            // This starts the Rendering of a record and sets up the
            var renderData = function (err, data) {

                if (err) {
                    Report.error("REPORTAPI: Error in rendering data: ", err);
                    return callback(err);
                }
                var i;
                groupSize = data.length;
                groupCount = 0;
                pageCount++;

                // In the case we are dealing with a unpaged dataset that
                // returns all its data at once, we just skip the paging process
                if (groupSize === dataLength) {
                    pageCount = pagedGroups;
                }
                pageData = data;

                groupContinue();
            };


            // This will load a page of data
            var loadPageData = function (id) {
                var start = id * 100, end = (id + 1) * 100;
                if (end > dataLength) {
                    end = dataLength;
                }

                // Reset back to first row when we get a new data set loaded
                curRecord = -1;

                if (self._data.loadrange) {
                    self._data.loadrange(start, end, renderData);
                } else {
                    self._data.loadRange(start, end, renderData); // Trying the propercase version...
                }
            };


            // If we have a raw array; we just start the rendering
            if (this._dataType === 0) {
                dataLength = this._data.length;
                renderData(null, this._data);
            }

            // This is a class/Function that implement "count" and "loadRange"
            // So we start by asking for the count, it will call the paging code
            else if (this._dataType === 1) {
                this._data.count(
                    function (err, length) {
                        if (err) {
                            Report.error("REPORTAPI: Got error getting count: ", err);
                            length = 0;
                        }

                        if (isNaN(length)) {
                            Report.error("REPORTAPI: Got a non-number row length/count", length);
                            length = 0;
                        }

                        dataLength = length;
                        if (length === 0) {
                            groupSize = 1;
                            groupCount = pageCount = pagedGroups = 0;
                            groupContinue();
                        } else {
                            pagedGroups = parseInt(length / 100, 10);
                            if (pagedGroups * 100 < length) {
                                pagedGroups++;
                            }
                            loadPageData(0);
                        }
                    });

            }
        },

        _setChild: function (newChild) {
            this._child = newChild;
        },

        _calculateFixedSizes: function (Rpt) {
            if (this._child !== null) {
                var bogusData = {}, key;
                if (this._data !== null) {
                    for (key in this._data[0]) {
                        if (this._data[0].hasOwnProperty(key)) {
                            bogusData[key] = "";
                        }
                    }
                }

                this._child._calculateFixedSizes(Rpt, bogusData);
            }
        }

    };

    /***
     * This is the Report Section Functions
     * @type {Object}
     */
    ReportSection.prototype = {
        _isSection: true,

        addDataSet: function (dataSet) {
            if (!arguments.length) {
                dataSet = new ReportDataSet(this);
                this._children.push(dataSet._parent);
            } else {
                this._addSubObject(dataSet);
            }
            return (dataSet);
        },

        addSection: function (section) {
            if (!arguments.length) {
                section = new ReportSection(this);
                this._children.push(section);
            } else {
                this._addSubObject(section);
            }
            return (section);
        },

        addReport: function (report) {
            if (!arguments.length) {
                report = new Report(this);
                this._children.push(report);
            } else {
                this._addSubObject(report);
            }
            return (report);
        },

        // This starts the rendering process properly by chaining to the parent Report
        render: function (callback) {
            return this._parent.render(callback);
        },

        _addSubObject: function (item) {
            var parent = item;
            while (parent._parent) {
                parent = parent._parent;
            }
            parent._parent = this;
            this._children.push(parent);
        },

        // This actually does the Rendering
        _renderIt: function (Rpt, State, currentData, callback) {
            var priorStart = [State.startX, State.startY];
            State.priorStart.shift(priorStart);
            State.startX = Rpt.getCurrentX();
            State.startY = Rpt.getCurrentY();
            var self = this;

            var cnt = -1;
            var renderGroup = function () {
                cnt++;
                if (cnt < self._children.length) {
                    State.currentY = Rpt.getCurrentY();
                    State.currentX = Rpt.getCurrentX();
                    self._children[cnt]._renderIt(Rpt, State, currentData, renderGroup);
                } else {
                    State.priorStart.unshift();
                    State.startX = priorStart[0];
                    State.startY = priorStart[1];
                    callback();
                }
            };
            renderGroup();

        },

        _renderFooter: function (Rpt, State, callback) {
            var i, cnt = this._children.length, done = 0;
            var callbacktracker = function () {
                done++;
                if (done === cnt) {
                    callback();
                }
            };
            for (i = 0; i < cnt; i++) {
                this._children[i]._renderFooter(Rpt, State, callbacktracker);
            }
        },

        // Used to figure out the page usage size of header/footers
        _calculateFixedSizes: function (Rpt) {
            var i;
            for (i = 0; i < this._children.length; i++) {
                this._children[i]._calculateFixedSizes(Rpt);
            }
        }
    };

    ReportGroup.prototype = {
        _isGroup: true,

        userdata: function (value) {
            var parentReport = null;
            if (!arguments.length) {
                do
                {
                    parentReport = this._findParentReport(parentReport);
                    var data = parentReport.userdata();
                    if (data !== null) {
                        return (data);
                    }
                }
                while (!parentReport.isRootReport());

                // No userdata found from where this group is in the tree up to the ROOT Report
                // So, then we will create a empty userdata object, since if you are accessing it
                // you will probably be "adding" some user data and so then the
                // expectation is that it will be saved if you change it.
                var newUserData = {};
                parentReport.userdata(newUserData);

                return (newUserData);
            }
            parentReport = this._findParentReport();
            parentReport.userdata(value);
            return (this);
        },

        totalFormatter: function (value) {
            var parentDataSet = this._findParentDataSet();
            if (!arguments.length) {
                return parentDataSet.totalFormatter();
            }
            parentDataSet.totalFormatter(value);
            return (this);
        },

        data: function (value, scope) {
            var parentDataSet = this._findParentDataSet();
            if (!arguments.length) {
                return parentDataSet.data();
            }
            parentDataSet.data(value, scope);
            return (this);
        },

        detail: function (value, settings) {
            if (!arguments.length) {
                return (this._detail);
            }
            this._afterSubgroup = getSettings(settings, "afterSubgroup", false);
            this._detail = value;
            return (this);
        },

        groupBy: function (field) {
            var parent, newGroup;
            // GroupBy Appends a group to another Group, except in the case this is the
            //   final group; then the final group must come last; so then this group is then inserted in the chain
            if (this._groupOnField === null) {
                parent = this._parent;
                newGroup = new ReportGroup(parent);
                parent._setChild(newGroup);
                newGroup._setChild(this);
                this._parent = newGroup;
            } else {
                newGroup = new ReportGroup(this);
                newGroup._child = this._child;
                if (this._child !== null) {
                    this._child._parent = newGroup;
                }
                this._child = newGroup;
            }

            // Set the New Groups field to group on.
            newGroup._groupOn(field);

            return (newGroup);
        },

        sum: function (field) {
            this._math.push([1, field]);
            return (this);
        },

        average: function (field) {
            this._math.push([2, field]);
            return (this);
        },

        min: function (field) {
            this._math.push([3, field]);
            return (this);
        },

        max: function (field) {
            this._math.push([4, field]);
            return (this);
        },

        count: function (field) {
            this._math.push([5, field]);
            return (this);
        },

        pageHeader: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._pageHeader();
            }
            ds._pageHeader(value, settings);
            return (this);
        },

        pageFooter: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._pageFooter();
            }
            ds._pageFooter(value, settings);
            return (this);
        },

        titleHeader: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._titleHeader();
            }
            ds._titleHeader(value, settings);
            return (this);
        },

        finalSummary: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._finalSummary();
            }
            ds._finalSummary(value, settings);
            return (this);
        },

        header: function (value, settings) {
            if (this._header === null) {
                this._header = new ReportHeaderFooter(true);
            }
            if (arguments.length) {
                this._header.set(value, settings);
                return this;
            }
            return (this._header.get());
        },

        footer: function (value, settings) {
            if (this._footer === null) {
                this._footer = new ReportHeaderFooter(false);
            }
            if (arguments.length) {
                this._footer.set(value, settings);
                return this;
            }
            return (this._footer.get());
        },

        render: function (callback) {
            var rpt = this._findRootReport();
            return rpt.render(callback);
        },

        printStructure: function () {
            var top = this._findRootReport();
            printStructure(top, 0);
        },

        landscape: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.landscape();
            }
            parentReport.landscape(value);
            return this;
        },

        paper: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.paper();
            }
            parentReport.paper(value);
            return this;
        },

        font: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.font();
            }
            parentReport.font(value);
            return this;
        },

        margins: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.margins();
            }
            parentReport.margins(value);
            return this;
        },

        autoPrint: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.autoPrint();
            }
            parentReport.autoPrint(value);
            return this;
        },


        fontSize: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.fontSize();
            }
            parentReport.fontSize(value);
            return this;
        },

        _clearTotals: function () {
            var i, max, field;
            // Make sure to Zero out any keys if this is a new structure
            for (i = 0, max = this._math.length; i < max; i++) {
                field = this._math[i][1];
                this._totals[field] = 0;

                // If you add any to this Switch, make sure you update the switch in the _calcTotals
                switch (this._math[i][0]) {
                    case 1: // Sum
                        break;
                    case 2: // Avg
                        this._totals[field + "_sum"] = 0;
                        this._totals[field + "_cnt"] = 0;
                        break;
                    case 3: // Min
                        this._totals[field + "_min"] = 0;
                        break;
                    case 4: // Max
                        break;
                    case 5: // Count
                        break;
                }
            }

        },

        _calcTotals: function (currentData) {
            var i, max, field, srcField;
            for (i = 0, max = this._math.length; i < max; i++) {
                field = this._math[i][1];
                srcField = field;
                if (currentData[field + "_original"] !== undefined) {
                    srcField += "_original";
                }
                // If you add any to this Switch, make sure you update the switch in the _clearTotals
                switch (this._math[i][0]) {
                    case 1: // Sum
                        this._totals[field] += currentData[srcField];
                        break;
                    case 2: // Average
                        this._totals[field + "_sum"] += currentData[srcField];
                        this._totals[field + "_cnt"] += 1;
                        this._totals[field] = this._totals[field + "_sum"] / this._totals[field + "_cnt"];
                        break;
                    case 3: // Min
                        if (this._totals[field + "_min"] === 0 || currentData[srcField] < this._totals[field]) {
                            this._totals[field + "_min"] = 1;
                            this._totals[field] = currentData[srcField];
                        }
                        break;
                    case 4: // max
                        if (this._totals[field] < currentData[srcField]) {
                            this._totals[field] = currentData[srcField];
                        }
                        break;
                    case 5: // Count
                        this._totals[field]++;
                        break;
                    default:
                        Report.error("REPORTAPI: Math expression id is wrong", this._math[i][0], " on ", field);
                }
            }
        },

        _renderFooter: function (Rpt, State, callback) {
            var self = this;
            var finishFooter = function () {
                if (self._footer !== null) {
                    if (self._curBandWidth.length > 0) {
                        Rpt.bandWidth(self._curBandWidth);
                    }
                    self._expandRowTree(self._lastData);
                    self._footer.run(Rpt, State, self._lastData);
                }
                callback();
            };

            var setuptotals = function () {
                Rpt.totals = clone(self._totals);
                var parent = self._findParentDataSet();
                var found = false;
                for (var a in Rpt.totals) {
                    if (Rpt.totals.hasOwnProperty(a)) {
                        found = true;
                        break;
                    }
                }
                //found = false;
                if (!found) {
                    finishFooter();
                } else {
                    var x = function (err, data) {
                        if (err) {
                            Report.error("---- ERROR:", err);
                        }
                        Rpt.totals = data;
                        finishFooter();
                    };
                    parent._totalFormatter(Rpt.totals, x);
                    self._expandRowTree(Rpt.totals);
                }
            };


            if (this._child !== null) {
                this._child._renderFooter(Rpt, State, setuptotals);
            } else {
                setuptotals();
            }
        },

        _renderIt: function (Rpt, State, currentData, callback) {
            var groupChanged = false, self = this;
            if (this._level === -1) {
                this._level = (++Rpt._totalLevels);
            }


            // This handles the remainder of the rending of this detail section
            var finishRenderGroup = function () {
                if (self._afterSubgroup && self._detail !== null) {
                    try {
                        Rpt._level = self._level;
                        self._expandRowTree(currentData);
                        self._detail(Rpt, currentData, State);
                    } catch (err) {
                        Report.error("REPORTAPI: Error when calling group Detail", err, err & err.stack);
                    }
                }

                self._calcTotals(currentData);

                // We need to capture the Primary Band sizes for later use in the footers.
                if (self._groupOnField === null) {
                    if (!self._calculatedBands) {
                        self._calculatedBands = true;
                        self._curBandWidth = Rpt.bandWidth();
                        self._findParentReport()._setBandSize(Rpt.bandWidth());
                    }
                }
                callback();
            };


            // this handles doing the pre-detail (if set)
            var continueRendering = function () {
                // Run our Detail before a subgroup
                if (!self._afterSubgroup && self._detail !== null) {
                    try {
                        Rpt._level = self._level;
                        self._expandRowTree(currentData);
                        self._detail(Rpt, currentData, State);
                    } catch (err) {
                        Report.error("REPORTAPI: Error when calling group Detail", err, err & err.stack);
                    }
                }
                if (self._child !== null) {
                    self._child._renderIt(Rpt, State, currentData, finishRenderGroup);
                } else {
                    finishRenderGroup();
                }
            };

            // Handles the Group Change code
            var groupChangeCallback = function () {
                if (self._footer !== null) {
                    self._lastData = clone(currentData);
                }

                // We only clear the totals on added groups; not the master "detail" group.
                if (self._groupOnField !== null) {
                    self._clearTotals();
                }

                if (self._header !== null) {
                    Rpt._level = self._level;
                    self._expandRowTree(currentData);
                    self._header.run(Rpt, State, currentData);
                }
                self._hasRanHeader = true;
                continueRendering();
            };

            // Check for group changed
            if (this._groupOnField !== null) {
                if (State.resetGroups) {
                    this._groupChecked = false;
                    this._hasRanHeader = false;
                }
                if (this._groupChecked === false || currentData[this._groupOnField] !== this._groupLastValue) {
                    State.resetGroups = true;
                    groupChanged = true;
                    this._groupChecked = true;
                    this._groupLastValue = currentData[this._groupOnField];
                }
            } else {
                State.resetGroups = false;
                groupChanged = true;
            }

            if (groupChanged) {
                if (this._hasRanHeader) {
                    Rpt._level = this._level;
                    this._renderFooter(Rpt, State, groupChangeCallback);
                } else {
                    groupChangeCallback();
                }
            } else {
                continueRendering();
            }

        },

        _calculateFixedSizes: function (Rpt, bogusData) {
            this._clearTotals();
            if (this._header !== null) {
                Rpt.addPage();
                this._header.run(Rpt, {isCalc: true}, bogusData);
            }
            Rpt.totals = this._totals;
            if (this._footer !== null) {
                Rpt.addPage();
                this._footer.run(Rpt, {isCalc: true}, bogusData);
            }
            if (this._child !== null) {
                this._child._calculateFixedSizes(Rpt, bogusData);
            }
        },

        _groupOn: function (field) {
            if (!arguments.length) {
                return (this._groupOnField);
            }
            this._groupOnField = field;
            return (this);
        },

        _setChild: function (newChild) {
            this._child = newChild;
        },

        /**
         * Finds the Root Report
         * @return {Report}
         * @private
         */
        _findRootReport: function () {
            var parent = this;
            while (parent._parent) {
                parent = parent._parent;
            }
            return parent;
        },

        /**
         * Finds the Parent Report
         * @param [start]
         * @return {Report} the Parent Report
         * @private
         */
        _findParentReport: function (start) {
            var parent = this._parent;
            if (arguments.length && start !== null) {
                if (start.isRootReport()) {
                    return (start);
                } else {
                    parent = start._parent;
                }
            }

            while (!parent._isReport) {
                parent = parent._parent;
            }
            return (parent);
        },

        /**
         * Finds the DataSet controlling this Group
         * @return {ReportDataSet}
         * @private
         */
        _findParentDataSet: function () {
            var parent = this._parent;
            while (!parent._isDataSet) {
                parent = parent._parent;
            }
            return (parent);
        },

        /**
         * Expands a row into a tree of objects.
         * @param target
         */
        _expandRowTree: function (target) {
            for (var prop in target) {
                var propSplit = prop.split('.');
                var count = propSplit.length;
                if (count <= 1) continue;

                var lastObj = target;
                for (var i = 0; i < count; i++) {
                    var obj = lastObj[propSplit[i]];
                    obj = lastObj[propSplit[i]] = (i == (count - 1)) ?
                        target[prop] :
                        (obj !== null && obj !== undefined && typeof obj == 'object') ?
                            obj :
                        {};
                    lastObj = obj;
                }
            }
            return target;
        }
    };

    // Lowercase Prototypes
    Report.scopeddataobject = ScopedDataObject;
    lowerPrototypes(Report.prototype);
    lowerPrototypes(ReportGroup.prototype);
    lowerPrototypes(ReportSection.prototype);
    lowerPrototypes(ReportDataSet.prototype);
    lowerPrototypes(PDFWrapper.prototype);


    // Font constants
    Report.fonts = {
        times: {normal: 'Times-Roman', bold: 'Times-Bold', italic: 'Times-Italic', bolditalic: 'Times-BoldItalic'},
        helvetica: {normal: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique', bolditalic: 'Helvetica-BoldOblique'},
        courier: {normal: 'Courier', bold: 'Courier-Bold', italic: 'Courier-Oblique', bolditalic: 'Courier-BoldOblique'},
        symbol: {normal: 'Symbol'},
        dingbats: {normal: 'ZapfDingbats'}
    };
    var fontIndex = {};
    for (var font in Report.fonts) {
        if (Report.fonts.hasOwnProperty(font)) {
            font = Report.fonts[font];
            for (var fontType in font) {
                if (font.hasOwnProperty(fontType)) {
                    fontIndex[font[fontType]] = font;
                }
            }
        }
    }
    Report.fonts._index = fontIndex;

    // Formatting constants
    Report.format = {
        off: 0,
        on: 1,
        withFormatted: 2,
        withformatted: 2,
        withOriginal: 3,
        withoriginal: 3
    };

    if (!Report.error) {
        Report.error = error;
    }


    /// ---------------------- Don't Copy below this line
    _global.Report = Report;

}(typeof exports === 'undefined' ? this : exports));
