var path = require('path');
var fs = require('fs');
var async = require('async');
require('./image_batch.js');
require('.././utilities/gdriveHandles.js');
var {updateLocation, getFile} = require('.././server/access_drive.js');
var propertyModel = require('.././model/property.js');

checkLocation = function(location, callback){
  console.log('checking google drive location...');
  setTimeout(function(){
    var params = {parent: location.property_key, chil: location.work_order, chil2: location.period};
    if(location.folder === 'Initial Property') {
      params.chil = location.folder;
      params.chil2 = null
    }
    getDriveFolders(params, function(created){
        return callback(created);
    });
  }, 000)
}

getCurrentFolder = function(auth, fileID, callback){
  console.log('checking google drive location...');
  setTimeout(function(){
    var fields = 'id, name, parents';

    getFile(auth, {id:fileID, fields}, function(returnedFile){
      console.log('\n\n\nRETURNED FILE : ', returnedFile);
      if(!returnedFile) return callback(null);
      if(returnedFile.parents) return callback(returnedFile.parents[0]);
      // throw Error;
      return callback('');
    });
  }, 000)
}

moveRequest = function(req, res, socket){
  console.log('\n\n\nAPI GET ROUTE .././MOVE/batch\n\nBATCH MOVE REQUEST');
  try{
    userData= req.session.passport.user.userData
  }catch(e){
    console.log('Error User Not Logged In : ', e);
    console.log('return user to Login Page!');
    return window.location.href = '.././api/logout';
  }

  var body = '';
  req.on('data', function (data) {
      body += data;
      // console.log("Partial body: " + data);
  });
  req.on('end', function (){
      console.log("Body: " + JSON.parse(body));
      console.log("JSON ", JSON.stringify(body));
      console.log('property : ', JSON.parse(body).property);

      var loc = JSON.parse(body);
      var validity = validLocation(loc);
      if(validity) {
        var message = 'Location Parameters are not valid!';
        if(validity.message) message += '\n(' + validity.message +')';
        console.log(message);
        return res.status(500).send({error: message});
      }
      loc.imagelist = loc.imagelist.split(':::');
      console.log('\n\nIMAGE LIST : ', loc.imagelist);
      if(loc.imagelist.length < 1) return res.status(500).send({invaliderr: 'Invalid Request Parameters! \nNo Images were submitted'});

      var rqu = {batchID: loc.batchID, socket_identification: loc.socket_identification, index:1, loc, res};
      console.log('\nAdd REquest : ', rqu.batchID, ' index : ', rqu.index);
      addRequest(rqu);

      submitMove(loc, function(err, notiID, folderDirectory){
          completeRequest(err, notiID, folderDirectory)
      });
      // return res.status(200).send({result: loc});
      return false;
    });
}


/*
  submitMove()
    - Uses the param object to configure db/gdrive calls
  @param    {locObject}
  @return   {status}
*/
submitMove = function(locObject, callback){
  console.log('\nSubmit Move()');
  console.log('\nBATCH ID : ', locObject.batchID);
  var batchDIRNAME = 'batchdownload-' + locObject.batchID;
  var batchDIR = path.join(__dirname, '../public/downloads/', batchDIRNAME);
  var batchID = locObject.batchID;
  var destinationID = null;
  var currentID = null;
  var socket_identification = locObject.socket_identification;

  if(getRequestList()[locObject.batchID]){
    console.log('\n\nnotification_id exists : ', locObject.batchID, '\niscomplete = ', getRequestList()[locObject.batchID].complete);
    if(getRequestList()[locObject.batchID].complete === true) return callback(locObject.batchID, batchDIR);
    if(getRequestList()[locObject.batchID].index > 1) return;
  }
  if(!fs.existsSync(batchDIR)){
    fs.mkdirSync(batchDIR);
    console.log('\n\n\nDirectory Extablished : ', batchDIR);
  }else{
    console.log('\n\n\n\n\nWHY DOES DIRECTORY ALREADY EXIST????? : ', batchDIR);
    return ;
  }

  var imageObjs = {};
  var imagelist = locObject.imagelist;
  // convert URL List to object array in order to keep track
  imagelist.forEach(function(image){
    imageObjs[image] = parseGoogleID(image);
  });
  console.log('\n\nCompleted Image Objectify : ', imageObjs);

  // return callback({});

  var successfuls = [];
  var dbImageArray = [];
  var outL = 10;

  var len = locObject.imagelist.length;
  var loops = (len / outL);
  if(len % outL > 0) loops++;
  var imageNum = 0;

  getAuthentication((auth)=>{
    // VERIFY THE NEW LOCATION EVEN EXISTS IN gDrive
    async.waterfall([
      function(locationset){
        checkLocation(locObject, function(idreturn){
          destinationID = idreturn;
          locationset();
        })
      },
      function(gotcurrent){
        getCurrentFolder(auth, imageObjs[Object.keys(imageObjs)[0]], function(idreturn){
          currentID = idreturn;
          gotcurrent();
        })
      },
      function(completeSeries){
        (function next(l){
          console.log('\n\nImages collected for DB : ', dbImageArray);
          // async.parallel()
          async.waterfall([
            function(dbCheck){
              console.log('\n\ndbImageArray() : ', dbImageArray.length);
              if((dbImageArray.length%(outL*2) === 0 || dbImageArray.length < (outL*2)) && dbImageArray.length > 0){
                console.log('\n\n\nSEND IMAGES!');
                // throw Error;

                propertyModel.moveImages(dbImageArray, locObject, function(qRes){
                  dbImageArray = [];
                  if(qRes.error) dbCheck(qRes);
                  else dbCheck();
                });
              }else{
                setTimeout(function(){
                  dbCheck(null)
                }, 2000);
              }
            },
            function(wback){
              fpaths = {};
              var f = 0;

              //Collect a new limited number of images, delete from the global object as they are taken
              Object.keys(imageObjs).forEach((key)=>{
                if(f<outL){
                  fpaths[key] = imageObjs[key];
                  delete imageObjs[key];
                }
                f++;
              });

              var sections = [];
              var section = [];
              console.log('-------------------------BATCH GDRIVE----------------------------');
              var numOf= Object.keys(fpaths).length;
              if(numOf === 0) return wback(null, batchID, batchDIR);

              console.log('\n\nNum of Files' + ' '+ (Object.keys(fpaths).length));
              console.log('\n\nNum of Files Left' + ' '+ (Object.keys(imageObjs)));

              // Section Off batch calls of ~4 entries (requests)
              Object.keys(fpaths).forEach((urlObj,i)=>{
                if(fpaths[urlObj] != null){
                  var url = fpaths[urlObj];
                  if((i%4) === 0 && i!=0){
                    sections.push(section);
                    section = [url];
                  }
                  else section.push(url);
                  if(i === numOf-1) {
                    sections.push(section);
                    section = [];
                  }
                }
              });

              console.log('\n\nNew Section : ', sections);
              var groupNum = 0;
              var subsectionNum = 0;
              var entryNum = 0;
              var successIndex = 0;
              var operationIndex = 0;
              var mNum =1;
              var rNum = 1;   // round number
              var erroredImages = [];
              var dbImages = [];

              var timeNumber = 1;
              async.eachSeries(sections, function(subsections, sectionCallback){
                groupNum++;
                console.log('\nGROUP SECTION : ', groupNum, '\n-----------------------');
                var Inum = subsections.length;
                subsections.forEach(function(entry, subIndex){
                  entryNum++;
                  console.log('\n\nSection # ', entryNum, '\n\tEntry # : ', entry);
                  // performOperationHERE
                  movePhoto(auth, entry, destinationID.id, currentID, function(opResult){
                    operationIndex++;
                    if(opResult.error){
                      console.log('\n\nERRORED MOVE GDRIVE !', opResult)
                      erroredImages.push(entry);
                      emitProgress(batchID, socket_identification, {downloaded: operationIndex, outOf:len, upImg:entry, type:'move', status: 'failed', err:opResult.err})
                    }else {
                     dbImageArray.push(entry);
                     console.log('\n\n\nEMITTING PROGRESS!');
                      emitProgress(batchID, socket_identification, {downloaded: operationIndex, outOf:len, upImg:entry, type:'move'})
                    }
                    setTimeout(function(){
                      console.log('\n\n', new Date());
                        rNum ++;
                        Inum = Inum -1;
                        console.log('\n\nINUM : ', Inum, '\nrNum : ', rNum);
                        if(Inum === 0) sectionCallback();
                    }, 500)
                  })
                });
              },function(err){
                console.log('\n\n\n************************************************* triggering next().....');
                if(err){
                  console.log('Handle Error that was thrown in Batch', err);
                  return wback({error: 'Error Thrown in Batch Rotation', message: err}, batchID, batchDIR);
                  // throw err;
                }else{
                  console.log('\n\n\n\n\n\n------------------------------------\n',
                  'Successful Batch OPERATION to GDrive!\n\n\nErrored Images : ', erroredImages);
                  section = [];
                  sections = [];
                  if(l === 1){
                    console.log('FINAL ASYNC! ', l);
                    return wback(null, batchID, batchDIR);
                    // deleteDirectory(batchID_DIR);
                  }
                  if(l>1){
                    console.log('loop again ... : ', l);
                    // batchImages = [];
                    // dbImages = [];
                    next(l-1, dbImages);
                  }
                }
                sectionNum = 0;
                entryNum = 0;
                // imageNum = 0;
              });
            }
          ], function(err, result){
            console.log('\n\n\nERR/RES : ', err, result);
            return completeSeries(null, batchID, batchDIR);
          })
          // runMoveScript(l, sections, section, batchID, batchDIR, next, function(err, batchname, batchdirectory){
          //   callback(err, batchname, batchdirectory);
          // });
        })(loops);
      }
    ], function(err, resul){
      console.log('\n\nFINISHED SERIES REQUEST : ', err, resul);
      return callback(err, batchID, batchDIR);
    })
  })
  // return callback({})
}



moveDBImages = function(images, params, callback){
  console.log('\n\n\n\n\n\n\n\n\n\nmoveDBImages()...', images);
  setTimeout(function(){
    // return callback({error: 'DB Error'})
    return callback({})
  }, 000)
}

movePhoto = function(auth, imageEntry, folderID, currentID, callback){
  console.log('...moving photo : ', imageEntry);
  updateLocation(auth, imageEntry, folderID, currentID, callback)
}

/*
  validLocation()
  @param  {locObject}
          location object
  @return {valid}
          boolean variable, returns true if : the location rules are not violated
*/
validLocation = function(locObject){
  var invalid = false;
  var message = null;

  if(!locObject.property || locObject.property === "") {
    invalid = true;
    message = 'Property'
  }
  if(invalid === false && (!locObject.property_key || locObject.property_key === "")) {
    invalid = true;
    message = 'Property_KEY'
  }
  if(invalid === false && (!locObject.period || locObject.period === "")) {
    invalid = true;
    message = 'TIME PERIOD'
  }
  if(invalid === false && (!locObject.folder || locObject.folder === "")) {
    invalid = true;
    message = 'FOLDER'
  }

  if(invalid){
    return {invalid, message: 'Required Field is missing: ' + message}
  }

  if(locObject.period.toLowerCase() === 'before'){
    if(locObject.subperiod != '' && locObject.subperiod)
    return {
      invalid:true, message: 'SUB_PERIOD'
    }
  }else{
    if(locObject.subperiod === '' || !locObject.subperiod)
    return {
      invalid:true, message: 'SUB_PERIOD'
    }
  }

  locObject.period = locObject.period.toLowerCase();

  if(locObject.folder.toLowerCase() === 'initial property'){
    message = 'Initial Property Violation';
    if(!invalid && (locObject.contractor && locObject.contractor != '')) invalid = true;
    if(!invalid && (locObject.work_order && locObject.work_order != '')) invalid = true;
    if(!invalid && (locObject.period && locObject.period != 'before')) invalid = true;
    if(!invalid && (locObject.subperiod && locObject.subperiod != '')) invalid = true;
  }else if(locObject.folder.toLowerCase() === 'bids & repairs'){
    message = 'Bids & Repairs Violation';
    if(!invalid && (!locObject.contractor || locObject.contractor === "")) invalid = true;
    if(!invalid && (!locObject.work_order || locObject.work_order === "")) invalid = true;
  }
  if(invalid){
    return {
      invalid:true, message
    }
  }

  return invalid;
}
