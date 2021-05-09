var {query} = require('.././database/connection.js');
const USER_TABLE = process.env.USER_TABLE;
const PROPERTY_TABLE = process.env.PROPERTY_TABLE;

var selectTemplate = 'SELECT * FROM ' + USER_TABLE + ' WHERE LOWER(user_email) = ';
module.exports = {
  findUserEmail(userData, callback){
    console.log('INITIALIZED FIND : ', userData.emails[0].value);
    var selectUser = selectTemplate + 'LOWER(\"' + userData.emails[0].value + '\")';
    console.log('\n\nInitialized findUserEmail()\n', selectUser);

    query(selectUser, function(rows, err){
      if(err) console.log(err);
      try {
        console.log('SELECTED USER FROM DATABASE: ', rows[0]);
        console.log('Email Matched Entry in DB: \n\t', rows[0].user_email, ' = ', userData.emails[0].value);

        if(rows[0].user_email.toLowerCase() === userData.emails[0].value.toLowerCase()){
          return callback(rows[0]);
        }else{
          console.log('\n\nUSER FOUND IN DB, but NOT MATCHED');
          return callback({typeerror: 'User found, user not matched'})
        }
      }catch (e) {
        console.log('Caught Error');
        return callback(e);
      }
    });
  },

  findPropertiesByUser(userProfile, callback){
    console.log('Find Properties by User: ', userProfile);
    console.log('USER TYPE : ', userProfile.user_type);
    var selectProperties = 'SELECT * FROM ' + PROPERTY_TABLE + ' WHERE LOWER(`' + userProfile.user_type + '`) = \"' +
    userProfile.user_name.toLowerCase() + '\"';
    // selectProperties = selectProperties.replace(/'/g, '\'');
    query(selectProperties, function(rows, err){
      console.log('Err: ', err);
      // console.log('Rows: ', rows);
      var addresses = [];
      rows.forEach((row)=>{
        // console.log('Property by User: ', row.Address, '\n\t', row.repair_specialist);
        addresses.push(row);
      });
      callback({properties: addresses})
    });
  },

  propertySearhOptions(userProfile, callback){
    console.log('Find Properties by User: ', userProfile);
    var selectProperties = 'SELECT Property, Property_key FROM ' + PROPERTY_TABLE + ' WHERE LOWER(`' + userProfile.user_type + '`) = \"' +
    userProfile.user_name.toLowerCase() + '\" OR LOWER(asset_manager) = \"' + userProfile.user_name.toLowerCase() + '\";';
    console.log('QUERY SEARCH : ', selectProperties);
    selectProperties = selectProperties.replace(/'/g, '\'');

  	query(selectProperties, function(rows, err){
        console.log('Err: ', err);
        // console.log('Rows: ', rows);
        var addresses = [];
        rows.forEach((row)=>{
          // console.log('Search Option Property: ', row.Address, '\n\t', row.UniqueID);
          addresses.push({Address: row.Property, UniqueID: row.Property_key});
        });
        callback({properties: addresses})
      });
  }
}
