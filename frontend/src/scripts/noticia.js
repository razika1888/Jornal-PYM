document.addEventListener('DOMContentLoaded', carregarNoticia)

async function carregarNoticia() {
    const elCarregando = document.querySelector('#noticiaCarregando')
    const elErro = document.querySelector('#noticiaErro')
    const elWrapper = document.querySelector('#noticiaCorpoWrapper')

    const slug = extrairSlugDaUrl()

    if (!slug) {
        exibirErro(elCarregando, elErro, elWrapper)
        return
    }

    try {
        const resposta = await fetch(`/api/noticias/${encodeURIComponent(slug)}`)

        if (!resposta.ok) {
            exibirErro(elCarregando, elErro, elWrapper)
            return
        }

        const dados = await resposta.json()

        if (!dados.sucesso || !dados.noticia) {
            exibirErro(elCarregando, elErro, elWrapper)
            return
        }

        renderizarNoticia(dados.noticia)

        elCarregando.hidden = true
        elWrapper.hidden = false
    } catch (erro) {
        console.error('Erro ao carregar notícia:', erro)
        exibirErro(elCarregando, elErro, elWrapper)
    }
}

// A URL segue o padrão /noticia/algum-slug-aqui (rota "limpa" servida pelo Express)
function extrairSlugDaUrl() {
    const partes = window.location.pathname.split('/').filter(Boolean)
    // partes = ['noticia', 'algum-slug-aqui']
    if (partes.length < 2 || partes[0] !== 'noticia') return null
    return partes[1]
}

function exibirErro(elCarregando, elErro, elWrapper) {
    elCarregando.hidden = true
    elWrapper.hidden = true
    elErro.hidden = false
}

function renderizarNoticia(noticia) {
    document.title = `PYM DAILY BUDGE | ${noticia.titulo}`

    document.querySelector('#noticiaTitulo').textContent = noticia.titulo
    document.querySelector('#noticiaAutor').textContent = noticia.autor

    const elSubtitulo = document.querySelector('#noticiaSubtitulo')
    if (noticia.subtitulo) {
        elSubtitulo.textContent = noticia.subtitulo
        elSubtitulo.hidden = false
    }

    const dataFormatada = formatarData(noticia.data_publicacao)
    document.querySelector('#noticiaMeta').textContent = `${noticia.categoria?.toUpperCase() || ''} — ${dataFormatada}`

    const elTexto = document.querySelector('#noticiaTexto')
    elTexto.innerHTML = '' // limpa antes de preencher
    montarParagrafos(noticia.conteudo).forEach((paragrafo) => {
        const p = document.createElement('p')
        p.textContent = paragrafo
        elTexto.appendChild(p)
    })

    if (noticia.imagem_capa) {
        const elFigura = document.querySelector('#noticiaFigura')
        const elImagem = document.querySelector('#noticiaImagem')
        elImagem.src = noticia.imagem_capa
        elImagem.alt = noticia.titulo
        elFigura.hidden = false
    }
}

// Quebra o texto corrido em parágrafos, separando por linha em branco ou quebra simples
function montarParagrafos(conteudo) {
    return conteudo
        .split(/\n+/)
        .map((trecho) => trecho.trim())
        .filter((trecho) => trecho.length > 0)
}

function formatarData(dataISO) {
    const data = new Date(dataISO)
    if (Number.isNaN(data.getTime())) return ''

    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}