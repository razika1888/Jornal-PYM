// Roda imediatamente (não espera DOMContentLoaded) pra redirecionar o quanto antes
// caso o usuário não esteja autenticado.
(async function protegerPagina() {
    try {
        const resposta = await fetch('/api/auth/me', { credentials: 'include' })

        if (!resposta.ok) {
            window.location.href = 'login.html'
        }
    } catch (erro) {
        console.error('Erro ao verificar autenticação:', erro)
        window.location.href = 'login.html'
    }
})()