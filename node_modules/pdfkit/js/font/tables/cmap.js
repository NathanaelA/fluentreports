(function() {
  var CmapEntry, CmapTable, Data, Table;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Table = require('../table');

  Data = require('../../data');

  CmapTable = (function() {

    __extends(CmapTable, Table);

    function CmapTable() {
      CmapTable.__super__.constructor.apply(this, arguments);
    }

    CmapTable.prototype.parse = function(data) {
      var entry, i, tableCount, _ref;
      data.pos = this.offset;
      this.version = data.readUInt16();
      tableCount = data.readUInt16();
      this.tables = [];
      this.unicode = null;
      for (i = 0; 0 <= tableCount ? i < tableCount : i > tableCount; 0 <= tableCount ? i++ : i--) {
        entry = new CmapEntry(data, this.offset);
        this.tables.push(entry);
        if (entry.isUnicode) {
          if ((_ref = this.unicode) == null) this.unicode = entry;
        }
      }
      return true;
    };

    CmapTable.encode = function(charmap, encoding) {
      var result, table;
      if (encoding == null) encoding = 'macroman';
      result = CmapEntry.encode(charmap, encoding);
      table = new Data;
      table.writeUInt16(0);
      table.writeUInt16(1);
      result.table = table.data.concat(result.subtable);
      return result;
    };

    return CmapTable;

  })();

  CmapEntry = (function() {

    function CmapEntry(data, offset) {
      var code, count, endCode, glyphId, glyphIds, i, idDelta, idRangeOffset, index, segCount, segCountX2, start, startCode, tail, _len;
      this.platformID = data.readUInt16();
      this.encodingID = data.readShort();
      this.offset = offset + data.readInt();
      data.pos = this.offset;
      this.format = data.readUInt16();
      this.length = data.readUInt16();
      this.language = data.readUInt16();
      this.isUnicode = (this.platformID === 3 && this.encodingID === 1 && this.format === 4) || this.platformID === 0 && this.format === 4;
      this.codeMap = {};
      switch (this.format) {
        case 0:
          for (i = 0; i < 256; i++) {
            this.codeMap[i] = data.readByte();
          }
          break;
        case 4:
          segCountX2 = data.readUInt16();
          segCount = segCountX2 / 2;
          data.pos += 6;
          endCode = (function() {
            var _results;
            _results = [];
            for (i = 0; 0 <= segCount ? i < segCount : i > segCount; 0 <= segCount ? i++ : i--) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          data.pos += 2;
          startCode = (function() {
            var _results;
            _results = [];
            for (i = 0; 0 <= segCount ? i < segCount : i > segCount; 0 <= segCount ? i++ : i--) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          idDelta = (function() {
            var _results;
            _results = [];
            for (i = 0; 0 <= segCount ? i < segCount : i > segCount; 0 <= segCount ? i++ : i--) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          idRangeOffset = (function() {
            var _results;
            _results = [];
            for (i = 0; 0 <= segCount ? i < segCount : i > segCount; 0 <= segCount ? i++ : i--) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          count = this.length - data.pos + this.offset;
          glyphIds = (function() {
            var _results;
            _results = [];
            for (i = 0; 0 <= count ? i < count : i > count; 0 <= count ? i++ : i--) {
              _results.push(data.readUInt16());
            }
            return _results;
          })();
          for (i = 0, _len = endCode.length; i < _len; i++) {
            tail = endCode[i];
            start = startCode[i];
            for (code = start; start <= tail ? code <= tail : code >= tail; start <= tail ? code++ : code--) {
              if (idRangeOffset[i] === 0) {
                glyphId = code + idDelta[i];
              } else {
                index = idRangeOffset[i] / 2 + (code - start) - (segCount - i);
                glyphId = glyphIds[index] || 0;
                if (glyphId !== 0) glyphId += idDelta[i];
              }
              this.codeMap[code] = glyphId & 0xFFFF;
            }
          }
      }
    }

    CmapEntry.encode = function(charmap, encoding) {
      var charMap, code, codeMap, codes, delta, deltas, diff, endCode, endCodes, entrySelector, glyphIDs, i, id, indexes, last, map, nextID, offset, old, rangeOffsets, rangeShift, result, searchRange, segCount, segCountX2, startCode, startCodes, startGlyph, subtable, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _name, _o, _ref, _ref2;
      subtable = new Data;
      codes = Object.keys(charmap).sort(function(a, b) {
        return a - b;
      });
      switch (encoding) {
        case 'macroman':
          id = 0;
          indexes = (function() {
            var _results;
            _results = [];
            for (i = 0; i < 256; i++) {
              _results.push(0);
            }
            return _results;
          })();
          map = {
            0: 0
          };
          codeMap = {};
          for (_i = 0, _len = codes.length; _i < _len; _i++) {
            code = codes[_i];
            if ((_ref = map[_name = charmap[code]]) == null) map[_name] = ++id;
            codeMap[code] = {
              old: charmap[code],
              "new": map[charmap[code]]
            };
            indexes[code] = map[charmap[code]];
          }
          subtable.writeUInt16(1);
          subtable.writeUInt16(0);
          subtable.writeUInt32(12);
          subtable.writeUInt16(0);
          subtable.writeUInt16(262);
          subtable.writeUInt16(0);
          subtable.write(indexes);
          return result = {
            charMap: codeMap,
            subtable: subtable.data,
            maxGlyphID: id + 1
          };
        case 'unicode':
          startCodes = [];
          endCodes = [];
          nextID = 0;
          map = {};
          charMap = {};
          last = diff = null;
          for (_j = 0, _len2 = codes.length; _j < _len2; _j++) {
            code = codes[_j];
            old = charmap[code];
            if ((_ref2 = map[old]) == null) map[old] = ++nextID;
            charMap[code] = {
              old: old,
              "new": map[old]
            };
            delta = map[old] - code;
            if (!(last != null) || delta !== diff) {
              if (last) endCodes.push(last);
              startCodes.push(code);
              diff = delta;
            }
            last = code;
          }
          if (last) endCodes.push(last);
          endCodes.push(0xFFFF);
          startCodes.push(0xFFFF);
          segCount = startCodes.length;
          segCountX2 = segCount * 2;
          searchRange = 2 * Math.pow(Math.log(segCount) / Math.LN2, 2);
          entrySelector = Math.log(searchRange / 2) / Math.LN2;
          rangeShift = 2 * segCount - searchRange;
          deltas = [];
          rangeOffsets = [];
          glyphIDs = [];
          for (i = 0, _len3 = startCodes.length; i < _len3; i++) {
            startCode = startCodes[i];
            endCode = endCodes[i];
            if (startCode === 0xFFFF) {
              deltas.push(0);
              rangeOffsets.push(0);
              break;
            }
            startGlyph = charMap[startCode]["new"];
            if (startCode - startGlyph >= 0x8000) {
              deltas.push(0);
              rangeOffsets.push(2 * (glyphIDs.length + segCount - i));
              for (code = startCode; startCode <= endCode ? code <= endCode : code >= endCode; startCode <= endCode ? code++ : code--) {
                glyphIDs.push(charMap[code]["new"]);
              }
            } else {
              deltas.push(startGlyph - startCode);
              rangeOffsets.push(0);
            }
          }
          subtable.writeUInt16(3);
          subtable.writeUInt16(1);
          subtable.writeUInt32(12);
          subtable.writeUInt16(4);
          subtable.writeUInt16(16 + segCount * 8 + glyphIDs.length * 2);
          subtable.writeUInt16(0);
          subtable.writeUInt16(segCountX2);
          subtable.writeUInt16(searchRange);
          subtable.writeUInt16(entrySelector);
          subtable.writeUInt16(rangeShift);
          for (_k = 0, _len4 = endCodes.length; _k < _len4; _k++) {
            code = endCodes[_k];
            subtable.writeUInt16(code);
          }
          subtable.writeUInt16(0);
          for (_l = 0, _len5 = startCodes.length; _l < _len5; _l++) {
            code = startCodes[_l];
            subtable.writeUInt16(code);
          }
          for (_m = 0, _len6 = deltas.length; _m < _len6; _m++) {
            delta = deltas[_m];
            subtable.writeUInt16(delta);
          }
          for (_n = 0, _len7 = rangeOffsets.length; _n < _len7; _n++) {
            offset = rangeOffsets[_n];
            subtable.writeUInt16(offset);
          }
          for (_o = 0, _len8 = glyphIDs.length; _o < _len8; _o++) {
            id = glyphIDs[_o];
            subtable.writeUInt16(id);
          }
          return result = {
            charMap: charMap,
            subtable: subtable.data,
            maxGlyphID: nextID + 1
          };
      }
    };

    return CmapEntry;

  })();

  module.exports = CmapTable;

}).call(this);
