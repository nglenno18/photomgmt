var request = require('request');
var {query, getRequestNumber} = require('.././database/connection');
var propertyModel = require('.././model/property.js');
var tagModel = require('.././model/taggingModel');

var path = require('path');
var fs = require('fs');
var drive_access = require('.././server/access_drive.js');
var {WFEmail} = require('.././model/email.js');
require('.././utilities/gdriveHandles.js');
require('.././utilities/fileHandles.js');
var async = require('async');
var request_list = {fill: null}
const IMAGE_TABLE = process.env.IMAGE_TABLE;


var imageMagickToggle = process.env.NODE_ENV || "development";
if(imageMagickToggle === "development") imageMagickToggle = false;
else imageMagickToggle === "production";

var gm = require('gm').subClass({imageMagick: imageMagickToggle});
// var gm = require('imagemagick');
var allClients = [];
var getClient = function(){}
var getClients = function(){}


module.exports = ((app, io)=>{
  var io = io;

  /*
    API ROUTE HANDLER --> MOVE BATCH IMAGES
  */
  require('./image_move.js')
  app.post('/editing/move', function(req, res){
    moveRequest(req, res)
  });
    // -- END BATCH DOWNLOAD HANDLER ------------------------------------------



  getClients = function(){
    return allClients;
  }
  getClient = function(clientID){
    clientID = clientID.replace('batchrotate-','').replace('batchdownload-', '').replace('batchid-','').replace('socketid-','');
    var clientLength = getClients().length;
    console.log('fetch client by batchID : ', clientID,'\ncheck against list of client sockets\ncurrentlistLENGTH = ', clientLength);
    if(clientLength === 0) return null;
    var returnClient = null;
    getClients().forEach((cl)=>{
      if(cl.id === clientID){
        returnClient = cl;
        return returnClient;
      }
    });
    return returnClient;
  }

  io.setMaxListeners(0);
  io.on('connection', function(socket) {
    var i = getClients().indexOf(socket);
    if(i === -1) {
      getClients().push(socket);
      console.log('\npushing client ... socket : ', socket.id);
    }
     socket.on('disconnect', function() {
        console.log('Got disconnect!');

        var i = getClients().indexOf(socket);
        if(i > -1) getClients().splice(i, 1);
     });
  });
  /*
    test gm package
  */
  app.get('/editingtest', function(req, res){
    var imageURL = path.join(__dirname,'/ARC_LOGO.png');

    var rotation = gm(imageURL).rotate("green", 90);
    rotation.write(imageURL, function(err){
      console.log('Write PNG IMAGE ! ', err);
    });
    res.status(200).send(imageURL);
  });
  // -- END TEST ROTATION -----------------------------------------------------

  /*
    HEROKU ENV FOLDER STRUCTURE
    Download a batch file
  */
  app.get('/listdownloads/:batchID', function(req, res){
    var dirPath = path.join(__dirname, '../public/downloads');
    console.log('\n\nlistdownloads batchID URL : ', dirPath);
    var batchID = decodeURIComponent(req.params.batchID);

    var dirList = fs.readdirSync(dirPath);
    // var filePath = path.join(dirPath,'/', dirList[0]);
    var filePath = path.join(dirPath,'/', batchID + '.zip');

    var ht = '<div><h2>' + dirPath + '<h2></div>';
      ht = ht + '<br></br>' + '<div><p>' + dirList + '<p></div>';
      ht = ht + '<br></br>' + '<div><p>FIRST FILE : ' + filePath + '<p></div>';
    var bufferStream = fs.readFileSync(filePath);

    res.on('end', function(){
      console.log('\n\n\nFile Successfully uploaded to client, good for delete!');
      removeRequest(batchID);
    });
    res.download(filePath, batchID + '.zip', function(err){
      if(err) return console.log('\n\nERROR Uploading to Client! : ', err);
      console.log('\n\n\nFile Successfully uploaded to client, good for delete!');
      return deleteFile(filePath);
    });
  });
  // -- END BATCH DOWNLOAD ROUTE -----------------------------------------------------


  /*
    ROUTE Handler to list all subdirectories in a directory
  */
  app.get('/listdownloads', function(req, res){
    var dirPath = path.join(__dirname, '../public/downloads');
    console.log('\n\nlistdownloads URL : ', dirPath);
    var folderName = decodeURIComponent(req.params.folderName);

    var dirPath = path.join(dirPath,'/');
    var listFiles = fs.readdirSync(dirPath);
    var firstFile = listFiles[0];
    var firstPath = path.join(dirPath, '/', firstFile);
    console.log('\n\nFIRST PATH : ', firstPath, '\n\nLIST FILES CALLED');

    var allFiles = listAllFiles(dirPath);

    console.log('\n\n\n\nListFiles Returned : ', allFiles, '\n\n\nfolderFy the call...');
    var allFilesLIST = htmlFolderfy(allFiles);

    // listFiles.forEach((listf)=>{
    //   var fileU = path.join(dirPath, '/' + listf);
    //   console.log('\ncall listall files');
    //   var allfiles = listAllFiles(fileU);
    //
    //   console.log('\n\n\nALL FILES FROM DIRECTORY = ', fileU);
    // })

    console.log('\n\n\nALL FILES LIST\n', allFilesLIST);

    var ht = '<div><h2>' + dirPath + '<h2></div>';
      ht = ht + '<br></br>' + '<div><p>' + listFiles + '<p></div>';
      ht = ht + '<br></br>' + '<div><p>FIRST FILE : ' + firstFile + '<p></div>';
      ht = ht + '<br>LIST ALL FILES</br>' + '<div>' + allFilesLIST + '</div>';

    res.send(ht);
  });

  /*
    ROUTE Handler to recursively delete all subdirectories in a directory
  */
  app.get('/deletedownloads', function(req, res){
    var dirPath = path.join(__dirname, '../public/downloads');
    console.log('\n\ndeleteDownloads URL : ', dirPath);
    var folderName = decodeURIComponent(req.params.folderName);

    var dirPath = path.join(dirPath,'/');
    console.log('\n\ndeleteFROM : ', dirPath);
    var listFiles = fs.readdirSync(dirPath);


    // deleteDirectory(dirPath);
    clearDirectory(dirPath);

    res.send('ok');
  });

  /// -- -----------------------------------------------------


  /*
    API ROUTE HANDLER --> ROTATE BATCH IMAGES
                          ROTATE BATCH IMAGES
                          ROTATE BATCH IMAGES
  */
  app.post('/rotate/batch', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././rotate/batch\n\nBATCH ROTATE REQUEST');
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
        console.log("Body: " + body);
        var socket_identification = body.substring(body.indexOf('socket_identification='), body.indexOf('&batch_identification='));
            socket_identification = socket_identification.replace('socket_identification=', '');
            socket_identification = socket_identification.replace('socketid-', '');
        var notification_id = body.substring(body.indexOf('batch_identification='), body.indexOf('&image_list='));
            notification_id = notification_id.replace('batch_identification=', '');
        var imagelisttxt = body.substring(body.indexOf('image_list='));
        var urls = decodeURIComponent(imagelisttxt.replace('image_list=', '')).split(':::,');

        var rotation = body.substring(body.indexOf('rotation_degree='), body.indexOf('socket_identification')-1);
            rotation = rotation.replace('rotation_degree=', '');
            rotation = Number(rotation);
            if(rotation === 'NaN' || rotation < 0) return res.status(500).send({error: 'Invalid Rotation Value', value: rotation})

        var urlObjs = [];
        urls.forEach((url)=>{
          console.log('\nURL:\n', url);      // log SEVERELY impacts process time on large batches+
          if(url.indexOf('https') === 0 || url.indexOf('/media/') >-1) urlObjs.push({id: parseGoogleID(url), url:url, rotation:rotation});
        });


        var rqu = {batchID: notification_id, socket_identification, index:1, rotation, res};
        console.log('\nAdd REquest : ', rqu.batchID, ' index : ', rqu.index);
        console.log('URLs LIST : ', urlObjs[0]);

        // return res.status(200).send({send: 'value'});

        addRequest(rqu);
        console.log('Request Added : ', getRequestList()[notification_id].batchID);

        batchRotate({notification_id, socket_identification, urls:urlObjs, rotation}, completeRequest);
        // return;
      });
    });
    // -- END BATCH ROTATION HANDLER ------------------------------------------
    // -- END BATCH ROTATION HANDLER ------------------------------------------
    // -- END BATCH ROTATION HANDLER ------------------------------------------


    /*
      Rotate IMG gDrive
    */
    rotateImage = function(imageID, rotation, callback){
      if(rotation % 90 > 0 || rotation < 0) {
        return callback({error:'Invalid Rotation Degree', message: 'Image Rotation is limited to 90 degree adjustments.\nCannot rotate image by ' + rotation + ' degrees!', status: 400});
      }
      var imageURL = "https://drive.google.com/uc?export=view&id=" + imageID;
      var brokenGoogleURL = "https://drive.google.com/uc?export=view&id=1KsbkyBVK9Vg8ehgLLrMeo-C8QvVBqjOe";

      gDriveGetData(imageID, {}, function(returned){
        if(!returned) return callback({error: 'No Drive Data was Returned!'});

        console.log('\n\n\nGDrive File Handle returned result : ', returned);
          // RANDOM IMAGE for TESTING (BROKEN)
          var brokenName = '../rotate-0.6146675334234442 - Copy (4).png';
          var brokenName = '../101_2228.jpg';
          var brokenURL = path.join(__dirname, brokenName);

          var fExt = returned.name.substring(returned.name.lastIndexOf('.')+1);
          var endName = '../rotate-' + Math.random() + '.' + fExt;    // should really use the same file extension as og_file
          var endURL = path.join(__dirname, endName);
          console.log('\nGET // IMAGE URL = ', imageURL);

          /*
            TEST -- Corrupt File is requested from GDrive
            (switch the imageURL with the brokenGoogleURL)

            request(brokenGoogleURL).pipe(fs.createWriteStream(endURL)).on('close', function(err, result){
          */
          request(imageURL).pipe(fs.createWriteStream(endURL)).on('close', function(err, result){
            if(!err) {
              console.log('\n\n\nGDrive File written to LOCAL!: ', result);
              testNum++;

              /*
                TEST -- Corrupt File is used to write the image
                (replace endURL with brokenURL to pass in the broken image to gm's writer)

                var rotateIMG = gm(brokenURL).rotate("transparent", rotation);
              */
               var rotateIMG = gm(endURL).rotate("transparent", rotation);
               // Write the new rotation file to the local storage (using gm.write())
                rotateIMG.write(endURL, function(err){
                    if(err) {
                      console.log('Write ROTATION IMAGE ERROR ! ', err);
                      fs.unlink(endURL, function(rest){
                        console.log('\n\nDELETE TMP IMAGE due to ERROR! ', endURL);
                        return callback({error: 'Corrupt Image File (local)! ---  ' + err.message})
                      });
                    }else{                              // UPDATE TO GOOGLE DRIVE
                      console.log('\n\n\n---------------\nIMAGE ROTATED IN LOCAL :: ', rotation);
                      /*
                        ALERT -- if fileData is read from a corrupt file, gDrive will save the corrupt file
                                 (fs.createReadStream(url) --> url must be valid)

                        EXAMPLE:
                                var fileData = fs.createReadStream(brokenURL);
                                var bytesize = fs.statSync(brokenURL)["size"];

                        TEST : Test by changing the localURL to the broken sample file in local
                                var localFileURL = brokenURL;
                      */
                      var localFileURL = endURL;
                      var fileData = fs.createReadStream(localFileURL);
                      var bytesize = fs.statSync(localFileURL)["size"];
                      if(bytesize === 0){
                        console.log('\n\n\n***************************************\nALERT!\n***************************************\nwriterERR\nCORRUPT FILE : ', localFileURL);
                        fs.unlinkSync(endURL)
                        return callback({error: 'Rotation Produced a Corrupt File', message: "A broken file was outputted from the rotateIMG.write(url, callback) function\nURL : " + + localFileURL})
                      }else{
                        var timeStamp = timeStampImage(imageID);
                        console.log('\ndb image timestamped');
                        updateDriveFile(imageID, returned, fileData, function(cbReturned){
                          console.log('\n\nCallback from file update : ', cbReturned);
                          cbReturned.newURL = imageURL + "&time=" + timeStamp;
                          // return res.status(200).send(cbReturned);
                          fs.unlinkSync(endURL);
                          return callback(cbReturned);
                        })
                      }
                    }
                });
              }else{
                console.log('\n\n\n\nGDRIVE FILE CANNOT WRITE TO LOCAL! : ', err);
                // res.status(400).send('Image cannot be rotated!');
                return callback({error:'GDrive Image Cannot be Written to Local Storage', message: err})
              }
          });
      }); // end gDriveGetData()
    }

    /*
      BATCHROTATE()
    */
    batchRotate = function(urlObj, callback){
      var urls = urlObj.urls;
      var notification_id = urlObj.notification_id;
      var socket_identification = urlObj.socket_identification;
      var degree = urlObj.rotation;

      console.log('\n\n\nBATCH ROTATE TRIGGERED!\trotation : ', degree, '\n', urls.length);

      // ASSIGN BATCH ID Number:
      // var batchID = 'batchrotate-' + Math.random();
      var batchID = 'batchrotate-' + notification_id;
      var batchID_DIR = path.join(__dirname, '../public/downloads/', batchID);
      // create batch directory, if not EXISTS

      if(degree%90 > 0 || degree < 0) {
        return callback({error:'Invalid Rotation', message: 'Image Rotation is limited to 90 degree adjustments.\nCannot rotate image by ' + degree + ' degrees!', status: 400}, notification_id, batchID_DIR);
      }

      if(getRequestList()[notification_id]){
        console.log('\n\nnotification_id exists : ', notification_id, '\niscomplete = ', getRequestList()[notification_id].complete);
        if(getRequestList()[notification_id].complete === true) return callback(null, notification_id, batchID_DIR);
        if(getRequestList()[notification_id].index > 1) return;
      }
      if(!fs.existsSync(batchID_DIR)){
        fs.mkdirSync(batchID_DIR);
        console.log('\n\n\nDirectory Extablished : ', batchID_DIR);
      }else{
        console.log('\n\n\n\n\nWHY DOES DIRECTORY ALREADY EXIST????? : ', batchID_DIR);
        // throw Error;
        return ;
      }

        var successfulImages = [];
        var dbImageArray = [];
        // var outL = 50;
        var outL = 10;

        var len = Object.keys(urls).length;
        var loops = (len/outL);
        if(len%outL>0) loops++;
        console.log('Loop through Batch Uploads : ', loops, ' Loops\nFiles:', len);

        var imageNum =0;      // track all images

        getAuthentication((auth)=>{
          (function next(l){
            fpaths = {};
            var f = 0;

            //Collect a new limited number of images, delete from the global object as they are taken
            Object.keys(urls).forEach((key)=>{
              if(f<outL){
                fpaths[key] = urls[key];
                delete urls[key];
              }
              f++;
            });

            var sections = [];
            var section = [];
            console.log('-------------------------BATCH GDRIVE----------------------------');
            // var i = 0;
            var numOf= Object.keys(fpaths).length;
            if(numOf === 0) return callback(null, notification_id, batchID_DIR);

            console.log('\n\nNum of Files' + ' '+ (Object.keys(fpaths).length));
            console.log('\n\nNum of Files Left' + ' '+ (Object.keys(urls).length));


            // Section Off batch calls of ~4 entries (requests)
            Object.keys(fpaths).forEach((urlObj,i)=>{
              if(fpaths[urlObj] != null){
                var url = fpaths[urlObj];
                if((i%2) === 0 && i!=0){
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

            var sectionNum = 0;
            var entryNum = 0;
            var mNum =1;
            var rNum = 1;   // round number
            var batchImages = [];
            var erroredImages = [];

            console.log('\n\nFinished segmenting batch requests : ', sections);
            console.log('\n\nSections : ', sections.length);

            var timeNumber = 1;
              async.eachSeries(sections, function(upImageArray, sectionCallback){
                sectionNum++;
                console.log('\n-------------------------------\nsection : ', sectionNum, '\n\n', upImageArray);
                var Inum = upImageArray.length;
                upImageArray.forEach((upImg, index)=>{
                  entryNum++;
                  console.log('\n--------------\nEntry : ', entryNum);

                  var testdegree = degree;
                  // ///////////////////////////////////
                  // TEST  --  Invalid Rotation Request
                  // if(entryNum === 3) testdegree = 70;

                  rotateImage(upImg.id, testdegree, function(rotateResult){
                    console.log('ROTATED IMAGE COMPLETED ! ', rotateResult);
                    imageNum ++;
                    console.log('\nemitProgress on socket: ', socket_identification, '\nbatchID : ', notification_id);
                    if(rotateResult.error) {
                      // callback(rotateResult, notification_id, batchID_DIR);
                      emitProgress(notification_id, socket_identification, {downloaded: imageNum, outOf:len, upImg, type:'rotate', status:'failed', err:rotateResult.error})
                    }else{
                      emitProgress(notification_id, socket_identification, {downloaded:imageNum, outOf:len, upImg,type:'rotate'})
                    }

                    // TEST ASYNC CALLS WITH TIMER, sends batches of 4
                    setTimeout(function(){
                      console.log('\n\n', new Date());
                        rNum ++;
                        Inum = Inum -1;
                        console.log('\n\n\n\n\nINUM : ', Inum, '\nrNum : ', rNum);
                        if(Inum === 0) sectionCallback();
                    }, 200);
                  })

                });
              }, function(err){
                console.log('\n\n\n************************************************* triggering next().....');
                if(err){
                  console.log('Handle Error that was thrown in Batch', err);
                  return callback({error: 'Error Thrown in Batch Rotation', message: err}, notification_id, batchID_DIR);
                  // throw err;
                }else{
                  console.log('\n\n\n\n\n\n------------------------------------\n',
                  'Successful Batch ROTATION to GDrive!\n\n\nErrored Images : ', erroredImages);
                  section = [];
                  sections = [];
                  if(l === 1){
                    console.log('FINAL ASYNC! ', l);
                    return callback(null, notification_id, batchID_DIR);
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
          })(loops);
      });

      // getAuthentication(auth){
      //   gDriveGetData(urlID, {}, function(returned){
      //   });
      // });
    }

  var testNum = 0;
  /*
    IMAGE ROTATION
    API ROUTE HANDLER --> ROTATE an Image
  */
  app.post('/editing/:googleID', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././editing');
    try{
      userData= req.session.passport.user.userData
    }catch(e){
      // console.log('Error User Not Logged In : ', e);
      console.log('return user to Login Page!');
      return window.location.href = '.././api/logout';
    }

    // console.log('Get image data for req.body : ', req,
    //             '\n\n\nGET image req.url = ', req.url,
    //             '\n\tImage Info/Data : ', req.data);
    var body = '';
    req.on('data', function (data) {
        body += data;
        // console.log("Partial body: " + body);
    });
    req.on('end', function () {
      // console.log("Body: " + body);
      console.log('\n\n\n-------------------\nROTATE Image Request!');

       var rotation = Number(body.substring(body.indexOf('&rotation=') + '&rotation='.length));
       var imageID = body.substring(body.indexOf('googleID%5B%5D=') + 'googleID%5B%5D='.length).replace('&rotation='+rotation, '');
       console.log('\n\n\nImage PARSED Data : ', {
         rotation,
         imageID
       });

       if(rotation < 0) valRot = rotation * -1;
       else valRot = rotation;
       if(valRot % 90 != 0 || rotation === NaN) return res.status(500).send('Invalid rotation angle!');

       return rotateImage(imageID, valRot, function(rotateResult){
         console.log('\n\n\n-------------------\nROTATED IMAGE COMPLETED ! ', rotateResult);
         if(rotateResult.error) {
           return res.status(500).send({error: 'Image cannot be rotated!', message: rotateResult.error});
         }else{
           return res.status(200).send({success: 'Image Rotated!', message: rotateResult});
         }
       })
   }); // end request read
        // WILL NEED TO RETREIVE LIST OF IMAGES IN BATCH-MODE BODY
  });
  // -- END IMAGE ROTATION REQUEST ---------------------------------------------


  timeStampImage = function(imageID){
    var imageURL = "https://drive.google.com/uc?export=view&id=" + imageID;
    var timestamp = new Date().toString().replace(/ /g, '');
    console.log('\nAdd TimeStamp : ', imageID , '\t', timestamp);
    // "UPDATE progress_photos3 SET url = CONCAT(SUBSTRING(url FROM 1 FOR POSITION('1GVar65h09QReq4RCtI5_BNXw92IoOLOP' IN url) + LENGTH('1GVar65h09QReq4RCtI5_BNXw92IoOLOP')),'?time=', NOW()) WHERE url LIKE '%1GVar65h09QReq4RCtI5_BNXw92IoOLOP%' LIMIT 1;"

    var statement = 'UPDATE `' + IMAGE_TABLE + '` SET url = REPLACE(CONCAT(\n' +
                    'SUBSTRING(url FROM 1 FOR POSITION(\"' + imageID + '\" in url)\n\t' +
                    '+ LENGTH(\"' + imageID + '\")),\n\t'+
                    '\"&time=' + timestamp + '\"), \"&&\", \"&\")\n' +
                    'WHERE url LIKE \"%' + imageID + '%\" LIMIT 1;';

    query(statement, (err, res)=>{
      console.log('\nTimestamped URL : \n\terr', err, '\n\t', res);
    });
    return timestamp;
  }

  /*
    API ROUTE HANDLER --> DOWNLOAD BATCH IMAGES
  */
  app.post('/download/batch', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././download/batch\n\nBATCH DOWNLOAD REQUEST');
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
        // console.log("Body: " + body);
        var socket_identification = body.substring(body.indexOf('socket_identification='), body.indexOf('&batch_identification='));
            socket_identification = socket_identification.replace('socket_identification=', '');
            socket_identification = socket_identification.replace('socketid-', '');
        var notification_id = body.substring(body.indexOf('batch_identification='), body.indexOf('&image_list='));
            notification_id = notification_id.replace('batch_identification=', '');
        var imagelisttxt = body.substring(body.indexOf('image_list='));
        var urls = decodeURIComponent(imagelisttxt.replace('image_list=', '')).split(':::,');
        var urlObjs = [];
        urls.forEach((url)=>{
          // console.log('\nURL:\n', url);      // log SEVERELY impacts process time on large batches
          // if(url.indexOf('https') === 0)
          urlObjs.push({id: parseGoogleID(url), url: 'https://drive.google.com/uc?export=view&id=' + parseGoogleID(url)});
        });

        var rqu = {batchID: notification_id, socket_identification, index:1, res};
        console.log('\nAdd REquest : ', rqu.batchId, ' index : ', rqu.index);
        addRequest(rqu);
        console.log('Request Added : ', getRequestList()[notification_id].batchID);

        batchDownload({notification_id, socket_identification, urls:urlObjs}, function(noti_ID, folderDirectory){
          console.log('\nall files downloaded locally, now zip and upload...\nnotification_id: ', noti_ID, '\nfolderDirectory : ', folderDirectory);
          /*
            zipAllFiles() --> array of files to .append()
            zipFolder() --> zips folder using .directory() method
          */
          //check to verify if the folder has been completed and ZIPPED
          var currentZip = getRequestList()[noti_ID];
          if(currentZip.complete === true){
            returnZip(noti_ID, folderDirectory, folderDirectory);
            // removeRequest(noti_ID);
          }else{
            var zipFunction = zipAllFiles;

            var zipped = zipFunction(folderDirectory, function(folderZIP){
              returnZip(noti_ID, folderDirectory, folderZIP);
              // removeRequest(noti_ID);
            });
          }

          // TESTS/EXPERIMENTATION
              // var fileStream = fs.createReadStream(folderDirectory + '.zip');
              // fileStream.pipe(res);
              // res.download(path.join(__dirname, '../public/batchdownload-0.21240057448796956.zip'));
              // res.status(200).download(folderDirectory+'.zip');
              // fs.createReadStream(path.join(__dirname, '../notes.txt')).pipe(res);
              // fs.createReadStream(folderDirectory + '.zip').pipe();
        });
        // return;
      });
    });
    // -- END BATCH DOWNLOAD HANDLER ------------------------------------------

  /*
    direct    : specified directory, if = null, use default
    optName   : operation calling for a download to tmp storage
                ("download", "rotate", etc)
    fileName  : file's name, randomized if null
    dataURL   : url of file to download
  */
  downloadImageLocal = function(direct, optName, fileName, dataURL, callback){
    var endName = '../';
    if(direct) endName = direct + '/';
    if(optName) endName = endName + optName.toLowerCase();
    else endName = endName + 'rotate';
    if(!fileName) fileName = Math.random() + '.png';
    else{
      // check if file exists
      var tstURL = endName + '-' + fileName;                  // applies "download-" prefix
      tstURL = path.join(__dirname, tstURL);
                                                              // IF FILE IS SAME-NAME
      if(fs.existsSync(tstURL)){
        var extension = checkExtension(fileName);             // strip the extension
        fileName = extension.fileName;                        // isolate fileName
        var uniq = Math.random().toString().substring(2,5);   // unique value
        fileName = fileName + '-' + uniq;                     // attach unique to filename
        fileName = fileName + extension.extension;            // re-attach the extension
      }
    }
    endName = endName + '-' + fileName;

    var endURL = path.join(__dirname, endName);
    console.log('\n\n\nDOWNLOAD to LOCAL PATH : ', endURL,'\nFROM URL PATH : ', dataURL);

    // ERROR writing files --> returning downloadImageLocal() too soon, before requestRes is completed!
    var writer = fs.createWriteStream(endURL);
    writer.on('close', function(){
      console.log('\n\n\nEND');
      console.log('GDrive File is Written to LOCAL!', endName, '\n\n\n');
      if(callback) return callback(endName);
    });
    var requestRes = request(dataURL).pipe(writer);
    // throw Error;
    // return endName;
  }


  emitProgress = function(batchID, socket_identification, progressObj){
    console.log('\n\nemitting progress of ' + progressObj.type + '... ', batchID, socket_identification, '\nprogressObj : ', progressObj);
    console.log('\tout of... ' + progressObj.outOf + ' images');
    var emitter = 'download-progress';
    if(progressObj.type === 'rotate') emitter = 'rotate-progress'
    if(progressObj.type === 'move') emitter = 'move-progress'
    progressObj.batch_identification = batchID;
    var sock = getClient(socket_identification);
    if(sock) {
      console.log('\nSocket Matched! : ', sock.id);
      sock.emit(emitter, progressObj);
    }
    // throw Error;
  }

  /*
    BATCHDOWNLOAD()
  */
  batchDownload = function(urlObj, callback){
    var urls = urlObj.urls;
    var notification_id = urlObj.notification_id;
    var socket_identification = urlObj.socket_identification;
    console.log('\n\n\nBATCH DOWNLOAD TRIGGERED!\n', urls.length);

    // ASSIGN BATCH ID Number:
    // var batchID = 'batchdownload-' + Math.random();
    var batchID = 'batchdownload-' + notification_id;
    var batchID_DIR = path.join(__dirname, '../public/downloads/', batchID);
    // create batch directory, if not EXISTS

    if(getRequestList()[notification_id]){
      console.log('\n\nnotification_id exists : ', notification_id, '\niscomplete = ', getRequestList()[notification_id].complete);
      if(getRequestList()[notification_id].complete === true) return callback(notification_id, batchID_DIR);
      if(getRequestList()[notification_id].index > 1) return;
    }
    if(!fs.existsSync(batchID_DIR)){
      fs.mkdirSync(batchID_DIR);
      console.log('\n\n\nDirectory Extablished : ', batchID_DIR);
    }else{
      console.log('\n\n\n\n\nWHY DOES DIRECTORY ALREADY EXIST????? : ', batchID_DIR);
      // throw Error;
      return ;
    }

      var successfulImages = [];
      var dbImageArray = [];
      // var outL = 50;
      var outL = 10;

      var len = Object.keys(urls).length;
      var loops = (len/outL);
      if(len%outL>0) loops++;
      console.log('Loop through Batch Uploads : ', loops, ' Loops\nFiles:', len);

      var imageNum =0;      // track all images

      getAuthentication((auth)=>{
        (function next(l){
          fpaths = {};
          var f = 0;

          //Collect a new limited number of images, delete from the global object as they are taken
          Object.keys(urls).forEach((key)=>{
            if(f<outL){
              fpaths[key] = urls[key];
              delete urls[key];
            }
            f++;
          });

          var sections = [];
          var section = [];
          console.log('-------------------------BATCH GDRIVE----------------------------');
          // var i = 0;
          var numOf= Object.keys(fpaths).length;
          if(numOf === 0) return callback(notification_id, batchID_DIR);

          console.log('\n\nNum of Files' + ' '+ (Object.keys(fpaths).length));
          console.log('\n\nNum of Files Left' + ' '+ (Object.keys(urls).length));


          // Section Off batch calls of ~4 entries (requests)
          Object.keys(fpaths).forEach((urlObj,i)=>{
            if(fpaths[urlObj] != null){
              var url = fpaths[urlObj];
              if((i%2) === 0 && i!=0){
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

          var sectionNum = 0;
          var entryNum = 0;
          var mNum =1;
          var rNum = 1;   // round number
          var batchImages = [];
          var erroredImages = [];

          console.log('\n\nFinished segmenting batch requests : ', sections);
          console.log('\n\nSections : ', sections.length);

          var timeNumber = 1;
            async.eachSeries(sections, function(upImageArray, sectionCallback){
              sectionNum++;
              console.log('\n-------------------------------\nsection : ', sectionNum, '\n\n', upImageArray);
              var Inum = upImageArray.length;
              upImageArray.forEach((upImg, index)=>{
                entryNum++;
                console.log('\n--------------\nEntry : ', entryNum);
                  /*
                    Upload the image to Google Drive
                  */
                  gDriveGetData(upImg.id, {}, function(returned){
                    console.log('\n\ngdrivegetData() returned \n\n\n\n------ ');

                    downloadImageLocal('.././public/downloads/'+ batchID, 'download', returned.name, upImg.url, function(imageLocal){
                      console.log('\n\nIMAGE LOCAL DOWNLOADED : ',
                      imageLocal,
                      '\n-----------------------------------------------------------------------\n\n');

                      //emitProgress, successful download
                      imageNum ++;
                      console.log('\nemitProgress on socket: ', socket_identification, '\nbatchID : ', notification_id);
                      emitProgress(notification_id, socket_identification, {downloaded:imageNum, outOf:len, type:'download'})

                      // TEST ASYNC CALLS WITH TIMER, sends batches of 4
                      setTimeout(function(){
                        console.log('\n\n', new Date());
                          rNum ++;
                          Inum = Inum -1;
                          console.log('\n\n\n\n\nINUM : ', Inum, '\nrNum : ', rNum);
                          if(Inum===0) sectionCallback();
                      }, 0);
                    });

                    // // report tally for this image //
                          //   rNum ++;
                          //   Inum = Inum -1;
                  });
              });
            }, function(err){
              console.log('\n\n\n************************************************* triggering next().....');
              if(err){
                console.log('Handle Error that was thrown in Batch', err);
                throw err;
              }else{
                console.log('\n\n\n\n\n\n------------------------------------\n',
                'Successful Batch Insert to GDrive!\n\n\nErrored Images : ', erroredImages);
                section = [];
                sections = [];
                if(l===1){
                  callback(notification_id, batchID_DIR);
                }
                if(l>1){
                  batchImages = [];
                  dbImageArray = [];
                  next(l-1);
                }
              }
              sectionNum = 0;
              entryNum = 0;
              // imageNum = 0;
            });
        })(loops);
    });

    // getAuthentication(auth){
    //   gDriveGetData(urlID, {}, function(returned){
    //   });
    // });
  }

  returnZip = function(notification_id, folderDirectory, folderZIP){
    console.log('\n\nzipFolder() callback function...');
    console.log('\n\nASYNC ZIP? : ', folderZIP);

    // self destroy listener onto the ZIP file
    var envURL = folderDirectory;

    console.log('\n\n\n--------------------RETURNING res.status(200).send({folderDirectory})');
    var currentRes = getRequestList()[notification_id].res;
    console.log('\n\nRequest Number : ', getRequestList()[notification_id].index);

    // check to make sure this connection is active
    getRequestList()[notification_id].complete = true;
    currentRes.status(200).send({folderDirectory});
    currentRes.on('end', function(){
      console.log('\n\nfinished END sending response to client');
    });
    console.log('\n\n\n-------------------- returned ZIP file path to CLIENTside!');

    // can delete the subdirectory FOLDER (not the ZIP)
    console.log('\n\n\n-------------------------------------- call to delete directory');
    var deleted = deleteDirectory(folderDirectory);
    return console.log('-------------------------------------- returned from deleting directory \n\tdirectory deleted? ' , deleted, '\n\n\n\n\n');
  }


  /*
    Parse a google ID out of a URL string
  */
  parseGoogleID = function(url){
    if(!url) return null;
    var delim = null;
    if(url.indexOf('&id=')>-1) delim = '&id=';
    else if(url.indexOf('/media/')>-1) delim = '/media/';
    var startIndex = url.indexOf(delim) + delim.length;
    var initString = url.substring(startIndex);
    var finalString = initString;
    if(initString.indexOf('&time=') > -1) finalString = initString.substring(0, initString.indexOf('&time='));
    return finalString;
  }
});
// -- END MODULE --------------------------------------------------------------
