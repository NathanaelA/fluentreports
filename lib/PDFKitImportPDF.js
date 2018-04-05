"use strict";

/*
 --------------------------------------
 (c)2012-2015, Kellpro, Inc.
 --------------------------------------
 FluentReports is under The MIT License (MIT)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/**
 * @module PDFKitImportPDF
 * @author Nathanael Anderson
 * @copyright 2015, Kellpro Inc.
 * @license MIT
 */

var pdfkit = require('pdfkit');


/**
 * Each imported page into pdfkit is created using this structure so that
 * pdf kit can track the obj's that are needed to generate the outgoing pdf buffer
 * @param document
 * @param pdfObjects
 * @param idx
 * @constructor
 */
var PDFImportedPage = function(document, pdfObjects, idx) {
    if (document._writtenReferences[idx]) {
        return {dictionary: document._writtenReferences[idx]};
    }

    this.document = document;
    this.pdfObjects = pdfObjects;

    var pdfObject = pdfObjects[idx], chunks;

    this.dictionary = this.document.ref();
    this.document._writtenReferences[idx] = this.dictionary;

    var ref = {
        Type: 'Page',
        Parent: this.document._root.data.Pages
    };

    for (var key in pdfObject.data) {
        if (!pdfObject.data.hasOwnProperty(key)) {
            continue;
        }
        if (key === 'Parent') { continue; }
        if (pdfObject.data[key] === null) {
          ref[key] = pdfObject[key];
        }
        else if (pdfObject.data[key]._isReference) {
            ref[key] = this.buildRef(pdfObject.data[key].id);
        }
        else if (key === '_chunks') {
            chunks = pdfObject.data._chunks;
        } else if (Array.isArray(pdfObject.data[key])) {
            ref[key] = this.processArray(pdfObject.data[key]);
        } else if (pdfObject.data[key].isString || pdfObject.data[key].isRaw || pdfObject[key] === true || pdfObject[key] === false || Buffer.isBuffer(pdfObject[key])) {
            ref[key] = pdfObject[key];
        } else if (typeof pdfObject.data[key] === "object") {
            ref[key] = this.processObject(pdfObject.data[key]).dict;
        } else {
            ref[key] = pdfObject.data[key];
        }
    }

    if (chunks && ref.Length) {
        ref.Length = 0;
    }

    this.dictionary.data = ref;
    if (chunks) {
        this.dictionary.compress = false;
        this.dictionary.write(chunks);
    }
    this.dictionary.end();
    delete this.pdfObjects;
};

PDFImportedPage.prototype.buildRef = function(idx) {
    var pdfObject = this.pdfObjects[idx], ref;

    // If we have already written this Reference; then we return it as is -- we can re-link to the same ref w/o having to rewrite it to the file
    if (this.document._writtenReferences[idx]) {
        return this.document._writtenReferences[idx];
    }

    var result = this.document.ref();
    this.document._writtenReferences[idx] = result; //new PDFReference(result.id, result.gen);

    if (Array.isArray(pdfObject.data)) {
        ref = {dict: this.processArray(pdfObject.data)};
    } else {
        ref = this.processObject(pdfObject.data);  // We are using the full array here so no ".dict" here
    }

    // In the event we are linking to another page
    // We need to build the page properly as it needs the main parent
    if (pdfObject.data.Type && pdfObject.data.Type === "Page") {
        ref.dict.Parent = this.document._root.data.Pages;
    }


    // We have to Zero out the imported length, because the "pdfkit write" will add the data back to the length...
    if (ref.chunks && ref.dict.Length) {
        ref.dict.Length = 0;
    }

    // Create and write out this reference
    result.data = ref.dict;
    if (ref.chunks) {
        result.compress = false;
        result.write(ref.chunks);
    }
    result.end();

    // Return this reference
    return result;
};

PDFImportedPage.prototype.processArray = function(arr) {
    var results = [];
   for  (var i=0;i<arr.length;i++) {
       if (arr[i] === null) {
           results.push(arr[i]);
       } else if (Array.isArray(arr[i])) {
           results.push(this.processArray(arr[i]));
       } else if (arr[i]._isReference) {
           results.push(this.buildRef(arr[i].id));
       } else if (arr[i].isString || arr[i].isRaw || typeof arr[i] === "string" || typeof arr[i] === "number" || arr[i] === true || arr[i] === false || Buffer.isBuffer(arr[i])) {
           results.push(arr[i]);
       } else if (typeof arr[i] === "object") {
           results.push(this.processObject(arr[i]).dict);
       } else {
           console.error("ProcessArray unable to determine data type", typeof arr[i], arr[i]);
       }
   }
    return results;
};

PDFImportedPage.prototype.processObject = function(obj) {
    var results = {}, chunks = null;
    if (typeof obj !== "object") {
        return {dict: obj};
    }

    for (var key in obj) { // jshint ignore:line
        if (!obj.hasOwnProperty(key) || key === "Parent") {
            continue;
        }
        if (obj[key] === null) {
            results[key] = obj[key];
        } else if (obj[key]._isReference) {
            if (key === "Length") {
                results[key] = this.pdfObjects[obj[key].id].data;
            } else {
                results[key] = this.buildRef(obj[key].id, key);
            }
        } else if (key === '_chunks') {
            chunks = obj._chunks;
        } else {
            if (Array.isArray(obj[key])) {
                results[key] = this.processArray(obj[key]);
            } else if (typeof obj[key] === "string" || typeof obj[key] === "number" || obj[key].isString || obj[key].isRaw || obj[key] === true || obj[key] === false || Buffer.isBuffer(obj[key])) {
                results[key] = obj[key];
            } else if (typeof obj[key] === "object") {
                results[key] = this.processObject(obj[key]).dict;
            } else {
                console.error("Error processing ", obj[key], typeof obj[key]);
            }
        }
    }

    return {dict: results, chunks: chunks};
};

PDFImportedPage.prototype.end = function() {
  // Do Nothing...
};


/**
 * This is used to store all PDF OBJects from the PDF File; the file is primarily made up of:
 * 1 0 OBJ data endobj
 * 2 0 OBJ <<more data>> endobj
 * ...
 * x 0 OBJ [even more data] endobj
 * @constructor
 */
var PDFObject = function() {
    //noinspection JSUnusedGlobalSymbols
    this.gen = 0;
    this.id = 0;
    this.data = null;
};


/**
 * Used to track any/all PDF References in the PDF
 * @param id - id of the Reference
 * @param gen - Generation (99.9% of the time this is a zero, and we don't use the generation for anything)
 * @constructor
 */
var PDFReference = function(id, gen) {
    this.id = id;
    this.gen = gen;
};
PDFReference.prototype._isReference = true;


/**
 * PDFParser, create a new parser to parse a valid pdf structure
 * @param data is a buffer that contains the pdf file
 * @param options can optionally disable "denormalize"
 * @constructor
 */
function PDFParser(data, options) {
    this._offset = 0;
    this._length = data.length;
    this._data = data;
    this._references = [];
    this.__level = 0;
    this._xrefs = {};
    this._options = options || {deNormalize: false};
    if (this._options.deNormalize !== false) {
         this._options.deNormalize = false;
    }
}

function debugWrapper(func, name) {
    return function() {
        this.__level++;
        var args = [];
        args.push("Starting "+name);
        for (var i=0;i<arguments.length;i++) {
            args.push(arguments[i]);
        }
        this.log.apply(this, args);
        var res = func.apply(this, arguments);
        this.log("Ending ", name, arguments[0] ? arguments[0] : ''); //, res ? res : '');
        this.__level--;
        return res;
    };
}

/**
 * If the debug routine is ran, it will wrap all the pdfparser functions in a log so that we can trace visually in/out flow.
 */
PDFParser.prototype.debug = function() {
  if (this.__debug) { return; }
  this.__debug = true;

  for (var name in this) { // jshint ignore:line
      if (name === "log" || name === "debug") { continue; }
      if (name === "isTerminatingChar" || name === "consumeExtraWhiteSpace") { continue; }
      if (PDFParser.prototype.hasOwnProperty(name) && typeof this[name] === 'function') {
          this[name] = debugWrapper(this[name], name);
      }
  }
};

PDFParser.prototype.log = function() {
    var str = "";
    for (var i=0;i<this.__level; i++) { str += "   "; }
    arguments[0] = str + arguments[0];
    console.log.apply(console, arguments);
};

/**
 * This starts the Parsing of the pdf document
 * @returns {*} - all the "OBJ"s in a dictionary format
 */
PDFParser.prototype.parseDocument = function() {
    var objs = {}, obj;

    try {
        do {
            obj = this.parseStream();
            if (obj && obj.id) {
                objs[obj.id] = obj;
            }
        } while (obj);
    } catch (Err) {
        console.log(" -------------------- ERROR OCCURRED ------------------------");
        console.error(Err);
        return null;
    }

    var key;
    if (this._options.deNormalize) {
        for (key in objs) {
            if (objs.hasOwnProperty(key)) {
                this.deNormalize(objs, objs[key].data);
            }
        }
    }

    if (this.trailer) {
        objs.trailer = this.trailer;
    } else {
        // Find XREf Dictionary
        for (key in objs) {
            if (objs.hasOwnProperty(key)) {
                if (objs[key].data && objs[key].data.Type && objs[key].data.Type === "XRef") {
                    if (objs.trailer) {
                        for (var key2 in objs[key].data) {
                            if (objs[key].data.hasOwnProperty(key2) && !objs.trailer[key2]) {
                                objs.trailer[key2] = objs[key].data[key2];
                            }
                        }
                    } else {
                        objs.trailer = objs[key].data;
                    }
                }
            }
        }
    }

    if (objs.trailer.Encrypt) {
        console.error("Unable to use Encrypted PDF's");
        return null;
    }


    return objs;
};

/**
 * Parses a set of XRefs
 * isMaster - If this is
 * @returns {*}
 */
PDFParser.prototype.parseXRef = function() {

    this.consumeExtraWhiteSpace();
    var id = this.parseNumber(true);
    var cnt = this.parseNumber(true);

    for (var i=0;i<cnt;i++) {
        this._xrefs[id+i] = {offset: this.parseNumber(true), gen: this.parseNumber(true), status: this._data[this._offset]};
        this._offset += 3;
    }
    if (this._data[this._offset] >= 48 && this._data[this._offset] <= 57) {
        // We have another part of the XREF table, so we are going to parse it
        return this.parseXRef();
    }

    this.consumeExtraWhiteSpace();

    if (this._data[this._offset] !== 116) {
        throw new Error("Trailer was not found " + this._offset);
    } else {
        this._offset += 7;
    }

    // The only Trailer we care about is the "Root" trailer
    if (!this.trailer || !this.trailer.Root) {
        this.trailer = this.parseDictionary();
    } else {
        var temptrailer = this.parseDictionary();
        if (temptrailer.Encrypt) {
            // We need to make sure to copy the Encrypt stuff over since we need to be able to detect encrypted pdf's to
            // throw the error later that we can't handle encrypted pdf's yet.
            this.trailer.Encrypt = temptrailer.Encrypt;
        }
    }
    this.findInStream("%%EOF");
    this._offset += 5;
    this.consumeExtraWhiteSpace();
};

/**
 * This will denormalize a pdf document
 * @param all - All the objects
 * @param obj - the current Object working on
 */
PDFParser.prototype.deNormalize = function(all, obj) {
    var id;

    if (obj._isReference) {
        //noinspection UnnecessaryReturnStatementJS
        return;  // We don't do anything with a obj passed in that is just a reference...
    }
    else if (typeof obj === "object") {
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && key !== "parent" && key !== "_chunks") {
                if (obj[key]._isReference) {
                    id = obj[key].id;
                    if(Array.isArray(all[id].data)) {
                        // Todo: many Arrays have large number of values or large values;
                        // this path need to check before it denormalizes it, so we are disabling this path currently
                        //noinspection UnnecessaryContinueJS
                        continue;
                        // obj[key] = all[id].data;
                    } else if (typeof all[id].data === "object") {
                        //noinspection UnnecessaryContinueJS
                        continue;
                    } else {
                        obj[key] = all[id].data;
                    }
                } else if (typeof obj[key] === "object" || Array.isArray(obj[key])) {
                    this.deNormalize(all, obj[key]);
                }
            }
        }
    } else if (Array.isArray(obj)) {
        for (var i=0;i<obj.length;i++) {
            if (obj[i]._isReference) {
                id = obj[i].id;
                if (typeof all[id].data === "object" || Array.isArray(all[id].data)) {
                    //noinspection UnnecessaryContinueJS
                    continue;
                } else {
                    obj[i] = all[id].data;
                }
            } else if (typeof obj[i] === 'object' || Array.isArray(obj[i])) {
                this.deNormalize(all, obj[i]);
            }
        }
    }
};

/**
 * This parses the next part of the PDF Document stream until it finds a valid PDFObject and creates it and returns it.
 * @returns {*} - null = done, pdfObject for the next "OBJ" pulled out of the pdf document
 */
PDFParser.prototype.parseStream = function() {
    var data = this._data, length = this._length;

    // We have already exceeded the data buffer
    if (this._offset >= length) {
        return null;
    }

    // Type of Object is comment %, end is \n
    if (data[this._offset] === 37) {

        // Found a %%EOF meaning we are done.
        if (data[this._offset+1] === 37 && data[this._offset+2] === 69 && data[this._offset+3] === 79 && data[this._offset+4] === 70) {
            // See if this is the LAST EOF, if so we are done.
            if (this._offset >= length - 10) {
                this._offset = length;
                return null;
            }
        }

        // Otherwise this is a comment, so we need to find the EOL character
        this.findEOL();
        // Clear any extra characters as there can be \n\r or other white space between here and the next object in the stream
        this.consumeExtraWhiteSpace();

        // Since theoretically we could have another comment following this comment; we are going to recursively call ourselves; so
        // that we can eat all the comments until we get to a real piece of data that we want.
        return this.parseStream();
    }

    // xref means we found a xref table
    if (data[this._offset] === 120 && data[this._offset+1] === 114 && data[this._offset+2] === 101 && data[this._offset+3] === 102) {
        this._offset += 4;
        this.parseXRef();
        this.consumeExtraWhiteSpace();
        return this.parseStream();
    } else if (data[this._offset] === 115 && data[this._offset+1] === 116 && data[this._offset+2] === 97 && data[this._offset+3] === 114 && data[this._offset+4] === 116 && data[this._offset+5] === 120 && data[this._offset+6] === 114 && data[this._offset+7] === 101 && data[this._offset+8] === 102) {
        // startxref
        this._offset += 9;
        this.findInStream("%%EOF");
        return this.parseStream();
    }

    // This should then be an "id gen obj"
    var id = this.parseNumber(true), gen;
         gen = this.parseNumber(true);

    // Verify we have a valid data "obj" record
    if (!id || gen === null || data[this._offset] !== 111 || data[this._offset+1] !== 98 || data[this._offset+2] !== 106) {
        throw new Error ("PDF Format was unable to be parsed correctly, found bad data in stream (should be obj) " + id + " - " + gen + " - " + this._offset + " - " + data[this._offset]);
    }
    // Skip past the "obj" we found above
    this._offset += 3;
    this.consumeExtraWhiteSpace();

    var objData = this.parseStreamObject(true);

    var pdo = new PDFObject(this.document);
    pdo.id = id;
    pdo.gen = gen;
    pdo.data = objData;

   return pdo;
};

/**
 * Build a Object from the Stream data
 * @param consumeEndObj - Consume the rest of the stream to the endobj
 * @returns {*} - The data that it parsed out of this object.
 */
PDFParser.prototype.parseStreamObject = function(consumeEndObj) {

    var data = this._data;
    this.consumeExtraWhiteSpace();

    var chr = data[this._offset];
    var newData;

    // Parse Number (might also be a Reference)
    if (chr >= 48 && chr <= 57 || chr === 43 || chr === 45 || chr === 46) { // 0-9 +,-,.

        newData = this.parseNumber(true);
        var isRef, offset=this._offset;
        if (data[this._offset] >= 48 && data[this._offset] <= 57) {
            isRef = this.parseNumber(false);
            if (isRef !== null && data[this._offset] === 82) {
                newData = new PDFReference(newData, isRef);
                this._references.push(newData);
                this._offset++;
            } else {
                this._offset = offset;
            }
        }
        if (consumeEndObj) {
            this.consumeEndObj();
        }

    } else if (chr ===  40) { // (     String
        // This is Intentional casting to a new String() object, unfortunately PDFKit uses a
        // check for a String Object to classify a literal String object
        newData = new String(this.parseString(consumeEndObj)); // jshint ignore:line
    } else if (chr ===  60) { // <  Hex or << Object
        if (data[this._offset+1] !== 60) {
            newData = this.parseHex(consumeEndObj);
        } else {
            newData = this.parseDictionary(consumeEndObj);
        }
    } else if (chr ===  91) { // [  Array
        newData = this.parseArray(consumeEndObj);
    } else if (chr ===  47) { // /
        newData = this.parseKey(consumeEndObj);
    } else if (chr === 116 && data[this._offset+1] === 114 && data[this._offset+2] === 117 && data[this._offset+3] === 101) { // true
        newData = true;
        this._offset += 4;
    } else if (chr === 102 && data[this._offset+1] === 97 && data[this._offset+2] === 108 && data[this._offset+3] === 115 && data[this._offset+4] === 101) { // false
        newData = false;
        this._offset += 5;
    } else if (chr === 110 && data[this._offset+1] === 117 && data[this._offset+2] === 108 && data[this._offset+3] === 108) { // null
        newData = null;
        this._offset +=4;
    } else if (chr === 37) {  // %  Comment
        // Eat the comment, then call me again to get the real value we want
        this.findEOL();

        return this.parseStreamObject(consumeEndObj);
    } else if (chr === 101 && data[this._offset+1] === 110 && data[this._offset+2] === 100 && data[this._offset+3] === 111 && data[this._offset+4] === 98 && data[this._offset+5] === 106) { // endobj
        // This means the endobj was where we expected a value; so we return no value as the value is empty
        // We are going to change this to "null" -- since it is a empty value; pdf spec is not clear on this case
        newData = null;
        if (consumeEndObj) {
            this.consumeEndObj();
        }
    }  else {
        throw new Error("PDF Format was unable to be parsed correctly, found bad data in stream (should be a type) " + this._offset + " - " + data[this._offset]);
    }

    return newData;
};

/**
 * Ignore all the characters up to and including the endobj
 */
PDFParser.prototype.consumeEndObj = function() {

    var data = this._data, len = this._length - 6, start = this._offset;

    // find the "endobj"
    while (start < len && data[start] !== 101 && data[start+1] !== 110 && data[start+2] !== 100 && data[start+3] !== 111 && data[start+4] !== 98 && data[start+5] !== 106) {
        start++;
    }

    // Verify this is the endobj
    if (data[start] !== 101) {
        throw new Error("Unable to find endobj in the stream that is at "+this._offset);
    }
    this._offset = start + 6;
    this.consumeExtraWhiteSpace();
};

/**
 * Find the end of line character (10) and reset the offset to it
 */
PDFParser.prototype.findEOL = function() {
    var data = this._data, length = this._length;
    // EOL can be either /n or /r
    while ((data[this._offset] !== 10 && data[this._offset] !== 13) && this._offset < length) { this._offset++; }
    // eat any extra \r or \n
    while (data[this._offset] === 10 || data[this._offset] === 13) { this._offset++; }

};

/**
 * Find the "val" in the buffer array and reset the offset to that location
 * @param val
 * @returns {boolean}
 */
PDFParser.prototype.findInStream = function(val) {
    var length = val.length, values = [];
    if (typeof val === "string") {
        // Create Integer array
        for (var i = 0; i < length; i++) {
            values.push(val.charCodeAt(i));
        }
    } else {
        // Then this must be an array if it isn't a string
        values = val;
    }

    var data = this._data, len = this._length, found = false;

    for (;this._offset < len && !found;this._offset++) {
        if (data[this._offset] !== values[0]) { continue; }
        found = true;
        for (var j=1;j<length && found;j++) {
            if (data[this._offset+j] !== values[j]) { found=false; }
        }
    }
    // The above loop will increment this before exiting the loop so we have to decrement it to put it back on the first character
    this._offset--;

    return found;
};

/**
 * We need to know if the chr we are using is considered a termination of the current element
 * There are about several valid termination characters depending on context
 * @param chr
 * @returns {boolean}
 */
PDFParser.prototype.isTerminatingChar = function(chr) {
    // White Space, or special Characters like /, <, [, {, %, ], >, }
    return !!(chr === 0 || chr === 9 || chr === 10 || chr === 12 || chr === 13 || chr === 32 || chr === 47 || chr === 40 || chr === 60 || chr === 91 || chr === 123 || chr === 37 || chr === 93 || chr === 62 || chr === 125);
};

/**
 * Parse a number out of the stream
 * @param reportError - throws anderror if the number is not valid instead of returning null
 * @returns {*} - number if valid, null if not valid
 */
PDFParser.prototype.parseNumber = function(reportError) {
    var id=0, chr, len = this._length, data = this._data;

    var start = this._offset;

    // Make sure this is a 0-9 or a +,-,.
    while (this._offset < len && ( (chr = data[this._offset]) === 43 || chr === 45 || chr === 46 || chr >= 48 && chr <= 57 ) ) {
        this._offset++;
    }
    if (!this.isTerminatingChar(chr)) {
        if (reportError !== false) {
            throw new Error("ParseNumber found a non terminator in number stream; " + this._offset + " - " + chr);
        } else {
            return null;
        }
    }
    if (this._offset >= len) {
        return null;
    }
    var num = data.slice(start, this._offset).toString();

    if (num.indexOf('.') >= 0) {
        id = parseFloat(num);
    } else {
        id = parseInt(num, 10);
    }
    this.consumeExtraWhiteSpace();

    return id;
};

PDFParser.prototype.parseString = function(consumeEndObj) {

    var start = this._offset, len = this._length-7, data = this._data;
    var depth = 1, stringStart = start+ 1, stringEnd;

    if (data[start] !== 40) {
        throw new Error("Called parseString on a non-string object at " + this._offset);
    }

    while (start < len) {
        start++;

        if (data[start] === 40) {
            depth++;
            continue;
        }
        if (data[start] === 41) {
            depth--;
            if (depth === 0) {
                break;
            }
            continue;
        }
        if (data[start] === 92) { start++; } // a escaped character so we skip the next one in the stream as it is never valid for checking against
    }
    stringEnd = start;
    this._offset = stringEnd+1;

    if (start >= len || depth) { throw new Error("Unable to find string end that started at "+this._offset); }
    if (consumeEndObj) {
        this.consumeEndObj();
    }

    return (data.slice(stringStart, stringEnd).toString());
};

PDFParser.prototype.parseDictionary = function(consumeEndObj) {

    var data = this._data, len = this._length, dict = {};

    this.consumeExtraWhiteSpace();
    if (data[this._offset] !== 60 && data[this._offset+1] !== 61) {
        throw new Error("parseDictionary called, but this isn't a dictionary at" + this._offset);
    }
    this._offset+=2;
    this.consumeExtraWhiteSpace();

    // We need to keep doing this until we get to the closing '>'
    while (data[this._offset] !== 62 && data[this._offset+1] !== 62 && this._offset < len) {
        var key = this.parseKey();
        dict[key] = this.parseStreamObject(false);
        this.consumeExtraWhiteSpace();
    }
    this._offset+=2;
    this.consumeExtraWhiteSpace();

    // Check for stream
    if (data[this._offset] === 115 && data[this._offset+1] === 116 && data[this._offset+2] === 114 && data[this._offset+3] === 101 && data[this._offset+4] === 97 && data[this._offset+5] === 109) {
        // Do we have a Stream Length
        if (typeof dict.Length === "undefined") {
            if (console && console.warn) {
                console.warn("Found Stream Object, but no Length in dictionary at " + this._offset + " attempting to calculate");
            }
        }

        // eat "stream"
        this._offset += 6;

        // CR & CRLF are valid at the beginning; so we want to eat these
        while (data[this._offset] === 10 || data[this._offset] === 13) {
            this._offset++;
        }


        // Reset where we are processing and move index to after the "endstream"
        if (typeof dict.Length === "number") {
            // Grab the stream
            dict._chunks = data.slice(this._offset, this._offset+dict.Length);
            this._offset += dict.Length;
        } else {
            var start = this._offset;
            if (!this.findInStream("endstream")) {
                throw new Error("Unable to find end of Stream that started at " + start);
            }
            dict._chunks = data.slice(start, this._offset);
        }

        while (data[this._offset] === 10 || data[this._offset] === 13) {
            this._offset++;
        }

        // eat "endstream"
        this._offset += 9;
        this.consumeExtraWhiteSpace();
    }

    if (consumeEndObj) {
        this.consumeEndObj();
    }

    return dict;
};

PDFParser.prototype.parseKey = function(consumeEndObj) {

    var data = this._data, len = this._length;
    var start = this._offset + 1;
    if (data[this._offset] !== 47) {
        throw new Error("parseKey called, but this is not a key " + this._offset);
    }
    this._offset++;

    while (this._offset < len && !this.isTerminatingChar(data[this._offset])) {
        this._offset++;
    }
    var key = data.slice(start, this._offset).toString();
    if (consumeEndObj) {
        this.consumeEndObj();
    }

    return key;
};

PDFParser.prototype.parseHex = function(consumeEndObj) {

    var data = this._data, len = this._length;
    var start = this._offset + 1;
    if (data[this._offset] !== 60) {
        throw new Error("parseHex called, but this is not a Hex", this._offset);
    }
    this._offset++;

    while (this._offset < len && data[this._offset] !== 62) {
        this._offset++;
    }
    // Increment past the >
    this._offset++;

    var key = data.slice(start, this._offset-1).toString();

    if (consumeEndObj) {
        this.consumeEndObj();
    }

    return new Buffer(key, "hex");
};

PDFParser.prototype.parseArray = function(consumeEndObj) {

    var len = this._length, data = this._data;
    if (data[this._offset] !== 91) {
       throw new Error("parseArray doesn't see an array at " + this._offset);
    }
    this._offset++;

    this.consumeExtraWhiteSpace();
    var arr = [];

    // Keep looping until the ']' is found
    while (this._offset < len && data[this._offset] !== 93) {
        var value = this.parseStreamObject(false);
        arr.push(value);
        this.consumeExtraWhiteSpace();
    }

    // Eat the closing ']'
    this._offset++;

    if (consumeEndObj) {
        this.consumeEndObj();
    } else {
        this.consumeExtraWhiteSpace();
    }
   return arr;
};

PDFParser.prototype.consumeExtraWhiteSpace = function() {
    var chr;

    while ((chr = this._data[this._offset]) === 10 || chr === 13 || chr === 0 || chr === 9 || chr === 12 || chr === 32 ) { this._offset++; }
};


// ---------------------------------------------------------------------------
// Add our functions to PDFKit
// ---------------------------------------------------------------------------

//noinspection JSUnresolvedVariable
pdfkit.prototype.getEmptyPageStats = function() {
    this.emptyPageCountData = [
        this.page._imageCount,
        this.page.content.uncompressedLength,
        this.page.resources.uncompressedLength,
        this.page.dictionary.uncompressedLength
    ];
};

//noinspection JSUnresolvedVariable
pdfkit.prototype.isEmptyPage = function() {
   // Verify we have a valid page, and a valid pdfkit page
   if (!this.page || !this.page.document) {
        return false;
   }

    if (!Array.isArray(this.emptyPageCountData)) {
        this.emptyPageCountData = [0,18,0,0];
    }

   if (this.page._imageCount > this.emptyPageCountData[0]) {    // 0;
       return false;
   }

    // A Transform is placed in the content on a new page and its length is 18
   if (this.page.content.uncompressedLength > this.emptyPageCountData[1]) { // 18
       return false;
   }
   if (this.page.resources.uncompressedLength > this.emptyPageCountData[2]) { // 0
       return false;
   }
   //noinspection RedundantIfStatementJS
    if (this.page.dictionary.uncompressedLength > this.emptyPageCountData[3]) { // 0
       return false;
   }
   return true;
};

// ---------------------------------------------------------------------------
// This will not remove the page data that is already written and embedded in the PDF already
// But it will remove the index to the page.
// If the page has not been written yet, it will then be eliminated from the pdf
// ---------------------------------------------------------------------------
//noinspection JSUnresolvedVariable
pdfkit.prototype.deletePage = function(id) {
     var pages = this._root.data.Pages.data;
     if (id >= 0 && id < pages.Kids.length) {

         var delPage = pages.Kids[id];
         pages.Kids.splice(id, 1);
         pages.Count--;

         // Only the current (last) page can be deleted and the stuff removed from the stream
         if (this.page.dictionary.id === delPage.id) {

             // If we haven't called ".end" on these Page Refs; we aren't going to but we need to
             // Decrease the reference count
             if (this.page.content && !this.page.content.offset) {
                 this._waiting--;
             }
             if (this.page.dictionary && !this.page.dictionary.offset) {
                 this._waiting--;
             }
             if (this.page.resources && !this.page.resources.offset) {
                 this._waiting--;
             }

             this.page = {
                 end: function () {
                 }
             };
         }

     } else {
         // Delete the last page
         pages.Count--;
         pages.Kids.pop();
         if (this.page.content && !this.page.content.offset) {
             this._waiting--;
         }
         if (this.page.dictionary && !this.page.dictionary.offset) {
             this._waiting--;
         }
         if (this.page.resources && !this.page.resources.offset) {
             this._waiting--;
         }
         this.page = { end: function() {} };
     }
};

// ---------------------------------------------------------------------------
// We need to Hijack the PDFKit Document End and _Finalize to support deletion and auto-deletion
// ---------------------------------------------------------------------------
//noinspection JSUnresolvedVariable
pdfkit.prototype._PKIEnd = pdfkit.prototype.end;

//noinspection JSUnresolvedVariable
pdfkit.prototype.end = function() {
    if (this.isEmptyPage()) {
        this.deletePage();
    }
    this._PKIEnd();
};

//noinspection JSUnresolvedVariable
pdfkit.prototype._PKIFinalize = pdfkit.prototype._finalize;

//noinspection JSUnresolvedVariable
pdfkit.prototype._finalize = function(fn) {
    var i = 0;
    while (i < this._offsets.length) {
        // Eliminate any NULL Offsets from deleted pages
        if (this._offsets[i] === null) {
           this._offsets.splice(i, 1);
           continue;
        }
        i++;
    }
    this._PKIFinalize(fn);
};

//noinspection JSUnresolvedVariable
/**
 * This imports all the PDF pages
 * @param data - this is the PDF document buffer
 * @param options - the only current option is "denormalize"
 */
pdfkit.prototype.importPDF = function(data, options) {
    this._waiting++;
    var emptyPage = this.isEmptyPage();
    var curPage;
    var completed;
    var versionId;
    var pages = this._root.data.Pages.data;
    options = options || {};
    this._writtenReferences = {};

    try {
        //noinspection JSUnresolvedVariable
        if (!Buffer.isBuffer(data)) {

            //noinspection JSUnresolvedFunction
            data = new Buffer(data, 'binary');
        }

        if (!data.length) {
            console.error("importPDF passed a empty data buffer.");
            return false;
        }

        // Check for %PDF-1. header
        if (data[0] === 37 && data[1] === 80 && data[2] === 68 && data[3] === 70 && data[4] === 45 && data[5] === 49 && data[6] === 46) {
            // 53 = PDF v1.5 or greater may not parse properly.
            versionId = data[7];
            if (versionId >= 53) {
                console.warn("importPDF may not be able read this version of the PDF file format...");
            }
        } else {
            console.error("importPDF function was not passed a valid PDF object.");
            return false;
        }


        var parser = new PDFParser(data, options);
        var objects = parser.parseDocument();
        if (!objects || !objects.trailer) {
            // If their was a parsing error; we don't do anything to the document
            return false;
        }

        //console.log(objects[126].data.A.URI, objects[126].data.A.URI.isString);

        if (!objects.trailer.Root || !objects.trailer.Root.id) {
            //console.log(objects.trailer);
            console.error("Missing Trailer -> Root node");
            return false;
        }

        // Get the Root Catalog Index
        var idx = objects.trailer.Root.id;
        if (!objects[idx] || !objects[idx].data.Type || objects[idx].data.Type !== "Catalog" || !objects[idx].data.Pages) {
            console.error("Error with PDF Catalog " + idx);
            if (versionId >= 53) {
                console.error("This probably means the catalog is in a stream which is currently not supported.");
            }
            return false;
        }
        // Get the Root Page Index
        idx = objects[idx].data.Pages.id;
        if (!objects[idx] || !objects[idx].data.Type || objects[idx].data.Type !== "Pages" || objects[idx].data.Count <= 0) {
            console.error("Error with PDF Pages ", idx);
            if (versionId >= 53) {
                console.error("This probably means the page is in a stream which is currently not supported.");
            }
            return false;
        }

        // Handle the current page; depending on its status
        if (emptyPage) {
            // We will re-use this page at the end of the import if it hasn't been modified
            curPage = pages.Kids.pop();
        } else {
            // We will finish this page and then at the end of the import we will add a new page
            this.page.end();
            // No valid page until we add a new page below.
            this.page = null;
        }

        // Create PDF Imported pages
        completed = this._handleImportedPages(objects, idx);

        if (emptyPage) {
            pages.Kids.push(curPage);
        } else {
            this.addPage();
        }

    } finally {
        this._waiting--;

        // Clear out our written Refs so we don't waste memory for no reason
        this._writtenReferences = {};
    }
    return completed;
};

//noinspection JSUnresolvedVariable
pdfkit.prototype._handleImportedPages = function (pdfObjects, idx) {
    if (pdfObjects[idx].data.Type === "Pages") {
        var pdfObject = pdfObjects[idx];
        var kids;
        if (pdfObject.data.Kids._isReference) {
            kids = pdfObjects[pdfObject.data.Kids.id].data;
        } else {
            kids = pdfObject.data.Kids;
        }

        for (var i = 0; i < kids.length; i++) {
            var pageIdx = kids[i].id;
            if (pdfObjects[pageIdx].data.Type === "Pages") {
                if (!this._handleImportedPages(pdfObjects, pageIdx)) {
                    return false;
                }
            } else if (pdfObjects[pageIdx].data.Type === "Page") {
                this._handleImportOfPage(pdfObjects, pageIdx);
            } else {
                console.error("Missing Page: ", pageIdx);
                return false;
            }
        }
    } else if (pdfObjects[idx].data.Type === "Page") {
        this._handleImportOfPage(pdfObjects, idx);
    } else {
        console.error("Missing Page: ", idx);
        return false;
    }
    return true;
};

//noinspection JSUnresolvedVariable
pdfkit.prototype._handleImportOfPage = function(pdfObjects, idx) {
    var page = new PDFImportedPage(this, pdfObjects, idx);
    this._root.data.Pages.data.Kids.push(page.dictionary);
    this._root.data.Pages.data.Count++;
};

pdfkit.prototype.textRotate = function(angle, x, y) {
        var cos, rad, sin;
        rad = angle * Math.PI / 180;
        cos = Math.cos(rad);
        sin = Math.sin(rad);
        this.transform(cos, sin, -sin, cos, x, y);
};

//noinspection JSUnresolvedVariable
module.exports = pdfkit;
