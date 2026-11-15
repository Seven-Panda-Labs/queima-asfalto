# Console restrictions

Review before going public or deploying a new project. Replace `your-project-id` and `your-domain` with your values. The serving domain is the one in `VITE_FIREBASE_AUTH_DOMAIN` (e.g. `your-project-id.web.app`), see [`configuration.md`](./configuration.md#authdomain-and-safariios).

## 1. Authentication

**Firebase → Authentication → Settings → Authorized domains:** `localhost`, `your-project-id.web.app`, `your-project-id.firebaseapp.com`, and `your-domain` if any.

**Google Cloud → APIs & Services → Credentials → Web client (auto created by Google Service):**

| Field | Values |
|-------|--------|
| Authorized JavaScript origins | `http://localhost:5173`, `https://<serving domain>` |
| Authorized redirect URIs | `https://<serving domain>/__/auth/handler` |

## 2. Firebase browser key (`VITE_FIREBASE_API_KEY`)

**Google Cloud → Credentials → Browser key.**

HTTP referrers:

```
http://localhost/*
http://localhost:5173/*
https://your-project-id.web.app/*
https://your-project-id.firebaseapp.com/*
https://your-project-id--*.*.web.app/*   # only with Hosting preview channels
```

API restrictions: Identity Toolkit, Token Service, Firebase Installations, Cloud Firestore, Cloud Storage for Firebase, Firebase Cloud Messaging, Firebase Remote Config, plus Google Analytics Data API if `VITE_FIREBASE_MEASUREMENT_ID` is set. Never Firebase Management API.

Callable functions are authorized by `request.auth`, not by this key.

## 3. Geoapify

- **Browser key** (`VITE_GEOAPIFY_API_KEY`): HTTP referrer restriction to `http://localhost:*`, `https://your-project-id.web.app/*`, `https://your-project-id.firebaseapp.com/*`, and your custom domain. Geocoding API only.
- **Server key** (`GEOAPIFY_API_KEY` in `functions/.env`): used by the catalog geocoding pass from Cloud Functions, so it must have no referrer restriction. Use a separate key.

## 4. Functions service account

Callable, blocking and HTTP functions run as `FUNCTIONS_SERVICE_ACCOUNT`, or as the project runtime account (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) when it is unset. If that account is not a project Editor, grant:

| Role | Used by |
|------|---------|
| `roles/datastore.user` | Firestore, every function |
| `roles/firebaseauth.admin` | Admin user list, share invites by email, account deletion |
| `roles/storage.objectUser` on the Storage bucket | Track recompute, deleting an account's files |
| `roles/logging.logWriter` | Function logs |

## 5. Other

| Area | Check |
|------|-------|
| Firestore, Storage | `firestore.rules` and `storage.rules` deployed |
| Repository | No keys committed (`.env.local`, `functions/.env` are gitignored) |
