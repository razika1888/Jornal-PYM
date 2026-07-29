const multer = require('multer')
const path = require('path')
const fs = require('fs')

// As imagens ficam dentro do frontend, pra poderem ser servidas como arquivo estático
// (ex: /src/images/noticias/arquivo.jpg vira acessível direto pelo navegador)
const PASTA_DESTINO = path.join(__dirname, '..', '..', 'frontend', 'src', 'images', 'noticias')

// Garante que a pasta existe antes do multer tentar salvar nela
fs.mkdirSync(PASTA_DESTINO, { recursive: true })

const armazenamento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PASTA_DESTINO)
    },
    filename: (req, file, cb) => {
        const extensao = path.extname(file.originalname).toLowerCase()
        const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`
        cb(null, nomeUnico)
    }
})

function filtroDeArquivo(req, file, cb) {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!tiposPermitidos.includes(file.mimetype)) {
        return cb(new Error('Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.'))
    }
    cb(null, true)
}

const upload = multer({
    storage: armazenamento,
    fileFilter: filtroDeArquivo,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

module.exports = upload