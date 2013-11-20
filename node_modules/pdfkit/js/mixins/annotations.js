(function() {
  var PDFObject;
  var __slice = Array.prototype.slice;

  PDFObject = require('../object');

  module.exports = {
    annotate: function(x, y, w, h, options) {
      var key, val, _ref;
      options.Type = 'Annot';
      options.Rect = this._convertRect(x, y, w, h);
      options.Border = [0, 0, 0];
      if (options.Subtype !== 'Link') {
        if ((_ref = options.C) == null) {
          options.C = this._normalizeColor(options.color || [0, 0, 0]);
        }
      }
      delete options.color;
      if (typeof options.Dest === 'string') {
        options.Dest = PDFObject.s(options.Dest);
      }
      for (key in options) {
        val = options[key];
        options[key[0].toUpperCase() + key.slice(1)] = val;
      }
      this.page.annotations.push(this.ref(options));
      return this;
    },
    note: function(x, y, w, h, contents, options) {
      var _ref;
      if (options == null) options = {};
      options.Subtype = 'Text';
      options.Contents = PDFObject.s(contents);
      options.Name = 'Comment';
      if ((_ref = options.color) == null) options.color = [243, 223, 92];
      return this.annotate(x, y, w, h, options);
    },
    link: function(x, y, w, h, url, options) {
      if (options == null) options = {};
      options.Subtype = 'Link';
      options.A = this.ref({
        S: 'URI',
        URI: PDFObject.s(url)
      });
      return this.annotate(x, y, w, h, options);
    },
    _markup: function(x, y, w, h, options) {
      var x1, x2, y1, y2, _ref;
      if (options == null) options = {};
      _ref = this._convertRect(x, y, w, h), x1 = _ref[0], y1 = _ref[1], x2 = _ref[2], y2 = _ref[3];
      options.QuadPoints = [x1, y2, x2, y2, x1, y1, x2, y1];
      options.Contents = PDFObject.s('');
      return this.annotate(x, y, w, h, options);
    },
    highlight: function(x, y, w, h, options) {
      var _ref;
      if (options == null) options = {};
      options.Subtype = 'Highlight';
      if ((_ref = options.color) == null) options.color = [241, 238, 148];
      return this._markup(x, y, w, h, options);
    },
    underline: function(x, y, w, h, options) {
      if (options == null) options = {};
      options.Subtype = 'Underline';
      return this._markup(x, y, w, h, options);
    },
    strike: function(x, y, w, h, options) {
      if (options == null) options = {};
      options.Subtype = 'StrikeOut';
      return this._markup(x, y, w, h, options);
    },
    lineAnnotation: function(x1, y1, x2, y2, options) {
      if (options == null) options = {};
      options.Subtype = 'Line';
      options.Contents = PDFObject.s('');
      options.L = [x1, this.page.height - y1, x2, this.page.height - y2];
      return this.annotate(x1, y1, x2, y2, options);
    },
    rectAnnotation: function(x, y, w, h, options) {
      if (options == null) options = {};
      options.Subtype = 'Square';
      options.Contents = PDFObject.s('');
      return this.annotate(x, y, w, h, options);
    },
    ellipseAnnotation: function(x, y, w, h, options) {
      if (options == null) options = {};
      options.Subtype = 'Circle';
      options.Contents = PDFObject.s('');
      return this.annotate(x, y, w, h, options);
    },
    textAnnotation: function(x, y, w, h, text, options) {
      if (options == null) options = {};
      options.Subtype = 'FreeText';
      options.Contents = PDFObject.s(text);
      options.DA = PDFObject.s('');
      return this.annotate(x, y, w, h, options);
    },
    _convertRect: function() {
      var rect;
      rect = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      rect[1] = this.page.height - rect[1] - rect[3];
      rect[2] += rect[0];
      rect[3] += rect[1];
      return rect;
    }
  };

}).call(this);
