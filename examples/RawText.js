"use strict";

var pdf = require('pdfkit');
var displayReport = require('./reportDisplayer');


pdf.prototype.textRotate = function(angle, x, y, height) {
    var cos, rad, ref, sin, x1, y1;
    rad = angle * Math.PI / 180;
    cos = Math.cos(rad);
    sin = Math.sin(rad);
    x1 = x;
    y1 = y; //height - y;

    this.transform(cos, sin, -sin, cos, x1, y1);
    //return this.translate(-x1, -y1);
};

var doc = new pdf();

doc.fontSize(25)
    .text('Here is some vector graphics...', 100, 80);

// some vector graphics
doc.save()
    .moveTo(100, 150)
    .lineTo(100, 250)
    .lineTo(200, 250)
    .fill("#FF3300");

doc.circle(280, 200, 50)
    .fill("#6600FF");

// an SVG path
doc.scale(0.6)
    .translate(470, 130)
    .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
    .fill('red', 'even-odd')
    .restore();

// and some justified text wrapped into columns

console.log(doc.page.height);

var x = 100, y = 300;

doc.save();
doc.textRotate(90, x-y, y+x, 300);
doc.text('2 And here is some wrapped text 2...',x,y);
doc.text('And here is some wrapped text...',0,20);

doc.restore();
doc.text("More test", 100, 300);



var fs = require('fs');
var writeStream = fs.createWriteStream("rawtext.pdf");
writeStream.once('finish', function() {
    displayReport(null, "rawtext.pdf");
});
doc.pipe(writeStream);
doc.end();

