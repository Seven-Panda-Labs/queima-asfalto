# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.32.0] - 2026-09-02

### Hinzugefügt

- **Anmeldeplanung:** die Bucket List ist jetzt danach gruppiert, was noch zu tun ist, und jedes Rennen kann seine Anmeldung tragen: wann sie öffnet, wann sie schließt, die Ziehung, und die Frist, einen gewonnenen Platz zu sichern. Mit einer Benachrichtigung vor jeder Frist, einzuschalten in den Einstellungen.
- **Eine Saison um die Ankerrennen:** markiere die ein bis drei Rennen, die dein Jahr festlegen, auf der Seite des Rennens selbst. Daraus schlägt die App das Fenster für ein Vorbereitungsrennen vor, warnt, wenn etwas in das Tapering fällt oder ein Monat zu voll wird, und zeigt die prognostizierte Zeit für den Anker aus deinem letzten Rennen.
- **Wenn es schiefgeht:** ein Rennen, das ohne Ergebnis vorbeigeht, fragt, was passiert ist, statt zu sagen, du hättest es verpasst, ein DNF zählt als gestartetes Rennen, und ein Knopf legt den Versuch der nächsten Saison an.
- **Rennen finden:** eine neue Seite durchsucht den Katalog der Instanz nach Monat, Distanz und Ort und legt ein Rennen mit einem Klick auf die Liste. Ein Anker stellt die passenden nach vorne. Auch die parkruns in deiner Nähe sind dabei, die in keinem Rennkalender stehen.
- **Erste Schritte:** das Dashboard eines neuen Kontos beginnt mit vier Schritten, jeder sagt, was die App damit macht. Es verschwindet, wenn sie erledigt sind.

### Geändert

- **Konten, die auf Freigabe warten:** die Anmeldung wird jetzt mit dem Grund abgelehnt, statt das Konto in eine App zu lassen, in der nichts geschrieben werden konnte.
- **Self-hosting:** die Rennernte kann zwei neue Quellen lesen und bleibt aus, bis du sie einschaltest. Siehe [`docs/discovery-sources.md`](docs/discovery-sources.md).

---

## [1.31.0] - 2026-09-01

### Hinzugefügt

- **Mehr Distanzen:** 1500 m, 3000 m, 15K, 10 Meilen, 30K, 50K, 50 Meilen, 100K und 100 Meilen kommen zu den vier ursprünglichen dazu. Die neuen sind zunächst aus: schalte unter Einstellungen, Disziplinen die ein, die du läufst.
- **Rennkatalog:** die Instanz kennt Rennen jetzt mit Namen, samt Zugang zum Start und den Fristen und Ziehungen jeder Ausgabe. Daraus kommen später die Hinweise, bevor die Anmeldung schließt.
- **Verwaltungsbereich:** Konten freigeben, sperren und löschen und den Katalog pflegen, in der App statt in der Konsole.

### Geändert

- **Disziplinen wählen wurde kompakt:** die 13 Distanzen sind jetzt Chips, gruppiert in Bahn, Straße und Ultra.
- **Self-Hosting:** der Administrator ist nicht mehr die Variable `ADMIN_EMAIL`, sondern ein Benutzer mit `admin: true`, einmal in der Konsole gesetzt. Siehe [`docs/self-hosting.md`](docs/self-hosting.md).

---

## [1.30.0] - 2026-09-01

### Entfernt

- **Excel-Import und -Export sind entfernt:** Das vollständige `.zip`-Backup deckt dasselbe genauer ab, inklusive Fotos, Videos, Aktivitätsdateien und Ziele, und stellt alles mit denselben Kennungen wieder her. Eine Tabelle ist kein Weg mehr hinein: Rennen werden in der App angelegt oder aus einem Backup wiederhergestellt.

---

## [1.29.1] - 2026-08-31

### Geändert

- **Lesbarere Renneinteilung:** Bis zu 10 s/km Verlust in der zweiten Hälfte gilt jetzt als gehaltenes Tempo, und Rot bleibt Einbrüchen über 25 s/km vorbehalten. Das Diagramm erscheint ab einem Rennen statt erst ab fünf.
- **Zählungen im Singular:** "1 Mal hier" statt einer Pluralform, überall wo gezählt wird, wie oft du eine Strecke gelaufen bist.

---

## [1.29.0] - 2026-08-31

### Hinzugefügt

- **Eine Zeit zum Schlagen bei kommenden Rennen:** Öffnest du ein anstehendes Rennen auf einer Strecke, die du schon gelaufen bist, siehst du dein bestes Tempo dort und was es auf dieser Distanz ergibt.
- **Die Zielzeit auch auf der Startseite:** Die Karte des nächsten Rennens zeigt Zeit und Pace zum Schlagen, wenn du die Strecke schon gelaufen bist.

### Geändert

- **Datei erst nach dem Rennen hochladen:** Der GPX und TCX Upload erscheint nicht mehr bei künftigen Rennen, damit kein Trainingslauf auf der Strecke als das Rennen abgelegt wird.

---

## [1.28.0] - 2026-08-30

### Hinzugefügt

- **Renneinteilung:** Die Analyseseite zeigt Rennen für Rennen, wie viel langsamer die zweite Hälfte war, und wie oft das passiert.
- **Streckenvergleich:** Öffnest du ein Rennen, das du schon gelaufen bist, siehst du, wo es unter allen deinen Läufen dort steht, mit der besten und der vorherigen.

---

## [1.27.0] - 2026-08-30

### Hinzugefügt

- **Aktivitätsdateien bei Events:** Lade die GPX oder TCX deiner Uhr hoch, und ein Rennen bekommt Splits pro Kilometer, die Strecke auf der Karte, ein Pace und Höhendiagramm und, sofern die Datei sie enthält, Herzfrequenzwerte. Die gemessene Zeit wird zum Ausfüllen des Ergebnisses angeboten und ersetzt Vorhandenes nie ohne deine Bestätigung: es zählt die offizielle Zeitmessung. Die Dateien wandern in Backups mit.

---

## [1.26.1] - 2026-08-30

### Geändert

- **Dokumente folgen der App-Sprache:** Changelog, Ergebnishinweis und Datenschutzerklärung haben keine eigene Sprachauswahl mehr, und Arabisch wird von rechts nach links gelesen.

---

## [1.26.0] - 2026-08-30

### Hinzugefügt

- **Wähle die Disziplinen, die du sehen willst:** unter Einstellungen > App kannst du Distanzen abschalten, die du nicht läufst. Sie verschwinden aus Filtern und Auswahllisten. Nichts geht verloren: Rennen, Ziele und Rekorde in einer abgeschalteten Disziplin bleiben sichtbar.

---

## [1.25.0] - 2026-08-30

### Geändert

- **Aus der Ergebnisseite wird die Analyseseite:** Sie wiederholt die Eventliste nicht mehr. Sie beantwortet drei Fragen, oben auswählbar: wie diese Saison läuft, wie sie gegen die früheren steht und was sich seit jeher verändert hat. Die Route heißt jetzt `/analise`, alte Links funktionieren weiter.
- **Formkurve:** Jedes Rennen wird auf seinen Wert bei deiner meistgelaufenen Distanz umgerechnet, sodass 5K und Marathon auf einer Linie vergleichbar werden. Dazu kommen Zeitprognosen für die anderen Distanzen, aus deiner besten Leistung der letzten 12 Monate.
- **Neue Auswertungen:** Platzierung im Feld über die Zeit, Entwicklung jedes Rekords, kumulierte Kilometer gegen frühere Saisons, starke und schwache Monate im Jahr und ein Beständigkeitsraster nach Rennen oder Kilometern.
- **Durchschnittstempo des Jahres korrigiert:** Es ist jetzt nach Distanz gewichtet. Bisher zählte ein 5K so viel wie ein Marathon.

---

## [1.24.0] - 2026-08-29

### Geändert

- **Das Ergebnis eines Rennens wird auf der Event-Seite bearbeitet:** Die separate Seite entfällt. Zeit, Platzierung und der Link zu den offiziellen Ergebnissen stehen jetzt zusammen, neben den Zahlen.

---

## [1.23.0] - 2026-08-29

### Geändert

- **Der parkrun-Katalog aktualisiert sich selbst:** neue parkrun-Veranstaltungen erscheinen wenige Tage nach ihrer Eröffnung, ohne auf ein App-Update zu warten. Die Liste wird zudem nicht mehr heruntergeladen, wenn sie bereits aktuell ist, was den Start leichter macht.

---

## [1.22.0] - 2026-08-28

### Geändert

- **Der Rest der App zieht mit dem Start nach:** Ziele gruppieren sich nach Status, die erreichten zuerst, Filter und Ansichtsumschalter sehen auf jeder Seite gleich aus, und die Seite einer Veranstaltung beginnt mit dem Namen des Rennens und seinem Ergebnis.

---

## [1.21.0] - 2026-08-28

### Geändert

- **Start neu gestaltet:** das nächste Event mit Countdown im Vordergrund, die Zahlen des Jahres in einer einzigen Leiste, jetzt mit gelaufenen Kilometern, und ein eigener Platz für Erfolge, offene Ziele und persönliche Bestzeiten.

---

## [1.20.0] - 2026-08-25

### Hinzugefügt

- **Neue Sprache: Arabisch (erste Version):** App, Versionshinweise, Hinweis zu offiziellen Ergebnissen, Datenschutzerklärung, Konto-E-Mails und Push-Erinnerungen sind jetzt auf Arabisch verfügbar, mit Rechts-nach-links-Layout (RTL). Auswahl unter Einstellungen → Sprache.

---

## [1.19.0] - 2026-08-25

### Hinzugefügt

- **Neue Sprache: Französisch:** App, Versionshinweise, Hinweis zu offiziellen Ergebnissen, Datenschutzerklärung, Konto-E-Mails und Push-Erinnerungen sind jetzt auf Französisch verfügbar. Auswahl unter Einstellungen → Sprache.

---

## [1.18.0] - 2026-08-17

### Geändert

- **Offizielle Ergebnisse:** automatische Parkrun-Ergebnissuche vorübergehend deaktiviert: Parkrun blockiert automatisierte Anfragen aus bekannter Cloud-Infrastruktur. Das Ergebnis kann weiterhin manuell erfasst werden.

---

## [1.17.0] - 2026-08-13

### Hinzugefügt

- **Neue Emoji-Auswahl:** Suche und Zugriff auf alle Unicode-Emojis statt der bisherigen kuratierten Liste.

---

## [1.16.1] - 2026-08-13

### Hinzugefügt

- **Mehr Emojis:** über 50 neue Optionen zur Emoji-Auswahl für Veranstaltungen und Ziele hinzugefügt: Tiere, Blumen, Essen, Halloween-Motive und Flaggen aus Asien, Südamerika und Nordafrika.

### Behoben

- **Veranstaltungsstatus:** Eine Veranstaltung mit offiziellem Ergebnis kann nicht mehr als „Verpasst“ markiert werden. Es gab eine Race Condition zwischen dem automatischen Übergang zu „Verpasst“ und dem Speichern des Ergebnisses. Gewann der automatische Übergang das Rennen, war der Status falsch, obwohl das Ergebnis gespeichert war.

---

## [1.16.0] - 2026-08-03

### Hinzugefügt

- **Backup mit Fotos und Videos:** Die Backup-`.zip` enthält jetzt die Foto- und Videodateien, nicht mehr nur deren Metadaten. Du kannst die Option vor dem Export abwählen; über 300 MB enthält das Backup nur die Daten.
- **Fotos und Videos wiederherstellen:** Liegen die Dateien in der `.zip`, kommen Fotos und Videos auch im Modus „Alles ersetzen“ und beim Wiederherstellen in einem anderen Konto zurück, vorher nur, wenn sie noch im Konto lagen.

---

## [1.15.1] - 2026-08-03

### Behoben

- **Sicherheit:** Die Firestore-Regeln behandeln die Felder zur Kontofreigabe jetzt als clientseitig unveränderlich. Ein wartendes oder abgelehntes Konto konnte zuvor mit einem einzigen Schreibvorgang sein eigenes `accountStatus` entfernen und volle Zugriffsrechte erhalten.
- **Einstellungen:** Auf Instanzen mit aktivierter Kontofreigabe lassen sich Sprache, Benachrichtigungseinstellungen und Ergebnisprofil wieder speichern. Bisher wurde jeder Schreibvorgang abgelehnt, sobald das Konto freigegeben war.

---

## [1.15.0] - 2026-08-03

### Hinzugefügt

- **Vollständiges Backup:** exportiere alle deine Daten als JSON in einer `.zip`-Datei (Events, Ziele, Leistungsziele, Bucket List, Metadaten zu Fotos und Videos, Einstellungen und Freigaben).
- **Backup wiederherstellen:** lade eine Backup-`.zip` hoch, um deine Daten zurückzuholen, mit den ursprünglichen Dokument-IDs. Du kannst sie mit deinen aktuellen Daten zusammenführen oder alles ersetzen.

---

## [1.14.2] - 2026-08-02

### Behoben

- **Offizielle Ergebnisse:** MikaTiming nutzt die richtige Gesamtplatz-Spalte (layoutabhängig pro Event).
- **Offizielle Ergebnisse:** MikaTiming-Teilnehmerzahl ohne Geschlechtsfilter (Listenkopf).

---

## [1.14.1] - 2026-08-01

### Behoben

- **Offizielle Ergebnisse:** MikaTiming-Connector (Multi-Event-Suche und Netto-Zeiten); mehr Speicher für die Lookup-Callable.

---

## [1.14.0] - 2026-07-30

### Hinzugefügt

- **Self-Hosting:** optionale manuelle Freigabe neuer Konten: Bildschirme „ausstehend“/„abgelehnt“, Admin-E-Mail mit Freigabe-/Ablehnungslinks (Resend), Benutzerbenachrichtigung, Firestore-/Storage-Regeln und Blocking-Auth-Funktionen; siehe `docs/configuration.md` und `docs/self-hosting.md`.

---

## [1.13.0] - 2026-07-23

### Hinzugefügt

- **Erinnerungen:** Lightbox für Fotos und Videos im Vollbild, mit Pfeil-, Tastatur- und Wischgesten-Navigation auf dem Handy.

---

## [1.12.1] - 2026-07-23

### Geändert

- Mehrere Performance- und Sicherheitsupdates.

---

## [1.12.0] - 2026-07-23

### Hinzugefügt

- **Sprachen:** Spanisch (es-ES) und Deutsch in der App: UI, Emoji-Labels, Push-Erinnerungen, Changelog, Datenschutzerklärung und Hinweis zu offiziellen Ergebnissen.
- **Einstellungen:** Sprachauswahl mit Português, English, Español und Deutsch.

### Geändert

- Fehlende Übersetzungsschlüssel fallen auf Englisch zurück; automatische Browser-Spracherkennung für `pt`, `en`, `es` und `de`.

---

## [1.11.0] - 2026-07-20

### Hinzugefügt

- **Datenschutz:** Link zur Datenschutzerklärung in der App-Fußzeile.

### Behoben

- **Datenschutz:** Seite nutzt dasselbe Layout, Theme und dieselbe Navigation wie der Rest der App.

### Geändert

- Mindestabstand zwischen offiziellen Ergebnisabfragen auf **10 Sekunden** erhöht, mit Countdown auf dem Button.

---

## [1.10.0] - 2026-07-19

### Hinzugefügt

- **Parkrun:** eigene Event-Erstellung mit globaler Katalogsuche, Favoriten und Land in der Autovervollständigung.
- **Parkrun:** Favoriten im Ergebnisprofil; gewählte Events werden automatisch zu Favoriten hinzugefügt.

### Behoben

- **Parkrun:** Änderung der Autovervollständigungsauswahl aktualisiert Standort und Karte wieder.

### Geändert

- **Parkrun:** zuverlässigerer Ergebnisimport mit dem korrekten Event im Datensatz.

---

## [1.9.2] - 2026-07-19

### Hinzugefügt

- **Google Analytics** in die App integriert.

### Behoben

- **Parkrun:** offizieller Ergebnisimport schlug in einigen Umgebungen fehl.

### Geändert

- Mindestabstand zwischen offiziellen Ergebnisabfragen auf **5 Sekunden** reduziert, mit Countdown auf dem Button.

---

## [1.9.1] - 2026-07-19

### Behoben

- **MyRaceResult:** Abfrage bei Events mit mehreren Kategorien (z. B. Mittsommerlauf).

### Geändert

- **MyRaceResult:** Unterstützung für in Event-Seiten eingebettete Ergebnisse und Gesamtwertung nach Zeit.

---

## [1.9.0] - 2026-07-09

### Hinzugefügt

- **mika:timing**-Connector (Chicago Marathon, London Marathon usw.).

### Geändert

- Liste unterstützter Plattformen in den Einstellungen alphabetisch sortiert.

---

## [1.8.0] - 2026-07-09

### Hinzugefügt

- **Tímataka**-Connector (timataka.net / timataka.is).

---

## [1.7.0] - 2026-07-09

### Hinzugefügt

- **Push-Benachrichtigungen** mit Erinnerungen, auch wenn die App geschlossen ist.

### Geändert

- Benachrichtigungseinstellungen aktualisiert; App-Sprache für Remote-Nachrichten verwendet.

---

## [1.6.0] - 2026-07-08

### Hinzugefügt

- **Wiclax**-Connector (Live-Laufergebnisse).

---

## [1.5.1] - 2026-07-08

### Hinzugefügt

- Seite **Neuigkeiten** (`/novidades`) mit Versionshistorie; Link aus der Versionsangabe in der Fußzeile.
- **Seven Panda Labs**-Hinweis in der Fußzeile.

---

## [1.5.0] - 2026-07-08

### Hinzugefügt

- **VCRunning**-Connector (Valencia Ciudad del Running).
- Versioniertes Changelog auf Portugiesisch und Englisch.

---

## [1.4.0] - 2026-07-08

### Hinzugefügt

- UX-Verbesserungen für **Parkrun**-Events: Parkrunner-ID-Einrichtung und vereinfachtes Formular.

---

## [1.3.2] - 2026-07-07

### Hinzugefügt

- Mehr Lade-Nachrichten in der Markenstimme.

---

## [1.3.1] - 2026-07-07

### Hinzugefügt

- Markenstimme in leeren Zuständen, beim Laden und in Erfolgsmeldungen.
- Stimmen-Dokumentation unter [docs/voice.md](docs/voice.md).

### Behoben

- Entscheidung bei persönlichen Rekorden nach Zeit, wenn Pace und Distanz übereinstimmen.

---

## [1.3.0] - 2026-07-06

### Geändert

- Einstellungen neu organisiert; Teilen in die Einstellungen verschoben.

---

## [1.2.0] - 2026-07-06

### Hinzugefügt

- Geteilte Ergebnisse auf der Ergebnisseite, mit Trennern pro Freund.

### Behoben

- Daten in geteilten Daten von Freunden.

---

## [1.1.0] - 2026-07-06

### Hinzugefügt

- Geteilte Ansichten in den Bereichen Events und Ziele.

---

## [1.0.2] - 2026-07-06

### Behoben

- E-Mail des Besitzers bei empfangenen Teilen-Einladungen sichtbar.

---

## [1.0.1] - 2026-07-06

### Hinzugefügt

- Bearbeitung von Teilen-Berechtigungen und Hinweis auf ausstehende Einladung.

---

## [1.0.0] - 2026-07-06

Meilenstein: Datenaustausch zwischen Freunden.

### Hinzugefügt

- Teilen von Events, Zielen und Ergebnissen mit E-Mail-Einladungen.
- Konfigurierbare Berechtigungen pro Bereich (Events, Ziele, Ergebnisse, Leistungsziele).

---

## [0.22.0] - 2026-07-06

### Hinzugefügt

- Grundlage für Teilen mit Freunden.

---

## [0.21.0] - 2026-07-06

### Hinzugefügt

- Dunkelmodus mit Systemeinstellung.

---

## [0.20.0] - 2026-07-05

### Hinzugefügt

- **Ultimate Sport Service**-Connector.

---

## [0.19.1] - 2026-07-05

### Behoben

- **RunCzech:** Chip-Zeit statt Startzeit.

---

## [0.19.0] - 2026-07-05

### Hinzugefügt

- **RunCzech**-Connector.

---

## [0.18.1] - 2026-07-05

### Behoben

- **NSF Berlin:** Tabellen mit variablen Spalten.

---

## [0.18.0] - 2026-07-05

### Hinzugefügt

- **NSF Berlin**-Connector.

---

## [0.17.2] - 2026-07-05

### Behoben

- **ZielZeit:** Nettozeit statt Bruttozeit.

---

## [0.17.1] - 2026-07-05

### Behoben

- **EQ Timing:** Gesamtposition basierend auf Etappenfinishern.

---

## [0.17.0] - 2026-07-05

### Hinzugefügt

- **EQ Timing**-Connector.

---

## [0.16.0] - 2026-07-05

### Hinzugefügt

- **ZielZeit**-Connector.

---

## [0.15.0] - 2026-07-05

### Hinzugefügt

- **Strassenlauf.org**-Connector.

---

## [0.14.1] - 2026-07-05

### Behoben

- **MyRacePartner:** robustere Abfrage.

---

## [0.14.0] - 2026-07-05

### Hinzugefügt

- **MyRacePartner**-Connector.

---

## [0.13.1] - 2026-07-05

### Behoben

- **MaxFunSports:** Finisher-Anzahl in eingebetteten URLs.

---

## [0.13.0] - 2026-07-05

### Hinzugefügt

- **MaxFunSports**-Connector.

---

## [0.12.2] - 2026-07-05

### Behoben

- **SCC Events:** SCC-Läufer-Wettbewerb in der Abfrage enthalten.

---

## [0.12.1] - 2026-07-05

### Behoben

- **SCC Events:** breitere URL-Erkennung.

---

## [0.12.0] - 2026-07-05

### Hinzugefügt

- **SCC Events**-Connector.

---

## [0.11.1] - 2026-07-05

### Behoben

- **MyRaceResult:** Abfrage in Kategorien, die von der Hauptliste ausgeschlossen sind.

---

## [0.11.0] - 2026-07-05

### Hinzugefügt

- **MyRaceResult**-Connector.

### Behoben

- **Parkrun**, **Davengo** und **Sporthive:** verschiedene Verbesserungen beim Ergebnisimport.

---

## [0.9.0] - 2026-07-04

Meilenstein: automatische offizielle Ergebnisse.

### Hinzugefügt

- Offizieller Ergebnisimport für **Sporthive**, **Davengo** und **Parkrun**.
- Symbol für verifizierte Ergebnisse in Listen.
- Finisher-Anzahl für Parkrun und Davengo.

### Behoben

- Parsing der Parkrun-Ergebnistabelle.

---

## [0.8.0] - 2026-07-04

### Behoben

- Karte überlagert Dialoge nicht mehr.

### Geändert

- Reihenfolge der Hauptnavigation.

---

## [0.7.0] - 2026-07-04

### Hinzugefügt

- Karte auf der Wunschliste und auf der Ergebnisseite.
- Mehr Emojis verfügbar.

---

## [0.6.2] - 2026-07-02

### Hinzugefügt

- Status-Legende in der Kartenansicht.

---

## [0.6.1] - 2026-07-02

### Behoben

- Sicherheitswarnungen bei Abhängigkeiten.

---

## [0.6.0] - 2026-06-30

### Hinzugefügt

- Standort-Autovervollständigung und Karte auf der Wunschliste.

---

## [0.5.4] - 2026-06-30

### Hinzugefügt

- Kartenvorschau im Event-Formular.

---

## [0.5.3] - 2026-06-30

### Behoben

- Marker-Clustering auf der Karte.

---

## [0.5.2] - 2026-06-30

### Behoben

- Redundante Standortsuche nach Auswahl eines Vorschlags.

---

## [0.5.1] - 2026-06-30

### Hinzugefügt

- Standort-Autovervollständigung und Geocoding.
- Karte in der Event-Detailansicht.

---

## [0.5.0] - 2026-06-29

Meilenstein: Kartenmodus.

### Hinzugefügt

- Koordinaten bei Events und **Liste | Karte**-Ansicht auf der Events-Seite.
- Panel für Events ohne festgelegten Standort.

---

## [0.4.3] - 2026-06-29

### Behoben

- Event-Fotos und -Videos in der Produktion.

---

## [0.4.2] - 2026-06-29

### Behoben

- Zugriffsberechtigungen für Fotos und Videos.

---

## [0.4.1] - 2026-06-29

### Behoben

- Laden von Erinnerungen (Foto/Video).

---

## [0.4.0] - 2026-06-29

Meilenstein: Event-Fotos und -Videos.

### Hinzugefügt

- Foto- und Video-Upload in der Event-Detailansicht (bis zu 10 Dateien; Video max. 2 Min.).
- Erinnerungs-Galerie pro Event.

### Behoben

- Galerie aktualisiert sich sofort nach dem Upload.

---

## [0.2.0] - 2026-06-28

Meilenstein: Internationalisierung.

### Hinzugefügt

- Unterstützung für **pt-PT** und **en-GB**.
- Mehrere Disziplinen pro Wunschlisten-Eintrag.
- Event-Detailansicht und Wiederherstellung zur Wunschliste.
- Zustände Fehlgeschlagen, Übertroffen und Zerstört für Leistungsziele.
- Tage bis zum nächsten Event im Dashboard.
- App-Version in der Fußzeile.

### Geändert

- Zustand «Scheduled» in «Planned» umbenannt.
- Abmelden in die Einstellungen verschoben.

### Behoben

- Kontrast und Statusfilter; Legende und Tabelle in Ergebnissen.
- Datenisolation pro Benutzer.

---

## [0.1.0] - 2026-06-26

Meilenstein: **MVP**, Excel-Tabellen-Ersatz als PWA.

### Hinzugefügt

- Web-App mit Google-Login, Cloud-Daten und Offline-Modus.
- Event-, Ergebnis- und Jahresziel-Verwaltung; Dashboard mit Diagrammen.
- Excel-Import und -Export.
- **Wunschliste**, Kalender, Leistungsziele und lokale Benachrichtigungen.
- Einstellungen, persönliche Rekorde und PWA-Installation.

### Behoben

- Login und Offline-Synchronisation über mehrere Tabs.
