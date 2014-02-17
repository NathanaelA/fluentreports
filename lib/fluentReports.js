/*
 --------------------------------------
 (c)2012-2014, Kellpro, Inc.
 --------------------------------------
 FluentReports is under The MIT License (MIT)

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

/**
 * @author Nathanael Anderson, Mark Getz, Alan Henager
 * @copyright 2012-2014, Kellpro Inc.
 * @license MIT
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
                // Don't lowercase internal prototypes
                if (proto[0] === '_') {
                    continue;
                }
                lowerProto = proto.toLowerCase();
                // If the prototype is already lowercased, then we skip
                if (lowerProto === proto) {
                    continue;
                }
                // verify it is a function
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
     * @namespace Report.
     * ReportSection
     * @desc This is a Report Section that allows multiple DataSets for laying out a report.
     * @param parent object, typically another section, group or report object
     * @constructor
     */
    function ReportSection(parent) {
        this._children = [];
        this._parent = parent;
    }

    /**
     * @namespace Report.
     * pdfWrapper
     * @classdesc This is the Wrapper around the PDFKit, could be used to wrap any output library.
     * @desc this is the REPORT object passed into your callbacks.
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
        this._negativeParentheses = false;
        this._footerSize = 0;
        this._bandFields = [];
        this._heightOfString = 0;
        this._graphicState = [];
        this._fillColor = "black";
        this._strokeColor = "black";
        this._fillOpacity = 1;

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
            if (options.fonts) {
                this._fonts = options.fonts;
            }
            if (options.registeredFonts) {
                this._registeredFonts = options.registeredFonts;
            }
            if (options.info) {
                opt.info = options.info;
            }
        }

        if (!this._fonts) {
            this._fonts = clone(Report._indexedFonts);
        }
        if (!this._registeredFonts) {
            this._registeredFonts = {};
        }

        this._PDF = new this._PDFKit(opt);
        this._heightOfString = this._PDF.currentLineHeight(true);

        //noinspection JSHint
        for (var key in this._registeredFonts) {
           if (!this._registeredFonts.hasOwnProperty(key)) { continue; }
           //noinspection JSHint
           for (var style in this._registeredFonts[key]) {
                 if (!this._registeredFonts[key].hasOwnProperty(style)) { continue; }
                 if (style === 'normal') {
                     this._PDF.registerFont(key, this._registeredFonts[key][style], key);
                 } else {
                     this._PDF.registerFont(key+'-'+style, this._registeredFonts[key][style], key+'-'+style);
                 }

           }
        }

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
     * ReportHeaderFooter
     * @desc Creates a Object for tracking Header/Footer instances
     * @constructor
     * @private
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
     * @namespace Report.
     * ReportGroup
     * @desc This creates a Report Grouping
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
     * @namespace Report.
     * ReportDataSet
     * @desc This creates a Dataset Element for the Report
     * @param {ReportSection} parent - ReportSection element that is the parent of this object
     * @return {ReportGroup} - Returns a auto-generated ReportGroup tied to this reportDataSet
     * @constructor
     */
    function ReportDataSet(parent) {
        this._parent = parent;
        this._data = null;
        this._keys = null;
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

    /**
     * ScopedDataObject
     *  @desc Custom Data Object
     *  @desc This is a example method that is a paged data object
     *  @desc this is a linked to internal Kellpro data and functions;
     *  @desc but you can base your own page-able data object off of it (see prototype)
     **/
    function ScopedDataObject(data, scope, formattingState) {
        this._scope = scope;
        this._data = data;
        this._dataType = 0;
        this._formatters = null;
        this._result = null;

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

    /** @namespace
     * Report
     * @desc Primary Report Creation Object
     * @param {(string|object)} [parent] - Either the name of the report or a Report, Group, Section that this is to be a child of.
     * @param {object}[options] - default options for this report; landscape, paper, font, fontSize, autoPrint, fullScreen, negativeParentheses, autoCreate
     * @returns {*} - Either returns a ReportGroup in a standalone report, or itself if it is a sub-report
     * @constructor
     */
    function Report(parent, options) {
        options = options || {};
        this._reportName = "report.pdf";

        if (arguments.length) {
            if (typeof parent === "string" || typeof parent === "number") {
                this._parent = null;
                this._reportName = parent.toString();
            } else {
                if (parent._isReport) {
                    if (parent._child === null) {
                        parent._child = this;
                        this._parent = parent;
                    } else if (parent._child._isSection) {
                        parent._child.addReport(this);
                        this._parent = parent._child;
                    } else {
                        Report.error("REPORTAPI: Report was passed an invalid parent; resetting parent to none");
                        this._parent = null;
                    }
                } else if (parent._isSection || parent._isGroup) {
                    if (options.isSibling === true) {
                        var parentReport = parent;
                        while (!parentReport._isReport) {
                            parentReport = parentReport._parent;
                        }
                        parentReport._child.addReport(this);
                        this._parent = parentReport;
                    } else {
                        parent.addReport(this);
                        this._parent = parent;
                    }
                } else {
                    Report.error("REPORTAPI: Report was passed an invalid parent; resetting parent to none.");
                    this._parent = null;
                }
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
        this._landscape = options.landscape || false;
        this._paper = options.paper || "letter";
        this._font = options.font || "Helvetica";
        this._fontSize = options.fontSize || options.fontsize || 12;
        this._margins = options.margins || 72;
        this._autoPrint = options.autoPrint || options.autoprint || false;
        this._fullScreen = options.fullScreen || options.fullscreen || false;
        this._negativeParentheses = options.negativeParentheses || false;
        this._registeredFonts = {};
        this._fonts = clone(Report._indexedFonts);
        this._info = options.info || {};

        // We want to return a fully developed simple report (Report->Section->DataSet->Group) so we create it and then return the Group Object
        if (options.autocreate === false || options.autoCreate === false) {
            this._child = null;
            return this;
        } else {
            this._child = new ReportSection(this);
            this._detailGroup = this._child.addDataSet();
            return (this._detailGroup);
        }
    }


    Report.prototype = {
        _isReport: true,

        isRootReport: function () {
            return (this._parent === null);
        },

        fullScreen: function(value) {
            if (arguments.length) {
                this._fullScreen = value;
                return this;
            }
            return this._fullScreen;
        },

        autoPrint: function (value) {
            if (arguments.length) {
                this._autoPrint = value;
                return this;
            }
            return this._autoPrint;
        },

        negativeParentheses: function(value) {
          if (arguments.length) {
              this._negativeParentheses = value;
              return this;
          }
          return this._negativeParentheses;
        },

        render: function (callback) {

            if (this.isRootReport()) {
                var self = this;
                if (!callback) {
                    callback = null;
                }

                this._state = { isTitle: false, isFinal: false, headerSize: 0, footerSize: 0, isCalc: false,
                    resetGroups: true, startX: 0, startY: 0, currentX: 0, currentY: 0, priorStart: [], parentData: {}};

                this._info.Producer = "fluentReports";

                if (Report.trace) {
                    console.log("Starting Tracing on Report",this._reportName);
                }

                // These get passed into the two page Wrappers for Page building information
                var pageDefaults = {paper: this._paper, landscape: this._landscape, margins: this._margins, fonts: this._fonts, registeredFonts: this._registeredFonts, info: this._info};

                // Find out Sizes of all the Headers/Footers
                var testit = new PDFWrapper(this, pageDefaults);

                testit.font(this._font, this._fontSize);

                // Catch the Printing so that we can see if we can track the "offset" of the Footer in case the footer
                // is moved to a literal Y position (without it being based on the prior Y position)
                var offset = false;
                var oPrint = testit.print;
                var oBand = testit.band;

                testit.checkY = function(y) {
                    if (y == null) { return false; }
                    // Try and guess to see if the report is moving the Y based on a calculation or just a fixed location
                    // If it is "guessed" it is a fixed location, we will ignore it for calculating page sizes since it will always
                    // be a fixed location.
                    var cY = PDFWrapper.prototype.getCurrentY.call(testit);
                    var pS = this._PDF.page.height || 700;
                    if (y > cY+(pS / 3)) { return true; }
                    return false;
                };
                testit.band = function(data, options) {
                    if (offset) { return; }
                    if (this.checkY(options && options.y)) {
                        offset = true; return;
                    }
                    oBand.call(this, data, options);
                };
                testit.print = function(data, options) {
                    if (offset) { return; }
                    if (this.checkY(options && options.y)) {
                        offset = true; return;
                    }
                    oPrint.call(this, data, options);
                };
                testit.setCurrentY = function(y) {
                    if (this.checkY(y)) {
                        offset = true; return;
                    }
                    else { PDFWrapper.prototype.setCurrentY.call(testit, y); }
                };

                this._calculateFixedSizes(testit);
                testit = null;
                if (this._footer !== null) {
                    this._state.footerSize = this._footer._partHeight;
                }
                if (this._header !== null) {
                    this._state.headerSize = this._header._partHeight;
                }

                if (Report.trace) {
                    console.log("Generating real Report",this._reportName);
                }

                // Lets Run the Header
                var renderedReport = new PDFWrapper(this, pageDefaults);
                renderedReport.font(this._font, this._fontSize);
                renderedReport._setFooterSize(this._state.footerSize);
                renderedReport._setAutoPrint(this._autoPrint);
                renderedReport._setFullScreen(this._fullScreen);
                renderedReport.setNegativeParentheses(this._negativeParentheses);
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

                            renderedReport._bandWidth(self._curBandWidth);
                            if (self._tfooter !== null) {
                                self._tfooter.run(renderedReport, self._state, null);
                            }
                            else if (self._footer !== null) {
                                self._footer.run(renderedReport, self._state, null);
                            }
                            self._state.isFinal = false;

                            if (Report.trace) {
                                console.log("Report Writing to File", self._reportName);
                            }
                            renderedReport._write(self._reportName, function (err) {
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

        userData: function (value) {
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
            var font = this._fonts[this._font];
            switch (this._font) {
                case font.italic:
                case font.bolditalic:
                    if (font.bolditalic) {
                       this._font = font.bolditalic;
                    } else if (font.bold) {
                       this._font = font.bold;
                    }
                    break;
                default:
                    if (font.bold) {
                        this._font = font.bold;
                    }
                    break;
            }
        },

        fontItalic: function () {
            var font = this._fonts[this._font];
            switch (this._font) {
                case font.bold:
                case font.bolditalic:
                    if (font.bolditalic) {
                        this._font = font.bolditalic;
                    } else if (font.italic) {
                        this._font = font.italic;
                    }
                    break;
                default:
                    if (font.italic) {
                        this._font = font.italic;
                    }
                    break;
            }
        },

        fontNormal: function () {
            var font = this._fonts[this._font];
            if (font.normal) {
              this._font = font.normal;
            }
        },

        margins: function (value) {
            if (arguments.length) {
                this._margins = value;
            }
            return this._margins;
        },

        info: function(info) {
            if (arguments.length) {
                this._info = info;
            }
            return this._info;
        },

        registerFont:function(name, definition){
            if (this._state.hasOwnProperty("isTitle")) {
                Report.error("REPORTAPI: You cannot register a font while the report is running.");
                return;
            }

            if (definition.normal || definition.bold || definition.bolditalic || definition.italic) {
                this._registeredFonts[name] = definition;

                // Register in our structure so we can easily switch between Bold/Normal/Italic/etc
                this._fonts[name] = definition;
                for (var key in definition) {
                    if (definition.hasOwnProperty(key)) {
                        this._fonts[definition[key]] = definition;
                    }
                }
            } else {
                this._fonts[name] = this._registeredFonts[name] = {normal: definition};
            }
        },

        // --------------------------------------
        // Internal Private Variables & Functions
        // --------------------------------------

        _calculateFixedSizes: function (Rpt) {
            if (this._header !== null) {
                Rpt._addPage();
                this._header.run(Rpt, {isCalc: true}, null);
            }
            if (this._footer !== null) {
                Rpt._addPage();
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
            if (this._parent !== null) {
                State.resetGroups = true;

                // Copy Parent Data into this State so that we have access to it in this sub-report
                for (var key in currentData) {
                    if (currentData.hasOwnProperty(key)) {
                        State.parentData[key] = currentData[key];
                    }
                }

                this._detailGroup._clearTotals();
                var self = this;
                this._child._renderIt(Rpt, State, currentData, function() {
                    var parent = self;
                    // Find the first group above this report
                    while (parent._parent != null && !parent._isGroup) {
                        parent = parent._parent;
                    }
                    // iterate through the groups above this group and add this value to them so they get this sub-reports totals
                    while (parent._isGroup) {
                        for (var key in self._detailGroup._totals) {
                            if (self._detailGroup._totals.hasOwnProperty(key)) {
                                if (isNumber(parent._totals[key])) {
                                    parent._totals[key] += self._detailGroup._totals[key];
                                } else {
                                    parent._totals[key] = self._detailGroup._totals[key];
                                }
                            }
                        }
                        parent = parent._parent;
                    }

                    callback();
                });
            } else {
                this._child._renderIt(Rpt, State, currentData, callback );
            }
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

            if (Report.trace) {
                console.log("Running", this._isHeader ? "Header" : "Footer", Data);
            }

            if (this._isFunction) {
                try {
                    this._part(Rpt, Data, State);
                    if (Rpt._bandFields.length) { Rpt.band(); }
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

            Rpt.print("Page : " + Rpt.currentPage(), {align: "right", y: y});
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

            var i, bndSizes = Rpt._bandWidth();
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


        /**
         * @callback headerFooterCallback
         * @param {PDFWrapper} rpt - report object
         * @param {Object} Data - your Data line
         * @param {Object} State - the current state of the process
         */
    };


    // -----------------------------------------------------------
    // ScopedDataObject Prototypes
    // -----------------------------------------------------------
    ScopedDataObject.prototype = {

        // Used for Error Reporting (optional)
        error: function () {
            var args = [this._scope, null, 'error'];

            //noinspection JSHint
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

        // Used to load the data (Required)
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

        // Used to run a Query (Optional)
        query: function(data, callback) {
            if (arguments.length === 1) {
                callback = data;
                data = null;
            }
            var self = this;
            if (this._dataType === 2) {
                if (data !== null) {
                    for (var i=0;i<data.length;i++) {
                        if (typeof this._data.where.values[0] === "string") {
                            this._data.where.values[0] = data[i];
                        } else {
                            // multiple values
                            this._data.where.values[i].values[0] = data[i];
                        }
                    }
                }

                this._scope.funcs.q(this._scope,
                    function (err, data) {
                        // Error Occurred
                        if (err) {
                            self.error("REPORTAPI: Error in query: ", err);
                            self._result = null;
                            return callback(err);
                        }

                        // Single Record
                        if (!data.length && Object.prototype.toString.apply(data) === "[object Object]") {
                            self._result = [];
                            self._result.push(data);
                        } else {
                            // Result Array
                            self._result = data;
                        }
                        callback(null);
                    }, this._data, null);

            } else {
                callback(null);
            }
        },

        // Used to get a record count (Required)
        count: function (callback) {
            if (this._dataType === 2) {
                if (this._result && this._result.length) {
                    callback(null, this._result.length);
                } else {
                    var self = this;
                    this.query(function() {
                        var len = self._result.length;
                        return callback(null, len);
                    });
                }
            } else if (this._dataType === 1) {
                this._scope.funcs.rowsgetlength(this._scope, callback, this._data);
            } else {
                this.error("REPORTAPI: Unknown datatype in scopedDataObject(Count), either extend the scopedDataObject or create your own simple wrapper!");
            }
        },

        // Used to format the total line (Optional)
        totalFormatter: function (data, callback) {
            var self = this;

            try {
                self._scope.funcs.reportapi_handleformatters(self._scope, function (err, data) {
                    callback(err, data[0]);
                }, [data], self._formatters, self._formattingState);
            } catch (tferr) {
                this.error("REPORTAPI: Error in totalFormatter", tferr, tferr && tferr.stack);
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

        /**
         * Prints a image on the PDF
         * @param name - source file of the image
         * @param {object} [options] - width, height, fit
         */
        image: function (name, options) {
            options = options || {};
            this._pageHasRendering = true;
            this._PDF.image(name, options);
        },

        /**
         * Set the font
         * @param {string} name - name of font, or path to font
         * @param {number} [size] of font
         */
        font: function (name, size) {
            this._PDF.font(name, size);
            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        /**
         * Set the font size
         * @param {number} size of font
         * @returns {number} - font size
         */
        fontSize: function (size) {
            if (size == null) { return this._PDF._fontSize; }
            this._PDF.fontSize(size);
            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        /**
         * Bold the Font
         */
        fontBold: function () {
            var font = this._fonts[this._PDF._font.filename];
            if (!font) { return; }

            switch (this._PDF._font.filename) {
                case font.italic:
                case font.bolditalic:
                    if (font.bolditalic) {
                        this.font(font.bolditalic);
                    } else if (font.bold) {
                        this.font(font.bold);
                    }
                    break;
                default:
                    if (font.bold) {
                        this.font(font.bold);
                    }
                    break;
            }
            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        fillAndStroke: function(fillColor, strokeColor) {
           this._fillColor = fillColor;
           this._strokeColor = strokeColor;
           this._PDF.fillAndStroke(fillColor, strokeColor);
        },

        fill: function(fillColor) {
            if (arguments.length) {
                this._fillColor = fillColor;
                this._PDF.fill(fillColor);
            } else {
                this._PDF.fill();
            }
        },

        fillColor: function(color) {
           if (arguments.length) {
               if (color !== this._fillColor) {
                    this._fillColor = color;
                    this._PDF.fillColor(color);
               }
           }
           return this._fillColor;
        },

        fillOpacity: function(opacity) {
            if (arguments.length) {
                if (opacity !== this._fillOpacity) {
                    this._fillOpacity = opacity;
                    this._PDF.fillOpacity(opacity);
                }
            }
            return this._fillOpacity;

        },

        strokeColor: function(color) {
            if (arguments.length) {
                if (color !== this._strokeColor) {
                    this._strokeColor = color;
                    this._PDF.strokeColor(color);
                }
            }
            return this._strokeColor;
        },

        /**
         * Italicize the Font
         */
        fontItalic: function () {
            var font = this._fonts[this._PDF._font.filename];
            if (!font) { return; }

            switch (this._PDF._font.filename) {
                case font.bold:
                case font.bolditalic:
                    if (font.bolditalic) {
                        this.font(font.bolditalic);
                    } else if (font.italic) {
                        this.font(font.italic);
                    }
                    break;
                default:
                    if (font.italic) {
                        this.font(font.italic);
                    }
                    break;
            }
            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        /**
         * Make the Font Normal again (Remove Bold/Italic)
         */
        fontNormal: function () {
            var font = this._fonts[this._PDF._font.filename];
            if (font && font.normal) {
                this.font(font.normal);
            }
            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        /**
         * Margins of the paper;
         * @param {(number|object)} value - number will be set to all sides, the object you can specify a object with .left, .right, .top, and .bottom
         */
        setMargins: function (value) {
            this._margins = value;
        },

        /**
         * Enables/Disables Negative () instead of using the -
         * @param {boolean} value
         */
        setNegativeParentheses: function(value) {
            this._negativeParentheses = value;
        },

        /**
         * Paper size
         * @param {string} value - "letter", "legal", etc...
         * @returns {string} current value of paper setting.
         */
        paper: function (value) {
            if (arguments.length) {
                this._paper = value;
            }
            return (this._paper);
        },

        /**
         * Enable/disable Landscape mode
         * @param {boolean} value
         * @returns {boolean} - current mode it is in
         */
        landscape: function (value) {
            if (arguments.length) {
                this._landscape = value;
            }
            return (this._landscape);
        },

        /**
         * Saves the current graphic engine state
         */
        saveState: function() {
            var state = {font: this._PDF._font, fontSize: this._PDF._fontSize, lineWidth: this._lineWidth, x: this._PDF.x, fillColor: this._fillColor, strokeColor: this._strokeColor};
            this._graphicState.push(state);
        },

        /**
         * Resets the graphic state back
         */
        resetState: function() {
            var state = this._graphicState.pop();
            this._PDF._font = state.font;
            this.fontSize(state.fontSize);
            if (this._lineWidth !== state.lineWidth) {
                this.lineWidth(state.lineWidth);
            }
            this.fillColor(state.fillColor);
            this.strokeColor(state.strokeColor);
            this._PDF.x = state.x;

        },

        /**
         * Add a new Page; will check to see if anything has been rendered and if not; will not do anything
         */
        newPage: function (save) {
            if (!this._pageHasRendering) {
                return;
            }
            if (this._pageBreaking) {
                return;
            }
            if (save === true) {
                this.saveState();
            }
            this._pageBreaking = true;
            if (this._primaryReport && this._primaryReport._footer) {
                this._primaryReport._footer.run(this, this._primaryReport.state(), null);
            }
            this._addPage();
            if (this._primaryReport && this._primaryReport._header) {
                this._primaryReport._header.run(this, this._primaryReport.state(), null);
            }
            this._pageBreaking = false;
            if (save === true) {
                this.resetState();
            }
        },

        /**
         * Prints a standard header
         * @param {string} text to print in center of header
         */
        standardHeader: function (text) {
            this._curheaderfooter.runStockHeader(this, text);
        },

        /**
         * Prints a standard footer
         * @param {string} text
         */
        standardFooter: function (text) {
            this._curheaderfooter.runStockFooter(this, text);
        },

        /**
         * Current Page that is being generated
         * @returns {Number}
         */
        currentPage: function () {
            return this._PDF.pages.length;
        },

        /**
         * Current X position on the page
         * @returns {Number}
         */
        getCurrentX: function () {
            return this._PDF.x;
        },

        /**
         * Current Y position on the page
         * @returns {Number}
         */
        getCurrentY: function () {
            return this._PDF.y;
        },

        /**
         * Sets the Current X position
         * @param {number} x position; don't forget to include the margin your self in this case
         */
        setCurrentX: function (x) {
            this._PDF.x = x;
        },

        /**
         * Adds a number of the x coord from your current location
         * @param {number} x - number to add to the current X
         */
        addX: function(x) {
            this._PDF.x += x;
        },

        /**
         * Sets the Current Y position
         * @param {number} y position; don't forget the top margin
         */
        setCurrentY: function (y) {
            this._PDF.y = y;
        },

        /**
         * Add a number to the y coord from your current location
         * @param {number} y
         */
        addY: function(y) {
            this._PDF.y += y;
        },

        /**
         * Inserts new Lines
         * @param {number} [lines] - number of lines to insert defaults to 1
         */
        newLine: function (lines) {
            lines = lines || 1;
            for (var i = 0; i < lines; ++i) {
                this._PDF.moveDown();
                if (this._PDF.y >= this.maxY()) {
                    this.newPage();
                }
            }
        },

        /**
         * Returns the width of the string
         * @param {string} str
         * @returns {number} size of string
         */
        widthOfString: function (str) {
            return this._PDF.widthOfString(str);
        },

        /**
         * Returns the current height needed for a string
         * @returns {number} - height
         */
        heightOfString: function() {
            return this._heightOfString;
        },

        /**
         * Prints text on the PDF
         * @param {(String|Array)} data a string or an array of string values to be
         * @param {Object} options - a list of options (x,y,addX,addY,align,width,textWidth,font,fontSize,fontBold
         */
        print: function (data, options) {
            var i, max, textOptions = {};
            this._pageHasRendering = true;
            this._PDF.x = this._PDF.page.margins.left;
            this.saveState();

            if (options && typeof options === "object") {
                if (options.x) {
                    this._PDF.x = options.x;
                }
                if (options.addX) {
                    this._PDF.x += options.addX;
                }
                if (options.addx) {
                    this._PDF.x += options.addx;
                }
                if (options.y) {
                    this._PDF.y = options.y;
                }
                if (options.addY) {
                    this._PDF.y += options.addY;
                }
                if (options.addy) {
                    this._PDF.y += options.addy;
                }
                if (options.align) {
                    if (options.align + 0 > 0) {
                        switch (options.align) {
                            case Report.left: options.align = "left"; break;
                            case Report.center: options.align = "center"; break;
                            case Report.right: options.align = "right"; break;
                        }
                    }
                    textOptions.align = options.align;
                }
                if (options.textWidth || options.textwidth) {
                    textOptions.textWidth = options.textWidth || options.textwidth;
                }
                if (options.width) {
                    textOptions.width = options.width;
                }
                if (options.textColor || options.textcolor) {
                    this.fillColor(options.textColor || options.textcolor);
                    this.strokeColor(options.textColor || options.textcolor);
                }

                if (options.fontsize) {
                    this.fontSize(options.fontsize);
                } else if (options.fontSize) {
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


            var cachedMaxY = this.maxY() - this._heightOfString;
            if (isArray(data)) {
                for (i = 0, max = data.length; i < max; i++) {
                    if (data[i] !== null && data[i] !== undefined) {
                        if (this._PDF.y > cachedMaxY) {
                            this.newPage(true);
                        }
                        this._PDF.text(this._processText(data[i]), textOptions);
                    }
                }
            } else if (data !== null && data !== undefined) {
                if (this._PDF.y > cachedMaxY) {
                    this.newPage(true);
                }
                this._PDF.text(this._processText(data), textOptions);
            }

            this.resetState();

            if (this._PDF.y >= this.maxY()) {
                this.newPage();
            }

        },

        /**
         * Creates a Band Line that matches the width of the Band
         * @param thickness
         * @param verticalGap
         */
        bandLine: function (thickness, verticalGap) {
            thickness = thickness || 2;
            var i, bndSizes = this._bandWidth(), width, y = this.getCurrentY(), x = this.getCurrentX();

            for (i = 0, width = 0; i < bndSizes.length; i++) {
                width += bndSizes[i];
            }
            if (verticalGap) {
                y += verticalGap;
            }
            if (width > 0) {
                var oldLineWidth = this.lineWidth();
                this.lineWidth(thickness);
                this.line(x - 0.5, y - 2, width + x - 0.5, y - 2);
                this.lineWidth(oldLineWidth);
            }
            if (verticalGap) {
                this.setCurrentY(y + verticalGap);
            }
        },

        /**
         * Create a Line
         * @param {number} startX
         * @param {number} startY
         * @param {number} endX
         * @param {number} endY
         * @param {Object} options
         */
        line: function (startX, startY, endX, endY, options) {
            var x = this._PDF.x, y = this._PDF.y;
            this._pageHasRendering = true;
            this._PDF.moveTo(startX, startY);
            this._PDF.lineTo(endX, endY);
            this._handleOptions(options);
            this._PDF.x = x;
            this._PDF.y = y;
        },

        /**
         * Create A box
         * @param {number} startX
         * @param {number} startY
         * @param {number} endX
         * @param {number} endY
         * @param {Object} options
         */
        box: function (startX, startY, endX, endY, options) {
            this._pageHasRendering = true;
            this._PDF.rect(startX, startY, endX, endY);
            this._handleOptions(options);
        },

        /**
         * Creates a Circle
         * @param {number} startX
         * @param {number} startY
         * @param {number} radius
         * @param {object} options
         */
        circle: function(startX, startY, radius, options) {
            this._pageHasRendering = true;
            this._PDF.circle(startX,startY,radius);
            this._handleOptions(options);
        },

        /**
         * Adds a Band Field to the Band
         * @param data element
         * @param [width] of field
         * @param [alignment] of field
         */
        bandField: function(data, width, alignment) {
            var dta = {data: data};
            if (arguments.length >= 2) { dta.width = width; }
            if (arguments.length >= 3) { dta.align = alignment; }
            this._bandFields.push(dta);
        },

        /**
         * Creates a Suppression Band
         * @param {object} data - a object of your data row -- data can have a .force variable which will cause this "data" field to always print
         * @param {object} options - Options like "group" for grouping values,
         *                  and "duplicatedTextValue" for what you want printed - defaults to a single quote ' " '
         *                  and can contain any normal "band" options
         */
        suppressionBand: function (data, options) {
            if (data == null) {
                data = this._bandFields;
                this._bandFields = [];
            }

            options = options || {};

            if (!options.group) {
                options.group = "detail" + this._level;
            }
            var group = options.group;
            var originalData = clone(data);

            if (this._priorValues[group] !== undefined) {
                var cdata = this._priorValues[group];

                for (var i = cdata.length - 1; i >= 0; i--) {
                    if (data[i].force === true || data[i].force === 1) { continue; }
                    if (data[i].data === cdata[i].data && data[i].data !== '' && data[i].data !== null && data[i].data !== undefined) {
                        data[i].data = options.duplicatedTextValue || ' " ';
                    }
                    //else break;
                }
            }

            this.band(data, options);

            this._priorValues[group] = originalData;
        },

        /**
         * Band creates a Band where border and padding are including INSIDE the cell.  Gutter is outside.
         * @param {Array} dataIn is {data: value, width: width, align: alignment}
         * @param {Object} options
         */
        band: function (dataIn, options) {
            var i = 0, max = dataIn.length, maxWidth = 0, lineWidth = null;
            var defaultSize = 50, data = [], startX = this._PDF.page.margins.left;
            this._pageHasRendering = true;

            if (dataIn == null) {
                dataIn = this._bandFields;
                this._bandFields = [];
            } else if (this._bandFields.length) {
                // Run prior band fields if we are creating a new band
                this.band(null);
            }

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
                    }
                }
            }

            // This is to save the whole state for the band so we can reset it afterwords
            this.saveState();

            // Check to see if we have a "Settings"
            var padding = 1, border = 0, gutter = 0, collapse = true;
            if (arguments.length > 1 && typeof options === 'object') {
                if (options.gutter > 0) {
                    gutter = options.gutter + 0;
                    if (gutter !== 0) {
                        collapse = false;
                    }
                }
                if (options.collapse === true || options.collapse === false) {
                    collapse = options.collapse;
                }
                if (options.border > 0 || options.fill) {
                    maxWidth = 0;
                    for (i = 0; i < max; i++) {
                        maxWidth += (data[i].width || defaultSize);
                        if (i > 0) {
                            maxWidth += gutter;
                        }
                    }
                }
                if (options.border != null && !isNaN(options.border + 0)) {
                    border = lineWidth = options.border + 0;
                }
                if (options.padding != null && !isNaN(options.padding + 0)) {
                    padding = options.padding + 0;
                }
                if (options.x != null && !isNaN(options.x + 0)) {
                    startX += (options.x+0);
                }
                if (options.y != null && !isNaN(options.y + 0)) {
                    this._PDF.y = options.y + 0;
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
            var borderPadding = border + padding;

            // Do Data Fixup / cleanup / Figure wrapping
            var height = this._cleanData(data, options, defaultSize, borderPadding) + padding;


            // Check to see if we need to do a page feed before we print this band
            if (this._PDF.y + height >= this.maxY()) {
                this.newPage(true);
            }

            if (lineWidth !== null) {
                this.lineWidth(lineWidth);
            }
            this._curBand = [];
            var x = startX;
            var y = this._PDF.y - (collapse ? 1 : 0);

            var offset = 0, textOffset = 0;
            if (maxWidth > 0) {
                this.saveState(); // Save State it for the Border / fills
                if(options.fillOpacity || options.fillopacity){
                    this.fillOpacity(options.fillOpacity || options.fillopacity);
                }
                if(options.dash){
                    this._PDF.dash(options.dash);
                }
                if (options.bordercolor) {options.borderColor = options.bordercolor;}
                if (options.borderColor){
                    this.strokeColor(options.borderColor);
                }
                if (options.fill && options.border > 0) {
                    this._PDF.rect(x, y, maxWidth-1, height);
                    this.fillAndStroke(options.fill, (options.borderColor || options.fill));
                }
                else if (options.fill) {
                    this._PDF.rect(x, y, maxWidth-1, height);
                    this.fill(options.fill);
                }

                // Reset back to Defaults
                this.resetState();
                if (options.dash) {
                    this._PDF.undash();
                }
            }

            var originalFontSize = this.fontSize() , currentFill, currentStroke;
            if(options.textColor || options.textcolor){
                var textColor = options.textColor || options.textcolor;
                currentStroke = this._strokeColor;
                currentFill = this._fillColor;
                this.strokeColor(textColor);
                this.fillColor(textColor);
            }

            for (i = 0; i < max; i++) {
                var curWidth = (data[i].width || defaultSize);
                if (data[i].fill) {
                    this.saveState();
                    this._PDF.rect(x + offset, y, x + offset + curWidth, y + height);
                    this.fill(data[i].fill);
                    this.resetState();
                }
                var curData = data[i].data;
                var curFontSize = data[i].fontSize || data[i].fontsize || originalFontSize;
                this.fontSize(curFontSize);

                var curTextColor = data[i].textColor || data[i].textcolor;
                if (curTextColor) {
                    this.saveState();
                    this.strokeColor(curTextColor);
                    this.fillColor(curTextColor);
                }
                var wos = this.widthOfString(curData);
                if (data[i].align) {
                    if (data[i].align === 1 || data[i].align.toString().toLowerCase() === "left") {
                        // Left
                        textOffset = borderPadding - 1;
                    } else if (data[i].align === 2 || data[i].align.toString().toLowerCase() === "center") {
                        // Center
                        textOffset = (curWidth / 2) - (wos / 2);
                    } else if (data[i].align === 3 || data[i].align.toString().toLowerCase() === "right") {
                        // RIGHT Aligned
                        textOffset = (curWidth - wos) - borderPadding;
                    } else {
                        // Default to left
                        textOffset = borderPadding - 1;
                    }
                } else {
                    if (isNumber(curData)) {
                        // RIGHT Aligned
                        textOffset = (curWidth - wos) - borderPadding;
                    } else {
                        // Default to left
                        textOffset = borderPadding - 1;
                    }
                }
                if (textOffset < 0) {
                    textOffset = borderPadding - 1;
                }

                this._PDF.text(curData, x + offset + textOffset, y + borderPadding, {width: curWidth}).stroke();
                if (curTextColor) {
                    this.resetState();
                }

                offset += curWidth + gutter;
                this._curBand.push(curWidth);
            }

            if (options.textColor || options.textcolor) {
                if (currentStroke !== this._strokeColor) {
                    this.strokeColor(currentStroke);
                }
                if (currentFill !== this._fillColor) {
                    this.fillColor(currentFill);
                }
            }

            offset = 0;
            if(options.borderColor || options.bordercolor){
                this.strokeColor(options.borderColor || options.bordercolor);
            }

            for (i = 0; i < max; i++) {
                var dataElement = data[i];

                var currentWidth;
                if ((currentWidth = ((dataElement.border && dataElement.border.left) || lineWidth)) && (!collapse || (collapse && i === 0))) {
                    this.lineWidth(currentWidth);
                    this.line(x + offset, y, x + offset, y + height);
                }
                if ((currentWidth = ((dataElement.border && dataElement.border.top) || lineWidth)) > 0) {
                    this.lineWidth(currentWidth);
                    this.line((x + offset) - 0.5, y, x + (offset + (dataElement.width || defaultSize)) - 0.5, y);
                }
                if ((currentWidth = ((dataElement.border && dataElement.border.bottom) || lineWidth)) > 0) {
                    this.lineWidth(currentWidth);
                    this.line(x + offset - 0.5, y + height, x + (offset + (dataElement.width || defaultSize)) - 0.5, y + height);
                }
                offset += (dataElement.width || defaultSize);
                if ((currentWidth = ((dataElement.border && dataElement.border.right) || lineWidth)) > 0) {
                    this.lineWidth(currentWidth);
                    this.line(x + offset - currentWidth, y, x + offset - currentWidth, y + height);
                }

                offset += gutter;
            }

            this._PDF.x = x;
            this._PDF.y = y + height + 1; // add 1 for Whitespace

            this.resetState();

            if (this._PDF.y >= this.maxY()) {
                this.newPage();
            }

        },

        /**
         * Sets the line width
         * @param {number} width of line
         * @returns {number} current line width
         */
        lineWidth: function (width) {
            if (arguments.length) {
                this._lineWidth = width;
                this._PDF.lineWidth(width);
            }
            return this._lineWidth;
        },

        /**
         * Returns the last printed bands total Width
         * @returns {Number}
         */
        getLastBandWidth: function () {
            var width, i, sizes = this._bandWidth();
            for (i = 0, width = 0; i < sizes.length; i++) {
                width += sizes[i];
            }
            return width;
        },

        /**
         * Max Y Size
         * @returns {number}
         */
        maxY: function () {
            return this._PDF.page.maxY()-(this._footerSize);
        },

        /**
         * Max X size of page
         * @returns {number}
         */
        maxX: function () {
            return this._PDF.page.width - this._PDF.page.margins.right;
        },

        /**
         * pageNumber - prints the current page number
         * @param options {object} - options object with settings; "text" value can be changed from the default "Page: {0}" to what you want.
         */
        pageNumber: function (options) {
            if (!options.align) {
                options.align = "center";
            }
            var text = options.text || "Page: {0}";
            text = text.replace("{0}", this.currentPage());
            this._PDF.text(text, options);
        },

        /**
         * Add a new page
         * @private
         */
        _addPage: function () {
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

        /**
         * Process the value running it through formatting
         * @param value
         * @returns {string} - formated value
         * @private
         */
        _processText: function (value) {
            if (value === null || value === undefined) {
                return ('');
            }
            else if (typeof value.format === 'function') {
                if (isNumber(value)) {
                    return value.format({decimals: 2});
                } else {
                    return value.format();
                }
            }
            if (this._negativeParentheses && isNumber(value) && value < 0) {
                return '(' + Math.abs(value).toString() + ')';
            }
            return value.toString();
        },

        /**
         * Sets the fixed footer size of the pages
         * @param value
         * @private
         */
        _setFooterSize: function (value) {
            this._footerSize += value;
        },

        _handleOptions: function(options) {
            options = options || {};
            this.saveState();
            if (options.hasOwnProperty('fillOpacity')) { this.fillOpacity(options.fillOpacity); }
            if (options.hasOwnProperty('fillopacity')) { this.fillOpacity(options.fillopacity); }
            if (options.borderColor || options.bordercolor) { this.strokeColor(options.borderColor || options.bordercolor); }
            if (options.textColor || options.textcolor) { this.strokeColor(options.textColor || options.textcolor); }

            // This will Stroke and fill whatever shape we are doing
            if (options.fill) { this.fillAndStroke(options.fill, (options.textColor || options.textcolor || options.borderColor || options.bordercolor || options.fill)); }
            else { this._PDF.stroke(); }

            this.resetState();

        },

        _truncateText: function (data, width) {
            var curData;
            var offset = data.data.indexOf('\n');
            if (offset > 0) {
                curData = data.data.substr(0, offset);
            } else {
                curData = data.data;
            }
            var wos = this.widthOfString(curData);
            var dWidth = width;
            if (wos >= dWidth) {
                var len = 1;
                while (wos >= dWidth && len > 0) {
                    var wos_c = parseInt(wos / width, 10) + 1;
                    len = parseInt(curData.length / wos_c, 10) - 1;
                    curData = curData.substr(0, len);
                    wos = this.widthOfString(curData);
                }
            }
            data.data = curData;
            return 1;
        },

        _wrapText: function (data, width, ldata) {
            this._LWDoc.reset();
            ldata.width = width;

            // TODO: Remove the Split when the underlying Bug https://github.com/devongovett/pdfkit/pull/152 is fixed.
            this._LineWrapper.wrap(data.data.split('\n'), ldata);
            return this._LWDoc.count;
        },

        _cleanData: function (data, options, defaultSize, borderPadding) {
            var len = data.length;

            var formatText;
            var lineData = {width: 0, height: this.maxY()};
            if (options && options.wrap) {
                formatText = this._wrapText;
            } else {
                formatText = this._truncateText;
            }

            var maxLines = 1, curLines, maxFontSize= 1, bp = borderPadding * 2;
            var originalFontSize = this.fontSize();
            for (var i = 0; i < len; i++) {
                data[i].data = this._processText(data[i].data);
                var curFontSize = data[i].fontSize || data[i].fontsize || originalFontSize;
                if (curFontSize > maxFontSize) {
                    maxFontSize = curFontSize;
                }
                this._PDF.fontSize(curFontSize);

                curLines = formatText.call(this, data[i], (data[i].width || defaultSize) - bp, lineData);
                if (curLines > maxLines) {
                    maxLines = curLines;
                }
            }
            this._PDF.fontSize(maxFontSize);
            var lineSize = (maxLines * this._PDF.currentLineHeight(true));
            this._PDF.fontSize(originalFontSize);
            return lineSize;
        },

        /**
         * Enabled/Disables Auto-Print on open of PDF
         * @param {boolean} value
         * @private
         */
        _setAutoPrint: function (value) {
            if (value) {
                this._PDF.store.root.data.OpenAction = this._PDF.ref({Type: 'Action', S: 'Named', N: 'Print'});
            } else {
                if (this._PDF.store && this._PDF.store.root && this._PDF.store.root.data && this._PDF.store.root.data.OpenAction) {
                    delete this._PDF.store.root.data.OpenAction;
                }
            }
        },

        _setFullScreen: function(value) {
            if (value) {
                this._PDF.store.root.data.PageMode = "FullScreen";
            } else {
                if (this._PDF.store && this._PDF.store.root && this._PDF.store.root.data && this._PDF.store.root.data.PageMode) {
                    delete this._PDF.store.root.data.PageMode;
                }
            }

        },

        _bandWidth: function (value) {
            if (arguments.length) {
                this._curBand = clone(value);
            }
            return clone(this._curBand);
        },

        /**
         * Output the PDF
         * @param name
         * @param callback
         * @private
         */
        _write: function (name, callback) {
            this._PDF.write(name, callback);
        },

        // CONSTANTS
        left: 1,
        right: 3,
        center: 2,
        LEFT: 1,
        RIGHT: 3,
        CENTER: 2
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
                this._dataType = 0; // Normal passed preset data set
            } else if (typeof value === 'function' || typeof value === 'object') {
                if (value.count && (value.loadRange || value.loadrange)) {
                    this._dataType = 1;  // Pagable Dataset
                } else {
                    this._dataType = 2;  // Functional Dataset
                }
            } else {
                this._dataType = 0; // Assume normal passed dataset
                Report.error("REPORTAPI: Unknown data type; treating as an array of data.");
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

        keys: function (keys) {
           if (arguments.length) {
             this._keys = keys;
           }
           return this._keys;
        },


        _buildKeySet: function(currentData) {
            var keys=null;
            var keySet = this._keys || this._data.keys;

            if (currentData === null) { return null; }

            if (keySet != null) {
                if (typeof keySet === "string") {
                    keys = [currentData[keySet]];
                } else if (isArray(keySet)) {
                    keys = [];
                    for (var key in keySet) {
                        if (keySet.hasOwnProperty(key)) {
                            keys.push(currentData[keySet[key]]);
                        }
                    }
                }
            }
            return keys;
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
            var dataLength = 0, curRecord = -1;
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

                groupSize = data.length;
                groupCount = 0;
                pageCount++;

                // In the case we are dealing with a un-paged dataset that
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
                if (this._data === null) {
                    Report.error("REPORTAPI: data is empty, try adding a .data([{field: 'value',...}]) to the report.");
                    this._data = [''];
                }
                dataLength = this._data.length;
                renderData(null, this._data);
            }

            // This is a class/Function that implement "count" and "loadRange"
            // So we start by asking for the query (if needed), then the count, it will call the paging code
            else if (this._dataType === 1) {
              var startCount = function() {
                self._data.count(
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
              };

              if (this._data.query) {
                 this._data.query(this._buildKeySet(currentData), startCount);
              } else {
                  startCount();
              }

            // This is a simple query class, it should return all data either in a callback or as it return value
            } else if (this._dataType === 2) {
               var handleCb = false;
               var data = this._data(this._buildKeySet(currentData), function(err, ndata) {
                   if (err) {
                       Report.error("REPORTAPI: Error getting data", err);
                       ndata = [];
                   }
                   if (!handleCb) {
                       handleCb = true;
                       dataLength = ndata.length;
                       renderData(null, ndata);
                   }
               });
               if (data && !handleCb) {
                   handleCb = true;
                   dataLength = data.length;
                   renderData(null, data);
               }
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
            } else {
                this._addSubObject(report);
            }
            return (report);
        },

        dataSets: function() {
            var children=[];
            for (var i=0;i<this._children.length;i++) {
                if (this._children[i]._isDataSet) {
                    children.push(this._children[i]);
                }
            }
            return children;
        },

        sections: function() {
            var children=[];
            for (var i=0;i<this._children.length;i++) {
                if (this._children[i]._isSection) {
                    children.push(this._children[i]);
                }
            }
            return children;
        },

        subReports: function() {
          var children=[];
          for (var i=0;i<this._children.length;i++) {
              if (this._children[i]._isReport) {
                  children.push(this._children[i]);
              }
          }
          return children;
        },

        // This starts the rendering process properly by chaining to the parent Report
        render: function (callback) {
            return this._parent.render(callback);
        },

        _addSubObject: function (item) {
            var parent = item;

            if (item._parent == null) {
                item._parent = this;
            } else {
                var myParent = this._parent;
                var rootReport = this._parent;
                while (rootReport._parent !== null) {
                    rootReport = rootReport._parent;
                }
                while (parent._parent !== null && parent._parent !== myParent && parent._parent !== rootReport) {
                    parent = parent._parent;
                }
                if (parent._parent === null) {
                    parent._parent = this;
                }
            }
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

        userData: function (value) {
            var parentReport = null;
            if (!arguments.length) {
                do
                {
                    parentReport = this._findParentReport(parentReport);
                    var data = parentReport.userData();
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
            parentReport.userData(value);
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

        data: function (value) {
            var parentDataSet = this._findParentDataSet();
            if (!arguments.length) {
                return parentDataSet.data();
            }
            parentDataSet.data(value);
            return (this);
        },

        keys: function (value) {
            var parentDataSet = this._findParentDataSet();
            if (!arguments.length) {
                return parentDataSet.keys();
            }
            parentDataSet.keys(value);
            return (this);
        },

        addReport: function(rpt, options) {
            if (options && options.isSibling) {
                var parentReport = this._parent;
                while (!parentReport._isReport) {
                    parentReport = parentReport._parent;
                }
                parentReport._child.addReport(this);
            } else {
                if (this._groupOnField === null || this._child ) {
                    this._addToNullGroup(rpt);
                } else if (this._child != null && this._child._isSection) {
                    this._child.addReport(this);
                } else if (this._child != null && this._child._isGroup ) {
                    var child = this._child;
                    while (child._groupOnField !== null) {
                        child = child._child;
                    }
                    child._addToNullGroup(rpt);
                }
            }
        },

        /**
         * Sets the Report information headers
         * @param value
         * @returns {*}
         */
        info: function (value) {
            var ds = this._findRootReport();
            if (!arguments.length) {
                return ds.info();
            }
            ds.info(value);
            return (this);
        },

        /**
         * Prototype for a Detail Function Callback
         * @callback detailCallback
         * @param {PDFWrapper} Report  - report object
         * @param {Object} Data  - your Data line
         * @param [Object] ReportState - the current state of the process
         */

        /**
         * Adds a Detail section
         * @param {detailCallback} detailFunction to run for each detail record
         * @param {Object} settings for this detail function {afterSubgroup: "will print after a sub-group rather than before"}
         */
        detail: function (detailFunction, settings) {
            if (!arguments.length) {
                return (this._detail);
            }
            this._afterSubgroup = getSettings(settings, "afterSubgroup", false);
            this._detail = detailFunction;
            return (this);
        },

        /**
         * Sets a field for generating totals -- this is used to group the results
         * @param {string} field name to group on
         */
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

        /**
         * Sets a field for generating totals (sum)
         * @param {string} field name to sum
         */
        sum: function (field) {
            this._math.push([1, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (average)
         * @param {string} field name to average on
         */
        average: function (field) {
            this._math.push([2, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (minimum)
         * @param {string} field name to find the minimum on
         */
        min: function (field) {
            this._math.push([3, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (max)
         * @param {string} field name to find the maximum
         */
        max: function (field) {
            this._math.push([4, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (count)
         * @param {string} field name to count
         */
        count: function (field) {
            this._math.push([5, field]);
            return (this);
        },

        /**
         * Prototype for a Header or Footer Callback
         * @callback headerFooterCallback
         * @param {PDFWrapper} report - report object
         * @param {Object} Data - your Data line
         * @param [Object] State - the current state of the process
         */

        /**
         * Sets or gets the current page Header settings
         * @callback
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        pageHeader: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._pageHeader();
            }
            ds._pageHeader(value, settings);
            return (this);
        },

        /**
         * Sets or gets the current page footer settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        pageFooter: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._pageFooter();
            }
            ds._pageFooter(value, settings);
            return (this);
        },

        /**
         * Sets or gets the current title header settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        titleHeader: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._titleHeader();
            }
            ds._titleHeader(value, settings);
            return (this);
        },

        /**
         * Sets or gets the current final summary footer settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        finalSummary: function (value, settings) {
            var ds = this._findParentReport();
            if (!arguments.length) {
                return ds._finalSummary();
            }
            ds._finalSummary(value, settings);
            return (this);
        },

        /**
         * Sets or gets the current header settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
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

        /**
         * Sets or gets the current footer settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
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

        /**
         * Renders the report!
         * @param {function} callback to call when completed
         */
        render: function (callback) {
            var rpt = this._findRootReport();
            return rpt.render(callback);
        },

        /**
         * Prints the report structure to the console
        */
        printStructure: function () {
            var top = this._findRootReport();
            printStructure(top, 0);
        },

        /**
         * Sets or gets the current page is landscape
         * @param {boolean} [value=false] - true/false set landscape mode
         */
        landscape: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.landscape();
            }
            parentReport.landscape(value);
            return this;
        },

        /**
         * Sets or gets the current paper size
         * @param {string} [value="letter"] - value paper size to set it to (i.e. "letter", "legal")
         */
        paper: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.paper();
            }
            parentReport.paper(value);
            return this;
        },

        /**
         * Sets or gets the current font
         * @param {string} value - font name set it to
         */
        font: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.font();
            }
            parentReport.font(value);
            return this;
        },

        /**
         * Register a font for printing with
         * @param {string} name - Font Name
         * @param {(string|Object)} definition - Font Definition either path to file or object type:path ie {normal: path, bold: path, italic: path, boldItalic: path}
         */
        registerFont: function(name, definition) {
           var parentReport = this._findRootReport();
           parentReport.registerFont(name, definition);
           return this;
        },

        /**
         * Sets or gets the current margin size of paper
         * @param {number} [value=72] - margin size
         */
        margins: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.margins();
            }
            parentReport.margins(value);
            return this;
        },

        /**
         * Enabled/Disables the Automatic Print of PDF on Open
         * @param {boolean} [value=false] - true/false to auto-print
         */
        autoPrint: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.autoPrint();
            }
            parentReport.autoPrint(value);
            return this;
        },

        /**
         * Enabled/Disables the Automatic Full Screen of PDF on Open
         * @param {boolean} [value=false] - true/false to auto-full screen it
         */
        fullScreen: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.fullScreen();
            }
            parentReport.fullScreen(value);
            return this;
        },


        /**
         * Enables or Disables the (xxx.xx) around numbers instead of -xxx.xx
         * @param {boolean} value - enables or disables the ()/- modes
         */
        negativeParentheses: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.negativeParentheses();
            }
            parentReport.negativeParentheses(value);
            return this;
        },

        /**
         * Sets or gets the current font size
         * @param {number} value - font size to set it to
         */
        fontSize: function (value) {
            var parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.fontSize();
            }
            parentReport.fontSize(value);
            return this;
        },

        /**
         * Clear the Totals on a report
         * @private
         */
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

            // Sub-Reports can set new keys in this group's total, so if we are clearing totals; we need to clear them also.
            for (var key in this._totals) {
                if (this._totals.hasOwnProperty(key)) {
                    this._totals[key] = 0;
                }
            }

        },

        /**
         * Calculate Totals
         * @param {Object} currentData - The current data line
         * @private
         */
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

        /**
         * Renders the footer on this report object
         * @param {Report} Rpt - the report object
         * @param {Object} State - current state of report
         * @param {function} callback when done with the footers
         * @private
         */
        _renderFooter: function (Rpt, State, callback) {
            var self = this;
            var finishFooter = function () {
                if (self._footer !== null) {
                    if (self._curBandWidth.length > 0) {
                        Rpt._bandWidth(self._curBandWidth);
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


            if (this._child !== null && this._child._renderFooter) {
                this._child._renderFooter(Rpt, State, setuptotals);
            } else {
                setuptotals();
            }
        },

        /**
         * Renders this report object
         * @param {Report} Rpt - report object
         * @param {Object} State of the report
         * @param {Object} currentData - the current data
         * @param {function} callback - the callback when it is done rendering the report
         * @private
         */
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
                        if (Report.trace) {
                            console.log("Running Detail", self.level, currentData);
                        }
                        self._expandRowTree(currentData);
                        self._detail(Rpt, currentData, State);
                        if (Rpt._bandFields.length) { Rpt.band(); }
                    } catch (err) {
                        Report.error("REPORTAPI: Error when calling group Detail", err, err && err.stack);
                    }
                }

                self._calcTotals(currentData);

                // We need to capture the Primary Band sizes for later use in the footers.
                if (self._groupOnField === null) {
                    if (!self._calculatedBands) {
                        self._calculatedBands = true;
                        self._curBandWidth = Rpt._bandWidth();
                        self._findParentReport()._setBandSize(Rpt._bandWidth());
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
                        if (Report.trace) {
                            console.log("Running Detail", self.level, currentData);
                        }

                        self._expandRowTree(currentData);
                        self._detail(Rpt, currentData, State);
                        if (Rpt._bandFields.length) { Rpt.band(); }
                    } catch (err) {
                        Report.error("REPORTAPI: Error when calling group Detail", err, err && err.stack);
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

        /**
         * Figures out the size of the headers/footers for this report object
         * @param {Report} Rpt - current report we are running on
         * @param {Object} bogusData - bogus data
         * @private
         */
        _calculateFixedSizes: function (Rpt, bogusData) {
            this._clearTotals();
            if (this._header !== null) {
                Rpt._addPage();
                this._header.run(Rpt, {isCalc: true}, bogusData);
            }
            Rpt.totals = this._totals;
            if (this._footer !== null) {
                Rpt._addPage();
                this._footer.run(Rpt, {isCalc: true}, bogusData);
            }
            if (this._child !== null) {
                this._child._calculateFixedSizes(Rpt, bogusData);
            }
        },

        /**
         * Sets the field this report object groups on
         * @param {string} field - data field name to group by
         * @private
         */
        _groupOn: function (field) {
            if (!arguments.length) {
                return (this._groupOnField);
            }
            this._groupOnField = field;
            return (this);
        },

        /**
         * Sets a child Report
         * @param {Report} newChild - report object
         * @private
         */
        _setChild: function (newChild) {
            this._child = newChild;
        },

        /**
         * Sets up proper linking for group children when you have siblings or child reports
         * @param rpt
         * @private
         */
        _addToNullGroup: function(rpt) {
            if (this._child === null) {
                this._child = rpt;
            } else if (this._child._isSection) {
                this._child.addReport(rpt);
            } else {
                var c = this._child;
                var sec = new ReportSection(this);
                this._child = sec;
                c.parent = null;
                sec._addSubObject(c);
                sec.addReport(rpt);
            }
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
                if (target.hasOwnProperty(prop)) {
                    var propSplit = prop.split('.');
                    var count = propSplit.length;
                    if (count <= 1) { continue; }

                    var lastObj = target;
                    for (var i = 0; i < count; i++) {
                        var obj = lastObj[propSplit[i]];
                        obj = lastObj[propSplit[i]] = (i === (count - 1)) ?
                            target[prop] :
                            (obj !== null && obj !== undefined && typeof obj === 'object') ?
                                obj :
                            {};
                        lastObj = obj;
                    }
                }
            }
            return target;
        }

    };

    Report.buildFontIndex = function(fonts){
        var fontIndex = {};
        for (var font in fonts) {
            if (fonts.hasOwnProperty(font)) {
                font = fonts[font];
                for (var fontType in font) {
                    if (font.hasOwnProperty(fontType)) {
                        fontIndex[font[fontType]] = font;
                    }
                }
            }
        }
        return fontIndex;
    };

    // Standard Font constants
    Report.standardFonts = {
        times: {normal: 'Times-Roman', bold: 'Times-Bold', italic: 'Times-Italic', bolditalic: 'Times-BoldItalic'},
        helvetica: {normal: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique', bolditalic: 'Helvetica-BoldOblique'},
        courier: {normal: 'Courier', bold: 'Courier-Bold', italic: 'Courier-Oblique', bolditalic: 'Courier-BoldOblique'},
        symbol: {normal: 'Symbol'},
        dingbats: {normal: 'ZapfDingbats'}
    };

    // Generate the Indexed Fonts
    Report._indexedFonts = Report.buildFontIndex(Report.standardFonts);

    // Formatting constants
    Report.format = {
        off: 0,
        on: 1,
        withFormatted: 2,
        withformatted: 2,
        withOriginal: 3,
        withoriginal: 3
    };

    // Enable Tracing in the Report
    Report.trace = false;


    if (!Report.error) {
        Report.error = error;
    }


    // Lowercase Prototypes
    // I know this probably doesn't make any sense;
    // but this is needed for a project internal to our company
    // and this simplifies deploying fluentReports to leave it
    // intact in the fR codebase
    Report.scopeddataobject = ScopedDataObject;
    lowerPrototypes(Report.prototype);
    lowerPrototypes(ReportGroup.prototype);
    lowerPrototypes(ReportSection.prototype);
    lowerPrototypes(ReportDataSet.prototype);
    lowerPrototypes(PDFWrapper.prototype);

    Report.Group = Report.group = ReportGroup;
    Report.Section = Report.section = ReportSection;
    Report.DataSet = Report.dataset = ReportDataSet;


    /// ---------------------- Don't Copy below this line
    _global.Report = Report;

}(typeof exports === 'undefined' ? this : exports));
