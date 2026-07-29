const db = require('../config/db')

async function buscarCategoriaPorNome(nome) {
    const [linhas] = await db.query(
        'SELECT id_categoria, nome FROM categorias WHERE LOWER(nome) = LOWER(?) LIMIT 1',
        [nome]
    )
    return linhas[0] || null
}

async function slugExiste(slug) {
    const [linhas] = await db.query(
        'SELECT id_noticia FROM noticias WHERE slug = ? LIMIT 1',
        [slug]
    )
    return linhas.length > 0
}

async function criarNoticia({ titulo, slug, subtitulo, conteudo, assinatura, imagemCapa, idJornalista, idCategoria }) {
    const [resultado] = await db.query(
        `INSERT INTO noticias (titulo, slug, subtitulo, conteudo, assinatura, imagem_capa, id_jornalista, id_categoria)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, slug, subtitulo || null, conteudo, assinatura || null, imagemCapa || null, idJornalista, idCategoria]
    )
    return resultado.insertId
}

// Usada na página individual da notícia (noticia.html)
async function buscarPorSlug(slug) {
    const [linhas] = await db.query(
        `SELECT n.id_noticia, n.titulo, n.slug, n.subtitulo, n.conteudo, n.assinatura, n.imagem_capa, n.data_publicacao,
                j.nome AS autor, c.nome AS categoria
         FROM noticias n
         JOIN jornalistas j ON j.id_jornalista = n.id_jornalista
         JOIN categorias c ON c.id_categoria = n.id_categoria
         WHERE n.slug = ?
         LIMIT 1`,
        [slug]
    )
    return linhas[0] || null
}

// Usada pra montar a capa (destaque principal) e a sidebar
async function listarPorCategoria(nomeCategoria, limite) {
    const [linhas] = await db.query(
        `SELECT n.id_noticia, n.titulo, n.slug, n.subtitulo, n.conteudo, n.assinatura, n.imagem_capa, n.data_publicacao,
                j.nome AS autor, c.nome AS categoria
         FROM noticias n
         JOIN jornalistas j ON j.id_jornalista = n.id_jornalista
         JOIN categorias c ON c.id_categoria = n.id_categoria
         WHERE c.nome = ?
         ORDER BY n.data_publicacao DESC
         LIMIT ?`,
        [nomeCategoria, limite]
    )
    return linhas
}

// Usada pra "Mais Notícias": o restante, sem repetir o que já apareceu na capa/sidebar
async function listarMaisRecentes(limite, excluirIds = []) {
    let query = `
        SELECT n.id_noticia, n.titulo, n.slug, n.subtitulo, n.conteudo, n.assinatura, n.imagem_capa, n.data_publicacao,
               j.nome AS autor, c.nome AS categoria
        FROM noticias n
        JOIN jornalistas j ON j.id_jornalista = n.id_jornalista
        JOIN categorias c ON c.id_categoria = n.id_categoria
    `
    const params = []

    if (excluirIds.length > 0) {
        query += ` WHERE n.id_noticia NOT IN (${excluirIds.map(() => '?').join(',')}) `
        params.push(...excluirIds)
    }

    query += ` ORDER BY n.data_publicacao DESC LIMIT ?`
    params.push(limite)

    const [linhas] = await db.query(query, params)
    return linhas
}

// Usada pro ticker de manchetes
async function listarUltimasParaTicker(limite) {
    const [linhas] = await db.query(
        `SELECT titulo, slug FROM noticias ORDER BY data_publicacao DESC LIMIT ?`,
        [limite]
    )
    return linhas
}

module.exports = {
    buscarCategoriaPorNome,
    slugExiste,
    criarNoticia,
    buscarPorSlug,
    listarPorCategoria,
    listarMaisRecentes,
    listarUltimasParaTicker
}