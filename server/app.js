const port = process.env.PORT || 3002;
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var app = express();
var path = require('path');
const publicPath = path.join(__dirname, '../public');
var socketIO = require('socket.io');
require('.././utilities/passport_google.js');
var {query, getRequestNumber} = require('.././database/connection');
const directory = './public/temp-storage/';

//start middleware
require('../server/middleware.js');
app.use(removeExpressHeader);
// app.use(bodyParser.json({verify:verify, type: 'application/json'}));
app.use(bodyParser.json({limit: '50mb'}));
// app.use(bodyParser.json({limit: '5MB'}));
// app.use(bodyParser.json({limit:1024102420, type:'application/json'}));
app.use(requireHTTPS); // will require a wrapper method to redirect the client socket requests
// app.use(whitelist);
app.use(function(req, res, next){
  console.log('\n\nFINAL MIDDLEWARE! ', req.url,'\n');
  next();
})
//end middleware

app.use(express.static(publicPath));
//USE MONGO DATASTORE INSTEAD OF cookieSession
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var sessionMiddleware = session({
    secret: process.env.cookieKey,  //cannot be committed, should be configed inside a hidden file + encrypted
    store: new MongoStore({
      url:
      // process.env.MONGODB_URI
        // CNSTR-4981 : mLab is deprecated November 10, need to switch to the Mongo Atlas Cloud
        //    (Original MONGODB_URI variable will automatically be deleted when the Add-on is removed from Heroku)
        process.env.DB_URI
      }),
    resave: false,
    saveUninitialized: false
  });

app.use(sessionMiddleware);

// tell PASSPORT it needs to make use of the cookies to handle authentication
app.use(passport.initialize());
app.use(passport.session());

require('.././routes/auth_routes')(app);
// require('.././server/property_server.js')(app);


require('../utilities/testing.js');
require('../server/routing.js');
app.use(express.static(path.join(__dirname, 'public')));
var server = http.createServer(app);
var io = socketIO(server);

var propertyModel = require('.././model/property');
var userModel = require('.././model/user');
var {gDriveUpload} = require('.././server/access_drive.js');
require('.././utilities/gdriveHandles.js');

//Now Actually IMPLEMENT the IO Middleware to attach the session info to the socket
io.use(function(socket, next){
  console.log('IO FUNCTION : ', socket.id);
  sessionMiddleware(socket.request, {}, next);
});

testEmail = function(request, response){
  var mail = emailError('TEST', {
    type: 'TEST_EMAIL',
    title: 'Testing Email from Script',
    user: 'nglennon@usresconstruction.com'
  });
  console.log('Mail Result...', mail);
  return response.status(200).send('Email Sent!');
}
app.post('/test/email', testEmail);

//REQUEST Number
app.get('/requests', function(req, res){
	res.send(getRequestNumber());
});

verifyUser = function(session){
  try{
    userData= session.passport.user.userData
  }catch(e){
    console.log('Error User Not Logged In : ', e);
    console.log('return user to Login Page!');
    return window.location.href = '.././api/logout';
  }
}

var propertyPageAPI = function(req, res){
  verifyUser(req.session);
  // console.log(req);
  res.sendFile(path.join(__dirname,'../public/propertyPageAPI.html'));
}

app.get('/', ensureAuthenticated, propertyPageAPI);
app.get('/propertySearch', ensureAuthenticated, propertyPageAPI);   // Load a page of all existing properties
app.get('/myProperties', ensureAuthenticated, propertyPageAPI);   // Load a page of all the User's Properties
propertyUpload = function(req, res){
  if(req.location) console.log('\n\n\n\n', req.location, '\n\n\n');
  // return;
  res.sendFile(path.join(__dirname,'../public/propertyImages.html'));
}
app.get('/upload/:propID', ensureAuthenticated, propertyUpload);   // Load the upload page of specific property
//require('../server/apirouting.js')(app);
//require('../server/imageapi.js')(app);

io.on('connection', function(socket){
  var PROPERTY_TABLE = process.env.PROPERTY_TABLE;
  const BIDREPAIRS_TABLE = process.env.BIDREPAIRS_TABLE;
  const IMAGE_TABLE = process.env.IMAGE_TABLE;
  const USER_TABLE = process.env.USER_TABLE;

  require('../server/apirouting.js')(app, socket);
  require('../server/imageapi.js')(app, io);
  require('../server/deletion_api.js')(app);
  require('.././server/workflowapis.js')(app);

  console.log(`\n\nNew User Connected: \n\t(socket.id):${socket.id}`);
  socketid = socket.id;
  var socketUser = socketid;
  var properties = false;
  try{
    socketUser  = socket.request.session.passport.user.userData;
    console.log('Socket.Emit(whoAmI, ', socket.id, '\n', socketUser, ')');
  }catch(e){
    console.log(e);
    console.log('No User Account Connected for this Socket', socket.id);
  }
  socket.emit('whoAmI', {socketUser});

  socket.on('redirect', function(e){
    console.log('redirect', e);
    window.location.href = e;
  });


  socket.on('deleteDBImage', function(imageID, callback){
    console.log('Delete image from database : ', imageID);
    return propertyModel.removeImageFile(imageID, function(dbDelete){
      console.log('Image deleted from DB : ', dbDelete);
      console.log('Now delete the image from the GDrive');
      callback(dbDelete);
    });
  });
  socket.on('deleteGDriveImage', function(imageID, callback){
    console.log('Delete image from database : ', imageID);
    return gDriveDeleteHandle(imageID, function(dbDelete){
      console.log('Image deleted from DB : ', dbDelete);
      console.log('Now delete the image from the GDrive');
      callback(dbDelete);
    });
  });


  socket.on('batchDeleteImages', batchDeleteImages);
  batchDeleteImages = function(idList, callback){
      console.log('\n\n\nRequest to delete batch images : ', idList);
      var callbackResults = [];
       propertyModel.removeImages(idList, function(dbDeleted){
         console.log('Request to delete batch images processed, returned, ', dbDeleted);
         console.log('Now delete from GDrive');
         callback(dbDeleted);
         // callbackResults.push(dbDeleted);
       });

       // Now Delete them from the google drive
       var sections = [];
       var section = [];
       var sectionNum = 0;
       var entryNum = 0;
       var imageNum =0;
       var mNum =1;
       var rNum = 1;
       console.log('\n\n\n\n\nSections : ', idList);
       var successfulImages = [];

       var limit = 4;
       var z = 0;
       idList.forEach((singleID)=>{
         z++;
         if(z < limit) section.push(singleID);
         else{
           sections.push(section);
           section = [singleID];
           z = 0;
         }
       });

       // if(sections.length === 0){
      sections.push(section);
       // }

       console.log('\n\nBatch Delete Google Drive: ', sections);

     getAuthentication((auth)=>{
       async.eachSeries(sections, function(idSection, confirmCallback){
         sectionNum++;
         console.log('\n-------------------------------\nDelete : ', sectionNum, '\n\n',idSection);
         var Inum = idSection.length;
         idSection.forEach((idI, index)=>{
           entryNum++;
           console.log('\n--------------\nEntry : ', entryNum);
           //call gdriveHandles' deleteImages method on each
           gDriveDeleteHandle(idI, function(dbDelete){
             console.log('Image deleted from GD : ', dbDelete);
             console.log('Retu : ', dbDelete, ' v. ', idI);
             if(dbDelete.Error) {
               successfulImages.push({success: false, dbDelete});
             }else{
               successfulImages.push({success: true, dbDelete});
             }
            socket.emit('successIndivDL', dbDelete);
             rNum ++;
             Inum = Inum -1;
             // if(imageNum === Object.keys(fpaths).length-1) urlCallback();
             if(Inum===0) confirmCallback();
           }, auth)
         })
       }, function(err){
         if(err){
           console.log('Handle Error that was thrown in Batch DELETE METHOD', err);
           throw err;
         }else{
           console.log('Successful Batch DELETE from GDrive!');
           section = [];
           sections = [];
           callbackResults.push(successfulImages);
           // callback(callbackResults);
           socket.emit('successBatchDL', callbackResults);
         }
         sectionNum = 0;
         entryNum = 0;
         imageNum = 0;
       });
     });
  }




  /*
    Add Image to Temp storage
  */
  socket.on('addToStorage', function(image, fileName, location, callback){
    var propertyID = location.propertyID;
    var workOrder = location.workOrder;
    var folderID = location.folderID;
    var gallery = location.gallery;
    // console.log('Start function : addToGDRIVE()\n', image.length);
    // console.log('User/Socket\n', socket.request.session.passport.user.userData);
    // console.log('\n\n\nURL => :', location);
    // console.log('\n\n\nURL => :', socket.request.session.passport.user.endpoint);
    var subdir = socket.request.session.passport.user.userData.user_name;
    // subdir = subdir +'/'+socket.request.session.passport.user.userData.user_name;
    console.log('Subdirectory name : ', subdir);
    console.log('fileName name : ', fileName);
    console.log('\n\n\n\n');

    var tempImg = {image, fileName, directory, subdir}
    uploadImageFile(image, fileName, directory, subdir, function(returned){
      console.log('Image saved to temp-storage: ', returned);
		  // addTemp(returned);
		  console.log('emit tempFileLocation to Client incase of error to GDrive: ');
		  location.fileName = fileName;
		  	socket.emit('addTempFile', {filePath:returned, gDriveImg:location});
        callback({filePath: returned, gDriveImg:location});
    });
  });


  socket.on('batchGDrive', function(allpaths, callback){
    var successfulImages = [];
    var dbImageArray = [];

    var len =Object.keys(allpaths).length;
    var loops = (len/50);
    if(len%50>0) loops++;
    console.log('Loop through Batch Uploads : ', loops, ' Loops\nFiles:', len);

    // for(var l = 0; l < loops; l++){
    (function next(l){
      fpaths = {};
      var f = 0;
      Object.keys(allpaths).forEach((key)=>{
        if(f<50){
          fpaths[key] = allpaths[key];
          delete allpaths[key];
        }
        f++;
      });

      var sections = [];
      var section = [];
      console.log('-------------------------BATCH GDRIVE----------------------------');
      // var i = 0;
      var numOf= Object.keys(fpaths).length;
      if(numOf === 0) return callback(dbImageArray);
      console.log('\n\nNum of Files' + ''+ (Object.keys(fpaths).length));

      // return;
      // throw Error;

      Object.keys(fpaths).forEach((urlObj,i)=>{
        if(fpaths[urlObj] != null){
          var url = fpaths[urlObj];
          // console.log('\n\n\n URL #', i, '\n', url, '\nout of ',  Object.keys(fpaths).length);
          var param1 = url.filePath.substring(url.filePath.indexOf('temp-storage/')+'temp-storage/'.length);
          var param3 = url.gDriveImg;
          if((i%4) === 0 && i!=0){
            sections.push(section);
            section = [{param1, returned: url.filePath, param3}];
          }
          else section.push({param1, returned: url.filePath, param3});
          if(i === numOf-1) {
            sections.push(section);
            section = [];
          }
        }
      });
      // sections.push(section);

      // return;

      var sectionNum = 0;
      var entryNum = 0;
      var imageNum =0;
      var mNum =1;
      var rNum = 1;
      var batchImages = [];
      var erroredImages = [];
      console.log('\n\n\n\n\nSections : ', sections.length);

      getAuthentication((auth)=>{
        async.eachSeries(sections, function(urlPartial, urlCallback){
          sectionNum++;
          console.log('\n-------------------------------\nsection : ', sectionNum, '\n\n',urlPartial);
          var Inum = urlPartial.length;
          urlPartial.forEach((url, index)=>{
            entryNum++;
            console.log('\n--------------\nEntry : ', entryNum);
            gDriveUploadHandle(url.param1, url.returned, url.param3, function(retu){
              imageNum++;
              console.log('Request Returned #', rNum, '\n\n Current BIndex: ', Inum);
              if(!retu) erroredImages.push(url);
              else if(retu.error) erroredImages.push(url);
              // if(true) console.log('\n\n\n\nToggled Error 500 Handler off!!!!!\n\n\n\n');
              else{
                successfulImages.push(retu);
                retu.filePath = url.returned;
                retu.imageName = url.param1;
                retu.propID = url.param3.propertyID;
                retu.workOrder = url.param3.workOrder;
                retu.currentGallery = url.param3.gallery;
                retu.gDriveData={
                  id: retu.id,
                  name: retu.name,
                  mimetype: retu.mimeType,
                  writersCanShare: retu.writersCanShare
                }
                delete retu.writersCanShare;
                delete retu.mimeType;
                delete retu.name;
                delete retu.id;


                console.log('Retu : ', retu, ' v. ', url);
                socket.emit('successGD', retu);
                dbImageArray.push(retu);
                batchImages.push(retu);


                rNum ++;
                Inum = Inum -1;
                removeImageFile(retu.filePath, function(removed){
                  console.log('Image File Removed: ', removed);
                  // return callback({returned, imageName:fileName, propID:location.propertyID, gDriveData:cal});
                });
              }
              // if(imageNum === Object.keys(fpaths).length-1) urlCallback();
              if(Inum===0) urlCallback();
            }, auth);
          });
        }, function(err){
          if(err){
            console.log('Handle Error that was thrown in Batch', err);
            throw err;
          }else{
            console.log('Successful Batch Insert to GDrive!\n\n\nErrored Images : ', erroredImages);
            section = [];
            sections = [];
            if(!batchImages[0]) return console.log(batchImages);
            pID = batchImages[0].propID || batchImages[0].PropertyID;
            propertyModel.addBatchFiles(pID, batchImages, function(returned){
              console.log('\n\n\nReturned from propertymodel.js : ');
              // if(l===1) callback(dbImagesArray);
            });
            if(l>1){
              batchImages = [];
              dbImageArray = [];
              next(l-1);
            }
            // callback(successfulImages);
          }
          sectionNum = 0;
          entryNum = 0;
          imageNum = 0;
        });
      });
    })(loops);

  });

  /*
    Add Image to Google Drive, callback might be addtoDB (in most cases)
  */
  	var uplFileCount = 0;

  socket.on('addToGDrive', function(image, fileName, location, callback){
	  var propertyID = location.propertyID;
	  var workOrder = location.workOrder;
	  var folderID = location.folderID;
	  var gallery = location.gallery;
    console.log('Start function : addToGDRIVE()\n', image.length);
    console.log('User/Socket\n', socket.request.session.passport.user.userData);
    console.log('\n\n\nURL => :', location);
    console.log('\n\n\nURL => :', socket.request.session.passport.user.endpoint);
    var subdir = socket.request.session.passport.user.userData.user_name;
    // subdir = subdir +'/'+socket.request.session.passport.user.userData.user_name;
    console.log('Subdirectory name : ', subdir);
    console.log('fileName name : ', fileName);
    console.log('\n\n\n\n');

		uploadImageFile(image, fileName, directory, subdir, function(returned){
		  console.log('Image saved to temp-storage: ', returned);
		  // addTemp(returned);
		  console.log('emit tempFileLocation to Client incase of error to GDrive: ');
		  location.fileName = fileName;
		  	socket.emit('addTempFile', {filePath:returned, gDriveImg:location});
        getAuthentication((auth)=>{
          gDriveUploadHandle(returned.substring(returned.indexOf('temp-storage/')+'temp-storage/'.length), returned, {propertyID, gallery, workOrder, fileName, folderID}, function(cal){
            if(!cal) return callback({imageName:fileName, propID:location.propertyID, gDriveData:null});
            console.log('\n\n\n\n\nReturned from gdriveUploadHandle method: ', cal);
            console.log('Returned result should contain the google id: ', cal.id);

              uplFileCount = uplFileCount+ 1;
              if(uplFileCount > 30) return;

            removeImageFile(returned, function(removed){
              console.log('Image File Removed');
              return callback({returned, imageName:fileName, propID:location.propertyID, gDriveData:cal});
            });
          }, auth);
        });
		});
  });


  socket.on('addDriveTEST', function(image, fileName, location, callback){
	  var returned = './public/temp-storage/Oak Hill/testAM - Copy (2).PNG';
	  	  var propertyID = location.propertyID;
	  var workOrder = location.workOrder;
	  var folderID = location.folderID;
	  var gallery = location.gallery;

	  var times = 1;
	  do{
		 gDriveUploadHandle(returned.substring(returned.indexOf('temp-storage/')+'temp-storage/'.length), returned, {propertyID, gallery, workOrder, fileName, folderID}, function(cal){
			  if(!cal) return callback({imageName:fileName, propID:location.propertyID, gDriveData:null});
			console.log('\n\n\n\n\nReturned from gdriveUploadHandle method: ', cal);
			console.log('Returned result should contain the google id: ', cal.id);

				// uplFileCount = uplFileCount+ 1;
				// if(uplFileCount > 30) return;

			  callback({returned, imageName:fileName, propID:location.propertyID, gDriveData:cal});
		  });
		  times++;
	  }while(times < 50);
  });


  socket.on('storageUpload', function(tempPath, params, callback){
	  // {propertyID, gallery, workOrder, fileName, folderID}
	  console.log('RETRY storageUpload to Google Drive : ', tempPath);
	  	gDriveUploadHandle(tempPath.substring(tempPath.indexOf('temp-storage/')+'temp-storage/'.length), tempPath, params, function(cal){
			  if(!cal) return callback({imageName: params.fileName, propID: params.propertyID, gDriveData:null});
				console.log('\n\n\n\n\nRETRY from gdriveUploadHandle method: ', cal);
				console.log('Returned result should contain the google id: ', cal.id);
				removeImageFile(tempPath, function(removed){
				  console.log('Image File Removed');
				  return callback({tempPath, imageName:params.fileName, propID:params.propertyID, gDriveData:cal});
				});
		});
  });

  socket.on('verifyDestination', function(location, callback){
  	var propertyID = location.propertyID;
  	var workOrder = location.workOrder;
  	var gallery = location.gallery;
  	console.log('QUERY FOR gDrive Folders : ', location, '\n\n');
    var params = {parent: propertyID, chil: workOrder, chil2: gallery};
    if(workOrder === 'Initial Property') params.chil2 = null;
  	getDriveFolders(params, function(created){
  			return callback(created);

  	});
  });

  socket.on('batchToDB', function(imArray, callback){
	 console.log('batchToDB from server-side : ', imArray);
	 var pID = imArray[0].propID || imArray[0].propertyID;
	 // throw Error
  	propertyModel.addBatchFiles(pID, imArray, function(returned){
  		console.log('\n\n\nReturned from propertymodel.js : ');
  		callback(returned);
  	});
  });

  // Data returned from the addToGDrive function in the callback probably ends up as the dataObj of addToDB()
  socket.on('addToDB', function(dataObj, callback){
    console.log('\n\n\nStart function : addToDB()\n', dataObj);
    console.log('User/Socket\n', socket.request.session.passport.user.userData);
    console.log('\n\n\nURL => :', socket.request.url);
    console.log('\n\n\nURL => :', socket.request.session.passport.user.endpoint);
    var subdir = '/'+socket.request.session.passport.user.userData.user_name;
    console.log('Subdirectory name : ', subdir);
    console.log('\n\n\n\n');

    var addParams = {
      propID: dataObj.propID
    }
    // add Params object will add each param to the return image data object
    // gDriveGetData(dataObj.gDriveData.id, addParams, function(imageDATA){
    return addDBFile(dataObj, callback);
    // });

//addDBFile =
      // propertyModel.addImageFile(dataObj.propID, dataObj.gDriveData, function(returnEntry){
      //   console.log('Entry submitted to database: ', returnEntry);
      // })


    // gDriveUploadHandle(subdir, image, null, function(cal){
    //   console.log('\n\n\n\n\nReturned from gdriveUploadHandle method: ', cal);
    //   callback(cal);
    // });
  });

  socket.on('addSessionImage', function(image, imageName, callback){
    console.log('Start function : addSessionImage()\n', image.length);
    console.log('User/Socket\n', socket.request.session.passport.user.userData);
    subdir = socket.request.session.passport.user.userData.user_name;
    try{
      uploadImageFile(image, imageName, directory, subdir, function(imageBack){
        console.log('Image written to file, now add to session : ', imageName);
        socket.request.session.passport.user.userData.gallery.push({name:imageName});
        return callback(imageName);
      });
    } catch (e) {
      console.log(e);
      //user does not have a current gallery or no userData
    }
  });

  socket.on('whoAmI', function(callback){
    callback({socketUser});
  });


  /*
	Property Search Options provides the property and the ID
  */
  socket.on('propertySearchOptions', function(callback){
	  userModel.propertySearhOptions(socket.request.session.passport.user.userData, callback);
  });

  socket.on('searchProperties', function(searchText, callback){
	  console.log('Server Request: search Properties for text content: ', searchText);
	  var userData = '';
	  try{
		  userData= socket.request.session.passport.user.userData
	  }catch(e){
		  console.log('Error User Not Logged In : ', e);
		  console.log('return user to Login Page!');
		  return window.location.href = '.././api/logout';
		}
	  propertyModel.searchProperties({userData: userData, searchText:searchText.propertyText, workOrders: searchText.workOrders}, callback);
  });

socket.on('selectProperty', function(propertyID, callback){
	var userData = '';
	  try{
		  userData= socket.request.session.passport.user.userData
	  }catch(e){
		  console.log('Error User Not Logged In : ', e);
		  console.log('return user to Login Page!');
		  return window.location.href = '.././api/logout';
		}
  userModel.findPropertiesByUser(userData, function(properties){
	 properties = properties.properties;
	 console.log('\nProperties returned :\n\npropID:', propertyID);

	var arrL = properties.length;
	var prev = '';
	var nex = '';
	console.log('Property List Length : ', arrL, '\n\n');
	var thisProp = {};
	properties.forEach((prop, index)=>{
			console.log(prop);
			if(prop.Property_key === propertyID){
				console.log('\n\n\nProperty Match : : \n', prop);
				thisProp = prop;
				if(index < arrL-1){
					 nex = properties[index+1].Property_key;
					 console.log('NEXT : ', nex);
				}
				if(index > 0){
					prev = properties[index-1].Property_key;
					console.log('PREV : ', prev);
				}
				console.log('\n\n\n\nsurrounding Properties: ', prev, nex)
			}

			if(index === arrL -1){
				thisProp.surroundings = {prev, nex};
				return callback(thisProp);
			}
		});
	});
});

  socket.on('loadFile', function(params, callback){
    console.log('\n\nUpload File Request from client to server: ', params);
    var file = params.file;
    var table = params.table;
    var field = params.field;
    if(table === 'property'){

      propertyModel.addPropertyFile(params, function(returnedRes){
        console.log('PropertyFile() returned :\n', returnedRes);
        callback(returnedRes);
      });
    }
  });

  socket.on('myProperties', function(params, callback){
    console.log('Params: ', params);
    var selectProperties = 'SELECT * FROM property WHERE LOWER(`Repair Specialist`) = \"' +
    params.user_name.toLowerCase() + '\"';
    query(selectProperties, function(rows, err){
      console.log('Err: ', err);
      console.log('Rows: ', rows.length);
      var addresses = [];
      rows.forEach((row)=>{
        console.log('Property: ', row.Address, '\n\t', row.repair_specialist);
		row.repair_specialist = row['Repair Specialist'];
		addresses.push(row);
        // addresses.push({property:row.Address, repair_specialist:row.repair_specialist, propertyID: row.Property_key});
      });
      console.log('\n\n\nSocket.EMIT() to loadProperties() : ', socket.id);
      callback({addresses: addresses})
    });
  });

  socket.on('allProperties', function(params, callback){
    console.log('Params: ', params);
    var selectProperties = 'SELECT * FROM property;'
    query(selectProperties, function(rows, err){
      console.log('Err: ', err);
      console.log('Rows: ', rows);
      var addresses = [];
      rows.forEach((row)=>{
        // console.log('Property: ', row.Address, '\n\t', row.repair_specialist);
				addresses.push(row);
        // addresses.push({property:row.Address, repair_specialist:row.repair_specialist, propertyID:row.Property_key});
      });
      console.log('\n\n\nSocket.EMIT() to loadProperties() : ', socket.id);
      callback({addresses: addresses})
    });
  });

  app.get('/myProperties/', ensureAuthenticated, (req, res)=>{
    res.sendFile(path.join(__dirname,'.././public/propertyPageAPI.html'));
  });
  app.get('/myProperties', ensureAuthenticated, (req, res)=>{
    res.sendFile(path.join(__dirname,'../public/propertyPageAPI.html'));
  });
  app.get('/tables/allProperties', ensureAuthenticated, (req, res)=>{
    res.sendFile(path.join(__dirname,'../public/allPropertiesTable.html'));
  });

  getToPropertyPage = function(req, res){
    res.sendFile(path.join(__dirname,'../public/singleProperty.html'));
  }
  getToPropertyDetails = function(req, res){
    res.sendFile(path.join(__dirname,'../public/propertyDetail.html'));
  }
  socket.on('loadProperty', function(propertyID, callback){
	  console.log('Load Property Request to Server: ', propertyID);
    var socketUser = false;
    try{socketUser  = socket.request.session.passport.user.userData;}catch(e){console.log('Error: USER not Defined: ', e);}
    propertyModel.findPropertyByID({propertyID: propertyID.propertyID, workOrders:propertyID.workOrders, userData:socketUser}, function(property){
      console.log('Property Returned from query : ', Object.keys(property).length);
      callback(property);
    });
  });

  loadProperty = function(propertyID, clientUser, callback){
    console.log('\nProperty ID load property : ', propertyID);
    propertyModel.findPropertyByID({propertyID: propertyID.propertyID, workOrders:propertyID.workOrders, userData:clientUser}, function(property){
      console.log('Property Returned from query : ', Object.keys(property).length);
      callback(property);
    });
  }

  app.get('/properties/:propertyID', ensureAuthenticated, getToPropertyPage);   // Load a page for that specific property that displays the data in a simple layout
  app.get('/details/:propertyID', ensureAuthenticated, getToPropertyDetails);   // Load a page for that specific property that displays the data in a simple layout


  socket.on('propertyPhotos', loadPhotos);
});

// Load Photos from the Property -- DB Call
loadPhotos = function(propertyInfo, callback){
	console.log('Request Photos for : ', propertyInfo);
  propertyModel.findImagesByPropertyID(propertyInfo, function(images){
    console.log('Images returned for specified property: ', propertyInfo, '\n\n', images.length);
	// Since the images from our App's DB have a "URL" that is a GDrive filepath, method needs to retreive the imageID and create a url from it
		console.log('Property Info: ', propertyInfo);
		// var workFolderSearch = 'name = \''+propertyInfo.id+'\'and (mimeType = \'application/vnd.google-apps.folder\')';
		var workFolderSearch = 'name contains \''+ '100 Edgewater Dr' +'\'and (mimeType = \'application/vnd.google-apps.folder\')';

		var workFolder = '';

		// gDriveQuery(workFolderSearch, function(parentFolder){
			// console.log('GDrive returned with parent property folder');
			// console.log(parentFolder[0]);
			// workFolder = parentFolder[0].id;
			// var imagesQuery = '\'' + '13Mm82B8tpvSiMxKJ9pNG2tQX98jZPhw9' + '\' in parents';
			// imagesQuery += ' and mimeType = \'application/vnd.google-apps.folder\'';
				// imagesQuery += ' and mimeType = \'image/jpeg\'';
			// gDriveQuery(imagesQuery, function(folderList){
				// console.log('all SUBFOLDERS: ', parentFolder, '\nImageList\n', folderList);
				// folderList.forEach((fol)=>{
					// if(fol.name === propertyInfo.contractor) console.log('CONTRACTOR FOLDER FOUND!!');
				// });
				// getPermissions(folderList[0].id, function(imagePermissions){
					// console.log('imagePermissions : ', imagePermissions)
				// });

			// });
		// });

		// filesInFolders(workFolderSearch, function(returned){
			// console.log('Returned files from folders : ', returned);
		// })


		// var newImgs = retreiveImageURLs(images);
		// console.log('\n\nCLEANED URLS : ', newImgs);

		callback(images);
  });
}

/*
	Method to run through the DB image results and cleanup the URLs
*/
retreiveImageURLs = function(images){
	console.log('images : ', images.images);
	var needURLS = "name in (";
	var max = 10;
	console.log()
	images.images.forEach((img, ind)=>{
		var folder = '1qorXJz1rZ19zeH5-Cc8hcY9_ey5iZgy4';
		if(img.urlString.indexOf('Photos/COMPLETED')===0) folder = '14EfVx0ALh2WHpf0SqdtirA9Re79-XPZC';
		if(img.urlString.indexOf('Photos/') === 0 && ind < max){
			// retrieve the gDriveID for the image (narrow the search using the folder id)
			needURLS += '\''+ img.urlString +'\'';
			if(max-1 != ind) needURLS += ', ';
			else needURLS += ')';
		// throw Error;
		}
	});

	if(needURLS.length < 30) return images;
	getImageIDs(needURLS, null, function(imageDATA){
		console.log('Images Cleaned: URL\t', imageDATA);
		// if(!imageDATA) return;
		// else{
		// img.urlString = "https://drive.google.com/uc?export=view&id=" + imageDATA.id;
		// }
		// throw Error;
	});
	// return images;
}



// Load Photos from the Property -- DB Call
addDBFile = function(dataObj, callback){
  console.log('Add DB File ', dataObj);
  // return;
  propertyModel.addImageFile(dataObj.propID, dataObj, function(returnEntry){
    console.log('Entry added to the Google Drive: ', returnEntry);
    return callback(returnEntry);
  });
}

/*
  FileSaving the IMAGE --------------------------------------------------------
*/
var fs = require('fs');
/*
  Need to DECODE the base64 image in order to save it to the server
*/
uploadImageFile = function(image, imageName, directory, subdir, callback){
  // strip off the data: url prefix to get just the base64-encoded bytes
  // console.log(image);
  if(imageName === 'Property') imageName = 'Property.xlsx';
  var data = '';
  if(image.indexOf('data:image') > -1){
    data = image.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer(data, 'base64');
  }else {
    data = image;
    var buf = new Buffer(data, 'utf8');
    //WRITE THE FILE HERE
  }
  var dirct = directory + subdir;
  try{
    if (!fs.existsSync(dirct)){
      console.log('\n\n\nNO FILE DIRECTORY : ', dirct, '\n\n\n');
        fs.mkdirSync(dirct);
    }
    fs.writeFile(dirct+'/'+imageName, buf,(err)=>{
      if(err){
        console.log('\n\nError Writing File\n', err);
        if(err.message.toLowerCase().indexOf('no such file or')>-1){
          if (!fs.existsSync(imageName)){
              fs.mkdirSync(dirct);
              uploadImageFile(image, imageName, directory, subdir, callback);
          }else{
            console.log(e);
            return false;
          }
        }
      }else{
        callback(dirct+'/'+imageName);
      }
    });
  }catch(e){
    if(e.message.toLowerCase().indexOf('file already exists')>-1){
      console.log(e,'\n\nFILE PREVIOUSLY UPLOADED!');
    }else {
      console.log(e);
    }
  }
}

removeImageFile = function(pathName, callback){
  if(fs.existsSync(pathName)){
    fs.unlink(pathName);
    return callback(pathName);
  }
  return callback(false);
}

clearStorage = function(storageFolder, callback){
  var dirt = directory + '' + storageFolder + '/';
  console.log('Storage to Be Cleared: ', dirt);
  dirt = path.join(__dirname, dirt.substring(dirt.indexOf('temp-storage')));
  console.log(dirt);
  if(fs.existsSync(dirt, function(){})){
    console.log('\n\n\nClear the tmp File subDIRECTORY : ', dirt, '\n\n\n');
      fs.readdirSync(dirt, function(){}).forEach((file)=>{
        console.log('Filename: ', file);
        fs.unlink(dirt+file, function(){});
      });
  }
}
//  END FileSaving the IMAGE END --------------------------------------------------------


var async = require('async');

server.listen(port, function(){
  console.log(`Server is up and running on port: ${port}`);

  app.get('/database', ensureAuthenticated, databaseTest);
  app.get('/gDrive', ensureAuthenticated, gDriveTest);
  app.get('/uploadImages.html', ensureAuthenticated, uploadImagesPage);
});
