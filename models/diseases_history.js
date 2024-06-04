// eventsdb schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema

const { conndbaccounts } = require('../db_connect');


const validatorInfoSchema = Schema({
	contactEmail: { type: String, default: '' },
	web: { type: String, default: '' },
	organization : { type: String, default: '' },
	country: { type: String, default: '' },
	acceptTerms: { type: Boolean, default: false }
})

const DiseasesHistorySchema = Schema({
	id: { type: String, default: ''},
	name: { type: String, default: ''},
	items: {type: Object, default: []},
	date: {type: Date, default: Date.now},
	updated: {type: Date, default: Date.now},
	createdBy: { type: Schema.Types.ObjectId, ref: "User"},
	validatorInfo: { type: validatorInfoSchema, default: null},
})

module.exports = conndbaccounts.model('DiseasesHistory',DiseasesHistorySchema)
// we need to export the model so that it is accessible in the rest of the app
