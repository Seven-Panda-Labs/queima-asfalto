# Agent instructions — Queima Asfalto

**Public repository:** [github.com/Seven-Panda-Labs/queima-asfalto](https://github.com/Seven-Panda-Labs/queima-asfalto)

This file defines how AI agents (Cursor, CI bots, etc.) should work in this repo **from July 2026 onward**. Humans: see [CONTRIBUTING.md](CONTRIBUTING.md) as well.

## Golden rule

**Nothing lands on `main` without a reviewed PR and green CI.** Do not push directly to `main`, except when the user explicitly requests an emergency hotfix **and** confirms they may bypass the normal flow.

## Mandatory Git workflow

1. Update local `main`:
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   ```
2. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feat/short-description
   # or: fix/…, docs/…, chore/…, test/…
   ```
3. Implement with a **minimal diff** — no unsolicited refactors.
4. Run checks **on the branch** (same as CI):
   ```bash
   npm run check
   ```
   If you changed `functions/src/`: `npm --prefix functions run build` (already included in `check`).
5. **Commit** only when the user explicitly asks.
6. Push the **branch** (not `main`):
   ```bash
   git push -u origin HEAD
   ```
7. Open a **PR** to `main` when the user asks (or after verified completion):
   ```bash
   gh pr create --base main --title "…" --body "…"
   ```
   Use [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

## Before opening a PR

| Check | Command / note |
|-------|----------------|
| Lint + tests + rules + changelog | `npm run check` |
| Licenses (if deps changed) | `npm run check:licenses` |
| No secrets | CI Gitleaks; never commit `.env.local`, keys, service accounts |
| No PII in fixtures | Fictional names only (e.g. «Zé Ninguém») |
| Changelog (on version bump) | `change-log.md` + `change-log.en.md` + `package.json` |
| Scope | One topic per PR |

## What agents must **not** do

- `git push origin main` (unless explicit hotfix instruction)
- `git push --force` to `main` / `master`
- Commit or push without user request
- Firebase deploy (`npm run deploy`) without explicit request
- Change the user's `git config`
- `--no-verify` / skip hooks without request
- Secrets, real PII, or credentials in code, commits, or PRs
- Large PRs mixing feature + refactor + formatting

## Commits

- **English**, imperative subject lines: `Fix share invite email normalization`
- Prefer one focused PR over many WIP commits

## Deploy and production

- Official instance: `https://queima-asfalto.web.app`
- Deploy only when the user asks; after merge to `main` or from a branch if instructed

## Reference docs

| Topic | File |
|-------|------|
| Human contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Security / secrets | [SECURITY.md](SECURITY.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Connectors | [docs/adding-a-results-connector.md](docs/adding-a-results-connector.md) |
| Self-hosting | [docs/self-hosting.md](docs/self-hosting.md) |

## GitHub CI

Every PR and push to `main` runs:

- **CI** — `npm run check`
- **License check**
- **Secret scan** — Gitleaks (org repos need `GITLEAKS_LICENSE`)

The branch must pass CI before merge.
