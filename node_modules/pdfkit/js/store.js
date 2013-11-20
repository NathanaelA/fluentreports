(function() {

  /*
  PDFObjectStore - stores the object heirarchy for the PDF document
  By Devon Govett
  */

  var PDFObjectStore, PDFReference;

  PDFReference = require('./reference');

  PDFObjectStore = (function() {

    function PDFObjectStore() {
      this.objects = {};
      this.length = 0;
      this.root = this.ref({
        Type: 'Catalog',
        Pages: this.ref({
          Type: 'Pages',
          Count: 0,
          Kids: []
        })
      });
      this.pages = this.root.data['Pages'];
    }

    PDFObjectStore.prototype.ref = function(data) {
      return this.push(++this.length, data);
    };

    PDFObjectStore.prototype.push = function(id, data) {
      var ref;
      ref = new PDFReference(id, data);
      this.objects[id] = ref;
      return ref;
    };

    PDFObjectStore.prototype.addPage = function(page) {
      this.pages.data['Kids'].push(page.dictionary);
      return this.pages.data['Count']++;
    };

    return PDFObjectStore;

  })();

  module.exports = PDFObjectStore;

}).call(this);
