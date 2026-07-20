# Emuladores Firebase — desenvolvimento local

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Guia para desenvolver **sem projeto Firebase na cloud** (ou com dados locais isolados), usando o [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite).

### Quando usar

| Cenário | Abordagem |
|---------|-----------|
| Contribuir com UI / CRUD / partilhas sem tocar em produção | **Emuladores completos** (este guia) |
| Testar só regras Firestore | `npm run test:rules` (sem app) |
| Testar callables sem Auth/Firestore emulados | `VITE_FUNCTIONS_EMULATOR=true` + projeto real |
| Deploy ou dados reais partilhados | Projeto Firebase (ver [`CONTRIBUTING.md`](../CONTRIBUTING.md)) |

### Requisitos

- Node.js 24
- **Java JDK 21+** (exigido pelo `firebase-tools` para Firestore emulator)
- `firebase-tools` (incluído em `devDependencies` — usa `npx firebase`)

### Início rápido (sem projeto cloud)

**Terminal 1 — emuladores:**

```bash
npm run emulators
```

Isto arranca Auth (`9099`), Firestore (`8080`), Functions (`5001`), Storage (`9199`) e a **Emulator UI** em [http://localhost:4000](http://localhost:4000). O project ID é `demo-queima-asfalto` (não precisa de `.firebaserc`).

**Terminal 2 — frontend:**

```bash
cp .env.emulator.example .env.local
npm install
npm --prefix functions install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) e usa **«Entrar (emulador)»** no ecrã de login (não uses Google — OAuth não funciona contra o Auth emulator).

Conta de desenvolvimento criada automaticamente:

- Email: `dev@queima-asfalto.local`
- Password: `devpassword`

### Variáveis de ambiente

Copia [`.env.emulator.example`](../.env.emulator.example) para `.env.local`.

| Variável | Descrição |
|----------|-----------|
| `VITE_USE_FIREBASE_EMULATORS=true` | Liga a app a Auth, Firestore, Storage e Functions emulados |
| `VITE_FIREBASE_*` | Valores placeholder (devem coincidir com `demo-queima-asfalto`) |
| `VITE_FUNCTIONS_EMULATOR=true` | **Só** Functions emuladas; Firestore/Auth continuam no projeto de `.env.local` |

Ver também [`configuration.md`](./configuration.md).

### Portas (predefinição)

| Serviço | Porta | Uso |
|---------|-------|-----|
| Emulator UI | 4000 | Consola web |
| Auth | 9099 | Login emulador |
| Firestore | 8080 | Dados + `npm run test:rules` |
| Functions | 5001 | Callables (`lookupOfficialResults`, partilhas) |
| Storage | 9199 | Media de eventos |
| Vite dev server | 5173 | PWA |

Configuração em [`firebase.json`](../firebase.json) → `emulators`.

### O que funciona / limitações

| Funcionalidade | Emuladores |
|----------------|------------|
| Auth (email dev) | Sim — botão «Entrar (emulador)» |
| Google Sign-In | **Não** — OAuth não é suportado no Auth emulator |
| Firestore + rules | Sim |
| Storage + rules | Sim |
| Cloud Functions callable | Sim |
| `dispatchReminders` (agendado) | Não automático — disparo manual na UI ou ignorar |
| Web Push (FCM) | **Não** |
| Google Analytics | **Não** (eventos ignorados em dev) |
| Geoapify (mapas) | Precisa de `VITE_GEOAPIFY_API_KEY` real (API externa) |
| Importação resultados oficiais | Sim via Functions emulator (HTTP a sites de timing reais) |

### Modo híbrido (projeto real + Functions emuladas)

Útil para testar callables sem deploy:

1. `.env.local` com credenciais reais do teu projeto Firebase
2. `VITE_FUNCTIONS_EMULATOR=true` (sem `VITE_USE_FIREBASE_EMULATORS`)
3. `npm run emulators` (ou `firebase emulators:start --only functions`)
4. Login com Google contra o projeto real; dados em Firestore cloud

### Testes automatizados (regras)

```bash
npm run test:rules
```

Corre Vitest contra o Firestore emulator (`firebase emulators:exec`). Incluído em `npm run check` e no CI — requer Java 21+.

Ficheiro: [`firestore.rules.test.ts`](../firestore.rules.test.ts). Cobertura actual:

| Área | O que valida |
|------|----------------|
| `users` | Só o dono lê/escreve o perfil |
| `events` | CRUD por `userId`; `resultsPlatform`; campos de resultado |
| `goals` / `performanceGoals` / `bucketListItems` | Isolamento por utilizador; validação de payload |
| `shares` | Leitura para owner, grantee e convite pendente por email; **sem** writes no cliente |
| `users/.../reminderDispatches` | Leitura pelo dono; writes só servidor |
| `users/.../rateLimits` | Leitura pelo dono; writes só servidor (lookup de resultados) |
| `events/.../media` | `storagePath` e `downloadUrl` alinhados com Firebase Storage; sem updates |

### Persistir dados entre sessões (opcional)

```bash
firebase emulators:start --project demo-queima-asfalto --import=./emulator-data --export-on-exit=./emulator-data
```

A pasta `emulator-data/` está no `.gitignore`.

### Resolução de problemas

| Problema | Solução |
|----------|---------|
| `Java version before 21` | Instala JDK 21+ (`sudo apt install openjdk-21-jdk` ou Temurin) |
| Login Google falha em modo emulador | Usa «Entrar (emulador)», não o botão Google |
| `connection refused` nas callables | Confirma `npm run emulators` a correr e `VITE_USE_FIREBASE_EMULATORS=true` |
| Firestore persistence / offline estranho | Em modo emulador a app usa cache em memória (sem IndexedDB persistence) |
| Callable `permission-denied` | Dados emulados vazios — cria eventos de novo após reiniciar emuladores |

---

<a id="english"></a>

## English

[Português](#portugues)

Guide for developing **without a cloud Firebase project** (or with isolated local data) using the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite).

### When to use

| Scenario | Approach |
|----------|----------|
| Contribute on UI / CRUD / shares without touching production | **Full emulators** (this guide) |
| Test Firestore rules only | `npm run test:rules` (no app) |
| Test callables without emulated Auth/Firestore | `VITE_FUNCTIONS_EMULATOR=true` + real project |
| Deploy or shared real data | Firebase project (see [`CONTRIBUTING.md`](../CONTRIBUTING.md)) |

### Requirements

- Node.js 24
- **Java JDK 21+** (required by `firebase-tools` for the Firestore emulator)
- `firebase-tools` (in `devDependencies` — use `npx firebase`)

### Quick start (no cloud project)

**Terminal 1 — emulators:**

```bash
npm run emulators
```

Starts Auth (`9099`), Firestore (`8080`), Functions (`5001`), Storage (`9199`), and the **Emulator UI** at [http://localhost:4000](http://localhost:4000). Project ID is `demo-queima-asfalto` (no `.firebaserc` needed).

**Terminal 2 — frontend:**

```bash
cp .env.emulator.example .env.local
npm install
npm --prefix functions install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click **“Sign in (emulator)”** on the login screen (do not use Google — OAuth does not work against the Auth emulator).

Dev account (auto-created on first sign-in):

- Email: `dev@queima-asfalto.local`
- Password: `devpassword`

### Environment variables

Copy [`.env.emulator.example`](../.env.emulator.example) to `.env.local`.

| Variable | Description |
|----------|-------------|
| `VITE_USE_FIREBASE_EMULATORS=true` | Connect the app to emulated Auth, Firestore, Storage, and Functions |
| `VITE_FIREBASE_*` | Placeholder values (must match `demo-queima-asfalto`) |
| `VITE_FUNCTIONS_EMULATOR=true` | **Functions only**; Firestore/Auth still use the project from `.env.local` |

See also [`configuration.md`](./configuration.md).

### Ports (defaults)

| Service | Port | Use |
|---------|------|-----|
| Emulator UI | 4000 | Web console |
| Auth | 9099 | Emulator login |
| Firestore | 8080 | Data + `npm run test:rules` |
| Functions | 5001 | Callables (`lookupOfficialResults`, shares) |
| Storage | 9199 | Event media |
| Vite dev server | 5173 | PWA |

Configured in [`firebase.json`](../firebase.json) → `emulators`.

### What works / limitations

| Feature | Emulators |
|---------|-----------|
| Auth (dev email) | Yes — “Sign in (emulator)” button |
| Google Sign-In | **No** — OAuth is not supported on the Auth emulator |
| Firestore + rules | Yes |
| Storage + rules | Yes |
| Callable Cloud Functions | Yes |
| `dispatchReminders` (scheduled) | Not automatic — trigger manually in UI or skip |
| Web Push (FCM) | **No** |
| Google Analytics | **No** (events ignored in dev) |
| Geoapify (maps) | Requires real `VITE_GEOAPIFY_API_KEY` (external API) |
| Official results import | Yes via Functions emulator (real HTTP to timing sites) |

### Hybrid mode (real project + emulated Functions)

Useful to test callables without deploy:

1. `.env.local` with real Firebase credentials
2. `VITE_FUNCTIONS_EMULATOR=true` (without `VITE_USE_FIREBASE_EMULATORS`)
3. `npm run emulators` (or `firebase emulators:start --only functions`)
4. Sign in with Google against the real project; data stays in cloud Firestore

### Automated tests (rules)

```bash
npm run test:rules
```

Runs Vitest against the Firestore emulator (`firebase emulators:exec`). Included in `npm run check` and CI — requires Java 21+.

File: [`firestore.rules.test.ts`](../firestore.rules.test.ts). Current coverage:

| Area | What it validates |
|------|-------------------|
| `users` | Owner-only profile read/write |
| `events` | CRUD scoped by `userId`; `resultsPlatform`; results fields |
| `goals` / `performanceGoals` / `bucketListItems` | Per-user isolation; payload validation |
| `shares` | Read for owner, grantee, pending invitee by email; **no** client writes |
| `users/.../reminderDispatches` | Owner read; server-only writes |
| `users/.../rateLimits` | Owner read; server-only writes (results lookup) |
| `events/.../media` | `storagePath` and `downloadUrl` match Firebase Storage; no updates |

### Persist data between sessions (optional)

```bash
firebase emulators:start --project demo-queima-asfalto --import=./emulator-data --export-on-exit=./emulator-data
```

The `emulator-data/` folder is gitignored.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `Java version before 21` | Install JDK 21+ (`sudo apt install openjdk-21-jdk` or Temurin) |
| Google login fails in emulator mode | Use “Sign in (emulator)”, not the Google button |
| `connection refused` on callables | Ensure `npm run emulators` is running and `VITE_USE_FIREBASE_EMULATORS=true` |
| Odd Firestore offline behaviour | Emulator mode uses in-memory cache (no IndexedDB persistence) |
| Callable `permission-denied` | Empty emulator data — recreate events after restarting emulators |
