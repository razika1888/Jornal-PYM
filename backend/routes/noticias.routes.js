const express = require('express')
const router = express.Router()

const noticiasController = require('../controllers/noticias.controller')
const { requereAutenticacao } = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')

// IMPORTANTE: /home precisa vir ANTES de /:slug, senão o Express
// vai interpretar "home" como se fosse um slug de notícia.
router.get('/home', noticiasController.home)
router.get('/:slug', noticiasController.buscarPorSlug)

router.post('/', requereAutenticacao, upload.single('articleImage'), noticiasController.criar)

module.exports = router