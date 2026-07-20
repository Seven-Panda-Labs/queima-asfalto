# Configuração — Queima Asfalto

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
| `VITE_FIREBASE_AUTH_DOMAIN` | Sim | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Sim | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sim | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sim | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Sim | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Sim | `measurementId` (Analytics) |
| `VITE_FIREBASE_VAPID_KEY` | Não* | Web Push (FCM); necessário para notificações |
| `VITE_GEOAPIFY_API_KEY` | Não* | Autocomplete e geocodificação de locais |
| `VITE_FIREBASE_FUNCTIONS_REGION` | Não | Região das Cloud Functions (predefinição: `europe-west1`) |
| `VITE_APP_STORAGE_PREFIX` | Não | Prefixo de `localStorage` (predefinição: `VITE_FIREBASE_PROJECT_ID`) |
| `VITE_USE_FIREBASE_EMULATORS` | Não | `true` para Auth, Firestore, Storage e Functions emulados — ver [`emulators.md`](./emulators.md) |
| `VITE_FUNCTIONS_EMULATOR` | Não | `true` para **só** Functions emuladas (modo híbrido com projeto real) |

\* Recomendado em produção.

Para desenvolvimento sem projeto cloud, usa [`.env.emulator.example`](../.env.emulator.example) em vez de `.env.example`.

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

O ficheiro `.firebaserc` não é commitado — cada instalação aponta para o seu projeto Firebase.

### Checklist rápido (novo projeto)

Guia completo: [`self-hosting.md`](./self-hosting.md). Resumo:

1. Criar projeto Firebase (Blaze) com Auth, Firestore, Storage, Functions, FCM.
2. Configurar `.firebaserc`, `.env.local` e `functions/.env`.
3. `npm run deploy`.
4. Rever restrições no Console — [`console-restrictions.md`](./console-restrictions.md).
5. Publicar política de privacidade — modelo em [`privacy-policy-template.md`](./privacy-policy-template.md).

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
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Yes | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Yes | `measurementId` (Analytics) |
| `VITE_FIREBASE_VAPID_KEY` | No* | Web Push (FCM); required for notifications |
| `VITE_GEOAPIFY_API_KEY` | No* | Location autocomplete and geocoding |
| `VITE_FIREBASE_FUNCTIONS_REGION` | No | Cloud Functions region (default: `europe-west1`) |
| `VITE_APP_STORAGE_PREFIX` | No | `localStorage` key prefix (default: `VITE_FIREBASE_PROJECT_ID`) |
| `VITE_USE_FIREBASE_EMULATORS` | No | `true` for emulated Auth, Firestore, Storage, and Functions — see [`emulators.md`](./emulators.md) |
| `VITE_FUNCTIONS_EMULATOR` | No | `true` for **Functions only** (hybrid mode with a real project) |

\* Recommended in production.

For development without a cloud project, use [`.env.emulator.example`](../.env.emulator.example) instead of `.env.example`.

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

`.firebaserc` is not committed — each installation points to its own Firebase project.

### Quick checklist (new project)

Full guide: [`self-hosting.md`](./self-hosting.md). Summary:

1. Create a Firebase project (Blaze) with Auth, Firestore, Storage, Functions, FCM.
2. Configure `.firebaserc`, `.env.local`, and `functions/.env`.
3. `npm run deploy`.
4. Review console restrictions — [`console-restrictions.md`](./console-restrictions.md).
5. Publish a privacy policy — template at [`privacy-policy-template.md`](./privacy-policy-template.md).
