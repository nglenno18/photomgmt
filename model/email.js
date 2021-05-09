var nodemailer = require('nodemailer');
var dateformat = require('date-format');
require('.././config/config.js');
const CCLIST = process.env.CCLIST.split(',');


/*
  WorkFlow Email Params:
    Type [User Access Request Form Submission]
    Recipient [Matched Contractor Company]
    Subject [User Access Request Form]
    Body [
          Please validate the provided email address.
          It was used to request access to *Contractor Name* Photos through arcphotos.com.
          - List Contractor's existing Users
        ]
    CCList [Repair Specialist, It, images@usresconstruction]
    HREFS [arcphotos PhotoMgmt, adding google authentication tutorial, in-house request access tutorial]
*/
class WFEmail {
  constructor(params) {
    this.title = params.Typers;
    this.result = 'FAILED';

    console.log(typeof(params.success));
    if(typeof(params.success) === 'string') this.result = 'SUCCESS';
    // this.message = this.initMessage(params);
    this.mailOptions = {
      from: process.env.EMAIL_SENDER,
      to: params.recipient,
      cc: params.cclist || process.env.CCLIST,
      subject: params.subject
      // text: this.body
    };

    if(process.env.NODE_ENV != 'production') this.mailOptions.subject = '**TEST EMAIL FEATURES-Please disregard** ' + this.mailOptions.subject;

    this.mailOptions.html = '<div style="background-color: Transparent;">------------------------------------------------</br>'+
                            '<span style="font-size:120%">' + params.body.Intro + '</span></br>' +
                            params.body.explaination + '' +
                            params.body.closing + '' +
                            '------------------------------------------------</div>';
    try {

      this.mailOptions.html += '<p>';
      params.resources.forEach((resource)=>{
        if(!resource.text) {

        }
        if(!resource.detail){
          // if(!resource.text) {
          //   this.mailOptions.html += '<p><h4 href=\"'+ resource.hyperlink + '\">' + resource.name + '</h4></p>------------------------------------------------</br>';
          // }else
          this.mailOptions.html += '<span><h4>' + resource.name + '</h4><a href=\"'+ resource.hyperlink + '\">' + resource.text + '</a></span>------------------------------------------------</br>';
        }else{
          this.mailOptions.html += '<span>------------------------------------------------</br><h4>' + resource.name + '</h4>'+
                                    '<a href=\"'+ resource.hyperlink + '\">' + resource.text + '</a></span>' + resource.detail + '</br>';
        }
      });
      this.mailOptions.html += '</p>';
    } catch (e) {
      console.log('\n\n\n\nERROR Creating HTML Email Body! ', e);
    } finally {}

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,  // primary
      // host: 'cluster6a.us.messagelabs.com',  // secondary
      port: 25,
      secure: false,
      tls:{
        rejectUnauthorized: false,
        requireTLS: true
      },
      requireTLS: true
      , proxy: process.env.QUOTAGUARD_STATIC_URL // https protocol
    });
  }

  attachment(filePath, fileName){
    const fs = require('fs');
    var fp = filePath;
    if(!fp) fp = this.filePath;
    this.mailOptions.attachments = [];
    this.mailOptions.attachments.push({
      filename: fileName || fp,
      content: fs.createReadStream(fp)
    })
  }
  initMessage(message){
    var messages = message.message;
    if(typeof(message.message)==='string') messages = message.message.split('\n');
    var me = '';
	console.log('Messages for Email : ', messages)
    messages.forEach((line)=>{
      console.log(line);
      if(line.charAt(0)===',') line = line.substring(1);
      me = me + "\t\n" + line;
    });
    var finalMessageBody = me + "\n" + "\nDATETIME: " +
    dateformat('MM/dd/yyyy (hh:mm ss)', new Date()) + "\nUSER: " + message.recipient;

	console.log('\nFinal Message Body : \n',finalMessageBody);
	return finalMessageBody;
  }

  sendMail(callback){
    console.log('SEND EMAIL : ', this.mailOptions);
    this.transporter.sendMail(this.mailOptions, function(error, info){
      if(error) return console.log(error);
      console.log('Email Sent: ' + info.response);
	  if(callback) return callback(info.response);
    });
  }
}

module.exports = {WFEmail};
