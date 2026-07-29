const slugify = require('slugify')
const noticiasModel = require('../models/noticias.model')

/**
 * Transforma o título em slug (ex: "Ataque no Porto!" -> "ataque-no-porto")
 * e garante que seja único, adicionando um sufixo numérico se precisar
 * (ex: "ataque-no-porto-2") já que a coluna slug é UNIQUE no banco.
 */
async function gerarSlugUnico(titulo) {
    const base = slugify(titulo, { lower: true, strict: true, locale: 'pt' })

    let slug = base
    let contador = 2

    while (await noticiasModel.slugExiste(slug)) {
        slug = `${base}-${contador}`
        contador++
    }

    return slug
}

/**
 * POST /api/noticias
 * Protegida por requereAutenticacao + upload.single('articleImage')
 * Body (multipart/form-data): articleTitle, articleContent, articleSection, articleAutor, articleImage (arquivo)
 */
async function criar(req, res) {
    try {
        const { articleTitle, articleContent, articleSection, articleAutor } = req.body
        const jornalistaLogado = req.session.jornalista

        if (!articleTitle?.trim() || !articleContent?.trim() || !articleSection?.trim()) {
            return res.status(400).json({ sucesso: false, mensagem: 'Preencha manchete, texto e seção.' })
        }

        if (!req.file) {
            return res.status(400).json({ sucesso: false, mensagem: 'Selecione uma imagem para a matéria.' })
        }

        const categoriaEncontrada = await noticiasModel.buscarCategoriaPorNome(articleSection.trim())
        if (!categoriaEncontrada) {
            return res.status(400).json({ sucesso: false, mensagem: `A seção "${articleSection}" não existe.` })
        }

        const slug = await gerarSlugUnico(articleTitle.trim())
        const imagemCapa = `/src/images/noticias/${req.file.filename}`

        const idNoticia = await noticiasModel.criarNoticia({
            titulo: articleTitle.trim(),
            slug,
            conteudo: articleContent.trim(),
            assinatura: articleAutor?.trim() || null,
            imagemCapa,
            idJornalista: jornalistaLogado.id,
            idCategoria: categoriaEncontrada.id_categoria
        })

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Matéria enviada com sucesso!',
            noticia: { id: idNoticia, slug }
        })
    } catch (erro) {
        console.error('Erro ao criar notícia:', erro)
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao publicar a matéria.' })
    }
}

/**
 * GET /api/noticias/home
 * Monta os dados pra capa: destaque principal, sidebar, mais notícias e ticker.
 */
async function home(req, res) {
    try {
        const capaLista = await noticiasModel.listarPorCategoria('Capa', 1)
        const capa = capaLista[0] || null

        const sidebar = await noticiasModel.listarPorCategoria('Sidebar', 4)

        const idsUsados = [capa?.id_noticia, ...sidebar.map((n) => n.id_noticia)].filter(Boolean)
        const maisNoticias = await noticiasModel.listarMaisRecentes(12, idsUsados)

        const ticker = await noticiasModel.listarUltimasParaTicker(8)

        return res.status(200).json({ sucesso: true, capa, sidebar, maisNoticias, ticker })
    } catch (erro) {
        console.error('Erro ao montar a home:', erro)
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao carregar as notícias.' })
    }
}

/**
 * GET /api/noticias/:slug
 * Usada pela página individual (noticia.html) pra buscar o conteúdo completo.
 */
async function buscarPorSlug(req, res) {
    try {
        const noticia = await noticiasModel.buscarPorSlug(req.params.slug)

        if (!noticia) {
            return res.status(404).json({ sucesso: false, mensagem: 'Notícia não encontrada.' })
        }

        return res.status(200).json({ sucesso: true, noticia })
    } catch (erro) {
        console.error('Erro ao buscar notícia:', erro)
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar a notícia.' })
    }
}

module.exports = { criar, home, buscarPorSlug }