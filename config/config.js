var env = process.env.NODE_ENV || 'development';

var assignVariables = function(envConfig){
  Object.keys(envConfig).forEach(function(key){
    console.log('processing variable = ' + key);
    process.env[key] = envConfig[key];
  });
}

if(env === 'development' || env.indexOf('test') != -1){
  assignVariables(require('./config.json')[env]);
}

if(env === 'local'){
  var config = require('./config.json');
  // Assign Root-DEV variables
  assignVariables(config['development']);
  // Overwrite config variables with the 'local' adjustments
  assignVariables(config['local']);
}

console.log('config.js processed');
