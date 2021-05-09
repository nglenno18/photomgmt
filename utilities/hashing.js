const {SHA256} = require('crypto-js');
const jwt = require('jsonwebtoken');

encodeToken = function(data){
  var tokenObj = jwt.sign(data, process.env.WEBHOOK_SECRET);
  var fs =require('fs');
  return tokenObj;
}

decodeToken = function(token){
  var dataDerived;
  try {
    dataDerived = jwt.verify(token, process.env.WEBHOOK_SECRET);
  } catch (e) {
    return 'Invalid Token ERROR'
  }

  return dataDerived;
}
