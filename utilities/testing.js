// require standard libraries
var path = require('path');
var dateformat = require('date-format');
var fs = require('fs');

var drive_access = require('../server/access_drive.js');
var {query} = require('../database/connection.js');


databaseTest = function(request, response){
  query('SELECT * FROM phase;', function(rows, err){
    console.log('ERR:',err);
    console.log('ROWS: ', rows);
    if(err) throw err;
    response.status(200).send(JSON.stringify(rows,2,undefined));
  });
}

gDriveTest = function(request, response){
  drive_access.getAuth(function(auth){
    drive_access.listAllFolders(auth, null, function(result){
      response.status(200).send(JSON.stringify(result, 2, undefined));
    });
  });
}
