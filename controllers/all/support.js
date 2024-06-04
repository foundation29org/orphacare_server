// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Support = require('../../models/support')
const serviceEmail = require('../../services/email')
const crypt = require('../../services/crypt')
const insights = require('../../services/insights')


function sendMsgLogoutSupport(req, res) {
	let support = new Support()
	//support.type = 'Home form'
	support.subject = 'OrphaCare support'
	support.description = 'Name: ' + req.body.userName + ', Description: ' + req.body.description
	support.createdBy = "5c77d0492f45d6006c142ab3";
	//enviamos Email
	console.log(support)
	serviceEmail.sendMailSupport(req.body.email, support)
		.then(response => {
			return res.status(200).send({ message: 'Email sent' })
		})
		.catch(response => {
			insights.error(response);
			res.status(500).send({ message: 'Fail sending email' })
		})
}



module.exports = {
	sendMsgLogoutSupport
}
