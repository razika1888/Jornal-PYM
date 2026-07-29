document.addEventListener('DOMContentLoaded', () => {
    // Só roda na home (evita erro em outras páginas que não têm essa estrutura)
    if (!document.querySelector('#destaque')) return
    carregarHome()
})

async function carregarHome() {
    try {
        const resposta = await fetch('/api/noticias/home')
        if (!resposta.ok) return

        const dados = await resposta.json()
        if (!dados.sucesso) return

        montarTicker(dados.ticker || [])
        montarCapa(dados.capa)
        montarSidebar(dados.sidebar || [])
        montarGrid(dados.maisNoticias || [])
    } catch (erro) {
        console.error('Erro ao carregar notícias da home:', erro)
    }
}

// ============================================
// TICKER — substitui as manchetes fixas por notícias reais e clicáveis
// ============================================
function montarTicker(itens) {
    const track = document.querySelector('.ticker__track')
    if (!track) return

    track.innerHTML = ''

    if (itens.length === 0) {
        const vazio = document.createElement('span')
        vazio.textContent = 'Nenhuma notícia publicada ainda.'
        track.appendChild(vazio)
        return
    }

    const criarItem = (item, escondido) => {
        const link = document.createElement('a')
        link.href = `/noticia/${item.slug}`
        link.innerHTML = `<i class="fa-solid fa-star" style="color: rgb(180, 4, 4);"></i> ${item.titulo}`
        if (escondido) link.setAttribute('aria-hidden', 'true')
        return link
    }

    // Duplica a lista uma vez, igual ao comportamento original,
    // pra manter a rolagem contínua sem espaço em branco no fim.
    itens.forEach((item) => track.appendChild(criarItem(item, false)))
    itens.forEach((item) => track.appendChild(criarItem(item, true)))
}

// ============================================
// CAPA — destaque principal (categoria "Capa", mais recente)
// ============================================
function montarCapa(noticia) {
    const artigo = document.querySelector('.hero-main')
    if (!artigo) return

    if (!noticia) {
        artigo.querySelector('.hero-main__body h2').textContent = 'Nenhuma notícia publicada ainda'
        return
    }

    const figura = artigo.querySelector('.hero-main__figure img')
    const legenda = artigo.querySelector('.hero-main__figure figcaption')
    const eyebrow = artigo.querySelector('.hero-main__body .eyebrow')
    const titulo = artigo.querySelector('.hero-main__body h2')
    const autorEl = artigo.querySelector('#autor')
    const horarioEl = artigo.querySelector('#horarioPostagem')
    const textoContainer = artigo.querySelector('.hero-main__body .text')
    const linkCompleto = artigo.querySelector('.hero-main__body .read-more')

    if (noticia.imagem_capa) figura.src = noticia.imagem_capa
    figura.alt = noticia.titulo
    legenda.textContent = 'Foto: PYM Daily Budge'

    eyebrow.textContent = `Capa • ${noticia.categoria}`
    titulo.textContent = noticia.titulo

    autorEl.textContent = noticia.assinatura || noticia.autor
    horarioEl.textContent = formatarData(noticia.data_publicacao)

    // O layout original espera 2 parágrafos numa grade fixa; como o texto real
    // varia de tamanho, trocamos por um teaser único em bloco normal (o efeito
    // de capitular na primeira letra continua funcionando, ele mira o <p> em si).
    textoContainer.style.display = 'block'
    textoContainer.innerHTML = `<p>${montarTeaser(noticia)}</p>`

    linkCompleto.href = `/noticia/${noticia.slug}`
}

// ============================================
// SIDEBAR — "Também em destaque" (categoria "Sidebar", até 4 mais recentes)
// ============================================
function montarSidebar(itens) {
    const cards = document.querySelectorAll('.hero-sidebar .sidebar-story')

    cards.forEach((card, indice) => {
        const noticia = itens[indice]

        if (!noticia) {
            card.style.display = 'none'
            return
        }

        card.style.display = ''

        const img = card.querySelector('.sidebar-story__figure img')
        const eyebrow = card.querySelector('.eyebrow')
        const link = card.querySelector('h3 a')
        const paragrafo = card.querySelector('.sidebar-story__content p')

        if (noticia.imagem_capa) img.src = noticia.imagem_capa
        img.alt = noticia.titulo

        eyebrow.textContent = noticia.categoria
        link.textContent = noticia.titulo
        link.href = `/noticia/${noticia.slug}`
        paragrafo.textContent = montarTeaser(noticia, 110)
    })
}

// ============================================
// GRID — "Mais Notícias" (o restante, sem repetir capa/sidebar)
// ============================================
function montarGrid(itens) {
    const grid = document.querySelector('.news-grid')
    if (!grid) return

    grid.innerHTML = ''

    if (itens.length === 0) {
        const vazio = document.createElement('p')
        vazio.textContent = 'Nenhuma outra notícia publicada ainda.'
        grid.appendChild(vazio)
        return
    }

    itens.forEach((noticia) => {
        const link = document.createElement('a')
        link.href = `/noticia/${noticia.slug}`
        link.className = 'news-card__seletor'

        link.innerHTML = `
            <article class="news-card news-card--media">
                <figure class="news-card__figure">
                    <img src="${noticia.imagem_capa || ''}" alt="${escaparHtml(noticia.titulo)}">
                </figure>
                <div class="news-card__body">
                    <span class="eyebrow">${escaparHtml(noticia.categoria)}</span>
                    <h3>${escaparHtml(noticia.titulo)}</h3>
                    <p>${escaparHtml(montarTeaser(noticia, 90))}</p>
                    <span class="read-more">Continuar lendo →</span>
                </div>
            </article>
        `

        grid.appendChild(link)
    })

    // iniciarScrollReveal já existe globalmente (definida em script.js).
    // Como os cards acabaram de ser criados, precisamos rodar de novo
    // pra eles ganharem a animação de entrada.
    if (typeof iniciarScrollReveal === 'function') iniciarScrollReveal()
}

// ============================================
// UTILITÁRIOS
// ============================================
function montarTeaser(noticia, limiteCaracteres = 220) {
    const base = noticia.subtitulo?.trim() || noticia.conteudo?.trim() || ''
    if (base.length <= limiteCaracteres) return base
    return `${base.slice(0, limiteCaracteres).trim()}…`
}

function formatarData(dataISO) {
    const data = new Date(dataISO)
    if (Number.isNaN(data.getTime())) return ''
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function escaparHtml(texto) {
    const div = document.createElement('div')
    div.textContent = texto ?? ''
    return div.innerHTML
}