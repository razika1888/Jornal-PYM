const bcrypt = require('bcrypt')
const authModel = require('../models/auth.model')

const SALT_ROUNDS = 10

/**
 * POST /api/auth/registro
 * Body esperado: { nome, usuario, senha, confirmarSenha }
 */
async function registrar(req, res) {
    try {
        const { nome, usuario, senha, confirmarSenha, codigoConvite } = req.body

        // Validação básica (espelha o que já existe no front, mas nunca confie só no client)
        if (!nome?.trim() || !usuario?.trim() || !senha) {
            return res.status(400).json({ sucesso: false, mensagem: 'Preencha todos os campos obrigatórios.' })
        }

        // Barreira de acesso: só cria conta quem tiver o código de convite correto.
        // Comparado no servidor (nunca confie em validação feita só no front).
        const codigoEsperado = process.env.CODIGO_CADASTRO?.trim()
        if (!codigoEsperado) {
            console.error('CODIGO_CADASTRO não está configurado no .env — bloqueando todos os registros por segurança.')
            return res.status(500).json({ sucesso: false, mensagem: 'Cadastro temporariamente indisponível.' })
        }

        const codigoRecebido = codigoConvite?.trim()

        if (!codigoRecebido || codigoRecebido !== codigoEsperado) {
            return res.status(403).json({ sucesso: false, mensagem: 'Código de convite inválido.' })
        }

        if (senha.length < 6) {
            return res.status(400).json({ sucesso: false, mensagem: 'A senha precisa ter pelo menos 6 caracteres.' })
        }

        if (confirmarSenha !== undefined && senha !== confirmarSenha) {
            return res.status(400).json({ sucesso: false, mensagem: 'As senhas digitadas não coincidem.' })
        }

        const usuarioExistente = await authModel.buscarPorUsuario(usuario.trim())
        if (usuarioExistente) {
            return res.status(409).json({ sucesso: false, mensagem: 'Este usuário já está cadastrado.' })
        }

        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS)

        const novoJornalista = await authModel.criarJornalista({
            nome: nome.trim(),
            usuario: usuario.trim(),
            senhaHash
        })

        // Já loga o jornalista automaticamente após criar a conta
        req.session.jornalista = {
            id: novoJornalista.id_jornalista,
            nome: novoJornalista.nome,
            usuario: novoJornalista.usuario
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Conta criada com sucesso!',
            jornalista: req.session.jornalista
        })
    } catch (erro) {
        console.error('Erro ao registrar jornalista:', erro)
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao criar a conta.' })
    }
}

/**
 * POST /api/auth/login
 * Body esperado: { usuario, senha, lembrar }
 */
async function login(req, res) {
    try {
        const { usuario, senha, lembrar } = req.body

        if (!usuario?.trim() || !senha) {
            return res.status(400).json({ sucesso: false, mensagem: 'Preencha usuário e senha.' })
        }

        const jornalista = await authModel.buscarPorUsuario(usuario.trim())

        // Mensagem genérica de propósito: não revelamos se foi o usuário ou a senha que errou
        if (!jornalista) {
            return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' })
        }

        const senhaConfere = await bcrypt.compare(senha, jornalista.senha_hash)
        if (!senhaConfere) {
            return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' })
        }

        req.session.jornalista = {
            id: jornalista.id_jornalista,
            nome: jornalista.nome,
            usuario: jornalista.usuario
        }

        // "Lembrar de mim" -> estende a duração do cookie de sessão
        if (lembrar) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000 // 30 dias
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            jornalista: req.session.jornalista
        })
    } catch (erro) {
        console.error('Erro ao fazer login:', erro)
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao fazer login.' })
    }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
    req.session.destroy((erro) => {
        if (erro) {
            console.error('Erro ao encerrar sessão:', erro)
            return res.status(500).json({ sucesso: false, mensagem: 'Erro ao encerrar sessão.' })
        }
        res.clearCookie('connect.sid')
        return res.status(200).json({ sucesso: true, mensagem: 'Sessão encerrada.' })
    })
}

/**
 * GET /api/auth/me
 * Retorna o jornalista logado (ou 401 se não houver sessão ativa)
 */
function quemSouEu(req, res) {
    if (!req.session.jornalista) {
        return res.status(401).json({ sucesso: false, mensagem: 'Nenhuma sessão ativa.' })
    }
    return res.status(200).json({ sucesso: true, jornalista: req.session.jornalista })
}

module.exports = {
    registrar,
    login,
    logout,
    quemSouEu
}