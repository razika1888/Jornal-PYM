/**
 * Bloqueia o acesso a rotas que exigem um jornalista logado.
 * Uso: router.get('/rota-protegida', requereAutenticacao, controller.metodo)
 */
function requereAutenticacao(req, res, next) {
    if (!req.session?.jornalista) {
        return res.status(401).json({ sucesso: false, mensagem: 'Você precisa estar logado para acessar este recurso.' })
    }
    next()
}

module.exports = { requereAutenticacao }