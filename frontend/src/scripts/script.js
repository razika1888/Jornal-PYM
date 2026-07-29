document.addEventListener('DOMContentLoaded', () => {
    iniciarTema()
    iniciarNav()
    iniciarScrollReveal()
})

// Modo Claro / Escuro
function iniciarTema(){
    const STORAGE_KEY = 'dailybudge-theme'
    const button = document.querySelector('#themeToggle')
    if (!button) return

    const aplicarTema = (isDark) => {
        document.body.classList.toggle('dark', isDark)
        button.innerHTML = isDark ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-regular fa-moon"></i>`
        button.setAttribute('aria-pressed', String(isDark))
        button.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro')
    }

    let temaSalvo = null
    try {
        temaSalvo = localStorage.getItem(STORAGE_KEY)
    } catch (erro) {

    }

    const preferenciaEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    aplicarTema(temaSalvo ? temaSalvo === 'dark' : preferenciaEscuro)

    button.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark')
        aplicarTema(isDark)
        try{
            localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
        } catch (erro) {}
    })
}

function iniciarNav() {
    const toggle = document.querySelector('.nav-toggle')
    const navList = document.querySelector('#navList')
    if (!toggle || !navList) return

    toggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('is-open')
        toggle.setAttribute('aria-expanded', String(isOpen))
        toggle.innerHTML = isOpen ? `<i class="fa-solid fa-x"></i> Fechar` : `<i class="fa-solid fa-bars"></i> Seções`
    })

    navList.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navList.classList.remove('is-open')
            toggle.setAttribute('aria-expanded', 'false')
            toggle.innerHTML = `<i class="fa-solid fa-bars"></i> Seções`
        })
    })
}

// O ticker agora é preenchido com notícias reais pelo noticias-home.js

// Revelação Suave dos Cards

function iniciarScrollReveal() {
    const cards = document.querySelectorAll('.news-card')
    if (!cards.length) return

    if(!('IntersectionObserver' in window)) {
        cards.forEach((card) => card.classList.add('is-visible'))
        return
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('is-visible'), index * 60)
                    observer.unobserve(entry.target)
                }
            })
        }, { threshold: 0.15}
    )

    cards.forEach((card) => observer.observe(card))
}