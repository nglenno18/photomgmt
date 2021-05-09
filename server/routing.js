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

// downloads the file from the server
downloadFile = function(req, res){
  var file = path.join(__dirname, '../') + '/JSONto';
  switch (req.params.type) {
    case 'iif':
      file = file + 'IIF.iif';
      break;
    case 'txt':
      file = file + 'TXT.txt';
      break;
    case 'csv':
      file = file + 'CSV.csv';
      break;
    default: file = '';
  }
  res.download(file);
}

// call the ErrorEmail constructor
emailError = function(type, message){
  var emailtoSend = new ErrorEmail(
    {
      type: 'PROCESSING',
      subtype: type,
      title: type
    },
    {
      message: message.title + '\n\n\n' + message.message,
      user: message.user || '',
      date: dateformat('MM/dd/yyyy (hh:MM ss)', new Date())
    }
  );
  console.log('emailToSend returned from ErrorMEmail', emailtoSend.mailOptions);
  emailtoSend.sendMail();
  return 'true';
}

// lists all files on the server
listFiles = function(req, res){
  var d = path.join(__dirname, '../');
  fs.readdir(d, function(err, items){
    console.log('\n\nITEMS in SERVER: ', items);

    res.send(items);
  });
}

// deletes specific file from server
deleteFile = function(req, res){
  var file = path.join(__dirname, '../') + 'JSONtoIIF.';
  console.log('DELETE FILE REQUEST: ', req.params.type);
  switch (req.params.type) {
    case 'iif':
      file = file + 'iif';
      break;
    case 'txt':
      file = file + 'txt';
      break;
    case 'csv':
      file = file + 'csv';
      break;
    default: file = '';
  }
  if(file.length < 2) return res.send('Not valid Parameters');

  fs.unlink(file, function(p1,p2){
    if(p1) res.send('File Not Found ' + file);
    console.log('P1 : ', p1);
    console.log('P2 : ', p2);
    res.send('File Deleted' + file);
  });
}


// requesting a report from our "Reporting Tools" function in the arcvmapp
requestReport = function(request, response){
  console.log('\n\nReporting Tools Request ...\n\n');
  var payload = parseForPayload(request);
  var table = parseForTable(payload);
  var tableKey = parseForKey(table);
  var userEmail = parseFor('UserEmail', payload);
  var clientName = parseFor('ClientName', payload);
  var reportType = parseFor('ReportType', payload);

  var param = {
    table,
    tableKey,
    userEmail,
    clientName,
    reportType
  };

  console.log(param);
  return param;
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
