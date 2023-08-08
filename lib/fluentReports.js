/*
 --------------------------------------
 (c)2012-2018, Kellpro, Inc.
 (c)2016-2023, Master Technology
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

//noinspection ThisExpressionReferencesGlobalObjectJS,JSHint
/**
 * @module fluentReports
 * @author Nathanael Anderson
 * @contributors Mark Getz, Alan Henager, Beau West, Marcus Christensson
 * @copyright 2012-2018, Kellpro Inc.
 * @copyright 2016-2022, Master Technology.
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

     (Optional) Sub-Report) ->
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
        if (typeof settingsObject[setting] !== 'undefined') {
            return settingsObject[setting];
        } else {
            const lSetting = setting.toLowerCase();
            if (typeof settingsObject[lSetting] !== 'undefined') {
                return settingsObject[lSetting];
            }
        }
        return defaultValue;
    }

    /**
     * This creates a lower case version of the prototypes
     * @param prototype
     */
    function lowerPrototypes(prototype) {
        let proto, lowerProto;
        for (proto in prototype) {
            if (prototype.hasOwnProperty(proto)) {
                // Don't lowercase internal prototypes
                if (proto[0] === '_') {
                    continue;
                }
                lowerProto = proto.toLowerCase();
                // If the prototype is already lower cased, then we skip
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
    function printStructure(reportObject, level, outputType) {
        if (reportObject === null) {
            return;
        }
        let i, j, added = (2 * level), pad = "", spad = '';
        for (i = 0; i < added; i++) {
            pad += "-";
            spad += " ";
        }

        const loopChildren = () => {
            if (reportObject._child) {
                printStructure(reportObject._child, level + 1, outputType);
            } else if (reportObject._children) {
                for (j = 0; j < reportObject._children.length; j++) {
                    printStructure(reportObject._children[j], level + 1, outputType);
                }
            }
        };

        if (reportObject._isReport) {
            if (reportObject._parent) {
                console.log(pad + "> Subreport                  (Height Exempt?)");
            } else {
                console.log(pad + "> Report                     (Height Exempt?)");
            }
        } else if (reportObject._isSection) {
            console.log(pad + "> Section");
        } else if (reportObject._isDataSet) {
            console.log(pad + "> DataSet");
        } else if (reportObject._isGroup) {
            console.log(pad + "> Group = " + reportObject._groupOnField);
            if (reportObject._math.length > 0) {
                console.log(pad + "= Totaling:", reportObject._math);
            }
        } else {
            console.log(pad + "> Unknown");
        }
        if (reportObject._theader !== null && reportObject._theader !== undefined) {
            console.log(spad + "  | Has Title Header ", typeof reportObject._theader._part === "function" ? reportObject._theader._part.length === 4 ? "(Async)" : "(Sync)" : "(Auto)", reportObject._theader._partHeight > 0 ? reportObject._theader._partHeight : '', reportObject._theader._isHeightExempt);
        }
        if (reportObject._header !== null && reportObject._header !== undefined) {
            if (reportObject._isReport) {
                console.log(spad + "  | Has Page Header", typeof reportObject._header._part === "function" ? reportObject._header._part.length === 4 ? "(Async)" : "(Sync)" : "(Auto)", reportObject._header._partHeight > 0 ? reportObject._header._partHeight : '', reportObject._header._isHeightExempt);
            } else {
                console.log(spad + "  | Has Header", typeof reportObject._header._part === "function" ? reportObject._header._part.length === 4 ? "(Async)" : "(Sync)" : "(Auto)", reportObject._header._partHeight > 0 ? reportObject._header._partHeight : '', reportObject._header._isHeightExempt);
            }
        }
        if (reportObject._detail !== null && reportObject._detail !== undefined) {
            console.log(spad + "  | Has Detail", reportObject._renderDetail === reportObject._renderAsyncDetail ? "(Async)" : reportObject._renderDetail === reportObject._renderSyncDetail ? "(Sync)" : reportObject._renderDetail === reportObject._renderBandDetail ? "(Auto Band)" : reportObject._renderDetail === reportObject._renderStringDetail ? "(Auto String)" : "Unknown");
        }

        if (outputType) { loopChildren(); }

        if (reportObject._footer !== null && reportObject._footer !== undefined) {
            if (reportObject._isReport) {
                console.log(spad + "  | Has Page Footer", typeof reportObject._footer._part === "function" ? reportObject._footer._part.length === 4 ? "(Async)" : "(Sync)" : "(Auto)", reportObject._footer._partHeight > 0 ? reportObject._footer._partHeight : '', reportObject._footer._isHeightExempt);
            } else {
                console.log(spad + "  | Has Footer", typeof reportObject._footer._part === "function" ? reportObject._footer._part.length === 4 ? "(Async)" : "(Sync)" : "(Auto)", reportObject._footer._partHeight > 0 ? reportObject._footer._partHeight : '', reportObject._footer._isHeightExempt);
            }
        }
        if (reportObject._tfooter !== null && reportObject._tfooter !== undefined) {
            console.log(spad + "  | Has Summary Footer", typeof reportObject._tfooter._part === "function" ? reportObject._tfooter._part.length === 4 ? "(Async)" : "(Sync)" : "(Auto)", reportObject._tfooter._partHeight > 0 ? reportObject._tfooter._partHeight : '', reportObject._tfooter._isHeightExempt);
        }

        if (!outputType) { loopChildren(); }
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
        return ((typeof num === 'string' || typeof num === 'number') && !isNaN(num - 0) && num !== '' );
    }

    /**
     * Clones the data -- this is a simple clone, it does *NOT* do any really DEEP copies;
     * but nothing in the report module needs a deep copy.
     * @param value
     * @return {*}
     */
    function clone(value) {
        let key, target = {}, i, aTarget = [];
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

    /**
     * Generic Error function that can be overridden with your own error code
     */
    function error() {
        if (!console || !console.error || arguments.length === 0) {
            return;
        }
        console.error.apply(console, arguments);
    }
    
    /**
     * @class ReportError
     * @desc This is a constructor for error details that are returned by fluentreports
     * @param detailsObject - detail Object, generally including some mix of error, error.stack, and an error code
     * @constructor
     */

    function ReportError(detailsObject) {
      for (let key in detailsObject) {
         if (!detailsObject.hasOwnProperty(key)) { continue; }
         this[key] = detailsObject[key];
      }
    }

    /**
     * This is a callback that just prints any errors, used for places a callback may not have been passed in.
     * @param err
     */
    function dummyCallback(err) {
        if (err) {
            Report.error(err);
        }
    }

    /**
     * This does a loop, used for Async code
     * @param total number of loops
     * @param runFunction - this is the function that will be called for each iteration
     * @param doneCallback - this is called when the loop is done
     */
    function startLoopingAsync(total, runFunction, doneCallback) {
        let counter = -1;
        const callbackLoop = () => {
            counter++;
            if (counter < total) {
                // Unwind this stack every so often
                if (counter % 10 === 0) {
                    setTimeout(() => { runFunction(counter, callbackLoop); }, 0);
                } else {
                    runFunction(counter, callbackLoop);
                }
            } else {
                doneCallback();
            }
        };
        callbackLoop();
    }

    /**
     * This does a loop, used for Sync code
     * @param total number of loops
     * @param runFunction - this is the function that will be called for each iteration
     * @param doneCallback - this is called when the loop is done
     */
    function startLoopingSync(total, runFunction, doneCallback) {
        let counter= 0;
        let hasAnotherLoop = true;
        const callbackLoop = (skipInc) => {
            if (skipInc !== true) { counter++; }
            if (counter < total) {
                // Unwind this stack every so ofter
                if (skipInc !== true && counter % 10 === 0) {
                    // Technically we don't have to reset this to true; as it is already true; but this is so that
                    // this function is readable by use mere humans several months from here.
                    hasAnotherLoop = true;
                } else {
                    runFunction(counter, callbackLoop);
                }
            } else {
                hasAnotherLoop = false;
            }
        };
        while (hasAnotherLoop) {
            callbackLoop(true);
        }
        doneCallback();
    }

    const reportRenderingMode = {UNDEFINED: 0, SYNC: 1, ASYNC: 2};

    // If any are added to this, you need to add the function, and update _calcTotals and _clearTotals,
    const mathTypes = {SUM: 1, AVERAGE: 2, MIN: 3, MAX: 4, COUNT: 5};

    const dataTypes = {NORMAL: 0, PAGEABLE: 1, FUNCTIONAL: 2, PLAINOLDDATA: 3, PARENT: 4};


    // -------------------------------------------------------
    // Report Objects
    // -------------------------------------------------------

    /**
     * ReportSection
     * @class ReportSection
     * @desc This is a Report Section that allows multiple DataSets for laying out a report.
     * @param parent object, typically another section, group or report object
     * @constructor
     * @alias ReportSection
     * @memberof Report
     */
    function ReportSection(parent) {
        this._children = [];
        this._parent = parent;
    }

    /**
     * ReportRenderer
     * @class ReportRenderer
     * @desc This is the Wrapper around the PDFKit, and could be used to wrap any output library.
     * @classdesc this is the RENDERER class passed into your callbacks during report generation.
     * @constructor
     * @alias ReportRenderer
     */
    function ReportRenderer(primaryReport, options) {

        this.totals = {};
        this._priorValues = {};
        this._pageHasRendering = 0;
        this._pageHeaderRendering = 0;
        this._curBand = [];
        this._curBandOffset = 0;
        this._primaryReport = primaryReport;
        this._pageBreaking = false;
        this._skipASYNCCheck = false;
        this._landscape = false;
        this._paper = "letter";
        this._margins = 72;
        this._lineWidth = 1;
        this._level = 0;
        this._totalLevels = 0;
        this._negativeParentheses = false;
        this._heightOfString = 0;
        this._graphicState = [];
        this._fillColor = "black";
        this._strokeColor = "black";
        this._fillOpacity = 1;
        this._rotated = 0;
        this._height = 0;
        this._reportHeight = 0;
        this._printedLines = [];
        this._pageNumbers = [];
        this._reportRenderMode = reportRenderingMode.UNDEFINED;

        let opt = {};
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
                if (typeof options.margins === 'number') {
                    opt.margin = options.margins;
                } else {
                    opt.margins = options.margins;
                }
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
        this._height = this._reportHeight = this._PDF.page.maxY();
        this._PDF.page.height = 99999;

        for (let key in this._registeredFonts) {
            if (!this._registeredFonts.hasOwnProperty(key)) { continue; }
            for (let style in this._registeredFonts[key]) {
                if (!this._registeredFonts[key].hasOwnProperty(style)) { continue; }
                if (style === 'normal') {
                    this._PDF.registerFont(key, this._registeredFonts[key][style]);
                } else {
                    this._PDF.registerFont(key+'-'+style, this._registeredFonts[key][style]);
                }

            }
        }

        // This is a PDFDoc emulated page wrapper so that we can detect how it will wrap things.
        const lwDoc = this._LWDoc = {
            count: 0, pages: 1, x: this._PDF.page.margins.left, y: this._PDF.page.margins.top, page: this._PDF.page, _PDF: this._PDF,
            currentLineHeight: function (val) { //noinspection JSPotentiallyInvalidUsageOfThis
                return this._PDF.currentLineHeight(val); },
            widthOfString: function (d, o) {
                let splitString = d.split(' '),
                    curWord,
                    wos = 0,
                    wordLength;
                for (let i = 0; i < splitString.length; ++i) {
                    curWord = splitString[i];
                    if ((i + 1) !== splitString.length) {
                        curWord += ' ';
                    }
                    //noinspection JSPotentiallyInvalidUsageOfThis
                    wordLength = this._PDF.widthOfString(curWord, o);
                    wos += wordLength;
                }

                return wos; },
            addPage: function () { this.pages++;
                //noinspection JSPotentiallyInvalidUsageOfThis
                this.x = this._PDF.page.margins.left;
                //noinspection JSPotentiallyInvalidUsageOfThis
                this.y = this._PDF.page.margins.top; },
            reset: function () { this.count = 0; this.pages = 0;  this.addPage(); }
        };

        // Create a new Line Wrapper Object, this allows us to handle Bands
        this._LineWrapper = new this._LineWrapperObject(lwDoc,{width:this._PDF.page.width - this._PDF.page.margins.right - this._PDF.page.margins.left, columns:1, columnGap: 18});
        this._LineWrapper.on('line', () => {
            lwDoc.count++;
        });

        // Create the Print wrapper; this allows us to wrap long print() calls onto multiple lines.
        this._PrintWrapper = new this._LineWrapperObject(lwDoc,{width:this._PDF.page.width - this._PDF.page.margins.right - this._PDF.page.margins.left, columns:1, columnGap: 18});
        this._PrintWrapper.on('line', (line, options) => {
            this._printedLines.push({L:line, O: options});
        });
    }

    /**
     * @class ReportHeaderFooter
     * @desc Creates a Object for tracking Header/Footer instances
     * @constructor
     * @alias ReportHeaderFooter
     * @memberof Report
     * @param isHeader
     * @param {boolean} [isSizeExempt] - is Size Exempt, this ONLY applies to page footers; as we don't want to "break" the page on a page footer.
     */
    function ReportHeaderFooter(isHeader, isSizeExempt) {
        this._part = null;
        this._isFunction = false;
        this._partHeight = -1;
        //noinspection JSUnusedGlobalSymbols
        this._partWidth = -1;
        this._pageBreakBefore = false;
        this._pageBreakAfter = false;
        this._isHeader = isHeader;
        // This only applies to Page FOOTERS, and the final summary FOOTER.   These are the only items that won't cause a page-break before/during printing.
        // Normally this is not a issue; but some people might use absolute Y coords and end up overflowing the page in the footer;
        // which then causes a major glitch in the rendering.   So instead we are just going to let the footer overflow the page and ignore the rest of the footer.
        // This is a much "cleaner" looking solution.
        this._isHeightExempt = isHeader ? false : !!isSizeExempt;
    }

    /**
     * ReportGroup
     * @class ReportGroup
     * @desc This creates a Report Grouping Section
     * @classdesc This Creates a new Report Grouping (This is the basic Building Block of the Report before you start rendering)
     * @constructor
     * @alias ReportGroup
     * @memberof Report
     * @param parent
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
        this._runDetailAfterSubgroup = false;
        this._runHeaderWhen = Report.show.newPageOnly;
        this._lastData = {};
        this._currentData = null;
        this._math = [];
        this._totals = {};
        this._curBandWidth = [];
        this._curBandOffset = 0;
        this._level = -1;
    }

    /**
     * ReportDataSet
     * @class ReportDataSet
     * @desc This creates a Dataset Element for the Report
     * @param {ReportSection} parent - ReportSection element that is the parent of this object
     * @param {string?} parentDataKey - parent dataset data key
     * @constructor
     * @alias ReportDataSet
     * @memberOf Report
     * @return {ReportGroup} - Returns a auto-generated ReportGroup tied to this reportDataSet
     */
    function ReportDataSet(parent, parentDataKey) {
        this._parent = parent;
        this._data = null;
        this._keys = null;
        this._dataType = dataTypes.NORMAL;
        if (parentDataKey) {
            this._dataType = dataTypes.PARENT;
            // noinspection JSUnusedGlobalSymbols
            this._parentDataKey = parentDataKey;
        }
        // noinspection JSUnusedGlobalSymbols
        this._recordCountCallback = null;
        this._child = new ReportGroup(this);
        if (this._parent && this._parent._parent === null) {
            this._child.header = this._child.pageHeader;
            this._child.footer = this._child.pageFooter;
        }
        this._totalFormatter = (data, callback) => {
            callback(null, data);
        };
        return (this._child);
    }


    /*
     *  This can be used as an a example method that is a paged data object.
     *  This is a linked to internal Kellpro data and functions;
     *  but you can base your own page-able data object off of it (see prototype)
     *  @private
     **/
    function ScopedDataObject(data, scope, formattingState) {
        this._scope = scope;
        this._data = data;
        this._dataType = dataTypes.NORMAL;
        this._formatters = null;
        this._result = null;

        if (formattingState !== null && formattingState !== undefined) {
            this._formattingState = formattingState;
        } else {
            this._formattingState = 0;
        }
        if (data._isQuery || data._isquery || typeof data === "string") {
            this._dataType = dataTypes.FUNCTIONAL;
        }
        else if (data.isRows) {
            this._dataType = dataTypes.PAGEABLE;
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

    /**
     * Report
     * @class Report
     * @desc Primary Report Creation Class
     * @param {(string|object|Report)} [parent] - Either the string name of the report to output to disk, "buffer" to output a buffer or a [Report, Group, or Section] that this is to be a child report of.
     * @param {object} [options] - default options for this report; landscape, paper, font, fontSize, autoPrint, fullScreen, negativeParentheses, autoCreate
     * @returns {ReportGroup|Report} - Normally returns a ReportGroup, or it can return itself if options.autoCreate is set to false
     */
    function Report(parent, options) { // jshint ignore:line
        options = options || {};
        this._reportName = "report.pdf";
        this._outputType = Report.renderType.file;
        this._runHeaderWhen = Report.show.always;

        if (arguments.length) {
            if (typeof parent === "string" || typeof parent === "number") {
                this._parent = null;
                if (parent.toString() === "buffer") {
                    this._outputType = Report.renderType.buffer;
                } else {
                    this._reportName = parent.toString();
                }
            } else if (typeof parent === "object" && typeof parent.write === "function" && typeof parent.end === "function") {
                this._parent = null;
                this._outputType = Report.renderType.pipe;
                this._pipe = parent;
            } else {
                if (parent == null) {
                    this._parent = null;
                } else if (parent._isReport) {
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
                        let parentReport = parent;
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

        this._reportMode = reportRenderingMode.UNDEFINED;
        this._theader = null;
        this._tfooter = null;
        this._header = null;
        this._footer = null;
        this._userdata = null;
        this._curBandWidth = [];
        this._curBandOffset = 0;
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
            // TODO: This path might need to be deleted/modified; it doesn't setup _child or _detailGroup which will break code later in the code base.
            this._child = null;
            return this;
        } else {
            this._child = new ReportSection(this);
            this._detailGroup = this._child.addDataSet();
            return (this._detailGroup);
        }
    }

    Report.prototype =
    /** @lends Report */
    {
        _isReport: true,

        /**
         * is this the Root Report
         * @desc Returns if this is the primary root report of the entire report set
         * @returns {boolean}
         */
        isRootReport: function () {
            return (this._parent === null);
        },

        /**
         * toggle pdf fullScreen
         * @desc Attempts to make the report full screen when enabled
         * @param value {boolean} - true to try and force the screen full size
         * @returns {*}
         */
        fullScreen: function(value) {
            if (arguments.length) {
                this._fullScreen = value;
                return this;
            }
            return this._fullScreen;
        },

        /**
         * Toggle auto print on open
         * @param {boolean} value - true to enable
         * @returns {*}
         */
        autoPrint: function (value) {
            if (arguments.length) {
                this._autoPrint = value;
                return this;
            }
            return this._autoPrint;
        },

        /**
         * Enables negative numbers to be autowrapped in (parans)
         * @param {boolean} value - true to enable
         * @returns {*}
         */
        negativeParentheses: function(value) {
            if (arguments.length) {
                this._negativeParentheses = value;
                return this;
            }
            return this._negativeParentheses;
        },

        /**
         * set the output Type
         * @param type {Report.renderType} - Type of output
         * @param to - Pipe or Filename
         */
        outputType: function(type, to) {
            if (arguments.length === 0) {
                return this._outputType;
            }
            if (typeof type === 'string') {
                if (type.toLowerCase() === 'buffer') {
                    this._outputType = Report.renderType.buffer;
                } else {
                    this._outputType = Report.renderType.file;
                    this._reportName = type;
                }
                return this;
            }
            if (typeof type === 'object' && typeof type.write === 'function' && typeof type.end === 'function') {
                this._outputType = Report.renderType.pipe;
                this._pipe = type;
                return this;
            }
            if (type === Report.renderType.pipe) {
                this._outputType = Report.renderType.pipe;
                if (to) {
                    this._pipe = to;
                }
            } else if (type === Report.renderType.buffer) {
                this._outputType = Report.renderType.buffer;
            } else if (type === Report.renderType.file) {
                this._outputType = Report.renderType.file;
            } else {
                this._outputType = Report.renderType.file;
            }
            return this;
        },


        /**
         * Start the Rendering process
         * @param {function} callback - the callback to call when completed
         * @returns {*}
         */
        render: function (callback) {

            if (this.isRootReport()) {
                return new Promise((resolve, reject) => {

                    this._state = {
                        isTitle: false,
                        isFinal: false,
                        headerSize: 0,
                        footerSize: 0,
                        additionalHeaderSize: 0,
                        isCalc: false,
                        cancelled: false,
                        resetGroups: true,
                        startX: 0,
                        startY: 0,
                        currentX: 0,
                        currentY: 0,
                        priorStart: [],
                        parentData: {},
                        primaryData: null,
                       // report: this,
                        currentGroup: null,
                        reportRenderMode: this._reportRenderMode()
                    };

                    this._info.Producer = "fluentReports 1.00";

                    if (Report.trace) {
                        console.error("Starting Tracing on Report to a ", this._outputType === Report.renderType.buffer ? "Buffer" : this._outputType === Report.renderType.pipe ? "Pipe" : "File " + this._reportName);
                        if (Report.callbackDebugging) {
                            console.error(" - Render callback is ", callback && typeof callback === "function" ? "valid" : "invalid");
                        }
                    }

                    // These get passed into the two page Wrappers for Page building information
                    const pageDefaults = {
                        paper: this._paper,
                        landscape: this._landscape,
                        margins: this._margins,
                        fonts: this._fonts,
                        registeredFonts: this._registeredFonts,
                        info: this._info
                    };

                    // Set the rendering mode if no functions are defined
                    if (this._reportRenderMode() === reportRenderingMode.UNDEFINED) {
                        this._reportRenderMode(reportRenderingMode.ASYNC);
                    }

                    // Find out Sizes of all the Headers/Footers
                    let testit = new ReportRenderer(this, pageDefaults);

                    testit._reportRenderMode = this._reportRenderMode();
                    testit.font(this._font, this._fontSize);
                    testit.saveState();

                    // Catch the Printing so that we can see if we can track the "offset" of the Footer in case the footer
                    // is moved to a literal Y position (without it being based on the prior Y position)
                    let oPrint = testit.print;
                    let oBand = testit.band;
                    let oAddPage = testit._addPage;
                    let onewLine = testit.newLine;


                    // We are eliminating the height restriction for our sizing tests
                    testit._height = 90000;

                    // This needs to remain a "function" as "this" needs to point to the "testit" instance...
                    testit._addPage = function () {
                        oAddPage.call(this);
                        this._height = 90000;
                    };

                    // This needs to remain a "function" as "this" needs to point to the "testit" instance...
                    testit.newLine = function (lines, callback) {
                        this._firstMoveState = true;
                        onewLine.call(this, lines, callback);
                    };

                    // This needs to remain a "function" as "this" needs to point to the "testit" instance...
                    testit.checkY = function (opt) {
                        if (opt == null) {
                            return;
                        }
                        let cY, y;
                        y = cY = this.getCurrentY();
                        if (opt.y) {
                            y = opt.y;
                        }
                        if (opt.addy) {
                            y += opt.addy;
                        }
                        if (opt.addY) {
                            y += opt.addY;
                        }

                        if (y > cY + (this._reportHeight / 3)) {
                            // Did our move - move us over a 1/3 of the page down?  If so then, it is something we need to track.
                            if (!this._firstMoveState && !this._savedFirstMove) {
                                this._savedFirstMove = y;
                            } else if (this._firstMoveState && y < this._savedFirstMove) {
                                // You never know, a user might do a print: y = 700; then a band: y: 680.  So we actually want to save the 680 as the smallest coord.
                                this._savedFirstMove = y;
                            } else if (!this._savedFirstMove) {
                                opt.addY = 0;
                                opt.y = 0;
                                Report.error("REPORTAPI: Your footer starts with printing some text, then uses an absolute move of greater than a third of the page. Please move first, then print!");
                            }
                        }

                        this._firstMoveState = true;
                        //return y > cY + (this._reportHeight / 3);

                    };

                    testit.band = function (data, options, callback) {
                        this.checkY(options);
                        oBand.call(this, data, options, callback);
                    };

                    testit.print = function (data, options, callback) {
                        this.checkY(options);
                        oPrint.call(this, data, options, callback);
                    };

                    testit.setCurrentY = function (y) {
                        this.checkY({y: y});
                        ReportRenderer.prototype.setCurrentY.call(this, y);
                    };

                    // Start the Calculation for the Test Report -> Then run the actual report.
                    this._calculateFixedSizes(testit, "",
                         () => {
                            // Eliminate the testit code so it can be garbage collected.
                            testit = null;
                            oPrint = null;
                            oBand = null;
                            oAddPage = null;

                            if (this._footer !== null) {
                                this._state.footerSize = this._footer._partHeight;
                            }
                            if (this._header !== null) {
                                this._state.headerSize = this._header._partHeight;
                            }

                            if (Report.trace) {
                                console.error("Generating real report", this._reportName);
                            }

                            // ----------------------------------
                            // Lets Run the Real Report Header
                            // ----------------------------------
                            const renderedReport = new ReportRenderer(this, pageDefaults);
                            renderedReport._reportRenderMode = this._reportRenderMode();
                            renderedReport.font(this._font, this._fontSize);
                            renderedReport.saveState();
                            //noinspection JSAccessibilityCheck
                            renderedReport._setAutoPrint(this._autoPrint);
                            renderedReport._setFullScreen(this._fullScreen);
                            renderedReport.setNegativeParentheses(this._negativeParentheses);

                            const primaryDataSet = this._detailGroup._findParentDataSet();
                            if (primaryDataSet && (primaryDataSet._dataType === dataTypes.NORMAL || primaryDataSet._dataType === dataTypes.PLAINOLDDATA)) {
                                this._state.primaryData = primaryDataSet._data;
                            }

                            this._renderIt(renderedReport, this._state, null,
                                 () => {
                                    if (Report.trace) {
                                        console.error("Report Writing to ", this._outputType === Report.renderType.buffer ? "Buffer" : this._outputType === Report.renderType.pipe ? "Pipe" : "File " + this._reportName);
                                    }
                                    if (this._state.cancelled) {
                                        if (callback) {
                                            callback(null, false);
                                        }
                                        resolve(false);
                                        return;
                                    }
                                    renderedReport._finishPageNumbers();

                                    switch (this._outputType) {
                                        case Report.renderType.pipe:
                                            //noinspection JSAccessibilityCheck
                                            renderedReport._pipe(this._pipe, (err) => {
                                                if (callback) { callback(err, this._pipe); }
                                                if (err) { reject(err); }
                                                else { resolve(this._pipe); }
                                            });
                                            break;
                                        case Report.renderType.buffer:
                                            //noinspection JSAccessibilityCheck
                                            renderedReport._output( (data) => {
                                                if (callback) {
                                                    callback(null, data);
                                                }
                                                resolve(data);
                                            });
                                            break;
                                        default:
                                            //noinspection JSAccessibilityCheck
                                            renderedReport._write(this._reportName, (err) => {
                                                if (callback) {
                                                    callback(err, this._reportName);
                                                }
                                                if (err) { reject(err); }
                                                else { resolve(this._reportName); }
                                            });
                                            break;
                                    }
                                });
                        });
                    //return (this._reportName);
                });
            } else {
                return this._parent.render(callback);
            }
        },

        /**
         * Add your own user data to be passed around in the report
         * @param value
         * @returns {*}
         */
        userData: function (value) {
            if (arguments.length) {
                this._userdata = value;
                return this;
            }
            return this._userdata;
        },

        /**
         * The current state of the report engine
         * @param value
         * @returns {object}
         */
        state: function (value) {
            if (arguments.length) {
                this._state = value;
            }
            return this._state;
        },

        /**
         * Set the paper size in pixels
         * @param {number} value
         * @returns {number}
         */
        paper: function (value) {
            if (arguments.length) {
                this._paper = value;
            }
            return this._paper;
        },

        /**
         * Set the paper into Landscape mode
         * @param value - True = Landscape, False = Portrait
         * @returns {boolean}
         */
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

        /**
         * Set or Get the current font size
         * @param {number} [value] - set fontSize if this value is set
         * @returns {number} - the Font Size
         */
        fontSize: function (value) {
            if (arguments.length) {
                this._fontSize = value;
            }
            return this._fontSize;
        },

        fontBold: function () {
            // TODO: See if this function even needs to exist; it may be obsolete now
            // TODO: See if this works properly for added external fonts
            // See: fontBold in the renderer for changes we might have to do...
            const font = this._fonts[this._font];
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
            const font = this._fonts[this._font];
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
            const font = this._fonts[this._font];
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
                for (let key in definition) {
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

        /**
         * Calculates a header/footer part of the report
         * @param part
         * @param Rpt
         * @param callback
         * @private
         */
        _calculatePart: function(part, Rpt, callback) {
            if (part) {
                Rpt._addPage();
                part.run(Rpt, {isCalc: true}, null, callback);
            } else {
                // No "if" check verification on "callback" because _calculatePart MUST have a callback
                callback();
            }
        },

        _calculateFixedSizes: function (Rpt, BogusData, callback) {
			this._calculatePart(this._header, Rpt, () => {
				this._calculatePart(this._tfooter, Rpt, () => {
					this._calculatePart(this._footer, Rpt, () => {
						this._child._calculateFixedSizes(Rpt, BogusData, callback);
					});
				});
			});
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
                this._footer = new ReportHeaderFooter(false, true);
            }
            if (arguments.length) {
                this._footer.set(value, settings);
            }
            return (this._footer.get());
        },

        /***
         * Sets the Title Header
         * @param value {string | function}
         * @param settings
         * @return {string | function}
         * @private
         */
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
                this._tfooter = new ReportHeaderFooter(false, true);
            }
            if (arguments.length) {
                this._tfooter.set(value, settings);
            }
            return (this._tfooter.get());
        },

        _renderFinalFooter: function(Rpt, State, currentData, callback) {
            // Run final Footer!
            const dataSet = this._detailGroup._findParentDataSet();
            dataSet._totalFormatter(this._detailGroup._totals, (err, data) => {
                Rpt.totals = data;
                Rpt._bandWidth(this._curBandWidth);
                Rpt._bandOffset(this._curBandOffset);
                const footer = this._tfooter || this._footer;

                // IF Final Summary Footer is too big for page; so we will page feed another page, using a normal footer for this page...
                if (this._footer) {
                    this._state.footerSize -= this._footer._partHeight;
                }
                this._state.currentGroup = null;
                if (this._tfooter && this._tfooter._partHeight + Rpt._PDF.y > Rpt._maxY()) {
                   Rpt.newPage({save:true}, () => {
                       this._state.isFinal = true;
                       this._renderPart(Rpt, footer,  currentData,() => {
                           this._state.isFinal = false;
                           callback(Rpt, State);
                       });
                   });
                } else {
                    this._state.isFinal = true;
                    this._renderPart(Rpt, footer, currentData, () => {
                        this._state.isFinal = false;
                        callback(Rpt, State);
                    });
                }
            });
        },

        _renderPart: function(Rpt, part, data, callback) {
            if (part !== null) {
                part.run(Rpt, this._state, data, callback);
            } else if (callback) {
                callback();
            }
        },

        /**
         * Starts the Rendering for the Report object
         * This is the first part that renders, so it is always does the title header (or
         * a normal header in its place)
         * @param Rpt
         * @param State
         * @param currentData
         * @param callback
         * @private
         */
        _renderIt: function (Rpt, State, currentData, callback) {
            this._state.isTitle = true;
            const header = this._theader || this._header;
            State.report = this;

            // This is kinda a hack; it only works for some dataset types
            // We are attempting to get the Primary Data in the event currentData = null
            // (which should only occur on TitleHeader)  This allows us to pass in the row[0] to most reports
            // We should look into gathering the first set of data first; then doing the titleheader...
            let primaryData=null;
            if (currentData == null) {
                const primaryDataSet = this._detailGroup._findParentDataSet();
                if (primaryDataSet && (primaryDataSet._dataType === dataTypes.NORMAL || primaryDataSet._dataType === dataTypes.PLAINOLDDATA)) {
                    primaryData = primaryDataSet._data;
                }
            }

            // In the event we don't have any current data, we pass the primaryData if it exists...
            this._renderPart(Rpt, header,  (currentData && currentData.length > 0) ? currentData[0] : (primaryData && primaryData.length > 0) ? primaryData[0] : currentData,() => {
                this._state.isTitle = false;
                if (this._parent !== null) {
                    State.resetGroups = true;

                    // Copy Parent Data into this State so that we have access to it in this sub-report
                    for (let key in currentData) {
                        if (currentData.hasOwnProperty(key)) {
                            State.parentData[key] = currentData[key];
                        }
                    }

                    this._detailGroup._clearTotals();
                    this._child._renderIt(Rpt, State, currentData, () => {
                        let parent = this;
                        // Find the first group above this report
                        while (parent._parent != null && !parent._isGroup) {
                            parent = parent._parent;
                        }

                        // iterate through the groups above this group and add this value to them so they get this sub-reports totals
                        while (parent._isGroup) {
                            for (let key in this._detailGroup._totals) {
                                if (this._detailGroup._totals.hasOwnProperty(key)) {
                                    if (isNumber(parent._totals[key])) {
                                        parent._totals[key] += this._detailGroup._totals[key];
                                    } else {
                                        parent._totals[key] = this._detailGroup._totals[key];
                                    }
                                }
                            }
                            parent = parent._parent;
                        }

                        this._renderFinalFooter(Rpt, State, currentData, callback);
                    });
                } else {
                    this._child._renderIt(Rpt, State, currentData, () => {
                        if (State.cancelled === true) {
                            callback();
                        } else {
                            this._renderFinalFooter(Rpt, State, currentData, callback);
                        }
                    });
                }
            });
        },

        _setBandSize: function (value, offset) {
            this._curBandWidth = value;
            this._curBandOffset = offset;
        },

        _reportRenderMode: function(value) {
             if (arguments.length) {
                  this._reportMode = value;
              }
              return this._reportMode;
        }

    };


    // -----------------------------------------------------------
    // Header/Footer Prototypes
    // -----------------------------------------------------------
    ReportHeaderFooter.prototype =
   /** @lends ReportHeaderFooter */
   {
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
                    //This allows direct placement of print statements in the footer even if they go beyond the end of the page - it will not push it to a new page
                    //i.e. ... .footer(footer, {isHeightExempt: true})...
                    this._isHeightExempt = getSettings(settings, "isHeightExempt", this._isHeightExempt);
                }
            }
        },

        get: function () {
            return this._part;
        },

        run: function (Rpt, State, Data, callback) {
            let offsetX, offsetY;

            if (State.isCalc) {
                Rpt._firstMoveState = false;
                Rpt._savedFirstMove = 0;
            }

            if (Report.trace) {
                console.error("Run ", this._isHeader ? "Header" : "Footer", State.isCalc ? "-- Is Calculation --" : "");

                if (Report.callbackDebugging) {
                    console.error(" - with ", typeof callback === "function" ? "Valid" : "** Invalid **", "callback");
                }
            }

            // Setup our current Header/Footer that is running
            Rpt._curheaderfooter = this;
            let _handlePrePageBreak, _handleCallingDetailFunction, _handlePostPageBreak;

            // We need to see if we need to page break BEFORE printing the detail
            _handlePrePageBreak = () => {
                offsetY = Rpt.getCurrentY();
                if (this._partHeight === -1) {
                    offsetX = Rpt.getCurrentX();
                }

                // We are temporarily eliminating the height restriction.
                if (this._isHeightExempt) {
                    Rpt._height = 90000;
                }

                if (offsetY + this._partHeight > Rpt._maxY()) {
                    Rpt.newPage({save: true, breakingBeforePrint: true}, _handleCallingDetailFunction);
                } else {
                    _handleCallingDetailFunction();
                }
            };

            // Print the detail data
            _handleCallingDetailFunction = () => {
                if (Report.trace) {
                    console.error("Running", this._isHeader ? "Header" : "Footer", this._isFunction ? (this._part.length === 4 ? "(Async)" : "(Sync)") : "(Fixed)");
                }

                if (this._isFunction) {
                    if (this._part.length === 4) {
                        try {
                            this._part(Rpt, Data, State, (err) => {
                                if (Report.trace && Report.callbackDebugging) {
                                    console.error(" - CallBack from ", this._isHeader ? "Async Header" : "Async Footer");
                                }
                                if (err) {
                                    if (this._isHeader) {
                                        Report.error("REPORTAPI: Error running header in report", new ReportError({error: err, stack: err && err.stack}));
                                    } else {
                                        Report.error("REPORTAPI: Error running footer in report", new ReportError({error: err, stack: err && err.stack}));
                                    }
                                }
                                _handlePostPageBreak();
                            });
                        } catch (err) {
                            if (this._isHeader) {
                                Report.error("REPORTAPI: Error running header in report", new ReportError({error: err, stack: err && err.stack}));
                            } else {
                                Report.error("REPORTAPI: Error running footer in report", new ReportError({error: err, stack: err && err.stack}));
                            }
                            _handlePostPageBreak();
                        }
                    } else {
                        try {
                            this._part(Rpt, Data, State);
                        } catch (err) {
                            if (this._isHeader) {
                                Report.error("REPORTAPI: Error running header in report", new ReportError({error: err, stack: err && err.stack}));
                            } else {
                                Report.error("REPORTAPI: Error running footer in report", new ReportError({error: err, stack: err && err.stack}));
                            }
                        }
                        if (Report.trace && Report.callbackDebugging) {
                            console.error(" - Back from ", this._isHeader ? "Header" : "Footer");
                        }

                        _handlePostPageBreak();
                    }
                } else if (this._part !== null) {
                    if (this._isHeader) {
                        this.runStockHeader(Rpt, this._part, _handlePostPageBreak);
                    } else {
                        this.runStockFooter(Rpt, this._part, _handlePostPageBreak);
                    }
                } else {
                    _handlePostPageBreak();
                }
            };

            // We need to see if we need to page break AFTER print the detail
            _handlePostPageBreak = () => {

                // If this is a Calculation, then we are getting the header/footer details sizes.
                if (State.isCalc && this._partHeight === -1) {
                    if (this._isHeader) {
                        // We want to subtract out the fixed margin for the header
                        // noinspection JSCheckFunctionSignatures
                        this._partHeight = parseInt(Math.ceil(Rpt.getCurrentY() - Rpt.minY()),10);
                    } else {
                        if (Rpt._savedFirstMove) {
                            // noinspection JSCheckFunctionSignatures
                            this._partHeight = Rpt.maxY() - parseInt(Math.ceil(Rpt._savedFirstMove),10);
                        } else {
                            // noinspection JSCheckFunctionSignatures
                            this._partHeight = parseInt(Math.ceil(Rpt.getCurrentY() - offsetY), 10);
                        }
                        if (Rpt.getCurrentY() > Rpt.maxY()) {
                            // noinspection JSCheckFunctionSignatures
                            const exceeds = parseInt(Math.ceil(Rpt.getCurrentY()),10) - Rpt.maxY();
                            Report.error("REPORTAPI: Your Report's Page Footer exceeds the page bottom margin (", Rpt.maxY(), ") by ", exceeds, "-- Please subtract", exceeds, "pixels from (probably) where you set Y to", (Rpt._savedFirstMove ? Rpt._savedFirstMove : "change its location."));
                        }
                    }
                    if (Report.trace) {
                        console.error("Part ", this._isHeader ? "Header" : "Footer", " Height is:", this._partHeight, Rpt._savedFirstMove, Rpt.getCurrentY(), Rpt._maxY());
                    }
                    this._partWidth = Rpt.getCurrentX() - offsetX;
                }

                // We are re-instating the height restriction.
                if (this._isHeightExempt) {
                    Rpt._height = Rpt._reportHeight;
                }

                if (this._pageBreakAfter) {
                    Rpt.newPage({save:true}, callback);
                } else if (callback) {
                    callback();
                }
            };


            if (this._pageBreakBefore) {
                Rpt.newPage({save: true, breakingBeforePrint: !this._isHeader}, _handlePrePageBreak);
            } else {
                _handlePrePageBreak();
            }

        },

        runStockHeader: function (Rpt, headers, callback) {

            if (Report.trace) {
                console.error("Running Stock", this._isHeader ? "Header" : "Footer");
                if (Report.callbackDebugging) {
                    console.error(" - Callback is ", typeof callback === "function" ? "Valid" : "** Invalid **");
                }
            }

            if (headers == null || headers.length === 0) {
                if (callback) {
                    callback();
                }
                return;
            }

            const NowDate = new Date();

            let minutes = NowDate.getMinutes();
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            let hours = NowDate.getHours();
            let ampm = "am";
            if (hours >= 12) {
                if (hours > 12) {
                    hours -= 12;
                }
                ampm = "pm";
            }
            let Header = "Printed At: " + hours + ":" + minutes + ampm;
            let y = Rpt.getCurrentY();
            let centerHeader;

            Rpt.print(Header, () => {
                if (isArray(headers)) {
                    centerHeader = headers[0];
                } else {
                    centerHeader = headers;
                }
                Rpt.print(centerHeader, {align: "center", y: y}, () => {
                    Rpt.print("Page: " + Rpt.currentPage(), {align: "right", y: y}, () => {
                        Header = "on " + NowDate.toLocaleDateString();
                        y = Rpt.getCurrentY();
                        Rpt.print(Header, () => {
                            centerHeader = '';
                            if (isArray(headers) && headers.length > 1) {
                                centerHeader = headers[1];
                            }
                            Rpt.print(centerHeader, {align: "center", y: y}, () => {
                                Rpt.newLine(callback);
                            });
                        });
                    });
                });
            });
        },

        runStockFooter: function (Rpt, footer, callback) {

            if (Report.trace) {
                console.error("Running Stock", this._isHeader ? "Header" : "Footer");
                if (Report.callbackDebugging) {
                    console.error(" - Callback is ", typeof callback === "function" ? "Valid" : "** Invalid **");
                }
            }

            if (footer == null || footer.length === 0) {
                if (callback) {
                    callback();
                }
                return;
            }

            let i, bndSizes = Rpt._bandWidth();
            Rpt.newLine(() => {
                Rpt.bandLine(2);

                // Handle a String Passed into it.
                if (!isArray(footer)) {
                    this._handleFooterPart(Rpt, [footer], bndSizes, callback);
                    return;
                }

                if (isArray(footer) && footer.length >= 1) {

                    // Handle a Single Array
                    if (!isArray(footer[0])) {
                        this._handleFooterPart(Rpt, footer, bndSizes, callback);
                        return;
                    }

                    let bndArray = [];
                    // Handle a Array of Arrays
                    for (i = 0; i < footer.length; i++) {
                        let id = footer[i][1] - 1;
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
                        Rpt.band(bndArray, callback);
                    } else if (callback) {
                        callback();
                    }
                } else if (callback) {
                    callback();
                }

            });
        },

        _handleFooterPart: function (Rpt, part, bndSizes, callback) {
            let offset = 0, i;
            if (part.length === 3) {
                if (bndSizes[(part[2] - 1)]) {
                    for (i = 0; i < part[2] - 1; i++) {
                        offset += bndSizes[i];
                    }
                }
            }

            const _finishFooterPart = () => {
                //Rpt.setCurrentY(y);
                //Rpt.setCurrentX(x);
                if (callback) {
                    callback();
                }
            };

            let y = Rpt.getCurrentY(), x = Rpt.getCurrentX();
            if (offset > 0) {
                Rpt.print(part[0], {y: y}, () => {
                    offset += (bndSizes[part[2] - 1] - Rpt.widthOfString(Rpt.totals[part[1]].toString()) - 2);
                    Rpt.print(Rpt.totals[part[1]].toString(), {x: x + offset, y: y}, _finishFooterPart);
                });
            } else if (part.length > 1) {
                Rpt.print(part[0] + ' ' + Rpt.totals[part[1]], {y: y}, _finishFooterPart);
            } else {
                Rpt.print(part[0].toString(), {y: y}, _finishFooterPart);
            }
        }
    };


    // -----------------------------------------------------------
    // ScopedDataObject Prototypes
    // -----------------------------------------------------------
    ScopedDataObject.prototype =
    /** @lends ScopedDataObject */
    {
        _isScopedDataObject: true,

        // Used for Error Reporting (optional)
        error: function () {
            let args = [this._scope, null, 'error'];

            //noinspection JSHint
            for (let a in arguments) {
                if (args.length > 3) {
                    args.push(" / ");
                }
                if (arguments.hasOwnProperty(a)) {
                    if (isArray(arguments[a])) {
                        for (let i = 0; i < arguments[a]; i++) {
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
            if (this._scope && this._scope.funcs && this._scope.funcs.logclient) {
                this._scope.funcs.logclient.apply(this, args);
            }
        },

        // Helper function, not required to re-implement a SDO interface
        cleanUpData: function (results, callback) {
            let columns = [], mcolumns = null;

            // Skip ALL Formatting
            if (this._formattingState === 0 || this._formattingState === false) {
                callback(null, results);
                return;
            }

            if (this._dataType === dataTypes.PAGEABLE) {
                mcolumns = this._data.fields;
                for (let key in mcolumns) {
                    if (mcolumns.hasOwnProperty(key)) {
                        if (mcolumns[key] === true) {
                            columns.push(key);
                        }
                    }
                }
            } else {
                let firstRow = results[0];
                if (firstRow) {
                    mcolumns = Object.keys(firstRow);
                    for (let i = 0; i < mcolumns.length; i++) {
                        columns.push(mcolumns[i]);
                    }
                }
            }

            if (this._formatters === null) {
                this._scope.funcs.reportapi_setupformatters(this._scope,
                     (err, data) => {
                        this._formatters = data;
                        this._scope.funcs.reportapi_handleformatters(this._scope, callback, results, this._formatters, this._formattingState);
                    }, columns);
            } else {
                this._scope.funcs.reportapi_handleformatters(this._scope, callback, results, this._formatters, this._formattingState);
            }
        },

        // Used to load the data (Required)
        loadRange: function (start, end, callback) {
            if (!this.isPaged || this._result) {
                this.cleanUpData(this._result, callback);
            } else {
                //noinspection JSUnresolvedFunction,JSUnresolvedVariable
                this._scope.funcs.rowsgetpage(this._scope, (err, data) => {
                    if (!err) {
                        this.cleanUpData(data, callback);
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
            if (this._dataType === dataTypes.FUNCTIONAL) {
                if (data !== null) {
                    for (let i=0;i<data.length;i++) {
                        if (typeof this._data.where.values[0] === "string") {
                            this._data.where.values[0] = data[i];
                        } else {
                            // multiple values
                            this._data.where.values[i].values[0] = data[i];
                        }
                    }
                }

                let called = false;
                this._scope.funcs.query(this._scope,
                    (err, data) => {
                        // Streamline can on some errors decide to call us twice; so we eat the second call
                        if (called) { return; }
                        called = true;
                        // Error Occurred
                        if (err) {
                            this.error("REPORTAPI: Error in query: ", err, err && err.stack);
                            this._result = null;
                            callback(err);
                            return;
                        }

                        if (data === null) {
                            // No records
                            this._result = [];
                        } else {
                            // Result Array
                            this._result = data;
                        }
                        callback(null);
                    }, this._data, null);

            } else {
                callback(null);
            }
        },

        // Used to get a record count (Required)
        count: function (callback) {
            if (this._dataType === dataTypes.FUNCTIONAL) {
                if (this._result && this._result.length) {
                    callback(null, this._result.length);
                } else {
                    this.query(() => {
                        let len = this._result && this._result.length || 0;
                        return callback(null, len);
                    });
                }
            } else if (this._dataType === dataTypes.PAGEABLE) {
                this._scope.funcs.rowsgetlength(this._scope, callback, this._data);
            } else {
                this.error("REPORTAPI: Unknown data type in scopedDataObject(Count), either extend the scopedDataObject or create your own simple wrapper!");
            }
        },

        // Used to format the total line (Optional)
        totalFormatter: function (data, callback) {
            try {
                this._scope.funcs.reportapi_handleformatters(this._scope, (err, data) => {
                    callback(err, data[0]);
                }, [data], this._formatters, this._formattingState);
            } catch (totalError) {
                this.error("REPORTAPI: Error in totalFormatter", totalError, totalError && totalError.stack);
                callback(null, data);
            }
        }
    };


    const _PDFKit = require('./fluentReports.pdfkit');
//    const _PDFKit = require("pdfkit");

    // -----------------------------------------------------------
    // Setup our ReportRenderer Prototype functions
    // -----------------------------------------------------------
    //noinspection JSUnusedGlobalSymbols

    ReportRenderer.prototype =
    /** @lends ReportRenderer **/
    {
        _isPDFWrapper: true,

        _PDFKit: _PDFKit,

        _LineWrapperObject: _PDFKit.LineWrapper,

        /***
         * Gets or sets the userdata
         * @param {Object} value - new userdata
         * @returns {Object} the current user data
         */
        userData: function(value) {
            if (arguments.length) {
                return this._primaryReport.userData(value);
            } else {
                return this._primaryReport.userData();
            }
        },

        /**
         * Prints a image on the PDF
         * @param name - source file of the image
         * @param {object} [options] - width, height, fit
         * @method
         * @public
         */
        image: function (name, options) {
            options = options || {};
            this._pageHasRendering++;
            this._PDF.image(name, options);
        },

        /**
         * Set the font
         * @param {string} name - name of font, or path to font
         * @param {number} [size] of font
         */
        font: function (name, size) {
            try {
                if (name && name.normal) {
                    this._font = name.normal;
                    this._PDF.font(name.normal, size);
                } else {
                    this._font = name;
                    this._PDF.font(name, size);
                }
                // The actual Font name may be different than we registered it as; so we need to register in our list it...
                if (!this._fonts[this._PDF._font.name]) {
                    if (name.normal) {
                        this._fonts[this._PDF._font.name] = name;
                    } else {
                        this._fonts[this._PDF._font.name] = this._fonts[name];
                    }
                }

                this._heightOfString = this._PDF.currentLineHeight(true);
            } catch (err) {
                Report.error("REPORTAPI: Invalid font", name);
            }
        },

        /**
         * Set the font size
         * @param {number} [size] of font
         * @returns {number} - font size
         */
        fontSize: function (size) {
            if (size == null) { return this._PDF._fontSize; }
            this._PDF.fontSize(size);
            this._heightOfString = this._PDF.currentLineHeight(true);
            return this._PDF._fontSize;
        },

        /**
         * Bold the Font
         */
        fontBold: function () {
            const font = this._fonts[this._PDF._font.filename || this._PDF._font.name || (this._PDF._font.font.attributes &&  this._PDF._font.font.attributes.FamilyName)];
            if (!font) { return; }
            const fontName = this._PDF._font.filename || this._PDF._font.name;

            // Check for Italic
            let hasItalic = false;
            if (font.italic && (font.italic.indexOf(fontName+".") >= 0 || font.italic === fontName)) {
                hasItalic = true;
            }
            if (font.bolditalic) {
                if (hasItalic || font.bolditalic.indexOf(fontName + ".") >= 0 || font.bolditalic === fontName) {
                    this.font(font.bolditalic);
                    hasItalic = true;
                } else {
                    hasItalic = false;
                }
            }
            if (!hasItalic && font.bold) {
                this.font(font.bold);
            }

            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        /**
         * Fill and Stroke Colors
         * @param fillColor
         * @param strokeColor
         */
        fillAndStroke: function(fillColor, strokeColor) {
            this._fillColor = fillColor;
            this._strokeColor = strokeColor;
            this._PDF.fillAndStroke(fillColor, strokeColor);
        },

        /**
         * Force a Fill -- using current (or optional) Fill Color
         * @param {string} [fillColor] - HTML Color (i.e. "#FFFFFF", "#FF00FF")
         */
        fill: function(fillColor) {
            if (arguments.length) {
                this._fillColor = fillColor;
                this._PDF.fill(fillColor);
            } else {
                this._PDF.fill();
            }
        },

        /**
         * Set or get the current Fill Color
         * @param {string} [color]
         * @returns {string}
         */
        fillColor: function(color) {
            if (arguments.length) {
                if (color !== this._fillColor) {
                    this._fillColor = color;
                    this._PDF.fillColor(color);
                }
            }
            return this._fillColor;
        },

        /**
         * Set or get the Fill Opacity
         * @param {number} [opacity] - 0.0 to 1.0
         * @returns {number}
         */
        fillOpacity: function(opacity) {
            if (arguments.length) {
                if (opacity !== this._fillOpacity) {
                    this._fillOpacity = opacity;
                    this._PDF.fillOpacity(opacity);
                }
            }
            return this._fillOpacity;

        },

        /**
         * Set or get the current Stroke Color
         * @param {string} [color] - HTML Color (i.e. "#000000", "#00FF00")
         * @returns {string}
         */
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
            const font = this._fonts[this._PDF._font.filename || this._PDF._font.name || (this._PDF._font.font.attributes &&  this._PDF._font.font.attributes.FamilyName)];
            if (!font) { return; }
            const fontName = this._PDF._font.filename || this._PDF._font.name;

            // Check for Bold
            let hasBold = false;
            if (font.bold && (font.bold.indexOf(fontName+".") >= 0 || font.bold === fontName)) {
                hasBold = true;
            }
            if (font.bolditalic) {
                if (hasBold || font.bolditalic.indexOf(fontName+".") >= 0 || font.bolditalic === fontName) {
                    this.font(font.bolditalic);
                    hasBold = true;
                } else {
                    hasBold = false;
                }
            }
            if (!hasBold && font.italic) {
                this.font(font.italic);
            }

            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        /**
         * Make the Font Normal again (Remove Bold/Italic)
         */
        fontNormal: function () {

            const font = this._fonts[this._PDF._font.filename || this._PDF._font.name || (this._PDF._font.font.attributes &&  this._PDF._font.font.attributes.FamilyName) ];

            if (font && font.normal) {
                this.font(font.normal);
            }
            this._heightOfString = this._PDF.currentLineHeight(true);
        },

        /**
         * Margins of the paper;
         * @param {(number|object)} value - number of pixels will be set to all sides, the object you can specify a object with .left, .right, .top, and .bottom
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
            const state = {font: this._PDF._font, fontSize: this._PDF._fontSize, lineWidth: this._lineWidth, x: this._PDF.x, fillColor: this._fillColor, strokeColor: this._strokeColor, opacity: this._fillOpacity, rotated: this._rotated};
            this._graphicState.push(state);
        },

        /**
         * Resets the graphic state back
         */
        resetState: function() {
            const state = this._graphicState.pop();
            this._applyState(state);
        },

        /**
         * Deletes the last saved state.
         */
        deleteState: function() {
          this._graphicState.pop();
        },

        /**
         * Have their been any changes
         * @param {boolean} [allChanges] - true means count header changes as changes; so a newPage page with headers will report as having changes
         *                   - false means only count any detail or footer changes as changes.
         * @returns {boolean}
         */
        hasChanges: function(allChanges) {
            if (allChanges === true) {
                return !!this._pageHasRendering;
            } else {
                return this._pageHeaderRendering !== this._pageHasRendering;
            }
        },

        /**
         * Add a new Page; will check to see if anything has been rendered and if not; will not do anything
         * @param {object|boolean} [save] - Saves the current State and applies it to the next page if "true"
         *                                - If object, then it has save, skipDatesetFooters, and breakingBeforePrint options
         * @param {function} [callback] - optional, if no callback is provided; this function will be synchronous
         * @returns void
         */
        newPage: function (save, callback) {
            let hasCallback = true, options = {breakingBeforePrint: false};
            if (typeof save === 'function') {
                //noinspection JSValidateTypes
                callback = save;
                save = false;
            }
            if (typeof callback !== 'function') {
                this._checkRenderMode(callback, "newPage");
                callback = dummyCallback;
                hasCallback = false;
            }
            if (save != null && typeof save === 'object') {
                if (save.breakingBeforePrint) {
                    options.breakingBeforePrint = save.breakingBeforePrint;
                }
               save = !!save.save;
            }

            if (!this._pageHasRendering) {
                callback();
                return;
            }
            if (this._pageBreaking) {
                callback();
                return;
            }

            if (save === true) {
                this.saveState();
                this._applyState(this._graphicState[0], true);
            }
            this._pageBreaking = true;

            if (hasCallback) {
                this._handleFooter(options,  () => {
                    this._addPage();
                    this._handleHeader(options, () => {
                        this._PDF.getEmptyPageStats();
                        this._resetPageHeaderCounter();

                        this._pageBreaking = false;
                        if (save === true) {
                            this.resetState();
                        }
                        callback();
                    });
                });

            } else {
                this._handleFooter(options);
                this._addPage();
                this._handleHeader(options);
                this._PDF.getEmptyPageStats();
                this._resetPageHeaderCounter();

                this._pageBreaking = false;
                if (save === true) {
                    this.resetState();
                }
            }
        },

        /**
         * Prints a standard header
         * @param {string} text to print in center of header
         * @param {function} callback
         */
        standardHeader: function (text, callback) {
            this._checkRenderMode(callback, "standardHeader");
            this._curheaderfooter.runStockHeader(this, text, callback);
        },

        /**
         * Prints a standard footer
         * @param {string} text
         * @param {function} callback
         */
        standardFooter: function (text, callback) {
            this._checkRenderMode(callback, "standardFooter");
            this._curheaderfooter.runStockFooter(this, text, callback);
        },

        /**
         * Current Page that is being generated
         * @returns {Number}
         */
        currentPage: function () {
            if (this._PDF.pages) {
                return this._PDF.pages.length;
            } else {
                return this._PDF._root.data.Pages.data.Count;
            }
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
         * Gets or Sets the X coordinate
         * @param {number} [x] - x coordinate
         * @returns {number} - current x coordinate
         */
        currentX: function(x) {
            //noinspection PointlessArithmeticExpressionJS
            if (arguments.length && !isNaN(x+0)) {
                //noinspection PointlessArithmeticExpressionJS
                this._PDF.x = x+0;
            }
            return this._PDF.x;
        },

        /**
         * Gets or Sets the Y coordinate
         * @param {number} [y] - y coordinate
         * @returns {number} - current y coordinate
         */
        currentY: function(y) {
            //noinspection PointlessArithmeticExpressionJS
            if (arguments.length && !isNaN(y+0)) {
                //noinspection PointlessArithmeticExpressionJS
                this._PDF.y = y+0;
            }
            return this._PDF.y;
        },

        /**
         * Inserts new Lines
         * @param {number} [lines] - number of lines to insert defaults to 1
         * @param {function} [callback] - Optional Async support
         */
        newLine: function (lines, callback) {
            let count= 0;

            if (typeof lines === "function") {
                //noinspection JSValidateTypes
                callback = lines;
                lines = 1;
            }

            this._checkRenderMode(callback, "newLine");

            lines = lines || 1;

            const newLineDone = () => {
                this._PDF.moveDown();
                count++;

                if (count === lines) {
                    this._checkAndAddNewPage(0, {breakingBeforePrint: !this._pageBreaking}, callback);
                } else {
                    // TODO: We might want to spin off on a setImmediate/Process.nextTick if we run this loop more than a number of times
                    this._checkAndAddNewPage(0, {breakingBeforePrint: !this._pageBreaking}, newLineDone);
                }
            };

            newLineDone();

        },

        /**
         * Returns the width of the string, optionally checking width by word
         * @param {string} str
         * @param {boolean} checkByWord
         * @returns {number} size of string
         */
        widthOfString: function (str, checkByWord) {
            if (!checkByWord) {
                return this._PDF.widthOfString(str);
            } else {			
                let splitString = str.split(' '),
                    curWord,
                    wos = 0,
                    wordLength;
                for (let i = 0; i < splitString.length; ++i) {
                    curWord = splitString[i];
                    if ((i + 1) !== splitString.length) {
                        curWord += ' ';
                    }
                    wordLength = this._PDF.widthOfString(curWord);
                    wos += wordLength;
                }

                return wos;
            }
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
         * @param {function?} callback - Optional, function will be synchronous if called without a CB;
         */
        print: function (data, options, callback) {
            if (typeof options === 'function') {
                //noinspection JSValidateTypes
                callback = options;
                options = null;
            }
            // If we have nothing to print then lets just exit
            if (data == null || data.length === 0) {
                if (callback) {
                    callback();
                }
                return;
            }

            let textOptions = {};
            this._pageHasRendering++;

            if (!(options && options.useCurrentX === true)) {
                this._PDF.x = this._PDF.page.margins.left;
            }
            this.saveState();

            // TODO: Decide if this is safe; this flag should only be set by the _finishPageNumbers function
            if (!options || options.forceSync !== true) {
                this._checkRenderMode(callback, "print");
            }
            let saveX, saveY;

            if (options && typeof options === "object") {
                if (!isNaN(options.x + 0)) {
                    this._PDF.x = options.x + 0;
                }
                if (!isNaN(options.addX + 0)) {
                    this._PDF.x += options.addX + 0;
                }
                if (!isNaN(options.addx + 0)) {
                    this._PDF.x += options.addx + 0;
                }
                if (!isNaN(options.y + 0)) {
                    this._PDF.y = options.y + 0;
                }
                if (!isNaN(options.addY + 0)) {
                    this._PDF.y += options.addY + 0;
                }
                if (!isNaN(options.addy + 0)) {
                    this._PDF.y += options.addy + 0;
                }
                if (options.rotate) {
                    saveX = this._PDF.x;
                    saveY = this._PDF.y;
                }
                if (options.align) {
                    if (options.align + 0 > 0) {
                        switch (options.align) {
                            case Report.alignment.LEFT: options.align = "left"; break;
                            case Report.alignment.CENTER: options.align = "center"; break;
                            case Report.alignment.RIGHT: options.align = "right"; break;
                        }
                    }
                    textOptions.align = options.align;
                }
                if (options.wordSpacing || options.wordspacing) {
                    textOptions.wordSpacing = this._parseSize(options.wordSpacing || options.wordspacing);
                }
                if (options.characterSpacing || options.characterspacing) {
                    textOptions.characterSpacing = this._parseSize(options.characterSpacing || options.characterspacing);
                }

                if (options.width) {
                    textOptions.width = this._parseSize(options.width);
                }
                if (options.textColor || options.textcolor) {
                    this.fillColor(options.textColor || options.textcolor);
                    this.strokeColor(options.textColor || options.textcolor);
                }

                if (options.underline) {
                    textOptions.underline = true;
                }

                if (options.strike) {
                    textOptions.strike = true;
                }

                if (options.fontsize) {
                    this.fontSize(options.fontsize);
                } else if (options.fontSize) {
                    this.fontSize(options.fontSize);
                }

                if (options.fill) {
                    textOptions._backgroundFill = options.fill;
                }

                if (options.link) {
                    textOptions.link = options.link;
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
                if (options.opacity) {
                    this.fillOpacity(options.opacity);
                }
                if (options.fillOpacity) {
                    this.fillOpacity(options.fillOpacity);
                }
                if (options.rotate) {
                    this._rotate(options.rotate);
                }
            }


            let cachedMaxY = this._maxY() - this._heightOfString;

            const finishPrinting = () => {
                this.resetState();
                if (saveX != null) {
                    this._PDF.x = saveX;
                }
                if (saveY != null) {
                    this._PDF.y = saveY;
                }

                if (this._PDF.y >= this._maxY()) {
                    this.newPage({save:true}, callback);
                } else if (callback) {
                    callback();
                }
            };

            if (isArray(data)) {
                // If a callback isn't provided -- then we need to do a normal loop; because startLooping uses SetImmediate which will
                // break the PROCESSING ORDER and cause things to get printed out of order.

                let startLooping;
                if (this._reportRenderMode === reportRenderingMode.ASYNC) {
                    startLooping = startLoopingAsync;
                } else {
                    startLooping = startLoopingSync;
                }

                if (callback) {
                    startLooping(data.length, (iteration, done) => {
                        if (data[iteration] !== null && data[iteration] !== undefined) {
                            if (options.ignoreEmptyStrings !== true && data[iteration] === '') { data[iteration] = ' ';}
                            if (this._PDF.y > cachedMaxY) {
                                this.newPage({save: true, breakingBeforePrint: true}, () => {
                                    this._print(data[iteration], textOptions, done);
                                });
                            } else {
                                this._print(data[iteration], textOptions, done);
                            }
                        } else {
                            done();
                        }
                    }, finishPrinting);
                } else {
                    // Synchronous Loop, if a callback wasn't provided
                    for (let i=0;i<data.length;i++) {
                        if (data[i] !== null && data[i] !== undefined) {
                            if (options && options.ignoreEmptyStrings !== true && data[i] === '') { data[i] = ' ';}
                            if (this._PDF.y > cachedMaxY) {
                                // WE HAVE TO ASSUME that the header does not need a callback since they didn't pass one into the print routine
                                // This is not a GOOD assumption; but it is the only valid one we can do, since we have no way to async wait now
                                this.newPage({save: true, breakingBeforePrint: true});
                            }
                            this._print(data[i], textOptions);
                        }
                    }
                    finishPrinting();
                }
            } else {
                // Data cannot be null or undefined here; the check at the top of the routine catches
                // Async Path
                if (callback) {
                    if (this._PDF.y > cachedMaxY) {
                        this.newPage({save: true, breakingBeforePrint: true}, () => {
                            this._print(data, textOptions, finishPrinting);
                        });
                    } else {
                        this._print(data, textOptions, finishPrinting);
                    }
                } else {
                    if (this._PDF.y > cachedMaxY) {
                        this.newPage({save: true, breakingBeforePrint: true});
                    }
                    this._print(data, textOptions);
                    finishPrinting();
                }
            }
        },

        /**
         * Creates a Band Line that matches the width of the Band
         * @param thickness
         * @param verticalGap
         */
        bandLine: function (thickness, verticalGap) {
            thickness = thickness || 2;
            let i, bndSizes = this._bandWidth(), width, y = this.getCurrentY(), x = this._bandOffset();

            for (i = 0, width = 0; i < bndSizes.length; i++) {
                width += bndSizes[i];
            }
            if (verticalGap) {
                y += verticalGap;
            }
            if (width > 0) {
                const oldLineWidth = this.lineWidth();
                this.lineWidth(thickness);
                this.line(x - 0.5, y - 2, width + x - 0.5, y - 2, {});
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
         * @param {Object?} options
         */
        line: function (startX, startY, endX, endY, options) {
            if (arguments.length < 4) { return; }
            let x = this._PDF.x, y = this._PDF.y;
            this._pageHasRendering++;
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
         * @param {number} width
         * @param {number} height
         * @param {Object} options
         */
        box: function (startX, startY, width, height, options) {
            if (arguments.length < 4) { return; }
            this._pageHasRendering++;
            this._PDF.rect(startX, startY, width, height);
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
            if (arguments.length < 3) { return; }
            this._pageHasRendering++;
            this._PDF.circle(startX,startY,radius);
            this._handleOptions(options);
        },

        /**
         * Creates a Suppression Band
         * @param {object} data - a object of your data row -- data can have a .force variable which will cause this "data" field to always print
         * @param {object} options - Options like "group" for grouping values,
         *                  and "duplicatedTextValue" for what you want printed - defaults to a single quote ' " '
         *                  and can contain any normal "band" options
         * @param {Function} callback
         */
        suppressionBand: function (data, options, callback) {
            if (typeof options === "function") {
                //noinspection JSValidateTypes
                callback = options;
                options = null;
            } else if (typeof data === "function") {
                //noinspection JSValidateTypes
                callback = data;
                data = null;
            }

            options = options || {};

            if (!options.group) {
                options.group = "detail" + this._level;
            }
            let group = options.group;
            const originalData = clone(data);

            if (this._priorValues[group] !== undefined) {
                const cdata = this._priorValues[group];

                for (let i = cdata.length - 1; i >= 0; i--) {
                    if (data[i].force === true || data[i].force === 1) {
                        continue;
                    }
                    if (data[i].data === cdata[i].data && data[i].data !== '' && data[i].data !== null && data[i].data !== undefined) {
                        data[i].data = data[i].duplicatedTextValue || options.duplicatedTextValue || ' " ';
                    }
                    //else break;
                }
            }
            this.band(data, options,  () => {
                this._priorValues[group] = originalData;
                if (callback) {
                    callback();
                }
            });
        },

        /**
         * Band creates a Band where border and padding are including INSIDE the cell.  Gutter is outside.
         * @param {Array|Object} dataIn is {data: value, width: width, align: alignment}
         * @param {Object} options
         * @param {function} callback - optional Callback for Async support
         */
        band: function (dataIn, options, callback) {
            let i = 0, max = dataIn.length, maxWidth = 0, lineWidth = null;
            let defaultSize = 50, data = [], startX = this._PDF.page.margins.left;
            this._pageHasRendering++;

            if (typeof options === "function") {
                //noinspection JSValidateTypes
                callback = options;
                options = null;
            } else if (typeof dataIn === "function") {
                //noinspection JSValidateTypes
                callback = dataIn;
                dataIn = null;
            }

            this._checkRenderMode(callback, "band");

            if (dataIn == null) {
                Report.error("REPORTAPI: Band passed a NULL as the data");
                if (callback) {
                    callback();
                }
                return;
            }

            options = options || {};
            if (options.defaultSize != null) {
                defaultSize = this._parseSize(options.defaultSize);
                if (defaultSize === 0) { defaultSize = 50;}
            }

            // Convert old style [[data, width, alignment],[...],...] to [{data:data, width:width, ..},{...},...]
            if (isArray(dataIn[0])) {
                for (i = 0; i < max; i++) {
                    data[i] = {
                        data: dataIn[i][0] || '',
                        width: this._parseSize(dataIn[i][1] || defaultSize),
                        align: dataIn[i][2] || 1
                    };
                }
            } else {
                for (i = 0; i < max; i++) {
                    if (typeof dataIn[i] === 'string') {
                        data[i] = {data: dataIn[i], width: defaultSize, align: 1};
                    } else {
                        data[i] = dataIn[i];
                        if (data[i].width) {
                            data[i].width = this._parseSize(data[i].width);
                        } else {
                            data[i].width = defaultSize;
                        }
                    }
                }
            }

            // This is to save the whole state for the band so we can reset it afterwords
            this.saveState();

            // Check to see if we have a "Settings"
            let padding = 1, border = 0, gutter = 0, collapse = true;
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
                if (options.addX != null && !isNaN(options.addX + 0)) {
                    startX += (options.addX + 0);
                } else if (options.addx != null && !isNaN(options.addx + 0)) {
                    startX += (options.addx + 0);
                }
                if (options.addY != null && !isNaN(options.addY + 0)) {
                    this._PDF.y += (options.addY + 0);
                } else if (options.addy != null && !isNaN(options.addy + 0)) {
                    this._PDF.y += (options.addy + 0);
                }
                if (options.fontSize || options.fontsize) {
                    this.fontSize(options.fontSize || options.fontsize);
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
            let borderPadding = border + padding;

            // Do Data Fixup / cleanup / Figure wrapping
            this.saveState();
            let height = this._cleanData(data, options, defaultSize, borderPadding) + ((padding * 2)-1);
            this.resetState();


            // Check to see if we need to do a page feed before we print this band
            this._checkAndAddNewPage(height, {breakingBeforePrint: true}, () => {

                if (lineWidth != null) {
                    // noinspection JSCheckFunctionSignatures
                    this.lineWidth(lineWidth);
                }
                this._curBand = [];
                this._curBandOffset = startX;
                let x = startX;
                let y = this._PDF.y - (collapse ? 1 : 0);

                let offset = 0, textOffset = 0;
                if (maxWidth > 0) {
                    this.saveState(); // Save State it for the Border / fills
                    if (options.fillOpacity || options.fillopacity) {
                        this.fillOpacity(options.fillOpacity || options.fillopacity);
                    }
                    if (options.dash) {
                        this._PDF.dash(options.dash);
                    }
                    if (options.bordercolor) {
                        options.borderColor = options.bordercolor;
                    }
                    if (options.borderColor) {
                        this.strokeColor(options.borderColor);
                    }
                    if (options.fill && options.border > 0) {
                        this._PDF.rect(x, y, maxWidth - 1, height );
                        this.fillAndStroke(options.fill, (options.borderColor || options.fill));
                    }
                    else if (options.fill) {
                        this._PDF.rect(x, y, maxWidth - 1, height);
                        this.fill(options.fill);
                    }

                    // Reset back to Defaults
                    this.resetState();
                    if (options.dash) {
                        this._PDF.undash();
                    }
                }

                let originalFontSize = this.fontSize(), currentFill, currentStroke;
                if (options.textColor || options.textcolor) {
                    const textColor = options.textColor || options.textcolor;
                    currentStroke = this._strokeColor;
                    currentFill = this._fillColor;
                    this.strokeColor(textColor);
                    this.fillColor(textColor);
                }

                for (i = 0; i < max; i++) {
                    let curWidth = (data[i].width || defaultSize) - (borderPadding * 2);
                    let savedState = false;
                    if (data[i].fill) {
                        this.saveState();
                        this._PDF.rect(x + offset - (i === 0 ? 0 : 1), y, curWidth + (borderPadding *2), height);
                        this.fill(data[i].fill);
                        this.resetState();
                    }
                    let curData = data[i].data;
                    let curFontSize = data[i].fontSize || data[i].fontsize || originalFontSize;
                    this.fontSize(curFontSize);

                    let curTextColor = data[i].textColor || data[i].textcolor;
                    if (curTextColor || data[i].font || data[i].fontBold || data[i].fontbold || data[i].fontItalic || data[i].strike || data[i].underline || data[i].fontitalic || data[i].opacity || options.opacity) {
                        this.saveState();
                        savedState = true;
                    }
                    if (curTextColor) {
                        this.strokeColor(curTextColor);
                        this.fillColor(curTextColor);
                    }
                    if (data[i].font) {
                        this.font(data[i].font);
                    }
                    if (data[i].fontBold || data[i].fontbold) {
                        this.fontBold();
                    }
                    if (data[i].fontItalic || data[i].fontitalic) {
                        this.fontItalic();
                    }
                    let textOptions = {width: curWidth};

                    if (data[i].align) {
                        if (data[i].align === Report.alignment.LEFT || data[i].align.toString().toLowerCase() === "left") {
                            // Left
                            textOffset = borderPadding - 1;
                        } else if (data[i].align === Report.alignment.CENTER || data[i].align.toString().toLowerCase() === "center") {
                            // Center
                            textOptions.align = "center";
                        } else if (data[i].align === Report.alignment.RIGHT || data[i].align.toString().toLowerCase() === "right") {
                            // RIGHT Aligned
                            textOptions.align = "right";
                        } else {
                            // Default to left
                            textOffset = borderPadding - 1;
                        }
                    } else {
                        if (isNumber(curData)) {
                            // RIGHT Aligned
                            textOptions.align = "right";
                        } else {
                            // Default to left
                            textOffset = borderPadding - 1;
                        }
                    }
                    if (textOffset < 0) {
                        textOffset = borderPadding - 1;
                    }

                    if (typeof data[i].opacity !== "undefined") {
                        this.fillOpacity(data[i].opacity);
                    }
                    if (typeof options.opacity !== 'undefined') {
                        this.fillOpacity(options.opacity);
                    }

                    if (data[i].underline || options.underline) {
                        textOptions.underline = true;
                    }
                    if (data[i].strike || options.strike) {
                        textOptions.strike = true;
                    }
                    if (data[i].link) {
                        textOptions.link = data[i].link;
                    }
                    if (typeof options.wordSpacing !== "undefined") {
                        textOptions.wordSpacing = options.wordSpacing;
                    }
                    if (typeof data[i].wordSpacing !== "undefined") {
                        textOptions.wordSpacing = data[i].wordSpacing;
                    }
                    if (typeof options.characterSpacing !== "undefined") {
                        textOptions.characterSpacing = options.characterSpacing;
                    }
                    if (typeof data[i].characterSpacing !== "undefined") {
                        textOptions.characterSpacing = data[i].characterSpacing;
                    }

                    this._PDF.text(curData, x + offset + textOffset, y + borderPadding, textOptions).stroke();
                    if (savedState) {
                        this.resetState();
                    }

                    offset += curWidth + gutter + (borderPadding * 2);
                    this._curBand.push((data[i].width || defaultSize));
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
                if (options.borderColor || options.bordercolor) {
                    this.strokeColor(options.borderColor || options.bordercolor);
                }

                for (i = 0; i < max; i++) {
                    let dataElement = data[i];
                    const calcWidth = (dataElement.width || defaultSize);

                    if (dataElement.dash || options.dash) {
                        this._PDF.dash(dataElement.dash || options.dash);
                    }

                    let currentWidth;
                    if ((currentWidth = ((dataElement.border && dataElement.border.left) || lineWidth)) && (!collapse || (collapse && i === 0))) {
                        if (!dataElement.border || (dataElement.border && (dataElement.border.left !== 0 && dataElement.border.left !== false))) {
                            this.lineWidth(currentWidth);
                            this.line(x + offset, y, x + offset, y + height);
                        }
                    }
                    if ((currentWidth = ((dataElement.border && dataElement.border.top) || lineWidth)) > 0) {
                        if (!dataElement.border || (dataElement.border && (dataElement.border.top !== 0 && dataElement.border.top !== false))) {
                            this.lineWidth(currentWidth);
                            this.line((x + offset) - 0.5, y, x + (offset + calcWidth) - 0.5, y);
                        }
                    }
                    if ((currentWidth = ((dataElement.border && dataElement.border.bottom) || lineWidth)) > 0) {
                        if (!dataElement.border || (dataElement.border && (dataElement.border.bottom !== 0 && dataElement.border.bottom !== false))) {
                            this.lineWidth(currentWidth);
                            this.line(x + offset - 0.5, y + height, x + (offset + calcWidth) - 0.5, y + height);
                        }
                    }
                    offset += calcWidth;
                    if ((currentWidth = ((dataElement.border && dataElement.border.right) || lineWidth)) > 0) {
                        if (!dataElement.border || (dataElement.border && (dataElement.border.right !== 0 && dataElement.border.right !== false))) {
                            this.lineWidth(currentWidth);
                            this.line(x + offset - currentWidth, y, x + offset - currentWidth, y + height);
                        }
                    }

                    if (dataElement.dash || options.dash) {
                        this._PDF.undash();
                    }


                    offset += gutter;
                }

                this._PDF.x = x;
                this._PDF.y = y + height + 1; // add 1 for Whitespace

                this.resetState();

                this._checkAndAddNewPage(0, {}, callback);
            });
        },

        /**
         * Sets or gets the line width
         * @param {number} [width] - optional of line
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
            let width, i, sizes = this._bandWidth();
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
            return this._reportHeight-(this._primaryReport.state().footerSize);
        },

        /**
         * Min Y Size
         * @returns {number} - Top Margin Size
         */
        minY: function() {
            return this._PDF.page.margins.top;
        },

        /**
         * Max X size of page
         * @returns {number}
         */
        maxX: function () {
            return this._PDF.page.width - this._PDF.page.margins.right;
        },

        /**
         * Min X Size
         * @returns {number} - Left Margin Size
         */
        minX: function() {
            return this._PDF.page.margins.left;
        },

        /**
         * Prints the "Printed At" information
         * @param {object} [options] -
         *      header = print in header
         *      footer = print in footer
         *      text = the text to print, defaults to "Printed At: {0}:{1}{2}\non {3}";
         *      align = alignment
         */
        printedAt: function(options) {
            options = options || {};
            let curY;

            const text = options.text || "Printed At: {0}:{1}{2}\non {3}";
            if (options.header || options.footer) {
                curY = this.getCurrentY();
                if (!options.align) {
                    options.align = "left";
                }
                if (options.header) {
                    this.setCurrentY(this._PDF.page.margins.top);
                }
                if (options.footer) {
                    if (text.indexOf('\n') !== false) {
                        this.setCurrentY(this._reportHeight - (this._heightOfString * 2));
                    } else {
                        this.setCurrentY(this._reportHeight - (this._heightOfString));
                    }
                }
            }
            const NowDate = new Date();
            let minutes = NowDate.getMinutes();
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            let hours = NowDate.getHours();
            let ampm = "am";
            if (hours >= 12) {
                if (hours > 12) {
                    hours -= 12;
                }
                ampm = "pm";
            }
            //noinspection JSCheckFunctionSignatures
            const Header = text.replace('{0}', hours).replace('{1}', minutes).replace('{2}', ampm).replace('{3}',NowDate.toLocaleDateString());
            this._PDF.text(Header, options);
            if (options.header || options.footer) {
                this.setCurrentY(curY);
            }
        },

        /**
         * pageNumber - prints the current page number
         * @param options {object} - options object with settings;
         *      "text" value can be changed from the default "Page: {0}" to what you want.
         *      "header" true = print as header
         *      "footer" true = print as footer
         *      "align" = alignment of the text
         */
        pageNumber: function (options) {
            options = options || {};
            let curY;
            if (options.header || options.footer) {
                curY = this.getCurrentY();
                if (!options.align) {
                    options.align = "right";
                }
                if (options.header) {
                    this.setCurrentY(this._PDF.page.margins.top);
                }
                if (options.footer) {
                    this.setCurrentY( this._reportHeight-this._heightOfString);
                }

            }
            if (!options.align) {
                options.align = "center";
            }

            let text = options.text || "Page: {0}";
            // noinspection RegExpRedundantEscape
            text = text.replace(/\{0\}/g, this.currentPage());

            // Do we have page count
            if (text.indexOf("{1}") !== -1) {
               const ref = this._PDF.ref({});
               this._addPageNumberDictionaryRef(ref);
               this._pageNumbers.push({text: text, options: options, y: this.getCurrentY(), x: this.getCurrentX(), ref: ref});
            } else {
                this._PDF.text(text, options);
            }


            if (options.header || options.footer) {
                this.setCurrentY(curY);
            }
        },

        /**
         * Imports a PDF into the current Document
         * return False if it fails, true if it succeeded
         */
        importPDF: function(name) {
            let data;
            if (Buffer.isBuffer(name)) {
                data = name;
            } else {
                const fs = require('fs');
                data = fs.readFileSync(name);
            }
            // We have to end the current page so that the following imported pages will
            // be on new pages
            if (this._pageHasRendering) {
                this._addPage();
            }

            return this._PDF.importPDF(data);
        },

        /**
         * Returns the actual printing page width of the page
         * @returns {number}
         */
        pageWidth: function() {
            return this._PDF.page.width - this._PDF.page.margins.right - this._PDF.page.margins.left;
        },

        /**
         * Returns the actual printing page height of the page
         * @returns {number}
         */
        pageHeight: function() {
            // takes in account the .bottom margin already
            return this._reportHeight - this._PDF.page.margins.top;
        },

        // --------------------------------------------------------------------------------------------
        // The function below are all internally used -- USE THEM AT YOUR OWN RISK, they may break
        // things and they are subject to changes, addition or removal on a whim
        // --------------------------------------------------------------------------------------------

        /**
         * Converts a % value to a real value.
         * @param val
         * @returns {string|number|*}
         * @private
         */
        _parseSize(val) {
            if (val == null) { return 0; }
            if (typeof val === 'number') { return val; }
            if (val.indexOf("%") > 0) {
                let temp = parseInt(val, 10) / 100;
                return this.pageWidth() * temp;
            }
            return parseInt(val,10);
        },


        /**
         * Handles Rotation
         * @param rotation
         * @returns {*}
         * @private
         */
        _rotate: function(rotation) {
            if (arguments.length) {
                if (rotation !== this._rotated) {
                    if (this._rotated !== 0) {
                        this._PDF.restore();
                    }
                    this._rotated = rotation;
                    if (this._rotated !== 0) {
                        this._PDF.save();
                        this._PDF.textRotate(rotation, this._PDF.x, this._PDF.y);
                        this._PDF.x = 0;
                        this._PDF.y = 0;
                    }
                }
            }
            return this._rotated;
        },

        /**
         * Finished up the final page numbers
         * @private
         */
        _finishPageNumbers: function() {

            // We have no pages with extended page numbers
            // So we don't have to do anything...
            if (!this._pageNumbers.length) { return; }

            let totalPages = this.currentPage();

            // Save existing content
            let content = this._PDF.page.content;

            // Disable PageBreaking
            this._pageBreaking = true;
            this._skipASYNCCheck = true;

            // Loop through our array of pages
            for (let i=0;i<this._pageNumbers.length;i++) {
                this._PDF.page.content = this._pageNumbers[i].ref;
                // noinspection RegExpRedundantEscape
                const text = this._pageNumbers[i].text.replace(/\{1\}/g, totalPages);
                this.setCurrentY(this._pageNumbers[i].y);
                this.setCurrentX(this._pageNumbers[i].x);
                this.print(text, this._pageNumbers[i].options);
                this._pageNumbers[i].ref.end();
            }

            // Re-enable page Breaking
            this._pageBreaking = false;
            this._skipASYNCCheck = false;

            // Reset content
            this._PDF.page.content = content;
        },

        /**
         * This handles the printing of the page footer and its callback.
         * @param options
         * @param cb
         * @private
         */
        _handleFooter: function(options, cb) {

            if (this._primaryReport._footer) {
                this._primaryReport._footer.run(this, this._primaryReport.state(), this._lastData, cb);
            } else if (cb) {
                cb();
            }
        },

        /**
         * This handles the printing of any/all the headers
         * @param options
         * @param cb
         * @private
         */
        _handleHeader: function(options, cb) {
            const currentGroup = this._primaryReport.state().currentGroup;
            let headersToPrint = [];
            const checkForPrintableHeaders = (myGroup) => {

                // We don't want to print the currentGroups header; we want the group code to handle this in case the next
                // header needed is actually a changed header -- But we print everything else that needs to be printed
                // However, if we were page-break in the the "detail" then we actually need reprint the prior header as we are still in the detail code
                if (myGroup._header && (myGroup._runHeaderWhen === Report.show.always || (options.breakingBeforePrint && myGroup._runHeaderWhen === Report.show.newPageOnly)) && (myGroup !== currentGroup || !myGroup._isGroup || options.breakingBeforePrint)) {
                    headersToPrint.push(myGroup);
                }
                if (myGroup._parent) {
                    checkForPrintableHeaders(myGroup._parent);
                }
            };

            const printFoundHeaders = () => {
                if (headersToPrint.length === 0) {
                    if (cb) {
                        cb();
                    }
                    return;
                }
                const gp = headersToPrint.pop();
                gp._header.run(this, this._primaryReport.state(), gp._currentData, printFoundHeaders);
            };

            if (currentGroup) {
                checkForPrintableHeaders(currentGroup);
                printFoundHeaders();
            } else if (cb) {
              cb();
            }
        },

        /**
         * Resets the Internal PDF Page Object Counter
         * @protected
         */
        _resetPageHeaderCounter: function() {
            this._pageHeaderRendering = this._pageHasRendering;
        },

        /**
         * This handles applying the state
         * @param {object} state - the state to set the pdf engine too
         * @param {boolean} [skipX] - optionally tell it to ignore resetting the "x" coordiniate state.
         * @private
         */
        _applyState: function(state, skipX) {
            // Undoing Rotation must come first because it pops the PDF internal state system
            this._rotate(state.rotated);

            this._PDF._font = state.font;
            this.fontSize(state.fontSize);
            if (this._lineWidth !== state.lineWidth) {
                this.lineWidth(state.lineWidth);
            }
            this.fillColor(state.fillColor);
            this.strokeColor(state.strokeColor);
            this.fillOpacity(state.opacity);
            if (skipX !== true) {
                this._PDF.x = state.x;
            }
        },

        /**
         * This does the actual printing with the needed sizing
         * @param text
         * @param textOptions
         * @param callback
         * @private
         */
        _print: function(text, textOptions, callback) {
            let procText = this._processText(text);

            if (textOptions.wordSpacing) {
                procText = procText.replace(/\s{2,}/g, ' ');
            }

            // Covert any % values to normal size
            if (textOptions.width) {
                textOptions.width = this._parseSize(textOptions.width);
            }

            const left = this._PDF.page.margins.left;
            const right = this._PDF.page.margins.right;
            const width = (textOptions.width || this._PDF.page.width);

            this._LWDoc.reset();

            // First Line maybe remainder of a line
            if (textOptions.width) {
                this._PrintWrapper.lineWidth = textOptions.width;
            } else {
                this._PrintWrapper.lineWidth = width - this._PDF.x - right;
                textOptions.width = width - (right + left);
            }

            this._PrintWrapper.wrap(procText, textOptions);
            let _printedLines = this._printedLines;
            this._printedLines = [];

            let startLooping;
            if (this._reportRenderMode === reportRenderingMode.ASYNC) {
                startLooping = startLoopingAsync;
            } else {
                startLooping = startLoopingSync;
            }



            let length = _printedLines.length;
            if (callback) {
                startLooping(length,
                     (cnt, done) => {
                        if (this._PDF.y + this._heightOfString > this._maxY()) {
                            this.newPage({save: true, breakingBeforePrint: true}, () => {
                                if (textOptions._backgroundFill) {
                                    this._handleFillRect(_printedLines[cnt].O.textWidth, this._heightOfString, textOptions.align, textOptions.width, textOptions._backgroundFill);
                                }
                                this._PDF._line(_printedLines[cnt].L, _printedLines[cnt].O, true);
                                done();
                            });
                        } else {
                            if (textOptions._backgroundFill) {
                                this._handleFillRect(_printedLines[cnt].O.textWidth, this._heightOfString, textOptions.align, textOptions.width, textOptions._backgroundFill);
                            }
                            this._PDF._line(_printedLines[cnt].L, _printedLines[cnt].O, true);
                            done();
                        }
                    },
                    () => {
                        _printedLines = null;
                        callback();
                    });
            } else {
                for (let i=0;i<length;i++) {
                    if (this._PDF.y + this._heightOfString > this._maxY()) {
                        this.newPage({save: true, breakingBeforePrint: true});
                    }
                    if (textOptions._backgroundFill) {
                        this._handleFillRect(_printedLines[i].O.textWidth, this._heightOfString, textOptions.align, textOptions.width, textOptions._backgroundFill);
                    }
                    this._PDF._line(_printedLines[i].L, _printedLines[i].O, true);
                }
                _printedLines = null;
            }

        },

        /**
         * This creates a filled background area for the print command
         * @param textWidth
         * @param textHeight
         * @param alignment
         * @param lineWidth
         * @param fillColor
         * @private
         */
        _handleFillRect: function(textWidth, textHeight, alignment, lineWidth, fillColor) {
            let offset = 0;
            if (alignment === "center") {
                offset = (lineWidth / 2) - (textWidth / 2);
            } else if (alignment === "right") {
                offset = lineWidth - (textWidth);
            }
            this._PDF.rect(this._PDF.x-1 + offset, this._PDF.y-2,  textWidth+2, textHeight);
            this._handleOptions({fill:fillColor});
        },

        /**
         * This Max Y size function is used internally to do calculations, it by design can "lie" during some actions to eliminate page-breaking...
         * @desc this function can LIE to eliminate height restrictions, this allows footers to print in the "footer" area without triggering a page break
         * @protected
         */
        _maxY: function() {
            return this._height-(this._primaryReport.state().footerSize);
        },

        /**
         * Add a new page
         * @protected
         */
        _addPage: function () {
            if (!this._pageHasRendering) {
                return;
            }

            this._pageHasRendering = 0;
            let options = {};
            options.size = this._paper;
            if (this._landscape) {
                options.layout = "landscape";
            }
            if (typeof this._margins === 'number') {
                options.margin = this._margins;
            } else {
                options.margins = this._margins;
            }

            this._PDF.addPage(options);
            // We are now subverting the pdfkits height system.  We handle it; this is because people can put in arbitrary y coords and we don't want any stupidity crashes.
            this._height = this._reportHeight = this._PDF.page.maxY();
            this._PDF.page.height = 99999;
        },

        _addPageNumberDictionaryRef: function(ref) {
            if (!Array.isArray(this._PDF.page.dictionary.data.Contents)) {
                this._PDF.page.dictionary.data.Contents = [this._PDF.page.content, ref];
            } else {
                this._PDF.page.dictionary.data.Contents.push(ref);
            }
        },

        _checkAndAddNewPage: function(height, options, callback) {
            if (this._PDF.y + height >= this._maxY()) {
                options.save = true;
                this.newPage(options, callback);
            } else if(callback) {
                callback();
            }
        },

        /**
         * Process the value running it through formatting
         * @param value
         * @returns {string} - formatted value
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

        _handleOptions: function(options) {
            options = options || {};
            this.saveState();
            if (options.hasOwnProperty('fillOpacity')) {
                //noinspection JSCheckFunctionSignatures
                this.fillOpacity(options.fillOpacity);
            }
            if (options.hasOwnProperty('fillopacity')) { this.fillOpacity(options.fillopacity); }
            if (options.borderColor || options.bordercolor) { this.strokeColor(options.borderColor || options.bordercolor); }
            if (options.textColor || options.textcolor) { this.strokeColor(options.textColor || options.textcolor); }
            if (options.hasOwnProperty('thickness')) { this.lineWidth(options.thickness); }

            if (options.dash) { this._PDF.dash(options.dash); }
            // This will Stroke and fill whatever shape we are doing
            if (options.fill) { this.fillAndStroke(options.fill, (options.textColor || options.textcolor || options.borderColor || options.bordercolor || options.fill)); }
            else if (options.fillColor || options.fillcolor) { this.fillAndStroke(options.fillColor || options.fillcolor, (options.textColor || options.textcolor || options.borderColor || options.bordercolor || options.fillColor || options.fillcolor)); }
            else { this._PDF.stroke(); }

            this.resetState();
            if (options.dash) { this._PDF.undash(); }
        },

        _truncateText: function (data, width) {
            //This if statement fixes an infinite loop where the specified width minus border padding sets the width passed in here
            // to a negative number. If the allowed width is 0 or less, return an empty string since there is no room to print anything.
            if (width <= 0) {
                data.data = '';
                return 1;
            }
            let curData;
            let offset = data.data.indexOf('\n');
            if (offset > 0) {
                curData = data.data.substr(0, offset);
            } else {
                curData = data.data;
            }
            let wos = this.widthOfString(curData, true);
            if (wos >= width) {
                // Get avg character length
                // noinspection JSCheckFunctionSignatures
                let wos_c = parseInt(wos / curData.length, 10) + 1;

                // Find out the avg string size
                // noinspection JSCheckFunctionSignatures
                let len = parseInt(width / wos_c, 10) + 1;

                let newString = curData;
                let optimalSize = 0;

                do {
                    curData = newString.substr(0, len);
                    wos = this.widthOfString(curData, true);
                    if (wos < width) {
                        optimalSize = len;
                        len++;
                    } else {
                        if (optimalSize) { break; }
                        len--;

                        // This fixes a corner case where the size is too small for any text, so we don't print any text.
                        if (len <= 0) { optimalSize = 0; break; }
                    }
                } while (true);
                curData = newString.substr(0,optimalSize);

            }
            data.data = curData;
            return 1;
        },

        _wrapText: function (data, width, ldata) {
            this._LWDoc.reset();
            this._LineWrapper.lineWidth = width;

            ldata.width = width;

            this._LineWrapper.wrap(data.data, ldata);


            return this._LWDoc.count;
        },

        _cleanData: function (data, options, defaultSize, borderPadding) {
            let len = data.length;

            let formatText;
            let lineData = {width: 0, height: this._maxY()};
            if (options && options.wrap) {
                formatText = this._wrapText;
            } else {
                formatText = this._truncateText;
            }

            let maxLines = 1, curLines, maxFontSize= 1, bp = borderPadding * 2;

            const originalFontSize = this.fontSize(),
                originalFont = this._font;
            for (let i = 0; i < len; i++) {
                data[i].data = this._processText(data[i].data);
                let curFontSize = data[i].fontSize || data[i].fontsize || originalFontSize;
                if (curFontSize > maxFontSize) {
                    maxFontSize = curFontSize;
                }

                let cellBolded;
                if (data[i].fontbold || data[i].fontBold) {
                  cellBolded = true;
                }
                if (cellBolded) {
                  this.fontBold();
                }

                this._PDF.fontSize(curFontSize);

                curLines = formatText.call(this, data[i], (data[i].width || defaultSize) - bp, lineData);

                if (cellBolded) {
                  if (originalFont) {
                    this.font(originalFont);
                  }
                }

                if (curLines > maxLines) {
                    maxLines = curLines;
                }
            }
            this._PDF.fontSize(maxFontSize);
            const lineSize = (maxLines * this._PDF.currentLineHeight(true));
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
                this._PDF._root.data.OpenAction = {Type: 'Action', S: 'Named', N: 'Print'};
            } else {
                if (this._PDF._root && this._PDF._root.data && this._PDF._root.data.OpenAction) {
                    delete this._PDF._root.data.OpenAction;
                }
            }
        },

        /**
         * Set Full Screen
         * @param value
         * @ignore
         */
        _setFullScreen: function(value) {
            if (value) {
                this._PDF._root.data.PageMode = "FullScreen";
            } else {
                if (this._PDF._root && this._PDF._root.data && this._PDF._root.data.PageMode) {
                    delete this._PDF._root.data.PageMode;
                }
            }

        },

        /**
         * Set the Band Width
         * @param value
         * @returns {*}
         * @ignore
         */
        _bandWidth: function (value) {
            if (arguments.length) {
                this._curBand = clone(value);
            }
            return clone(this._curBand);
        },

        /**
         * Set Band Offset
         * @param value
         * @returns {number}
         * @ignore
         */
        _bandOffset: function (value) {
            if (arguments.length) {
                this._curBandOffset = value;
            }
            return this._curBandOffset;
        },

        /**
         * Pipe the output
         * @param pipe
         * @param callback
         * @ignore
         * @private
         */
        _pipe: function(pipe, callback) {
            if (!this._PDF.pipe) {
                return Report.error("REPORTAPI: Pipe is unsupported on this version of PDFKit, upgrade PDFKIT.");
            }
            if (typeof callback === 'function') {
                pipe.once('finish', callback);
            }
            this._PDF.pipe(pipe);
            this._PDF.end();
        },

        /**
         * Output the PDF
         * @param name
         * @param callback
         * @ignore
         * @private
         */
        _write: function (name, callback) {
            if (!this._PDF.pipe) {
                return this._PDF.write(name, callback);
            }
            const fs = require('fs');
            const writeStream = fs.createWriteStream(name);
            writeStream.once('finish', callback);
            this._PDF.pipe(writeStream);
            this._PDF.end();
        },

        /**
         * Outputs the Report to a Buffer
         * @param callback
         * @private
         * @ignore
         */
        _output: function(callback) {
            let buffer = null;
            if (!this._PDF.pipe) {
                return this._PDF.output(callback);
            }

            this._PDF.on('data', (chunk) => {
                if (buffer === null) {
                    buffer = Buffer.from(chunk);
                } else {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            });
            this._PDF.once('end', () => {
                callback(buffer);
            });
            this._PDF.end();
        },

        _checkRenderMode: function(callback, functionName) {
            // TODO: Determine if this is safe; currently only _finishPageNumbers sets this flag
            if (this._skipASYNCCheck === true) { return; }
            if (this._reportRenderMode === reportRenderingMode.ASYNC) {
                if (typeof callback !== 'function') {
                    const e = new Error();
                    Report.error("REPORTAPI: You have called a ASYNCHRONOUS function", functionName.toUpperCase(), "without the callback, the report WILL have issues or might even throw an error while saving.  The error and callstack are as follows:", new ReportError({error: e, stack: e && e.stack}));
                }
            } /* else if (this._reportRenderMode === reportRenderingMode.SYNC) {
                if (typeof callback === 'function') {
                    // This is fine;
                }
            } */
        },

        /**
         * DEPRECIATED -  Just create your own array, and push your fields to it and then call band with that array.
         */
        bandField: function() {
            Report.error("REPORTAPI: bandField functionality has been removed.");
        },

        // CONSTANTS
        left: 1,
        right: 3,
        center: 2,
        /** @constant
         * @desc Aligns the Text on the Left */
        LEFT: 1,
        /** @constant
         * @desc Aligns the Text on the Right */
        RIGHT: 3,
        /** @constant
         * @desc Centers the Text */
        CENTER: 2
    };


    // noinspection JSUnusedGlobalSymbols
    ReportDataSet.prototype =
    /** @lends ReportDataSet */
    {
        _isDataSet: true,

        /**
         * Data for the System
         * @param {Object|Array} [value]
         * @returns {*}
         */
        data: function (value) {
            if (!arguments.length) {
                return (this._data);
            }

            if (isArray(value)) {
                this._dataType = dataTypes.NORMAL; // Normal passed preset data set
            } else if (typeof value === 'function' || typeof value === 'object') {
                if (value.count && (value.loadRange || value.loadrange)) {
                    this._dataType = dataTypes.PAGEABLE;  // Page-able Dataset
                } else if (typeof value === 'function') {
                    this._dataType = dataTypes.FUNCTIONAL;  // Functional Dataset
                } else {
                    // Just a POD (Plain old Data)
                    this._dataType = dataTypes.PLAINOLDDATA;
                }
            } else if (typeof value === 'string' || typeof value === 'number') {
                this._dataType = dataTypes.PLAINOLDDATA; // POD
            } else {
                this._dataType = dataTypes.PLAINOLDDATA; // Assume POD
                Report.error("REPORTAPI: Unknown data type; treating as plain old data.");
            }

            //noinspection JSUnresolvedVariable
            if (value.totalFormatter && typeof value.totalFormatter === 'function') {
                this._totalFormatter =  (data, callback) => {
                    this._data.totalFormatter(data, callback);
                };
            }
            //noinspection JSUnresolvedVariable
            if (value.error && typeof value.error === 'function') {
                Report.error =  () => {
                    this._data.error.apply(this._data, arguments);
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
                this._totalFormatter = (data, callback) => {
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
            let keys=null;
            const keySet = this._keys || this._data.keys;

            if (currentData === null) { return null; }

            if (keySet != null) {
                if (typeof keySet === "string") {
                    keys = [currentData[keySet]];
                } else if (isArray(keySet)) {
                    keys = [];
                    for (let key in keySet) {
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
         * @param callback
         * @memberOf ReportDataSet
         * @private
         */
        _renderIt: function (Rpt, State, currentData, callback) {

            let pageData = null;
            let dataLength = 0, curRecord = -1;
            let groupCount = 0, groupSize = 0;
            let pageCount = 0, pagedGroups = 1;
            let groupContinueCount = 0, hasRendered=false;
            let loadPageData;

            if (this._dataType === dataTypes.PARENT) {
                this._data = currentData[this._parentDataKey];
            }


            const groupContinue = () => {
                groupContinueCount++;


                // We can Exceed the stack if we don't allow it to unwind occasionally; so we breath every 10th call.
                if ((groupContinueCount % 11) === 0) {
                    setTimeout(groupContinue, 0);
                    return;
                }


                curRecord++;
                if (groupCount === groupSize) {
                    if (pageCount === pagedGroups) {
                        // If we have NO DATA, this path will be taken
                        if (!hasRendered && this._child._header) {
                            hasRendered = true;
                            this._child._header.run(Rpt, State, {}, () => {
                                    this._child._renderFooter(Rpt, State, callback);
                            });
                        } else {
                            // Run the Final Footers
                            this._child._renderFooter(Rpt, State, callback);
                        }
                    } else {
                        // Load next data Page
                        loadPageData(pageCount);
                    }
                } else {
                    groupCount++;
                    hasRendered=true;
                    this._child._renderIt(Rpt, State, pageData[curRecord], groupContinue);
                }
            };


            // This starts the Rendering of a record and sets up the
            const renderData = (err, data) => {

                if (err) {
                    Report.error("REPORTAPI: Error in rendering data: ", new ReportError({error: err}));
                    callback(err);
                    return;
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
            loadPageData = (id) => {
                let start = id * 100, end = (id + 1) * 100;
                if (end > dataLength) {
                    end = dataLength;
                }

                // Reset back to first row when we get a new data set loaded
                curRecord = -1;

                //noinspection JSUnresolvedVariable
                if (this._data.loadrange) {
                    //noinspection JSUnresolvedFunction
                    this._data.loadrange(start, end, renderData);
                } else {
                    this._data.loadRange(start, end, renderData); // Trying the proper case version...
                }
            };

            // If we have a raw array; we just start the rendering
            if (this._dataType === dataTypes.NORMAL || this._dataType === dataTypes.PARENT) {
                if (this._data == null) {
                    Report.error("REPORTAPI: data is empty, try adding a .data([{field: 'value',...}]) to the report.");
                    this._data = [''];
                }
                dataLength = this._data.length;

                if (typeof this._recordCountCallback === "function") {
                    this._recordCountCallback(dataLength,
                         (continueReport, continueReport2) => {
                            if ((arguments.length >= 2 && continueReport2 === false) || (arguments.length === 1 && continueReport === false)) {
                                // We are ending the report
                                State.cancelled = true;
                                callback();
                            } else {
                                renderData(null, this._data);
                            }
                        });
                } else {
                    renderData(null, this._data);
                }
            }

            // This is a class/Function that implement "count" and "loadRange"
            // So we start by asking for the query (if needed), then the count, it will call the paging code
            else if (this._dataType === dataTypes.PAGEABLE) {

                const startCount2 = (length) => {
                    dataLength = length;
                    if (length === 0) {
                        groupSize = groupCount = pageCount = pagedGroups = 0;
                        groupContinue();
                    } else {
                        // noinspection JSCheckFunctionSignatures
                        pagedGroups = parseInt(length / 100, 10);
                        if (pagedGroups * 100 < length) {
                            pagedGroups++;
                        }
                        loadPageData(0);
                    }
                };

                const startCount = () => {
                    this._data.count(
                         (err, length) => {
                            if (err) {
                                Report.error("REPORTAPI: Got error getting count: ", new ReportError({error: err}));
                                length = 0;
                            }

                            if (isNaN(length)) {
                                Report.error("REPORTAPI: Got a non-number row length/count", length);
                                length = 0;
                            }

                            if (typeof this._recordCountCallback === "function") {
                                this._recordCountCallback(length,
                                    (continueReport, continueReport2) => {
                                        if ((arguments.length >= 2 && continueReport2 === false) || (arguments.length === 1 && continueReport === false)) {
                                            // We are ending the report
                                            State.cancelled = true;
                                            callback();
                                        } else {
                                            startCount2(length);
                                        }
                                    }
                                );
                            } else {
                                startCount2(length);
                            }


                        });
                };

                if (this._data.query) {
                    this._data.query(this._buildKeySet(currentData), startCount);
                } else {
                    startCount();
                }

                // This is a simple query class, it should return all data either in a callback or as it return value
            } else if (this._dataType === dataTypes.FUNCTIONAL) {
                let handleCb = false;
                const data = this._data(this._buildKeySet(currentData), (err, newData) => {
                    if (err) {
                        Report.error("REPORTAPI: Error getting data", new ReportError({error: err}));
                        newData = [];
                    }
                    if (!handleCb) {
                        handleCb = true;
                        dataLength = newData.length;
                        renderData(null, newData);
                    }
                });
                if (data && !handleCb) {
                    handleCb = true;
                    dataLength = data.length;
                    renderData(null, data);
                }

                // This is a POD
            } else if (this._dataType === dataTypes.PLAINOLDDATA) {
                if (this._data === null) {
                    Report.error("REPORTAPI: data is empty, try adding a .data([{field: 'value',...}]) to the report.");
                    this._data = '';
                }
                dataLength = 1;
                renderData(null, [this._data]);
            }
        },

        _setChild: function (newChild) {
            this._child = newChild;
        },

        _calculateFixedSizes: function (Rpt, oldBogusData, callback) {
            if (this._child !== null) {
                let bogusData = {}, key;
                if (this._data !== null) {
                    for (key in this._data[0]) {
                        if (this._data[0].hasOwnProperty(key)) {
                            bogusData[key] = "";
                        }
                    }
                }

                this._child._calculateFixedSizes(Rpt, bogusData, callback);
            } else if (callback) {
                callback();
            }
        },

        _recordCount: function(callback) {
            if (arguments.length) {
                this._recordCountCallback = callback;
            }
            return this._recordCountCallback;
        },

        /**
         * Set the Parental Data Key
         * @memberOf ReportDataSet
         */
        _parentalData: function(parentDataKey) {
            this._dataType = dataTypes.PARENT;
            this._parentDataKey = parentDataKey;
        },

        _renderFooter: function(Rpt, State, Handler) {
            if (this._child) {
                this._child._renderFooter(Rpt, State, Handler);
            } else if (Handler) {
                Handler();
            }
        }

    };


    ReportSection.prototype =
    /** @lends ReportSection */
    {
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
            let children=[];
            for (let i=0;i<this._children.length;i++) {
                if (this._children[i]._isDataSet) {
                    children.push(this._children[i]);
                }
            }
            return children;
        },

        sections: function() {
            let children=[];
            for (let i=0;i<this._children.length;i++) {
                if (this._children[i]._isSection) {
                    children.push(this._children[i]);
                }
            }
            return children;
        },

        subReports: function() {
            let children=[];
            for (let i=0;i<this._children.length;i++) {
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
            let parent = item;

            if (item._parent == null) {
                item._parent = this;
            } else {
                let myParent = this._parent;
                let rootReport = this._parent;
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
            let priorStart = [State.startX, State.startY];
            State.priorStart.unshift(priorStart);
            State.startX = Rpt.getCurrentX();
            State.startY = Rpt.getCurrentY();

            let cnt = -1;
            const renderGroup = () => {
                cnt++;
                if (cnt < this._children.length && !State.cancelled) {
                    State.currentY = Rpt.getCurrentY();
                    State.currentX = Rpt.getCurrentX();
                    this._children[cnt]._renderIt(Rpt, State, currentData, renderGroup);
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
            let i, cnt = this._children.length, done = -1;

            const renderFooterHandler = () => {
                done++;
                if (done === cnt) {
                    callback();
                } else {
                    if (this._children[done]._isReport) {
                        renderFooterHandler();
                    } else {
                        this._children[done]._renderFooter(Rpt, State, renderFooterHandler);
                    }
                }
            };

            if (callback) {
                renderFooterHandler();
            } else {
                for (i=0;i<cnt;i++) {
                    if (this._children[i]._isReport) { continue; }
                    this._children[i]._renderFooter(Rpt, State);
                }
            }
        },


        // Used to figure out the page usage size of header/footers
        _calculateFixedSizes: function (Rpt, bogusData, callback) {
            let _calculateCount = -1, _length = this._children.length;

            const calcChildCallback = () => {
                _calculateCount++;
                if (_calculateCount < _length) {
                    this._children[_calculateCount]._calculateFixedSizes(Rpt, bogusData, calcChildCallback);
                } else {
                    callback();

                }
            };

            calcChildCallback();
        }
    };


    // noinspection JSUnusedGlobalSymbols
    ReportGroup.prototype =
    /** @lends ReportGroup **/
    {
        _isGroup: true,

        /**
         * Set user data that you can access during the report
         * @param value
         * @returns {*}
         */
        userData: function (value) {
            let parentReport = null;
            if (!arguments.length) {
                do
                {
                    parentReport = this._findParentReport(parentReport);
                    let data = parentReport.userData();
                    if (data !== null) {
                        return (data);
                    }
                }
                while (!parentReport.isRootReport());

                // No userdata found from where this group is in the tree up to the ROOT Report
                // So, then we will create a empty userdata object, since if you are accessing it
                // you will probably be "adding" some user data and so then the
                // expectation is that it will be saved if you change it.
                let newUserData = {};
                parentReport.userData(newUserData);

                return (newUserData);
            }
            parentReport = this._findParentReport();
            parentReport.userData(value);
            return (this);
        },

        /**
         * Set the TotalFormatter function
         * @param value
         * @returns {*}
         */
        totalFormatter: function (value) {
            const parentDataSet = this._findParentDataSet();
            if (!arguments.length) {
                return parentDataSet.totalFormatter();
            }
            parentDataSet.totalFormatter(value);
            return (this);
        },

        /**
         * Set the Data for the group
         * @param value - this can be a Array of Arrays, Array of Objects, Object, String, Number or a functional class that returns the data
         * @returns {object|ReportGroup}
         */
        data: function (value) {
            const parentDataSet = this._findParentDataSet();
            if (!arguments.length) {
                return parentDataSet.data();
            }
            parentDataSet.data(value);
            return (this);
        },

        /**
         * Keys for Sub-Report Dataset to use
         * @param value
         * @returns {*}
         */
        keys: function (value) {
            const parentDataSet = this._findParentDataSet();
            if (!arguments.length) {
                return parentDataSet.keys();
            }
            parentDataSet.keys(value);
            return (this);
        },

        /**
         * Adds a sub-detail
         * @param key
         * @returns {ReportDataSet|ReportGroup}
         */
        subDetail: function(key) {
            // Find null child (i.e. the bottom of the groupings)
            let child = this;
            while (child._groupOnField !== null) {
                child = child._child;
            }

            let r = new Report(child);
            let ds = r._findParentDataSet();
            ds._parentalData(key);
            return r;
        },

        /**
         * Add Sub Report
         * @param {Report} rpt - Report object to add to this report as sub-report
         * @param options
         */
        addReport: function(rpt, options) {
            //noinspection JSUnresolvedVariable
            if (options && options.isSibling) {
                let parentReport = this._parent;
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
                    let child = this._child;
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
            const ds = this._findRootReport();
            if (!arguments.length) {
                return ds.info();
            }
            ds.info(value);
            return (this);
        },

        /**
         * Prototype for a Detail Function Callback
         * @callback detailCallback
         * @param {ReportRenderer} Renderer - report rendering class
         * @param {Object} Data - your Data line
         * @param [Object] ReportState - the current state of the process
         * @param {Function} optional callback for Asynchronous support
         */

        /**
         * Adds a Detail section
         * @param {detailCallback|object|string} detailData to run for each detail record
         * @param {Object} settings for this detail function {afterSubgroup: "will print after a sub-group rather than before"}
         */
        detail: function (detailData, settings) {
            if (!arguments.length) {
                return (this._detail);
            }
            if (!this._checkAsyncFunctionPrototype(detailData, "detail")) {
                return this;
            }
            this._runDetailAfterSubgroup = getSettings(settings, "afterSubgroup", false);
            this._detail = detailData;

            if (typeof detailData === "string") {
                this._renderDetail = this._renderStringDetail;
            } else if (typeof detailData === "function") {
                if (this._detail.length === 4) {
                    this._renderDetail = this._renderAsyncDetail;
                } else {
                    this._renderDetail = this._renderSyncDetail;
                }
            } else if (isArray(detailData)) {
                this._renderDetail = this._renderBandDetail;
                if (!isArray(detailData[0])) {
                    this._detail = [detailData];
                }
            } else {
                // NOP Function, we don't render anything.
                this._renderDetail = (rpt, data, state, callback) => {
                    callback();
                };
            }

            return (this);
        },

        /**
         * Sets a field for generating totals -- this is used to group the results
         * @param {string} field name to group on
         * @param {object} [options] - can have runHeader option which has the show.Once, show.OnNewPage, and show.Always values
         */
        groupBy: function (field, options) {
            let parent, newGroup;
            // GroupBy Appends a group to another Group, except in the case this is the
            //   final group; then the final group must come last; so then this group is then inserted in the chain
            if (this._groupOnField === null) {
                parent = this._parent;
                newGroup = new ReportGroup(parent);
                // noinspection JSAccessibilityCheck
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

            if (options) {
                newGroup._runHeaderWhen = getSettings(options, "runHeader", newGroup._runHeaderWhen);
            }

            return (newGroup);
        },

        /**
         * Sets a field for generating totals (sum)
         * @param {string} field name to sum
         */
        sum: function (field) {
            this._math.push([mathTypes.SUM, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (average)
         * @param {string} field name to average on
         */
        average: function (field) {
            this._math.push([mathTypes.AVERAGE, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (minimum)
         * @param {string} field name to find the minimum on
         */
        min: function (field) {
            this._math.push([mathTypes.MIN, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (max)
         * @param {string} field name to find the maximum
         */
        max: function (field) {
            this._math.push([mathTypes.MAX, field]);
            return (this);
        },

        /**
         * Sets a field for generating totals (count)
         * @param {string} field name to count
         */
        count: function (field) {
            this._math.push([mathTypes.COUNT, field]);
            return (this);
        },

        /**
         * Sets or gets the record count callback
         * @param {function} callback
         * @returns {function|ReportGroup}
         */
        recordCount: function(callback) {
            const ds = this._findParentDataSet();
            if (!arguments.length) {
                return ds._recordCount();
            }
            ds._recordCount(callback);
            return (this);
        },

        /**
         * Prototype for a Header or Footer Callback
         * @callback headerFooterCallback
         * @param {ReportRenderer} Renderer - report rendering class
         * @param {Object} Data - your Data line
         * @param [Object] State - the current state of the process
         * @param {Function} callback - Optional Callback for Asynchronous support
         */

        /**
         * Sets or gets the current page Header settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        pageHeader: function (value, settings) {
            const ds = this._findParentReport();
            if (!arguments.length) {
                return ds._pageHeader();
            }
            if (this._checkAsyncFunctionPrototype(value, "page header")) {
                ds._pageHeader(value, settings);
            }

            return (this);
        },

        /**
         * Sets or gets the current page footer settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        pageFooter: function (value, settings) {
            const ds = this._findParentReport();
            if (!arguments.length) {
                return ds._pageFooter();
            }
            if (this._checkAsyncFunctionPrototype(value, "page footer")) {
                ds._pageFooter(value, settings);
            }
            return (this);
        },

        /**
         * Sets or gets the current title header settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        titleHeader: function (value, settings) {
            const ds = this._findParentReport();
            if (!arguments.length) {
                return ds._titleHeader();
            }
            if (this._checkAsyncFunctionPrototype(value, "title header")) {
                ds._titleHeader(value, settings);
            }
            return (this);
        },

        /**
         * Sets or gets the current final summary footer settings
         * @param {(string|headerFooterCallback)} value or function to set footer too
         * @param {Object} settings for the footer behavior "pageBreakBefore", "pageBreakAfter" and "pageBreak" are valid options
         */
        finalSummary: function (value, settings) {
            const ds = this._findParentReport();
            if (!arguments.length) {
                return ds._finalSummary();
            }
            if (this._checkAsyncFunctionPrototype(value, "final summary")) {
                ds._finalSummary(value, settings);
            }
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
                if (this._checkAsyncFunctionPrototype(value, "header")) {
                    this._header.set(value, settings);
                }
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
                if (this._checkAsyncFunctionPrototype(value, "footer")) {
                    this._footer.set(value, settings);
                }
                return this;
            }
            return (this._footer.get());
        },

        /**
         * Set the output type
         * @param type - File, Buffer, or Pipe
         * @param to - filename, 'buffer' or writable stream object
         * @returns {*}
         */
        outputType: function(type, to) {
            const rpt = this._findRootReport();
            if (!arguments.length) {
                return rpt.outputType();
            } else {
                rpt.outputType(type, to);
            }
            return this;
        },

        /**
         * Renders the report!
         * @param {function} callback to call when completed
         */
        render: function (callback) {
            const rpt = this._findRootReport();
            return rpt.render(callback);
        },


        /**
         * Prints the report structure to the console
         * @desc This prints the entire tree of the report to the console (Debug)
         * @param {boolean} asPrinted optional - true = display as actually outputted, otherwise display in section/group order
         */
        printStructure: function (asPrinted) {
            const top = this._findRootReport();
            printStructure(top, 0, !!asPrinted);
        },

        /**
         * Sets or gets the current page is landscape
         * @param {boolean} [value=false] - true/false set landscape mode
         */
        landscape: function (value) {
            const parentReport = this._findRootReport();
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
            const parentReport = this._findRootReport();
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
            const parentReport = this._findRootReport();
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
            const parentReport = this._findRootReport();
            parentReport.registerFont(name, definition);
            return this;
        },

        /**
         * Sets or gets the current margin size of paper
         * @param {number} [value=72] - margin size
         */
        margins: function (value) {
            const parentReport = this._findRootReport();
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
            const parentReport = this._findRootReport();
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
            const parentReport = this._findRootReport();
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
            const parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.negativeParentheses();
            }
            parentReport.negativeParentheses(value);
            return this;
        },

        /**
         * Sets or gets the current font size
         * @param {number} [value] - font size to set it to
         * @returns {number|object}
         */
        fontSize: function (value) {
            const parentReport = this._findRootReport();
            if (!arguments.length) {
                return parentReport.fontSize();
            }
            parentReport.fontSize(value);
            return this;
        },

        /**
         * Import a PDF into the current Document
         */
        importPDF: function (value) {
            const pr = this._findParentReport();
            return pr.importPDF(value);
        },

        /**
         * Clear the Totals on a report
         * @private
         */
        _clearTotals: function () {
            let i, max, field;

            // Make sure to Zero out any keys if this is a new structure
            for (i = 0, max = this._math.length; i < max; i++) {
                field = this._math[i][1];
                this._totals[field] = 0;

                // If you add any to this Switch, make sure you update the switch in the _calcTotals
                switch (this._math[i][0]) {
                    case mathTypes.SUM:
                        break;
                    case mathTypes.AVERAGE:
                        this._totals[field + "_sum"] = 0;
                        this._totals[field + "_cnt"] = 0;
                        break;
                    case mathTypes.MIN:
                        this._totals[field + "_min"] = 0;
                        break;
                    case mathTypes.MAX:
                        break;
                    case mathTypes.COUNT:
                        break;
                }
            }

            // Sub-Reports can set new keys in this group's total, so if we are clearing totals; we need to clear them also.
            for (let key in this._totals) {
                //noinspection JSUnresolvedFunction
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
            let i, max, field, srcField;
            for (i = 0, max = this._math.length; i < max; i++) {
                field = this._math[i][1];
                srcField = field;
                if (currentData[field + "_original"] !== undefined) {
                    srcField += "_original";
                }
                let result = 0;
                if (currentData[srcField] != null && !isNaN(currentData[srcField])) {
                    result = parseFloat(currentData[srcField]);
                }
                // If you add any to this Switch, make sure you update the switch in the _clearTotals
                switch (this._math[i][0]) {
                    case mathTypes.SUM:
                        this._totals[field] += result;
                        break;
                    case mathTypes.AVERAGE:
                        this._totals[field + "_sum"] += result;
                        this._totals[field + "_cnt"] += 1;
                        this._totals[field] = this._totals[field + "_sum"] / this._totals[field + "_cnt"];
                        break;
                    case mathTypes.MIN:
                        if (this._totals[field + "_min"] === 0 || result < this._totals[field]) {
                            this._totals[field + "_min"] = 1;
                            this._totals[field] = result;
                        }
                        break;
                    case mathTypes.MAX:
                        if (this._totals[field] < result) {
                            this._totals[field] = result;
                        }
                        break;
                    case mathTypes.COUNT:
                        this._totals[field]++;
                        break;
                    default:
                        Report.error("REPORTAPI: Math expression id is wrong", this._math[i][0], " on ", field);
                }
            }
        },

        _reportRenderMode: function(value) {
            const parentReport = this._findRootReport();
            if (arguments.length) {
                return parentReport._reportRenderMode(value);
            } else {
                return parentReport._reportRenderMode();
            }
        },

        _checkAsyncFunctionPrototype: function(f, typeFunction) {
            if (typeof f !== 'function') {
                return true;
            }
            const curMode = this._reportRenderMode();
            if (f.length === 4) {
                if (curMode === reportRenderingMode.UNDEFINED) {
                    this._reportRenderMode(reportRenderingMode.ASYNC);
                } else if (curMode !== reportRenderingMode.ASYNC) {
                    Report.error("REPORTAPI: You have attempted to add a ASYNCHRONOUS ", typeFunction.toUpperCase(), "function to a report that already has a SYNCHRONOUS function added to it.  The report MUST be either fully ASYNCHRONOUS or fully SYNCHRONOUS, otherwise issues will occur, so we are ignoring this", typeFunction.toUpperCase(), "function and leaving the report SYNCHRONOUS!");
                    return false;
                }
            } else {
                if (curMode === reportRenderingMode.UNDEFINED) {
                    this._reportRenderMode(reportRenderingMode.SYNC);
                } else if (curMode !== reportRenderingMode.SYNC) {
                    Report.error("REPORTAPI: You have attempted to add a SYNCHRONOUS", typeFunction.toUpperCase(), "function to a report that already has a ASYNCHRONOUS function added to it.  The report MUST be either fully ASYNCHRONOUS or fully SYNCHRONOUS, otherwise issues will occur, so we are ignoring this", typeFunction.toUpperCase(), "function and leaving the report ASYNCHRONOUS!");
                    return false;
                }
            }
            return true;
        },

        /**
         * Renders the footer on this report group
         * @param {ReportRenderer} Rpt - the report rendering object
         * @param {Object} State - current state of report
         * @param {function} callback when done with the footers
         * @private
         */
        _renderFooter: function (Rpt, State, callback) {
            const finishFooter = () => {
                if (this._footer !== null) {
                    if (this._curBandWidth.length > 0) {
                        Rpt._bandWidth(this._curBandWidth);
                        Rpt._bandOffset(this._curBandOffset);
                    }
                    this._expandRowTree(this._lastData);
                    this._footer.run(Rpt, State, this._lastData, callback);
                } else if (callback) {
                    callback();
                }
            };

            const setupTotals = () => {
                Rpt.totals = clone(this._totals);
                const parent = this._findParentDataSet();
                let found = false;
                for (let key in Rpt.totals) {
                    //noinspection JSUnresolvedFunction
                    if (Rpt.totals.hasOwnProperty(key)) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    finishFooter();
                } else {
                    const x = (err, data) => {
                        this._expandRowTree(data);
                        if (err) {
                            Report.error("REPORTAPI: ---- ERROR:", new ReportError({error: err}));
                        }
                        Rpt.totals = data;
                        finishFooter();
                    };
                    parent._totalFormatter(Rpt.totals, x);
                }
            };

            if (this._child !== null && this._child._renderFooter) {
                this._child._renderFooter(Rpt, State, setupTotals);
            } else {
                setupTotals();
            }
        },

        /**
         * Renders the Detail in Sync mode
         * @param Rpt
         * @param State
         * @param currentData
         * @param callback
         * @private
         */
        _renderSyncDetail: function(Rpt, State, currentData, callback) {
            try {
                this._detail(Rpt, currentData, State);
            }
            catch(err) {
                Report.error("REPORTAPI: Error when calling group Detail", new ReportError({error: err, stack: err && err.stack}));
            }
            // Callback is Required; so no "if" check
            callback();
        },

        /**
         * Renders the detail in Async Mode
         * @param Rpt
         * @param State
         * @param currentData
         * @param callback
         * @private
         */
        _renderAsyncDetail: function(Rpt, State, currentData, callback) {
            this._detail(Rpt, currentData, State, (err) => {
                if(err) {
                    Report.error("REPORTAPI: Error when calling group Detail", new ReportError({error: err, stack: err && err.stack}));
                }
                // Callback is Required; so no "if" check
                callback();
            });

        },

        _renderStringDetailParse: function(currentData) {
            let rendered = [];
            let idxStr, start = 0;
            while ((idxStr = this._detail.indexOf('{{', start)) >= 0) {
                let idxEnd = this._detail.indexOf('}}', idxStr);
                if (idxEnd > idxStr) {
                    if (idxStr !== start) {
                        rendered.push(this._detail.substring(start, idxStr));
                    }
                    let fld = this._detail.substring(idxStr + 2, idxEnd);
                    if (typeof currentData[fld] !== 'undefined') {
                        rendered.push({fld: fld});
                    } else {
                        rendered.push("{{"+fld+"}}");
                    }
                    start = idxEnd+2;
                }
            }
            if (start < this._detail.length) {
                rendered.push(this._detail.substring(start));
            }
            this._detailRendered = rendered;
        },

        _renderStringDetail: function(Rpt, State, currentData, callback) {
            let results = [];
            if (this._detailRendered == null) {
                this._renderStringDetailParse(currentData);
            }

            for (let i=0;i<this._detailRendered.length;i++) {
                if (typeof this._detailRendered[i].fld !== 'undefined') {
                    results.push(currentData[this._detailRendered[i].fld]);
                } else {
                    results.push(this._detailRendered[i]);
                }
            }

            Rpt.print(results.join(""), callback);
        },

        _renderBandDetail: function(Rpt, State, currentData, callback) {
            let bandData = [];
            for (let i=0;i<this._detail.length;i++) {
                const data = {data: currentData[this._detail[i][0]] || ''};
                if (this._detail[i][1]) {
                    data.width = parseInt(this._detail[i][1],10);
                }
                if (this._detail[i][2]) {
                    data.align = parseInt(this._detail[i][2],10);
                    if (isNaN(data.align)) {
                        switch (this._detail[i][2].toLowerCase()) {
                            case "left": data.align = 1; break;
                            case "right": data.align = 3; break;
                            case "center": data.align = 2; break;
                            default: data.align = 1;
                        }
                    }
                }
                bandData.push(data);
            }
            Rpt.band(bandData, {border:1, width: 0, wrap: 1}, callback );
        },

        /**
         * This is a NOP detail rendered, by setting detail this function will be set to the proper version
         * @param Rpt
         * @param State
         * @param currentData
         * @param callback
         * @private
         */
        _renderDetail: function(Rpt, State, currentData, callback) {
            // this is a basically a NOP function, which will be replaced by detail being set
            callback();
        },

        /**
         * Renders this report object
         * @param {ReportRenderer} Rpt - report object
         * @param {Object} State of the report
         * @param {Object} currentData - the current data
         * @param {function} callback - the callback when it is done rendering the report
         * @private
         */
        _renderIt: function (Rpt, State, currentData, callback) {
            let groupChanged = false, headerSize = 0;
            State.currentGroup = this;

            if (this._header) {
                headerSize = this._header._partHeight;
                State.additionalHeaderSize += headerSize;
            }
            if (this._level === -1) {
                this._level = (++Rpt._totalLevels);
            }

            // This actually calls the Detail Printing
            const handleDetail = (detailCallback) => {
                Rpt._level = this._level;
                if (Report.trace) {
                    console.error("Running Detail", this._level);
                    if (Report.callbackDebugging) {
                        console.error(" - Callback is: ", typeof callback === "function" ? "Valid" : "** Invalid **");
                    }
                }

                this._expandRowTree(currentData);
                this._renderDetail(Rpt, State, currentData, detailCallback);
            };

            // This finishes the Calculations
            const finishRenderGroupStep2 = () => {
                this._calcTotals(currentData);

                // We need to capture the Primary Band sizes for later use in the footers.
                if (this._groupOnField === null) {
                    if (!this._calculatedBands) {
                        this._calculatedBands = true;
                        this._curBandWidth = Rpt._bandWidth();
                        this._curBandOffset = Rpt._bandOffset();
                        this._findParentReport()._setBandSize(this._curBandWidth, this._curBandOffset);
                    }
                }
                State.additionalHeaderSize -= headerSize;

                callback();
            };

            // This handles the remainder of the rending of this detail section
            const finishRenderGroup = () => {
                // We need to reset this because a child will set the state.currentGroup to itself
                State.currentGroup = this;
                if (this._runHeaderWhen !== Report.show.always) {
                    State.additionalHeaderSize += headerSize;
                }

                if (this._runDetailAfterSubgroup && this._detail !== null) {
                    handleDetail(finishRenderGroupStep2);
                } else {
                    finishRenderGroupStep2();
                }
            };

            // This actually prints the Child
            const continueRenderingStep2 = () => {
                if (this._runHeaderWhen !== Report.show.always) {
                    State.additionalHeaderSize -= headerSize;
                }
                if (this._child !== null) {
                    this._child._renderIt(Rpt, State, currentData, finishRenderGroup);
                } else {
                    finishRenderGroup();
                }
            };

            // this handles doing the pre-detail (if set)
            const continueRendering = () => {
                this._expandRowTree(currentData);
                this._currentData = clone(currentData);

                // Run our Detail before a subgroup
                if (!this._runDetailAfterSubgroup && this._detail !== null) {
                    handleDetail(continueRenderingStep2);
                } else {
                    continueRenderingStep2();
                }
            };


            // Handles the Group Change code
            const groupChangeCallback = (reset) => {
                if (reset) {
                    if (this._footer !== null) {
                        this._lastData = clone(currentData);
                    }

                    // We only clear the totals on added groups; not the master "detail" group.
                    if (this._groupOnField !== null) {
                        this._clearTotals();
                    }
                }

                if (this._header !== null) {
                    Rpt._level = this._level;
                    this._expandRowTree(currentData);

                    // TODO: Should we calculate the average detail size?    We are hard coding it to 20 right now, until we decide if we should do this...
                    if (State.additionalHeaderSize + Rpt._PDF.y >= Rpt._maxY() - 20) {
                        this._currentData = clone(currentData);

                        Rpt.newPage({save:true, breakingBeforePrint: true}, () => {
                            this._hasRanHeader = true;
                            if (!reset) { Rpt._resetPageHeaderCounter(); }
                            continueRendering();
                        });
                    } else {
                        this._header.run(Rpt, State, currentData, () => {
                            this._hasRanHeader = true;
                            if (!reset) { Rpt._resetPageHeaderCounter(); }
                            continueRendering();
                        });
                    }
                } else {
                    this._hasRanHeader = true;
                    continueRendering();
                }
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
                    this._renderFooter(Rpt, State, () => {
                            groupChangeCallback(true);
                    });
                } else {
                    groupChangeCallback(true);
                }
            } else if (Rpt.hasChanges() && !this._hasRanHeader) {
                  groupChangeCallback(false);
            } else {
                continueRendering();
            }
        },

        /**
         * This runs a Header/Footer for calculation purposes and then calls the callback
         * @param part
         * @param Rpt
         * @param bogusData
         * @param callback
         * @private
         */
        _calculatePart: function(part, Rpt, bogusData, callback) {
            if (part) {
                Rpt._addPage();
                part.run(Rpt, {isCalc: true}, bogusData, callback);
            } else if (callback) {
                callback();
            }
        },

        /**
         * Figures out the size of the headers/footers for this report object
         * @param {ReportRenderer} Rpt - current report we are running on
         * @param {Object} bogusData - bogus data
         * @param {function} callback - the callback to call when it is done
         * @private
         */
        _calculateFixedSizes: function (Rpt, bogusData, callback) {
			this._clearTotals();
			this._calculatePart(this._header, Rpt, bogusData, () => {
				Rpt.totals = this._totals;
				this._calculatePart(this._tfooter, Rpt, bogusData, () => {
					this._calculatePart(this._footer, Rpt, bogusData, () => {
						if (this._child !== null) {
							this._child._calculateFixedSizes(Rpt, bogusData, callback);
						} else {
							callback();
						}
					});
				});
			});
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
                const c = this._child;
                const sec = new ReportSection(this);
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
            let parent = this;
            while (parent._parent) {
                parent = parent._parent;
            }
            //noinspection JSValidateTypes
            return parent;
        },

        /**
         * Finds the Parent Report
         * @param [start]
         * @return {Report} the Parent Report
         * @private
         */
        _findParentReport: function (start) {
            let parent = this._parent;
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
            let parent = this._parent;
            while (!parent._isDataSet) {
                parent = parent._parent;
            }
            return (parent);
        },

        /**
         * Finds the Section controlling this Group
         * @return {ReportSection}
         * @private
         */
        _findParentSection: function () {
            let parent = this._parent;
            while (!parent._isSection) {
                parent = parent._parent;
            }
            return (parent);
        },


        /**
         * Expands a row into a tree of objects.
         * @param target
         */
        _expandRowTree: function (target) {
            for (let prop in target) {
                if (target.hasOwnProperty(prop)) {
                    const propSplit = prop.split('.');
                    const count = propSplit.length;
                    if (count <= 1) { continue; }

                    let lastObj = target;
                    for (let i = 0; i < count; i++) {
                        let obj = lastObj[propSplit[i]];
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

    Report.buildFontIndex = function(fonts) {
        let fontIndex = {};
        for (let font in fonts) {
            if (fonts.hasOwnProperty(font)) {
                font = fonts[font];
                for (let fontType in font) {
                    if (font.hasOwnProperty(fontType)) {
                        fontIndex[font[fontType]] = font;
                    }
                }
            }
        }
        return fontIndex;
    };

    // Standard Font constants
    Report.fonts = {
        times: {normal: 'Times-Roman', bold: 'Times-Bold', italic: 'Times-Italic', bolditalic: 'Times-BoldItalic'},
        helvetica: {normal: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique', bolditalic: 'Helvetica-BoldOblique'},
        courier: {normal: 'Courier', bold: 'Courier-Bold', italic: 'Courier-Oblique', bolditalic: 'Courier-BoldOblique'},
        symbol: {normal: 'Symbol'},
        dingbats: {normal: 'ZapfDingbats'}
    };

    // Generate the Indexed Fonts
    Report._indexedFonts = Report.buildFontIndex(Report.fonts);

    // Formatting constants
    Report.format = {
        /** @constant {number} */
        off: 0,
        on: 1,
        withFormatted: 2,
        withformatted: 2,
        withOriginal: 3,
        withoriginal: 3
    };

    // once - original behavior, newPageOnly = run any time a new page triggers and this is the current group,
    // always = same as newPage but this header/footer is included when in sub-groups.
    Report.show = {once: 0, newPageOnly: 1, newpageonly: 1, always: 2 };

    Report.alignment = {LEFT: 1, left: 1, RIGHT: 3, right:3,  CENTER: 2, center: 2};

    Report.renderType = {
        file: 0,
        pipe: 1,
        buffer: 2
    };

    /**
     * Enable Report Tracing
     * @type {boolean}
     */
    Report.trace = false;

    /**
     * Enable Report Callback Debugging
     * @type {boolean}
     */
    Report.callbackDebugging = false;


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
    lowerPrototypes(ReportRenderer.prototype);

    /**
     * ReportGroup
     * @type {ReportGroup}
     * @constructs ReportGroup
     */
    Report.Group = Report.group = ReportGroup;

    /**
     * ReportSection
     * @type {ReportSection}
     */
    Report.Section = Report.section = ReportSection;

    /**
     * ReportDataSet
     * @type {ReportDataSet}
     */
    Report.DataSet = Report.dataset = ReportDataSet;


    /// ---------------------- Don't Copy below this line
    _global.Report = Report;

}(typeof exports === 'undefined' ? this : exports));
