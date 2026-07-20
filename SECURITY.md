# Segurança — Queima Asfalto

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Agradecemos que reportes vulnerabilidades de forma responsável.

### Reportar uma vulnerabilidade

**Não abras issues públicas** para problemas de segurança.

Envia um email para:

**[security@sevenpanda.eu](mailto:security@sevenpanda.eu)**

Inclui, quando possível:

- Descrição do problema e impacto
- Passos para reproduzir
- Versão afectada (commit, tag ou `package.json`)
- Proof-of-concept ou logs relevantes (sem dados pessoais de utilizadores reais)

### O que esperar

- Confirmação de receção em **72 horas** (dias úteis)
- Actualização sobre o estado da investigação assim que possível
- Coordenação contigo antes de divulgação pública, quando aplicável

### Âmbito

Consideramos em âmbito, entre outros:

- Autenticação e autorização (Firestore / Storage rules, Cloud Functions)
- Exposição de dados entre utilizadores (partilhas, redacção)
- Injeção, XSS, CSRF na PWA
- Configuração insegura documentada que afecte deploys self-hosted

Fora de âmbito típico: issues de scraping de sites de timing de terceiros, spam de convites sem exploit técnico, ou problemas que exijam acesso físico ao dispositivo da vítima.

### Versões suportadas

Correcções de segurança são aplicadas na branch `main`. Versões antigas podem não receber backport.

### Detecção de secrets

**CI (Gitleaks):** cada PR e push para `main` corre [Gitleaks](https://github.com/gitleaks/gitleaks) via [`.github/workflows/secret-scan.yml`](../.github/workflows/secret-scan.yml). Configuração em [`.gitleaks.toml`](../.gitleaks.toml). Repositórios de **organização** exigem licença gratuita em [gitleaks.io](https://gitleaks.io) e o secret `GITLEAKS_LICENSE` no repo (injectado no workflow).

**GitHub (nativo):** no repositório, activa em **Settings → Code security and analysis**:

| Funcionalidade | Repositório público | Repositório privado |
|----------------|---------------------|---------------------|
| **Secret scanning** | Gratuito | Requer GitHub Advanced Security |
| **Push protection** | Recomendado (bloqueia push com secret conhecido) | Requer GitHub Advanced Security |

Passos (público):

1. **Secret scanning** → Enable
2. **Push protection** → Enable (opcional mas recomendado)

Nunca commits `.env.local`, `functions/.env`, `.firebaserc`, ficheiros `*-service-account*.json`, ou chaves API reais.

### Divulgação responsável

Pedimos que não divulgues publicamente detalhes até termos tido oportunidade de corrigir e de avisar utilizadores, salvo acordo em contrário.

---

<a id="english"></a>

## English

[Português](#portugues)

We appreciate responsible disclosure of security issues.

### Report a vulnerability

**Do not open public issues** for security problems.

Send an email to:

**[security@sevenpanda.eu](mailto:security@sevenpanda.eu)**

Please include when possible:

- Description of the issue and impact
- Steps to reproduce
- Affected version (commit, tag, or `package.json`)
- Proof-of-concept or relevant logs (no real user personal data)

### What to expect

- Acknowledgement within **72 hours** (business days)
- Status update as soon as we can investigate
- Coordination with you before public disclosure, when applicable

### Scope

In scope includes, among others:

- Authentication and authorization (Firestore / Storage rules, Cloud Functions)
- Cross-user data exposure (sharing, redaction)
- Injection, XSS, CSRF in the PWA
- Documented insecure configuration affecting self-hosted deploys

Typically out of scope: third-party timing site scraping issues, invite spam without a technical exploit, or issues requiring physical access to a victim's device.

### Supported versions

Security fixes are applied on `main`. Older releases may not receive backports.

### Secret detection

**CI (Gitleaks):** every PR and push to `main` runs [Gitleaks](https://github.com/gitleaks/gitleaks) via [`.github/workflows/secret-scan.yml`](../.github/workflows/secret-scan.yml). Config: [`.gitleaks.toml`](../.gitleaks.toml). **Organization** repos require a free license from [gitleaks.io](https://gitleaks.io) and the `GITLEAKS_LICENSE` repository secret (passed in the workflow).

**GitHub (native):** in the repository, enable under **Settings → Code security and analysis**:

| Feature | Public repository | Private repository |
|---------|-------------------|--------------------|
| **Secret scanning** | Free | Requires GitHub Advanced Security |
| **Push protection** | Recommended (blocks pushes with known secrets) | Requires GitHub Advanced Security |

Steps (public repo):

1. **Secret scanning** → Enable
2. **Push protection** → Enable (optional but recommended)

Never commit `.env.local`, `functions/.env`, `.firebaserc`, `*-service-account*.json` files, or real API keys.

### Responsible disclosure

Please do not disclose details publicly until we have had a chance to fix and notify users, unless we agree otherwise.
