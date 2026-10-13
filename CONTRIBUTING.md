# Contributing

Thanks for helping. The project is [AGPL-3.0](LICENSE): by contributing you license your code under it. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

The workflow and writing rules live in [AGENTS.md](AGENTS.md) and apply to humans too. This file covers setup and the essentials.

## Before you start

For anything larger than a small fix, open an [issue](https://github.com/Seven-Panda-Labs/queima-asfalto/issues) first ([templates](.github/ISSUE_TEMPLATE/)).

## Setup

Node.js 24. Java 21+ for the emulators and `npm run test:rules`.

```bash
git clone https://github.com/Seven-Panda-Labs/queima-asfalto.git
cd queima-asfalto
npm install && npm --prefix functions install
npm run setup:githooks                 # once per clone
cp .env.emulator.example .env.local
npm run emulators                      # terminal 1
npm run dev                            # terminal 2, http://localhost:5173
```

Sign in with «Entrar (emulador)» / "Sign in (emulator)". Details: [docs/emulators.md](docs/emulators.md). Using your own Firebase project instead: [docs/self-hosting.md](docs/self-hosting.md) and [docs/configuration.md](docs/configuration.md).

## Checks

`npm run check` is what CI runs: functions build, typecheck, lint, tests, Firestore rules tests and the changelog check. If you change dependencies, also run `npm run check:licenses`. CI additionally runs Gitleaks.

## Changelog

Needed only when bumping `version` in `package.json` (docs, tests and refactors usually don't). Add a section at the top of all six files, `change-log{,.en,.es,.de,.fr,.ar}.md`:

```markdown
## [1.11.0] - 2026-07-20

### Added

- Parkrun event search in the global catalog.
```

Sections: Added, Changed, Fixed, Removed (translated in each file). Write for users, not about the implementation. `npm run check:changelog` verifies the versions match.

## Pull requests

- Branch from `main` (`feat/…`, `fix/…`, `docs/…`); `main` only changes through a reviewed PR with green CI.
- One topic per PR, minimal diff. Follow the patterns of the file you edit.
- English, imperative title and commits: `Fix share invite email normalization`.
- Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md); add screenshots for UI changes and `Fixes #NNN` where it applies.
- No secrets (`.env.local`, `functions/.env`, `.firebaserc`, service accounts) and no real personal data in fixtures (use names like «Zé Ninguém»).

New timing platform? See [docs/adding-a-results-connector.md](docs/adding-a-results-connector.md).
