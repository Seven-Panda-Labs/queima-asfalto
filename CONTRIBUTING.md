# Contribuir — Queima Asfalto

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Obrigado pelo interesse em contribuir. Este projeto é [AGPL-3.0](../LICENSE). Participa de acordo com o [Código de Conduta](CODE_OF_CONDUCT.md).

### Antes de começar

- Lê o [README](../README.md) e, se fores configurar infra, [`docs/self-hosting.md`](docs/self-hosting.md).
- Procura [issues abertas](https://github.com/xmajox/queima-asfalto/issues) ou abre uma com os [templates em `.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) para discutir mudanças grandes antes de implementar.

### Setup local

**Requisitos:** Node.js 24 (Java 21+ para emuladores ou `npm run test:rules`)

**Opção A — emuladores (sem projeto Firebase)** — recomendado para a maioria das contribuições:

```bash
git clone https://github.com/xmajox/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
cp .env.emulator.example .env.local
npm run emulators    # terminal 1
npm run dev          # terminal 2 — login «Entrar (emulador)»
```

Ver [`docs/emulators.md`](docs/emulators.md).

**Opção B — projeto Firebase teu** (Google Sign-In, dados na cloud):

```bash
git clone https://github.com/xmajox/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
cp .env.example .env.local
cp .firebaserc.example .firebaserc
```

Preenche `.env.local` (ver [`.env.example`](../.env.example) e [`docs/configuration.md`](docs/configuration.md)). Plano Spark gratuito chega para dev.

Activa o hook de pre-commit (recomendado, uma vez por clone):

```bash
npm run setup:githooks
```

```bash
npm run dev          # http://localhost:5173
```

### Verificações obrigatórias

Antes de abrir PR, corre localmente (o mesmo comando que o CI):

```bash
npm run check
```

O CI também corre **Gitleaks** em cada PR (ver [`.github/workflows/secret-scan.yml`](.github/workflows/secret-scan.yml)).

Equivale a:

| Comando | O quê |
|---------|--------|
| `npm run lint` | Oxlint |
| `npm run test` | Vitest (497+ testes) |
| `npm run test:rules` | Firestore rules (emulador; valida `storagePath`/`downloadUrl` em media) |
| `npm run check:changelog` | `package.json` ↔ `change-log.md` ↔ `change-log.en.md` |

Relatório e verificação de licenças: `npm run licenses` (resumo) · `npm run check:licenses` (validação CI).

Corre também `npm --prefix functions run build` se alterares código em `functions/src/`.

### Changelog (obrigatório em bumps de versão)

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Dois ficheiros, sempre em paralelo:

- [`change-log.md`](../change-log.md) — português
- [`change-log.en.md`](../change-log.en.md) — inglês

As versões no changelog correspondem ao campo `version` em `package.json`. Os ficheiros são públicos e orientados ao utilizador — descreve o que mudou na app, sem detalhe de implementação (nomes de hooks, testes, issues, etc.).

**Quando fazes bump de versão** em `package.json`:

1. Adiciona no **topo** de ambos os ficheiros: `## [X.Y.Z] — AAAA-MM-DD`
2. Usa secções `### Adicionado`, `### Corrigido`, `### Alterado`, `### Removido` (EN: Added, Fixed, Changed, Removed)
3. Inclui os dois ficheiros no commit
4. Confirma com `npm run check:changelog`

O pre-commit hook bloqueia commits que alterem `package.json` sem changelogs em stage.

**PRs sem bump de versão** (docs, testes, refactors pequenos): changelog não é obrigatório. O maintainer faz bump na release.

| Tipo | Significado |
|------|-------------|
| **Adicionado** | Funcionalidades novas |
| **Alterado** | Mudanças em funcionalidades existentes |
| **Corrigido** | Correções de bugs |
| **Removido** | Funcionalidades retiradas |

**Exemplo:**

```markdown
## [1.11.0] — 2026-07-20

### Adicionado

- Pesquisa de eventos Parkrun no catálogo global.

### Corrigido

- …
```

### Estilo de código

- **Simplicidade primeiro** — diff mínimo; não refactors não pedidos.
- **Segue o ficheiro** — naming, imports e padrões do módulo que editas.
- **Lógica testável** — funções puras em `shared/` quando fizer sentido; evita lógica de negócio enterrada em lifecycle de UI.
- **Sem secrets** — nunca commits `.env.local`, `functions/.env`, `.firebaserc`, service accounts.
- **PII em testes** — usa dados fictícios (ex. «Zé Ninguém»); não dados pessoais reais em fixtures.

### Conectores de resultados oficiais

Para uma nova plataforma de timing, segue [`docs/adding-a-results-connector.md`](docs/adding-a-results-connector.md) (checklist de ficheiros, testes, emuladores). Lógica pura em `shared/officialResults/`; HTTP em `functions/src/connectors/`.

### Pull requests

1. **Branch** a partir de `main` com nome descritivo (`feat/parkrun-picker`, `fix/share-timestamp`).
2. **Título** em inglês, imperativo, ~50 caracteres: `Add Parkrun catalog search` / `Fix Firestore timestamp parsing`.
3. **Descrição** — o GitHub pré-preenche [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md); mantém as secções Summary e Test plan:

```markdown
## Summary
- O que mudou e porquê (1–3 bullets)

## Test plan
- [ ] `npm run check`
- [ ] Testei manualmente: …
- [ ] Changelog actualizado (se bump de versão)
```

4. **Scope** — um tema por PR; evita mixes de feature + refactor + formatação.
5. **Screenshots** — para mudanças de UI, quando relevante.
6. **Issues** — referencia `Fixes #NNN` ou `Refs #NNN` na descrição.

### Commits

- Mensagens em **inglês**, imperativo: `Fix share invite email normalization`.
- Um commit por PR é aceitável; histórico limpo preferível a WIP commits.
- Não forces push para `main` — usa PR.

### Licença

Ao contribuíres, aceitas licenciar o teu código sob [AGPL-3.0](../LICENSE).

---

<a id="english"></a>

## English

[Português](#portugues)

Thank you for contributing. This project is [AGPL-3.0](../LICENSE). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

### Before you start

- Read the [README](../README.md) and, for infrastructure setup, [`docs/self-hosting.md`](docs/self-hosting.md).
- Check [open issues](https://github.com/xmajox/queima-asfalto/issues) or open one using the [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) forms to discuss larger changes before implementing.

### Local setup

**Requirements:** Node.js 24 (Java 21+ for emulators or `npm run test:rules`)

**Option A — emulators (no Firebase project)** — recommended for most contributions:

```bash
git clone https://github.com/xmajox/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
cp .env.emulator.example .env.local
npm run emulators    # terminal 1
npm run dev          # terminal 2 — “Sign in (emulator)”
```

See [`docs/emulators.md`](docs/emulators.md).

**Option B — your Firebase project** (Google Sign-In, cloud data):

```bash
git clone https://github.com/xmajox/queima-asfalto.git
cd queima-asfalto
npm install
npm --prefix functions install
cp .env.example .env.local
cp .firebaserc.example .firebaserc
```

Fill in `.env.local` (see [`.env.example`](../.env.example) and [`docs/configuration.md`](docs/configuration.md)). Free Spark plan is enough for dev.

Enable the pre-commit hook (recommended, once per clone):

```bash
npm run setup:githooks
```

```bash
npm run dev          # http://localhost:5173
```

### Required checks

Before opening a PR, run locally (same command as CI):

```bash
npm run check
```

CI also runs **Gitleaks** on every PR (see [`.github/workflows/secret-scan.yml`](.github/workflows/secret-scan.yml)).

This runs:

| Command | What |
|---------|------|
| `npm run lint` | Oxlint |
| `npm run test` | Vitest (497+ tests) |
| `npm run test:rules` | Firestore rules (emulator; validates media `storagePath`/`downloadUrl`) |
| `npm run check:changelog` | `package.json` ↔ `change-log.md` ↔ `change-log.en.md` |

License report and verification: `npm run licenses` (summary) · `npm run check:licenses` (CI validation).

Also run `npm --prefix functions run build` if you change `functions/src/`.

### Changelog (required on version bumps)

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Two files, always in sync:

- [`change-log.md`](../change-log.md) — Portuguese
- [`change-log.en.md`](../change-log.en.md) — English

Changelog versions match the `version` field in `package.json`. The files are public and user-facing — describe what changed in the app, not implementation details (hook names, tests, issues, etc.).

**When you bump** `package.json` version:

1. Add at the **top** of both files: `## [X.Y.Z] — YYYY-MM-DD`
2. Use `### Added`, `### Fixed`, `### Changed`, `### Removed` (PT: Adicionado, Corrigido, Alterado, Removido)
3. Include both files in the commit
4. Verify with `npm run check:changelog`

The pre-commit hook blocks commits that change `package.json` without staged changelogs.

**PRs without a version bump** (docs, tests, small refactors): changelog not required. The maintainer bumps on release.

| Type | Meaning |
|------|---------|
| **Added** | New features |
| **Changed** | Changes to existing features |
| **Fixed** | Bug fixes |
| **Removed** | Removed features |

**Example:**

```markdown
## [1.11.0] — 2026-07-20

### Added

- Parkrun event search in the global catalog.

### Fixed

- …
```

### Code style

- **Simplicity first** — minimal diff; no drive-by refactors.
- **Match the file** — naming, imports, and patterns of the module you edit.
- **Testable logic** — pure functions in `shared/` when it makes sense; avoid business logic buried in UI lifecycle.
- **No secrets** — never commit `.env.local`, `functions/.env`, `.firebaserc`, or service account JSON.
- **PII in tests** — use fictional data (e.g. «Zé Ninguém»); no real personal data in fixtures.

### Official results connectors

For a new timing platform, follow [`docs/adding-a-results-connector.md`](docs/adding-a-results-connector.md) (file checklist, tests, emulators). Pure logic in `shared/officialResults/`; HTTP in `functions/src/connectors/`.

### Pull requests

1. **Branch** from `main` with a descriptive name (`feat/parkrun-picker`, `fix/share-timestamp`).
2. **Title** in English, imperative, ~50 chars: `Add Parkrun catalog search` / `Fix Firestore timestamp parsing`.
3. **Description** — GitHub pre-fills [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md); keep the Summary and Test plan sections:

```markdown
## Summary
- What changed and why (1–3 bullets)

## Test plan
- [ ] `npm run check`
- [ ] Manually tested: …
- [ ] Changelog updated (if version bump)
```

4. **Scope** — one theme per PR; avoid feature + refactor + formatting mixes.
5. **Screenshots** — for UI changes when relevant.
6. **Issues** — reference `Fixes #NNN` or `Refs #NNN` in the description.

### Commits

- Messages in **English**, imperative mood: `Fix share invite email normalization`.
- One commit per PR is fine; clean history beats WIP commits.
- Do not force-push to `main` — use a PR.

### License

By contributing, you agree to license your code under [AGPL-3.0](../LICENSE).
