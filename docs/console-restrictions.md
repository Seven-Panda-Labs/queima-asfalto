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

## 4. Other

| Area | Check |
|------|-------|
| Firestore, Storage | `firestore.rules` and `storage.rules` deployed |
| Functions IAM | Minimal permissions for `FUNCTIONS_SERVICE_ACCOUNT` (callable, blocking and HTTP functions) |
| Repository | No keys committed (`.env.local`, `functions/.env` are gitignored) |
