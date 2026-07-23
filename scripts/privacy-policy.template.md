---locale:pt---
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

Medidas incluídas no software: regras Firestore/Storage por utilizador, autenticação obrigatória, redacção server-side em partilhas, rate limiting em lookups. Ver [restrições no Console](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/console-restrictions.md) e [self-hosting](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/self-hosting.md).

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

Software measures include per-user Firestore/Storage rules, mandatory authentication, server-side redaction on shares, lookup rate limiting. See [console restrictions](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/console-restrictions.md) and [self-hosting](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/self-hosting.md).

#### 10. Changes

We will post the update date at the top of this page. Material changes may be notified by email or in-app notice.

#### 11. Contact

**{{CONTROLLER_NAME}}**  
Email: [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}})  
Instance: {{HOSTING_URL}}

---locale:es---
#### Política de privacidad — {{INSTANCE_NAME}}

**Última actualización:** {{EFFECTIVE_DATE}}

#### 1. Quiénes somos

El responsable del tratamiento de datos personales en esta instancia es **{{CONTROLLER_NAME}}**, operador de **{{HOSTING_URL}}** («nosotros» o «el operador»).

El software [Queima Asfalto](https://github.com/Seven-Panda-Labs/queima-asfalto) es de código abierto (AGPL-3.0). Los autores del código **no** son responsables del tratamiento de datos en tu instancia self-hosted.

#### 2. Ámbito

Esta política se aplica a los usuarios que crean una cuenta y usan la PWA en **{{HOSTING_URL}}**.

#### 3. Datos que podemos tratar

Según las funcionalidades activadas, la instancia puede tratar:

| Categoría | Ejemplos | Dónde |
|-----------|----------|-------|
| **Cuenta** | Nombre, email, identificador de Google (Firebase Auth UID) | Firebase Authentication, Firestore `users/{uid}` |
| **Perfil de resultados** | Nombre para clasificaciones, alias, Parkrunner ID, Parkruns favoritos | Firestore `users/{uid}` |
| **Contenido de la app** | Eventos, metas, resultados, notas, ubicaciones, coordenadas GPS | Firestore (`events`, `goals`, `performanceGoals`, `bucketListItems`, …) |
| **Multimedia** | Fotos y vídeos de eventos | Firebase Storage |
| **Compartidos** | Email del invitado, permisos, datos compartidos redactados | Firestore `shares`, Cloud Functions |
| **Notificaciones** (si están activadas) | Tokens FCM, preferencias de recordatorio, idioma, desplazamiento de zona horaria | Firestore `users/{uid}` |
| **Preferencias locales** | Tema, idioma, modos de vista | `localStorage` del navegador (prefijo por usuario) |
| **Analytics** (si está activado) | Vistas de página, metadatos del navegador | Google Analytics vía Firebase (`measurementId`) |
| **Geocodificación** (si está activada) | Texto de búsqueda de ubicación, coordenadas | Peticiones del navegador a la API Geoapify |
| **Importación de resultados** | Nombre/Parkrunner ID, URL pública del evento | Cloud Function `lookupOfficialResults` → peticiones HTTP a **sitios de cronometraje de terceros** |

No recopilamos intencionadamente datos de menores de 16 años. Si crees que un menor ha facilitado datos, contáctanos.

#### 4. Finalidades y bases legales (RGPD)

| Finalidad | Base legal típica |
|-----------|-------------------|
| Crear cuenta y sincronizar datos entre dispositivos | Ejecución de contrato / pasos precontractuales (art. 6.1(b)) |
| Compartidos entre usuarios | Ejecución de contrato |
| Recordatorios push (opt-in) | Consentimiento (art. 6.1(a)) — el usuario activa en Ajustes |
| Analytics (si está activado) | Consentimiento o interés legítimo, según tu configuración y jurisdicción |
| Seguridad y prevención de abusos | Interés legítimo (art. 6.1(f)) |
| Importación de resultados oficiales | Ejecución de contrato (funcionalidad solicitada por el usuario) |

#### 5. Encargados del tratamiento y terceros

| Servicio | Proveedor | Datos típicos | Notas |
|----------|-----------|---------------|-------|
| Auth, base de datos, archivos, funciones, push | Google Firebase / Google Cloud | Según la sección 3 | Región configurada: **{{FIREBASE_REGION}}**. [Privacidad de Google](https://policies.google.com/privacy) |
| Autocompletado / mapa | Geoapify ({{USES_GEOAPIFY}}) | Consultas de ubicación | [Privacidad de Geoapify](https://www.geoapify.com/privacy-policy) |
| Inicio de sesión | Google (OAuth) | Email, nombre, foto de perfil de Google | Política de Google |
| Sitios de cronometraje | Varios (públicos) | Nombre o ID en páginas de resultados públicas | Scraping solo de URLs **públicas**; sujeto a los ToS de cada sitio |

Lista completa de dependencias de código abierto: `npm run licenses` en el repositorio.

#### 6. Conservación

- **Cuenta y contenido:** mientras exista la cuenta o hasta solicitud de supresión.
- **Tokens FCM no válidos:** eliminados automáticamente por la función `dispatchReminders` cuando se detectan.
- **Logs de Firebase/Google Cloud:** según la retención configurada en tu proyecto GCP (recomendado: definir y documentar).

**Política de esta instancia:** {{RETENTION_POLICY}}

#### 7. Transferencias internacionales

Firebase y Google pueden procesar datos fuera del EEE (p. ej., EE. UU.), con cláusulas contractuales tipo o mecanismos equivalentes ofrecidos por Google. Consulta la documentación de tu proyecto Firebase / Google Cloud.

#### 8. Tus derechos

En virtud del RGPD, los usuarios pueden solicitar:

- Acceso, rectificación, supresión
- Limitación u oposición al tratamiento
- Portabilidad (datos que hayan facilitado, en formato estructurado)
- Retirar el consentimiento (p. ej., notificaciones push) sin afectar tratamientos anteriores
- Presentar una reclamación ante una autoridad de control (Portugal: [CNPD](https://www.cnpd.pt))

**Solicitudes:** [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}). Plazo de respuesta recomendado: 30 días.

**Supresión de cuenta:** el operador debe eliminar `users/{uid}`, eventos, multimedia en Storage y compartidos (Firebase Console o script). El software aún no incluye un botón automático de «eliminar cuenta».

#### 9. Seguridad

Medidas incluidas en el software: reglas Firestore/Storage por usuario, autenticación obligatoria, redacción en el servidor en compartidos, limitación de frecuencia en búsquedas. Consulta [restricciones en la consola](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/console-restrictions.md) y [self-hosting](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/self-hosting.md).

#### 10. Cambios

Publicaremos la fecha de actualización en la parte superior de esta página. Los cambios relevantes pueden comunicarse por email o aviso en la app.

#### 11. Contacto

**{{CONTROLLER_NAME}}**  
Email: [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}})  
Instancia: {{HOSTING_URL}}

---locale:de---
#### Datenschutzerklärung — {{INSTANCE_NAME}}

**Zuletzt aktualisiert:** {{EFFECTIVE_DATE}}

#### 1. Wer wir sind

Verantwortlicher für die Verarbeitung personenbezogener Daten in dieser Instanz ist **{{CONTROLLER_NAME}}**, Betreiber von **{{HOSTING_URL}}** („wir“ oder „der Betreiber“).

Die [Queima Asfalto](https://github.com/Seven-Panda-Labs/queima-asfalto)-Software ist Open Source (AGPL-3.0). Die Codeautoren sind **nicht** Verantwortliche für die Datenverarbeitung in deiner selbst gehosteten Instanz.

#### 2. Geltungsbereich

Diese Richtlinie gilt für Nutzer, die sich registrieren und die PWA unter **{{HOSTING_URL}}** verwenden.

#### 3. Daten, die wir verarbeiten können

Je nach aktivierten Funktionen kann die Instanz Folgendes verarbeiten:

| Kategorie | Beispiele | Wo |
|-----------|-----------|-----|
| **Konto** | Name, E-Mail, Google-Kennung (Firebase Auth UID) | Firebase Authentication, Firestore `users/{uid}` |
| **Ergebnisprofil** | Name für Ranglisten, Aliase, Parkrunner ID, Lieblings-Parkruns | Firestore `users/{uid}` |
| **App-Inhalte** | Events, Ziele, Ergebnisse, Notizen, Orte, GPS-Koordinaten | Firestore (`events`, `goals`, `performanceGoals`, `bucketListItems`, …) |
| **Medien** | Event-Fotos und -Videos | Firebase Storage |
| **Freigaben** | E-Mail des Eingeladenen, Berechtigungen, redigierte geteilte Daten | Firestore `shares`, Cloud Functions |
| **Benachrichtigungen** (falls aktiviert) | FCM-Tokens, Erinnerungseinstellungen, Sprache, Zeitzonenversatz | Firestore `users/{uid}` |
| **Lokale Einstellungen** | Theme, Sprache, Ansichtsmodi | Browser-`localStorage` (präfix pro Nutzer) |
| **Analytics** (falls aktiviert) | Seitenaufrufe, Browser-Metadaten | Google Analytics über Firebase (`measurementId`) |
| **Geokodierung** (falls aktiviert) | Ortssuchtext, Koordinaten | Browser-Anfragen an die Geoapify-API |
| **Ergebnisimport** | Name/Parkrunner ID, öffentliche Event-URL | Cloud Function `lookupOfficialResults` → HTTP-Anfragen an **Timing-Websites Dritter** |

Wir erfassen wissentlich keine Daten von Kindern unter 16 Jahren. Kontaktiere uns, wenn du glaubst, dass ein Kind Daten bereitgestellt hat.

#### 4. Zwecke und Rechtsgrundlagen (DSGVO)

| Zweck | Typische Rechtsgrundlage |
|-------|--------------------------|
| Konto und Synchronisation zwischen Geräten | Vertrag / vorvertragliche Schritte (Art. 6 Abs. 1 lit. b) |
| Freigaben zwischen Nutzern | Vertrag |
| Push-Erinnerungen (Opt-in) | Einwilligung (Art. 6 Abs. 1 lit. a) — Nutzer aktiviert in Einstellungen |
| Analytics (falls aktiviert) | Einwilligung oder berechtigtes Interesse, je nach Setup und Rechtsordnung |
| Sicherheit und Missbrauchsprävention | Berechtigtes Interesse (Art. 6 Abs. 1 lit. f) |
| Import offizieller Ergebnisse | Vertrag (vom Nutzer angeforderte Funktion) |

#### 5. Auftragsverarbeiter und Dritte

| Dienst | Anbieter | Typische Daten | Hinweise |
|--------|----------|----------------|----------|
| Auth, Datenbank, Dateien, Funktionen, Push | Google Firebase / Google Cloud | Gemäß Abschnitt 3 | Konfigurierte Region: **{{FIREBASE_REGION}}**. [Google-Datenschutz](https://policies.google.com/privacy) |
| Autovervollständigung / Karte | Geoapify ({{USES_GEOAPIFY}}) | Standortabfragen | [Geoapify-Datenschutz](https://www.geoapify.com/privacy-policy) |
| Anmeldung | Google (OAuth) | E-Mail, Name, Google-Profilfoto | Google-Richtlinie |
| Timing-Websites | Verschiedene (öffentlich) | Name oder ID auf öffentlichen Ergebnisseiten | Scraping nur **öffentlicher** URLs; unterliegt den ToS jeder Website |

Vollständige Open-Source-Abhängigkeitsliste: `npm run licenses` im Repository.

#### 6. Aufbewahrung

- **Konto und Inhalte:** solange das Konto besteht oder bis zur Löschanfrage.
- **Ungültige FCM-Tokens:** automatisch entfernt durch `dispatchReminders`, wenn erkannt.
- **Firebase/Google-Cloud-Logs:** gemäß Aufbewahrung in deinem GCP-Projekt (empfohlen: festlegen und dokumentieren).

**Richtlinie dieser Instanz:** {{RETENTION_POLICY}}

#### 7. Internationale Übermittlungen

Firebase und Google können Daten außerhalb des EWR verarbeiten (z. B. USA), mit Standardvertragsklauseln oder gleichwertigen Mechanismen. Siehe die Dokumentation deines Firebase- / Google-Cloud-Projekts.

#### 8. Deine Rechte

Nach DSGVO können Nutzer Folgendes beantragen:

- Auskunft, Berichtigung, Löschung
- Einschränkung oder Widerspruch gegen die Verarbeitung
- Datenübertragbarkeit (von ihnen bereitgestellte Daten in strukturiertem Format)
- Widerruf der Einwilligung (z. B. Push-Benachrichtigungen) ohne Beeinträchtigung früherer Verarbeitung
- Beschwerde bei einer Aufsichtsbehörde (Portugal: [CNPD](https://www.cnpd.pt))

**Anfragen:** [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}). Empfohlene Antwortfrist: 30 Tage.

**Kontolöschung:** der Betreiber muss `users/{uid}`, Events, Storage-Medien und Freigaben löschen (Firebase Console oder Skript). Die Software enthält noch keinen automatischen „Konto löschen“-Button.

#### 9. Sicherheit

Software-Maßnahmen umfassen Firestore/Storage-Regeln pro Nutzer, obligatorische Authentifizierung, serverseitige Redaktion bei Freigaben, Ratenbegrenzung bei Lookups. Siehe [Console-Einschränkungen](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/console-restrictions.md) und [Self-Hosting](https://github.com/Seven-Panda-Labs/queima-asfalto/blob/main/docs/self-hosting.md).

#### 10. Änderungen

Wir veröffentlichen das Aktualisierungsdatum oben auf dieser Seite. Wesentliche Änderungen können per E-Mail oder In-App-Hinweis mitgeteilt werden.

#### 11. Kontakt

**{{CONTROLLER_NAME}}**  
E-Mail: [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}})  
Instanz: {{HOSTING_URL}}
