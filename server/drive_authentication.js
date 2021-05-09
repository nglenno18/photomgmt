var googleapis = require('googleapis');
var googleAuth = require('google-auth-library');
var fs = require('fs');
var readline = require('readline');
var credentials = {};
var ACCOUNT_KEY;
const SCOPES = ['https://www.googleapis.com/auth/drive'];
var auth, OAuth2Client;

function readAccountKey(accountKey, callback){
  ACCOUNT_KEY = accountKey;
  // console.log('ACCOUNT KEY : ', ACCOUNT_KEY);
  if(typeof(ACCOUNT_KEY) === 'object'){
      return authorize(ACCOUNT_KEY, callback);
  }else{
    var fs = require('fs');

    console.log('\n\nAccount Key reading...');
    var content = false;
    content = fs.readFileSync(accountKey);
    while(!content){};
    console.log('\n\nAccount Key read');
    this.credentials = content;
    authorize(JSON.parse(content), callback);
  }
}

function authorize(creds, callback){
  if(!oauth2Client) {
	  console.log('Authorizing credentials : ');
	  try{
      auth = new googleAuth();
	     OAuth2Client = auth.OAuth2;
     }catch(er){
       console.log('Error no googleAuth() constructor : \n', er);
       return callback(oauth2Client);
     }
	  var oauth2Client;
	  var jwt = new googleapis.auth.JWT(
		creds.client_email,
		null,
		creds.private_key,
		SCOPES
	  );
	  this.ROOT_FOLDER_ID = creds.ROOT_FOLDER_ID;
	  jwt.authorize(function(err, result){
		console.log('\n\nJWT AUTHORIZE......\n');
		oauth2Client = new OAuth2Client();
		if(err){
		  var message = "Cannot Access Google Drive: INVALID JSONWebToken" + err;
		  console.log('GOOGLE TOKEN ERROR: ' + err.message);
		  // return callback({invaliderr: "Invalid Google Drive Token"});
		}
		oauth2Client.credentials = {
		  access_token: result.access_token
		};
		console.log('JWT Authorized : ');

		callback(oauth2Client);
	  });
  }else{
	  callback(oauth2Client);
  }
}

module.exports = {readAccountKey};
