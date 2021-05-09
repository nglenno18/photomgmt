  var passport = require('passport');
  require('.././routes/property_routes.js');
  var fs = require('fs');
  var path = require('path');
  var request = require('request');

  module.exports = (app)=>{
    //user wants to sign in through google, we want to ask for profile,email once they return with a google code
    app.get('/auth/google',
            passport.authenticate(
              'google',{
                scope: ['profile', 'email'],     //from list of scopes, permissions to ask for access,
                prompt: "select_account"
              })
          );

    /*
      ROUTE HANDLER -- Google PROXY
      Serve a Google Drive Image through Heroku (Bypass Clients' Google Drive-restriction/content-filter)

      @param    {string}    route  -- route relative to project root
      @param    {function}  ensureAuthenticated()
                                   -- MIDDLEWARE to require google authentication
      @param    {function}  route handler
    */
    app.get('/media/:imageID', ensureAuthenticated, (req, response)=>{
      // console.log('\n----------------\nPROXY GOOGLE DRIVE IMAGE ::: ', req.params.imageID, '\n----------------');
      var filePath = 'https://drive.google.com/uc?export=view&id=' + req.params.imageID;

      var requestSettings = {
          url: filePath,
          method: 'GET',
          encoding: null
      };

      request(requestSettings, function(error, res, body) {
        if(error) response.status(500).send(error)
          response.set('Content-Type', 'image/png');
          response.send(body);
      });
    });

          // {successRedirect: '/', failureRedirect: '/login'}
    app.get('/auth/google/callback', passport.authenticate('google'),
      function(req, res){
        console.log('\n\n\n\n', req.url, '\n\n\n\n\n');
        try {
          if(req.session.passport.user.userData['user_email']) return res.redirect(req.session.endpoint);
          else{
            logout(req);
            return res.redirect('/login.html');
          }
        }catch(e){
          console.log('\n\n\nCaught exception reading passport user ! : ', e, '\n\n\n-----------------\n\n');
          if(req.session.passport.user.message && req.session.passport.user.potentialUser) console.log('\n\n\npassport object : \n', req.session.passport);
          return res.redirect('/login/google/fail');
        } finally {}
      }
    );



  app.get('/login/google/fail', function(req, res){
    console.log('\n\n\n\n\n\n\n\n\n\n\nGOOGLE AUTH LOGIN FAILURE\n\n\n\n\n\n');
    // console.log('\n\n\n\n\ngoogle authentication callback function\n\tURL:', req, '\n\n\tQUERY:\n\n', res, '\n\n\n\n\n', '\n\n\n\n\n');
    req.session.element = req.session.passport.user;
    res.params = req.session.passport.user;
    console.log(req.params);
    let datafile = fs.readFileSync(path.join(__dirname,'../public/loginAlert.html'), "utf8");
    console.log('\n\n\n\nDATA FILE : ', req.session.passport.user.potentialUser.profile.name);

    datafile = datafile
                  .replace(/sampleEmail@email.com/g, req.session.passport.user.potentialUser.email)
                  .replace(/emailIDTAG/g, req.session.passport.user.potentialUser.email)
                  .replace(/firstNameID/g, req.session.passport.user.potentialUser.profile.name.givenName)
                  .replace(/lastNameID/g, req.session.passport.user.potentialUser.profile.name.familyName);

    if(datafile) return res.send(datafile.replace('emailIDTAG', req.session.passport.user.potentialUser.email));
      try{
        userData= req.session.passport.user.userData
      }catch(e){
        console.log('Error User Not Logged In : ', e);
        console.log('return user to Login Page!');
        console.log('\n\n\n-----USER : ', body);
        return res.sendFile(path.join(__dirname,'../public/layouts/loginAlert.html'));
        // return res.status(200).send(req.session.passport.user);
      }
  });

    app.get('/propertyList', function(req, res){
      console.log('URL = ', req.get('host'));

    })
    //^^^Because we already ran passport.authenticate to get the code, passport knows that this time it
    //is to access the profile, email (SCOPE parameters)

    function logout(req){
      try{
        console.log('\nLOGOUT()\n');
        clearStorage(req.session.passport.user.userData.user_name);
      }catch(e){console.log('\n\nuser_name not exist\n', e);}
      req.logout();
      // req.session.destroy();
    }

    app.get('/api/logout', (req, res)=>{
      console.log('Logging Out: ', req.session);
      logout(req);
      // res.send(req.session);
      res.redirect('/');
    });

    app.get('/api/current_user', (req, res)=>{
      console.log('Current User: ', req.session);
      console.log(req.session.passport.user.displayName);
      res.send(req.session.passport.user.userData);
    });

    app.get('/properties', ensureAuthenticated, allProperties);   // Load a page of all existing properties
    app.get('/properties/', function(req, res){
      return res.redirect('/properties');
    });   // Load a page of all existing properties
    app.get('/properties/user/:userID', ensureAuthenticated, userPage);   // Load a page for that specific user that displays their properties in a simple layout

      app.get('/propertyLayout', ensureAuthenticated, propertyLayouts);   // Load a page of all existing properties
      app.get('/propertyPage', ensureAuthenticated, propertyPage);   // Load a page of all existing properties

  	}
