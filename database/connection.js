require('.././config/config.js');
var connection = null;
var mysql2 = require('mysql2');
var url = require('url');
var SocksConnection = require('socksjs');
var username, password, mysql_server_options, socks_options, mysl_options, proxy;

var requestNumber = 0;
var requestArray = '';

mysql_server_options = {
  host: process.env.HOST,
  port: process.env.PT
}

if(process.env.QUOTAGUARD_STATIC_URL){
  //Run the IP address through quotaguard, result in a proxied connection
  proxy = url.parse(process.env.QUOTAGUARD_STATIC_URL);
  username= proxy.auth.split(':')[0];
  password = proxy.auth.split(':')[1];
  socks_options = {
    host: proxy.hostname,
    port: 1080,
    user: username,
    pass: password
  };
}// End the proxy setup

var establishProxy = function(callback){
  mysql_options = {
    database: process.env.DB,
    user: process.env.US,
    password: process.env.PW
  }

  if(process.env.QUOTAGUARD_STATIC_URL){
    mysql_options = {
      database: process.env.DB,
      user: process.env.US,
      password: process.env.PW,
      stream: new SocksConnection(mysql_server_options, socks_options)
    }
    console.log('\nProxied Connection');
  }else{
    mysql_options = {
      host: process.env.HOST,
      user: process.env.US,
      password: process.env.PW,
      database: process.env.DB
    }
    console.log('\nDirect Conntection: ', mysql_options.host, mysql_options.database);
  }
  callback(mysql2.createConnection(mysql_options));
}

var getRequestNumber = function(){
	var reqText = requestArray.split(':::');
	var fulltext = '<!DOCTYPE html>\n<html>\n    <head>\n    </head>\n <body>\n <p>REQUEST NUMBER : ' + requestNumber + '</p>     ';
	reqText.forEach((reqEnt)=>{
		fulltext = fulltext+ '\n<p>'+ reqEnt +'</p>';
	});
	fulltext = fulltext + '</div></body></html>';
	return fulltext;
}

var query = function(querystatement, callback){
  console.log('\nQuery initialized, method called: ', querystatement);
  	  requestNumber = requestNumber + 1;
	  // console.log('REQUEST # : ', getRequestNumber(), requestNumber);
		requestArray = ':::[REQUEST #' + requestNumber + ']   ' + querystatement +' \n'+requestArray;
		if(requestArray.length > 10000) requestArray = requestArray.substring(0, 10000);
    establishProxy(function(mysqlConn){
      return mysqlConn.connect(function(err){
        if(err) return callback(null, err);
        console.log('\n\nDatabase Connected');

        return mysqlConn.query(querystatement, function(err, rows){
          if(rows) console.log('Result: ', rows.length);
          if(err) return callback(null, err);
          console.log('\nRows: ', rows.length, '\nErr: ', err);

          return callback(rows);
          /*
            return mysqlConn.end(function(err){
              if(err) return console.log(err);
              new DateStamp().printTime('\n\nDatabase DISCONNECTED!')
          });
          */
        });
      });
  });
}

// function querySync(queryStatement){
//   var proxyconnection = configureProxy();
//   var connecti = connect(proxyconnection);
//
//   return runQuery(connecti, queryStatement);
// }


var getTableStatement = function(tablename){
  return 'SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE '+
         'tablename = \'' + tablename + '\' AND table_schema = \'' + process.env.DB + '\';'
}

module.exports = {establishProxy, query, getTableStatement, getRequestNumber};
