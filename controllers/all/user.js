// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Diseases = require('../../models/diseases')
const serviceAuth = require('../../services/auth')
const serviceEmail = require('../../services/email')
const { decrypt } = require('../../services/crypt');
const insights = require('../../services/insights')

function login(req, res) {
	// attempt to authenticate user
	req.body.email = (req.body.email).toLowerCase();
	User.getAuthenticated(req.body.email, function (err, user, reason) {
		if (err) return res.status(500).send({ message: err })
		let randomstring = Math.random().toString(36).slice(-12);
		let dateTimeLogin = Date.now();
		if (!user) {
			console.log('no user')
			let user = new User()
			user.email = req.body.email
			user.confirmationCode = randomstring
			user.dateTimeLogin = dateTimeLogin
			user.save((err, userStored) => {
				if (err) {
					insights.error(err);
					return res.status(500).send({ message: `Error creating the user: ${err}` })
				}
				if (userStored) {
					//send email
					serviceEmail.sendEmailLogin(userStored.email, userStored.confirmationCode)
					return res.status(200).send({
						message: 'Check email'
					})
				} else {
					insights.error("The user does not exist");
					return res.status(404).send({ code: 208, message: `The user does not exist` })
				}
			})
			//return res.status(500).send({ message: `Fail` })
			
		} else {
			User.findOne({ 'email': req.body.email }, function (err, user2) {
				if (err){
					insights.error(err);
					return res.status(500).send({ message: `Error creating the user: ${err}` })
				}
				if (!user2) {
					return res.status(500).send({ message: `Fail` })
				} else {
					User.findByIdAndUpdate(user2._id, { confirmationCode: randomstring, dateTimeLogin: dateTimeLogin }, { new: true }, (err, userUpdated) => {
						if (err){
							insights.error(err);
							return res.status(500).send({ message: `Error making the request: ${err}` })
						}else{
							if(userUpdated){
								//send email
								serviceEmail.sendEmailLogin(userUpdated.email, userUpdated.confirmationCode)
								return res.status(200).send({
									message: 'Check email'
								})
							}else{
								insights.error("The user does not exist");
								return res.status(404).send({ code: 208, message: `The user does not exist` })
							}
							
						}
						
					})
				}
			})
		}

	})
}
function checkLogin(req, res) {
	User.findOne({ 'email': req.body.email, 'confirmationCode': req.body.confirmationCode }, function (err, user2) {
		if (err){
			insights.error(err);
			return res.status(500).send({ message: `Error creating the user: ${err}` })
		}
		if (!user2) {
			return res.status(500).send({ message: `Fail` })
		} else {
			var limittime = new Date(); // just for example, can be any other time
			var myTimeSpan = 5*60*1000; // 5 minutes in milliseconds
			limittime.setTime(limittime.getTime() - myTimeSpan);
			if(limittime.getTime() < user2.dateTimeLogin.getTime()){
				return res.status(200).send({
					message: 'You have successfully logged in',
					token: serviceAuth.createToken(user2)
				})
			}else{
				return res.status(200).send({
					message: 'Link expired'
				})
			}
		}
	})
}

function sendMsgValidator(req, res) {
	let userId = decrypt(req.params.userId)
	Diseases.findOne({ createdBy: userId}, 'validatorInfo -_id', (err, disease) => {
		if (err) return res.status(500).send({ message: `Error making the request: ${err}` })
		if (!disease) return res.status(200).send({ message: `The user does not exist` })

		serviceEmail.sendMailValidator(req.body.email, req.body.subject, req.body.message, disease.validatorInfo.contactEmail)
		.then(response => {
			return res.status(200).send({ message: 'Email sent' })
		}
		)
		.catch(response => {
			insights.error(response);
			res.status(500).send({ message: 'Fail sending email' })
		})
	})
}

function getProfile(req, res) {
	let userId = decrypt(req.params.userId)
	Diseases.findOne({ createdBy: userId }, 'validatorInfo -_id', (err, disease) => {
		if (err) return res.status(500).send({ message: `Error making the request: ${err}` })
		if (!disease) return res.status(200).send({ message: `The user does not exist` })
		res.status(200).send(disease)
	})

	/*User.findById(userId, 'contactEmail web organization country acceptTerms -_id', (err, user) => {
		if (err) return res.status(500).send({ message: `Error making the request: ${err}` })
		if (!user) return res.status(404).send({ message: `The user does not exist` })

		res.status(200).send({ user })
	})*/
}

function updateProfile(req, res) {
	console.log(req.body)
	let userId = decrypt(req.params.userId)
	let update = {
		contactEmail: req.body.contactEmail,
		web: req.body.web,
		organization: req.body.organization,
		country: req.body.country,
		acceptTerms: req.body.acceptTerms
	}

	Diseases.findOneAndUpdate({ createdBy: userId }, { validatorInfo: update }, { new: true }, (err, diseaseUpdated) => {
		if (err) return res.status(500).send({ message: `Error making the request: ${err}` })
		if (diseaseUpdated) return res.status(200).send({ message: 'Profile updated ' })
		else{
			let disease = new Diseases()
			disease.createdBy = userId
			disease.validatorInfo = update
			disease.save((err, diseaseStored) => {
				if (err) return res.status(500).send({ message: `Error creating the user: ${err}` })
				if (diseaseStored) return res.status(200).send({ message: 'Profile updated ' })
				else return res.status(404).send({ message: `The user does not exist` })
			})
		}
	})

	/*User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
		if (err) return res.status(500).send({ message: `Error making the request: ${err}` })
		if (userUpdated) return res.status(200).send({ message: 'Profile updated ' })
		else return res.status(404).send({ message: `The user does not exist` })
	})*/
}

module.exports = {
	login,
	checkLogin,
	sendMsgValidator,
	getProfile,
	updateProfile
}
