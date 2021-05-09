require('.././config/config.js');
var userMethods = require('.././model/user.js');
//install passport modules
const passport = require('passport');
const google_strategy = require('passport-google-oauth20').Strategy;
const profile_url = 'https://www.googleapis.com/oauth2/v3/userinfo';
// const mongoose = require('mongoose');
var request = require('request');
require('.././utilities/gdriveHandles.js');
var googleapis = require('googleapis');

passport.serializeUser((user,done)=>{
  console.log('SERIALIZE :: ', user);
  // var sessionUser = {_id: user._id, name: user.user_name, email: user.user_email, company: user.user_company}
  return done(null, user);  //user.id is the Database-generated id. Use this and not googleID because user might not have a googleID, may have a SpotifyID
});

passport.deserializeUser((id, done)=>{
  //turn this id into a mongoose model instance (query)
  // console.log('DESERIALIZE :: ', id);
  return done(null, id);
});


// passport.use(new google_strategy());
passport.use(new google_strategy({
      clientID: process.env.googleClientID,
      clientSecret: process.env.googleClientSecret,
      callbackURL: '/auth/google/callback',
      userProfileURL: profile_url,
      proxy: true
    },
    //second arg          --> THIS IS THE CALLBACK HANDLER (when google trades your code for the profile)
    (accessToken, refreshToken, profile, done) =>{
      //Need access to our mongoose model in this file
      // console.log('\nAccess Token :: ', accessToken);
      // console.log('\nRefresh Token :: ', refreshToken);
      console.log('\nUser Profile :: ', profile);
      console.log('\nUser ID :: ', profile.id);
      console.log('USER EMAILS : ', profile._json.emails);
      var prof1 = profile;
      try {
        //Find User
        userMethods.findUserEmail(profile, function(result){
          profile.userData = result;
          console.log('\n\n\nType of : ', typeof(result));
          console.log('RESULT : ', result);
          console.log('RESULT : ', JSON.stringify(result, undefined, 2));
          var emailtext = prof1.emails[0];
          // https://www.googleapis.com/admin/directory/v1/users/liz@example.com/aliases
          var opts = {

          }
          // getAuthentication((auth)=>{
          //   var service = googleapis.admin('directory_v1');
          //   service.users.list({
          //     auth,
          //     customer: 'my_customer',
          //     maxResults: 10,
          //     orderBy: 'email'
          //   }, function(err, response){
          //     if (err) {
          //       console.log('ERROR CAUGHT BY listFiles (findFoler callback function): ' + err, response);
          // 	  // throw Error;
          //       return;
          //     }
          //     var permissions = response;
          // 	console.log('Permissions: ',permissions);
          //     // callback(permissions, null);
          //   })
          // }, ['https://www.googleapis.com/auth/admin.directory.user']);

          if(result.toString().toLowerCase().indexOf('typeerror:') > -1) {
            var potentialUser = {
              email: emailtext.value,
              profile: {
                name: profile.name,
                displayName: profile.displayName
              }
            }
            console.log('\n\n\n\n\n\n\nEmail Return Error : ', result, '\nEMAIL TEXT to Return : ', potentialUser);
            return done(null, {message: 'Missing User Email : ', potentialUser});
          }else{
            console.log('\n\n\nEmail Match from passport_google.js : ', profile, '\n\n');
            return done(null, profile);
          }
        });
      }catch(e){
        console.log('\n\n\nERROR THROWN: ', e);
      }
    }
  )
);

// passport.use(function(param1, param2, next){
//   var params = {
//     clientID: process.env.googleClientID,
//     clientSecret: process.env.googleClientSecret,
//     proxy: true
//   };
//   console.log(
//               '\n\n\nPARAM 1: ', param1,
//               'PARAM 2 : ', param2
//             );
//
// });
