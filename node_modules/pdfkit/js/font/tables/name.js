(function() {
  var Data, NameEntry, NameTable, Table, utils;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Table = require('../table');

  Data = require('../../data');

  utils = require('../utils');

  NameTable = (function() {
    var subsetTag;

    __extends(NameTable, Table);

    function NameTable() {
      NameTable.__super__.constructor.apply(this, arguments);
    }

    NameTable.prototype.parse = function(data) {
      var count, entries, entry, format, i, name, stringOffset, strings, text, _len, _name, _ref;
      data.pos = this.offset;
      format = data.readShort();
      count = data.readShort();
      stringOffset = data.readShort();
      entries = [];
      for (i = 0; 0 <= count ? i < count : i > count; 0 <= count ? i++ : i--) {
        entries.push({
          platformID: data.readShort(),
          encodingID: data.readShort(),
          languageID: data.readShort(),
          nameID: data.readShort(),
          length: data.readShort(),
          offset: this.offset + stringOffset + data.readShort()
        });
      }
      strings = {};
      for (i = 0, _len = entries.length; i < _len; i++) {
        entry = entries[i];
        data.pos = entry.offset;
        text = data.readString(entry.length);
        name = new NameEntry(text, entry);
        if ((_ref = strings[_name = entry.nameID]) == null) strings[_name] = [];
        strings[entry.nameID].push(name);
      }
      this.strings = strings;
      this.copyright = strings[0];
      this.fontFamily = strings[1];
      this.fontSubfamily = strings[2];
      this.uniqueSubfamily = strings[3];
      this.fontName = strings[4];
      this.version = strings[5];
      this.postscriptName = strings[6][0].raw.replace(/[\x00-\x19\x80-\xff]/g, "");
      this.trademark = strings[7];
      this.manufacturer = strings[8];
      this.designer = strings[9];
      this.description = strings[10];
      this.vendorUrl = strings[11];
      this.designerUrl = strings[12];
      this.license = strings[13];
      this.licenseUrl = strings[14];
      this.preferredFamily = strings[15];
      this.preferredSubfamily = strings[17];
      this.compatibleFull = strings[18];
      return this.sampleText = strings[19];
    };

    subsetTag = "AAAAAA";

    NameTable.prototype.encode = function() {
      var id, list, nameID, nameTable, postscriptName, strCount, strTable, string, strings, table, val, _i, _len, _ref;
      strings = {};
      _ref = this.strings;
      for (id in _ref) {
        val = _ref[id];
        strings[id] = val;
      }
      postscriptName = new NameEntry("" + subsetTag + "+" + this.postscriptName, {
        platformID: 1,
        encodingID: 0,
        languageID: 0
      });
      strings[6] = [postscriptName];
      subsetTag = utils.successorOf(subsetTag);
      strCount = 0;
      for (id in strings) {
        list = strings[id];
        if (list != null) strCount += list.length;
      }
      table = new Data;
      strTable = new Data;
      table.writeShort(0);
      table.writeShort(strCount);
      table.writeShort(6 + 12 * strCount);
      for (nameID in strings) {
        list = strings[nameID];
        if (list != null) {
          for (_i = 0, _len = list.length; _i < _len; _i++) {
            string = list[_i];
            table.writeShort(string.platformID);
            table.writeShort(string.encodingID);
            table.writeShort(string.languageID);
            table.writeShort(nameID);
            table.writeShort(string.length);
            table.writeShort(strTable.pos);
            strTable.writeString(string.raw);
          }
        }
      }
      return nameTable = {
        postscriptName: postscriptName.raw,
        table: table.data.concat(strTable.data)
      };
    };

    return NameTable;

  })();

  module.exports = NameTable;

  NameEntry = (function() {

    function NameEntry(raw, entry) {
      this.raw = raw;
      this.length = raw.length;
      this.platformID = entry.platformID;
      this.encodingID = entry.encodingID;
      this.languageID = entry.languageID;
    }

    return NameEntry;

  })();

}).call(this);
