# Aviso — scraping de sites de timing e ToS de terceiros

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Documento de referência para **utilizadores**, **operadores de instâncias self-hosted** e **contribuidores**. Não é aconselhamento jurídico — adapta com apoio legal se necessário.

**Texto na app:** rota `/aviso-resultados` (gerado a partir de [`timing-disclaimer.md`](../timing-disclaimer.md)).

### Resumo

| Tema | Posição |
|------|---------|
| O que fazemos | Pedidos HTTP automatizados a URLs **públicas** de resultados, só quando o utilizador pede |
| Afiliação | Nenhuma com organizadores ou fornecedores de timing |
| ToS de terceiros | Responsabilidade do utilizador / operador da instância |
| Dados | Podem estar errados ou incompletos — confirmação manual |
| Código | AGPL-3.0, sem garantias sobre conectores |

### Como funciona tecnicamente

1. O utilizador associa um evento a um link de resultados (ou evento Parkrun com Parkrunner ID).
2. Na página de resultados, clica em **Procurar resultado**.
3. A Cloud Function `lookupOfficialResults` identifica a plataforma (`shared/officialResults/`, conectores em `functions/src/connectors/`) e faz scraping ou chamadas a APIs públicas.
4. Candidatos são mostrados na app; o utilizador **confirma** antes de gravar.

Não há sincronização em background nem crawling em massa: cada lookup é explícito e está sujeito a **rate limit por utilizador** (ver [`cloud-functions-limits.md`](./cloud-functions-limits.md)).

### Plataformas suportadas (referência)

A lista evolui com o código — ver `RESULTS_PLATFORMS` em [`shared/officialResults/types.ts`](../shared/officialResults/types.ts). Exemplos: Parkrun, Sporthive, Davengo, MyRaceResult, mika:timing, EQ Timing, RunCzech, entre outras.

Marcas citadas são propriedade dos respectivos titulares.

### Riscos e limitações

- **Termos de uso:** muitos sites proíbem ou restringem acesso automatizado, scraping ou reutilização de dados. O operador da instância e cada utilizador devem avaliar conformidade.
- **Disponibilidade:** mudanças de HTML, APIs, protecções anti-bot ou bloqueios por IP podem quebrar conectores sem aviso.
- **Exactidão:** tempos e posições reflectem a fonte no momento do pedido; erros de correspondência de nomes são possíveis.
- **Carga nos sites:** mantém limites conservadores (`maxInstances`, cooldown); não aumentes paralelismo para «acelerar» lookups em produção sem avaliar impacto.

### Checklist do operador (self-hosting)

- [ ] Publicar aviso aos utilizadores (`/aviso-resultados` ou texto equivalente na política de privacidade)
- [ ] Rever ToS dos sites de timing que a tua comunidade usa
- [ ] Confirmar rate limits e `maxInstances` em [`cloud-functions-limits.md`](./cloud-functions-limits.md)
- [ ] Incluir importação de resultados na política de privacidade ([`privacy-policy-template.md`](./privacy-policy-template.md) — subcontratantes «sites de timing»)
- [ ] Definir se desactivas a funcionalidade (não deploy de `lookupOfficialResults` ou UI) em jurisdições / contextos de risco
- [ ] Responder a pedidos de bloqueio de fornecedores de timing de forma razoável (contacto na tua instância)

### Relação com outros documentos

| Documento | Ligação |
|-----------|---------|
| [`SECURITY.md`](../SECURITY.md) | Scraping de terceiros fora de âmbito de reporte de vulnerabilidades |
| [`privacy-policy-template.md`](./privacy-policy-template.md) | Dados enviados a sites de timing na importação |
| [`self-hosting.md`](./self-hosting.md) | Deploy de `lookupOfficialResults` |
| [`architecture.md`](./architecture.md) | Diagrama PWA → Firestore → CF → conectores |
| [`adding-a-results-connector.md`](./adding-a-results-connector.md) | Guia para novos conectores de timing |
| [`cloud-functions-limits.md`](./cloud-functions-limits.md) | Quotas e abuso |

### Contribuidores

Ao adicionar ou alterar conectores, segue o guia [`adding-a-results-connector.md`](./adding-a-results-connector.md). Resumo:

- Preferir APIs documentadas ou endpoints públicos estáveis.
- Não contornar autenticação, paywalls ou dados não públicos.
- Documentar origem dos dados e limitações no PR.
- Usar fixtures anonimizados nos testes (ver issue de preparação OSS).

---

<a id="english"></a>

## English

[Português](#portugues)

Reference for **users**, **self-hosted instance operators**, and **contributors**. Not legal advice — adapt with counsel if needed.

**In-app text:** `/aviso-resultados` route (built from [`timing-disclaimer.md`](../timing-disclaimer.md)).

### Summary

| Topic | Position |
|-------|----------|
| What we do | Automated HTTP to **public** results URLs, only when the user requests |
| Affiliation | None with organisers or timing providers |
| Third-party ToS | User / instance operator responsibility |
| Data | May be wrong or incomplete — manual confirmation |
| Code | AGPL-3.0, no warranty on connectors |

### How it works technically

1. The user links an event to a results URL (or Parkrun event with Parkrunner ID).
2. On the results page, they click **Search for result**.
3. The `lookupOfficialResults` Cloud Function detects the platform (`shared/officialResults/`, connectors in `functions/src/connectors/`) and scrapes or calls public APIs.
4. Candidates are shown in the app; the user **confirms** before saving.

There is no background sync or bulk crawling: each lookup is explicit and subject to **per-user rate limiting** (see [`cloud-functions-limits.md`](./cloud-functions-limits.md)).

### Supported platforms (reference)

The list evolves with the code — see `RESULTS_PLATFORMS` in [`shared/officialResults/types.ts`](../shared/officialResults/types.ts). Examples: Parkrun, Sporthive, Davengo, MyRaceResult, mika:timing, EQ Timing, RunCzech, among others.

Cited brands belong to their respective owners.

### Risks and limitations

- **Terms of use:** many sites prohibit or restrict automated access, scraping, or reuse of data. The instance operator and each user must assess compliance.
- **Availability:** HTML/API changes, anti-bot measures, or IP blocks can break connectors without notice.
- **Accuracy:** times and positions reflect the source at request time; name-matching errors are possible.
- **Load on sites:** keep conservative limits (`maxInstances`, cooldown); do not raise parallelism to “speed up” production lookups without assessing impact.

### Operator checklist (self-hosting)

- [ ] Publish notice to users (`/aviso-resultados` or equivalent in your privacy policy)
- [ ] Review ToS of timing sites your community uses
- [ ] Confirm rate limits and `maxInstances` in [`cloud-functions-limits.md`](./cloud-functions-limits.md)
- [ ] Include results import in privacy policy ([`privacy-policy-template.md`](./privacy-policy-template.md) — “timing sites” sub-processors)
- [ ] Decide whether to disable the feature (skip `lookupOfficialResults` deploy or UI) in high-risk contexts
- [ ] Respond reasonably to timing providers’ block requests (via your instance contact)

### Related documents

| Document | Link |
|----------|------|
| [`SECURITY.md`](../SECURITY.md) | Third-party scraping out of scope for vulnerability reports |
| [`privacy-policy-template.md`](./privacy-policy-template.md) | Data sent to timing sites on import |
| [`self-hosting.md`](./self-hosting.md) | Deploying `lookupOfficialResults` |
| [`architecture.md`](./architecture.md) | PWA → Firestore → CF → connectors diagram |
| [`adding-a-results-connector.md`](./adding-a-results-connector.md) | Guide for new timing connectors |
| [`cloud-functions-limits.md`](./cloud-functions-limits.md) | Quotas and abuse |

### Contributors

When adding or changing connectors, follow [`adding-a-results-connector.md`](./adding-a-results-connector.md). Summary:

- Prefer documented APIs or stable public endpoints.
- Do not bypass authentication, paywalls, or non-public data.
- Document data source and limitations in the PR.
- Use anonymized fixtures in tests (see OSS prep issue).
