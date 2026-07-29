require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const session = require('express-session')

const authRoutes = require('./routes/auth.routes')
const noticiasRoutes = require('./routes/noticias.routes')

const app = express()

// Pasta do frontend (irmã da pasta backend)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend')

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================
// CORS não é mais estritamente necessário já que front e back são servidos
// pela mesma origem agora, mas deixamos configurado por segurança/flexibilidade
// (ex: se um dia você rodar o front separado de novo, tipo em dev).
app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: process.env.SESSION_SECRET || 'troque-este-segredo-no-env',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // exige HTTPS em produção
        maxAge: 24 * 60 * 60 * 1000 // 1 dia por padrão ("lembrar de mim" estende isso no login)
    }
}))

// ============================================
// ARQUIVOS ESTÁTICOS DO FRONTEND
// (index.html, login.html, src/styles, src/scripts, src/images, etc.)
// ============================================
app.use(express.static(FRONTEND_DIR))

// ============================================
// ROTAS "LIMPAS" DE PÁGINAS DINÂMICAS
// O HTML é sempre o mesmo template; o slug na URL é lido pelo JS do lado do cliente.
// IMPORTANTE: essas rotas de página precisam vir ANTES das rotas de API abaixo.
// ============================================
app.get('/noticia/:slug', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'noticia.html'))
})

// ============================================
// ROTAS DE API
// ============================================
app.use('/api/auth', authRoutes)
app.use('/api/noticias', noticiasRoutes)

app.get('/api/status', (req, res) => {
    res.json({ status: 'online', servico: 'PYM Daily Budge API' })
})

// ============================================
// TRATAMENTO DE ROTA NÃO ENCONTRADA
// ============================================
app.use((req, res) => {
    res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' })
})

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORTA = process.env.PORT || 3000

app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`)
})

module.exports = app