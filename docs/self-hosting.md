# Self-hosting: Queima Asfalto

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

### Passo 1: Criar projeto Firebase

1. Abre [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Escolhe um **Project ID** (ex.: `meu-queima-asfalto`). Guarda-o para `.firebaserc` e variáveis `VITE_*`.
3. Google Analytics: opcional (a app suporta `measurementId`; podes activar ou usar um ID vazio se não usares Analytics; se o build exigir valor, activa Analytics no projeto).

### Passo 2: Plano Blaze

1. Console → **Upgrade** → **Blaze**.
2. Configura um orçamento/alerta de billing no Google Cloud (recomendado).

Sem Blaze não consegues activar **Storage** nem fazer deploy de **Cloud Functions** Gen 2 com agendamento.

### Passo 3: Activar produtos

No projeto Firebase:

| Produto | Console | Notas |
|---------|---------|-------|
| **Authentication** | Build → Authentication → Get started | Provider **Google** (passo 4) |
| **Firestore** | Build → Firestore → Create database | Modo **production**; região à tua escolha (ex. `europe-west1`) |
| **Storage** | Build → Storage → Get started | Regras iniciais; o deploy sobrescreve com `storage.rules`. Para o backup incluir os ficheiros de fotos/vídeos, configura **CORS** no bucket (ver abaixo) |
| **Hosting** | Build → Hosting → Get started | O deploy envia `dist/` |
| **Functions** | Será activado no primeiro `firebase deploy --only functions` | Node **24** (ver `firebase.json`) |

#### CORS no bucket (necessário para o backup com fotos e vídeos)

O backup lê os ficheiros com a API `getBytes` do Storage, que é sujeita a CORS. Sem isto, o backup ainda funciona, mas só com os metadados das fotos e vídeos.

```bash
cat > cors.json <<'JSON'
[{ "origin": ["https://TEU-PROJETO.web.app"], "method": ["GET"], "maxAgeSeconds": 3600 }]
JSON
gcloud storage buckets update gs://TEU-PROJETO.appspot.com --cors-file=cors.json
```

Substitui `TEU-PROJETO` e acrescenta `http://localhost:5173` se quiseres testar em dev.

### Passo 4: Authentication (Google)

1. **Authentication → Sign-in method → Google → Enable**.
2. Define um **support email** do projeto.
3. **Authentication → Settings → Authorized domains**: por agora garante `localhost`; adicionas o domínio de produção após o deploy (passo 12).

### Passo 5: Registar Web App

1. **Project settings** (ícone engrenagem) → **Your apps → Web** (`</>`).
2. Regista a app (nickname à escolha).
3. Copia o objeto `firebaseConfig`. Vais mapeá-lo para `.env.local`:

| Campo `firebaseConfig` | Variável `.env.local` |
|------------------------|------------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |
| `measurementId` | `VITE_FIREBASE_MEASUREMENT_ID` |

> **Nota:** em `VITE_FIREBASE_AUTH_DOMAIN`, usa o **domínio de hosting** da app (ex.: `your-project.web.app`) em vez do `your-project.firebaseapp.com` sugerido pela consola; caso contrário, o login falha no Safari/iOS. Ver [`configuration.md`](./configuration.md#authdomain-e-safariios).

### Passo 6: FCM / Web Push (notificações)

1. **Project settings → Cloud Messaging → Web Push certificates**.
2. **Generate key pair** (se ainda não existir).
3. Copia a chave pública para `VITE_FIREBASE_VAPID_KEY` em `.env.local`.

Os utilizadores activam notificações em **Definições** na app. Sem VAPID, o registo de push falha.

### Passo 7: Geoapify (localizações)

1. Cria conta em [geoapify.com](https://www.geoapify.com/).
2. **API Keys → Create key**.
3. Copia para `VITE_GEOAPIFY_API_KEY`.
4. Após deploy, restringe por HTTP Referer. Ver [`console-restrictions.md`](./console-restrictions.md).

Sem Geoapify a app funciona; autocomplete de local e geocodificação no formulário de eventos ficam indisponíveis.

### Passo 8: Clonar e instalar

```bash
git clone https://github.com/Seven-Panda-Labs/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
```

### Passo 9: Ficheiros de configuração local

```bash
cp .env.example .env.local
cp .firebaserc.example .firebaserc
cp functions/.env.example functions/.env
```

1. **`.env.local`**: preenche todas as variáveis `VITE_*` (passos 5-7).
2. **`.firebaserc`**: substitui `your-firebase-project-id` pelo teu Project ID.
3. **`functions/.env`** (opcional):
   - `FUNCTIONS_REGION=europe-west1` (predefinição; deve coincidir com `VITE_FIREBASE_FUNCTIONS_REGION` se definida e com a `region` do rewrite `/api/account-approval` em `firebase.json`)
   - `FUNCTIONS_SERVICE_ACCOUNT=firebase-adminsdk-xxxxx@YOUR_PROJECT.iam.gserviceaccount.com`: email em **Project settings → Service accounts**
   - `SCHEDULER_TIMEZONE=Europe/Lisbon`: fuso dos lembretes agendados

Detalhes de todas as variáveis: [`configuration.md`](./configuration.md).

### Passo 9b: Aprovação de contas novas (opcional)

Por defeito, qualquer utilizador com Google Sign-In pode usar a instância. Para exigir **aprovação manual** de novos registos (útil em self-hosting fechado), activa o fluxo da issue [#176](https://github.com/Seven-Panda-Labs/queima-asfalto/issues/176).

**Requisitos extra**

| Requisito | Motivo |
|-----------|--------|
| [Identity Platform](https://firebase.google.com/docs/auth#identity-platform) no projeto Firebase | Cloud Functions de blocking (`beforeUserCreated` / `beforeUserSignedIn`) |
| Conta [Resend](https://resend.com/) + domínio/remetente verificado | Emails ao admin (aprovar/rejeitar) e ao utilizador |
| Deploy de **Hosting + Functions** | Rewrite `/api/account-approval` → `accountApprovalAction` (já em `firebase.json`) |

**Configuração**

1. **`.env.local`:** `VITE_ACCOUNT_APPROVAL_REQUIRED=true`
2. **`functions/.env`** (com `ACCOUNT_APPROVAL_REQUIRED=true`):
   - `APP_PUBLIC_URL`: URL pública da PWA (ex. `https://YOUR_PROJECT.web.app`)
   - `RESEND_API_KEY`, `EMAIL_FROM`: API e remetente Resend
   - `APPROVAL_TOKEN_SECRET`: segredo aleatório (≥16 caracteres) para links nos emails
   - `INSTANCE_NAME` (opcional): nome nos emails
3. Volta a fazer **`npm run build`** e **`firebase deploy`** (ou `npm run deploy`) para aplicar env nas Functions e o rewrite no Hosting.

**Primeiro arranque: promover o administrador**

Não há variável de administrador. O administrador é um utilizador com `admin: true`, e é ele que recebe os emails de aprovação. Numa instância nova ainda não existe nenhum, logo a primeira conta tem de ser promovida à mão, uma vez:

1. Entra na app com a tua conta. Ficas em «pendente», o que é esperado.
2. No Firebase Console → Firestore → `users/{o teu uid}`, acrescenta `admin: true` (boolean) e muda `accountStatus` para `approved`.
3. A partir daí, cada registo novo envia-te email, e nenhum cliente consegue escrever estes dois campos: as regras tornam-nos imutáveis do browser.

Se removeres o `admin` de todos os utilizadores, ninguém recebe os emails de aprovação e voltas a precisar da consola. Não é um estado que a app impeça.

**Fluxo**

1. Novo utilizador entra com Google → ecrã «À espera de aprovação».
2. Admin recebe email com links **Aprovar** / **Rejeitar**.
3. Utilizador aprovado recebe email e pode usar a app; rejeitado vê mensagem e não acede aos dados.

Sem esta opção, ignora este passo, a instância mantém o comportamento anterior.

### Passo 10: Firebase CLI

```bash
npm install -g firebase-tools   # ou: npx firebase ...
firebase login
firebase use --add YOUR_PROJECT_ID
```

Confirma que `firebase projects:list` mostra o projeto correcto.

### Passo 11: Testar localmente (opcional)

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173), entra com Google. Se falhar o login, confirma `localhost` nos domínios autorizados.

Para desenvolvimento local **sem este projeto Firebase** (ou sem tocar em produção), usa a Firebase Emulator Suite. Guia em [`emulators.md`](./emulators.md). Modo híbrido (projeto real + Functions emuladas): `VITE_FUNCTIONS_EMULATOR=true`.

### Passo 12: Deploy

```bash
npm run deploy
```

Este comando:
1. Compila TypeScript e faz build Vite → `dist/`
2. Faz deploy de **Hosting**, **Firestore rules**, **índices**, **Storage rules** e **Cloud Functions**

O catálogo Parkrun já não é sincronizado no build: a função agendada
`syncParkrunCatalog` refresca-o semanalmente para `parkrunCatalog/global` no
Firestore. A app só recorre à cópia em `src/data/parkrun-events.json` quando
esse documento não existe ou está parado há mais de 45 dias — instâncias sem
Cloud Functions continuam a funcionar com essa cópia, que podes actualizar
com `npm run sync:parkrun-events`.

**Descoberta de provas (opcional, desligada por defeito).** A função agendada
`harvestRaceCatalog` lê os sitemaps das fontes que activares e escreve as provas
que encontra em `raceCatalog`, sempre como `unreviewed`, e nunca por cima do que
uma pessoa reviu. Não corre nada sem `DISCOVERY_SOURCES` em `functions/.env`:

```
DISCOVERY_SOURCES=acorrer.pt
```

Sem essa variável a função sai imediatamente. É deliberado: a colheita lê
páginas de terceiros, e essa decisão é de quem opera a instância, não de quem
actualiza a versão. Antes de activar uma fonte, lê o `robots.txt` e os termos
dela: as que estão na lista foram escolhidas por permitirem o sitemap e
publicarem `schema.org`, mas isso pode mudar sem aviso.

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
| `syncParkrunCatalog` | Agendada (semanal, Cloud Scheduler) |
| `harvestRaceCatalog` | Agendada (semanal; só corre com `DISCOVERY_SOURCES`) |
| `accountApprovalBeforeUserCreated`, `accountApprovalBeforeUserSignedIn` | Blocking Auth (só se `ACCOUNT_APPROVAL_REQUIRED=true`) |
| `accountApprovalAction` | HTTP (links de aprovação; rewrite Hosting `/api/account-approval`) |

Região predefinida: **`europe-west1`**. Limites de escala (`maxInstances`, `concurrency`): [`cloud-functions-limits.md`](./cloud-functions-limits.md).

### Passo 13: Pós-deploy

1. **Hosting URL:** Console → Hosting → `https://YOUR_PROJECT.web.app`
2. **Authentication → Authorized domains:** adiciona `YOUR_PROJECT.web.app` e `YOUR_PROJECT.firebaseapp.com`
3. **Restrições de chaves:** segue [`console-restrictions.md`](./console-restrictions.md) (Browser key Firebase + Geoapify)
4. **OAuth (Google Cloud):** Credentials → Web client → origins com `https://YOUR_PROJECT.web.app` e `http://localhost:5173`
5. **Privacidade:** preenche e publica o modelo em [`privacy-policy-template.md`](./privacy-policy-template.md) (RGPD; o self-hoster é responsável pelo tratamento)

### Passo 14: Verificar

- [ ] Login com Google em produção
- [ ] Criar/editar evento com localização (Geoapify)
- [ ] Upload de foto num evento (Storage)
- [ ] Exportar backup em Definições → Dados com «Incluir os ficheiros de fotos e vídeos» e confirmar que o `.zip` traz a pasta `media/` (requer CORS)
- [ ] Importar resultado oficial num evento com URL de timing (Cloud Function `lookupOfficialResults`)
- [ ] Confirmar que o aviso `/aviso-resultados` está acessível (incluído na app; ver [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md))
- [ ] Convite de partilha por email (Cloud Function `inviteShare`)
- [ ] Activar notificações em Definições (FCM)
- [ ] (Opcional) Com aprovação activa: registo de utilizador de teste → email ao admin → aprovar → login completo

### Domínio customizado (opcional)

1. **Hosting → Add custom domain**: segue o assistente DNS.
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
| Backup sem a pasta `media/` | Falta **CORS** no bucket (ver Passo 3), ou as fotos/vídeos passam do limite de 300 MB. Sem CORS o backup continua a funcionar, mas só com metadados |
| Aprovação: login bloqueado / sem email | Identity Platform activo; `functions/.env` completo; Resend e domínio OK; redeploy Functions + Hosting |
| Link de aprovação inválido | `APPROVAL_TOKEN_SECRET` igual ao deploy; token expirado (7 dias); `APP_PUBLIC_URL` correcto |

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

### Step 1: Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Choose a **Project ID** (e.g. `my-queima-asfalto`). use it in `.firebaserc` and `VITE_*` variables.
3. Google Analytics: optional (the app supports `measurementId`; enable Analytics or provide a value if your build requires it).

### Step 2: Blaze plan

1. Console → **Upgrade** → **Blaze**.
2. Set a billing budget/alert in Google Cloud (recommended).

Without Blaze you cannot enable **Storage** or deploy Gen 2 **Cloud Functions** with scheduling.

### Step 3: Enable products

In your Firebase project:

| Product | Console | Notes |
|---------|---------|-------|
| **Authentication** | Build → Authentication → Get started | **Google** provider (step 4) |
| **Firestore** | Build → Firestore → Create database | **Production** mode; pick a region (e.g. `europe-west1`) |
| **Storage** | Build → Storage → Get started | Initial rules; deploy overwrites with `storage.rules`. For backups to include the photo/video files, configure **CORS** on the bucket (see below) |
| **Hosting** | Build → Hosting → Get started | Deploy sends `dist/` |
| **Functions** | Enabled on first `firebase deploy --only functions` | Node **24** (see `firebase.json`) |

#### Bucket CORS (required for backups with photos and videos)

The backup reads the files with the Storage `getBytes` API, which is subject to CORS. Without it the backup still works, but only with photo and video metadata.

```bash
cat > cors.json <<'JSON'
[{ "origin": ["https://YOUR-PROJECT.web.app"], "method": ["GET"], "maxAgeSeconds": 3600 }]
JSON
gcloud storage buckets update gs://YOUR-PROJECT.appspot.com --cors-file=cors.json
```

Replace `YOUR-PROJECT`, and add `http://localhost:5173` if you want to test in dev.

### Step 4: Authentication (Google)

1. **Authentication → Sign-in method → Google → Enable**.
2. Set a project **support email**.
3. **Authentication → Settings → Authorized domains**: ensure `localhost` is present; add production domain after deploy (step 12).

### Step 5: Register Web App

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

> **Note:** for `VITE_FIREBASE_AUTH_DOMAIN`, use the app's **hosting domain** (e.g. `your-project.web.app`) instead of the `your-project.firebaseapp.com` value the console suggests; otherwise sign-in fails on Safari/iOS. See [`configuration.md`](./configuration.md#authdomain-and-safariios).

### Step 6: FCM / Web Push (notifications)

1. **Project settings → Cloud Messaging → Web Push certificates**.
2. **Generate key pair** (if none exists).
3. Copy the public key to `VITE_FIREBASE_VAPID_KEY` in `.env.local`.

Users enable notifications in **Settings**. Without VAPID, push registration fails.

### Step 7: Geoapify (locations)

1. Create an account at [geoapify.com](https://www.geoapify.com/).
2. **API Keys → Create key**.
3. Copy to `VITE_GEOAPIFY_API_KEY`.
4. After deploy, restrict HTTP Referer. See [`console-restrictions.md`](./console-restrictions.md).

Without Geoapify the app works; location autocomplete and geocoding on the event form are unavailable.

### Step 8: Clone and install

```bash
git clone https://github.com/Seven-Panda-Labs/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
```

### Step 9: Local configuration files

```bash
cp .env.example .env.local
cp .firebaserc.example .firebaserc
cp functions/.env.example functions/.env
```

1. **`.env.local`**: fill all `VITE_*` variables (steps 5-7).
2. **`.firebaserc`**: replace `your-firebase-project-id` with your Project ID.
3. **`functions/.env`** (optional):
   - `FUNCTIONS_REGION=europe-west1` (default; must match `VITE_FIREBASE_FUNCTIONS_REGION` if set and the `region` of the `/api/account-approval` rewrite in `firebase.json`)
   - `FUNCTIONS_SERVICE_ACCOUNT=firebase-adminsdk-xxxxx@YOUR_PROJECT.iam.gserviceaccount.com`: from **Project settings → Service accounts**
   - `SCHEDULER_TIMEZONE=Europe/Lisbon`: time zone for scheduled reminders

All variables: [`configuration.md`](./configuration.md).

### Step 9b: New account approval (optional)

By default, any Google Sign-In user can use the instance. To require **manual approval** for new sign-ups (useful for closed self-hosting), enable the flow from issue [#176](https://github.com/Seven-Panda-Labs/queima-asfalto/issues/176).

**Extra requirements**

| Requirement | Why |
|-------------|-----|
| [Identity Platform](https://firebase.google.com/docs/auth#identity-platform) on the Firebase project | Blocking Cloud Functions (`beforeUserCreated` / `beforeUserSignedIn`) |
| [Resend](https://resend.com/) account + verified domain/sender | Emails to admin (approve/reject) and to the user |
| Deploy **Hosting + Functions** | Rewrite `/api/account-approval` → `accountApprovalAction` (already in `firebase.json`) |

**Configuration**

1. **`.env.local`:** `VITE_ACCOUNT_APPROVAL_REQUIRED=true`
2. **`functions/.env`** (with `ACCOUNT_APPROVAL_REQUIRED=true`):
   - `APP_PUBLIC_URL`: public PWA URL (e.g. `https://YOUR_PROJECT.web.app`)
   - `RESEND_API_KEY`, `EMAIL_FROM`: Resend API and sender
   - `APPROVAL_TOKEN_SECRET`: random secret (≥16 characters) for email links
   - `INSTANCE_NAME` (optional): name in emails
3. Run **`npm run build`** and **`firebase deploy`** (or `npm run deploy`) again so Functions env and the Hosting rewrite apply.

**First run: promoting the administrator**

There is no administrator variable. The administrator is a user with `admin: true`, and that is who the approval emails go to. A fresh instance has none, so the first account is promoted by hand, once:

1. Sign in with your account. You land on "pending", which is expected.
2. In Firebase Console → Firestore → `users/{your uid}`, add `admin: true` (boolean) and set `accountStatus` to `approved`.
3. From then on every new sign-up emails you, and no client can write either field: the rules make them immutable from the browser.

If you remove `admin` from every user, nobody receives the approval emails and you are back to needing the console. The app does not prevent that state.

**Flow**

1. New user signs in with Google → “Waiting for approval” screen.
2. Admin receives email with **Approve** / **Reject** links.
3. Approved user gets email and can use the app; rejected users see a message and cannot access data.

If you do not need this, skip this step, the instance keeps the previous behavior.

### Step 10: Firebase CLI

```bash
npm install -g firebase-tools   # or: npx firebase ...
firebase login
firebase use --add YOUR_PROJECT_ID
```

Confirm `firebase projects:list` shows the correct project.

### Step 11: Test locally (optional)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with Google. If login fails, check `localhost` in authorized domains.

For local development **without this Firebase project** (or without touching production), use the Firebase Emulator Suite. See [`emulators.md`](./emulators.md). Hybrid mode (real project + emulated Functions): `VITE_FUNCTIONS_EMULATOR=true`.

### Step 12: Deploy

```bash
npm run deploy
```

This command:
1. Compiles TypeScript and Vite build → `dist/`
2. Deploys **Hosting**, **Firestore rules**, **indexes**, **Storage rules**, and **Cloud Functions**

The Parkrun catalog is no longer synced at build time: the `syncParkrunCatalog`
scheduled function refreshes `parkrunCatalog/global` in Firestore every week.
The app falls back to the committed `src/data/parkrun-events.json` only when
that document is missing or has been stalled for over 45 days, so instances
without Cloud Functions keep working from that copy — refresh it with
`npm run sync:parkrun-events`.

**Race discovery (optional, off by default).** The `harvestRaceCatalog`
scheduled function reads the sitemaps of the sources you enable and writes what
it finds into `raceCatalog`, always as `unreviewed` and never over anything a
person reviewed. Nothing runs without `DISCOVERY_SOURCES` in `functions/.env`:

```
DISCOVERY_SOURCES=acorrer.pt
```

Without that variable the function returns immediately. That is deliberate: a
harvest reads third-party pages, and that decision belongs to whoever operates
the instance, not to whoever upgrades it. Before enabling a source, read its
`robots.txt` and its terms: the ones on the list were picked for allowing the
sitemap and publishing `schema.org`, and either can change without notice.

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
| `syncParkrunCatalog` | Scheduled (weekly, Cloud Scheduler) |
| `harvestRaceCatalog` | Scheduled (weekly; only runs with `DISCOVERY_SOURCES`) |
| `accountApprovalBeforeUserCreated`, `accountApprovalBeforeUserSignedIn` | Blocking Auth (only if `ACCOUNT_APPROVAL_REQUIRED=true`) |
| `accountApprovalAction` | HTTP (approval links; Hosting rewrite `/api/account-approval`) |

Default region: **`europe-west1`**. Scaling limits (`maxInstances`, `concurrency`): [`cloud-functions-limits.md`](./cloud-functions-limits.md).

### Step 13: Post-deploy

1. **Hosting URL:** Console → Hosting → `https://YOUR_PROJECT.web.app`
2. **Authentication → Authorized domains:** add `YOUR_PROJECT.web.app` and `YOUR_PROJECT.firebaseapp.com`
3. **Key restrictions:** follow [`console-restrictions.md`](./console-restrictions.md) (Firebase Browser key + Geoapify)
4. **OAuth (Google Cloud):** Credentials → Web client → origins with `https://YOUR_PROJECT.web.app` and `http://localhost:5173`
5. **Privacy:** fill in and publish [`privacy-policy-template.md`](./privacy-policy-template.md) (GDPR; the self-hoster is the data controller)

### Step 14: Verify

- [ ] Google Sign-In in production
- [ ] Create/edit event with location (Geoapify)
- [ ] Upload photo on an event (Storage)
- [ ] Export a backup in Settings → Data with “Include the photo and video files” and confirm the `.zip` contains the `media/` folder (needs CORS)
- [ ] Import official result on a timed event URL (`lookupOfficialResults`)
- [ ] Confirm the `/aviso-resultados` notice is reachable (built into the app; see [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md))
- [ ] Share invite by email (`inviteShare`)
- [ ] Enable notifications in Settings (FCM)
- [ ] (Optional) With approval enabled: test sign-up → admin email → approve → full access

### Custom domain (optional)

1. **Hosting → Add custom domain**: follow the DNS wizard.
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
| Backup has no `media/` folder | Bucket **CORS** is missing (see step 3), or the photos/videos exceed the 300 MB limit. Without CORS the backup still works, metadata only |
| Approval: blocked login / no email | Identity Platform enabled; complete `functions/.env`; Resend and domain OK; redeploy Functions + Hosting |
| Invalid approval link | Same `APPROVAL_TOKEN_SECRET` as deploy; token expired (7 days); correct `APP_PUBLIC_URL` |
