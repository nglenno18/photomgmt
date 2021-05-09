var drive_access = require('../server/access_drive.js');
var fs = require('fs');
var json2csv = require('json2csv');
var dateformat = require('date-format');

//HOOK.body FROM APPSHEET WILL NOT INCLUDE PAYLOAD. Payload is the body.
parseHook = function(tablename, hookData, reportType){
  console.log('\n\nParseHook: ', tablename, '\n', hookData.body.length);
  var body = hookData.body;
  var payload = body;

  if(body.Payload) payload = JSON.parse(body.Payload);

  var report;
  try {
    console.log('\n\nTYPE: ', tablename);
    if(tablename.toLowerCase().indexOf('batch') > -1){
      report = new BatchReport(tablename, payload.UserEmail, payload.Data);
    }else{
      report = new IIFReport(tablename, payload.UserEmail, payload.Data);
    }
    // console.log('\n\nREPORT CREATED : ', report);
    if(!report.UserEmail){
      console.log('\n\nUSEREMAIL NOT FOUND!\n');
      return {
        invaliderr: "Conversion not Completed",
        user: payload.UserEmail
      }
    }
    if(typeof(report) === 'error'){
      console.log('ERROR CAUGHT:::', report);
    }
  } catch(e) {
    console.log('ERROR Conversion not Completed\n', e);
    var emptyArray = e.message;
    if(emptyArray.toUpperCase().indexOf("EMPTYARRAY") === -1) emptyArray = "Conversion not Completed";
    throw {
      report: report,
      title: "Empty List Error",
      invaliderr: emptyArray,
      user: payload.UserEmail
    }
  }
  return report;
}

writeFile = function(params, report, callback){
  var id = params.id;
  var type = params.type;
  var useremail = params.user;
  var outputFile = params.headers;
  var outputType = params.outputType;
  fs.writeFile(id, report, function(err, file1){
    if(err) return callback({title: "WriteFile Error", invaliderr: err.message, user:useremail});
    drive_access.insertGDrive(outputType, id, function(file){
      if(file.invaliderr){
         callback({title: "GDrive File Error", invaliderr: file.invaliderr, user:useremail});
      }else{
         callback({title: "Google Drive File Upload", recipient: useremail, reportType:type, success:file});
      }

      console.log('FILE returned ', file);
      fs.unlink(id, function(p1,p2){
        //Callback ERROREMAIL w/ admin flag because only the HOLDER/GDRIVE OWNER
        //should know that the file did not delete off of HEROKU server
        if(p1) return callback({title: "DeleteFile Error", invaliderr:p1, user:useremail, admin:true});
        console.log('File DELETED : ', id);
        //Callback w/ blank useremail because only the HOLDER/GDRIVE OWNER
        //needs to be notified of a HEROKU server file deletion.
        return callback({title: 'File Deleted', recipient: '', reportType:'File Deleted', success:"File Deleted from server" + id});
      });
    });
  });
}


writeBatch = function(params, reports, callback){
  //WRITING THE FILE
  var id = params.id;
  var type = params.type;
  var useremail = params.user;
  var outputFile = params.headers;
  var outputType = params.outputType;
  // console.log('\n\n\nWRITEFILE : ', reports, params.type, outputType);
  reports.forEach(function(report){
    var bill = report.Key;
    var parent = report.dataObj.UniqueID;
    var prop = report.dataObj.Property;
    var type = report.tablename;

    try {
      if(outputType === 'csv'){
        // console.log('RUNNING csvConvert() : ', report.sections);
        iifReport = csvConvert(report.sections);
      }else{
        iifReport = iifConvert(report.sections, outputType, '');
      }
    }catch(e){
      if(e.message.indexOf('of null')){
        return callback({
          title: "Vendor Null Error",
          invaliderr: '\tA bill was submitted through Billing with a missing Vendor Reference\t\n'+
          '\tBill ID : ' + bill + '\t\n'+
          '\tProperty : ' + prop +'\t\n'+
          '\tType : ' + type +'\t\n'+
          '\t' + type + ' ID : ' + parent + '\t\n',
          user:useremail
        });
      }
    }
    outputFile = outputFile + iifReport + '\r\n';
  });
  fs.writeFile(id, outputFile.replace(/undefined/g, ''), function(err, file1){
    if(err) return callback({title: "WriteFile Error", invaliderr: err.message, user:useremail});
    console.log('[' + type.toUpperCase() +'] file saved: \n', file1);
    drive_access.insertGDrive(outputType, id, function(file){
      if(file.invaliderr){
         callback({title: "GDrive File Error", invaliderr: file.invaliderr, user:useremail});
      }else{
         callback({title: "Google Drive File Upload", recipient: useremail, reportType:type, success:file});
      }

      console.log('FILE returned ', file);
      fs.unlink(id, function(p1,p2){
        //Callback ERROREMAIL w/ admin flag because only the HOLDER/GDRIVE OWNER
        //should know that the file did not delete off of HEROKU server
        if(p1) return callback({title: "DeleteFile Error", invaliderr:p1, user:useremail, admin:true});
        console.log('File DELETED : ', id);
        //Callback w/ blank useremail because only the HOLDER/GDRIVE OWNER
        //needs to be notified of a HEROKU server file deletion.
        return callback({title: 'File Deleted', recipient: '', reportType:'File Deleted', success:"File Deleted from server" + id});
      });
    });
  });
}
validType = function(type, callback){
  console.log('REPORT TYPER : ', reportTypes.toString());
  var i = false;
  reportTypes.toString().split(',').forEach(function(t, index){
    console.log(t, type);
    if(t === type.toString()){
      console.log('Repor Type Valid');
        i = true;
        return callback(true);
    }
    if(reportTypes.length-1 === index && i === false){
      console.log('Report Type valid = ', i);
      return callback({invaliderr:"Report Type not Valid \""+ type + "\""});
    }
  });
}
