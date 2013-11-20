(function() {

  /*
  PDFReference - represents a reference to another object in the PDF object heirarchy
  By Devon Govett
  */

  var PDFObject, PDFReference, zlib;

  zlib = require('zlib');

  PDFReference = (function() {

    function PDFReference(id, data) {
      this.id = id;
      this.data = data != null ? data : {};
      this.gen = 0;
      this.stream = null;
      this.finalizedStream = null;
    }

    PDFReference.prototype.object = function(compress, fn) {
      var out;
      var _this = this;
      if (this.finalizedStream == null) {
        return this.finalize(compress, function() {
          return _this.object(compress, fn);
        });
      }
      out = ["" + this.id + " " + this.gen + " obj"];
      out.push(PDFObject.convert(this.data));
      if (this.stream) {
        out.push("stream");
        out.push(this.finalizedStream);
        out.push("endstream");
      }
      out.push("endobj");
      return fn(out.join('\n'));
    };

    PDFReference.prototype.add = function(s) {
      var _ref;
      if ((_ref = this.stream) == null) this.stream = [];
      return this.stream.push(Buffer.isBuffer(s) ? s.toString('binary') : s);
    };

    PDFReference.prototype.finalize = function(compress, fn) {
      var data, i;
      var _this = this;
      if (compress == null) compress = false;
      if (this.stream) {
        data = this.stream.join('\n');
        if (compress && !this.data.Filter) {
          data = new Buffer((function() {
            var _ref, _results;
            _results = [];
            for (i = 0, _ref = data.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
              _results.push(data.charCodeAt(i));
            }
            return _results;
          })());
          return zlib.deflate(data, function(err, compressedData) {
            if (err) throw err;
            _this.finalizedStream = compressedData.toString('binary');
            _this.data.Filter = 'FlateDecode';
            _this.data.Length = _this.finalizedStream.length;
            return fn();
          });
        } else {
          this.finalizedStream = data;
          this.data.Length = this.finalizedStream.length;
          return fn();
        }
      } else {
        this.finalizedStream = '';
        return fn();
      }
    };

    PDFReference.prototype.toString = function() {
      return "" + this.id + " " + this.gen + " R";
    };

    return PDFReference;

  })();

  module.exports = PDFReference;

  PDFObject = require('./object');

}).call(this);
