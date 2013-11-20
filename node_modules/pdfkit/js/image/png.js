(function() {
  var PNG, PNGImage, zlib;

  zlib = require('zlib');

  PNG = require('png-js');

  PNGImage = (function() {

    function PNGImage(data) {
      this.image = new PNG(data.data);
      this.width = this.image.width;
      this.height = this.image.height;
      this.imgData = this.image.imgData;
    }

    PNGImage.prototype.object = function(document, fn) {
      var mask, obj, palette, rgb, sMask, val, x, _i, _len;
      var _this = this;
      if (!this.alphaChannel) {
        if (this.image.transparency.indexed) {
          this.loadIndexedAlphaChannel(function() {
            return _this.object(document, fn);
          });
          return;
        } else if (this.image.hasAlphaChannel) {
          this.splitAlphaChannel(function() {
            return _this.object(document, fn);
          });
          return;
        }
      }
      obj = document.ref({
        Type: 'XObject',
        Subtype: 'Image',
        BitsPerComponent: this.image.bits,
        Width: this.width,
        Height: this.height,
        Length: this.imgData.length,
        Filter: 'FlateDecode'
      });
      if (!this.image.hasAlphaChannel) {
        obj.data['DecodeParms'] = document.ref({
          Predictor: 15,
          Colors: this.image.colors,
          BitsPerComponent: this.image.bits,
          Columns: this.width
        });
      }
      if (this.image.palette.length === 0) {
        obj.data['ColorSpace'] = this.image.colorSpace;
      } else {
        palette = document.ref({
          Length: this.image.palette.length
        });
        palette.add(new Buffer(this.image.palette));
        obj.data['ColorSpace'] = ['Indexed', 'DeviceRGB', (this.image.palette.length / 3) - 1, palette];
      }
      if (this.image.transparency.grayscale) {
        val = this.image.transparency.greyscale;
        obj.data['Mask'] = [val, val];
      } else if (this.image.transparency.rgb) {
        rgb = this.image.transparency.rgb;
        mask = [];
        for (_i = 0, _len = rgb.length; _i < _len; _i++) {
          x = rgb[_i];
          mask.push(x, x);
        }
        obj.data['Mask'] = mask;
      }
      if (this.alphaChannel) {
        sMask = document.ref({
          Type: 'XObject',
          Subtype: 'Image',
          Height: this.height,
          Width: this.width,
          BitsPerComponent: 8,
          Length: this.alphaChannel.length,
          Filter: 'FlateDecode',
          ColorSpace: 'DeviceGray',
          Decode: [0, 1]
        });
        sMask.add(this.alphaChannel);
        obj.data['SMask'] = sMask;
      }
      obj.add(this.imgData);
      return fn(obj);
    };

    PNGImage.prototype.splitAlphaChannel = function(fn) {
      var _this = this;
      return this.image.decodePixels(function(pixels) {
        var a, alphaChannel, colorByteSize, done, i, imgData, len, p, pixelCount;
        colorByteSize = _this.image.colors * _this.image.bits / 8;
        pixelCount = _this.width * _this.height;
        imgData = new Buffer(pixelCount * colorByteSize);
        alphaChannel = new Buffer(pixelCount);
        i = p = a = 0;
        len = pixels.length;
        while (i < len) {
          imgData[p++] = pixels[i++];
          imgData[p++] = pixels[i++];
          imgData[p++] = pixels[i++];
          alphaChannel[a++] = pixels[i++];
        }
        done = 0;
        zlib.deflate(imgData, function(err, imgData) {
          _this.imgData = imgData;
          if (err) throw err;
          if (++done === 2) return fn();
        });
        return zlib.deflate(alphaChannel, function(err, alphaChannel) {
          _this.alphaChannel = alphaChannel;
          if (err) throw err;
          if (++done === 2) return fn();
        });
      });
    };

    PNGImage.prototype.loadIndexedAlphaChannel = function(fn) {
      var transparency;
      var _this = this;
      transparency = this.image.transparency.indexed;
      return this.image.decodePixels(function(pixels) {
        var alphaChannel, i, j, _ref;
        alphaChannel = new Buffer(_this.width * _this.height);
        i = 0;
        for (j = 0, _ref = pixels.length; j < _ref; j += 1) {
          alphaChannel[i++] = transparency[pixels[j]];
        }
        return zlib.deflate(alphaChannel, function(err, alphaChannel) {
          _this.alphaChannel = alphaChannel;
          if (err) throw err;
          return fn();
        });
      });
    };

    return PNGImage;

  })();

  module.exports = PNGImage;

}).call(this);
