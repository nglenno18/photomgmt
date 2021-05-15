require('.././config/config');
require('.././utilities/hashing');
// var {ErrorEmail} = require('.././model/error_email.js');

var ACCOUNT_KEY;

if(process.env['auth_provider_x509_cert_url']){
  ACCOUNT_KEY = process.env;
  process.env['private_key'] = process.env['private_key'].replace(/\\n/g, '\n');
}else{
  ACCOUNT_KEY = './config/service_account_key.json';
}

//start middleware
removeExpressHeader = function(req,res,next){
  res.removeHeader("X-Powered-By");
  next();
};

ensureAuthenticated = function(req, res, next){
  try {
    console.log('ensureAuthenticated');
    req.session.endpoint = req.url;
    if(req.isAuthenticated() && req.session.passport.user.userData.user_email){
      return next();
    }
    res.redirect('/auth/google');
  }catch(e){
    console.log('caught error : ', e.message);
    console.log('Return to login!');
    res.redirect('/api/logout');
  }
}

verify = function(req,res,buf,encoding){
  console.log('\n\nVerifying Headers : ', req.headers['x-appsheet-signature']);
  // res.status(401).send(encodeToken(req.headers['x-appsheet-signature']));
  // if(req.url.indexOf('/uploadimages/') > -1) return true;
  if(process.env.TOKENS !== decodeToken(req.headers['x-appsheet-signature'])){
    var userIP = req.get('X-Forwarded-For')+'';
    if(userIP === 'undefined') userIP = req.ip;
    // emailError('webhook', {
    //   message: "Error Invalid Webhook Signature\n"+ "--"+ userIP +"--",
    //   user:userIP
    // });
    res.status(401).send(decodeToken(req.headers['x-appsheet-signature']));
    throw new Error('Invalid Webhook Signature');
  }
};

whitelist = function(req, res, next){
  console.log('\n\nWhitelist() Middleware Active');
  var env = "development";
  if(process.env.NODE_ENV) env = process.env.NODE_ENV;  // env = "production";
  console.log('ENV = ', env);
  var userIP = req.get('X-Forwarded-For')+'';
  if(userIP === 'undefined') userIP = req.ip;
  console.log('USER connection : ', userIP);
  console.log('Checking from Whitelist...');
  var datalength= process.env.WL.split(';').length-1;
  var good = false;
  process.env.WL.split(';').forEach((untrimmed, index)=>{
    var ip = untrimmed.trim()
            .replace(/\n/g, '')
            .replace(/\t/g, '')
            .replace(/\r/g, '');
    console.log('\nINDEX : ', index, ' of ', datalength);
    console.log(ip, ' -- ', userIP);
    if(userIP === ip){
      console.log('IP Validated');
      good = true;
      next();
    }else if(datalength === index && good === false){
      console.log('IP Rejected');
      // emailMError('whitelist', {
      //   message: "Error User not found from whitelisted IP Addresses\n"+ "--"+ userIP +"--",
      //   user: userIP
      // });
      return res.status(500).send('IP Rejected ' + userIP);
    }
  });
}

requireHTTPS = function(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') != 'https'
      // && process.env.NODE_ENV != "development"
      && process.env.NODE_ENV == 'production') {
    console.log('requireHTTPS : REDIRECT! : ', req.url);
    return res.redirect('https://' + req.get('host') + req.url);
  }
  console.log('requireHTTPS : ', req.get('host') + req.url, '\nx-forwarded-proto = ', req.get('x-forwarded-proto'));
  next();
}

// emailMError = function(type, message){
//   var errorEmail = new ErrorEmail(
//     {
//       type: 'middleware',
//       subtype: type
//     },
//     {
//       message: message.message,
//       user: message.user,
//       date: new Date()
//     }
//   );
//   errorEmail.sendMail();
// }
//end middleware
