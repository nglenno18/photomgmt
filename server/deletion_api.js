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
var bodyparser = require('body-parser')


// var gm = require('imagemagick');
var allClients = [];


module.exports = ((app)=>{
  app.use(bodyparser({}));
  /*
    ROUTE Handler to call a delete() method on gdrive
  */
  app.post('/deleteimages/', function(req, res){
    console.log('\n-- -----------------------------------------------------------');
    console.log('-- DELETE IMAGES FROM LIST');
    console.log('-- -----------------------------------------------------------');
    try{
      userData= req.session.passport.user.userData
    }catch(e){
      console.log('return user to Login Page!');
      return window.location.href = '.././api/logout';
    }
    var body = '';
    // parse list of IDs
    var idList = req.body.googleIDs;
    // feed list of googleID's into batchDelete method
    batchDeleteImages(idList, function(error, returnedResult){
      console.log('\n++++++++++++++++++++++++++++++++++++++++++\nbatchDeleteImages() returned : ', returnedResult, '\nerror = ', error);
      if(error === null || error === undefined) {
        return res.status(200).send({affectedRows: returnedResult});
      }
      console.log('\n++++++++++++++++++++++++++++++++++++++++++\nbatchDeleteImages RETURNED-ERROR : \n', error);
      var status = 500;
      if(error.status) status = error.status;
      return res.status(400).send(error);
    });
  });


  /// -- -----------------------------------------------------
  /*
    ROUTE Handler to delete images
    @param {idList} list of google IDs to use to delete from drive
  */
  batchDeleteImages = function(idList, callback){
      console.log('\n\n\nRequest to delete batch images : ', idList);
      var callbackResults = [];
       propertyModel.removeImages(idList, function(error, dbDeleted){
         console.log('\n\n-----------------------------\nRequest to delete batch images processed, returned : \n', dbDeleted);
         if(error) return callback(error)
         console.log('\n-------------------------------\nNow delete from GDrive');
         callback(null, dbDeleted);
         // callbackResults.push(dbDeleted);
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
               // return callback({error: err.message});
             }else{
               console.log('Successful Batch DELETE from GDrive!');
               section = [];
               sections = [];
               callbackResults.push(successfulImages);
               // callback(callbackResults);
               socket.emit('successBatchDL', callbackResults);
               // return callback(callbackResults);
             }
             sectionNum = 0;
             entryNum = 0;
             imageNum = 0;
           });
         });
       });
  }
});
// -- END MODULE --------------------------------------------------------------
