// Caminho relativo: agora o Express serve o frontend, então front e API são a mesma origem
const AUTH_API_BASE = '/api/auth'

document.addEventListener('DOMContentLoaded', verificarAcessoJornalista)

async function verificarAcessoJornalista() {
    try {
        const resposta = await fetch(`${AUTH_API_BASE}/me`, {
            method: 'GET',
            credentials: 'include' // necessário pra mandar o cookie de sessão
        })

        // Não autenticado (401) ou qualquer outro erro: simplesmente não mostra o botão
        if (!resposta.ok) return

        const dados = await resposta.json()

        if (dados.sucesso && dados.jornalista) {
            exibirBotaoPublicar(dados.jornalista)
        }
    } catch (erro) {
        // Backend fora do ar, sem CORS configurado, etc. Falha silenciosa: não exibe o botão.
        console.error('Não foi possível verificar o acesso de jornalista:', erro)
    }
}

function exibirBotaoPublicar(jornalista) {
    if (document.querySelector('#btnPublicarNoticia')) return // evita duplicar se rodar 2x

    injetarEstiloBotaoPublicar()

    const link = document.createElement('a')
    link.id = 'btnPublicarNoticia'
    link.href = 'postagem.html'
    link.className = 'btn-publicar-noticia'
    link.title = `Publicar nova notícia (${jornalista.nome})`
    link.innerHTML = '<i class="fa-solid fa-pen-nib"></i> Publicar Notícia'

    document.body.appendChild(link)
}

function injetarEstiloBotaoPublicar() {
    if (document.querySelector('#estiloBotaoPublicar')) return

    const style = document.createElement('style')
    style.id = 'estiloBotaoPublicar'
    style.textContent = `
        .btn-publicar-noticia {
            position: fixed;
            top: 110px;
            right: 28px;
            z-index: 999;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: var(--red);
            color: var(--cream);
            font-family: var(--font-display);
            font-size: 0.85rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            text-decoration: none;
            border: var(--border-thick);
            box-shadow: var(--shadow-card-sm);
            transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }

        .btn-publicar-noticia:hover {
            background: var(--red-bright);
            transform: translate(-2px, -2px);
            box-shadow: var(--shadow-card);
        }

        .btn-publicar-noticia:active {
            transform: translate(0, 0);
            box-shadow: 2px 2px 0 var(--ink);
        }

        .btn-publicar-noticia i {
            font-size: 0.9em;
        }

        @media (max-width: 640px) {
            .btn-publicar-noticia {
                top: auto;
                bottom: 20px;
                right: 16px;
                padding: 10px 16px;
                font-size: 0.75rem;
            }
        }
    `
    document.head.appendChild(style)
}