var {query} = require('.././database/connection.js');
// var propertyTable = PROPERTY_TABLE;
const FOLDER_TABLE = process.env.FOLDER_TABLE;
const PROPERTY_TABLE = process.env.PROPERTY_TABLE;
const IMAGE_TABLE = process.env.IMAGE_TABLE;
var selectTemplate = 'SELECT * FROM ' + FOLDER_TABLE + ' p WHERE ';
var uuidv4 = require('uuid/v4');
var dateformat = require('date-format');
var moment = require('moment');

module.exports = {
  findTagsBy(colName, colValue, callback){
    console.log('\n\n\nfind Tags where ', colName, ' = ', colValue, '\n\n\n');
    var selectStatement = selectTemplate + '\`' + colName + '\` = \"' + colValue + '\";';
    query(selectStatement, (rows, error)=>{
      console.log('\n\n------------------TAGS returned from query! ', rows.length);
      if(error) {
        console.log('\n\n\nERROR Returning tags! ', error);
        if(callback) return callback({invaliderr: error});
        return error;
      }
      return callback({rows});
    });
  },

  /*
    colName = imageTABLE column
    colValue = Property/WorkOrder/ identifying query of images
    folderName = tag to search for
  */
  detailsBy(iCol, dColumn, colValue, callback){
    console.log('\n\n\nfind Tags DETAILS where ',iCol, ' = ', colValue, '\n\n\n');
    var selectStatement = '' +
        'SELECT ' +
            'TagName, Tier, OrderNum, Description, TimeStamp, ' +
            '(SELECT COUNT(1) ' +
            '      FROM \`' + IMAGE_TABLE +'\` WHERE '+
                  '\`'+ dColumn + '\` = TagName AND \`' + iCol + '\` '+
                  '= '+
                  '\"' + colValue + '\" ' +
            ') AS photo_count' +
        ' FROM \`' + FOLDER_TABLE + '\`' +
        // ' WHERE `Tier` =\"Property\"'+
        ' ORDER BY OrderNum ASC;' ;
    query(selectStatement, (rows, error)=>{
      if(error) {
        console.log('\n\n\nERROR Returning tags! ', error);
        if(callback) return callback({invaliderr: error});
        return error;
      }
      var folderList = [];
      var tagList = [];
      rows.forEach((row)=>{
        if(row.Tier === "Property"){
          folderList.push(row);
        }else tagList.push(row);
      })
      return callback({folderList, tagList});
    });
  }
};
