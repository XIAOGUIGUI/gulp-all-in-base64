var path = require('path');
var fs = require('fs');
var through = require('through2');
var typeMap = {
  ttf: 'application/octet-stream',
  mp3: 'audio/mp3',
  png: 'image/png',
  jpg: 'data:image/jpeg',
  jpeg: 'data:image/jpeg',
  gif: 'data:image/gif'
}
function toBase64(options) {
    var opts = options || {};
    var rule = opts.rule || /url\([^\)]+\)/g;

    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return cb();
        }

        var content = file.contents.toString();
        var images = content.match(rule);
        if (images) {
          var currentPath = path.dirname(file.path);
          var fileName = path.basename(file.path);
          images.forEach(function(item,index) {
              imageURL = item.replace(/\(|\)|\'/g, '');
              imageURL = imageURL.replace(/^url/g, '');
              var route = path.join(currentPath, imageURL);
              var filepath = fs.realpathSync(route);
              var extname = path.extname(imageURL).slice(1);
              var imageContent = new Buffer(fs.readFileSync(filepath)).toString('base64');
              var allowTrans = imageContent.length<opts.maxImageSize || !opts.maxImageSize;
              if(opts.debug){
                  console.log(fileName,'第'+index+1+'张图片:'+item,'转后='+(imageContent.length/1024).toFixed(2)+'kb','转码:',(allowTrans?'√':'×'));
              }
              if(allowTrans){
                var dataType = typeMap[extname.toLowerCase()] || 'data:image/png'
                  if (item.indexOf('url') > -1 ) {
                    content = content.replace(item, 'url(\'data:' + dataType + ';base64,' + imageContent + '\')');
                  }
                  else {
                    content = content.replace(item, 'data:' + dataType + ';base64,' + imageContent);
                  }
              }
          });
        }

        file.contents = new Buffer(content);
        this.push(file);

        cb();
    })
}

module.exports = toBase64;
