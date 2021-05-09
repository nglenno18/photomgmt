var {query} = require('.././database/connection.js');
var PROPERTY_TABLE = process.env.PROPERTY_TABLE;
const BIDREPAIRS_TABLE = process.env.BIDREPAIRS_TABLE;
const IMAGE_TABLE = process.env.IMAGE_TABLE;

var selectTemplate = 'SELECT * FROM ' + PROPERTY_TABLE + ' p WHERE Property_key = ';
var uuidv4 = require('uuid/v4');
var dateformat = require('date-format');
var moment = require('moment');


module.exports = {

	/*
		query for property + workOrders
		(1-2 Queries)
	*/
  findPropertyByID(params, callback){
	  var propertyID = params.propertyID.replace(/!!!!/g,'#');
    console.log('INITIALIZED FIND : ', propertyID, '\n\nUserData: ', params.userData);
    var selectProperty = selectTemplate + '\"' + propertyID.replace(/!!!!/g,'#') + '\"';
    console.log('\n\nInitialized findPropertyByID()\n', selectProperty);
    var amountField = "Approved Amount";
    var userType = params.userData.user_type;
    if(userType.toLowerCase() === 'contractor') amountField = "GC Bill Amount";
    var userEmail = params.userData.user_email;
    var userProxy = params.userData.proxy;

    query(selectProperty, function(rows, err){
      if(err) return(console.log('\n\n\nERROR selectProperty Query----------------------------------------', err));

      try{
        if(rows[0].Phase){
          rows[0].phaseDate = rows[0]['' + rows[0].Phase + ' Date'];
          if(rows[0].phaseDate === undefined) rows[0].phaseDate = '';
          // else if(rows[0].Phase === "Complete")
          else{
            rows[0].phaseDate = moment(rows[0].phaseDate).format('MM/DD/YYYY');
          }
        }
        if(rows[0]['Last Update']){
          console.log('\n\nLAST UPDATE DATE! ', rows[0]['Last Update']);
          rows[0].lastUpdate = rows[0]['Last Update'];
          if(rows[0].lastUpdate === undefined) rows[0].lastUpdate = '';
          else {
            rows[0].lastUpdate = moment(rows[0].lastUpdate).format('MM/DD/YYYY');
            console.log('\n\nLAST UPDATE DATE! ', rows[0]['Last Update'], 'v, ', rows[0].lastUpdate);
          }
        }
      }catch(ert){
        console.log('\n\n\n-----------------------------------------------------Unable to detect Phase DATE! ', ert);
      }
      try {
        var selectWOs = 'SELECT DISTINCT(`Work Order`) AS work_order, Property AS Property, '+
                        '`Loan Number`, `Repair Type`, `' + amountField + '`, `Approved`, `Date Received` AS Received, Status, ' +
                        '(SELECT Name FROM vendor WHERE User_key = b.Contractor LIMIT 1) AS Contractor FROM ' + BIDREPAIRS_TABLE + ' b '+
                        'WHERE (COALESCE(`Work Order`, "") != "null" AND COALESCE(`Work Order`, "") != "") AND ' +
        'Property = \"'+ params.propertyID.replace(/!!!!/g, "#") + '\" ';
        if(params.userData.user_type === 'Contractor') selectWOs +=  'AND (SELECT Name FROM vendor WHERE User_key = b.Contractor LIMIT 1) = \"' + params.userData.user_name.replace(/'/g, "\'") + '\"';

        // console.log('SELECTED Property FROM DATABASE: ', rows[0]);
        console.log('Property.UniqueID Matched Entry in DB: \n\t', rows[0].Property, ' = ', propertyID);
        rows[0].Property_key = rows[0].Property_key.trim();
        propertyID = propertyID.trim();
        if(rows[0].Property_key.trim() === propertyID.trim().replace(/!!!!/g,'#')){
    			if(params.workOrders){
            console.log('...params require workorders...');
    				query(selectWOs, function(rows2, err){
    					if(err) return console.log('err : error', err);
              console.log('\n\nworkorders exist for this property...');
    					if(rows2[0]){
                rows2[0].Property = rows2[0].Property.trim();
    						if(rows2[0].Property === propertyID.replace(/!!!!/g,'#')){
    							var woContractors = [];
    							rows2.forEach((wo)=>{
                    var approvedDate = wo.Approved;
                    var receivedDate = wo.Received;
                    var amountApproved = wo[amountField];
                    console.log('\nAMOUNT FIELD : ', amountField, '\n\nUNFORMATTED : ', amountApproved);
                    try{
                      if(amountApproved && amountApproved != undefined){
                        amountApproved = amountApproved.replace(/,/g,"");
                        console.log('\nform1: ', amountApproved);
                        amountApproved = amountApproved.replace('$',"");
                        console.log('\nform2: ', amountApproved);
                      }else{
                        approvedAmount = "$0.00";
                      }
                    }catch(etr){
                      console.log('Approved Amount formatting error : ', approvedAmount);
                      approvedAmount = "$0.00";
                    }


                    try {
                      amountApproved = Number(amountApproved).toFixed(2);
                      if(amountApproved.indexOf('.00')>-1) addDecimal = true;
                      // amountApproved = Number(amountApproved).toLocaleString('en-US');

                      amountApproved = Number(amountApproved).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      });
                      console.log('USD : ', amountApproved);
                      // amountApproved = amountApproved.toFixed(2);
                      // if(Number(amountApproved) > 0) amountApproved = "$ " + amountApproved;
                      console.log('Formatted USD : ', amountApproved, '\n\n');

                      //
                      approvedDate = moment(wo.Approved).format('MM/DD/YYYY');
                      receivedDate = moment(wo.Received).format('MM/DD/YYYY');
                      if(approvedDate === 'Invalid Date') approvedDate = wo.Approved;
                      if(receivedDate === 'Invalid Date') receivedDate = wo.Received;
                      console.log('Approved Date Calculated : ', approvedDate);
                    } catch (e) {
                      console.log('\n\n----------------------------------------DATE FORMAT ERROR : ', approvedDate, '\n\t', e);
                    }
    								woContractors.push({
                      work_order:wo.work_order,
                      contractor: wo.Contractor,
                      amountField,
                      amount:amountApproved || "$0.00",
                      "Repair Type":wo['Repair Type'],
                      approved: approvedDate,
                      received: receivedDate,
                      status: wo.Status
                    });
    							});
    							rows[0].workOrders = woContractors;
    						}else{
    							console.log('Caugh Error when retrieving work orders: ', rows2[0]);
    						}
    					}
              rows[0].userType = userType;
              rows[0].userEmail = userEmail;
              rows[0].userProxy = userProxy;
    					return callback(rows[0]);
    				});
    			}else{
            rows[0].userType = userType;
            rows[0].userEmail = userEmail;
            rows[0].userProxy = userProxy;
    				return callback(rows[0]);
    			}
        }else{
          console.log('No row Property_key!  ',rows[0]);
        }
      }catch (e) {
        console.log('Caught Error');
        return callback(e);
      }
    });
  },


  filterByUser(params){
      var search = params.searchText.toLowerCase().replace(/!!!!/g,'#');
      var user_type = false;
      var user_name = false;
      var filter = false;
      try{
        user_type = params.userData.user_type;
        user_name = params.userData.user_name;
        filter = params.filter;
      }catch(e){
        console.log('ERRORED USER not found : ', e);
      }
     var selectStatement = 'SELECT * FROM ' + PROPERTY_TABLE + ' p WHERE (LOWER(Property) '+
               'LIKE \"%' +
               search +'%\"';

     if(search.length === 0) selectStatement = 'SELECT * FROM ' + PROPERTY_TABLE + ' p WHERE (true';

     if( user_type != `Repair Specialist` && user_type != 'Billing' && user_type != "IT" && user_type != "Admin" && user_type != "Management" && user_type != "Vendor Procurement"
          && user_type != 'SC Manager'){
            console.log('\n\n\n\n-----------------------------\n\nContractor? : ', user_type);
       if(user_type === 'Contractor'){
         selectStatement += '' +
                            // ' AND (\'' + user_name + '\'' +
                            ' AND (\"' + user_name.replace(/'/g, "\'") + '\"' +
                            ' IN (SELECT Name FROM vendor WHERE vendor.User_key IN '+
                            '(SELECT Contractor FROM ' + BIDREPAIRS_TABLE + ' b WHERE Property = p.Property_key '+
                            // 'AND COALESCE(bidrepairs.`Work Order`, "")>1'+
                            '))) ';
       }else{
         selectStatement += ' AND (\`' + user_type + '\` = \'' + user_name + '\')';
       }
     }else if((user_type === `Repair Specialist` || user_type === 'Billing' || user_type === "IT"  || user_type === "Admin" || user_type || "Management" || user_type === "Vendor Procurement")
              && filter === true){
       selectStatement += ' AND ((\`' + 'Repair Specialist' + '\` = \'' + user_name + '\')'+
                          ' OR (\`Lead Specialist\` = \'' + user_name + '\'))';
     }
     return selectStatement;
  },


  /*
	Search properties by address or WO#
	(1 query)
  */
  searchProperties(params, callback){
		 console.log('Search Properties: ', params);
     var selectStatement = params.select;
     if(!selectStatement) selectStatement = this.filterByUser(params) + ')';
     else{
         // if(params.workOrders){
     		// 	selectStatement += ' AND (SELECT COUNT(`Work Order`) FROM bidrepairs WHERE bidrepairs.Property = property.Property_key)>0)';
     		// 	selectStatement += ' OR Property_key IN (SELECT Property FROM bidrepairs WHERE bidrepairs.`Work Order` LIKE "%'+ search + '%"';
     		// }

     		if(params.expandSearch){
     				selectStatement += ' OR LOWER(Property_key) ' +
     							'LIKE \"%' +
     							search +'%\"' +
     							' OR LOWER(asset_manager) ' +
     							'LIKE \"%' +
     							search +'%\"' +
     							' OR LOWER(`Loan Number`) ' +
     							'LIKE \"%' +
     							search +'%\"' +
     							' OR LOWER(`Repair Specialist`) ' +
     							'LIKE \"%' +
     							search +'%\";';
     		}else{
     			selectStatement += ');';
     		}
     }



		console.log('\n\n\n QUERY SEARCH : ', selectStatement);

		query(selectStatement, function(rows, err){
	      console.log('Err: ', err);
		  if(err) return err;
	      // console.log('Rows: ', rows);
	      var addresses = [];
	      rows.forEach((row)=>{
	        // console.log('Search Property result: ', row.Address, '\n\t', row.repair_specialist);
          var filterRow = row;
          if(!params.full) filterRow = {property:row.Property, repair_specialist:row['Repair Specialist'], UniqueID:row.Property_key};

	        addresses.push(filterRow);
	      });
	      return callback({properties: addresses})
		});
  },

  /*
	Find Property By user Repair Specialist
	(1 Query)
  */
  findUsersByProperty(userProfile, callback){
    console.log('Find Properties by User: ', userProfile);
    var selectProperties = 'SELECT * FROM ' + PROPERTY_TABLE + ' p WHERE LOWER(`Repair Specialist`) = \"' +
    userProfile.user_name.toLowerCase() + '\"';
    query(selectProperties, function(rows, err){
      console.log('Err: ', err);
      console.log('Rows: ', rows);
      var addresses = [];
      rows.forEach((row)=>{
        // console.log('Property: ', row.Address, '\n\t', row['Repair Specialist']);
        addresses.push({property:row.Property, repair_specialist:row['Repair Specialist'], propertyID:row.Property_key});
      });
      callback({properties: addresses})
    });
  },

  tagStatement(taglist){
    var taglist = taglist.split(':::');
    if(!taglist) return '';
    var taglength = taglist.length;

    var tagtext = '(';
    taglist.forEach((tag, index)=>{
      console.log('\n\n\n\n-0------------------TAG: ', tag);
      tagtext = tagtext + 'LOWER(taglist) LIKE \"%'+ tag.toLowerCase() + '%\"';
      if(index != taglength-1) tagtext = tagtext + ', ';
      else tagtext = tagtext + ')';
    });
    return tagtext;
  },
  /*
	Find all images for a property (optional gallery, optional WO)
	(1 query)
  */
  findImagesByPropertyID(propInfo, callback){
    console.log('Find Properties by User: ', propInfo);
    var selectImages = 'SELECT * FROM ' + IMAGE_TABLE + ' WHERE Property = \"' +
    propInfo.id.replace(/!!!!/g,'#') + '\"';
    if(propInfo.gallery) selectImages += ' AND LOWER(description) = \"' + propInfo.gallery.toLowerCase() + '\"';
    if(propInfo.folder && !propInfo.work_order) selectImages += ' AND LOWER(folder) = \"' + propInfo.folder.toLowerCase() + '\"';
		if(propInfo.work_order) selectImages += ' AND work_order = \"' + propInfo.work_order + '\"';
    if(propInfo.taglist) selectImages += ' AND ' + tagStatement(propInfo.taglist);
	    selectImages += ';';
	    query(selectImages, function(rows, err){
	      console.log('Err: ', err);
	      // console.log('Rows: ', rows);
		  if(err) return console.log('ERROR : ', err);
	      var images = [];
	      rows.forEach((row)=>{
	        // console.log('Image: ', row.description, '\n\t', row.UniqueID, '\n\t', row.propID, '\n\t TAGLIST : ', row.taglist);
  			var urlString = row.url;
        var tags = row.taglist;
        var timestamp = '';
        if(row['Upload Date']) timestamp = dateformat('MM/dd/yyyy', row['Upload Date']);
        if(row.description) row.description = row.description.toLowerCase();
        if(row.folder) row.folder = row.folder.toLowerCase();
	        images.push({
              propID:row.Property,
              FileName:row.FileName,
              timestamp,
              urlString:row.url,
              description: row.description,
              folder: row.folder,
              wo: row.work_order,
              tags
            });
	      });

        console.log('\nLIST IMAGES TO RETURN TO SERVER from propertyModel!: ', images.length);
	      callback({images: images});
	    });
  },


  /*
	Add one image file with a reference to property
	(1 INSERT)
  */
  addImageFile(propertyID, imageObj, callback){
    console.log('Find Properties by User: ', propertyID, imageObj);
    var description = imageObj.currentGallery;
    var insertImage = 'INSERT INTO ' + IMAGE_TABLE + ' (property, url, description, work_order, folder, FileName, taglist, `Upload Date`, `uploader`) VALUES(';
		insertImage = insertImage + this.insertImageStatement(propertyID.replace(/!!!!/g,'#'), imageObj) + ';';
    console.log('INSERT IMAGE : ', insertImage);
    query(insertImage, function(rows,err){
      console.log('Image Insert Return from DB : ', rows, err);
      return callback(rows);
    });
  },

  /*
	Collect entryInfo for multiple files and insert them to the DB
	(1 INSERT)
  */
  addBatchFiles(propertyID, imageArray, callback, returnStatement){
    console.log('Find Properties by User: ', propertyID, imageArray[0]);

    var description = imageArray[0].currentGallery;
	    var insertImage = 'INSERT INTO ' + IMAGE_TABLE + ' (property, url, description, work_order, folder, FileName, taglist, `Upload Date`, `uploader`) VALUES';
	var l = imageArray.length-1;
	imageArray.forEach((imageObj, index)=>{
		insertImage = insertImage + this.insertImageStatement(propertyID.replace(/!!!!/g,'#'), imageObj);
		if(l != index)insertImage = insertImage+ ', ';
		else insertImage = insertImage + ';';
	});
  if(returnStatement) return callback(insertImage);
    query(insertImage, function(rows,err){
      console.log('\n\n\nBATCH Images Insert Return from DB : ', rows, err);
      return callback(rows);
    });
  },

  wraptexts(texttowrap){
    if(texttowrap === "") return 'null' ;
    return '\"' + texttowrap + '\"';
  },

  /*
	Create image entry insert statement segment to be used in a table-insert statement
  */
  insertImageStatement(propertyID, imageObj){
    console.log('\nINSERT IMAGE STATEMENT OBJ : ', imageObj.imageName);
    var timestamp = dateformat('yyyy-MM-dd hh:mm:ss', new Date());
	  var description = imageObj.currentGallery;
    var fName = imageObj.gDriveData.name;
    var folder = imageObj.folder;
    var woItem = imageObj.workOrder;
    var coItem = imageObj.contractor;
    var userE = imageObj.userEmail;
    var taglist = imageObj.activetags;

    if(!folder || folder === 'undefined') folder = null;
    else folder = this.wraptexts(folder);
    if(!woItem || woItem === 'undefined') woItem = null;
    else {
      woItem = this.wraptexts(woItem);
      folder = null;
    }
    if(!coItem || coItem === 'undefined') coItem = null;
    else coItem = this.wraptexts(coItem);
    if(!taglist || taglist === 'undefined') taglist = null;
    else taglist = this.wraptexts(taglist);


    if(fName.length > 225) fName = fName.substring(0, 225);
	  // var insertImage = '(\"' + uuidv4().substring(0,10) + '\", \"' + propertyID + '\", \"';
	  var insertImage = '(\"' + propertyID + '\", \"';
  	if(imageObj.gDriveData.viewWebContent) insertImage= imageObj.gDriveData.viewWebContent;
  	else insertImage += "https://drive.google.com/uc?export=view&id=" + imageObj.gDriveData.id;
  	insertImage += '\", \"' +
  	description + '\",'+
    woItem +
    // ','+coItem +
    ','+folder+','+
    '\"' +
    fName +
    '\",'+
    taglist + ', '+
    '\"' +
    timestamp +
  	'\", \"'+ userE + '\")';

    // return insertImage.replace(/undefined/g, 'NULL');
    return insertImage;
  	console.log('INSERT IMAGE : ', insertImage);
  },

  /*
	Remove one image file
	(1 DELETE)
  */
  removeImageFile(imageID, callback){
    console.log('\n\n--property.js --\nremoveImageFile()', imageID);
    var removeStatement = 'DELETE FROM ' + IMAGE_TABLE + ' WHERE Property = \"' + imageID.replace(/!!!!/g,'#') + '\" LIMIT 1;';
    if(!imageID) return;
  	if(imageID.length>20) removeStatement= 'DELETE FROM ' + IMAGE_TABLE + ' WHERE url LIKE \"%' + imageID + '%\" LIMIT 1;';
      query(removeStatement, (rows,err)=>{
        if(err) console.log('Error : ', err);
        else{
          console.log('Successfully removed ', imageID, ' from the DB');
        }
        callback(rows);
     });
  },

  /*
  	DELETE Images from the DB that contain an ID in the imageIDs array
  	(BATCH DELETE)
  */
  removeImages(imageIDs, callback){
    console.log('\n\n--property.js --\nremoveImages()', imageIDs);
    var removeStatement = 'DELETE FROM ' + IMAGE_TABLE + ' WHERE ';
    if(imageIDs.length === 0) return callback({error: 'ImageIDs Not Specified', status: 404});
  	imageIDs.forEach((im, index)=>{
  		if(im.length>20) removeStatement += 'url LIKE \"%' + im + '%\" OR ';
  		removeStatement += '(url = \"' + im + '\")';
  		if(index != imageIDs.length-1) removeStatement += ' OR ';
  		else{
  			var indy = index+1;
  			removeStatement += ' LIMIT ' + indy + ';';
  		}
  	});

    query(removeStatement, (rows,err)=>{
      if(err) {
        console.log('Error Removing Images from DB : ', err);
        return callback({error: 'Database Error', message: err.message})
      }else{
        console.log('\n--------\nSuccessfully removed ', imageIDs, ' from the DB\n--------\n');
        return callback(null, rows.affectedRows);
      }
    });
  },


  moveImages(images, params, callback){
    console.log('\n\n\n\n\n\n\n\n\n\nmoveDBImages()...', images);

    var paramStatement = 'UPDATE ' + IMAGE_TABLE + ' SET \n\t'
                       + 'folder = ' + this.wraptexts(params.folder) + ',\n\t'
                       + 'description = ' + this.wraptexts(params.period) + ',\n\t'
                       + 'property = ' + this.wraptexts(params.property_key) + ',\n\t'
                       + 'work_order = ' + this.wraptexts(params.work_order) + ',\n\t'
                       + 'contractor = ' + this.wraptexts(params.contractor) + ',\n\t'
                       + 'taglist = ' + this.wraptexts(params.subperiod).toLowerCase() + '';
    console.log('\n\nparam statement : ', paramStatement);
    var listStatement = [];
    images.forEach(function(id, ind){
      // if(id.length > 5)
      listStatement.push('\nurl LIKE \"%' + id + '%\"')
    })
    listStatement = listStatement.join('\tOR\t');

    console.log('\n\nLIST statement : ', listStatement);
    var fullstatement = paramStatement + '\nWHERE\n' + listStatement;
    console.log('\n\nFULLSTATEMENT : \n', fullstatement);
    // throw Error;
    query(fullstatement, (rows,err)=>{
      if(err) {
        console.log('Error MOVING Images from DB : ', err);
        return callback({error: 'Database Error', message: err.message})
      }else{
        console.log('\n--------\nSuccessfully MOVED\n--------\n');
        return callback({});
      }
    });
    // setTimeout(function(){
    //   // return callback({error: 'DB Error'})
    //   return callback({})
    // }, 000)
  },

  /*
	UPDATE the PROPERTY table with a file field value (url)
	(1 UPDATE)
  */
  addPropertyFile(params, callback){
    console.log('\n\n\nPropertyModel.addPropertyFile() triggered ...', params);
    var updateStatement = 'UPDATE property SET `' + params.field + '` = \"' + params.fileID + '\"';
    updateStatement += ' WHERE UniqueID = \"' + params.UniqueID + '\" LIMIT 1;';
    console.log('Insert Statement : ', updateStatement);
    query(updateStatement, (rows,err)=>{
      if(err) return console.log(err);
      return callback(rows);
    });
  }
}
