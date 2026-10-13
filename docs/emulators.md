# Firebase emulators

Develop without a cloud project using the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite).

Requirements: Node.js 24, Java JDK 21+ (Firestore emulator), `firebase-tools` (in `devDependencies`, run as `npx firebase`).

## Quick start

```bash
# terminal 1
npm run emulators

# terminal 2
cp .env.emulator.example .env.local
npm install && npm --prefix functions install
npm run dev
```

Project ID is `demo-queima-asfalto` (no `.firebaserc` needed). Open http://localhost:5173 and use **"Sign in (emulator)"**: Google sign-in does not work against the Auth emulator. Dev account: `dev@queima-asfalto.local` / `devpassword`, created on first sign-in.

Ports (set in [`firebase.json`](../firebase.json), wired in [`src/services/firebase.ts`](../src/services/firebase.ts)): UI 4000, Auth 9099, Firestore 8080, Functions 5001, Storage 9199.

## Demo data

Sign in once, take the account uid from the Emulator UI, then:

```bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto
npm run seed:race-catalog -- --confirm
npm run seed:demo-user -- --confirm --user-id <uid>
```

The demo user only gets races present in the catalog; the rest are skipped with a warning. `--dry-run` writes nothing. The seed refuses an emulator project whose ID does not start with `demo-`.

## Hybrid mode

Real project with emulated Functions only: real credentials in `.env.local`, `VITE_FUNCTIONS_EMULATOR=true` (without `VITE_USE_FIREBASE_EMULATORS`), then `npm run emulators`.

## Limitations

- No Google sign-in, Web Push or Analytics. Geoapify needs a real key.
- Scheduled functions (e.g. `dispatchReminders`) do not fire on their own.
- Results lookup makes real HTTP requests to timing sites.
- Writing `events/.../media` documents fails: the rules require a production Storage `downloadUrl`, the emulator returns `127.0.0.1:9199`. Uploads and backup restores with files need a real project.
- Firestore uses an in-memory cache (no offline persistence).

## Rules tests

`npm run test:rules` runs [`firestore.rules.test.ts`](../firestore.rules.test.ts) against the Firestore emulator. Part of `npm run check` and CI. For coverage, see the `describe` blocks in that file.

## Persist data

```bash
firebase emulators:start --project demo-queima-asfalto --import=./emulator-data --export-on-exit=./emulator-data
```

`emulator-data/` is gitignored.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Java version before 21` | Install JDK 21+ |
| Every Firestore query denied | `functions/.env` has `ACCOUNT_APPROVAL_REQUIRED=true`, so the dev account was created `pending`. Set `accountStatus` to `approved` on `users/{uid}` in the Emulator UI |
| `connection refused` on callables | `npm run emulators` running and `VITE_USE_FIREBASE_EMULATORS=true` |
| Callable `permission-denied` | Emulator data is wiped on restart; recreate the data |
