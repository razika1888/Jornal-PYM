document.addEventListener('DOMContentLoaded', () => {
    iniciarImagemUpload()
    iniciarContadores()
    iniciarFormEnviar()
})

function iniciarImagemUpload() {
    const input = document.querySelector('#articleImage')
    const dropzone = document.querySelector('#imageDropzone')
    const preview = document.querySelector('#imagePreview')
    const previewImg = document.querySelector('#imagePreviewImg')
    const removeBtn = document.querySelector('#imageRemove')
    const imageError = document.querySelector('#imageError')

    if (!input || !dropzone || !preview || !previewImg) return;

    const mostrarPreview = (arquivo) => {
        if (!arquivo || !arquivo.type.startsWith('image/')) return

        const leitor = new FileReader()
        leitor.onload = (evento) => {
            previewImg.src = evento.target.result;
            dropzone.hidden = true
            preview.hidden = false;
            if (imageError) imageError.hidden = true
        }
        leitor.readAsDataURL(arquivo)
    }

    input.addEventListener('change', () => {
        if (input.files && input.files[0]) {
            mostrarPreview(input.files[0])
        }
    }); // <- ; adicionado: evita que o próximo bloco, que começa com [,
        //    seja interpretado como acesso de propriedade deste addEventListener

    ['dragenter', 'dragover'].forEach((evtName) => {
        dropzone.addEventListener(evtName, (evento) => {
            evento.preventDefault()
            evento.stopPropagation()
            dropzone.classList.add('is-dragover')
        })
    }); // <- mesmo motivo do ; acima

    ['dragleave', 'drop'].forEach((evtName) => {
        dropzone.addEventListener(evtName, (evento) => {
            evento.preventDefault()
            evento.stopPropagation()
            dropzone.classList.remove('is-dragover')
        })
    })

    dropzone.addEventListener('drop', (evento) => {
        const arquivos = evento.dataTransfer.files
        if (arquivos && arquivos[0]) {
            // Sincroniza o arquivo solto com o input para o formulário reconhecer
            input.files = arquivos
            mostrarPreview(arquivos[0])
        }
    })

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            input.value = ''
            previewImg.src = ''
            preview.hidden = true
            dropzone.hidden = false
        })
    }
}

function iniciarContadores() {
    const tituloInput = document.querySelector('#articleTitle')
    const tituloContador = document.querySelector('#titleCounter')
    const contentInput = document.querySelector('#articleContent')
    const contentCounter = document.querySelector('#contentCounter')

    if (tituloInput && tituloContador) {
        const limite = tituloInput.getAttribute('maxlength') || 120
        const atualizarTitulo = () => {
            tituloContador.textContent = `${tituloInput.value.length} / ${limite}`
        }
        tituloInput.addEventListener('input', atualizarTitulo)
        atualizarTitulo()
    }

    if (contentInput && contentCounter) {
        const atualizarConteudo = () => {
            const texto = contentInput.value.trim()
            const palavras = texto.length ? texto.split(/\s+/).length : 0
            contentCounter.textContent = `${palavras} ${palavras === 1 ? 'palavra' : 'palavras'}`
        }
        contentInput.addEventListener('input', atualizarConteudo)
        atualizarConteudo()
    }
}

function iniciarFormEnviar() {
    const form = document.querySelector('#articleForm')
    const clearBtn = document.querySelector('#clearForm')
    const status = document.querySelector('#formStatus')

    if (!form) return

    const campos = {
        imagem: document.querySelector('#articleImage'),
        titulo: document.querySelector('#articleTitle'),
        conteudo: document.querySelector('#articleContent')
    }

    const erros = {
        imagem: document.querySelector('#imageError'),
        titulo: document.querySelector('#titleError'),
        conteudo: document.querySelector('#contentError')
    }

    function validar() {
        let valido = true

        const temImagem = campos.imagem && campos.imagem.files && campos.imagem.files.length > 0
        if (!temImagem) {
            if (erros.imagem) erros.imagem.hidden = false
            valido = false
        } else if (erros.imagem) {
            erros.imagem.hidden = true
        }

        const temTitulo = campos.titulo && campos.titulo.value.trim().length > 0
        if (!temTitulo) {
            erros.titulo.hidden = false
            campos.titulo.classList.add('is-invalid')
            valido = false
        } else {
            erros.titulo.hidden = true
            campos.titulo.classList.remove('is-invalid')
        }

        const temConteudo = campos.conteudo && campos.conteudo.value.trim().length > 0
        if (!temConteudo) {
            erros.conteudo.hidden = false
            campos.conteudo.classList.add('is-invalid')
            valido = false
        } else {
            erros.conteudo.hidden = true
            campos.conteudo.classList.remove('is-invalid')
        }

        return valido
    }

    function mostrarStatus(mensagem, tipo) {
        if (!status) return
        status.textContent = mensagem
        status.classList.remove('is-success', 'is-error')
        status.classList.add(tipo === 'sucesso' ? 'is-success' : 'is-error')
    }

    function limparStatus() {
        if (!status) return
        status.textContent = ''
        status.classList.remove('is-success', 'is-error')
    }

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault()

        if (!validar()) {
            mostrarStatus('Preencha os campos destacados antes de enviar.', 'erro')
            return
        }

        const botaoEnviar = form.querySelector('.article-form__actions button[type="submit"], .article-form__actions .btn-form--primario')
        if (botaoEnviar) botaoEnviar.disabled = true

        try {
            // FormData pega automaticamente todos os campos com atributo "name" do form,
            // incluindo o arquivo de imagem — não precisa montar isso manualmente.
            const dadosForm = new FormData(form)

            const resposta = await fetch('/api/noticias', {
                method: 'POST',
                credentials: 'include',
                body: dadosForm
            })

            const corpo = await resposta.json().catch(() => ({}))

            if (!resposta.ok) {
                throw new Error(corpo.mensagem || 'Ocorreu um erro ao enviar a matéria.')
            }

            mostrarStatus('Matéria enviada com sucesso! Redirecionando...', 'sucesso')

            setTimeout(() => {
                window.location.href = `/noticia/${corpo.noticia.slug}`
            }, 1200)
        } catch (erro) {
            mostrarStatus(erro.message, 'erro')
        } finally {
            if (botaoEnviar) botaoEnviar.disabled = false
        }
    })

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            form.reset()

            const dropzone = document.querySelector('#imageDropzone')
            const preview = document.querySelector('#imagePreview')
            const previewImg = document.querySelector('#imagePreviewImg')
            if (dropzone && preview && previewImg) {
                previewImg.src = ''
                preview.hidden = true
                dropzone.hidden = false
            }

            Object.values(erros).forEach((el) => { if (el) el.hidden = true });
            campos.titulo.classList.remove('is-invalid')
            campos.conteudo.classList.remove('is-invalid')

            const titleCounter = document.querySelector('#titleCounter')
            const contentCounter = document.querySelector('#contentCounter')
            if (titleCounter) titleCounter.textContent = `0 / ${campos.titulo.getAttribute('maxlength') || 120}`
            if (contentCounter) contentCounter.textContent = '0 palavras'

            limparStatus()
        })
    }
}