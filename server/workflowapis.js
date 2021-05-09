var request = require('request');
var {query, getRequestNumber} = require('.././database/connection');
var propertyModel = require('.././model/property.js');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var drive_access = require('.././server/access_drive.js');
var {WFEmail} = require('.././model/email.js');
require('.././utilities/gdriveHandles.js');
var async = require('async');
var bodyparser = require('body-parser')
// require('.././config/config.json')
const REPAIRS_APP = process.env.REPAIRS_APP || "repair.constructiverenovations.com";

const ARCCM = "62fb6718-b33b-4c69-9eb9-5f25f1f352e6";


module.exports = ((app)=>{
  var batchUploads = {};
  var subUploads= {};
  // return;
  function userRequestEmail(fields, hostname){
    console.log('\n\n\n\nCraft Request Email : ', fields, '\n\n');
    var rsBodyMessage = 'Please validate the User Access Request with the desired Contractor Company: ';
    var emailParams = {
      Type: 'User Access Request',
      recipient: ['nglennon@usresconstruction.com'],
      subject: 'Contractor has Requested Access to Constructive Renovations PhotoMgmt application',
      body: {
        Intro: 'A new User Request was created for <span style="font-weight: bold;">' + fields.company_field +'</span>!',
        explaination: 'To prevent unwanted account access, we require our team to validate new Contractor Users directly with the company. ' +
                      '<p></p>',
        closing:  rsBodyMessage + '<p>' +
                  '<span style="font-weight: bold;">EMAIL : </span>' + fields.email_field + '</br>' +
                  '<span style="font-weight: bold;">User Name : </span>' + fields.name_field + '</br>' +
                  '<span style="font-weight: bold;">Company : </span>' + fields.company_field + '</br>' +
                  '<span style="font-weight: bold;">TimeStamp : </span>' + new Date() +
                  '</p>'
      },
      resources: [
                  {name: "Constructive Renovations Photo Management Application", text: hostname, hyperlink: hostname || "https://arcphotos.herokuapp.com"},
                  {name: "Constructive Renovations Repair Application", text: REPAIRS_APP, hyperlink: REPAIRS_APP},
                  {name: "Using an External Email to Sign into Google",
                          text: "Create Google Account",
                          hyperlink: "https://accounts.google.com/SignUpWithoutGmail?hl=en"
                          // detail: "Our application requires google authentication. Our Contractors interact with our Repair Specialists through company emails. If you wish to log into Constructive PhotoMgmt using a company email, "+
                          //         "please visit this page to activate the google account."
                        },
                  {name: "Unlinking Google Email Accounts",
                          text: "Alternate Emails",
                          hyperlink: "https://support.google.com/accounts/answer/176347"
                          // detail: "Sometimes, a company email like \"ABC@company.com\" is already linked to an existing google account (abc@gmail.com)."+
                                  // "If a user attempts to log in with ABC@company.com, ABC@gmail.com is the only email that google account provides. This means that if Constructive corresponds with your company using" +
                                  // "ABC@company.com, the ABC@gmail.com account needs to be unlinked from the company domain."
                  },
                  {name: "Request Contractor Access for Constructive Renovations PhotoMgmt",
                          text: "Add a Company User",
                          hyperlink: "https://arcphotos.herokuapp.com/login/google/fail"
                          // detail:"As an alternative option, we also allow individuals to request access to the PhotoMgmt application, as long as we can verify that request with the individual's Company"
                  }
                ],
      cclist: process.env.CCLIST
    }

    var emailRequest = new WFEmail(emailParams);


    // EMAIL confirmation form to the contractor (Email that requested the form)
    emailParams.body.Intro = 'Your Request for User Access has been sent! <br></br>';
    emailParams.body.explaination = 'To prevent fraudulant account access, we require our team to validate new Contractor Requests directly with the company (<span style="font-weight: bold;">' + fields.company_field +'</span>).' +
                                    '<ol style="background-color: whitesmoke; lineheight=40px;">' +
                                      '<li>      A Repair Specialist will review your Request Form and determine the Company provided is in our system. </li>'+
                                      '<li>      The Specialist will contact the Contractor we have on file and seek approval for your User Request. </li>'+
                                      '<li>      Upon approval, you will receive a confirmation email and have full access to your company\'s account on Constructive Renovations\' PhotoMgmt application.</li>' +
                                    '</ol>';

                                    // '<br></br>A Repair Specialist will review your Request Form to seek approval from the Contractor we have on file. '+
                                    // 'Once the email you have submitted is confirmed, you will receive a confirmation email and have full access to your company\'s account on ARC\'s PhotoMgmt application.'
    emailParams.body.closing = emailParams.body.closing.replace(rsBodyMessage, 'Original User Access Request: ');
    emailParams.recipient = fields.email_field;

    var contractorConfirm = new WFEmail(emailParams);

  // TRY to update the FileName of the Attachment, if this throws an error, just attach the file
    try{
      // emailRequest.attachment(report.fullPath, report.filePath+fileType);
      console.log('\n\nEmailRequest created : ', emailRequest);
      console.log('\n\nCONTRACTOR EmailRequest created : ', contractorConfirm);
    }catch(e){
      console.log('File attachment cannot be named : ', e);
      // emailRequest.attachment(report.fullPath);
    }finally{
      emailRequest.sendMail(sentEmail);
      contractorConfirm.sendMail(sentEmail);
    }
    return true;
  }

  function sentEmail(cb){
    console.log('Email has been sen!');
  }

  /*
    API ROUTE HANDLER : access-request
      Handles a form submission for a new email user account under a specified contractor
  */
    app.post('/access/request/', function(req, res, next){
      console.log('\n\n\n\n\n\napirouting.js\n----------------------------------Access Request : ', res.length);
      // console.log('\n\n\n\nAccess body : ', req,'\n\n\n\n\n');
      console.log('\nBODY DETECTED : ', req.body);
      var fields = req.body;
      var hostname = req.get('host');
      if(fields.company_field){
        userRequestEmail(fields, hostname);
        return res.status(200).send(fields);
      }else{
        try {
          var form = new formidable.IncomingForm();
          console.log('\n\nFORM = ', form);
          form.parse(req, function (err, fields, files) {
            console.log('\n\n\nform.parse= : ', fields, '\n\n\nfiles : ', files);
            userRequestEmail(fields, hostname);
            console.log('\n\nFinish procedure');
            return res.status(200).send(fields);
          });
        } catch (e) {
          console.log('\n\nERROR PARSING INTO FORMDATA');
        }
      }
    });

  /*
    API ROUTE HANDLER : upload-success
    WORKFLOW listener : fires an email to the Repair Specialist when a Contractor uploads photos
  */
    app.post('/workflow-upload/', function(req, res, next){
      app.use(bodyparser({}));

      console.log('\n\n\n\n\n\napirouting.js\n---------------------------------- Upload ALERT: ', res.length);
      var uploadDetails;
      console.log('\n\nuploadDetails : ', req.body);
      if(req.body.params) uploadDetails = req.body.params;
      else return res.status(400).send('No Upload Details detected with Request');

      console.log('\n\n\n------------------------------- SEND EMAIL ALERT! ', uploadDetails);
      if(!uploadDetails) console.log('\n\n\n------------------------------- SEND EMAIL ALERT! ', req.body);

      uploadDetails.company_field = req.session.passport.user.userData.user_name;

      console.log('\n\n\n\nCraft Request Email : ', uploadDetails, '\n\n');
      var rsBodyMessage = 'A Contractor has uploaded images to one of your properties! ';
      var emailParams = {
        Type: 'Image Upload Alert',
        subject: 'Contractor Upload Alert!',
        body: {
          Intro: 'A Contractor <span style="font-weight: bold;">(' + uploadDetails.company_field +')</span> has uploaded photos to ' + uploadDetails.address + '!',
          explaination: '<p></p>Property Details: ' +
                        '<p><span>  CR-Repair : ' + appsheetHyperlink(ARCCM, 'Properties Detail', uploadDetails.propID, uploadDetails.address) + '' +
                        '</span></br><span>Constructive Photos : ' + createHyperlink('https://arcphotos.herokuapp.com/upload/' + encodeURIComponent(uploadDetails.propID), uploadDetails.address) + '</p>' +
                        '</span>',


          closing:  '<p>' +
                    '<span style="font-weight: bold;">PROPERTY : </span>' + uploadDetails.propID + '</br>' +
                    '<span style="font-weight: bold;">USER EMAIL : </span>' + uploadDetails.user_email + '</br>' +
                    '<span style="font-weight: bold;">Company : </span>' + uploadDetails.company_field + '</br>' +
                    '<span style="font-weight: bold;">Folder : </span>' + uploadDetails.folder + '</br>' +
                    '<span style="font-weight: bold;">Gallery (Period): </span>' + uploadDetails.gallery + '</br>' +
                    '<span style="font-weight: bold;">Sub-Period : </span>' + uploadDetails.subGallery + '</br>' +
                    '<span style="font-weight: bold;">Number of Images : </span>' + uploadDetails.numFiles + '</br>' +
                    '<span style="font-weight: bold;">TimeStamp : </span>' + new Date() +
                    '</p>'
        },
        resources: [
                    {name: "Constructive Renovations Photo Management Application", text: "upload.constructiverenovations.com", hyperlink: "https://arcphotos.herokuapp.com"},
                    {name: "Constructive Renovations Repair Application", text: "repair.constructiverenovations.com", hyperlink: "repair.constructiverenovations.com"},
                    {name: "Using an External Email to Sign into Google",
                            text: "Create Google Account",
                            hyperlink: "https://accounts.google.com/SignUpWithoutGmail?hl=en"
                            // detail: "Our application requires google authentication. Our Contractors interact with our Repair Specialists through company emails. If you wish to log into Constructive PhotoMgmt using a company email, "+
                            //         "please visit this page to activate the google account."
                          },
                    {name: "Unlinking Google Email Accounts",
                            text: "Alternate Emails",
                            hyperlink: "https://support.google.com/accounts/answer/176347"
                            // detail: "Sometimes, a company email like \"ABC@company.com\" is already linked to an existing google account (abc@gmail.com)."+
                                    // "If a user attempts to log in with ABC@company.com, ABC@gmail.com is the only email that google account provides. This means that if Constructive corresponds with your company using" +
                                    // "ABC@company.com, the ABC@gmail.com account needs to be unlinked from the company domain."
                    },
                    {name: "Request Contractor Access for Constructive Renovations PhotoMgmt",
                            text: "Add a Company User",
                            hyperlink: "https://arcphotos.herokuapp.com/login/google/fail"
                            // detail:"As an alternative option, we also allow individuals to request access to the PhotoMgmt application, as long as we can verify that request with the individual's Company"
                    }
                  ],
        cclist: process.env.CCLIST
      }

      var emailRequest = new WFEmail(emailParams);

      // emailParams.recipient = 'nglennon@usresconstruction.com';
      var fetchUser ='SELECT user_email FROM ' + process.env.userTable + ' WHERE user_name IN (SELECT `Repair Specialist` FROM ' + process.env.propertyTable + ' p ';
      if(uploadDetails.rs === 'Jessica Rodriguez' || uploadDetails.rs === 'Alexandra Wyness') fetchUser +=  ' WHERE p.`Repair Specialist` IN (\"'+ uploadDetails.rs + '\", \"Alexandra Wyness\"))';
      else fetchUser+= ' WHERE p.`Repair Specialist` = \"'+ uploadDetails.rs + '\")';

      query(fetchUser, function(rows, err){
        console.log('RESULT : rows : ', rows);
        console.log('ERROR : err : ', err);
        emailParams.recipient = uploadDetails.rs;
        if(!rows[0] || rows === 0){
          console.log({invaliderr: 'No User Email for Detected RS : ' + uploadDetails.rs, emailParams: uploadDetails})
          emailParams.recipient = process.env.EMAIL_SENDER;
          var uploadUpdate = new WFEmail(emailParams);
          return uploadUpdate.sendMail();
        }else useremail = rows[0].user_email;
        if(uploadDetails.rs != 'Jessica Rodriguez' || 'Alexandra Wyness') emailParams.recipient = useremail;
        else emailParams.recipient = [rows[0].user_email, rows[1].user_email]
        var uploadUpdate = new WFEmail(emailParams);
        return uploadUpdate.sendMail();
      });
      // emailParams.recipient = uploadDetails.rs;
      res.status(200).send(emailParams);
    });



    /*
      assemble a hyperlink for an appsheet view
    */
    appsheetHyperlink = function(applicationID, view, rowID, textValue){
      var returnURL = '<a href=\"https://www.appsheet.com/start/' + applicationID +
                      '#control=' + encodeURIComponent(view) +
                      '&row=' + encodeURIComponent(rowID) +
                      '\">'+
                      textValue +
                      '</a>';
      return returnURL;
    }
    /*
      assemble a hyperlink for an appsheet view
    */
    createHyperlink = function(linkValue, textValue){
      var returnURL = '<a href=\"' +
                        linkValue +
                      '\">'+
                      textValue +
                      '</a>';
      return returnURL;
    }

    /*
      Verify the user is registered in our systems
    */
  verifyUser = function(session){
    try{
      userData= session.passport.user.userData
    }catch(e){
      console.log('Error User Not Logged In : ', e);
      console.log('return user to Login Page!');
      return window.location.href = '.././api/logout';
    }
  }
});
