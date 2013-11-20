(function() {
  var Data, HmtxTable, Table;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Table = require('../table');

  Data = require('../../data');

  HmtxTable = (function() {

    __extends(HmtxTable, Table);

    function HmtxTable() {
      HmtxTable.__super__.constructor.apply(this, arguments);
    }

    HmtxTable.prototype.parse = function(data) {
      var i, last, lsbCount, m, _ref, _results;
      data.pos = this.offset;
      this.metrics = [];
      for (i = 0, _ref = this.file.hhea.numberOfMetrics; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        this.metrics.push({
          advance: data.readUInt16(),
          lsb: data.readInt16()
        });
      }
      lsbCount = this.file.maxp.numGlyphs - this.file.hhea.numberOfMetrics;
      this.leftSideBearings = (function() {
        var _results;
        _results = [];
        for (i = 0; 0 <= lsbCount ? i < lsbCount : i > lsbCount; 0 <= lsbCount ? i++ : i--) {
          _results.push(data.readInt16());
        }
        return _results;
      })();
      this.widths = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.metrics;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          m = _ref2[_i];
          _results.push(m.advance);
        }
        return _results;
      }).call(this);
      last = this.widths[this.widths.length - 1];
      _results = [];
      for (i = 0; 0 <= lsbCount ? i < lsbCount : i > lsbCount; 0 <= lsbCount ? i++ : i--) {
        _results.push(this.widths.push(last));
      }
      return _results;
    };

    HmtxTable.prototype.forGlyph = function(id) {
      var metrics;
      if (id in this.metrics) return this.metrics[id];
      return metrics = {
        advance: this.metrics[this.metrics.length - 1].advance,
        lsb: this.leftSideBearings[id - this.metrics.length]
      };
    };

    HmtxTable.prototype.encode = function(mapping) {
      var id, metric, table, _i, _len;
      table = new Data;
      for (_i = 0, _len = mapping.length; _i < _len; _i++) {
        id = mapping[_i];
        metric = this.forGlyph(id);
        table.writeUInt16(metric.advance);
        table.writeUInt16(metric.lsb);
      }
      return table.data;
    };

    return HmtxTable;

  })();

  module.exports = HmtxTable;

}).call(this);
