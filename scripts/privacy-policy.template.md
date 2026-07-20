---locale:pt---
#### Política de privacidade — {{INSTANCE_NAME}}

**Última actualização:** {{EFFECTIVE_DATE}}

#### 1. Quem somos

O responsável pelo tratamento dos dados pessoais nesta instância é **{{CONTROLLER_NAME}}**, operador de **{{HOSTING_URL}}** (a seguir «nós» ou «o operador»).

O software [Queima Asfalto](https://github.com/xmajox/queima-asfalto) é open source (AGPL-3.0). Os autores do código **não** são responsáveis pelo tratamento de dados na tua instância self-hosted.

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

#### 4. Finalidades e bases legais (RGPD)

| Finalidade | Base legal típica |
|------------|-------------------|
| Criar conta e sincronizar dados entre dispositivos | Execução de contrato / passos pré-contratuais (art. 6.º(1)(b)) |
| Partilhas entre utilizadores | Execução de contrato |
| Lembretes push (opt-in) | Consentimento (art. 6.º(1)(a)) — o utilizador activa em Definições |
| Analytics (se activado) | Consentimento ou interesse legítimo, conforme a tua configuração e jurisdição |
| Segurança e prevenção de abuso | Interesse legítimo (art. 6.º(1)(f)) |
| Importação de resultados oficiais | Execução de contrato (funcionalidade solicitada pelo utilizador) |

#### 5. Subcontratantes e serviços de terceiros

| Serviço | Fornecedor | Dados típicos | Notas |
|---------|------------|---------------|-------|
| Auth, base de dados, ficheiros, funções, push | Google Firebase / Google Cloud | Conforme secção 3 | Região configurada: **{{FIREBASE_REGION}}**. [Privacidade Google](https://policies.google.com/privacy) |
| Autocomplete / mapa | Geoapify ({{USES_GEOAPIFY}}) | Queries de localização | [Privacidade Geoapify](https://www.geoapify.com/privacy-policy) |
| Login | Google (OAuth) | Email, nome, foto de perfil Google | Política Google |
| Sites de timing | Vários (públicos) | Nome ou ID em páginas de resultados públicas | Scraping apenas de URLs **públicas**; sujeito aos ToS de cada site |

Lista completa de dependências open source: `npm run licenses` no repositório.

#### 6. Conservação

- **Conta e conteúdo:** enquanto a conta existir ou até pedido de apagamento.
- **Tokens FCM inválidos:** removidos automaticamente pela função `dispatchReminders` quando detectados.
- **Logs Firebase/Google Cloud:** conforme a retenção configurada no teu projeto GCP (recomendado: definir e documentar).

**Política desta instância:** {{RETENTION_POLICY}}

#### 7. Transferências internacionais

O Firebase e a Google podem processar dados fora do EEE (ex.: EUA), com cláusulas contratuais tipo ou mecanismos equivalentes oferecidos pela Google. Ver documentação do teu projeto Firebase / Google Cloud.

#### 8. Direitos dos titulares

Nos termos do RGPD, os utilizadores podem solicitar:

- Acesso, rectificação, apagamento
- Limitação ou oposição ao tratamento
- Portabilidade (dados fornecidos por eles, em formato estruturado)
- Retirar consentimento (ex.: notificações push) sem afectar tratamentos anteriores
- Reclamação junto da autoridade de controlo (em Portugal: [CNPD](https://www.cnpd.pt))

**Pedidos:** [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}). Prazo de resposta recomendado: 30 dias.

**Apagamento de conta:** o operador deve apagar `users/{uid}`, eventos, media em Storage e partilhas (Firebase Console ou script). O software não inclui ainda um botão «apagar conta» automático.

#### 9. Segurança

Medidas incluídas no software: regras Firestore/Storage por utilizador, autenticação obrigatória, redacção server-side em partilhas, rate limiting em lookups. Ver [restrições no Console](https://github.com/xmajox/queima-asfalto/blob/main/docs/console-restrictions.md) e [self-hosting](https://github.com/xmajox/queima-asfalto/blob/main/docs/self-hosting.md).

#### 10. Alterações

Publicaremos a data de actualização no topo desta página. Alterações relevantes podem ser comunicadas por email ou aviso na app.

#### 11. Contacto

**{{CONTROLLER_NAME}}**  
Email: [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}})  
Instância: {{HOSTING_URL}}

---locale:en---
#### Privacy policy — {{INSTANCE_NAME}}

**Last updated:** {{EFFECTIVE_DATE}}

#### 1. Who we are

The data controller for this instance is **{{CONTROLLER_NAME}}**, operator of **{{HOSTING_URL}}** (“we” or “the operator”).

The [Queima Asfalto](https://github.com/xmajox/queima-asfalto) software is open source (AGPL-3.0). The code authors are **not** data controllers for your self-hosted instance.

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

#### 5. Sub-processors and third parties

| Service | Provider | Typical data | Notes |
|---------|----------|--------------|-------|
| Auth, database, files, functions, push | Google Firebase / Google Cloud | Per section 3 | Configured region: **{{FIREBASE_REGION}}**. [Google Privacy](https://policies.google.com/privacy) |
| Autocomplete / map | Geoapify ({{USES_GEOAPIFY}}) | Location queries | [Geoapify Privacy](https://www.geoapify.com/privacy-policy) |
| Sign-in | Google (OAuth) | Email, name, Google profile photo | Google policy |
| Timing sites | Various (public) | Name or ID on public results pages | Scraping of **public** URLs only; subject to each site’s ToS |

Full open-source dependency list: `npm run licenses` in the repository.

#### 6. Retention

- **Account and content:** while the account exists or until erasure request.
- **Invalid FCM tokens:** removed automatically by `dispatchReminders` when detected.
- **Firebase/Google Cloud logs:** per retention configured in your GCP project (recommended: define and document).

**This instance’s policy:** {{RETENTION_POLICY}}

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

**Account deletion:** the operator must delete `users/{uid}`, events, Storage media, and shares (Firebase Console or script). The software does not yet include an automatic “delete account” button.

#### 9. Security

Software measures include per-user Firestore/Storage rules, mandatory authentication, server-side redaction on shares, lookup rate limiting. See [console restrictions](https://github.com/xmajox/queima-asfalto/blob/main/docs/console-restrictions.md) and [self-hosting](https://github.com/xmajox/queima-asfalto/blob/main/docs/self-hosting.md).

#### 10. Changes

We will post the update date at the top of this page. Material changes may be notified by email or in-app notice.

#### 11. Contact

**{{CONTROLLER_NAME}}**  
Email: [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}})  
Instance: {{HOSTING_URL}}
