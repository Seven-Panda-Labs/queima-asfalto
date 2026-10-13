# Configuration

Environment variables and config files. Step-by-step setup: [`self-hosting.md`](./self-hosting.md).

## Web app (`.env.local`)

Copy [`.env.example`](../.env.example) to `.env.local`. For emulator-only development use [`.env.emulator.example`](../.env.emulator.example) instead.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`, `_MEASUREMENT_ID` | Yes | Fields of the Web App `firebaseConfig` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | The domain the app is served from, see [below](#authdomain-and-safariios) |
| `VITE_FIREBASE_VAPID_KEY` | No* | Web Push (FCM) |
| `VITE_GEOAPIFY_API_KEY` | No* | Location autocomplete and geocoding |
| `VITE_FIREBASE_FUNCTIONS_REGION` | No | Default `europe-west1`. Must match `FUNCTIONS_REGION` |
| `VITE_APP_STORAGE_PREFIX` | No | `localStorage` key prefix (default: project ID) |
| `VITE_USE_FIREBASE_EMULATORS` | No | `true` for all emulators, see [`emulators.md`](./emulators.md) |
| `VITE_FUNCTIONS_EMULATOR` | No | `true` for emulated Functions against a real project |
| `VITE_ACCOUNT_APPROVAL_REQUIRED` | No | Must match `ACCOUNT_APPROVAL_REQUIRED` in Functions |

\* Recommended in production.

### `authDomain` and Safari/iOS

Use the serving domain (e.g. `your-project.web.app`), not the `firebaseapp.com` value the console suggests. A cross-origin `authDomain` breaks sign-in in storage-partitioned browsers (Safari/iOS, in-app browsers) with "missing initial state". Firebase Hosting already serves `/__/auth/*` on the serving domain. Then:

1. Google Cloud → **APIs & Services → Credentials** → OAuth Web client: add `https://<domain>/__/auth/handler` to redirect URIs and `https://<domain>` to JavaScript origins.
2. Firebase → **Authentication → Settings → Authorized domains**: list the domain.

## Privacy policy (build)

`npm run build` runs `generate:privacy` ([`scripts/generate-privacy-policy.ts`](../scripts/generate-privacy-policy.ts)), which fills [`scripts/privacy-policy.template.md`](../scripts/privacy-policy.template.md) and serves it at `/privacidade`. Without the required variables the build skips it and shows no footer link.

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVACY_INSTANCE_NAME`, `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`, `PRIVACY_HOSTING_URL` | Yes | Instance name, data controller (GDPR), contact, public URL |
| `PRIVACY_RETENTION_POLICY_{PT,EN,ES,DE,FR,AR}` | No | Retention text per locale (has defaults) |
| `PRIVACY_REQUIRED` | No | `true` fails the build if any required one is missing (CI) |

## Cloud Functions (`functions/.env`)

Copy [`functions/.env.example`](../functions/.env.example) to `functions/.env`. The Firebase CLI loads it on deploy.

| Variable | Description |
|----------|-------------|
| `FUNCTIONS_REGION` | Default `europe-west1` |
| `FUNCTIONS_SERVICE_ACCOUNT` | Runtime account for callable, blocking and HTTP functions (not scheduled). Default: project runtime account |
| `SCHEDULER_TIMEZONE` | Time zone of all scheduled functions (default `Europe/Lisbon`) |
| `STORAGE_BUCKET` | Bucket for account deletion and track recompute. Set it if the project default differs from `VITE_FIREBASE_STORAGE_BUCKET` (e.g. `appspot.com` vs `firebasestorage.app`) |
| `DISCOVERY_SOURCES` | Comma-separated sources for `harvestRaceCatalog`, or `all`. Unset: the harvest fetches nothing. See [`discovery-sources.md`](./discovery-sources.md) |
| `GEOAPIFY_API_KEY` | Server key to geocode catalog races. Unset: that pass is skipped |
| `ACCOUNT_APPROVAL_REQUIRED` | `true` enables new-account approval (needs Identity Platform) |
| `APP_PUBLIC_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `APPROVAL_TOKEN_SECRET` | Required with approval: public URL, [Resend](https://resend.com/) key and verified sender, link secret (16+ chars) |
| `INSTANCE_NAME`, `APPROVAL_HANDLER_BASE_URL` | Optional: name in emails, link base (default `{APP_PUBLIC_URL}/api/account-approval`) |

The administrator is not a variable: it is a user with `admin: true` on `users/{uid}`. See "First run" in [`self-hosting.md`](./self-hosting.md).

Scaling limits (`maxInstances`, `concurrency`, timeouts) live in [`functions/src/functionOptions.ts`](../functions/src/functionOptions.ts).

## Firebase CLI (`.firebaserc`)

Copy [`.firebaserc.example`](../.firebaserc.example) and set your project ID, or run `firebase use --add <project-id>`. Not committed.
