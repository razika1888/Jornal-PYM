const db = require('../config/db')

/**
 * Busca um jornalista pelo nome de usuário.
 * Usado tanto no login (verificar se existe) quanto no registro (verificar duplicidade).
 */
async function buscarPorUsuario(usuario) {
    const [linhas] = await db.query(
        'SELECT id_jornalista, nome, usuario, senha_hash FROM jornalistas WHERE usuario = ? LIMIT 1',
        [usuario]
    )
    return linhas[0] || null
}

/**
 * Busca um jornalista pelo id (útil pra restaurar sessão / rota "quem sou eu").
 */
async function buscarPorId(idJornalista) {
    const [linhas] = await db.query(
        'SELECT id_jornalista, nome, usuario, created_at FROM jornalistas WHERE id_jornalista = ? LIMIT 1',
        [idJornalista]
    )
    return linhas[0] || null
}

/**
 * Cria um novo jornalista. Espera que a senha JÁ VENHA como hash (bcrypt).
 */
async function criarJornalista({ nome, usuario, senhaHash }) {
    const [resultado] = await db.query(
        'INSERT INTO jornalistas (nome, usuario, senha_hash) VALUES (?, ?, ?)',
        [nome, usuario, senhaHash]
    )
    return {
        id_jornalista: resultado.insertId,
        nome,
        usuario
    }
}

module.exports = {
    buscarPorUsuario,
    buscarPorId,
    criarJornalista
}