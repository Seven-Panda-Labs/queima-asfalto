# Modelo de política de privacidade — self-hosting

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Modelo para **quem faz deploy da sua própria instância** do Queima Asfalto. Não é aconselhamento jurídico — adapta com apoio legal se necessário.

**Geração automática no build:** com as variáveis `PRIVACY_*` em `.env.local`, `npm run build` injecta o conteúdo na rota `/privacidade` (layout, tema e navegação da app). Ver secção [Geração automática](#geracao-automatica) e [`configuration.md`](./configuration.md).

O referencial na UE é o **GDPR**. Este modelo segue a estrutura típica exigida ou esperada:

| Secção | Objectivo |
|--------|-----------|
| Responsável pelo tratamento | Quem é o «data controller» (o self-hoster, não o repositório GitHub) |
| Dados tratados | Inventário transparente |
| Finalidades e bases legais | Porque e com que fundamento |
| Subcontratantes | Firebase, Geoapify, sites de timing, etc. |
| Conservação | Quanto tempo guardas os dados |
| Direitos dos titulares | Acesso, rectificação, apagamento, portabilidade, oposição |
| Transferências internacionais | Ex.: Google (EUA) |
| Contacto | Email ou formulário do operador da instância |

---

### Campos a preencher (self-hoster)

Substitui os marcadores `{{...}}` antes de publicar (página web, README da instância, ou link no rodapé da PWA).

| Marcador | Exemplo |
|----------|---------|
| `{{INSTANCE_NAME}}` | «Meu Plano de Corridas» |
| `{{CONTROLLER_NAME}}` | «João Silva» ou «Associação XYZ» |
| `{{CONTACT_EMAIL}}` | `privacidade@exemplo.org` |
| `{{HOSTING_URL}}` | `https://meu-plano.web.app` |
| `{{EFFECTIVE_DATE}}` | `2026-07-20` |
| `{{FIREBASE_REGION}}` | `europe-west1` (ou a tua região Firestore) |
| `{{USES_ANALYTICS}}` | `sim` / `não` |
| `{{USES_GEOAPIFY}}` | `sim` / `não` |
| `{{USES_PUSH}}` | `sim` / `não` |

---

### Texto do modelo (copiar e adaptar)

#### Política de privacidade — {{INSTANCE_NAME}}

**Última actualização:** {{EFFECTIVE_DATE}}

#### 1. Quem somos

O responsável pelo tratamento dos dados pessoais nesta instância é **{{CONTROLLER_NAME}}**, operador de **{{HOSTING_URL}}** (a seguir «nós» ou «o operador»).

O software [Queima Asfalto](https://github.com/Seven-Panda-Labs/queima-asfalto) é open source (AGPL-3.0). Os autores do código **não** são responsáveis pelo tratamento de dados na tua instância self-hosted.

#### 2. Âmbito

Esta política aplica-se aos utilizadores que criam conta e usam a PWA em **{{HOSTING_URL}}**.

#### 3. Dados que podemos tratar

Consoante as funcionalidades activadas, a instância pode tratar:

| Categoria | Exemplos | Onde |
|-----------|----------|------|
| **Conta** | Nome, email, identificador Google (Firebase Auth UID) | Firebase Authentication, Firestore `users/{uid}` |
| **Perfil de resultados** | Nome para classificações, aliases, Parkrunner ID, Parkruns favoritos | Firestore `users/{uid}` |
| **Conteúdo da app** | Eventos, metas, resultados, notas, localizações, coordenadas GPS | Firestore (`events`, `goals`, `performanceGoals`, `bucketListItems`, …) |
| **Media** | Fotos e vídeos de eventos | Firebase Storage |
| **Partilhas** | Email do convidado, permissões, dados redigidos partilhados | Firestore `shares`, Cloud Functions |
| **Notificações** (se activadas) | Tokens FCM, preferências de lembrete, idioma, offset de fuso horário | Firestore `users/{uid}` |
| **Preferências locais** | Tema, idioma, modos de vista | `localStorage` do browser (prefixo por utilizador) |
| **Analytics** (se activado) | Visualizações de página, metadados do browser | Google Analytics via Firebase (`measurementId`) |
| **Geocodificação** (se activada) | Texto de pesquisa de local, coordenadas | Pedidos do browser à API Geoapify |
| **Importação de resultados** | Nome/Parkrunner ID, URL pública do evento | Cloud Function `lookupOfficialResults` → pedidos HTTP a **sites de timing de terceiros** |

Não recolhemos intencionalmente dados de menores de 16 anos. Se tiveres conhecimento de que um menor forneceu dados, contacta-nos.

#### 4. Finalidades e bases legais (GDPR)

| Finalidade | Base legal típica |
|------------|-------------------|
| Criar conta e sincronizar dados entre dispositivos | Execução de contrato / passos pré-contratuais (art. 6.º(1)(b)) |
| Partilhas entre utilizadores | Execução de contrato |
| Lembretes push (opt-in) | Consentimento (art. 6.º(1)(a)) — o utilizador activa em Definições |
| Analytics (se activado) | Consentimento ou interesse legítimo, conforme a tua configuração e jurisdição |
| Segurança e prevenção de abuso | Interesse legítimo (art. 6.º(1)(f)) |
| Importação de resultados oficiais | Execução de contrato (funcionalidade solicitada pelo utilizador) |

Ajusta as bases legais com o teu consultor se a instância tiver contexto associativo, empresarial ou educativo.

#### 5. Subcontratantes e serviços de terceiros

| Serviço | Fornecedor | Dados típicos | Notas |
|---------|------------|---------------|-------|
| Auth, base de dados, ficheiros, funções, push | Google Firebase / Google Cloud | Conforme secção 3 | Região configurada: **{{FIREBASE_REGION}}**. [Privacidade Google](https://policies.google.com/privacy) |
| Autocomplete / mapa | Geoapify (se `{{USES_GEOAPIFY}}`) | Queries de localização | [Privacidade Geoapify](https://www.geoapify.com/privacy-policy) |
| Login | Google (OAuth) | Email, nome, foto de perfil Google | Política Google |
| Sites de timing | Vários (públicos) | Nome ou ID em páginas de resultados públicas | Scraping apenas de URLs **públicas**; sujeito aos ToS de cada site |

Lista completa de dependências open source: `npm run licenses` no repositório.

#### 6. Conservação

- **Conta e conteúdo:** enquanto a conta existir ou até pedido de apagamento.
- **Tokens FCM inválidos:** removidos automaticamente pela função `dispatchReminders` quando detectados.
- **Logs Firebase/Google Cloud:** conforme a retenção configurada no teu projeto GCP (recomendado: definir e documentar).

Descreve aqui a tua política concreta: `{{RETENTION_POLICY}}` (ex.: «apagamento em 30 dias após pedido por email»).

#### 7. Transferências internacionais

O Firebase e a Google podem processar dados fora do EEE (ex.: EUA), com cláusulas contratuais tipo ou mecanismos equivalentes oferecidos pela Google. Ver documentação do teu projeto Firebase / Google Cloud.

#### 8. Direitos dos titulares

Nos termos do GDPR, os utilizadores podem solicitar:

- Acesso, rectificação, apagamento
- Limitação ou oposição ao tratamento
- Portabilidade (dados fornecidos por eles, em formato estruturado)
- Retirar consentimento (ex.: notificações push) sem afectar tratamentos anteriores
- Reclamação junto da autoridade de controlo (em Portugal: [CNPD](https://www.cnpd.pt))

**Pedidos:** [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}). Prazo de resposta recomendado: 30 dias.

**Apagamento de conta:** documenta o teu processo (ex.: apagar documento `users/{uid}`, eventos, media em Storage, partilhas). O software não inclui ainda um botão «apagar conta» automático — o operador deve apagar manualmente no Firebase Console ou via script.

#### 9. Segurança

Medidas incluídas no software: regras Firestore/Storage por utilizador, autenticação obrigatória, redacção server-side em partilhas, rate limiting em lookups. O operador deve seguir [`console-restrictions.md`](./console-restrictions.md) e [`self-hosting.md`](./self-hosting.md).

#### 10. Alterações

Publicaremos a data de actualização no topo desta página. Alterações relevantes podem ser comunicadas por email ou aviso na app.

#### 11. Contacto

**{{CONTROLLER_NAME}}**  
Email: [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}})  
Instância: {{HOSTING_URL}}

---

### Onde publicar

| Opção | Notas |
|-------|-------|
| Página estática no Hosting (`public/privacidade.html` ou rota React) | Recomendado para utilizadores finais |
| Link no rodapé / Definições | Boa prática UX |
| README da instância | Aceitável para grupos pequenos |

### Checklist do operador

- [ ] Preencher todos os `{{...}}`
- [ ] Confirmar se Analytics (`{{USES_ANALYTICS}}`) e Geoapify (`{{USES_GEOAPIFY}}`) estão activos
- [ ] Configurar alertas de billing e acesso mínimo ao Firebase Console
- [ ] Definir processo de pedidos GDPR (email + prazo)
- [ ] Rever ToS dos sites de timing usados pelos teus utilizadores (ver [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md))
- [ ] Linkar o aviso na app (`/aviso-resultados`) ou equivalente no rodapé / definições

---

<a id="geracao-automatica"></a>

### Geração automática (recomendado)

1. Define em `.env.local` as variáveis `PRIVACY_*` (ver [`.env.example`](../.env.example)).
2. `npm run build` corre `generate:privacy` antes do Vite — conteúdo disponível em `/privacidade` dentro da app.
3. O ficheiro `.env.privacy.generated` activa `VITE_PRIVACY_POLICY_ENABLED` no build (gitignored).
4. Em deploy CI, define `PRIVACY_REQUIRED=true` para falhar se faltar configuração.

Texto fonte: [`scripts/privacy-policy.template.md`](../scripts/privacy-policy.template.md) (sincronizado com este documento).

---

<a id="english"></a>

## English

[Português](#portugues)

Template for **operators who deploy their own instance** of Queima Asfalto. Not legal advice — adapt with counsel if needed.

**Automatic build generation:** with `PRIVACY_*` in `.env.local`, `npm run build` injects content into the `/privacidade` route (app layout, theme, and navigation). See [Automatic generation](#automatic-generation) and [`configuration.md`](./configuration.md).

In the EU the usual framework is **GDPR**. This template follows typical required sections:

| Section | Purpose |
|---------|---------|
| Data controller | Who is responsible (the self-hoster, not the GitHub repo) |
| Data processed | Transparent inventory |
| Purposes and legal bases | Why and on what grounds |
| Sub-processors | Firebase, Geoapify, timing sites, etc. |
| Retention | How long you keep data |
| Data subject rights | Access, erasure, portability, objection |
| International transfers | e.g. Google (US) |
| Contact | Operator email or form |

---

### Fields to complete (self-hoster)

Replace `{{...}}` placeholders before publishing (web page, instance README, or PWA footer link).

| Placeholder | Example |
|-------------|---------|
| `{{INSTANCE_NAME}}` | «My Running Plan» |
| `{{CONTROLLER_NAME}}` | «Jane Doe» or «XYZ Association» |
| `{{CONTACT_EMAIL}}` | `privacy@example.org` |
| `{{HOSTING_URL}}` | `https://my-plan.web.app` |
| `{{EFFECTIVE_DATE}}` | `2026-07-20` |
| `{{FIREBASE_REGION}}` | `europe-west1` (or your Firestore region) |
| `{{USES_ANALYTICS}}` | `yes` / `no` |
| `{{USES_GEOAPIFY}}` | `yes` / `no` |
| `{{USES_PUSH}}` | `yes` / `no` |

---

### Template text (copy and adapt)

#### Privacy policy — {{INSTANCE_NAME}}

**Last updated:** {{EFFECTIVE_DATE}}

#### 1. Who we are

The data controller for this instance is **{{CONTROLLER_NAME}}**, operator of **{{HOSTING_URL}}** (“we” or “the operator”).

The [Queima Asfalto](https://github.com/Seven-Panda-Labs/queima-asfalto) software is open source (AGPL-3.0). The code authors are **not** data controllers for your self-hosted instance.

#### 2. Scope

This policy applies to users who sign up and use the PWA at **{{HOSTING_URL}}**.

#### 3. Data we may process

Depending on enabled features, the instance may process:

| Category | Examples | Where |
|----------|----------|-------|
| **Account** | Name, email, Google identifier (Firebase Auth UID) | Firebase Authentication, Firestore `users/{uid}` |
| **Results profile** | Name for rankings, aliases, Parkrunner ID, favorite Parkruns | Firestore `users/{uid}` |
| **App content** | Events, goals, results, notes, locations, GPS coordinates | Firestore (`events`, `goals`, `performanceGoals`, `bucketListItems`, …) |
| **Media** | Event photos and videos | Firebase Storage |
| **Sharing** | Invitee email, permissions, redacted shared data | Firestore `shares`, Cloud Functions |
| **Notifications** (if enabled) | FCM tokens, reminder prefs, language, timezone offset | Firestore `users/{uid}` |
| **Local preferences** | Theme, language, view modes | Browser `localStorage` (per-user prefix) |
| **Analytics** (if enabled) | Page views, browser metadata | Google Analytics via Firebase (`measurementId`) |
| **Geocoding** (if enabled) | Location search text, coordinates | Browser requests to Geoapify API |
| **Results import** | Name/Parkrunner ID, public event URL | Cloud Function `lookupOfficialResults` → HTTP requests to **third-party timing websites** |

We do not knowingly collect data from children under 16. Contact us if you believe a child has provided data.

#### 4. Purposes and legal bases (GDPR)

| Purpose | Typical legal basis |
|---------|---------------------|
| Account and sync across devices | Contract / pre-contract steps (Art. 6(1)(b)) |
| Sharing between users | Contract |
| Push reminders (opt-in) | Consent (Art. 6(1)(a)) — user enables in Settings |
| Analytics (if enabled) | Consent or legitimate interest, per your setup and jurisdiction |
| Security and abuse prevention | Legitimate interest (Art. 6(1)(f)) |
| Official results import | Contract (feature requested by the user) |

Adjust legal bases with counsel if your instance is association, corporate, or educational.

#### 5. Sub-processors and third parties

| Service | Provider | Typical data | Notes |
|---------|----------|--------------|-------|
| Auth, database, files, functions, push | Google Firebase / Google Cloud | Per section 3 | Configured region: **{{FIREBASE_REGION}}**. [Google Privacy](https://policies.google.com/privacy) |
| Autocomplete / map | Geoapify (if `{{USES_GEOAPIFY}}`) | Location queries | [Geoapify Privacy](https://www.geoapify.com/privacy-policy) |
| Sign-in | Google (OAuth) | Email, name, Google profile photo | Google policy |
| Timing sites | Various (public) | Name or ID on public results pages | Scraping of **public** URLs only; subject to each site’s ToS |

Full open-source dependency list: `npm run licenses` in the repository.

#### 6. Retention

- **Account and content:** while the account exists or until erasure request.
- **Invalid FCM tokens:** removed automatically by `dispatchReminders` when detected.
- **Firebase/Google Cloud logs:** per retention configured in your GCP project (recommended: define and document).

Describe your concrete policy: `{{RETENTION_POLICY}}` (e.g. “deletion within 30 days of email request”).

#### 7. International transfers

Firebase and Google may process data outside the EEA (e.g. US), using standard contractual clauses or equivalent mechanisms. See your Firebase / Google Cloud project documentation.

#### 8. Your rights

Under GDPR, users may request:

- Access, rectification, erasure
- Restriction or objection to processing
- Portability (data they provided, in a structured format)
- Withdraw consent (e.g. push notifications) without affecting prior processing
- Lodge a complaint with a supervisory authority (Portugal: [CNPD](https://www.cnpd.pt))

**Requests:** [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}). Recommended response time: 30 days.

**Account deletion:** document your process (e.g. delete `users/{uid}`, events, Storage media, shares). The software does not yet include an automatic “delete account” button — the operator deletes via Firebase Console or script.

#### 9. Security

Software measures include per-user Firestore/Storage rules, mandatory authentication, server-side redaction on shares, lookup rate limiting. Operators should follow [`console-restrictions.md`](./console-restrictions.md) and [`self-hosting.md`](./self-hosting.md).

#### 10. Changes

We will post the update date at the top of this page. Material changes may be notified by email or in-app notice.

#### 11. Contact

**{{CONTROLLER_NAME}}**  
Email: [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}})  
Instance: {{HOSTING_URL}}

---

### Where to publish

| Option | Notes |
|--------|-------|
| Static Hosting page (`public/privacy.html` or React route) | Recommended for end users |
| Footer / Settings link | Good UX practice |
| Instance README | Acceptable for small groups |

### Operator checklist

- [ ] Fill in all `{{...}}` placeholders
- [ ] Confirm whether Analytics (`{{USES_ANALYTICS}}`) and Geoapify (`{{USES_GEOAPIFY}}`) are enabled
- [ ] Configure billing alerts and least-privilege Firebase Console access
- [ ] Define GDPR request handling (email + timeline)
- [ ] Review ToS of timing sites your users rely on (see [`timing-scraping-disclaimer.md`](./timing-scraping-disclaimer.md))
- [ ] Link the in-app notice (`/aviso-resultados`) or equivalent in footer / settings

---

<a id="automatic-generation"></a>

### Automatic generation (recommended)

1. Set `PRIVACY_*` in `.env.local` (see [`.env.example`](../.env.example)).
2. `npm run build` runs `generate:privacy` before Vite — content is served at `/privacidade` inside the app.
3. `.env.privacy.generated` enables `VITE_PRIVACY_POLICY_ENABLED` at build time (gitignored).
4. On deploy CI, set `PRIVACY_REQUIRED=true` to fail when configuration is incomplete.

Source template: [`scripts/privacy-policy.template.md`](../scripts/privacy-policy.template.md) (kept in sync with this doc).
