'use strict'

const { TRANSPORTER_OPTIONS, client_server, blobAccessToken } = require('../config')
const insights = require('../services/insights')
const nodemailer = require('nodemailer')
var hbs = require('nodemailer-express-handlebars')

var options = {
     viewEngine: {
         extname: '.hbs',
         layoutsDir: 'views/email/',
         defaultLayout : 'template'
     },
     viewPath: 'views/email/',
     extName: '.hbs'
 };

 var transporter = nodemailer.createTransport(TRANSPORTER_OPTIONS);
 transporter.use('compile', hbs(options));

function sendMailSupport (email, supportStored){
  const decoded = new Promise((resolve, reject) => {
    console.log(supportStored)
    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: 'Mensaje para soporte de OrphaCare',
      template: 'mail_support/_es',
      context: {
        email : email,
        description: supportStored.description
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        insights.error(error);
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}


function sendMailValidator (email, subject, message, contactEmail){
  const decoded = new Promise((resolve, reject) => {
    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var mailOptions = {
      to: contactEmail,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: 'New contact request from OrphaCare: '+ subject,
      template: 'mail_validator/_en',
      context: {
        email: email,
        subject: subject,
        message : message
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        insights.error(error);
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailDev (params){
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var mailOptions = {
      to: 'dev@foundation29.org',
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: params.subject,
      template: 'mail_dev/_es',
      context: {
        data : JSON.stringify(params.data)
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        insights.error(error);
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailControlCall (req){
  const decoded = new Promise((resolve, reject) => {
    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: 'Mensaje para soporte de OrphaCare - ControlCall',
      template: 'mail_error_control_call/_es',
      context: {
        info: JSON.stringify(req)
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        insights.error(error);
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendEmailLogin (email, randomstring){
  var subject='Access Link for OrphaCare';
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      'support@foundation29.org',
    ];
    var urlImg = client_server+'/assets/img/Collaborarerecortado.png';
    var mailOptions = {
      to: email,
      from:'support@foundation29.org',
      subject: subject,
      template: 'login_pass/_en',
      context: {
        client_server : client_server,
        email : email,
        key : randomstring,
        urlImg : urlImg
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        console.log('Email sent: ' + info.response);
        resolve("ok")
      }
    });

  });
  return decoded
}

module.exports = {
  sendMailSupport,
  sendMailValidator,
  sendMailDev,
  sendMailControlCall,
  sendEmailLogin
}
