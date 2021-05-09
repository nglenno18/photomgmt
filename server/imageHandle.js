var imageMagickToggle = process.env.NODE_ENV || "development";
if(imageMagickToggle === "development") imageMagickToggle = false;
else imageMagickToggle === "production";
var gm = require('gm').subClass({imageMagick: imageMagickToggle});
var fs = require('fs');

// const MAX_KB = 2000000;
const MAX_KB = 000000;

resizeFile = function(file, callback){
  var resized = file;
  var fsize = file.size;
  var newsource = file.path;

  if(fsize > MAX_KB){
    console.log('\n\n\n*****RESIZING IMAGE : ', file.size,'\npath = ', file.path);
    try {
      var imgToWrite = gm(file.path);
      // var imgToWrite = gm(file.path).filesize(function(err, value){
      //   if(err) console.log(err);
      //   console.log('Max Quality File Size : ', value);
      // });

      newsource += '.jpg';
      imgToWrite.write(newsource, function(err){
        if(err) {
          console.log(err);
          return callback(file.path);
        }else{
          console.log('\n\n\n*****RESIZED IMAGE : ', newsource);
          return callback(newsource)
        }
      });
    } catch (e) {
      console.log('\n\nERROR RESIZING/COMPRESSING image : \n', e);
      return callback(file.path)
    }
  }else{
    return callback(newsource)
  }
}
