# Restrições no Console — Firebase e Geoapify

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Checklist para rever no **Firebase Console**, **Google Cloud Console** e **Geoapify** antes de tornar o repositório público ou fazer deploy num novo projeto.

Substitui `your-project-id` e `your-domain` pelos valores do teu projeto (ex.: `meu-clube` / `meu-clube.web.app`).

### 1. Firebase Authentication — domínios autorizados

**Console:** Firebase → Authentication → Settings → **Authorized domains**

| Domínio | Motivo |
|---------|--------|
| `localhost` | Dev local (Vite, porta 5173) |
| `your-project-id.firebaseapp.com` | Hosting / Auth predefinido |
| `your-project-id.web.app` | Hosting Firebase (produção) |
| `your-domain` | Domínio customizado, se existir |

**Google Sign-In** usa `signInWithPopup`. Sem o domínio de produção na lista, o login falha fora de `localhost`.

**OAuth (Google Cloud):** APIs & Services → Credentials → cliente OAuth **Web client (auto created by Google Service)**:

| Campo | Valores típicos |
|-------|-----------------|
| Authorized JavaScript origins | `http://localhost:5173`, `https://your-project-id.web.app`, `https://your-project-id.firebaseapp.com` |
| Authorized redirect URIs | `https://your-project-id.firebaseapp.com/__/auth/handler` (Firebase gere o handler) |

### 2. Chave API do Firebase (Browser key)

**Console:** Google Cloud → APIs & Services → Credentials → chave do tipo **Browser key** (a que corresponde a `VITE_FIREBASE_API_KEY`).

#### Restrição de aplicação — HTTP referrers

```
http://localhost/*
http://localhost:5173/*
https://your-project-id.web.app/*
https://your-project-id.firebaseapp.com/*
```

Se usares **Firebase Hosting preview channels**, acrescenta:

```
https://your-project-id--*.*.web.app/*
```

#### Restrição de APIs

Limita a chave às APIs que a app usa no cliente:

| API | Uso na app |
|-----|------------|
| Identity Toolkit API | Auth (Google Sign-In) |
| Token Service API | Tokens de sessão |
| Firebase Installations API | Instalação da Web App |
| Cloud Firestore API | Base de dados |
| Cloud Storage for Firebase API | Fotos/vídeos de eventos |
| Firebase Cloud Messaging API | Web Push |
| Firebase Remote Config API | SDK Firebase (dependência) |
| Firebase Management API | — **não** incluir (só admin) |

Se Analytics estiver activo (`VITE_FIREBASE_MEASUREMENT_ID`):

| API | Uso |
|-----|-----|
| Google Analytics Data API | Eventos de página |

> **Nota:** Cloud Functions callable (`lookupOfficialResults`, partilhas) chamam endpoints `cloudfunctions.net` com token Auth; não dependem desta chave browser para autorização — a segurança está no `request.auth` nas Functions.

### 3. Outras definições Firebase

| Área | Console | Acção |
|------|---------|--------|
| Firestore | Rules | Confirmar `firestore.rules` deployado (acesso por `userId`; media valida `storagePath`/`downloadUrl` do Firebase Storage) |
| Storage | Rules | Confirmar `storage.rules` deployado (media por utilizador) |
| Cloud Messaging | Web Push certificates | VAPID key em `VITE_FIREBASE_VAPID_KEY` |
| Hosting | Domínios | `web.app` + custom domain se aplicável |
| Functions | IAM | Service account das callable com permissões mínimas (ver `FUNCTIONS_SERVICE_ACCOUNT`) |

### 4. Geoapify — chave do browser

**Dashboard:** Geoapify → API keys → chave usada em `VITE_GEOAPIFY_API_KEY`

A app chama `https://api.geoapify.com/v1/geocode/autocomplete` e `.../geocode/search` **no browser** (formulário de eventos).

#### Restrição HTTP Referer

```
http://localhost:*
https://your-project-id.web.app/*
https://your-project-id.firebaseapp.com/*
```

#### APIs / endpoints

Restringe à **Geocoding API** (autocomplete + search). Não expor outras APIs Geoapify se não forem usadas.

### 5. Checklist — exemplo (`your-project-id`)

- [ ] Auth: `your-project-id.web.app` e `your-project-id.firebaseapp.com` autorizados
- [ ] Browser key: referrers `localhost` + `your-project-id.web.app` + `your-project-id.firebaseapp.com`
- [ ] Browser key: APIs limitadas (secção 2)
- [ ] Geoapify (browser): referrers de produção + localhost
- [ ] OAuth Web client: origins de produção e `localhost:5173`
- [ ] Sem chaves API em repositório (`.env.local` / `functions/.env` gitignored)

### 6. Self-hosting (novo projeto)

Repete as secções 1–4 com o teu `projectId` e domínio. Vê também [`configuration.md`](./configuration.md).

---

<a id="english"></a>

## English

[Português](#portugues)

Checklist to review in **Firebase Console**, **Google Cloud Console**, and **Geoapify** before going public or deploying to a new project.

Replace `your-project-id` and `your-domain` with your project values (e.g. `my-club` / `my-club.web.app`).

### 1. Firebase Authentication — authorized domains

**Console:** Firebase → Authentication → Settings → **Authorized domains**

| Domain | Reason |
|--------|--------|
| `localhost` | Local dev (Vite, port 5173) |
| `your-project-id.firebaseapp.com` | Default Hosting / Auth |
| `your-project-id.web.app` | Firebase Hosting (production) |
| `your-domain` | Custom domain, if any |

**Google Sign-In** uses `signInWithPopup`. Without the production domain, login fails outside `localhost`.

**OAuth (Google Cloud):** APIs & Services → Credentials → **Web client (auto created by Google Service)**:

| Field | Typical values |
|-------|----------------|
| Authorized JavaScript origins | `http://localhost:5173`, `https://your-project-id.web.app`, `https://your-project-id.firebaseapp.com` |
| Authorized redirect URIs | `https://your-project-id.firebaseapp.com/__/auth/handler` (Firebase handles the handler) |

### 2. Firebase API key (Browser key)

**Console:** Google Cloud → APIs & Services → Credentials → **Browser key** (matches `VITE_FIREBASE_API_KEY`).

#### Application restriction — HTTP referrers

```
http://localhost/*
http://localhost:5173/*
https://your-project-id.web.app/*
https://your-project-id.firebaseapp.com/*
```

If you use **Firebase Hosting preview channels**, add:

```
https://your-project-id--*.*.web.app/*
```

#### API restrictions

Limit the key to client-side APIs:

| API | App usage |
|-----|-----------|
| Identity Toolkit API | Auth (Google Sign-In) |
| Token Service API | Session tokens |
| Firebase Installations API | Web App installation |
| Cloud Firestore API | Database |
| Cloud Storage for Firebase API | Event photos/videos |
| Firebase Cloud Messaging API | Web Push |
| Firebase Remote Config API | Firebase SDK (dependency) |
| Firebase Management API | — **do not** include (admin only) |

If Analytics is enabled (`VITE_FIREBASE_MEASUREMENT_ID`):

| API | Usage |
|-----|-------|
| Google Analytics Data API | Page events |

> **Note:** Callable Cloud Functions (`lookupOfficialResults`, shares) call `cloudfunctions.net` with an Auth token; authorization is `request.auth` in Functions, not the browser API key.

### 3. Other Firebase settings

| Area | Console | Action |
|------|---------|--------|
| Firestore | Rules | Ensure `firestore.rules` is deployed (`userId` scoping; media validates Firebase Storage `storagePath`/`downloadUrl`) |
| Storage | Rules | Ensure `storage.rules` is deployed (per-user media) |
| Cloud Messaging | Web Push certificates | VAPID key in `VITE_FIREBASE_VAPID_KEY` |
| Hosting | Domains | `web.app` + custom domain if applicable |
| Functions | IAM | Minimal permissions for callable service account (`FUNCTIONS_SERVICE_ACCOUNT`) |

### 4. Geoapify — browser key

**Dashboard:** Geoapify → API keys → key used in `VITE_GEOAPIFY_API_KEY`

The app calls `https://api.geoapify.com/v1/geocode/autocomplete` and `.../geocode/search` **in the browser** (event form).

#### HTTP Referer restriction

```
http://localhost:*
https://your-project-id.web.app/*
https://your-project-id.firebaseapp.com/*
```

#### APIs / endpoints

Restrict to **Geocoding API** (autocomplete + search). Do not expose unused Geoapify APIs.

### 5. Checklist — example (`your-project-id`)

- [ ] Auth: `your-project-id.web.app` and `your-project-id.firebaseapp.com` authorized
- [ ] Browser key: referrers `localhost` + `your-project-id.web.app` + `your-project-id.firebaseapp.com`
- [ ] Browser key: APIs limited (section 2)
- [ ] Geoapify (browser): production + localhost referrers
- [ ] OAuth Web client: production origins and `localhost:5173`
- [ ] No API keys in the repository (`.env.local` / `functions/.env` gitignored)

### 6. Self-hosting (new project)

Repeat sections 1–4 with your `projectId` and domain. See also [`configuration.md`](./configuration.md).
