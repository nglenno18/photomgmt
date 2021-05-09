
require('.././config/config');
var drive = require('./drive_authentication');
var googleapis = require('googleapis');
var gdMimes = require('.././utilities/gDrive-mimetypes.js');

var ACCOUNT_KEY;
if(process.env['auth_provider_x509_cert_url']){
  ACCOUNT_KEY = process.env;
  process.env['private_key'] = process.env['private_key'].replace(/\\n/g, '\n');
}else{
  ACCOUNT_KEY = './config/service_account_key.json';
}
var ROOT_FOLDER_ID;
// const _SEARCH_FILETYPE = " and ("+
//   "name contains '.csv' or name contains '.pdf' or name contains '.png'" +
//   ")"
const _SEARCH_FILETYPE = " and ("+
  "name contains 'REPORT'" +
  ")"
var client;
var credentials = {};
var folders = [];
var type = 'NAME';


function getAuth(callback){
  drive.readAccountKey(ACCOUNT_KEY, callback);
}

function updateListFile(argumentObj, callback){
  console.log('UPDATE list file triggered : ', argumentObj);
  var argument;
  if(argumentObj.type) type = argumentObj.type;
  if(argumentObj.argument) argument = argumentObj.argument;
  drive.readAccountKey(ACCOUNT_KEY, function(auth){
    console.log('Account Key read and returned ');
      var statement = "(mimeType != 'application/vnd.google-apps.folder') ";
      // statement = specifyFileType(statement);
      var params = {
        auth,
        q: statement,
        pageSize: 1000,
        fields: 'nextPageToken, files(id, name, parents)'
      }

      if(type === 'FULL' || type=== 'PATH'){
        console.log('PATH \nTriggering listExtended() method...');
        listExtended(auth, params, function(extList){
          console.log('listExtended() Method returned: ', extList);
          return callback(extList);
        });
      }else{
        queryLoop(auth, params, function(list){
          console.log('\n\nPage LOOP returned :', list.fileList.length);
          return callback(list.fileList);
        });
      }
  });
};

function updateLocation(auth, fileID, folderID, currentID, callback){
  console.log('UPDATE DRIVE file triggered : \nFILE : ', fileID, '\nFOLDER : ', folderID);
  var service = googleapis.drive('v3');
    // return;
    try{
      service.files.get({
        auth, fileId: fileID, fields: 'id, name, parents'
      }, function(err, file){
        if(err) return callback({error: err});
        if(!file) return callback({error: 'File does not exist\nID: (' + fileID + ')'})
        service.files.update({
          fileId: fileID,
          addParents: [folderID],
          removeParents: file.parents,
          auth: auth,
          fields: 'id, name, mimeType, writersCanShare'
        }, function(err, response){
          console.log('Result of files.UPDATE googleAPi method: ', err, response);
          // if(error includes "no folder found, create folder")
          if(err) return callback({error: err});
          callback(response);
        });
      })
      // service.files.update({
      //   fileId: fileID,
      //   addParents: [folderID],
      //   removeParents: [currentID],
      //   auth: auth,
      //   fields: 'id, name, mimeType, writersCanShare'
      // }, function(err, response){
      //   console.log('Result of files.UPDATE googleAPi method: ', err, response);
      //   // if(error includes "no folder found, create folder")
      //   if(err) return callback({error: err});
      //   callback(response);
      // });
    }catch(e){ // will read when the temp-storage file does not exists
      console.log('\n\nTempStorage File Error : ', e);
      callback({error: e})
      return;
    }
};

function updateFile(auth, fileID, fileObj, dataBody, callback){
  console.log('UPDATE DRIVE file triggered : ', fileID);
  var service = googleapis.drive('v3');

  console.log('Account Key read and returned ');
    if(!dataBody) return false;

    // return;
    try{
      service.files.update({
        fileId: fileID,
        media:{
          mimeType: fileObj.mimeType,
          body: dataBody
        },
        auth: auth,
        fields: 'id, name, mimeType, writersCanShare'
      }, function(err, response){
        console.log('Result of files.UPDATE googleAPi method: ', err, response);
        // if(error includes "no folder found, create folder")
        if(err) return callback({error: err});
        callback(response);
      });
    }catch(e){ // will read when the temp-storage file does not exists
      console.log('\n\nTempStorage File Error : ', e);
      return;
    }
};

function queryFiles(auth, statement, callback){
	var params = {
		auth: auth,
		q: statement
	}
	query(auth, params, callback);
};

function queryPermissions(auth, fileID, callback){
	  var service = googleapis.drive('v3');
	  console.log('queryPermissions: ', '(fileId = \''+ fileID + '\')\n', auth);
  service.files.get({
	fileId: fileID,
	auth,
	fields: 'properties'
  }, function(err, response){
    if (err) {
      console.log('ERROR CAUGHT BY listFiles (findFoler callback function): ' + err);
	  // throw Error;
      return;
    }
    var permissions = response;
	console.log('Permissions: ',permissions);
    callback(permissions, null);
  });
}

function listExtended(auth, params, callback){
  this.folders = [];
  this.fileListExtended = [];
  listAllFolders(auth, params, function(list1){
    list1.forEach((ent)=>{
      this.folders[ent.id]= ent.name;
    })
    queryLoop(auth, params, function(list){
      console.log('\n\nPage LOOP returned :', list.fileList.length);
      list.folders = this.folders;
      list.fileList.forEach((entry)=>{
        var path = this.folders[entry.parents[0]] + '/';
        // if(process.env.NODE_ENV === 'production') path = '.' + path;
        if(entry.parents[1]) path = path + entry.parents[1] + '/';
        path = path + entry.name;
        this.fileListExtended.push({name:path});
        // console.log(entry.parents, ' -- ', entry.name, ' -- ' , path, '\n'+entry.parents[0]);
      });
      callback(this.fileListExtended);
    });
  })
}

function filesFolders(auth, statement, callback){
  var folders = [];
  this.fileListExtended = [];
  var statement = 'name contains \''+ '100 Edgewater Dr' +'\'and (mimeType = \'application/vnd.google-apps.folder\')';

  queryFiles(auth, statement, function(list1){
    list1.forEach((ent)=>{
      folders[ent.id] = ent.name;
    })
    queryLoop(auth, statement, function(list){
      console.log('\n\nPage LOOP returned :', list.fileList.length);
      list.folders = folders;
      list.fileList.forEach((entry)=>{
        var path = folders[entry.parents[0]] + '/';
        // if(process.env.NODE_ENV === 'production') path = '.' + path;
        if(entry.parents[1]) path = path + entry.parents[1] + '/';
        path = path + entry.name;
        this.fileListExtended.push({name:path});
        // console.log(entry.parents, ' -- ', entry.name, ' -- ' , path, '\n'+entry.parents[0]);
      });
      callback(this.fileListExtended);
    });
  })
}


function specifyFileType(st){
    return st + _SEARCH_FILETYPE;
}

function listAllFolders(auth, arg, callback){
  console.log('LISTING ALL FOLDERS');
  var params = {
    auth: auth,
    q: "(mimeType = 'application/vnd.google-apps.folder')"
  }
  query(auth, params, callback);
}

function addFolder(auth, metadata, fields, callback){
	var service = googleapis.drive('v3');
	console.log('Folder to create : ', metadata, fields, auth, '\n');
	service.files.create(
	{
		auth: auth,
		resource: {
			name: metadata.name,
			mimeType: 'application/vnd.google-apps.folder',
			// parents: ['1HHYP2M-S8uhJDShZBUP7YeFE6Lg--Xl5']
			parents: metadata.parents,
			writersCanShare: true
		},
		fields:fields
	},
	function(err, response){
		console.log('Result of FOLDER.create googleAPi method: ', err, response);
		// if(error includes "no folder found, create folder")
		callback(response);
	});
}

// called from GDriveUploadHandle() in gDriveHandles.js
function uploadFile(auth, path, fileData, params, callback){
	console.log('gDrive File upload : ', path, params);
	var fileName = params.fileName;
	var folderID = params.folderID || process.env.ROOT_FOLDER_ID;
  // console.log('uploadFile() method: ', auth, process.env.ROOT_FOLDER_ID, '\n\n');
  var service = googleapis.drive('v3');
  var fs= require('fs');
  var fileExt = fileName.substring(fileName.lastIndexOf('.')+1);

  if(!fileData) fileData = path;
  var mimeT = gdMimes.gdMimes[fileExt.toLowerCase()];
  console.log('File Name : ', fileName);
  console.log('File EXT : ', fileExt);
  console.log('MIMET: ', mimeT);
  var metad = {
    'name': fileName,
    // 'parents': ['1Hvs6MBjZ3PB94uu-wbqgtGzrxkK7C0A6'],
    'parents': [folderID],
    // 'mimeType': 'image/jpeg'
    // 'mimeType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    'mimeType': mimeT
  }
  // return;
  try{
	  service.files.create({
		resource: metad,
		media:{
		  // mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		  mimeType: mimeT,
		  // mimeType: 'image/png',
		  body: fs.createReadStream(fileData)
		},
		auth: auth,
		fields: 'id, name, mimeType, writersCanShare'
	  }, function(err, response){
		console.log('Result of files.create googleAPi method: ', err, response);
		// if(error includes "no folder found, create folder")
    if(err) return callback({error: err});
		callback(response);
	  });
  }catch(e){ // will read when the temp-storage file does not exists
	  console.log('\n\nTempStorage File Error : ', e);
	  return;
  }
}

function uploadDoc(auth, path, fileData, fileName, callback){
  console.log('uploadDOC() method: ', auth, process.env.ROOT_FOLDER_ID, '\n\n');
  var service = googleapis.drive('v3');
  // var fs= require('fs');
  var metad = {
    'name': fileName,
    // 'parents': ['1Hvs6MBjZ3PB94uu-wbqgtGzrxkK7C0A6'],
    'parents': [process.env.ROOT_FOLDER_ID],
    'mimeType': 'image/jpeg'
  }
  service.files.create({
    resource: metad,
    media:{
      mimeType: 'image/png',
      body: filedata
    },
    auth: auth,
    fields: 'id, name, mimeType, writersCanShare'
  }, function(err, response){
    console.log('Result of files.create googleAPi method: ', err, response);
    callback(response);
  });
}

function removeFile(auth, id, callback){
  console.log('\n\n-- access_drive.js --\nremoveFile()\nFileID: ', id);
  var service = googleapis.drive('v3');
  // var emptyContent = new com.google.api.services.drive.model.File();
  // emptyContent.setTrashed(true);
  // service.files.update(id, emptyContent);
  service.files.delete({'fileId':id, auth}, function(results, err){
    console.log('RESULTS : ', results);
    console.log('ERR : ', err);
    if(!results){
      console.log('\n\n\nSuccessful Deletion');
      return callback(id);
    }else if(results.Error){
      console.log('\n\n\nERROR CAUGHT --> ', results);
      return callback(false);
    }else{
      return callback(results);
    }
  });
}

function query(auth, params, callback){
  var service = googleapis.drive('v3');
  service.files.list(params, function(err, response){
    if (err) {
      console.log('ERROR CAUGHT BY listFiles (findFoler callback function): ' + err);
	  // throw Error;
      return;
    }
    var files = response.files;
    if (files.length == 0) console.log('No files found.');
    else console.log('\n\nFiles:');
    callback(files, null);
  })
};

function getFile(auth, params, callback){
  console.log('\n\nGetting File by ID : ', params);
  var pars = {
    auth,
    'fileId':params
  }
  if(typeof(params) === 'object'){
    pars.fileId = params.id;
    pars.fields = params.fields;
  }
  var service = googleapis.drive('v3');
  service.files.get(pars, function(err, response){
    console.log('Retreived google drive file!', '\nerr --> ', err);
    callback(response);
  });
}

function queryLoop(auth, params, callback){
  var fileList = [];
  var filePageCount = 0;
  var fileListObj = {fileList, filePageCount};
  function printProgress(){
    console.log('\nPageCount: ' + fileListObj.filePageCount,
    '\nFile Count : ', fileListObj.fileList.length);
    // console.log(fileListObj.fileList[fileList.length-1]);
    console.log('\n');
    return;
  }
  console.log('\n \nList All FilePages');
  var service = googleapis.drive('v3');
  function getPage(params, callback){
    service.files.list(params, function(err, response){
      if (err) {
        console.log('ERROR CAUGHT BY listFiles (findFoler callback function): ' + err);
		return;
      }
      var files = response.files;
      files.forEach((entry)=>{fileList.push(entry)});
      fileListObj.filePageCount++;
      if (files.length == 0) console.log('No files found.');
      else console.log('Files = ', files.length);
      printProgress();
      if(response.nextPageToken){
        var p = params;
        p.pageToken = response.nextPageToken;
        // console.log('\n\nRESPONSE TOKEN: ', p);
        getPage(p, callback);
      }
      else{
        console.log('\n\nFiles:');
        callback(fileListObj, null);
      }
    });
  }
  getPage(params, callback);
};

function listFiles(auth, arg, callback){
  console.log('Auth : ', auth);
	arg.auth = auth;
  var service = googleapis.drive('v3');
  service.files.list(
  // {
    // auth: auth,
    // q: "(mimeType != 'application/vnd.google-apps.folder')"
  // },
	arg,
  function(err, response){
    if (err) {
      console.log('ERROR CAUGHT BY listFiles (findFoler callback function): ' + err);
	          // throw Error;
      return;
    }
    var files = response.files;
    if (files.length == 0) console.log('No files found.');
    else console.log('\n\nFiles:');
    callback(files, null);
  });
}

module.exports = {updateListFile, listAllFolders, getAuth, uploadFile, updateFile, getFile, removeFile,listFiles,queryFiles, filesFolders,queryPermissions, addFolder, updateLocation}
