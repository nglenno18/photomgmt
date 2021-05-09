var request = require('request');
var {query, getRequestNumber} = require('.././database/connection');
var propertyModel = require('.././model/property.js');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var drive_access = require('.././server/access_drive.js');
var {WFEmail} = require('.././model/email.js');
require('.././utilities/gdriveHandles.js');
require('.././server/imageHandle.js');
var async = require('async');
// require('.././config/config.json')
var responseFunctions = [];
var PROPERTY_TABLE = process.env.PROPERTY_TABLE;
const BIDREPAIRS_TABLE = process.env.BIDREPAIRS_TABLE;
const IMAGE_TABLE = process.env.IMAGE_TABLE;
const USER_TABLE = process.env.USER_TABLE;

var tagModel = require('.././model/taggingModel');

module.exports = ((app, socket)=>{
  var batchUploads = {};
  var subUploads= {};
  var socket = socket;
  console.log('\nAdding APIROUTING.JS to the Application...\n');


  app.get('/json/taglist', function(req, res){
    verifyUser(req.session);
    tagModel.findTagsBy('Tier', 'Property', function(returnedTagList){
      console.log('\n\n\nTagList : ', returnedTagList.length);
      if(returnedTagList.invaliderr) res.status(404).send(returnedTagList);
      res.status(200).send(returnedTagList);
    });
  });
  /*
    Returns a "COUNT" of the Images in Each Property Folder
  */
  app.get('/json/tagdetaillist/:propID', function(req, res){
    verifyUser(req.session);
    var tagColumn = req.query.tagColumn;
    // var tagValue = req.query.tagValue;
    var pID = req.params.propID;
    var iFolder = 'property';
    pID = pID.replace(/!!!!/g,'#');
    tagModel.detailsBy(iFolder, tagColumn, pID, function(returnedTagList){
      console.log('\n\n\nTagList : ', returnedTagList.length);
      if(returnedTagList.invaliderr) res.status(404).send(returnedTagList);
      res.status(200).send(returnedTagList);
    });
  });

  app.get('/table/:propID', function(req, res){
    console.log('\n\n\nPROPERTY ID : ', req.params.propID);

    res.sendFile(path.join(__dirname,'../public/property_table_view.html'));

    // return res.status(200).send(req.params.propID);
  });

  var AsyncLock = require('async-lock');
          // var lock = new AsyncLock();
          var lock = new AsyncLock();

  /*
    Upload image to the google drive
    Create and store the insert statement/clause
  */
  collectBatchUploads = function(req, res){
    console.log('UPLOAD IMAGE PARAM 1: ', req.params.propID,
                                          '\nImage WO: ', req.params.wo,
                                          '\nImage Folder: ', req.params.folder
                                        );

    verifyUser(req.session);

    // console.log('\n\n\nREQUEST : SESSION \n: ', req.session.passport);
    var form = new formidable.IncomingForm();

    console.log('\n\n\nform.maxFieldsSize (before) : ', form.maxFieldsSize);
    form.maxFieldsSize = 16 * 1024 * 1024;
    console.log('form.maxFieldsSize (after) : ', form.maxFieldsSize);
    console.log('\n\n\nform.maxFILEsSize (before) : ', form.maxFileSize);
    form.maxFileSize = 14 * 1024 * 1024;
    console.log('form.maxFILESize (after) : ', form.maxFileSize);


    form.parse(req, function (err, fields, files) {
    console.log('\n\n\n\n---BEGIN GDRIVE UPLOAD-------------------------------begin>\n\n');
          console.log('FIELDS : ', fields);
          // console.log('\n\nFILES : ', files);
          var file = files['files[]'];
          // console.log('\n\n\n\n\n\n\nFILE UPLOAD REQUEST -->\n:::::\n',file);
          if(!file) console.log('\nBLANK FILES REQUEST : ', err);

          try {
            var src = file.path;
            console.log('\n\nBLANK FILES REQUEST ERROR  : ', err);

            console.log('\n\n\n\nFILE SRC : ', src, '\nFILE NAME : ', file.name,
                        '\n\nfolderDestination : ', file.meta,
                        '\n\n\nFOLDER PARAMETERS : \n',
                        file.folderParams);


            var params = req.params;
            params.folderID = fields.folderParams;
            params.contractor = fields.contractor;
            console.log('\n\nuppyID (batchID) -- ', fields.uppyID,'\nfolderID (gDrive) -- ', fields.folderParams);
            var uppyID = fields.uppyID;
            var filename = file.name;

            var fileObj = {
              uppyID,
              meta:fields,
              metalocation:params,
              fileData:src
            }

            resizeFile(file, function(newsrc){
              if(newsrc != file.path && filename.substring(filename.length-4) === '.png') filename = filename.replace('.png', '.jpg');
              // console.log('FILENAME : ', filename, '\n\tEXT : ', filename.substring(filename.length-4));
              getAuthentication((auth)=>{
                drive_access.uploadFile(auth, 'null', newsrc, {fileName: filename, folderID: fileObj.metalocation.folderID}, function(retu){
                  if(!retu) return console.log('ERRORED MESSAGE ', retu);
                  else{
                    retu.filePath = fileObj.fileData;
                    retu.imageName = fileObj.meta.name;
                    retu.propID = fileObj.metalocation.propID;
                    retu.workOrder = fields.wo;
                    retu.contractor = fields.contractor;
                    retu.currentGallery = fields.gal;
                    retu.folder = fields.folder;
                    retu.userEmail = fields.userEmail;
                    retu.activetags = fields.activetags;
                    retu.gDriveData={
                      id: retu.id,
                      name: retu.name,
                      mimetype: retu.mimeType,
                      writersCanShare: retu.writersCanShare
                    }
                    if(!retu.id) return res.status(400).send({file: fileObj, googleID : null, error: 'No Google ID retreived from googleApis.create() method'});

                    delete retu.writersCanShare;
                    delete retu.mimeType;
                    delete retu.name;
                    delete retu.id;

                    var iState = propertyModel.insertImageStatement(retu.propID.replace(/!!!!/g,'#'), retu);
                    res.status(200).send({file: fileObj, googleID: retu.gDriveData.id, insertStatement: iState});
                  }

                  try {
                    console.log('Image Uploaded to GDRIVE : ', newsrc, '\nnow delete from tmp storage!\n-----------------------\n');
                    fs.unlink(file.path, (err)=>{
                      if(err) console.log('DELETING TMP STORAGE UPLOAD ERRR: ', err);
                    });
                    if(newsrc != file.path) fs.unlink(newsrc, (err)=>{
                      console.log('\nDELETED JPEG : ', newsrc, 'err? ', err);
                      if(err) console.log('DELETING TMP STORAGE UPLOAD ERRR: ', err);
                    });
                  } catch (er) {
                    console.log('Failed to remove tempstorage image : ', er);
                  }
                  // console.log('\n\nGDRIVE Upload POST REQUEST callback results : ', retu, '\nINPUT FILE : ', upImg.meta.name, '\nPathName : null','\nfolderID : ', upImg.metalocation.folderID);
                });
              });
            });
          } catch (e) {
            console.log('\n\n\nERROR CAUGHT ON GDRIVE image Upload!\n',e);
            // throw Error(e);
            // IF THE IMAGE RATE IS EXCEEDED , retry
            res.status(400).send({file: fileObj, googleID : null, error: e});
          } finally {
            console.log('\n----------------------------------end GDrive Upload\n\n');
          }
      });
};


  /*
    run ASYNC procedure to upload images from temp storage to google drive
    @param {allpaths} array value of temp storage file paths to user to upload to gDrive
    @param {callback} callback function -- post upload
  */
  batchToGD = function(allpaths, callback, bIndex){
    var successfulImages = [];
    var dbImageArray = [];

    var len =Object.keys(allpaths).length;
    var loops = (len/50);
    if(len%50>0) loops++;
    console.log('Loop through Batch Uploads : ', loops, ' Loops\nFiles:', len);


    (function next(l){
      fpaths = {};
      var f = 0;

      //Collect a new limited number of images, delete from the global object as they are taken
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

      var sectionNum = 0;
      var entryNum = 0;
      var imageNum =0;
      var mNum =1;
      var rNum = 1;
      var batchImages = [];
      var erroredImages = [];

      console.log('\n\nFinished segmenting batch requests : ', sections);
      console.log('\n\n\n\n\nSections : ', sections.length);


      getAuthentication((auth)=>{
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
              drive_access.uploadFile(auth, 'null', upImg.fileData, {fileName: upImg.meta.name, folderID: upImg.metalocation.folderID}, function(retu){
                imageNum++;
                console.log('Request Returned #', rNum, '\n\n Current BIndex: ', Inum);
                if(!retu) erroredImages.push(upImg);
                else if(retu.error) erroredImages.push(upImg);
                else{
                  successfulImages.push(retu);
                  retu.filePath = upImg.fileData;
                  retu.imageName = upImg.meta.name;
                  retu.propID = upImg.metalocation.propID;
                  retu.workOrder = upImg.metalocation.wo;
                  retu.currentGallery = upImg.metalocation.folder;
                  retu.userEmail = upImg.metalocation.userEmail;
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


                  // console.log('Retu : ', retu, ' v. ', upImg);
                  socket.emit('successGD', retu);

                  // socket.emit('successUppy', retu);
                  dbImageArray.push(retu);
                  batchImages.push(retu);


                  rNum ++;
                  Inum = Inum -1;
                }
                if(Inum===0) sectionCallback();

                // console.log('\n\nGDRIVE Upload POST REQUEST callback results : ', retu, '\nINPUT FILE : ', upImg.meta.name, '\nPathName : null','\nfolderID : ', upImg.metalocation.folderID);
              });
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
            propertyModel.addBatchFiles(pID.replace(/!!!!/g,'#'), batchImages, function(returned){
              console.log('\n\n\nReturned from propertymodel.js : ', returned);
              if(l===1) callback(returned);
              // socket.emit('triggerLazyLoading');
            }, true);
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
  }



  console.log('\n\n\nInitialize the API-ROUTING');
  // var pathname = path.join(__dirname, '.././public/temp-storage/');
  pathname = 'fakepath';
  // app.post('/uploadimage/:propID/:wo/:folder', collectBatchUploads);
  app.post('/uploadimage/:propID', collectBatchUploads);



  /*
    Queries for User-Eligible properties
  */
  app.get('/search/properties', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././search/properties');
    verifyUser(req.session);

    var selectStatement = propertyModel.filterByUser({userData, searchText: "", workOrders: null});
    console.log('SELECT search statement : ', selectStatement);
    propertyModel.searchProperties({userData: userData, full:false, select:selectStatement}, function(returnedPlist){
      console.log('returned app.get("/search/properties")!: ');
      res.status(200).send({properties:returnedPlist.properties, userData});
    });
  });

  /*
    Queries for User-SPECIFIC (user-owned) properties
  */
  app.get('/search/myProperties', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././search/myProperties');
    verifyUser(req.session);

    var selectStatement = propertyModel.filterByUser({filter:true, userData, searchText: "", workOrders: null});
    console.log('SELECT search statement : ', selectStatement);
    propertyModel.searchProperties({userData: userData, full:false, select:selectStatement}, function(returnedPlist){
      // returnedPlist.userData = userData;
      res.status(200).send({properties:returnedPlist.properties, userData});
    });
  });


  /*
    Does not account for user, unrestricted, full property query
  */
  app.get('/api/properties', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././api/properties');
    verifyUser(req.session);

    query('SELECT * FROM '+ PROPERTY_TABLE, function(returnedPlist){
      res.status(200).send(returnedPlist);
    });
  });

  app.get('/api/workorders', function(req, res){
    // consider using "verify" middleware method here
    console.log('\n\n\nAPI GET ROUTE .././api/properties');
    var selectWOs = 'SELECT (SELECT Property FROM ' + PROPERTY_TABLE + ' WHERE Property_key = b.Property LIMIT 1) AS Property, ' +
                    'Property as PropertyID, `Loan Number`, `Service Company`, Client, `Asset Manager`, Broker, `Repair Type`, '+
                    '`Permitted Job`, `Work Order`, Contractor, `Date Dispatched`, `Date Received`, `Due Date`, `Original Bid Amount`, `Revised Bid Amount`, ' +
                    '`Submitted Bid to SPOC`, `GC Bill Amount`, `Approved Amount`, `Approved`, `Repair Specialist`, `Final Invoice Amount`, `Amount Invoiced`, `Amount Billed`, ' +
                    '`Proj Start Date`, `Proj Completion Date`, `Phase 3`, `Insurance Checked`, `Lien Waiver Received`, `Photo QC`, `Dispatch Agent1`, `Dispatch Agent2`, `Agent SignOff`, ' +
                    '`Repair Finished`, `Ready for Billing`, `General Liability Exp`, `Workmans Comp`,`GC License`,`Insurance Status`,`Billing Notes`,`Approved Week`, `Approved Month`, '+
                    '`Projected Completion Week`, `Proj Comp Day`, `COA`, `Property Delay`, `UniqueID`, `Status`, `budget` '+
                    ' FROM ' + BIDREPAIRS_TABLE + ' b WHERE COALESCE(`Work Order`)>2 ORDER BY COALESCE(\`Property\`, "") ASC';
    var returnObj = {};
    var returnList = [];
    var groupField = 'Property';

    query(selectWOs, function(returnedPlist, error){
      if(error) console.log('\nError: ', error);
      txtArray = '';
      console.log(returnObj[groupField], '\n\n');
      console.log(groupField, '\n\n');
      if(!returnedPlist) return res.status(200).send('No Results');
      Object.keys(returnedPlist[0]).forEach((propKey)=>{
        if(propKey.toLowerCase().replace(/  /g, '') === groupField.toLowerCase().replace(/  /g, '')) {
          groupField = propKey;
          returnObj[groupField] = {};
          returnList[groupField] = {};
          // break;
        }
      });

      returnedPlist.forEach((row)=>{
        // console.log('row[groupField]: \n', row[groupField]);
        var currentCount = returnObj[groupField][row[groupField]];
        if(!Number(currentCount) || currentCount ===0){
          currentCount = 0
          returnList[groupField][row[groupField]] = {count: currentCount, Repairs: []};
        }
        returnObj[groupField][row[groupField]] = currentCount + 1;
        console.log('groupField : ',groupField, '\n\t', row[groupField]);
        returnList[groupField][row[groupField]].Repairs.push(row);
        returnList[groupField][row[groupField]].count = currentCount + 1;
      });

      // console.log(returnObj, '\n\n');
      console.log(Object.keys(returnList), '\n\n');
      console.log(Object.keys(returnList[groupField]), '\n\n');
      console.log(groupField, '\n\n');

      var returning = {};
      returning[groupField] = returnObj;
      returning.Properties = returnList.Property;
      res.status(200).send(returnList[groupField]);
    });
  });

  propertyPageAPI = function(req, res){
    verifyUser(req.session);
    // console.log(req);
    res.sendFile(path.join(__dirname,'../public/propertyPageAPI.html'));
  }

  // app.get('/propertySearch', ensureAuthenticated, propertyPageAPI);   // Load a page of all existing properties
  // app.get('/', ensureAuthenticated, propertyPageAPI);
  // app.get('/myProperties', ensureAuthenticated, propertyPageAPI);   // Load a page of all the User's Properties



  // propertyUpload = function(req, res){
  //   if(req.location) console.log('\n\n\n\n', req.location, '\n\n\n');
  //   // return;
  //   res.sendFile(path.join(__dirname,'../public/propertyImages.html'));
  // }
  // app.get('/upload/:propID', ensureAuthenticated, propertyUpload);   // Load the upload page of specific property
  app.get('/splitview/:propID', ensureAuthenticated, propertySplitView);   // Retreive upload page with splitview galleries on specific property
  // app.get('/flipping/:propID', ensureAuthenticated, propertyUpload);   // Load a page of all existing properties

  app.get('/api/property/:propID', ensureAuthenticated, function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././api/property/:propID');
    try{
      userData = req.session.passport.user.userData;
    }catch(e){
      console.log('Error User Not Logged In : ', e);
      console.log('return user to Login Page!');
      return res.status(403).send(e);
    }finally{
      if(!userData) return res.status(403).send(e);
      loadProperty({propertyID: req.params.propID, workOrders: true}, userData, function(results, errr){
        console.log('loadProperty result : ', '\nErrr: ', errr);
        if(errr) return res.status(400).send(err);
        return res.status(200).send(results);
      });
    }
  });   // Load the upload page of specific property


  app.get('/api/properties/:propID', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././api/properties');
    query('SELECT * FROM '+ PROPERTY_TABLE + ' WHERE Property_key = \"' + decodeURIComponent(req.params.propID) + '\";' , function(returnedPlist){
      res.status(200).send(returnedPlist);
    });
    // res.status(200).send({jsontest: 'val1'});
  });

  app.get('/api/searchproperties/', function(req, res){
    try{
      userData = req.session.passport.user.userData;
    }catch(e){
      console.log('Error User Not Logged In : ', e);
      console.log('return user to Login Page!');
      return res.status(403).send(e);
    }finally{
      if(!userData) return res.status(403).send(e);
      var searchText = req.query.propertyText;
      var workOrders= req.query.workOrders;
      propertyModel.searchProperties({userData: userData, searchText:searchText.propertyText, workOrders: searchText.workOrders},
          function(ress, errr){
            if(errr) return res.status(400).send(errr);
            console.log('Search Result from DB : ', ress);
            return res.status(200).send(ress);
          });

      loadPhotos({id: req.query.propID, work_order: req.query.work_order, gallery: req.query.gallery}, function(results, errr){
        if(errr) return res.status(400).send(err);
        return res.status(200).send(results);
      });
    }
  });

  app.get('/fetchphotos/:work_order/:gallery', function(req, res){
    console.log('\n\n\nFETCH PHOTOS \nWORK ORDER : ', req.params.work_order, '\nGallery : ', req.params.gallery, '\n\n\nBody Data: ',req.query);
    try{
      userData = req.session.passport.user.userData;
    }catch(e){
      console.log('Error User Not Logged In : ', e);
      console.log('return user to Login Page!');
      return res.status(403).send(e);
    }finally{
      if(!userData) return res.status(403).send(e);
      var gallery = req.query.gallery;
      var folder = req.query.folder;
      var taglist = req.query.taglist;
      if(gallery === 'broker')folder="broker";

      // if()
      loadPhotos({id: req.query.propID, work_order: req.query.work_order, gallery, folder, taglist}, function(results, errr){
        if(errr) return res.status(400).send(err);
        return res.status(200).send(results);
      });
    }
  });



  app.get('/api/propertiesBy/:groupBy', function(req, res){
    console.log('\n\n\nAPI GET ROUTE .././api/propertiesBy/:', req.params.groupBy);
    var groupField = decodeURIComponent(req.params.groupBy);
    var returnObj = {};
    var returnList = {};

    query('SELECT * FROM '+ PROPERTY_TABLE + ' ORDER BY COALESCE(\`' + req.params.groupBy + '\`, "") ASC;', function(returnedPlist, error){
      if(error) console.log('\nError: ', error);
      txtArray = '';
      console.log(returnObj[groupField], '\n\n');
      console.log(groupField, '\n\n');
      if(!returnedPlist) return res.status(200).send('No Results');
      Object.keys(returnedPlist[0]).forEach((propKey)=>{
        if(propKey.toLowerCase().replace(/  /g, '') === groupField.toLowerCase().replace(/  /g, '')) {
          groupField = propKey;
          returnObj[groupField] = {};
          returnList[groupField] = {};
          // break;
        }
      });
      returnedPlist.forEach((row)=>{
        // console.log('row[groupField]: \n', row[groupField]);
        var currentCount = returnObj[groupField][row[groupField]];
        if(!Number(currentCount)){
          currentCount = 0
          returnList[groupField][row[groupField]] = [];
        }
        returnObj[groupField][row[groupField]] = currentCount + 1;
        console.log('groupField : ',groupField, '\n\t', row[groupField]);
        returnList[groupField][row[groupField]].push(row);
      });

      console.log(returnObj, '\n\n');
      console.log(groupField, '\n\n');
      var returning = {};
      returning[groupField] = returnObj;
      returning.Properties = returnList;
      res.status(200).send(JSON.stringify(returning, 2, undefined));
    });
  });



  app.post('/uploadImages/', function(req,res){
    var insertSection = [];
    console.log('\n\n\nAPI GET ROUTE .././uploadImages');
    try{
      userData = req.session.passport.user.userData;
    }catch(e){
      console.log('Error User Not Logged In : ', e);
      console.log('return user to Login Page!');
      return res.status(403).send(e);
    }

    console.log('\n\n\nIMAGEINSERTS ARRAY : : \n\n', req.body);
    // (every 50 inserts)
    var insertArray;
    if(req.body.insertArray)insertArray = req.body.insertArray;
    else return res.status(400).send('No Image Array detected with Request');

    Object.keys(insertArray).forEach((gID, index)=>{
      console.log('\nGoogleID Image to insert #', index,' : ' , gID);
      // if(f < batchLimit){
        insertSection.push(insertArray[gID]);
        // delete insertArray[gID];
      // }
      // f++;
    });
    console.log('-------------------------INSERT DB IMAGES----------------------------');
    console.log('INSERT IMAGESECTION LENGTH : ', insertSection.length);
    var insertImage = 'INSERT INTO ' + IMAGE_TABLE + ' (property, url, description, work_order, folder, FileName, taglist, `Upload Date`, `uploader`) VALUES ';

    var batchLimit = 50;
    var len =Object.keys(insertArray).length;
    var i = 0;
    var actualIndex = 0;
    for(i = 0; i < insertSection.length; i++){
      console.log('Insert image #: ', i);
      insertImage = insertImage + insertSection[i];
      if(insertSection.length-1 != i && (i%batchLimit) != 0 && i!=0){
        insertImage = insertImage + ', ';
      }else if(i===0 && insertSection.length-1 != i){
        insertImage = insertImage + ', ';
      }else {
        insertImage = insertImage + ';';

        query(insertImage, function(reqq, errr){
          console.log('\n\nINSERT IMAGE ARRAY QUERY RETURNED : l=', i, '\n\nERR: ', (errr), '\n\nRETURNRES : ', reqq);
          if(errr){
            console.log('\n\nERR found from insert query : ', errr);
            return res.status(400).send(errr);
          }else{
            actualIndex = actualIndex + reqq.affectedRows;
          }
          console.log('\nInsert Statement Index : ', i, '\nInsertSection length = ', insertSection.length);
          if(insertSection.length <= batchLimit || actualIndex === insertSection.length) return res.status(200).send(reqq);
        });

        insertImage = 'INSERT INTO ' + IMAGE_TABLE + ' (property, url, description, work_order, folder, FileName, taglist, `Upload Date`, `uploader`) VALUES ';
      }
    }
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
});
