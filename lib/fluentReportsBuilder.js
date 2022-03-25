/**************************************************************************************
 * (c) 2019-2022, Master Technology
 * Licensed under the MIT license or contact me for a support, changes, enhancements.
 *
 * Any questions please feel free to put a issue up on github
 *
 *                                                      Nathan@master-technology.com
 *************************************************************************************/
"use strict";

// Import the Report system.
const Report = require('./fluentReports' ).Report;
const BlobStream = require("./third-party/blob-stream");

/**
 * Internal class to handle Runnable commands
 */
class ReportRunnable
{
    constructor(options) {
        if(options.headerFooter) {
            this._settings = options.headerFooter;
        } else {
            this._settings = {children: []};
        }
        if(options.formatterFunctions){
            this._formatterFunctions = options.formatterFunctions;
        } else {
            this._formatterFunctions = {};
        }

        return (report, data, scope, callback) => {
            this._run(report, data, scope, callback);
        };
    }

    /**
     * Creates a function to run, and cache's it on the key where the text version exists; to eliminate having to recreate it each loop
     * @param setting
     * @param info
     * @param callback
     * @private
     */
    _handleFunction(setting, info, callback) {
        if (setting.async) {
            if (!setting.func) {
                setting.func = new Function('report', 'data', 'state', 'vars', 'done', setting.function); // jshint ignore:line
            }
            setting.func(info.report, info.data, info.state, info.variables, (output)=>{
                callback(null, output);
            });
        } else {
            if (!setting.func) {
                setting.func = new Function('report', 'data', 'state', 'vars', setting.function); // jshint ignore:line
            }
            callback(null, setting.func(info.report, info.data, info.state, info.variables));
        }
    }

    /**
     * This handles a single option
     * - if it has a type=function, it runs the function handler...
     * - if it has a "field" key, then this field key is swapped to the data[value]
     * @param info
     * @param key
     * @param inOptions
     * @param callback
     * @param formatCallback
     * @private
     */
    _calculateOption(info, key, inOptions, callback, formatCallback) {
        let value = inOptions[key];
        if (value == null) {
            console.log("Missing Value:", key);
            callback(key, '');
            return;
        }

        if (typeof value.type !== 'undefined') {
            if(value.type === "function"){
                this._handleFunction(value, info, (err, result) => {
                    formatCallback(key, result);
                });
            }
            else if(value.type === "object"){
                callback(key,value.object);
            }
            else {
                console.error("FRG-Builder doesn't know how to handle the type: [ "+value.type+" ]");
            }
        }
        else if (key === 'variable') {
            formatCallback(key,info.variables[value]);
        }
        else if (key === 'state') {
            let keys = value.split(".");
            let source = info.state;
            for (let i=0;i<keys.length;i++) {
                source = source[keys[i]];
            }
            // Convert this to a "Field" key so the report engine considers it output...
            formatCallback('field', source);
        } else if (key === 'parentData') {
            // Convert this to a "Field" key so the report engine considers it output...
            formatCallback('field', info.state.parentData[value]);
        } else if (key === 'field') {
            // Check for parentData if key doesn't exist on current row
            if (typeof info.data[value] === 'undefined' && typeof info.state.parentData[value] !== 'undefined') {
                formatCallback(key, info.state.parentData[value]);
            } else {
                formatCallback(key, info.data[value]);
            }
        } else if (key === 'total') {
            formatCallback(key, info.report.totals[value]);
        } else if (key === 'absoluteX') {
            // absoluteX is different then AbsY, AbsY needs to take in account the margins
            // absX does not, as the functions running will take in account the margins; so we
            // start off at Zero
            callback("x", value);
        } else if (key === 'absoluteY') {
//            console.log("AbsY", info.startY, value);
            // Used to make things
            // We override the "y" value
            callback("y", info.startY + value);
        } else {
            callback(key, value);
        }
    }

    /**
     * This handles the entire object of options...
     * @param inOptions
     * @param info
     * @param callback
     * @private
     */
    _handleOptions(inOptions, info, callback) {
        let finalOptions = {};
        let counter=1, tracking=0;
        if (inOptions == null) {
            callback({}); return;
        }


        const doneChecker = (key, value) => {
            if (key) {
                finalOptions[key] = value;
            }
            tracking++;
            if (tracking === counter) {
                callback(finalOptions);
            }
        };

        const functionFormatter = (key, value) => {
            if(inOptions && inOptions.formatFunction ) {
                const functionData = this._formatterFunctions[inOptions.formatFunction];
                if(functionData) {
                    let handled = false;
                    functionData(value, info.data, (output)=> {
                        if (handled) {
                            console.log("You have an extra callback in your", inOptions.formatFunction, "formatter function");
                            return;
                        }
                        handled = true;
                        doneChecker(key, output);
                    });
                    return;
                }
            }
            doneChecker(key, value);
        };


        for (let key in inOptions) {
            if (inOptions.hasOwnProperty(key)) {
                counter++;
                this._calculateOption(info, key, inOptions, doneChecker,  functionFormatter);
            }
        }
        doneChecker();
    }

    /**
     * This handles the 'print' command
     * @param setting
     * @param info
     * @param callback
     * @private
     */
    _handlePrint(setting, info, callback) {
        // TODO: See if we can wrap this entire routine in _handleOptions first -- would be more optimized, and cleaner data flow

        if (setting && setting.settings && typeof setting.settings.absoluteX !== 'undefined') {
            // Print routine is the only routine that does not have Auto-Margin
            // So we have to Manually set the margin in absolute mode...
            setting.settings.addX = info.startX;
        }
        let output;
        if (setting.field) {
            if (!info.data || !info.data[setting.field] ) {
                output = '';
            } else {
                output = info.data[setting.field] || '';
            }
        }
        else if (setting.text) {
            output = setting.text;
        }
        else if (setting.function) {
            this._handleFunction(setting.function, info, (err, output) => {
                this._handleOptions(setting.settings, info,(options) => {
                    if (options.align && options.align !== "none") {
                        options.x = 0;
                    }
                    info.report.print(output, options, callback);
                });
            });
            return;
        } else if (setting.page) {
            this._handleOptions(setting.settings, info,(options) => {
                options.text = setting.page;
                if (!options.align) {
                    options.align = "none";
                } else if (options.align !== "none") {
                    options.x = 0;
                }
                info.report.pageNumber(options);
                callback();
            });
            return;
        } else if (setting.raw) {
            output = setting.raw.join(" ");
            setting.settings = {align: "center"};
        } else if (setting.total) {
            output = info.report.totals[setting.total];
        } else if (setting.variable) {
            output = info.variables[setting.variable];
        } else if (setting.calculation) {
            output = info.variables[setting.calculation];
        }
        if(setting.settings && setting.settings.formatFunction){
            const functionData = this._formatterFunctions[setting.settings.formatFunction];
            if(functionData) {
                let handled = false;
                functionData(output, info.data, (output) => {
                    if (handled) {
                        console.log("FRB: You have an extra callback in your ", setting.settings.formatFunction, "formatting function");
                        return;
                    }
                    handled = true;
                    this._handleOptions(setting.settings, info,(options) => {
                        if (options.align && options.align !== "none") {
                            options.x = 0;
                        }
                        info.report.print(output, options, callback);
                    });
                });
                return;
            }
        }
        this._handleOptions(setting.settings, info,(options) => {
            if (options.align && options.align !== "none") {
                // Location and Width is invalid if using Alignment
                if (typeof options.x !== "undefined") { options.x = 0; }
                if (options.width > 0) {
                    // We have to Align the width box properly
                    switch (options.align) {
                        case 'center':
                            options.x = (info.report.pageWidth() / 2) - (options.width / 2);
                            break;
                        case 'right':
                            options.x = info.report.pageWidth() - options.width - 1;
                            break;
                    }
                }
            }

            info.report.print(output, options, callback);
        });
    }


    /**
     * This handles the 'print' command
     * @param originalSetting
     * @param info
     * @param callback
     * @private
     */
    _handleBand(originalSetting, info, callback) {
        let setting = JSON.parse(JSON.stringify(originalSetting));//so we can make changes to this w/o changing the original.
        //A hack implemented, since FluentReports doesn't support border objects on the band, just the cells.
        if(setting.settings && setting.settings.border && setting.settings.border.type){
            for(let i =0;i<setting.fields.length;i++){
                if(setting.fields[i].border && !setting.fields[i].border.hacked) {
                    continue;//Skip all naturally given border objects.
                }
                setting.fields[i].border = {
                    "type":"object",
                    "hacked":true,//used to tell if this object was given naturally or via the hack.
                    "object":{
                        "left":(i === 0) ? setting.settings.border.object.left : 0,
                        "right":(i+1 === setting.fields.length) ? setting.settings.border.object.right : 0,
                        "top":setting.settings.border.object.top,
                        "bottom":setting.settings.border.object.bottom,
                    }
                };
            }
        }

        let counter = -1;
        let bandOutput = [];
        let options;

        const completed = (bo) => {
            counter++;
            if (bo != null) {
                bo.data = '';
                if(bo.field !== undefined) { bo.data = bo.field; }
                else if(bo.text !== undefined) { bo.data = bo.text; }
                else if(bo.total !== undefined) { bo.data = bo.total; }
                else if(bo.function !== undefined) { bo.data = bo.function; }
                else if(bo.variable !== undefined) { bo.data = bo.variable; }
                bandOutput.push(bo);
            }

            if (counter === setting.fields.length) {
                if (options.suppressionBand) {
                    info.report.suppressionBand(bandOutput, options, callback);
                } else {
                    info.report.band(bandOutput, options, callback);
                }
            } else {
                // Handle each field
                this._handleOptions(setting.fields[counter], info, completed);
            }
        };

        // Handle the Band Settings
        this._handleOptions(setting.settings, info, (newOptions) => {
            options = newOptions;
            completed();
        });

    }

    /**
     * Handle type=calculation objects
     * @param setting
     * @param info
     * @param callback
     * @private
     */
    _handleCalculation(setting, info, callback) {
        let results;

        let counter = -1;
        let fields = [];

        const completed = (field) => {
            counter++;
            if (field != null) {
                fields.push (field.field || field.text || field.total || field.function || '');
            }

            if (counter === setting.fields.length) {
                switch (setting.op) {
                    case 'concat':
                        results = fields.join('');
                        break;
                    case 'add':
                        results = 0;
                        for (let i=0;i<fields.length;i++) { results += fields[i]; }
                        break;
                    case 'minus':
                        results = fields[0];
                        for (let i=1;i<fields.length;i++) { results -= fields[i]; }
                        break;
                    case 'multiply':
                        results = 1;
                        for (let i=0;i<fields.length;i++) { results *= fields[i]; }
                        break;
                    case 'divide':
                        results = fields[0];
                        for (let i=1;i<fields.length;i++) { results /= fields[i]; }
                        break;
                }
                // Assign the variable...
                info.variables[setting.name || 'calculation'] = results;
                callback();
            } else {
                // Handle each field
                this._handleOptions(setting.fields[counter], info, completed);
            }
        };
        completed();
    }


    /**
     * Handle an image
     * @param data
     * @param info
     * @param callback
     * @private
     */
    _handleImage(data, info, callback) {
        const settings = data.settings;
        let options = {};
        if (settings.top > 0) {
            options.y = info.report.currentY() + settings.top;
        } else {
            options.y = info.report.currentY();
        }
        if (settings.left > 0) {
            options.x = info.startX + settings.left;
        } else {
            options.x = info.startX;
        }


        if (settings.aspect) {
            switch (settings.aspect) {
                case 'none':
                    break;

                case 'size':
                    if (settings.width > 0) {
                        options.width = settings.width;
                    }
                    if (settings.height > 0) {
                        options.height = settings.height;
                    }
                    break;

                case 'fit':
                    options.fit = [settings.width, settings.height];
                    break;

                case 'cover':
                    options.fit = [settings.width || 50, settings.height || 50];
                    break;

                case 'scale':
                    if (settings.imgScale > 0) {
                        options.scale = parseFloat(settings.imgScale);
                    }
                    break;
            }
        }
        if (settings.align != null) {
            options.align = settings.align;
        }
        if (settings.valign != null) {
            options.valign = settings.valign;
        }

        if (data.image != null && data.image.length > 0) {
            let lastY = info.report.currentY();

            if (settings.usesSpace !== false) {
                // This might seem silly, but internally inside PDFKit the only way Y is
                // auto-advanced Is if the starting CurrentY === options.y, so since we
                // know we are advancing Y, we allow PDFKit to do the advancing by forcing
                // the matching of the start...
                info.report.setCurrentY(options.y);
            }
            info.report.image(data.image, options);

            // Reset the Space if we are not using any space for the image...
            if (settings.usesSpace === false) {
                info.report.setCurrentY(lastY);
            }


        }
        callback();
    }


    /**
     * Handle the type of Shape
     * @param settings
     * @param info
     * @param callback
     * @private
     */
    _handleShape(settings, info, callback) {
        let top = (settings.top > 0) ? settings.top : 0;
        let left = (settings.left > 0) ? settings.left : 0;
        let width = (settings.width > 0) ? settings.width : 0;
        let height = (settings.height > 0) ? settings.height : 0;
        let radius = (settings.radius > 0) ? parseFloat(settings.radius) : 0;
        let curX = info.report.currentX();
        let curY = info.startY;
        switch (settings.shape) {
            case 'box':
                info.report.box(curX + left , curY + top, width ,  height, settings);
                break;

            case 'circle':
                info.report.circle(curX + left + radius , curY + top + radius, radius,  settings);
                break;

            case 'line':
                info.report.line(curX + left , curY + top, curX + width + left, curY + height + top, settings);
                break;
        }

        /**
         * By Default the Shapes do not use any space in the report
         * However, in absolute mode; we are thinking this should default to being uses space
         */
        if (settings.usesSpace !== false) {
            info.report.setCurrentY(curY + top + height);
        }
        callback();
    }

    _runSetting(setting, info, callback) {

        // Skip anything set to skip: true
        if (setting.skip === true) { return callback(); }

        switch (setting.type) {
            case 'calculation':
                this._handleCalculation(setting, info, callback);
                return;

            case 'function':
                this._handleFunction(setting, info, callback);
                return;

            case 'print':
                this._handlePrint(setting, info, callback);
                return;

            case 'band':
                this._handleBand(setting, info, callback);
                return;

            case 'bandLine':
                info.report.bandLine(setting.thickness || 2, setting.gap || 0);
                break;

            case 'newLine':
                info.report.newLine(setting.lines || 1, callback);
                return;

            case 'newPage':
                if(typeof setting.active === "boolean" && setting.active === true) {
                    info.report.newPage(!!setting.saveOptions, callback);
                }
                else if(setting.active != null && typeof setting.active === "object" && setting.active.type === "function") {
                    this._handleFunction(setting.active, info,(error, output) => {
                        if (output) {
                            info.report.newPage(!!setting.saveOptions, callback);
                        }
                        else {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
                return;

            case 'shape':
                this._handleShape(setting.settings, info, callback);
                return;

            case 'image':
                this._handleImage(setting, info, callback);
                return;

            case 'raw':
                setting.raw = setting.values;
                this._handlePrint(setting, info, callback);
                return;

            default:
                console.error("Unknown runnable type:", setting.type);
        }
        callback();
    }

    _run(report, data, state, callback) {
        const variables = this._getVariables(state.CurrentGroup || report._primaryReport._detailGroup);
        let counter=-1;
        let info = {report, data, state, variables, startY: report.currentY(), startX: report.minX()};

        const finalCallback = () => {
            counter++;
            if (counter >= this._settings.children.length) {
                if (this._settings.fixedHeight) {
                    report.currentY(this._settings.height+info.startY);
                }
                callback();
            }
            else {
                this._runSetting(this._settings.children[counter], info, finalCallback);
            }
        };
        finalCallback();
    }

    _getVariables(group) {
        let rpt = group._findRootReport();
        //console.log("Vars:", rpt._designerVariables);
        return rpt._designerVariables;
    }

}

/**
 * The Report Generator class
 */
class ReportBuilder {
    /**
     * Pass it in a ReportDesignLayout get a Report back
     * @param {Object?} ReportDesignLayout
     * @param {Object?} reportData
     * @returns {Report|ReportBuilder}
     */
    constructor(ReportDesignLayout, reportData) {

        this._primaryReportGroup = null;
        if (ReportDesignLayout) {
            return this.parseReport(ReportDesignLayout, reportData);
        }
    }

    /**
     * If you created a ReportGenerator but didn't pass in a report, you need to call this
     * @param {Object} reportDesignLayout
     * @param {Object?} reportData
     * @returns {Report}
     */
    parseReport(reportDesignLayout, reportData) {

        if (reportDesignLayout && typeof reportDesignLayout.version !== "undefined") {
            if (reportDesignLayout.version !== 1 && reportDesignLayout.version !== 2) {
                console.error("This engine only understands version _1 & 2_ reports, please upgrade engine to use this report.");
                reportDesignLayout = {
                    type: "report",
                    name: reportDesignLayout.name != null ? reportDesignLayout.name : "report.pdf",
                    detail: {children: [{type: "print", text: "Invalid Report version"}]}
                };
            }
        }

        this._formatterFunctions = {};
        if(reportDesignLayout.formatterFunctions){
            for (let key in reportDesignLayout.formatterFunctions) {
                if (!reportDesignLayout.formatterFunctions.hasOwnProperty(key)) { continue; }
                if (typeof reportDesignLayout.formatterFunctions[key] === 'function') {
                    this._formatterFunctions[key] = reportDesignLayout.formatterFunctions[key];
                } else {
                    this._formatterFunctions[key] = new Function ('value', 'row', 'callback', reportDesignLayout.formatterFunctions[key]); // jshint ignore:line
                }
            }
        }

        this._handleReportObject(reportDesignLayout);

        if (reportData != null) {
            this._primaryReportGroup.data(reportData);
        } else
        if (reportDesignLayout.data != null) {
            this._primaryReportGroup.data(reportDesignLayout.data);
        }
        return this._primaryReportGroup;
    }

    /**
     * Parses a type="report" object
     * @param reportObject
     * @param parent
     * @private
     */
    _handleReportObject(reportObject, parent) {
        let workItem; //, primary = false;
        let options = {};


        if (reportObject.paperOrientation === "landscape") {
            options.landscape = true;
        }
        if (typeof reportObject.paperSize !== 'undefined') {
            options.paper = reportObject.paperSize;
        }
        if (typeof reportObject.font !== 'undefined') {
            options.font = reportObject.font;
        }
        if (typeof reportObject.fontSize !== 'undefined') {
            options.fontSize = reportObject.fontSize;
        }
        if (typeof reportObject.margins !== 'undefined') {
            options.margins = reportObject.margins;
        }
        if (typeof reportObject.autoPrint !== 'undefined') {
            options.autoPrint = reportObject.autoPrint;
        }
        if (typeof reportObject.fullScreen !== 'undefined') {
            options.fullScreen = reportObject.fullScreen;
        }
        if (typeof reportObject.negativeParentheses !== 'undefined') {
            options.negativeParentheses = reportObject.negativeParentheses;
        }
        if (typeof reportObject.paper !== 'undefined') {
            options.info = reportObject.info;
        }

        if (parent) {
            if (reportObject.dataType === 'parent') {
                workItem = parent.subDetail(reportObject.data);
            } else {
                workItem = new Report(parent, options);
            }
        } else {
            workItem = new Report(reportObject.name, options);
            this._primaryReportGroup = workItem;
            let parentReport = workItem._findRootReport();
            // Handle Tracking Variables for Report, Primary report ALWAYS gets a Variables group (just for safety)
            parentReport._designerVariables = reportObject.variables || {};
            //primary = true;
        }

        this._handleReportRunnables(reportObject, workItem);
        if (reportObject.calcs) {
            this._handleReportCalcs(reportObject.calcs, workItem);
        }
        if (reportObject.fonts) {
            this._handleReportFonts(reportObject.fonts, workItem);
        }
    }

    _handleReportFonts(reportObject, workItem) {
        if (!Array.isArray(reportObject) || reportObject.length === 0) { return; }
        for (let i=0;i<reportObject.length;i++) {
            workItem.registerFont(reportObject[i].name, Buffer.from(reportObject[i].data, "base64"));
        }
    }

    _handleReportCalcs(reportObject, workItem) {
        const calcTypes=['sum', 'min', 'max', 'count', 'average'];
        for (let i=0;i<calcTypes.length;i++) {
            if (reportObject[calcTypes[i]]) {
                let currentGroup = {_parent: workItem};

                while (currentGroup._parent && currentGroup._parent._isGroup) {
                    currentGroup = currentGroup._parent;
                    for (let j=0;j<reportObject[calcTypes[i]].length;j++) {
                        currentGroup[calcTypes[i]](reportObject[calcTypes[i]][j]);
                    }
                }

            }
        }

    }

    _handleReportRunnables(reportObject, workItem) {
        if (reportObject.titleHeader) {
            this._handleHeaderFooterDetail("titleHeader", reportObject.titleHeader, workItem);
        }
        if (reportObject.finalSummary) {
            this._handleHeaderFooterDetail("finalSummary", reportObject.finalSummary, workItem);
        }
        if (reportObject.pageHeader) {
            this._handleHeaderFooterDetail("pageHeader", reportObject.pageHeader, workItem);
        }
        if (reportObject.pageFooter) {
            this._handleHeaderFooterDetail("pageFooter", reportObject.pageFooter, workItem);
        }
        if (reportObject.header) {
            this._handleHeaderFooterDetail("header", reportObject.header, workItem);
        }
        if (reportObject.footer) {
            this._handleHeaderFooterDetail("footer", reportObject.footer, workItem);
        }
        if (reportObject.detail) {
            this._handleHeaderFooterDetail("detail", reportObject.detail, workItem);
        }

        if (reportObject.groupBy) {
            this._handleGroupOn(reportObject.groupBy, workItem);
        }

        if (reportObject.subReports) {
            for (let i=0;i<reportObject.subReports.length;i++) {
                    this._handleReportObject(reportObject.subReports[i], workItem);
            }
        }

        // Obsolete Method
        if (reportObject.subReport) {
            console.warn("[fluentReportsBuilder: subReport depreciated; switch to using subReports.");
            if (!Array.isArray(reportObject.subReport)) {
                this._handleReportObject(reportObject.subReport, workItem);
            } else {
                for (let i=0;i<reportObject.subReport.length;i++) {
                    this._handleReportObject(reportObject.subReport[i], workItem);
                }
            }
        }

    }

    /**
     * Handles the type="group"
     * @param groups
     * @param report
     * @private
     */
    _handleGroupOn(groups, report) {
        let curGroup = report;
        for (let i=0;i<groups.length;i++) {
            curGroup = curGroup.groupBy(groups[i].groupOn);
            this._handleReportRunnables(groups[i], curGroup);
            if (groups[i].calcs) {
                this._handleReportCalcs(groups[i].calcs, curGroup);
            }
        }
    }

    /**
     * Handled type which are typically functions that display some data
     * @param type
     * @param headerFooter
     * @param report
     * @private
     */
    _handleHeaderFooterDetail(type, headerFooter, report) {
        // The v0 Method of handling reports (Depreciated)
        if (Array.isArray(headerFooter)) {
            if (headerFooter.length === 0) { return; }
            // Special Case a single raw value in an array
            if (headerFooter.length === 1 && headerFooter[0].type === 'raw') {
                report[type]( Array.isArray(headerFooter[0].values) ? headerFooter[0].values : [headerFooter[0].values]);
                return;
            }
            report[type]( new ReportRunnable({
                formatterFunctions: this._formatterFunctions,
                headerFooter: {children: headerFooter}
            }) );

        }
        // v1 method of handling reports, we now want the structure to be .children
        else if (Array.isArray(headerFooter.children)) {
            // We don't have the same short circuit === 0 as the prior path, because the settings on this
            // object might need to be used; the above path can't have settings on the object...
            const options = {};
            if (headerFooter.pageBreak) {
                // a pageBreak of 1 = "automatic" / default engine behavior,
                if (headerFooter.pageBreak === "after" || headerFooter.pageBreak === "2" || headerFooter.pageBreak === 2) {
                    options.pageBreakAfter = true;
                } else if (headerFooter.pageBreak === "before" || headerFooter.pageBreak === "0" || headerFooter.pageBreak === 0) {
                    options.pageBreakBefore = true;
                }
            }
            if (headerFooter.children.length === 1 && headerFooter.children[0].type === 'raw') {
                report[type]( Array.isArray(headerFooter.children[0].values) ? headerFooter.children[0].values : [headerFooter.children[0].values], options);
                return;
            }
            report[type]( new ReportRunnable({
                formatterFunctions: this._formatterFunctions,
                headerFooter
            }) , options);

        }
        else if (typeof headerFooter === "string" || typeof headerFooter === "number") {
            report[type]([headerFooter]);
        } else if (typeof headerFooter.type !== 'undefined') {
            if (headerFooter.type === "raw") {
                report[type]( Array.isArray(headerFooter.values) ? headerFooter.values : [headerFooter.values]);
            } else {
                report[type](new ReportRunnable({
                    formatterFunctions: this._formatterFunctions,
                    headerFooter: {children: [headerFooter]}
                }));
            }
        } else {
            console.error("[FluentReportsBuilder] Type of Header/Detail/Footer", type, "Invalid data", headerFooter);
        }
    }
}


module.exports.ReportBuilder = ReportBuilder;
module.exports.Report = Report;
module.exports.BlobStream = BlobStream;