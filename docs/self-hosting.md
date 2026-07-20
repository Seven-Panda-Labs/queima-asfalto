# Self-hosting — Queima Asfalto

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Guia passo-a-passo para fazer deploy da tua própria instância no **teu** projeto Firebase.

**Documentação relacionada:** [`configuration.md`](./configuration.md) (variáveis) · [`console-restrictions.md`](./console-restrictions.md) (segurança no Console) · [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md) (scraping de sites de timing e ToS) · [`architecture.md`](./architecture.md) (diagrama e fluxos)

### O que vais precisar

| Requisito | Motivo |
|-----------|--------|
| Conta Google | Firebase Console |
| **Plano Blaze** (pay-as-you-go) | Storage, Cloud Functions (Gen 2), Cloud Scheduler (lembretes) |
| Node.js **24** | Build da app e scripts |
| [Firebase CLI](https://firebase.google.com/docs/cli) | Deploy |
| Conta [Geoapify](https://www.geoapify.com/) | Autocomplete e mapa de eventos (opcional mas recomendado) |

Custos típicos para uso pessoal/pequeno grupo: na maior parte dos casos dentro das quotas gratuitas do Firebase, excepto Functions/Scheduler que dependem do tráfego.

### Visão geral da arquitectura

```
Browser (PWA) ──► Firebase Hosting (dist/)
       │
       ├── Auth (Google Sign-In)
       ├── Firestore (dados por utilizador)
       ├── Storage (fotos/vídeos de eventos)
       ├── Cloud Functions (europe-west1)
       │     ├── lookupOfficialResults (importação de resultados)
       │     ├── inviteShare / … (partilhas)
       │     └── dispatchReminders (agendada, cada 60 min)
       ├── FCM Web Push (notificações)
       └── Geoapify API (geocodificação no browser)
```

---

### Passo 1 — Criar projeto Firebase

1. Abre [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Escolhe um **Project ID** (ex.: `meu-queima-asfalto`) — guarda-o para `.firebaserc` e variáveis `VITE_*`.
3. Google Analytics: opcional (a app suporta `measurementId`; podes activar ou usar um ID vazio se não usares Analytics — se o build exigir valor, activa Analytics no projeto).

### Passo 2 — Plano Blaze

1. Console → **Upgrade** → **Blaze**.
2. Configura um orçamento/alerta de billing no Google Cloud (recomendado).

Sem Blaze não consegues activar **Storage** nem fazer deploy de **Cloud Functions** Gen 2 com agendamento.

### Passo 3 — Activar produtos

No projeto Firebase:

| Produto | Console | Notas |
|---------|---------|-------|
| **Authentication** | Build → Authentication → Get started | Provider **Google** (passo 4) |
| **Firestore** | Build → Firestore → Create database | Modo **production**; região à tua escolha (ex. `europe-west1`) |
| **Storage** | Build → Storage → Get started | Regras iniciais; o deploy sobrescreve com `storage.rules` |
| **Hosting** | Build → Hosting → Get started | O deploy envia `dist/` |
| **Functions** | Será activado no primeiro `firebase deploy --only functions` | Node **24** (ver `firebase.json`) |

### Passo 4 — Authentication (Google)

1. **Authentication → Sign-in method → Google → Enable**.
2. Define um **support email** do projeto.
3. **Authentication → Settings → Authorized domains** — por agora garante `localhost`; adicionas o domínio de produção após o deploy (passo 12).

### Passo 5 — Registar Web App

1. **Project settings** (ícone engrenagem) → **Your apps → Web** (`</>`).
2. Regista a app (nickname à escolha).
3. Copia o objeto `firebaseConfig` — vais mapeá-lo para `.env.local`:

| Campo `firebaseConfig` | Variável `.env.local` |
|------------------------|------------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |
| `measurementId` | `VITE_FIREBASE_MEASUREMENT_ID` |

### Passo 6 — FCM / Web Push (notificações)

1. **Project settings → Cloud Messaging → Web Push certificates**.
2. **Generate key pair** (se ainda não existir).
3. Copia a chave pública para `VITE_FIREBASE_VAPID_KEY` em `.env.local`.

Os utilizadores activam notificações em **Definições** na app. Sem VAPID, o registo de push falha.

### Passo 7 — Geoapify (localizações)

1. Cria conta em [geoapify.com](https://www.geoapify.com/).
2. **API Keys → Create key**.
3. Copia para `VITE_GEOAPIFY_API_KEY`.
4. Após deploy, restringe por HTTP Referer — ver [`console-restrictions.md`](./console-restrictions.md).

Sem Geoapify a app funciona; autocomplete de local e geocodificação no formulário de eventos ficam indisponíveis.

### Passo 8 — Clonar e instalar

```bash
git clone https://github.com/xmajox/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
```

### Passo 9 — Ficheiros de configuração local

```bash
cp .env.example .env.local
cp .firebaserc.example .firebaserc
cp functions/.env.example functions/.env
```

1. **`.env.local`** — preenche todas as variáveis `VITE_*` (passos 5–7).
2. **`.firebaserc`** — substitui `your-firebase-project-id` pelo teu Project ID.
3. **`functions/.env`** (opcional):
   - `FUNCTIONS_REGION=europe-west1` (predefinição; deve coincidir com `VITE_FIREBASE_FUNCTIONS_REGION` se definida)
   - `FUNCTIONS_SERVICE_ACCOUNT=firebase-adminsdk-xxxxx@YOUR_PROJECT.iam.gserviceaccount.com` — email em **Project settings → Service accounts**
   - `SCHEDULER_TIMEZONE=Europe/Lisbon` — fuso dos lembretes agendados

### Passo 10 — Firebase CLI

```bash
npm install -g firebase-tools   # ou: npx firebase ...
firebase login
firebase use --add YOUR_PROJECT_ID
```

Confirma que `firebase projects:list` mostra o projeto correcto.

### Passo 11 — Testar localmente (opcional)

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173), entra com Google. Se falhar o login, confirma `localhost` nos domínios autorizados.

Para desenvolvimento local **sem este projeto Firebase** (ou sem tocar em produção), usa a Firebase Emulator Suite — guia em [`emulators.md`](./emulators.md). Modo híbrido (projeto real + Functions emuladas): `VITE_FUNCTIONS_EMULATOR=true`.

### Passo 12 — Deploy

```bash
npm run deploy
```

Este comando:
1. Sincroniza catálogo Parkrun (`sync:parkrun-events`)
2. Compila TypeScript e faz build Vite → `dist/`
3. Faz deploy de **Hosting**, **Firestore rules**, **índices**, **Storage rules** e **Cloud Functions**

Deploy parcial:

| Comando | O quê |
|---------|--------|
| `npm run deploy:hosting` | Só frontend (após `npm run build`) |
| `firebase deploy --only firestore:rules,firestore:indexes` | Só regras/índices |
| `firebase deploy --only functions` | Só Functions |
| `firebase deploy --only storage` | Só Storage rules |

**Primeiro deploy de Functions:** o CLI pode pedir para activar APIs (Cloud Build, Artifact Registry, Cloud Run, Cloud Scheduler). Aceita.

**Functions deployadas:**

| Função | Tipo |
|--------|------|
| `lookupOfficialResults` | Callable (importação resultados oficiais) |
| `inviteShare`, `acceptShare`, `declineShare`, `revokeShare`, `updateSharePermissions`, `listShares`, `getSharedSnapshot`, `createSharedBucketListItem`, `updateSharedBucketListItem`, `deleteSharedBucketListItem` | Callable (partilhas) |
| `dispatchReminders` | Agendada (cada 60 min, Cloud Scheduler) |

Região predefinida: **`europe-west1`**. Limites de escala (`maxInstances`, `concurrency`): [`cloud-functions-limits.md`](./cloud-functions-limits.md).

### Passo 13 — Pós-deploy

1. **Hosting URL:** Console → Hosting → `https://YOUR_PROJECT.web.app`
2. **Authentication → Authorized domains:** adiciona `YOUR_PROJECT.web.app` e `YOUR_PROJECT.firebaseapp.com`
3. **Restrições de chaves:** segue [`console-restrictions.md`](./console-restrictions.md) (Browser key Firebase + Geoapify)
4. **OAuth (Google Cloud):** Credentials → Web client → origins com `https://YOUR_PROJECT.web.app` e `http://localhost:5173`
5. **Privacidade:** preenche e publica o modelo em [`privacy-policy-template.md`](./privacy-policy-template.md) (RGPD; o self-hoster é responsável pelo tratamento)

### Passo 14 — Verificar

- [ ] Login com Google em produção
- [ ] Criar/editar evento com localização (Geoapify)
- [ ] Upload de foto num evento (Storage)
- [ ] Importar resultado oficial num evento com URL de timing (Cloud Function `lookupOfficialResults`)
- [ ] Confirmar que o aviso `/aviso-resultados` está acessível (incluído na app; ver [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md))
- [ ] Convite de partilha por email (Cloud Function `inviteShare`)
- [ ] Activar notificações em Definições (FCM)

### Domínio customizado (opcional)

1. **Hosting → Add custom domain** — segue o assistente DNS.
2. Adiciona o domínio em **Authentication → Authorized domains**.
3. Actualiza referrers na chave API Firebase e na chave Geoapify.

### Resolução de problemas

| Sintoma | Verificar |
|---------|-----------|
| Login falha em produção | Domínio em Authorized domains; OAuth Web client origins |
| `Missing VITE_*` no build | `.env.local` completo antes de `npm run build` |
| Callable `internal` / CORS | Functions deployadas na mesma região que `VITE_FIREBASE_FUNCTIONS_REGION` |
| Push não funciona | `VITE_FIREBASE_VAPID_KEY`; permissão do browser; utilizador activou notificações |
| Geoapify 403 | Referrers na chave Geoapify; domínio de produção incluído |
| `dispatchReminders` não corre | Plano Blaze; Cloud Scheduler API activa; logs em Functions → `dispatchReminders` |
| Storage upload negado | Regras deployadas; utilizador autenticado; ficheiro dentro dos limites (`storage.rules`) |

---

<a id="english"></a>

## English

[Português](#portugues)

Step-by-step guide to deploy your own instance on **your** Firebase project.

**Related docs:** [`configuration.md`](./configuration.md) (variables) · [`console-restrictions.md`](./console-restrictions.md) (console security) · [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md) (timing site scraping and ToS) · [`architecture.md`](./architecture.md) (diagrams and flows)

### What you need

| Requirement | Reason |
|-------------|--------|
| Google account | Firebase Console |
| **Blaze plan** (pay-as-you-go) | Storage, Cloud Functions (Gen 2), Cloud Scheduler (reminders) |
| Node.js **24** | App build and scripts |
| [Firebase CLI](https://firebase.google.com/docs/cli) | Deploy |
| [Geoapify](https://www.geoapify.com/) account | Event location autocomplete and map (optional but recommended) |

Typical cost for personal/small-group use: usually within Firebase free-tier quotas, except Functions/Scheduler which depend on traffic.

### Architecture overview

```
Browser (PWA) ──► Firebase Hosting (dist/)
       │
       ├── Auth (Google Sign-In)
       ├── Firestore (per-user data)
       ├── Storage (event photos/videos)
       ├── Cloud Functions (europe-west1)
       │     ├── lookupOfficialResults (official results import)
       │     ├── inviteShare / … (sharing)
       │     └── dispatchReminders (scheduled, every 60 min)
       ├── FCM Web Push (notifications)
       └── Geoapify API (browser geocoding)
```

---

### Step 1 — Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Choose a **Project ID** (e.g. `my-queima-asfalto`) — use it in `.firebaserc` and `VITE_*` variables.
3. Google Analytics: optional (the app supports `measurementId`; enable Analytics or provide a value if your build requires it).

### Step 2 — Blaze plan

1. Console → **Upgrade** → **Blaze**.
2. Set a billing budget/alert in Google Cloud (recommended).

Without Blaze you cannot enable **Storage** or deploy Gen 2 **Cloud Functions** with scheduling.

### Step 3 — Enable products

In your Firebase project:

| Product | Console | Notes |
|---------|---------|-------|
| **Authentication** | Build → Authentication → Get started | **Google** provider (step 4) |
| **Firestore** | Build → Firestore → Create database | **Production** mode; pick a region (e.g. `europe-west1`) |
| **Storage** | Build → Storage → Get started | Initial rules; deploy overwrites with `storage.rules` |
| **Hosting** | Build → Hosting → Get started | Deploy sends `dist/` |
| **Functions** | Enabled on first `firebase deploy --only functions` | Node **24** (see `firebase.json`) |

### Step 4 — Authentication (Google)

1. **Authentication → Sign-in method → Google → Enable**.
2. Set a project **support email**.
3. **Authentication → Settings → Authorized domains** — ensure `localhost` is present; add production domain after deploy (step 12).

### Step 5 — Register Web App

1. **Project settings** (gear) → **Your apps → Web** (`</>`).
2. Register the app (any nickname).
3. Copy the `firebaseConfig` object into `.env.local`:

| `firebaseConfig` field | `.env.local` variable |
|------------------------|---------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |
| `measurementId` | `VITE_FIREBASE_MEASUREMENT_ID` |

### Step 6 — FCM / Web Push (notifications)

1. **Project settings → Cloud Messaging → Web Push certificates**.
2. **Generate key pair** (if none exists).
3. Copy the public key to `VITE_FIREBASE_VAPID_KEY` in `.env.local`.

Users enable notifications in **Settings**. Without VAPID, push registration fails.

### Step 7 — Geoapify (locations)

1. Create an account at [geoapify.com](https://www.geoapify.com/).
2. **API Keys → Create key**.
3. Copy to `VITE_GEOAPIFY_API_KEY`.
4. After deploy, restrict HTTP Referer — see [`console-restrictions.md`](./console-restrictions.md).

Without Geoapify the app works; location autocomplete and geocoding on the event form are unavailable.

### Step 8 — Clone and install

```bash
git clone https://github.com/xmajox/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
```

### Step 9 — Local configuration files

```bash
cp .env.example .env.local
cp .firebaserc.example .firebaserc
cp functions/.env.example functions/.env
```

1. **`.env.local`** — fill all `VITE_*` variables (steps 5–7).
2. **`.firebaserc`** — replace `your-firebase-project-id` with your Project ID.
3. **`functions/.env`** (optional):
   - `FUNCTIONS_REGION=europe-west1` (default; must match `VITE_FIREBASE_FUNCTIONS_REGION` if set)
   - `FUNCTIONS_SERVICE_ACCOUNT=firebase-adminsdk-xxxxx@YOUR_PROJECT.iam.gserviceaccount.com` — from **Project settings → Service accounts**
   - `SCHEDULER_TIMEZONE=Europe/Lisbon` — time zone for scheduled reminders

### Step 10 — Firebase CLI

```bash
npm install -g firebase-tools   # or: npx firebase ...
firebase login
firebase use --add YOUR_PROJECT_ID
```

Confirm `firebase projects:list` shows the correct project.

### Step 11 — Test locally (optional)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with Google. If login fails, check `localhost` in authorized domains.

For local development **without this Firebase project** (or without touching production), use the Firebase Emulator Suite — see [`emulators.md`](./emulators.md). Hybrid mode (real project + emulated Functions): `VITE_FUNCTIONS_EMULATOR=true`.

### Step 12 — Deploy

```bash
npm run deploy
```

This command:
1. Syncs the Parkrun catalog (`sync:parkrun-events`)
2. Compiles TypeScript and Vite build → `dist/`
3. Deploys **Hosting**, **Firestore rules**, **indexes**, **Storage rules**, and **Cloud Functions**

Partial deploy:

| Command | What |
|---------|------|
| `npm run deploy:hosting` | Frontend only (after `npm run build`) |
| `firebase deploy --only firestore:rules,firestore:indexes` | Rules/indexes only |
| `firebase deploy --only functions` | Functions only |
| `firebase deploy --only storage` | Storage rules only |

**First Functions deploy:** the CLI may ask to enable APIs (Cloud Build, Artifact Registry, Cloud Run, Cloud Scheduler). Accept.

**Deployed functions:**

| Function | Type |
|----------|------|
| `lookupOfficialResults` | Callable (official results import) |
| `inviteShare`, `acceptShare`, `declineShare`, `revokeShare`, `updateSharePermissions`, `listShares`, `getSharedSnapshot`, `createSharedBucketListItem`, `updateSharedBucketListItem`, `deleteSharedBucketListItem` | Callable (sharing) |
| `dispatchReminders` | Scheduled (every 60 min, Cloud Scheduler) |

Default region: **`europe-west1`**. Scaling limits (`maxInstances`, `concurrency`): [`cloud-functions-limits.md`](./cloud-functions-limits.md).

### Step 13 — Post-deploy

1. **Hosting URL:** Console → Hosting → `https://YOUR_PROJECT.web.app`
2. **Authentication → Authorized domains:** add `YOUR_PROJECT.web.app` and `YOUR_PROJECT.firebaseapp.com`
3. **Key restrictions:** follow [`console-restrictions.md`](./console-restrictions.md) (Firebase Browser key + Geoapify)
4. **OAuth (Google Cloud):** Credentials → Web client → origins with `https://YOUR_PROJECT.web.app` and `http://localhost:5173`
5. **Privacy:** fill in and publish [`privacy-policy-template.md`](./privacy-policy-template.md) (GDPR; the self-hoster is the data controller)

### Step 14 — Verify

- [ ] Google Sign-In in production
- [ ] Create/edit event with location (Geoapify)
- [ ] Upload photo on an event (Storage)
- [ ] Import official result on a timed event URL (`lookupOfficialResults`)
- [ ] Confirm the `/aviso-resultados` notice is reachable (built into the app; see [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md))
- [ ] Share invite by email (`inviteShare`)
- [ ] Enable notifications in Settings (FCM)

### Custom domain (optional)

1. **Hosting → Add custom domain** — follow the DNS wizard.
2. Add the domain in **Authentication → Authorized domains**.
3. Update referrers on the Firebase API key and Geoapify key.

### Troubleshooting

| Symptom | Check |
|---------|-------|
| Login fails in production | Domain in Authorized domains; OAuth Web client origins |
| `Missing VITE_*` on build | Complete `.env.local` before `npm run build` |
| Callable `internal` / CORS | Functions deployed in same region as `VITE_FIREBASE_FUNCTIONS_REGION` |
| Push not working | `VITE_FIREBASE_VAPID_KEY`; browser permission; user enabled notifications |
| Geoapify 403 | Referrers on Geoapify key; production domain included |
| `dispatchReminders` not running | Blaze plan; Cloud Scheduler API enabled; Functions logs for `dispatchReminders` |
| Storage upload denied | Rules deployed; authenticated user; file within limits (`storage.rules`) |
