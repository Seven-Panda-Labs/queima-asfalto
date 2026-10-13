# Self-hosting

Deploy your own instance on your own Firebase project. Variables: [`configuration.md`](./configuration.md). Console hardening: [`console-restrictions.md`](./console-restrictions.md). Architecture: [`architecture.md`](./architecture.md).

## Requirements

- Firebase project on the **Blaze** plan (Storage, Gen 2 Functions, Cloud Scheduler). Set a billing alert.
- Node.js 24 and the [Firebase CLI](https://firebase.google.com/docs/cli).
- Optional: a [Geoapify](https://www.geoapify.com/) account (location autocomplete and map).

Small instances usually stay within the free quotas, except Functions and Scheduler.

## 1. Firebase project

1. Create the project and upgrade to Blaze.
2. Enable **Authentication** (Google provider, support email), **Firestore** (production mode, e.g. `europe-west1`), **Storage** and **Hosting**. Functions are enabled on the first deploy; accept the APIs the CLI asks for.
3. **Project settings → Your apps → Web**: register an app and copy `firebaseConfig` into `.env.local`. Set `VITE_FIREBASE_AUTH_DOMAIN` to the serving domain (`your-project.web.app`), not `firebaseapp.com`, or sign-in breaks on Safari/iOS.
4. **Cloud Messaging → Web Push certificates**: generate a key pair and set `VITE_FIREBASE_VAPID_KEY`.
5. Geoapify: create a browser key for `VITE_GEOAPIFY_API_KEY` and, for catalog geocoding, an unrestricted server key for `GEOAPIFY_API_KEY`.

### Bucket CORS

Backups that include photos and videos read the files with `getBytes`, which needs CORS. Without it, backups carry metadata only.

```bash
cat > cors.json <<'JSON'
[{ "origin": ["https://YOUR-PROJECT.web.app"], "method": ["GET"], "maxAgeSeconds": 3600 }]
JSON
gcloud storage buckets update gs://<VITE_FIREBASE_STORAGE_BUCKET> --cors-file=cors.json
```

Add `http://localhost:5173` to test in dev.

## 2. Local setup

```bash
git clone https://github.com/Seven-Panda-Labs/queima-asfalto.git
cd queima-asfalto
npm install && npm --prefix functions install
cp .env.example .env.local
cp .firebaserc.example .firebaserc
cp functions/.env.example functions/.env
firebase login
firebase use --add YOUR_PROJECT_ID
```

Fill `.env.local`, `.firebaserc` and, as needed, `functions/.env` (`FUNCTIONS_REGION`, `FUNCTIONS_SERVICE_ACCOUNT`, `SCHEDULER_TIMEZONE`, `STORAGE_BUCKET`, `GEOAPIFY_API_KEY`, `DISCOVERY_SOURCES`). `FUNCTIONS_REGION` must match `VITE_FIREBASE_FUNCTIONS_REGION` and the region of the `/api/account-approval` rewrite in `firebase.json`.

**Privacy policy:** set the `PRIVACY_*` variables in `.env.local`. `npm run build` generates the policy at `/privacidade` ([`scripts/generate-privacy-policy.ts`](../scripts/generate-privacy-policy.ts)). Set `PRIVACY_REQUIRED=true` in CI to fail the build when they are missing. The operator is the data controller.

`npm run dev` runs against the real project (add `localhost` to authorized domains). To work without it, see [`emulators.md`](./emulators.md).

## 3. Account approval (optional)

By default any Google account can use the instance. To approve new sign-ups by hand:

1. Enable [Identity Platform](https://firebase.google.com/docs/auth#identity-platform) (needed for blocking functions) and a [Resend](https://resend.com/) account with a verified sender.
2. Set `VITE_ACCOUNT_APPROVAL_REQUIRED=true` in `.env.local`, and in `functions/.env`: `ACCOUNT_APPROVAL_REQUIRED=true`, `APP_PUBLIC_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `APPROVAL_TOKEN_SECRET`.
3. Redeploy Hosting and Functions.

**First run:** there is no admin variable. The admin is any user with `admin: true`, and approval emails go there. Sign in once (you are refused as pending), then in Firestore set `admin: true` and `accountStatus: "approved"` on `users/{your uid}`, and sign in again. Clients cannot write either field. If no user has `admin`, nobody gets approval emails.

New users are refused until approved; the admin gets an email with Approve and Reject links, and the user is emailed the outcome.

## 4. Deploy

```bash
npm run deploy
```

Builds and deploys Hosting, Firestore rules and indexes, Storage rules and Functions. Partial: `npm run deploy:hosting`, or `firebase deploy --only functions` (or `firestore:rules,firestore:indexes`, `storage`).

| Function | Type |
|----------|------|
| `lookupOfficialResults`, share callables (`inviteShare`, `acceptShare`, ...), `adminListUsers`, `adminSetAccountStatus`, `adminDeleteAccount`, `adminRecomputeTracks` | Callable |
| `accountApprovalBeforeUserCreated`, `accountApprovalBeforeUserSignedIn` | Blocking Auth (no-op unless `ACCOUNT_APPROVAL_REQUIRED=true`) |
| `accountApprovalAction` | HTTP, Hosting rewrite `/api/account-approval` |
| `dispatchReminders` | Scheduled, every 60 min |
| `syncParkrunCatalog` | Scheduled, weekly |
| `harvestRaceCatalog` | Scheduled, daily; fetches nothing unless `DISCOVERY_SOURCES` is set |

Limits (`maxInstances`, `concurrency`, timeouts): [`functions/src/functionOptions.ts`](../functions/src/functionOptions.ts).

The parkrun catalog lives in `parkrunCatalog/global`. Without it, or when it is over 45 days old, the app uses `src/data/parkrun-events.json` (`npm run sync:parkrun-events`).

## 5. Post-deploy

1. **Authentication → Authorized domains:** add `YOUR_PROJECT.web.app`, `YOUR_PROJECT.firebaseapp.com` and any custom domain.
2. Apply [`console-restrictions.md`](./console-restrictions.md) (OAuth client, key referrers).
3. Custom domain: **Hosting → Add custom domain**, then authorized domains and key referrers.

## Third-party sites

The operator is responsible for the terms of use of the sites the instance reads. Results lookup runs on demand, one user request at a time, with a per-user rate limit. The catalog harvest crawls third-party sitemaps daily only if `DISCOVERY_SOURCES` is set; read each source's `robots.txt` and terms first. parkrun and MaxFunSports are never looked up: runners upload the official PDF instead. The in-app notice is at `/aviso-resultados` ([`timing-disclaimer.md`](../timing-disclaimer.md)).

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Login fails in production | Authorized domains; OAuth client origins and redirect URI |
| Login fails on Safari/iOS | `VITE_FIREBASE_AUTH_DOMAIN` is the serving domain |
| `Missing VITE_*` | `.env.local` complete before build |
| Callable `internal` / CORS | Functions region matches `VITE_FIREBASE_FUNCTIONS_REGION` |
| Push not working | `VITE_FIREBASE_VAPID_KEY`; browser permission |
| Geoapify 403 | Key referrers include the production domain |
| Scheduled function not running | Blaze; Cloud Scheduler API; Functions logs |
| Backup has no `media/` | Bucket CORS, or media over 300 MB |
| Account deletion leaves files | `STORAGE_BUCKET` matches `VITE_FIREBASE_STORAGE_BUCKET` |
| Approval: no email | Identity Platform; `functions/.env`; Resend sender; an admin user exists |
| Invalid approval link | Same `APPROVAL_TOKEN_SECRET`; token expired (7 days); `APP_PUBLIC_URL` |
