# PYM Daily Budge

Site fictício de jornal de super-heróis, com estética pulp retrô (anos 1940/50), construído com arquitetura **MVC** no backend (Node + Express + MySQL) e frontend estático servido pelo próprio Express.

> Publicação diária fictícia cobrindo heróis, vilões e fenômenos na "Pym City". Projeto de estudo/portfólio.

---

## Stack

**Backend**
- Node.js + Express 5
- MySQL (via `mysql2`)
- `express-session` — autenticação baseada em sessão (cookie)
- `bcrypt` — hash de senha
- `multer` — upload de imagem das matérias
- `slugify` — geração de URLs amigáveis
- `cors`, `dotenv`

**Frontend**
- HTML/CSS/JS puro (sem framework)
- Font Awesome (ícones)
- Fontes: Anton (`--font-display`) e Lora (`--font-body`), com `Bodoni Moda` no masthead/títulos de artigo
- Tema claro/escuro com persistência em `localStorage`

---

## Estrutura de pastas

```
projeto/
├── backend/
│   ├── app.js                     # Ponto de entrada — serve o frontend + monta as rotas de API
│   ├── config/
│   │   └── db.js                  # Pool de conexão MySQL
│   ├── controllers/
│   │   ├── auth.controller.js     # Login, registro, logout, /me
│   │   └── noticias.controller.js # Criar matéria, home, buscar por slug
│   ├── models/
│   │   ├── auth.model.js
│   │   └── noticias.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── noticias.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js     # Exige sessão ativa
│   │   └── upload.middleware.js   # Multer (upload de imagem)
│   └── .env                       # Variáveis de ambiente (não versionar)
│
└── frontend/                      # Servido como estático pelo Express (mesma origem do backend)
    ├── index.html                 # Capa — capa/sidebar/grid/ticker dinâmicos
    ├── login.html                 # Entrar / Criar conta (com código de convite)
    ├── postagem.html              # Formulário de publicação (jornalistas logados)
    ├── noticia.html               # Template único de artigo (rota limpa /noticia/:slug)
    └── src/
        ├── styles/                # main.css (tokens), style.css, login.css, postagem.css, noticia.css
        ├── scripts/                # script.js, login.js, criar-materia.js, noticias-home.js, noticia.js,
        │                          # auth-status.js, pagina-protegida.js, clima.js
        └── images/
            └── noticias/           # Imagens enviadas via upload (criadas automaticamente pelo multer)
```

**Importante:** `frontend/` e `backend/` são pastas **irmãs**, no mesmo nível. O Express (`app.js`) serve os arquivos estáticos de `frontend/` e as rotas de API a partir de `backend/`. Não existe mais servidor separado (tipo Live Server) — tudo roda por `http://localhost:3000`.

---

## Banco de dados

```sql
CREATE DATABASE pym_jornal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pym_jornal_db;

CREATE TABLE jornalistas (
    id_jornalista INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE noticias (
    id_noticia INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    subtitulo VARCHAR(300),
    conteudo LONGTEXT NOT NULL,
    assinatura VARCHAR(100),           -- migração adicional (ver abaixo)
    imagem_capa VARCHAR(255),
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_jornalista INT NOT NULL,
    id_categoria INT NOT NULL,
    FOREIGN KEY (id_jornalista) REFERENCES jornalistas(id_jornalista) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON UPDATE CASCADE ON DELETE RESTRICT
);
```

### Migração necessária (coluna adicionada depois)
```sql
ALTER TABLE noticias ADD COLUMN assinatura VARCHAR(100) NULL AFTER conteudo;
```

### Seed obrigatório de categorias
As categorias usadas pela home (`Capa`, `Heróis`, `Sidebar`) precisam existir **exatamente com esses nomes/acentos** (a busca ignora maiúsculo/minúsculo, mas não ignora acento):
```sql
INSERT INTO categorias (nome) VALUES ('Capa'), ('Heróis'), ('Sidebar');
```

---

## Variáveis de ambiente (`backend/.env`)

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=pym_jornal_db

SESSION_SECRET=troque-por-uma-string-aleatoria-longa

# Código exigido pra criar conta de jornalista — troque e não divulgue publicamente
CODIGO_CADASTRO=troque-por-um-codigo

FRONTEND_URL=http://localhost:3000

PORT=3000
NODE_ENV=development
```

---

## Como rodar

```bash
cd backend
npm install
node app.js
```

Acesse **`http://localhost:3000`**.

---

## Autenticação

- **Registro** (`POST /api/auth/registro`): exige nome, usuário, senha (mín. 6 caracteres) e o **código de convite** (`CODIGO_CADASTRO` do `.env`) — é o filtro que impede qualquer pessoa de virar jornalista sem autorização. Senha é hasheada com `bcrypt` antes de salvar.
- **Login** (`POST /api/auth/login`): valida usuário/senha, cria sessão via `express-session` (cookie `httpOnly`). Checkbox "Lembrar de mim" estende o cookie pra 30 dias.
- **Logout** (`POST /api/auth/logout`) e **sessão atual** (`GET /api/auth/me`).
- **Proteção de página** (`pagina-protegida.js`): em páginas restritas (ex: `postagem.html`), checa `/api/auth/me` ao carregar e redireciona pro login se não houver sessão — isso é só UX; a proteção **de verdade** é o middleware `requereAutenticacao` no backend, que bloqueia a criação de matéria mesmo que alguém pule o redirecionamento do front.
- **Botão "Publicar Notícia"** (`auth-status.js`): só é injetado no DOM (markup + estilo) se a checagem de sessão vier positiva — não existe rastro dele no HTML pra quem não está logado.

---

## Publicação de matérias

- **Formulário** (`postagem.html` + `criar-materia.js`): seção (Capa/Heróis/Sidebar), assinatura (nome de exibição opcional), manchete, texto e upload de imagem (drag-and-drop ou clique), tudo enviado via `FormData` (multipart) pro backend.
- **Rota** (`POST /api/noticias`, protegida): valida campos, gera **slug único** a partir do título via `slugify` (com sufixo numérico automático em caso de colisão), salva a imagem em `frontend/src/images/noticias/` via `multer`, grava no banco.
- **Categoria**: a busca da categoria no banco ignora maiúsculo/minúsculo, mas **não** ignora acento — o `value` das `<option>` do formulário precisa bater exatamente com o nome salvo em `categorias` (ex: `Heróis`, com acento).

---

## Página de artigo (`/noticia/:slug`)

- Rota **"limpa"** servida pelo Express (`app.get('/noticia/:slug', ...)`), sempre devolvendo o mesmo template (`noticia.html`) — o conteúdo real vem de `GET /api/noticias/:slug`, lido a partir do slug na própria URL (`noticia.js`).
- Layout: eyebrow fixo, título grande (`Bodoni Moda`), dek opcional, byline (autor + categoria + data) com linha divisória (reaproveitando o estilo `.byline` do site), corpo com capitular no primeiro parágrafo, imagem de capa (se houver) ao final do texto, botão "Voltar à Capa".
- **Atenção:** como essa página vive numa URL aninhada (`/noticia/algo`), todos os caminhos de asset (`css`, `js`, imagens) precisam ser **absolutos** (`/src/...`), nunca relativos — senão o navegador tenta resolver a partir de `/noticia/...` e quebra tudo em 404.

---

## Home dinâmica (`index.html` + `noticias-home.js`)

Busca `GET /api/noticias/home`, que devolve:
- **`capa`**: notícia mais recente da categoria `Capa` → preenche o destaque principal
- **`sidebar`**: até 4 notícias mais recentes da categoria `Sidebar` → preenche "Também em destaque" (cards sobrando somem se houver menos de 4 publicadas)
- **`maisNoticias`**: o restante (excluindo o que já apareceu em capa/sidebar) → grade "Mais Notícias", gerada dinamicamente
- **`ticker`**: últimas notícias publicadas, cada uma virando um link clicável pro artigo (`/noticia/{slug}`)

O layout original de 2 colunas fixas do card de destaque (pensado pra um texto de exemplo estático) foi trocado por um teaser único em bloco, já que o conteúdo real varia de tamanho — o efeito de capitular na primeira letra foi mantido.

---

## Pendências conhecidas / próximos passos

- Botão de busca ao lado de "Assine" no `index.html` (mencionado, ainda não implementado)
- Campo de subtítulo (`subtitulo`) não existe no formulário de postagem atual — hoje sempre fica `null`, e o teaser da home cai pro início do `conteudo`
- Sem paginação na grade "Mais Notícias" (traz até 12 por padrão)
- Sem edição/exclusão de matérias publicadas (só criação)
- Sem painel de administração pra gerenciar jornalistas ou revogar acesso individualmente (o filtro de cadastro é um único código compartilhado — ver limitação abaixo)

### Limitação do código de convite
Por ser um código único e fixo, não dá pra revogar o acesso de uma pessoa específica sem trocar o código pra todo mundo. Uma evolução futura seria uma tabela de convites com códigos de uso único ou expiráveis.
