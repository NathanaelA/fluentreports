// Import the Report system.
const Report = require('./fluentReports' ).Report;
const BlobStream = require("./third-party/blob-stream");

/**
 * Internal class to handle Runnable commands
 */
class ReportRunnable {
    constructor(settings) {
        this._settings = settings;
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
            setting.func(info.report, info.data, info.state, info.variables, callback);
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
     * @param value
     * @param callback
     * @private
     */
    _calculateOption(info, key, value, callback) {
        if (value == null) {
            console.log("Missing Value:", key);
            callback(key, '');
        }
        if (typeof value.type !== 'undefined') {
            this._handleFunction(value, info, (err, result) => {
                callback(key, result);
            });
        } else if (key === 'state') {
            let keys = value.split(".");
            let source = info.state;
            for (let i=0;i<keys.length;i++) {
                source = source[keys[i]];
            }
            // Convert this to a "Field" key so the report engine considers it output...
            callback('field', source);
        } else if (key === 'parentData') {
            // Convert this to a "Field" key so the report engine considers it output...
            callback('field', info.state.parentData[value]);
        } else if (key === 'field') {
            // Check for parentData if key doesn't exist on
            if (typeof info.data[value] === 'undefined' && typeof info.state.parentData[value] !== 'undefined') {
                callback(key, info.state.parentData[value]);
            } else {
                callback(key, info.data[value]);
            }
        } else if (key === 'total') {
            callback(key, info.report.totals[value]);
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
        if (inOptions == null) { callback({}); return; }

        const doneChecker = (key, value) => {
            if (key) {
                finalOptions[key] = value;
            }
            tracking++;
            if (tracking === counter) {
                callback(finalOptions);
            }
        };

        for (let key in inOptions) {
            if (inOptions.hasOwnProperty(key)) {
                counter++;
                this._calculateOption(info, key, inOptions[key], doneChecker);
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
        let output;
        if (setting.field) {
            if (!info.data || !info.data[setting.field] ) { output = ''; }
            else {
                output = info.data[setting.field] || '';
            }
        } else if (setting.text ) {
            output = setting.text;
        } else if (setting.function) {
            this._handleFunction(setting.function, info, (err, output) => {
                this._handleOptions(setting.settings, info,(options) => {
                    info.report.print(output, options, callback);
                });
            });
            return;
        } else if (setting.page) {
            this._handleOptions(setting.settings, info,(options) => {
                options.text = setting.page;
                info.report.pageNumber(options);
                callback();
            });
            return;
        } else if (setting.raw) {
            output = setting.raw.join(" ");
            setting.settings = {align: "center"};
        }

        this._handleOptions(setting.settings, info,(options) => {
            info.report.print(output, options, callback);
        });
    }


    /**
     * This handles the 'print' command
     * @param setting
     * @param info
     * @param callback
     * @private
     */
    _handleBand(setting, info, callback) {
        let counter = -1;
        let bandOutput = [];
        let options;

        const completed = (bo) => {
            counter++;
            if (bo != null) {
                bo.data = bo.field || bo.text || bo.total || bo.function || '';
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
        }
        if (settings.left > 0) {
            options.x = info.report.currentX() + settings.left;
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
                    options.fit = {width: settings.width || 50, height: settings.height || 50};
                    break;

                case 'cover':
                    options.fit = {width: settings.width || 50, height: settings.height || 50};
                    break;

                case 'scale':
                    if (settings.scale > 0) {
                        options.scale = settings.scale;
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
            info.report.image(data.image, options);
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
        let width = (settings.width > 0) ? settings.width : 50;
        let height = (settings.height > 0) ? settings.height : 50;
        let radius = (settings.radius > 0) ? settings.radius : 50;
        let curX = info.report.currentX();
        let curY = info.startY;
        switch (settings.shape) {
            case 'box':
                info.report.box(curX + left , curY + top, curX+ width + left ,  curY + height + top, settings);
                break;

            case 'circle':
                info.report.circle(curX + left , curY + top, radius,  settings);
                break;

            case 'line':
                info.report.line(curX + left , curY + top, curX + width + left, curY + height + top, settings);
                break;

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
                info.report.newPage(!!setting.saveOptions, callback);
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
        let info = {report, data, state, variables, startY: report.currentY()};

        const finalCallback = () => {
            counter++;
            if (counter >= this._settings.length) { callback(); }
            else {
                this._runSetting(this._settings[counter], info, finalCallback);
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
        this._handleReportObject(reportDesignLayout);

        if (reportData != null) {
            this._primaryReportGroup.data(reportData);
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
        let workItem, primary = false;
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
            primary = true;
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
                let currentGroup = workItem;
                while (currentGroup._parent && currentGroup._parent._isGroup) {
                    currentGroup = currentGroup._parent;
                }

                for (let j=0;j<reportObject[calcTypes[i]].length;j++) {
                    currentGroup[calcTypes[i]](reportObject[calcTypes[i]][j]);
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

        if (reportObject.subReport) {
            this._handleReportObject(reportObject.subReport, workItem);
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
        if (Array.isArray(headerFooter)) {
            if (headerFooter.length === 0) { return; }
            // Special Case a single raw value in an array
            if (headerFooter.length === 1 && headerFooter[0].type === 'raw') {
                report[type]( Array.isArray(headerFooter[0].values) ? headerFooter[0].values : [headerFooter[0].values]);
                return;
            }
            report[type]( new ReportRunnable(headerFooter) );

        } else if (typeof headerFooter === "string" || typeof headerFooter === "number") {
            report[type]([headerFooter]);
        } else if (typeof headerFooter.type !== 'undefined') {
            if (headerFooter.type === "raw") {
                report[type]( Array.isArray(headerFooter.values) ? headerFooter.values : [headerFooter.values]);
                return;
            } else {
                report[type](new ReportRunnable([headerFooter]));
            }
        } else {
            console.error("Type of Header/Footer", type, "Invalid data", headerFooter);
        }
    }
}


module.exports.ReportBuilder = ReportBuilder;
module.exports.Report = Report;
module.exports.BlobStream = BlobStream;