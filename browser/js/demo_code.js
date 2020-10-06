/* (c) 2015-2019, Master Technology --  some code from pdfkit website */
"use strict";

/* globals ace */

let pipeStream = null;
let iFrame = null;
let editor = null;
let initialized = false;

let faxImg = "data:image/jpeg;base64,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";

function loadingVisible(v) {
    const loading = document.getElementById('loading');
    if (v) {
        loading.style.display = "inline";
    }
    else {
        loading.style.display = "none";
    }
}

function setupEventListener(item, event, handler) {
    item.addEventListener(event, handler, false);
}

function setupAttachEvent(item, event, handler) {
    item.attachEvent('on'+event, handler);
}

let setupEvent = function(item, event, handler) {
    if (item.addEventListener) {
        setupEvent = setupEventListener;
    } else if (item.attachEvent) {
        setupEvent = setupAttachEvent;
    }
    setupEvent(item, event, handler);
};

function menuChange(evt) {
    const idx = evt.target.selectedIndex;
    const option = evt.target.options[idx];
    evt.target.selectedIndex = 0;
    window.location.href = option.value;
}

let runningTimer;
function handleEditorChange() {
    runningTimer = null;
    try {
        const fn = new Function('Report', 'pipeStream', 'displayReport', editor.getValue()); // jshint ignore:line
        fn(window.fluentReports.Report, pipeStream, displayReport);
    } catch (e) {
        console.log(e);
    }

}

function resetBlobStream() {
    pipeStream = new window.fluentReports.BlobStream();
}

function init() {
    if (initialized) { return; }
    initialized = true;

    resetBlobStream();

    editor = ace.edit("editor");
    editor.setTheme("ace/theme/twilight");
    editor.getSession().setMode("ace/mode/javascript");

    editor.getSession().on('change', function() {
        if (runningTimer) {
            clearTimeout(runningTimer);
        }
        runningTimer = setTimeout(handleEditorChange, 250);
    });

    let rptItem = document.getElementById('rptFax');
    setupEvent(rptItem, "click", function() { useReport(runFaxReport); });
    rptItem = document.getElementById('rptInvoice');
    setupEvent(rptItem, "click", function() { useReport(runInvoiceReport); });
    rptItem = document.getElementById('rptAccount');
    setupEvent(rptItem, "click", function() { useReport(runAccountReport); });

    let tabOneHeader = document.getElementById('codebased');
    let tabTwoHeader = document.getElementById('guibased');
    let tabOne = document.getElementById('dataDriven');
    let tabTwo = document.getElementById('JSONDriven');
    setupEvent(tabOneHeader, 'click', () => {
        tabOneHeader.classList.toggle('tabselected', true);
        tabTwoHeader.classList.toggle('tabselected', false);
        tabOne.style.display = '';
        tabTwo.style.display = "none";
    });
    setupEvent(tabTwoHeader, 'click', () => {
        tabOneHeader.classList.toggle('tabselected', false);
        tabTwoHeader.classList.toggle('tabselected', true);
        tabOne.style.display = 'none';
        tabTwo.style.display = '';
        guiHoursReport();
    });

    iFrame = document.getElementById('iframe');
    setupEvent(iFrame, "load", function() { loadingVisible(false); });

    let smenu = document.getElementById('smenu');
    setupEvent(smenu, "change", menuChange);

    useReport(runFaxReport);

    setTimeout(function() { loadingVisible(false); }, 5000);
}

let initedGui = false;
function guiHoursReport() {
    if (initedGui) { return; }
    initedGui = true;

    const reportData =
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
            //detail: [],

            groupBy: [{
                type: 'group',
                groupOn: 'name',
                header: [
                    {
                        type: "print",
                        field: 'name',
                        settings: {absoluteX: 0, absoluteY: 15, fontBold: true, fill: '#6f6f6f', textColor: '#ffffff', link: 'http://www.fluentReports.com/'}
                    } ],
                //detail: [],
                footer: [
                    {type: 'calculation', op: "concat", name: 'totals', fields: [{text: "Totals for "}, {field: "name"}]},
                    {
                        type: "band",
                        fields: [
                            {function: {type: 'function', name: 'Totals for data.name', function: "return `Totals for ${data.name}`", async: false}, width: 180},
                            {total: "hours", width: 100, align: 3}
                        ]},
                    {type: 'newLine', top: 40}
                ],
            }
            ],

            subReport:
                {
                    type: 'report',
                    dataType: 'parent',
                    data: 'emphours',
                    calcs: {sum: ['hours']},
                    groupBy: [
                        {
                            type: "group",
                            groupOn: "week",
                            header: [
                                {
                                    skip: true, type: 'function', function: "vars.counter=0;", async: false, name: 'counter reset'
                                },
                                {
                                    type: 'print',
                                    function: {type: 'function', function: 'return `Week Number: ${data.week}`', name: 'Week number: data.week'},
                                    settings: {x: 100, addY: 2}
                                }],
                            //detail: []
                        }
                    ],
                    detail: [
                        {
                            type: 'function', function: "vars.counter++;", name: 'increase counter'
                        },
                        {
                            type: 'band',
                            fields: [
                                {text: '', width: 80},
                                {field: 'day', width: 100},
                                {field: 'hours', width: 100, align: 3, textColor: {type: 'function', function: "return data.hours < 0 ? '#FF0000' : '#000000';", name: 'textColor'}}
                            ],
                            settings:
                                {
                                    border:0, width: 0, wrap: true, textColor: '#0000ff',
                                    fill: {type: 'function', function: "return (vars.counter % 2 === 0 ? '#f0f0f0' : '#e0e0e0');", name: 'fill'}
                                }
                        },
                    ]
                },
//        footer: []
    };

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


    const frg = new window.FluentReportsGenerator({
        id: "fluentReportsEditor",
        data: data,
        report: reportData,
        debug: true,
        js: false,
        css: false,
        scale: 1.45,
        save: (value, done) => {
            console.log("Saving");
            //const results = document.getElementById("results");
            //results.innerText = JSON.stringify(value, null, 4);
            console.dir(value);
            done();
        }
    });
}

function useReport(rpt) { // jshint ignore:line
    editor.setValue(
        rpt
            .toString()
            .split('\n').slice(1, -1).join('\n')
            .replace(/^  /mg, '')
    );
    editor.gotoLine(1);
}

function displayReport(err) { // jshint ignore:line
    if (err) {
        console.log(err);
        alert(err);
    } else {
        iFrame.src = pipeStream.toBlobURL('application/pdf');
        resetBlobStream();
    }
}

function runFaxReport(Report, pipeStream, displayReport) { // jshint ignore:line
    // Here is a sample Fax Report
    /* globals Report, pipeStream, displayReport, faxImg */

    // Cache today's date
    const Current_Date = new Date().toDateString();

    // Interesting Data Structure, but we can still use it...
    const options = {
        address: "1234 Nowhere St",
        city: "Somewhere",
        state: "Texas",
        postal: "00000",
        data: [{
            phone: "800-555-1212",
            faxTo: "800-555-1211",
            from: "Me",
            attention: "You",
            number_of_pages: 2,
            comments: "Here is the proposal you wanted, it should match what we discussed on the phone."
        }]
    };

    // This is your routine that gets run any time a header needs to be printed.
    const header = function (rpt, data) {
        rpt.setCurrentY(14);
        rpt.setCurrentY(rpt.getCurrentY() - 10);
        rpt.image(faxImg, {width: 200});
        if (options.address) { rpt.print(options.address, {x: 44}); }
        if (options.address2) { rpt.print(options.address2, {x: 44}); }
        if (options.city && options.state && options.postal) {
            rpt.print(options.city + ', ' + options.state + ' ' + options.postal, {x: 44});
        }

        rpt.setCurrentY(40);
        rpt.fontSize(80);

        rpt.print('FAX', {x: 400});
        rpt.fontSize(13);
        rpt.newLine(2);

        rpt.fontItalic();
        rpt.band([
            {data: 'Date:', width: 78},
            {data: Current_Date, width: 200},
            {data: '# of Pages:', width: 78},
            {data: data.number_of_pages || 2, width: 200}
        ], {font: "Times-Roman"}); //"Aparajita"});
        rpt.newLine();
        rpt.fontNormal();

        rpt.band([
            {data: 'To:', width: 78},
            {data: data.faxTo, width: 200},
            {data: 'Attention:', width: 78},
            {data: data.attention, width: 200}
        ]);
        rpt.newLine();

        rpt.band([
            {data: 'From:', width: 78},
            {data: data.from, width: 200},
            {data: 'Phone:', width: 78},
            {data: data.phone, width: 200}
        ]);
        rpt.newLine();

        rpt.newLine();
        rpt.print('Comments:', {fontBold: true});
        rpt.print(data.comments);
    };

    // And this is the function that runs anytime a footer needs to get run.
    const footer = function (rpt) {
        rpt.print(['This material is for the intended recipient.'], {fontBold: true, fontSize: 8, y: 740});
    };

    // Create a new Report Engine
    // pipeStream is predefined in this report to make it display in the browser
    const rpt = new Report(pipeStream);

    // Configure the Defaults
    rpt
        .margins(30)
        .header(header)
        .pageFooter(footer)
        .data(options.data);

    // Run the Report
    // displayReport is predefined to make it display in the browser
    rpt.render(displayReport);

}

function runAccountReport(Report, pipeStream, displayReport) { // jshint ignore:line
    // Here is a sample Account Report
    // global functions/classes Report, pipeStream, displayReport

    // The Data
    const mydata =
        [
            {
                id: '67993bdd-f7d9-48a6-93d9-8026b657041a',
                person: '',
                name: 'Building #1',
                state: '1ab9f74b-d4af-4e88-8216-d2c2329f6318',
                'state.abbr': 'TX',
                add1: 'Building 1',
                add2: '123 Nowhere Street',
                city: 'Pittsburg',
                zip: '75686',
                'sale.no': '00125102',
                'sale.invoice_date': '04-16-2012',
                'sale.balance_due': '$ 327.10',
                'sale.purchase_order': '',
                current: '$ 0.00',
                thirty: '$ 0.00',
                sixty: '$ 0.00',
                ninety: '$ 327.10',
                hundredtwenty: '$ 0.00',
                'sale.invoice_date_original': '2012-04-16',
                'sale.balance_due_original': 327.1,
                current_original: 0,
                thirty_original: 0,
                sixty_original: 0,
                ninety_original: 327.1,
                hundredtwenty_original: 0
            },

            {
                id: '4f4c4782-7ab5-4793-907c-4d0a99e4ef5b',
                name: 'Building #2',
                person: 'John Smith',

                'state.abbr': 'OK',
                add1: '345 Nowhere St',
                add2: '',
                city: 'Coalgate',
                zip: '74538-2844',
                'sale.no': '00125464',
                'sale.invoice_date': '07-02-2012',
                'sale.balance_due': '$ 4,746.05',
                'sale.purchase_order': '1234',
                current: '$ 4,746.05',
                thirty: '$ 0.00',
                sixty: '$ 0.00',
                ninety: '$ 0.00',
                hundredtwenty: '$ 0.00',
                'sale.invoice_date_original': '2012-07-02',
                'sale.balance_due_original': 4746.05,
                current_original: 4746.05,
                thirty_original: 0,
                sixty_original: 0,
                ninety_original: 0,
                hundredtwenty_original: 0
            },

            {
                id: '4f4c4782-7ab5-4793-907c-4d0a99e4ef5b',
                name: 'Building #2',
                person: 'John White',
                'state.abbr': 'OK',
                add1: '345 Nowhere St',
                add2: '',
                city: 'Coalgate',
                zip: '74538-2844',
                'sale.no': '00125463',
                'sale.invoice_date': '07-02-2012',
                'sale.balance_due': '$ 10,945.00',
                'sale.purchase_order': '',
                current: '$ 10,945.00',
                thirty: '$ 0.00',
                sixty: '$ 0.00',
                ninety: '$ 0.00',
                hundredtwenty: '$ 0.00',
                'sale.invoice_date_original': '2012-07-02',
                'sale.balance_due_original': 10945,
                current_original: 10945,
                thirty_original: 0,
                sixty_original: 0,
                ninety_original: 0,
                hundredtwenty_original: 0
            },

            {
                id: '4137113f-6828-4365-a8fc-a9096b4e68e7',
                name: 'Building #3',
                person: 'James Black',
                state: '1001379b-3799-4cd5-9f81-8efc12a0ef79',
                'state.abbr': 'OK',
                add1: '567 Nowhere St',
                add2: '',
                city: 'Coalgate',
                zip: '74538',
                'sale.no': '00125465',
                'sale.invoice_date': '07-02-2012',
                'sale.balance_due': '$ 1,050.00',
                'sale.purchase_order': '',
                current: '$ 1,050.00',
                thirty: '$ 0.00',
                sixty: '$ 0.00',
                ninety: '$ 0.00',
                hundredtwenty: '$ 0.00',
                'sale.invoice_date_original': '2012-07-02',
                'sale.balance_due_original': 1050,
                current_original: 1050,
                thirty_original: 0,
                sixty_original: 0,
                ninety_original: 0,
                hundredtwenty_original: 0
            }
        ];


    const contactInfo = function (rpt, data) {
        rpt.print([
            data.name,
            data.add1,
            data.add2,
            [data.city, data.state.abbr, data.zip].join(' ')
        ], {x: 80});
    };

    const message = function (rpt, data) {
        const msg = [
            'Dear ' + (data.person ? data.person : 'Valued Customer') + ',',
            ' ',
            'Our records indicate that you have invoices that have not been paid and are overdue or you have credits that have not been applied.',
            'You are receiving this statement as a reminder of invoices or credits that haven\'t been resolved.',
            'If you have questions or comments concerning your statement please call 555-1212 and speak to someone in our billing department.',
            '',
            'Thank you in advance for your cooperation in this matter.'];

        rpt.print(msg, {textColor: 'blue'});
    };

    const header = function (rpt, data) {
        if (!data.id) {
            return;
        }

        // Date Printed - Top Right
        rpt.fontSize(9);
        rpt.print(new Date().toString('MM/dd/yyyy')); //, {y: 30, align: 'right'});


        // Report Title
        rpt.print('ACCOUNT STATEMENT', {fontBold: true, fontSize: 16, align: 'right', fill: '#ff00ff'});


        // Contact Info
        contactInfo(rpt, data);

        rpt.newline();
        rpt.newline();
        rpt.newline();

        // Message
        message(rpt, data);

        rpt.newline();
        rpt.newline();
        rpt.newline();

        // Detail Header
        rpt.fontBold();
        rpt.band([
            {data: 'Invoice #', width: 60},
            {data: 'Cust PO'},
            {data: 'Invoice Date', width: 60},
            {data: 'Current', align: 3, width: 60},
            {data: '31-60 Days', width: 60, align: 3},
            {data: '61-90 Days', width: 60, align: 3},
            {data: '91-120 Days', width: 65, align: 3},
            {data: '>120 Days', width: 60, align: 3},
            {data: 'Total Due', width: 60, align: 3}
        ]);
        rpt.fontNormal();
        rpt.bandLine();
    };

    // Detail Body
    const detail = function (rpt, data) {
        rpt.band([
            {data: data.sale.no, width: 60, align: 1},
            {data: data.sale.purchase_order},
            {data: data.sale.invoice_date, width: 60},
            {data: data.current, align: 3, width: 60},
            {data: data.thirty, width: 60, align: 3},
            {data: data.sixty, width: 60, align: 3},
            {data: data.ninety, width: 65, align: 3},
            {data: data.hundredtwenty, width: 60, align: 3},
            {data: data.sale.balance_due, width: 60, align: 3}
        ], {border: 1, width: 0});
    };

    const finalSummary = function (rpt) {
        rpt.standardFooter([
            ['sale.no', 1, 3],
            ['current', 4, 3],
            ['thirty', 5, 3],
            ['sixty', 6, 3],
            ['ninety', 7, 3],
            ['hundredtwenty', 8, 3],
            ['sale.balance_due', 9, 3]
        ]);
        rpt.newline();
        rpt.newline();
        rpt.print('Thank You for Choosing us!', {align: 'right'});
    };

    const totalFormatter = function (data, callback) {
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                if (key === 'sale.no') {
                    continue;
                }
                // Simple Stupid Money formatter.  It is fairly dumb.  ;-)
                let money = data[key].toString();
                const idx = money.indexOf('.');
                if (idx === -1) {
                    money += ".00";
                } else if (idx === money.length - 2) {
                    money += "0";
                }
                for (let i = 6; i < money.length; i += 4) {
                    money = money.substring(0, money.length - i) + "," + money.substring(money.length - i);
                }

                data[key] = '$ ' + money;

            }
        }

        callback(null, data);
    };

    // Create the new Report
    const resultReport = new Report(pipeStream)
        .data(mydata)
        .totalFormatter(totalFormatter);

    // You can Chain these directly after the above like I did or as I have shown below; use the resultReport variable and continue chain the report commands off of it.  Your choice.
    // Settings
    resultReport
        .fontsize(9)
        .margins(40)
        .detail(detail)
        .groupBy('id')
        .sum('current')
        .sum('thirty')
        .sum('sixty')
        .sum('ninety')
        .sum('hundredtwenty')
        .sum('sale.balance_due')
        .count('sale.no')
        .footer(finalSummary)
        .header(header, {pageBreakBefore: true});

    // Run the Report
    // displayReport is predefined to make it display in the browser
    resultReport.render(displayReport);

}

function runInvoiceReport(Report, pipeStream, displayReport) { // jshint ignore:line
    // Run Sales Invoice
    // global functions/classes Report, pipeStream, displayReport


    const primary_data = [
        {
            no: 1,
            date: '08-17-2015',
            name: "John Doe",
            type: "Hardware",
            address_1: "address 1 road 2",
            address_2: "",
            city: "city",
            state: 'ok',
            zip: '00000',
            qty: 2,
            price: 2.21,
            amount: 4.42,
            description: "product 1",
            "product.product_type": 1
        },
        {
            no: 1,
            date: '08-18-2015',
            name: "John Doe",
            type: "Hardware",
            address_1: "address 1 road 2",
            address_2: "",
            city: "city",
            state: 'ok',
            zip: '00000',
            qty: 1,
            price: 2.21,
            amount: 2.21,
            description: "product 1",
            "product.product_type": 1
        },
        {
            no: 1,
            date: '08-19-2015',
            name: "John Doe",
            type: "Software",
            address_1: "address 1 road 2",
            address_2: "",
            city: "city",
            state: 'ok',
            zip: '00000',
            qty: 9,
            price: 4.21,
            amount: 37.89,
            description: "product 2",
            "product.product_type": 2
        }
    ];

    const detail = function (x, r) {
        x.band([
            {data: r.description, width: 240},
            {data: r.qty, width: 60, align: 3},
            {data: r.price, width: 70, align: 3},
            {data: r.amount, width: 90, align: 3},
            {data: r.annual, width: 70, align: 3}
        ], {x: 30});
    };

    const productTypeHeader = function (x, r) {
        x.fontBold();
        x.band([
            {data: r.type, width: 240, fontBold: true}
        ], {x: 20});
        x.fontNormal();
    };

    const productTypeFooter = function (x, r) {
        x.fontBold();
        x.band([
            {data: r.type + ' Total:', width: 130, align: 3},
            {data: x.totals.amount, width: 90, align: 3}
        ], {x: 270});
        x.fontNormal();
    };

    const proposalHeader = function (x, r) {
        let fSize = 9;
        x.print('Some address in Duncan, OK 73533', {x: 20, fontsize: fSize});
        x.print("PROPOSAL", {x: 40, y: 70, fontSize: fSize + 19, fontBold: true});
        x.print('THIS IS NOT AN INVOICE', {x: 40, y: 100, fontsize: fSize + 4, fontBold: true});
        x.print('Questions? Please call us.', {x: 40, y: 150, fontsize: fSize});
        x.band([{data: 'Proposal #:', width: 100}, {data: "12345", width: 100, align: "left", fontSize: 9}], {
            x: 400,
            y: 60
        });
        x.band([{data: 'Date Prepared:', width: 100}, {data: r.date, width: 100, fontSize: 9}], {x: 400});
        x.band([{data: 'Prepared By:', width: 100}, {data: "Jake Snow", width: 100, fontSize: 9}], {x: 400});
        x.band([{data: 'Prepared For:', width: 100}], {x: 400});
        x.fontSize(9);

        if (r.name) {
            x.band([{data: r.name, width: 150}], {x: 410});
        }
        if (r.address_1) {
            x.band([{data: r.address_1, width: 150}], {x: 410});
        }
        if (r.address_2) {
            x.band([{data: r.address_2, width: 150}], {x: 410});
        }
        if (r.city) {
            x.band([{data: r.city + ", " + r.state + " " + r.zip, width: 150}], {x: 410});
        }

        x.fontSize(8);
        x.print('This quote is good for 60 days from the date prepared. Product availability is subject to change without notice. Due to rapid changes in technology, ' +
            'and to help us keep our prices competitive, we request that you appropriate an additional 5-10% of the hardware shown on the proposal to compensate ' +
            'for possible price fluctuations between the date this proposal was prepared and the date you place your order.  Once a proposal has been approved and  ' +
            'hardware ordered, returned goods are subject to a 15% restocking fee.', {x: 40, y: 175, width: 540});
        x.newline();
        x.print('Any travel fees quoted on this proposal may be reduced to reflect actual travel expenses.', {x: 40});
        x.newline();
        x.fontSize(11);
        x.band([
            {data: 'Description', width: 250},
            {data: 'Qty', width: 60, align: 3},
            {data: 'Price', width: 70, align: 3},
            {data: 'Ext. Price', width: 90, align: 3},
            {data: 'Annual', width: 70, align: 3}
        ], {x: 0});
        x.bandLine(1);
    };

    const proposalFooter = function (x) {
        x.fontSize(7.5);
        x.print('To place an order for the goods and services provided by us, please either contact us to place your order or fax a copy ' +
            'of your PO to 999-555-1212', {x: 40, width: 570});
        x.print('Please call us if you have any other questions about how to order. Thank you for your business!', {
            x: 40,
            width: 570
        });
    };


    const report = new Report(pipeStream).data(primary_data);


    report.margins(20)
        .detail(detail);

    // See you can separate it; and chain however you need too
    report.groupBy("no")
        .header(proposalHeader)
        .footer(proposalFooter)
        .groupBy("product.product_type")
        .sum("amount")
        .header(productTypeHeader)
        .footer(productTypeFooter);

    // Run the Report
    // displayReport is predefined to make it display in the browser
    report.render(displayReport);

}

function attachOnLoad()
{
    setupEvent(window, 'load', init);
    setTimeout(init, 1000);
}

// Startup
attachOnLoad();
