(function() {
  var Data, HheaTable, Table;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Table = require('../table');

  Data = require('../../data');

  HheaTable = (function() {

    __extends(HheaTable, Table);

    function HheaTable() {
      HheaTable.__super__.constructor.apply(this, arguments);
    }

    HheaTable.prototype.parse = function(data) {
      data.pos = this.offset;
      this.version = data.readInt();
      this.ascender = data.readShort();
      this.decender = data.readShort();
      this.lineGap = data.readShort();
      this.advanceWidthMax = data.readShort();
      this.minLeftSideBearing = data.readShort();
      this.minRightSideBearing = data.readShort();
      this.xMaxExtent = data.readShort();
      this.caretSlopeRise = data.readShort();
      this.caretSlopeRun = data.readShort();
      this.caretOffset = data.readShort();
      data.pos += 4 * 2;
      this.metricDataFormat = data.readShort();
      return this.numberOfMetrics = data.readUInt16();
    };

    HheaTable.prototype.encode = function(ids) {
      var i, table, _ref;
      table = new Data;
      table.writeInt(this.version);
      table.writeShort(this.ascender);
      table.writeShort(this.decender);
      table.writeShort(this.lineGap);
      table.writeShort(this.advanceWidthMax);
      table.writeShort(this.minLeftSideBearing);
      table.writeShort(this.minRightSideBearing);
      table.writeShort(this.xMaxExtent);
      table.writeShort(this.caretSlopeRise);
      table.writeShort(this.caretSlopeRun);
      table.writeShort(this.caretOffset);
      for (i = 0, _ref = 4 * 2; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        table.writeByte(0);
      }
      table.writeShort(this.metricDataFormat);
      table.writeUInt16(ids.length);
      return table.data;
    };

    return HheaTable;

  })();

  module.exports = HheaTable;

}).call(this);
