"use strict";

/***
 * Demo 19 - Test a dynamic report built from the ReportGenerator
 */


const ReportBuilder = require('../lib/fluentReportsBuilder').ReportBuilder;
const displayReport = require('./reportDisplayer');

const data = [
    {id: 1, name: "John Doe", emphours: [
       {week: 20, day: "Monday", hours: 4},
       {week: 20, day: "Tuesday", hours: 8},
       {week: 20, day: "Wednesday", hours: 8},
       {week: 21, day: "Thursday", hours: -2},
       {week: 21, day: "Friday", hours: 8},

       {week: 22, day: "Monday", hours: 4},
       {week: 22, day: "Tuesday", hours: 8},
       {week: 22, day: "Wednesday", hours: 8},
       {week: 23, day: "Thursday", hours: 2},
       {week: 23, day: "Friday", hours: 8},

       {week: 25, day: "Monday", hours: 4},
       {week: 25, day: "Tuesday", hours: 8},
       {week: 25, day: "Wednesday", hours: 8},
       {week: 26, day: "Thursday", hours: 2},
       {week: 26, day: "Friday", hours: 8}
   ]},
    {id: 3, name: "Sarah Williams", emphours: [
       {week:20, day: "Monday", hours: 8}
   ]},
    {id: 5, name: "Jane Doe", emphours: [
       {week: 20, day: "Monday", hours: 5},
       {week: 20, day: "Tuesday", hours: 8},
       {week: 21, day: "Wednesday", hours: 7},
       {week: 21, day: "Thursday", hours: 8},
       {week: 21, day: "Friday", hours: 8},

       {week: 22, day: "Monday", hours: 5},
       {week: 22, day: "Tuesday", hours: 8},
       {week: 23, day: "Wednesday", hours: 7},
       {week: 23, day: "Thursday", hours: 8},
       {week: 23, day: "Friday", hours: 8},

       {week: 25, day: "Monday", hours: 5},
       {week: 25, day: "Tuesday", hours: 8},
       {week: 26, day: "Wednesday", hours: 7},
       {week: 26, day: "Thursday", hours: 8},
       {week: 26, day: "Friday", hours: 8}
   ]}
];

// Reports can have multiple States; by default they have one State, so all states will be directed to this value
// However, a specific "type" can have its own state; called "state: <number>"
// All functions that are created should be "function (report, data, state, vars)"

let reportData =
    {
        type: 'report',
        name: 'demo19.pdf',
        autoPrint: false,
        fontSize: 8,

        variables: {counter: 0},

        //titleHeader: [],
        finalSummary: {type: 'raw', values: ["Total Hours:", "hours", 3]},
        pageHeader: {type: 'raw', values: ["Employee Hours"]},
        //pageFooter: null,

        groupBy: [{
            type: 'group',
            groupOn: 'name',
            header: [
                {
                type: "print",
                field: 'name',
                settings: {fontBold: true, fill: '#6f6f6f', textColor: '#ffffff', link: 'http://www.fluentReports.com/'}
            } ],
//            detail: [],
            footer: [
                {type: 'calculation', op: "concat", name: 'totals', fields: [{text: "Totals for "}, {field: "name"}]},
                {
                type: "band",
                fields: [
                    {function: {type: 'function', function: "return `Totals for ${data.name}`", async: false}, width: 180},
                    {total: "hours", width: 100, align: 3}
                ]},
                {type: 'newLine'}
            ],
        }],
//        header: [],
        detail: [],
        subReports:[
            {
                type: 'report',
                dataType: 'parent',
                data: 'emphours',
                calcs: {sum: ['hours']},
                groupBy: [
                    {
                        type: "groupfunction",
                        groupOn: "week",
                        header: [
                            {
                                skip: true, type: 'function', function: "vars.counter=0;", async: false
                            },
                            {
                            type: 'print',
                            function: {type: 'function', function: 'return `Week Number: ${data.week}`'},
                            settings: {x: 100, addY: 2}
                        }],
                        footer: [ {
                            type: 'newLine'
                        }]
                    }
                ],
                detail: [
                    {
                        type: 'function', function: "vars.counter++;"
                    },
                    {
                        type: 'band',
                        fields: [
                            {state: 'parentData.name', width: 80},
                            {field: 'day', width: 100},
                            {field: 'hours', align: 3, width: 100, textColor: {type: 'function', function: "return data.hours < 0 ? '#FF0000' : '#000000';"}}
                        ],
                        settings:
                            {
                                border:0, width: 0, wrap: true, textColor: '#0000ff',
                                fill: {type: 'function', function: "return (vars.counter % 2 === 0 ? '#f0f0f0' : '#e0e0e0');"}
                            }
                    },
                ]
            }],
//        footer: []
    };


let rpt = new ReportBuilder(reportData, data);

// These two lines are not normally needed for any normal reports unless you want to use your own fonts...
// We need to add this because of TESTING and making the report consistent for CI environments
rpt.registerFont("Arimo", {normal: __dirname+'/Fonts/Arimo-Regular.ttf', bold: __dirname+'/Fonts/Arimo-Bold.ttf', 'italic': __dirname+'/Fonts/Arimo-Italic.ttf'});
rpt.font("Arimo");


if (typeof process.env.TESTING === "undefined") { rpt.printStructure(); }

console.time("Rendered");
rpt.render().then((name) => {
    console.timeEnd("Rendered");
    const testing = {images: 2, blocks: ["130,140,180,60"]};
    displayReport(null, name, testing);
}).catch((err) => {
    console.error("Your report had errors while running", err);
});


