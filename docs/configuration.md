# Configuração: Queima Asfalto

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Referência de variáveis de ambiente e ficheiros de configuração para desenvolvimento local, deploy e self-hosting.

### Web app (`.env.local`)

Copia [`.env.example`](../.env.example) para `.env.local` na raiz do projeto.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_FIREBASE_API_KEY` | Sim | `apiKey` da Web App Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sim | `authDomain`, usa o domínio onde a app é servida (ex.: `your-project.web.app`). Ver [nota abaixo](#authdomain-e-safariios) |
| `VITE_FIREBASE_PROJECT_ID` | Sim | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sim | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sim | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Sim | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Sim | `measurementId` (Analytics) |
| `VITE_FIREBASE_VAPID_KEY` | Não* | Web Push (FCM); necessário para notificações |
| `VITE_GEOAPIFY_API_KEY` | Não* | Autocomplete e geocodificação de locais |
| `VITE_FIREBASE_FUNCTIONS_REGION` | Não | Região das Cloud Functions (predefinição: `europe-west1`) |
| `VITE_APP_STORAGE_PREFIX` | Não | Prefixo de `localStorage` (predefinição: `VITE_FIREBASE_PROJECT_ID`) |
| `VITE_USE_FIREBASE_EMULATORS` | Não | `true` para Auth, Firestore, Storage e Functions emulados, ver [`emulators.md`](./emulators.md) |
| `VITE_FUNCTIONS_EMULATOR` | Não | `true` para **só** Functions emuladas (modo híbrido com projeto real) |
| `VITE_ACCOUNT_APPROVAL_REQUIRED` | Não | `true` para exigir aprovação de novas contas (deve coincidir com `ACCOUNT_APPROVAL_REQUIRED` nas Functions) |

\* Recomendado em produção.

Para desenvolvimento sem projeto cloud, usa [`.env.emulator.example`](../.env.emulator.example) em vez de `.env.example`.

#### `authDomain` e Safari/iOS

Define `VITE_FIREBASE_AUTH_DOMAIN` com o **domínio onde a app é servida** (ex.: `your-project.web.app`), não com o `your-project.firebaseapp.com` que a Firebase Console sugere. Com um `authDomain` noutra origem, o handler de login não consegue ler o `sessionStorage` em browsers com *storage partitioning* (Safari/iOS 16.1+, browsers embutidos), e o login falha com «Unable to process request due to missing initial state». Como a app é servida pelo Firebase Hosting, o handler `/__/auth/*` já existe no domínio de hosting. Depois de alterar:

1. Google Cloud Console → **APIs & Services → Credentials** → OAuth 2.0 Client ID: adiciona `https://<domínio>/__/auth/handler` aos **Authorized redirect URIs** e `https://<domínio>` às **Authorized JavaScript origins**.
2. Firebase Console → **Authentication → Settings → Authorized domains**: confirma que o domínio está listado.

Ver [Firebase: redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) (opção «update to use the same domain»).

### Política de privacidade (build)

Variáveis **não expostas ao browser** (excepto `VITE_PRIVACY_POLICY_ENABLED`, escrita em `.env.privacy.generated` pelo script). Ver [`privacy-policy-template.md`](./privacy-policy-template.md).

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PRIVACY_INSTANCE_NAME` | Sim* | Nome da instância (título da política) |
| `PRIVACY_CONTROLLER_NAME` | Sim* | Responsável pelo tratamento (RGPD) |
| `PRIVACY_CONTACT_EMAIL` | Sim* | Email para pedidos de privacidade |
| `PRIVACY_HOSTING_URL` | Sim* | URL pública da PWA |
| `PRIVACY_RETENTION_POLICY_PT` | Não | Texto de conservação (PT) |
| `PRIVACY_RETENTION_POLICY_EN` | Não | Texto de conservação (EN) |
| `PRIVACY_REQUIRED` | Não | `true` para falhar o build se faltar configuração (CI/deploy) |

\* Obrigatórias para `npm run generate:privacy` produzir páginas. Sem elas, o build continua sem link no rodapé.

Flags `USES_*` inferidas de `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_GEOAPIFY_API_KEY`, `VITE_FIREBASE_VAPID_KEY`.

```bash
npm run generate:privacy   # só geração (opcional antes de dev)
npm run build              # inclui generate:privacy
```

Output gitignored: `src/generated/privacyPolicy.content.ts`, `.env.privacy.generated`. Página na app: `/privacidade`.

### Cloud Functions (`functions/.env`)

Copia [`functions/.env.example`](../functions/.env.example) para `functions/.env` (não commitado). Lido pelo Firebase CLI no deploy.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `FUNCTIONS_REGION` | Não | Região de deploy (predefinição: `europe-west1`). Deve coincidir com `VITE_FIREBASE_FUNCTIONS_REGION`. |
| `FUNCTIONS_SERVICE_ACCOUNT` | Não | Email da service account para funções callable (partilhas, lookup de resultados). Se omitida, usa a conta predefinida do projeto. Ver Firebase Console → Project settings → Service accounts. |
| `SCHEDULER_TIMEZONE` | Não | Fuso horário de `dispatchReminders` (predefinição: `Europe/Lisbon`) |
| `ACCOUNT_APPROVAL_REQUIRED` | Não | `true` para activar aprovação de contas novas (blocking functions). Requer [Identity Platform](https://firebase.google.com/docs/auth#identity-platform) no projeto. |
| `APP_PUBLIC_URL` | Sim* | URL pública da PWA (links nos emails) |

\* Obrigatórias quando `ACCOUNT_APPROVAL_REQUIRED=true`.

O administrador **não** é uma variável: é um utilizador com `admin: true` no documento `users/{uid}`, e é para ele que vão os emails de aprovação. Ver «Primeiro arranque» em [`self-hosting.md`](./self-hosting.md).

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `RESEND_API_KEY` | Sim* | API key [Resend](https://resend.com/) para emails transaccionais |
| `EMAIL_FROM` | Sim* | Remetente verificado no Resend (ex. `Instância <noreply@dominio.com>`) |
| `APPROVAL_TOKEN_SECRET` | Sim* | Segredo HMAC (≥16 caracteres) para links de aprovação/rejeição |
| `INSTANCE_NAME` | Não | Nome da instância nos emails (predefinição: `Queima Asfalto`) |
| `APPROVAL_HANDLER_BASE_URL` | Não | URL base do handler HTTP; predefinição: `{APP_PUBLIC_URL}/api/account-approval` (rewrite no Hosting) |

Exemplo de service account: `firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com`

### Limites de escala (Gen 2)

`maxInstances`, `concurrency` e `timeoutSeconds` estão definidos em [`functions/src/functionOptions.ts`](../functions/src/functionOptions.ts). Avaliação completa: [`cloud-functions-limits.md`](./cloud-functions-limits.md).

| Grupo | `maxInstances` | `concurrency` |
|-------|----------------|---------------|
| Partilhas (callables) | 20 | 40 |
| `lookupOfficialResults` | 5 | 1 |
| `dispatchReminders` | 1 | 1 |

Self-hosters com tráfego elevado podem ajustar as constantes no código antes do deploy.

### Firebase CLI (`.firebaserc`)

Copia [`.firebaserc.example`](../.firebaserc.example) para `.firebaserc` e define o teu `projectId`, ou corre:

```bash
firebase use --add your-firebase-project-id
```

O ficheiro `.firebaserc` não é commitado, cada instalação aponta para o seu projeto Firebase.

### Checklist rápido (novo projeto)

Guia completo: [`self-hosting.md`](./self-hosting.md). Resumo:

1. Criar projeto Firebase (Blaze) com Auth, Firestore, Storage, Functions, FCM.
2. Configurar `.firebaserc`, `.env.local` e `functions/.env`.
3. `npm run deploy`.
4. Rever restrições no Console, [`console-restrictions.md`](./console-restrictions.md).
5. Publicar política de privacidade, modelo em [`privacy-policy-template.md`](./privacy-policy-template.md).

---

<a id="english"></a>

## English

[Português](#portugues)

Environment variables and configuration files for local development, deploy, and self-hosting.

### Web app (`.env.local`)

Copy [`.env.example`](../.env.example) to `.env.local` at the project root.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web App `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | `authDomain`, use the domain the app is served from (e.g. `your-project.web.app`). See [note below](#authdomain-and-safariios) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Yes | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Yes | `measurementId` (Analytics) |
| `VITE_FIREBASE_VAPID_KEY` | No* | Web Push (FCM); required for notifications |
| `VITE_GEOAPIFY_API_KEY` | No* | Location autocomplete and geocoding |
| `VITE_FIREBASE_FUNCTIONS_REGION` | No | Cloud Functions region (default: `europe-west1`) |
| `VITE_APP_STORAGE_PREFIX` | No | `localStorage` key prefix (default: `VITE_FIREBASE_PROJECT_ID`) |
| `VITE_USE_FIREBASE_EMULATORS` | No | `true` for emulated Auth, Firestore, Storage, and Functions, see [`emulators.md`](./emulators.md) |
| `VITE_FUNCTIONS_EMULATOR` | No | `true` for **Functions only** (hybrid mode with a real project) |
| `VITE_ACCOUNT_APPROVAL_REQUIRED` | No | `true` to require admin approval for new accounts (must match `ACCOUNT_APPROVAL_REQUIRED` in Functions) |

\* Recommended in production.

For development without a cloud project, use [`.env.emulator.example`](../.env.emulator.example) instead of `.env.example`.

#### `authDomain` and Safari/iOS

Set `VITE_FIREBASE_AUTH_DOMAIN` to the **domain the app is served from** (e.g. `your-project.web.app`), not the `your-project.firebaseapp.com` value the Firebase Console suggests. With a cross-origin `authDomain`, the sign-in handler cannot read `sessionStorage` in storage-partitioned browsers (Safari/iOS 16.1+, in-app browsers), and sign-in fails with "Unable to process request due to missing initial state". Since the app is served by Firebase Hosting, the `/__/auth/*` handler already exists on the hosting domain. After changing it:

1. Google Cloud Console → **APIs & Services → Credentials** → OAuth 2.0 Client ID: add `https://<domain>/__/auth/handler` to **Authorized redirect URIs** and `https://<domain>` to **Authorized JavaScript origins**.
2. Firebase Console → **Authentication → Settings → Authorized domains**: confirm the domain is listed.

See [Firebase: redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) (the "update to use the same domain" option).

### Privacy policy (build)

Variables **not exposed to the browser** (except `VITE_PRIVACY_POLICY_ENABLED`, written to `.env.privacy.generated` by the script). See [`privacy-policy-template.md`](./privacy-policy-template.md).

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVACY_INSTANCE_NAME` | Yes* | Instance name (policy title) |
| `PRIVACY_CONTROLLER_NAME` | Yes* | Data controller (GDPR) |
| `PRIVACY_CONTACT_EMAIL` | Yes* | Email for privacy requests |
| `PRIVACY_HOSTING_URL` | Yes* | Public PWA URL |
| `PRIVACY_RETENTION_POLICY_PT` | No | Retention text (PT) |
| `PRIVACY_RETENTION_POLICY_EN` | No | Retention text (EN) |
| `PRIVACY_REQUIRED` | No | `true` to fail the build when configuration is incomplete (CI/deploy) |

\* Required for `npm run generate:privacy` to produce pages. Without them, the build continues with no footer link.

`USES_*` flags are inferred from `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_GEOAPIFY_API_KEY`, `VITE_FIREBASE_VAPID_KEY`.

```bash
npm run generate:privacy   # generation only (optional before dev)
npm run build              # includes generate:privacy
```

Gitignored output: `src/generated/privacyPolicy.content.ts`, `.env.privacy.generated`. In-app route: `/privacidade`.

### Cloud Functions (`functions/.env`)

Copy [`functions/.env.example`](../functions/.env.example) to `functions/.env` (not committed). Loaded by the Firebase CLI on deploy.

| Variable | Required | Description |
|----------|----------|-------------|
| `FUNCTIONS_REGION` | No | Deploy region (default: `europe-west1`). Must match `VITE_FIREBASE_FUNCTIONS_REGION`. |
| `FUNCTIONS_SERVICE_ACCOUNT` | No | Service account email for callable functions (shares, results lookup). If omitted, uses the project default runtime account. See Firebase Console → Project settings → Service accounts. |
| `SCHEDULER_TIMEZONE` | No | Time zone for `dispatchReminders` (default: `Europe/Lisbon`) |
| `ACCOUNT_APPROVAL_REQUIRED` | No | `true` to enable new-account approval (blocking functions). Requires [Identity Platform](https://firebase.google.com/docs/auth#identity-platform) on the project. |
| `APP_PUBLIC_URL` | Yes* | Public PWA URL (email links) |

\* Required when `ACCOUNT_APPROVAL_REQUIRED=true`.

The administrator is **not** a variable: it is a user with `admin: true` on their `users/{uid}` document, and that is where approval emails go. See "First run" in [`self-hosting.md`](./self-hosting.md).

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes* | [Resend](https://resend.com/) API key for transactional email |
| `EMAIL_FROM` | Yes* | Verified Resend sender (e.g. `Instance <noreply@your-domain.com>`) |
| `APPROVAL_TOKEN_SECRET` | Yes* | HMAC secret (≥16 chars) for approve/reject links |
| `INSTANCE_NAME` | No | Instance name in emails (default: `Queima Asfalto`) |
| `APPROVAL_HANDLER_BASE_URL` | No | Handler base URL; default `{APP_PUBLIC_URL}/api/account-approval` (Hosting rewrite) |

Example service account: `firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com`

### Scaling limits (Gen 2)

`maxInstances`, `concurrency`, and `timeoutSeconds` are set in [`functions/src/functionOptions.ts`](../functions/src/functionOptions.ts). Full evaluation: [`cloud-functions-limits.md`](./cloud-functions-limits.md).

| Group | `maxInstances` | `concurrency` |
|-------|----------------|---------------|
| Shares (callables) | 20 | 40 |
| `lookupOfficialResults` | 5 | 1 |
| `dispatchReminders` | 1 | 1 |

Self-hosters with higher traffic can tune the constants in code before deploy.

### Firebase CLI (`.firebaserc`)

Copy [`.firebaserc.example`](../.firebaserc.example) to `.firebaserc` and set your `projectId`, or run:

```bash
firebase use --add your-firebase-project-id
```

`.firebaserc` is not committed, each installation points to its own Firebase project.

### Quick checklist (new project)

Full guide: [`self-hosting.md`](./self-hosting.md). Summary:

1. Create a Firebase project (Blaze) with Auth, Firestore, Storage, Functions, FCM.
2. Configure `.firebaserc`, `.env.local`, and `functions/.env`.
3. `npm run deploy`.
4. Review console restrictions, [`console-restrictions.md`](./console-restrictions.md).
5. Publish a privacy policy, template at [`privacy-policy-template.md`](./privacy-policy-template.md).
