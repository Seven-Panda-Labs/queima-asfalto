# Limites Cloud Functions — avaliação

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Avaliação de **quotas e limites de escala** (Gen 2) para o projeto Queima Asfalto e instalações self-hosted.

### Inventário

| Função | Tipo | Carga | Risco sem limites |
|--------|------|-------|-------------------|
| `inviteShare`, `acceptShare`, … (10 callables) | Callable | Leitura/escrita Firestore | Escala até quota do projeto; custo moderado |
| `lookupOfficialResults` | Callable | HTTP a sites de timing (até 60 s) | Alto — scraping paralelo, abuso multi-conta |
| `dispatchReminders` | Agendada (60 min) | Scan utilizadores + FCM | Médio — execuções sobrepostas do cron |

### Predefinições Firebase Gen 2 (sem configurar)

| Opção | Valor predefinido | Problema |
|-------|-------------------|----------|
| `maxInstances` | Escala até quota da conta (centenas) | Picos de custo em tráfego ou abuso |
| `concurrency` | 80 por instância | Muitos scrapes HTTP em paralelo no lookup |
| `minInstances` | 0 | OK — sem custo idle |

### Mitigações já existentes

- **Auth obrigatório** em todas as callables (`request.auth`)
- **Rate limit por utilizador** em `lookupOfficialResults` (10 s entre pedidos, Firestore transaction)
- **Regras Firestore** — dados isolados por `userId`

Os limites de instância/concorrência **complementam** o rate limit: protegem o projeto contra muitos utilizadores distintos a fazer lookup em simultâneo e contra escala descontrolada das partilhas.

### Limites aplicados (código)

Definidos em [`functions/src/functionOptions.ts`](../functions/src/functionOptions.ts):

| Grupo | `maxInstances` | `concurrency` | `timeoutSeconds` | Notas |
|-------|----------------|---------------|------------------|-------|
| Callables de partilha | 20 | 40 | 60 | Operações Firestore rápidas |
| `lookupOfficialResults` | 5 | 1 | 60 | Máx. 5 scrapes HTTP em paralelo no projeto |
| `dispatchReminders` | 1 | 1 | 300 | Uma execução do cron de cada vez; timeout maior para muitos utilizadores |

**Capacidade efectiva do lookup:** até **5** pedidos HTTP externos em paralelo no projeto (independentemente do número de utilizadores). Com cooldown de 10 s por utilizador, uso normal fica muito abaixo disto.

### Quando ajustar (self-hosting)

| Cenário | Sugestão |
|---------|----------|
| Poucos utilizadores (&lt; 50) | Valores actuais — suficientes |
| Muitos utilizadores com notificações | Aumentar `SCHEDULER_TIMEOUT_SECONDS` ou processar utilizadores em lotes no código |
| Lookup lento mas tráfego legítimo alto | Subir `LOOKUP_CALLABLE_MAX_INSTANCES` com cuidado (respeitar sites de timing) |
| Fork com tráfego elevado | Rever quotas Firebase Console → Cloud Run; considerar alertas de billing |

Edita as constantes em `functionOptions.ts` ou passa `overrides` em `callableFunctionOptions()` / `scheduleFunctionOptions()`.

### Monitorização recomendada

1. **Firebase Console** → Functions → métricas de invocações, erros, latência
2. **Google Cloud Console** → Cloud Run (cada função Gen 2) → instâncias activas
3. **Alertas de billing** no projeto GCP (recomendado para plano Blaze)

### O que não foi limitado (deliberadamente)

- **`minInstances`:** mantido em 0 — evita custo com instâncias idle
- **CPU / memória:** 256 MiB para callables — suficiente para scraping e PDF parsing moderado
- **Quotas GCP da conta:** continuam no tecto da Google; estes limites são por função, não substituem alertas de conta

---

<a id="english"></a>

## English

[Português](#portugues)

Evaluation of **scaling quotas and limits** (Gen 2) for Queima Asfalto and self-hosted installations.

### Inventory

| Function | Type | Workload | Risk without limits |
|----------|------|----------|---------------------|
| `inviteShare`, `acceptShare`, … (10 callables) | Callable | Firestore read/write | Scales to project quota; moderate cost |
| `lookupOfficialResults` | Callable | HTTP to timing sites (up to 60 s) | High — parallel scraping, multi-account abuse |
| `dispatchReminders` | Scheduled (60 min) | User scan + FCM | Medium — overlapping cron runs |

### Firebase Gen 2 defaults (when unset)

| Option | Default | Issue |
|--------|---------|-------|
| `maxInstances` | Scales to account quota (hundreds) | Cost spikes under traffic or abuse |
| `concurrency` | 80 per instance | Many parallel HTTP scrapes on lookup |
| `minInstances` | 0 | OK — no idle cost |

### Existing mitigations

- **Auth required** on all callables (`request.auth`)
- **Per-user rate limit** on `lookupOfficialResults` (10 s between requests, Firestore transaction)
- **Firestore rules** — data isolated by `userId`

Instance/concurrency limits **complement** the rate limit: they protect the project when many distinct users run lookups at once and cap uncontrolled scaling on shares.

### Applied limits (code)

Defined in [`functions/src/functionOptions.ts`](../functions/src/functionOptions.ts):

| Group | `maxInstances` | `concurrency` | `timeoutSeconds` | Notes |
|-------|----------------|---------------|------------------|-------|
| Share callables | 20 | 40 | 60 | Fast Firestore operations |
| `lookupOfficialResults` | 5 | 1 | 60 | At most 5 parallel HTTP scrapes per project |
| `dispatchReminders` | 1 | 1 | 300 | One cron run at a time; longer timeout for many users |

**Effective lookup capacity:** up to **5** parallel external HTTP requests project-wide (regardless of user count). With a 10 s per-user cooldown, normal use stays well below this.

### When to tune (self-hosting)

| Scenario | Suggestion |
|----------|------------|
| Few users (&lt; 50) | Current values are enough |
| Many users with notifications | Raise `SCHEDULER_TIMEOUT_SECONDS` or batch users in code |
| Slow lookup but high legitimate traffic | Increase `LOOKUP_CALLABLE_MAX_INSTANCES` carefully (respect timing sites) |
| High-traffic fork | Review Firebase Console → Cloud Run quotas; set billing alerts |

Edit constants in `functionOptions.ts` or pass `overrides` to `callableFunctionOptions()` / `scheduleFunctionOptions()`.

### Recommended monitoring

1. **Firebase Console** → Functions → invocations, errors, latency
2. **Google Cloud Console** → Cloud Run (each Gen 2 function) → active instances
3. **Billing alerts** on the GCP project (recommended on Blaze)

### Intentionally not limited

- **`minInstances`:** stays 0 — avoids idle instance cost
- **CPU / memory:** 256 MiB for callables — enough for scraping and moderate PDF parsing
- **GCP account quotas:** still capped by Google; per-function limits do not replace account-level alerts
