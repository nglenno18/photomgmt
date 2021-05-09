var nodemailer = require('nodemailer');
require('.././config/config.js');
var dateformat = require('date-format');

const CCLIST = process.env.CCLIST.split(',');
const ERROR_SUBJECT = "IIF Request Error ";
const ERROR_MESSAGE = ERROR_SUBJECT + " (This is an automated error email)\n";
class ErrorEmail {
  constructor(type, message) {
    this.type = type.type.toUpperCase();
    this.timestamp = message.date;
    this.recipient = message.user;
    this.admin = false;
    if(message.admin){
      console.log('ADMIN EMAIL');
        this.admin = message.admin;
        this.recipient = CCLIST[0];
    }
    this.mailOptions = {
      to: [this.recipient],
      from: process.env.EMAIL_SENDER,
      cc: CCLIST,
      subject: this.initSubject(type),
      text: this.initMessage(message)
    };
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

  initSubject(type){
    var ti = type.subtype.toUpperCase();
    if(type.title) ti = type.title.toUpperCase();
    console.log('\nEMAIL TITLE: ', this.title);
    return ERROR_SUBJECT + "[" + type.type.toUpperCase() + "- " + ti + "]";
  }
  initMessage(message){
    return ERROR_MESSAGE + message.message+ "\n" + "\nDATETIME: " +
    dateformat('MM/dd/yyyy (h:MM TT)', new Date()) + "\nUSER: " + message.user;
  }

  sendMail(){
    console.log('\nSEND EMAIL : ', this.mailOptions);
    this.transporter.sendMail(this.mailOptions, function(error, info){
      if(error) return console.log(error);
      console.log('Email Sent: ' + info.response);
    });
  }
}

module.exports = {ErrorEmail};
