// require standard libraries
var path = require('path');
var dateformat = require('date-format');
var fs = require('fs');

// require processing files from [utilities]
require('.././utilities/hookHandle');
require('.././utilities/parseHook');
require('.././utilities/testing');

// collect the classese needed from the [model] folder
var {ConfirmationEmail} = require('.././model/email.js');
var {ErrorEmail} = require('.././model/error_email.js');

allProperties = function(req, res){
  res.sendFile(path.join(__dirname,'../public/allProperties.html'));
}
propertyLayouts = function(req, res){
  res.sendFile(path.join(__dirname,'../public/propertyLayout.html'));
}
uploadImagesPage = function(req, res){
  res.sendFile(path.join(__dirname,'../public/uploadImages.html'));
}
propertyPage = function(req, res){
  res.sendFile(path.join(__dirname,'../public/propertyPage.html'));
}

propertySplitView= function(req,res){
  return res.sendFile(path.join(__dirname,'../public/propertySplitGallery.html'));
}

// propertyUpload = function(req, res){
//   res.sendFile(path.join(__dirname,'../public/flippingImages.html'));
// }

// lists all files on the server
userPage = function(req, res){
  var d = path.join(__dirname, '../');
  fs.readdir(d, function(err, items){
    console.log('\n\nITEMS in SERVER: ', items);

    res.send(items);
  });
}

// call the ErrorEmail constructor
emailError = function(type, message){
  var emailtoSend = new ErrorEmail(
    {
      type: 'PROCESSING',
      subtype: type,
      title: message.title
    },
    {
      message: message.message,
      user: message.user || '',
      date: dateformat('MM/dd/yyyy (h:MM TT)', new Date())
    }
  );
  emailtoSend.sendMail();
}
