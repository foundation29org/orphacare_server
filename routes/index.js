// file that contains the routes of the api
'use strict'

const express = require('express')

const userCtrl = require('../controllers/all/user')

const supportCtrl = require('../controllers/all/support')
const feedbackDevCtrl = require('../controllers/all/feedback_dev')
const diseaseCtrl = require('../controllers/all/diseases')

const auth = require('../middlewares/auth')
const roles = require('../middlewares/roles')
const api = express.Router()
const config= require('../config')
const myApiKey = config.Server_Key;

const checkApiKey = (req, res, next) => {
    // Permitir explícitamente solicitudes de tipo OPTIONS para el "preflight" de CORS
    if (req.method === 'OPTIONS') {
      return next();
    } else {
      const apiKey = req.get('x-api-key');
      if (apiKey && apiKey === myApiKey) {
        return next();
      } else {
        return res.status(401).json({ error: 'API Key no válida o ausente' });
      }
    }
  };

// user routes, using the controller user, this controller has methods
//routes for login-logout
api.post('/login', checkApiKey, userCtrl.login)
api.post('/checkLogin', checkApiKey, userCtrl.checkLogin)

api.post('/validator/:userId', userCtrl.sendMsgValidator)
api.get('/profile/:userId', auth(roles.OnlyUser), userCtrl.getProfile)
api.put('/profile/:userId', auth(roles.OnlyUser), userCtrl.updateProfile)

//Support
api.post('/homesupport/', supportCtrl.sendMsgLogoutSupport)


//service feedback
api.post('/feedbackdev', auth(roles.OnlyUser), checkApiKey, feedbackDevCtrl.sendMsgDev)

//disease
api.get('/selectdisease/:userId', diseaseCtrl.selectDisease)
api.get('/disease/:userId', diseaseCtrl.getDisease)
api.put('/disease/:id', auth(roles.OnlyUser), diseaseCtrl.updateDisease)
api.post('/disease/:userId', auth(roles.OnlyUser), diseaseCtrl.saveDisease)
api.post('/deletedisease/:userId', auth(roles.OnlyUser), diseaseCtrl.deleteDisease)

api.get('/searchdisease/:id', diseaseCtrl.searchDisease)
api.get('/validateddiseases', diseaseCtrl.validatedDiseases)

/*api.get('/testToken', auth, (req, res) => {
	res.status(200).send(true)
})*/
//ruta privada
api.get('/private', auth(roles.All), checkApiKey, (req, res) => {
	res.status(200).send({ message: 'You have access' })
})

module.exports = api
