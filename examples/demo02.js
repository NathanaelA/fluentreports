var Report = require('../lib/fluentReports' ).Report;
var displayReport = require('./reportDisplayer');

function printreport() {
  'use strict';
  var mydata =
      [
        { id: '67993bdd-f7d9-48a6-93d9-8026b657041a',
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
        hundredtwenty_original: 0 },
		
	    { id: '4f4c4782-7ab5-4793-907c-4d0a99e4ef5b',
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
   
        { id: '4f4c4782-7ab5-4793-907c-4d0a99e4ef5b',
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
	   
        { id: '4137113f-6828-4365-a8fc-a9096b4e68e7',
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
      hundredtwenty_original: 0 }
       ];



  var contactInfo = function(rpt, data) {
    rpt.print([
      data.name,
      data.add1,
      data.add2,
      [data.city, data.state.abbr, data.zip].join(' ')
    ], {x:80});
  };
  
  var message = function(rpt, data) {

    var msg = [
         'Dear '+ (data.person ? data.person : 'Valued Customer') + ',',
         ' ',
         'Our records indicate that you have invoices that have not been paid and are overdue or you have credits that have not been applied.',
         'You are receiving this statement as a reminder of invoices or credits that haven\'t been resolved.',
         'If you have questions or comments concerning your statement please call 555-1212 and speak to someone in our billing department.',
         '',
         'Thank you in advance for your cooperation in this matter.'];

      rpt.print(msg, {textColor: 'blue'});
  };

  var header = function(rpt, data) {
    if(!data.id) {return;}

    // Company Info - Top Left
    //rpt.setCurrentY(14);

    // Date Printed - Top Right
    rpt.fontSize(9);
    rpt.print(new Date().toString('MM/dd/yyyy')); //, {y: 30, align: 'right'});

    // Report Title
    rpt.print('ACCOUNT STATEMENT', {fontBold: true, fontSize: 16, align: 'right'});

  // Contact Info
  contactInfo(rpt, data);

  rpt.newline();
  rpt.newline();
  rpt.newline();

  // Message
  message(rpt,data);

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

  var detail = function(rpt, data) {
  // Detail Body
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

  var finalSummary = function(rpt, data) {

  rpt.standardFooter([
    ['sale.no',1,3],
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

    var totalFormatter = function(data, callback) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (key === 'sale.no') { continue; }
                // Simple Stupid Money formatter.  It is fairly dumb.  ;-)
                var money = data[key].toString();
                var idx = money.indexOf('.');
                if (idx === -1) {
                    money += ".00";
                } else if (idx === money.length-2) {
                    money += "0";
                }
                for (var i=6;i<money.length;i+=4) {
                    money = money.substring(0,money.length-i) + "," + money.substring(money.length-i);
                }

                data[key] = '$ '+money;

            }
        }

        callback(null, data);
    };




  // Optional -- If you don't pass a report name, it will default to "report.pdf"
  const rptName =  "demo02.pdf";
  const testing = {images: 3, blocks: ["60,60,600,70"]};



    var resultReport = new Report(rptName)
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
      .header(header, {pageBreakBefore: true})
  ;

  // Hey, everyone needs to debug things occasionally -- creates debug output so that you can see how the report is built.
    if (typeof process.env.TESTING !== "undefined") { resultReport.printStructure(); }


  console.time("Rendered");
  resultReport.render(function(err, name) {
      console.timeEnd("Rendered");
      displayReport(err, name, testing);
  });

}



printreport();