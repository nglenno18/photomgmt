var path = require('path');
var fs = require('fs');
var async = require('async');
require('./image_batch.js');
require('.././utilities/gdriveHandles.js');
require('./image_move.js')


operationRequest = function(operation, req, res){
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
      // VALIDATE THE OPERATION + PARAMS
      if(operation === movePhoto){
        var validity = validLocation(loc);
        if(validity) {
          var message = 'Location Parameters are not valid!';
          if(validity.message) message += '\n(' + validity.message +')';
          console.log(message);
          return res.status(500).send({error: message});
        }
      }

      // PARSE THE TARGET IMAGES
      loc.imagelist = loc.imagelist.split(':::');
      console.log('\n\nIMAGE LIST : ', loc.imagelist);
      if(loc.imagelist.length < 1) return res.status(500).send({invaliderr: 'Invalid Request Parameters! \nNo Images were submitted'});

      var rqu = {batchID: loc.batchID, index:1, loc, res};
      console.log('\nAdd REquest : ', rqu.batchID, ' index : ', rqu.index);
      addRequest(rqu);
      submitOperation(loc, movePhoto, completeRequest);
      // return res.status(200).send({result: loc});
      return false;
    });
}




completeRequest = function(err, noti_ID, folderDirectory){
  console.log('\nall files rotated from request...\nerr : ', err, '\nnotification_id: ', noti_ID, '\nfolderDirectory : ', folderDirectory);
  var currentRes = getRequestList()[noti_ID].res;
  console.log('\n\nRequest Number : ', getRequestList()[noti_ID].index);

  // check to make sure this connection is active
  getRequestList()[noti_ID].complete = true;

  try {
    var deleted = deleteDirectory(folderDirectory)
  } catch (e) {
    console.log('\nerror deleting batchrotation temp directory : ', deleted);
  }

  if(err) {
    console.log('\n********************ERROR THROWN DURING batchRotate : ', err);
    var sta = 500;
    if(err.status) sta = err.status
    return currentRes.status(500).send(err);
  }else{
    return currentRes.status(200).send({good: 'Value'});
  }
}

/*
  submitOperation()
    - Uses the param object to configure db/gdrive calls
  @param    {locObject}
  @return   {status}
*/
submitOperation = function(locObject, operation, callback){
  console.log('\nSubmitOPERATION()');
  console.log('\nBATCH ID : ', locObject.batchID);
  var batchDIRNAME = 'batchdownload-' + locObject.batchID;
  var batchDIR = path.join(__dirname, '../public/downloads/', batchDIRNAME);
  var batchID = locObject.batchID;
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
  var dbImages = [];
  var outL = 10;

  var len = locObject.imagelist.length;
  var loops = (len / outL);
  if(len % outL > 0) loops++;
  var imageNum = 0;

  getAuthentication((auth)=>{
    (function next(l){
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
      if(numOf === 0) return callback(null, batchID, batchDIR);


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

      runOperation(l, sections, section, batchID, batchDIR, next, operation, callback);
    })(loops);
  })
  // return callback({})
}


runOperation = function(l, sections, section, batchID, batchDIR, next, operation, callback){
  console.log('\n\nRUN OPERATION : ', batchID);
  var groupNum = 0;
  var subsectionNum = 0;
  var entryNum = 0;
  var successIndex = 0;
  var operationIndex = 0;
  var mNum =1;
  var rNum = 1;   // round number
  var batchImages = [];
  var erroredImages = [];

  var timeNumber = 1;
  async.eachSeries(sections, function(subsections, sectionCallback){
    groupNum++;
    console.log('\nGROUP SECTION : ', groupNum, '\n-----------------------');
    var Inum = subsections.length;
    subsections.forEach(function(entry, subIndex){
      entryNum++;
      console.log('\n\nSection # ', entryNum, '\n\tEntry # : ', entry);
      // performOperationHERE
      operation(entry, function(opResult){
        operationIndex++;
        // if(opResult.error){
        //   console.log('\n\nERRORED MOVE GDRIVE !', opResult)
        //   emitProgress(batchID, socket, {downloaded: operationIndex, outOf:len, upImg:entry, type:'move', status: 'failed', err:opResult.err})
        // }else {
        //   emitProgress(batchID, socket, {downloaded: operationIndex, outOf:len, upImg:entry, type:'move'})
        // }
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
      return callback({error: 'Error Thrown in Batch Rotation', message: err}, 'batchID', batchDIR);
      // throw err;
    }else{
      console.log('\n\n\n\n\n\n------------------------------------\n',
      'Successful Batch OPERATION to GDrive!\n\n\nErrored Images : ', batchID, erroredImages);
      section = [];
      sections = [];
      if(l === 1){
        console.log('FINAL ASYNC! ', l);
        return callback(null, 'batchID', batchDIR);
        // deleteDirectory(batchID_DIR);
      }
      if(l>1){
        console.log('loop again ... : ', l);
        batchImages = [];
        dbImageArray = [];
        next(l-1);
      }
    }
    sectionNum = 0;
    entryNum = 0;
    // imageNum = 0;
  });
}
