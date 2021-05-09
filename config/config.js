var env = process.env.NODE_ENV || 'development';

if(env === 'development' || env.indexOf('test') != -1){
  var config = require('./config.json');
  var envConfig = config[env];

  Object.keys(envConfig).forEach(function(key){
    process.env[key] = envConfig[key];
  });
}

console.log('config.js processed');
