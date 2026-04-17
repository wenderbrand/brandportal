# Brand Portal

> Crie, organize e compartilhe identidades visuais em um link profissional.

**Stack:** Vite 5 + Vanilla JS + CSS puro + Supabase

---

## Estrutura do Projeto

```
brand-portal/
├── index.html
├── main.js                  # Entry point + rotas
├── vite.config.js
├── vercel.json              # Rewrites para SPA
├── supabase-schema.sql      # Schema completo do banco
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── styles/
    │   └── global.css       # Design tokens + componentes base
    ├── lib/
    │   ├── supabase.js      # Cliente Supabase (sem SDK)
    │   ├── router.js        # SPA router por history API
    │   └── utils.js         # Toast, slug, clipboard, upload...
    ├── components/
    │   └── navbar.js
    └── pages/
        ├── landing.js       # Landing page
        ├── auth.js          # Login / Register / Recover
        ├── dashboard.js     # Lista de projetos
        ├── editor.js        # Editor 3 colunas (core)
        └── portal.js        # Portal público (/p/:slug)
```

---

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Copie a **URL** e a **anon key** (Settings → API)

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 4. Criar banco de dados

No Supabase Dashboard → **SQL Editor**, cole e execute o conteúdo de `supabase-schema.sql`.

Isso cria:
- Tabelas: `projects`, `project_content`, `assets`
- Policies RLS (owner + public read)
- Bucket de storage: `assets` (público)

### 5. Rodar em desenvolvimento

```bash
npm run dev
# → http://localhost:3000
```

### 6. Build para produção

```bash
npm run build
```

---

## Deploy na Vercel

1. Push do repo para GitHub
2. Importe o projeto na Vercel
3. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy! O `vercel.json` já garante que as rotas SPA funcionam.

---

## Fluxo do Usuário

```
Landing (/)
  └─ Registro/Login (/register | /login)
       └─ Dashboard (/dashboard)
            ├─ Criar Projeto → Editor (/editor/:id)
            │    ├─ Editar Capa, Logotipo, Cores, Tipografia, Textos, Arquivos
            │    ├─ Salvar (auto-save em alguns campos)
            │    └─ Publicar → gera slug único
            └─ Portal Público (/p/:slug)  ← sem login
```

---

## Design System

Aplicado com base em **ui-ux-pro-max**:

| Token | Valor |
|-------|-------|
| Fundo | `#F7F6F3` (off-white editorial) |
| Texto | `#0D0D0D` |
| Accent | `#C97A1E` (âmbar) |
| Fonte UI | DM Sans |
| Fonte Brand | DM Serif Display |
| Spacing | Sistema 4/8px |
| Radius | 4px / 8px / 12px / 16px |

---

## Banco de Dados

### `projects`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| name | TEXT | Nome da marca |
| logo_url | TEXT | URL da logo no Storage |
| is_published | BOOLEAN | Status de publicação |
| slug | TEXT | URL única do portal |
| created_at | TIMESTAMPTZ | - |

### `project_content`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| project_id | UUID | FK → projects |
| section | TEXT | capa / logotipo / cores / tipografia / textos / arquivos |
| content | JSONB | Dados da seção |

### `assets`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| project_id | UUID | FK → projects |
| file_url | TEXT | URL pública no Storage |
| file_name | TEXT | Nome original do arquivo |
