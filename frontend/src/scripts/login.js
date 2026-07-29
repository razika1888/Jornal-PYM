// Caminho relativo: agora o Express serve o frontend, então front e API são a mesma origem
const API_BASE = '/api/auth'

document.addEventListener('DOMContentLoaded', () => {
    iniciarTabs()
    iniciarPassword()
    iniciarLogin()
    iniciarRegistro()
})

function iniciarTabs() {
    const tabLogin = document.querySelector('#tabLogin')
    const tabRegister = document.querySelector('#tabRegister')

    const loginForm = document.querySelector('#loginForm')
    const registerForm = document.querySelector('#registerForm')

    const status = document.querySelector('#authStatus')

    if (!tabLogin || !tabRegister || !loginForm || !registerForm) return

    function mostrarAba(aba) {
        const isLogin = aba === 'login'

        tabLogin.classList.toggle('is-active', isLogin)
        tabLogin.setAttribute('aria-selected', String(isLogin))

        tabRegister.classList.toggle('is-active', !isLogin)
        tabRegister.setAttribute('aria-selected', String(!isLogin))

        loginForm.classList.toggle('is-active', isLogin)
        loginForm.hidden = !isLogin

        registerForm.classList.toggle('is-active', !isLogin)
        registerForm.hidden = isLogin

        // Limpa qualquer mensagem de status ao trocar de aba
        if (status) {
            status.textContent = ''
            status.classList.remove('is-sucess', 'is-error')
        }
    }

    tabLogin.addEventListener('click', () => mostrarAba('login'))
    tabRegister.addEventListener('click', () => mostrarAba('register'))

    document.querySelectorAll('[data-switch-to]').forEach((botao) => {
        botao.addEventListener('click', () => mostrarAba(botao.dataset.switchTo))
    })
}

function iniciarPassword() {
    document.querySelectorAll('.auth-form__toggle-visibility').forEach((botao) => {
        botao.addEventListener('click', () => {
            const input = document.querySelector(`#${botao.dataset.target}`);
            if (!input) return

            const estaMostrando = input.type === 'text'
            input.type = estaMostrando ? 'password' : 'text'

            botao.innerHTML = estaMostrando
                ? '<i class="fa-solid fa-eye"></i>'
                : '<i class="fa-solid fa-eye-slash"></i>'
            botao.setAttribute('aria-label', estaMostrando ? 'Mostrar senha' : 'Ocultar senha')
        })
    })
}

// Utilitário de mensagem de STATUS
function exibirStatus(mensagem, tipo) {
    const status = document.querySelector('#authStatus')
    if (!status) return
    status.textContent = mensagem
    status.classList.remove('is-sucess', 'is-error')
    status.classList.add(tipo === 'sucesso' ? 'is-sucess' : 'is-error')
}

// Utilitário genérico pra chamar a API de autenticação
async function chamarAuthAPI(endpoint, dados) {
    const resposta = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ESSENCIAL: garante que o cookie de sessão seja enviado/recebido
        body: JSON.stringify(dados)
    })

    const corpo = await resposta.json().catch(() => ({}))

    if (!resposta.ok) {
        // Lança um erro com a mensagem que o backend mandou (ou uma genérica)
        throw new Error(corpo.mensagem || 'Ocorreu um erro. Tente novamente.')
    }

    return corpo
}

function iniciarLogin() {
    const form = document.querySelector('#loginForm')
    if (!form) return

    const email = document.querySelector('#loginEmail')
    const senha = document.querySelector('#loginPassword')
    const erro = document.querySelector('#loginError')
    const botaoSubmit = form.querySelector('.auth-form__submit')

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault()

        const valido = email.value.trim() !== '' && senha.value.trim() !== ''

        email.closest('.auth-form__input-grupo').classList.toggle('is-invalid', email.value.trim() === '')
        senha.closest('.auth-form__input-grupo').classList.toggle('is-invalid', senha.value.trim() === '')

        if (!valido) {
            erro.hidden = false
            exibirStatus('Preencha os campos destacados antes de continuar', 'erro')
            return
        }

        erro.hidden = true
        botaoSubmit.disabled = true

        try {
            const resultado = await chamarAuthAPI('login', {
                usuario: email.value.trim(),
                senha: senha.value,
                lembrar: document.querySelector('#loginRemember').checked
            })

            exibirStatus(resultado.mensagem || 'Login realizado com sucesso! Redirecionando...', 'sucesso')

            setTimeout(() => {
                window.location.href = 'index.html'
            }, 1200)
        } catch (erroApi) {
            erro.hidden = false
            exibirStatus(erroApi.message, 'erro')
        } finally {
            botaoSubmit.disabled = false
        }
    })
}

function iniciarRegistro() {
    const form = document.querySelector('#registerForm')
    if (!form) return

    const nome = document.querySelector('#registerName')
    const usuario = document.querySelector('#registerUsuario')
    const senha = document.querySelector('#registerPassword')
    const confirmar = document.querySelector('#registerPasswordConfirm')
    const codigo = document.querySelector('#registerCodigo')
    const erro = document.querySelector('#registerError')
    const botaoSubmit = form.querySelector('.auth-form__submit')

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault()

        const camposTexto = [nome, usuario, senha, confirmar, codigo]
        let valido = true

        camposTexto.forEach((campo) => {
            const vazio = campo.value.trim() === ''
            campo.closest('.auth-form__input-grupo').classList.toggle('is-invalid', vazio)
            if (vazio) valido = false;
        })

        const senhaCurta = senha.value.length > 0 && senha.value.length < 6
        const senhasDiferentes = senha.value !== confirmar.value;

        if (senhaCurta || senhasDiferentes) {
            senha.closest('.auth-form__input-grupo').classList.add('is-invalid')
            confirmar.closest('.auth-form__input-grupo').classList.add('is-invalid')
            valido = false
        }

        if (!valido) {
            erro.hidden = false
            if (senhaCurta) {
                exibirStatus('A senha precisa ter pelo menos 6 caracteres', 'erro')
            } else if (senhasDiferentes) {
                exibirStatus('As senhas digitas não coincidem', 'erro')
            } else {
                exibirStatus('Preencha os campos destacados antes de continuar', 'erro')
            }
            return
        }

        erro.hidden = true
        botaoSubmit.disabled = true

        try {
            const resultado = await chamarAuthAPI('registro', {
                nome: nome.value.trim(),
                usuario: usuario.value.trim(),
                senha: senha.value,
                confirmarSenha: confirmar.value,
                codigoConvite: codigo.value.trim()
            })

            exibirStatus(resultado.mensagem || 'Conta criada com sucesso! Você já pode entrar no site', 'sucesso')
            form.reset()

            setTimeout(() => {
                window.location.href = 'index.html'
            }, 1200)
        } catch (erroApi) {
            erro.hidden = false
            exibirStatus(erroApi.message, 'erro')
        } finally {
            botaoSubmit.disabled = false
        }
    })
}