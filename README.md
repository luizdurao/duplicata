# Origin Health — Deduplicador (GitHub Pages + Cloudflare Worker)

Arquitetura 100% gratuita:
- **GitHub Pages** → hospeda o frontend estático
- **Cloudflare Worker** → proxy seguro que guarda a chave Gemini no servidor

```
Navegador → GitHub Pages (HTML)
         → Cloudflare Worker /analyze → Gemini API
```

---

## Estrutura do repositório

```
/
├── docs/
│   └── index.html          ← Frontend (GitHub Pages serve esta pasta)
├── cloudflare-worker.js    ← Código do Worker (cole no painel Cloudflare)
└── README.md
```

---

## Passo 1 — Publicar no GitHub Pages

1. Crie um repositório no GitHub (pode ser privado ou público)
2. Suba todos os arquivos desta pasta
3. Vá em **Settings → Pages**
4. Em *Source*, selecione **Branch: main** e pasta **/ docs**
5. Clique em **Save**
6. Aguarde ~1 min → seu site estará em `https://seu-usuario.github.io/nome-do-repo`

---

## Passo 2 — Criar o Cloudflare Worker (proxy da IA)

### 2.1 Obter chave Gemini
- Acesse https://aistudio.google.com/apikey
- Clique em **Create API Key** e copie a chave (`AIzaSy...`)

### 2.2 Criar o Worker
1. Acesse https://workers.cloudflare.com → crie uma conta gratuita
2. Clique em **Create Worker**
3. Apague o código de exemplo e cole o conteúdo de `cloudflare-worker.js`
4. Clique em **Save and Deploy**
5. Anote a URL do Worker (ex: `https://origin-proxy.seu-usuario.workers.dev`)

### 2.3 Configurar variáveis de ambiente no Worker
1. No painel do Worker, vá em **Settings → Variables**
2. Adicione duas variáveis:

| Nome | Valor |
|------|-------|
| `GEMINI_API_KEY` | `AIzaSy...sua_chave` |
| `ALLOWED_ORIGIN` | `https://seu-usuario.github.io` |

3. Clique em **Save**

---

## Passo 3 — Configurar a URL do Worker no frontend

1. Abra seu site no GitHub Pages
2. Na tela de login, cole a URL do Worker no campo **"URL do Cloudflare Worker"**
   - Exemplo: `https://origin-proxy.seu-usuario.workers.dev/analyze`
3. Clique em **Salvar** — a URL fica guardada no navegador

---

## Credenciais de acesso (demo)

| E-mail | Senha |
|--------|-------|
| `demo@origin.com` | `origin2026` |
| `admin@originhealth.com.br` | `origin@2026` |

> Para adicionar usuários reais, edite o objeto `USERS` em `docs/index.html`.

---

## Por que a chave Gemini está protegida?

- O frontend **nunca recebe** a chave — ela fica somente nas variáveis de ambiente do Worker
- O navegador chama apenas a URL do Worker (`/analyze`)
- O Worker valida a origem (`ALLOWED_ORIGIN`) antes de aceitar requisições
- Mesmo que alguém inspecione o código-fonte do HTML, não encontrará a chave
