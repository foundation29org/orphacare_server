// user schema
'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt-nodejs')

const { conndbaccounts } = require('../db_connect')

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_TIME = 2 * 60 * 60 * 1000

const SiblingSchema = Schema({
	gender: String,
	affected: { type: String, enum: ['yes', 'no'] }
})

const ParentSchema = Schema({
	highEducation: String,
	profession: String
})

const UserSchema = Schema({
	email: {
		type: String,
		index: true,
		trim: true,
		lowercase: true,
		unique: true,
		required: 'Email address is required',
		match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
	},
	role: { type: String, required: true, enum: ['User'], default: 'User' },
	confirmed: { type: Boolean, default: false },
	confirmationCode: String,
	lastLogin: { type: Date, default: null },
	loginAttempts: { type: Number, required: true, default: 0 },
	lockUntil: { type: Number },
	dateTimeLogin: Date,
	blockedaccount: { type: Boolean, default: false }
})



UserSchema.virtual('isLocked').get(function () {
	// check for a future lockUntil timestamp
	return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.incLoginAttempts = function (cb) {
	// if we have a previous lock that has expired, restart at 1
	if (this.lockUntil && this.lockUntil < Date.now()) {
		return this.update({
			$set: { loginAttempts: 1 },
			$unset: { lockUntil: 1 }
		}, cb);
	}
	// otherwise we're incrementing
	var updates = { $inc: { loginAttempts: 1 } };
	// lock the account if we've reached max attempts and it's not locked already
	if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
		updates.$set = { lockUntil: Date.now() + LOCK_TIME };
	}
	return this.update(updates, cb);
};

// expose enum on the model, and provide an internal convenience reference
var reasons = UserSchema.statics.failedLogin = {
	NOT_FOUND: 0,
	PASSWORD_INCORRECT: 1,
	MAX_ATTEMPTS: 2,
	UNACTIVATED: 3,
	BLOCKED: 4,
};

UserSchema.statics.getAuthenticated = function (email, cb) {
	this.findOne({ email: email }, function (err, user) {
		if (err) return cb(err);
		// make sure the user exists
		if (!user) {
			return cb(null, null, reasons.NOT_FOUND);
		}
		//Check if the account is activated.
		/*if (!user.confirmed) {
			return cb(null, null, reasons.UNACTIVATED);
		}*/
		if (user.blockedaccount) {
			return cb(null, null, reasons.BLOCKED);
		}
		// check if the account is currently locked
		if (user.isLocked) {
			// just increment login attempts if account is already locked
			return user.incLoginAttempts(function (err) {
				if (err) return cb(err);
				return cb(null, null, reasons.MAX_ATTEMPTS);
			});
		}

		if (!user.loginAttempts && !user.lockUntil) {
			var updates = {
				$set: { lastLogin: Date.now() }
			};
			return user.update(updates, function (err) {
				if (err) return cb(err);
				return cb(null, user);
			});
			return cb(null, user)
		}
		// reset attempts and lock info
		var updates = {
			$set: { loginAttempts: 0, lastLogin: Date.now() },
			$unset: { lockUntil: 1 }
		};
		return user.update(updates, function (err) {
			if (err) return cb(err);
			return cb(null, user);
		});
	}).select('_id email loginAttempts lockUntil confirmed lastLogin role dateTimeLogin blockedaccount');
};

module.exports = conndbaccounts.model('User', UserSchema)
// we need to export the model so that it is accessible in the rest of the app
