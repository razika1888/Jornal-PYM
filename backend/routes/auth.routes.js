const express = require('express')
const router = express.Router()

const authController = require('../controllers/auth.controller')
const { requereAutenticacao } = require('../middlewares/auth.middleware')

router.post('/registro', authController.registrar)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.get('/me', requereAutenticacao, authController.quemSouEu)

module.exports = router