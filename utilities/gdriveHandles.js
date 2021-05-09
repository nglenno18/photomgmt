// require standard libraries
var path = require('path');
var dateformat = require('date-format');
var fs = require('fs');

var drive_access = require('.././server/access_drive.js');
var {query} = require('../database/connection.js');

gDriveUploadHandle = function(subdir, imageData, params, callback, auth){
  console.log('gDriveUpload Handle initialized : ', subdir);
  var propertyPath = params.workOrder +'/';
  propertyPath += params.gallery + '/' + params.fileName;
  // drive_access.getAuth(function(auth){
    drive_access.uploadFile(auth, imageData, null, {fileName: params.fileName, folderID: params.folderID}, function(result){
      // console.log('uploadFile Result : ', result);
      if(result.error){
        console.log('\n\n\n\n\n\n==---gdriveHandles.js Error caught (gDriveUploadHandle()):\n', result);

        return gDriveUploadHandle(subdir, imageData, params, callback, auth);
        // return callback(result);
      }

      callback(result);
    });
  // });
}

getAuthentication = function(callback){
	drive_access.getAuth(callback);
}

getDriveFolders = function(params, callback){
	console.log('Check/Create folders on GDrive for : ', params);
	var prop = params.parent;
	var wo = params.chil;
	var gallery = params.chil2;
	var rootID = '';
	var fieldsToReturn = 'id, name';

	drive_access.getAuth(function(auth){
		var queryStatement = 'name = \'' + params.parent + '\' and (mimeType = \'application/vnd.google-apps.folder\') and \''+ process.env.ROOT_FOLDER_ID + '\' in parents';
		drive_access.queryFiles(auth, queryStatement, function(resultedFolders){
			console.log('resultedFolders : ', resultedFolders);
			var woMeta = {
				name: wo, mimeType:'application/vnd.google-apps.folder', parents:[process.env.ROOT_FOLDER_ID]
			}

			// if the property Folder does not exists, create it before creating the workOrder folder
			if(resultedFolders.length === 0){
				console.log('\n\n\nresulted Folders not FOUND, create new folders for property: ',prop);
				var metadata = {
					name: prop,
					mimeType: 'application/vnd.google-apps.folder',
					parents: [process.env.ROOT_FOLDER_ID]
				}
				drive_access.addFolder(auth, metadata, 'id, name', function(cbFolderCreate){
					console.log('Created [Property Folder] folder on google Drive: ', cbFolderCreate);
					woMeta.parents = [cbFolderCreate.id];
					drive_access.addFolder(auth, woMeta, 'id, name', function(createdWO){
						console.log('Created WO : FOLDER :', createdWO);
						if(!gallery) return callback(createdWO);
						var galData = {
							name: gallery,
							mimeType:'application/vnd.google-apps.folder',
							parents:[createdWO.id]
						}
						// Now add the gallery folder, if applicable
						drive_access.addFolder(auth, galData, 'id, name', function(createdGallery){
							console.log('Gallery Folder created : ', createdGallery)
							return callback(createdGallery);
						});
					});
				});
			}else{
				rootID = resultedFolders[0].id;
				drive_access.queryFiles(auth, 'name = \''+ params.chil + '\' and (mimeType = \'application/vnd.google-apps.folder\') and \''+ resultedFolders[0].id + '\' in parents', function(woFolders){
					console.log('Check for WO folder in this property! ', woFolders, '\nInsert that WO Folder into : ', resultedFolders[0].id);
					woMeta.parents = [rootID];
					if(woFolders.length === 0){
						console.log('\n\nNO WORK ORDER FOLDER : send meta: ', woMeta);
						drive_access.addFolder(auth, woMeta, 'id, name', function(createdFolder){
							console.log('\nCreated work Order Folder : ', createdFolder);
							//create the gallery folder
							if(!gallery) return callback(createdFolder);
							var galData = {
								name: gallery,
								mimeType:'application/vnd.google-apps.folder',
								parents:[createdFolder.id]
							}
							// Now add the gallery folder, if applicable
							drive_access.addFolder(auth, galData, 'id, name', function(createdGallery){
								console.log('\n\n\n\nGallery Folder created : ', createdGallery)
								return callback(createdGallery);
							});
						});
					}else{
						if(gallery) return gDriveCreateFolder(auth, woFolders[0].id, gallery, callback);
						return callback(woFolders[0]);
					}
				});
			}
		});
	});
}

gDriveCreateFolder = function(auth, parentID, name, callback){
					drive_access.queryFiles(auth, 'name = \''+ name + '\' and (mimeType = \'application/vnd.google-apps.folder\') and \''+ parentID + '\' in parents', function(subFolders){
						console.log('Check for specified SUBfolder in PRoperty! ', subFolders);
						if(subFolders.length === 0){ //create the folder
							var meta = {
								name: name,
								parents: [parentID],
								mimeType: 'application/vnd.google-apps.folder'
							}
							drive_access.addFolder(auth, meta, 'name, id', function(createdFolder){
								console.log('Created SUBfolder Folder : ', createdFolder);

								return callback(createdFolder);
							});
						}else{
							return callback(subFolders[0]);
						}
				});
}

gDriveDeleteHandle = function(id, callback, auth){
  console.log('Remove Image from GDrive : ', id);
  if(auth) drive_access.removeFile(auth, id, callback);
  else {
    drive_access.getAuth(function(auth){
      drive_access.removeFile(auth, id, callback);
    });
  }
}

gDriveGetData = function(fileID, addParams, callback){
  drive_access.getAuth(function(auth){
    // fs.writeFileSync()
    drive_access.getFile(auth, fileID, function(result){
      console.log('\n\nRetrieved File By ID (', fileID,') from GDrive: \n\t', result);
      if(!result) return callback(false);
      if(addParams) result = addParameters(result, addParams);
      console.log('GDRive Image Data to send back to the server for DB Commit:\n', result);
      callback(result);
    });
  });
}

updateDriveFile = function(fileID, dataObj, dataBody, callback){
  drive_access.getAuth(function(auth){
    drive_access.updateFile(auth, fileID, dataObj, dataBody, callback);
  })
}

gDriveQuery = function(statement, callback){
  drive_access.getAuth(function(auth){
    // fs.writeFileSync()
	console.log('Statement Query >: ', statement);
    drive_access.queryFiles(auth, statement, function(result){
      console.log('\n\nRetrieved File By ID (', statement, ') from GDrive: \n\t', result);
      if(!result) return callback(false);
      console.log('GDRive Image Data to send back to the server for DB Commit:\n', result);
      callback(result);
    });
  });
}

filesInFolders = function(statement, callback){
  drive_access.getAuth(function(auth){
    // fs.writeFileSync()
	console.log('Statement Query >: ', statement);
    drive_access.filesFolders(auth, statement, function(result){
      console.log('\n\nRetrieved File By ID (', statement, ') from GDrive: \n\t', result);
      if(!result) return callback(false);
      console.log('GDRive Image Data to send back to the server for DB Commit:\n', result);
      callback(result);
    });
  });
}

getImageIDs = function(filePaths, folder, callback){
  drive_access.getAuth(function(auth){
    // fs.writeFileSync()
	var params = {
		q:"mimeType='image/jpeg' and " + filePaths
	}
	console.log('send params for query to gDrive : ', params);
    drive_access.listFiles(auth, params, function(result){
      console.log('\n\nRetrieved File By ID (', filePath,') from GDrive: \n\t', result);
      if(!result) return callback(false);
      // if(fole) result = addParameters(result, addParams);
      console.log('GDRive Image Data to send back to the server for DB Commit:\n', result);

	  return;
      callback(result);
    });
  });
}

getPermissions = function(fileID, callback){
	  drive_access.getAuth(function(auth){
		return drive_access.queryPermissions(auth, fileID, callback);
	  });
}
addParameters = function(objectA, addObject){
  // console.log('Adding params (', addObject, '\n\tTo OBJECT: ', objectA);
  Object.keys(addObject).forEach((key)=>{
    objectA[key] = addObject[key];
  });
  return objectA;
}
