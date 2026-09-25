# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.82.0] - 2026-09-25

### Geändert

- **Planung statt Bucket List:** eine Saison ist der Weg zu jedem Ankerrennen, mit den vorbereitenden Rennen auf einer Linie, dem Abstand dazwischen, und dem Zwischenraum, der den Katalog mit genau diesen Daten öffnet.
- **Markieren und planen ohne Formulare:** ein Herz im Katalog markiert ein Rennen als Wunsch, und der Kalenderknopf legt es mit dem Datum des Katalogs in die Saison.
- **Ein Wunsch ist eine Markierung:** ohne eigenen Namen, Ort und Distanz, die dem Rennen gehören, und nur mit deiner Notiz.
- **Losverfahren und Fristen gehören zum Rennen:** raus aus dem Weg aller und hinein in die Ankerrennen, um deren Startplätze gekämpft wird.
- **Die Wunschkarte liest den Ort des Rennens:** ein im Katalog markiertes Rennen behält jetzt die Koordinaten, die der Katalog veröffentlicht, und die Karte zeigt, was das Rennen weiß, statt was der Wunsch kopiert hatte.
- **Die App lernt, wo die Rennen des Katalogs liegen:** jede Nacht findet sie bis zu dreihundert davon, aus Ort und Land, die die Quellen veröffentlichen. Zwei Drittel des Katalogs hatten keine Koordinaten, und ohne sie fehlt ein Rennen auf der Karte und in einer Suche nach Umkreis.
- **Wünsche stehen in der Reihenfolge, in der sie stattfinden:** jeder nennt das Datum seiner nächsten Ausgabe, sobald der Veranstalter es veröffentlicht und der Abgleich es bringt, oder den Monat, in dem das Rennen üblicherweise liegt, und die Liste folgt dem statt dem Alphabet.
- **Eine Anmeldung darf vor dem Kalender bestehen:** ein ein Jahr im Voraus eingereichtes Losverfahren, oder ein ausgefallenes Rennen, das du nächste Saison erneut versuchst, erscheint in der Planung dieser Saison und lässt sich für seine Fristen öffnen, ganz ohne Termin.
- **Eine Zeilenaktion sieht überall gleich aus:** Katalog und parkrun-Liste mischen nicht mehr Links, Emojis und farbige Knöpfe, sondern nutzen dieselben beschrifteten Symbole wie Events seit jeher. Das Teilen-Feld sitzt jetzt in den Wünschen, denn die werden geteilt.

---

## [1.81.0] - 2026-09-18

### Hinzugefügt

- **Später fragen:** in der Liste der Rennen, die auf eine neue Saison warten, lassen sich die angehakten um eine Woche, einen Monat oder drei Monate vertagen, damit die ungelesenen ohne zehn Seiten erreichbar sind.
- **Die Zahl stimmt:** die Zahl über dieser Liste ist jetzt die der wirklich wartenden Rennen, auf dem Server gezählt, statt mit jedem „Mehr anzeigen“ zu wachsen.

---

## [1.80.0] - 2026-09-18

### Behoben

- **Das Rückgängigmachen entfernter Rennen funktioniert wieder:** der Grund wurde auf null gesetzt statt gelöscht, und die Regeln lehnten den ganzen Schreibvorgang ab.

---

## [1.79.0] - 2026-09-18

### Behoben

- **parkruns verlassen den Kalender der jährlichen Rennen:** deutsche Kalender führten die Strecken als Events mit Termin und Anmeldung, neben derselben Strecke im parkrun-Katalog der App. Jährliche Rennen mit „Park Run“ im Namen, etwa der Brescia Park Run, bleiben.

---

## [1.78.0] - 2026-09-18

### Behoben

- **Der tägliche Abgleich hat Zeit, fertig zu werden:** sein letzter Schritt, die Liste möglicher Dubletten, drohte auszufallen, wenn die Quelle des Tages groß war.

---

## [1.77.0] - 2026-09-18

### Behoben

- **„Mehr anzeigen“ weiß jetzt, wann Schluss ist:** in der Liste bestätigter Rennen ohne künftigen Termin wiederholte der Knopf endlos die letzte Seite, und die Zahl oben wuchs mit. Außerdem werden Rennen mit gleichem Datum nicht mehr übersprungen.

---

## [1.76.0] - 2026-09-18

### Geändert

- **Auch bei Rennen von kilometerliebe.de:** ihr Link ist jetzt die Seite des Veranstalters, wie bei den beiden anderen Plattformen. 267 Rennen, über einige Nächte verteilt.

---

## [1.75.0] - 2026-09-18

### Geändert

- **Die Dublettenliste sagt, warum sie fragt:** zeigen beide Rennen auf dieselbe Seite des Veranstalters, steht sie unter dem Paar.

---

## [1.74.0] - 2026-09-18

### Hinzugefügt

- **Doppelte Rennen mit derselben Seite:** die Liste möglicher Dubletten stellt jetzt zwei Rennen zusammen, die auf dieselbe Seite des Veranstalters zeigen, auch wenn jeder Kalender sie in einem anderen Ort einsortiert hat.

---

## [1.73.0] - 2026-09-18

### Hinzugefügt

- **Die Seite des Veranstalters auch bei neuen Rennen:** jede Nacht liest die App bis zu hundert Kalenderseiten und ersetzt den Link der Plattform durch die Seite des Rennens.

---

## [1.72.0] - 2026-09-18

### Behoben

- **Was im Katalog entschieden wird, überlebt den Abgleich:** die Seite des Veranstalters, der Grund für ein entferntes Rennen und das „das ist ein Lauf“ wurden in der nächsten Nacht überschrieben.

---

## [1.71.0] - 2026-09-18

### Geändert

- **Der Link eines Rennens ist jetzt die Seite des Veranstalters:** bisher war es die Kalenderseite, auf der das Rennen gefunden wurde, was einen zweiten Klick bis zur echten Seite kostete. Die Fundseite wird getrennt aufbewahrt.

---

## [1.70.0] - 2026-09-17

### Hinzugefügt

- **„Das sind Läufe“ sagen und sie nicht mehr sehen:** in der Liste dessen, was sich wie ein anderer Sport liest, werden die echten Läufe als solche markiert und verschwinden daraus. Mit Rückgängig, falls das Ja zu schnell kam.

---

## [1.69.0] - 2026-09-17

### Hinzugefügt

- **STGK-Ergebnisse:** Läufe, die STGK in Norddeutschland zeitnimmt, übernehmen dein Ergebnis jetzt automatisch. Füge den Ergebnislink der Veranstaltung ein, und die App findet die richtige Wertung unter den Distanzen des Tages.

---

## [1.68.0] - 2026-09-17

### Hinzugefügt

- **Auflisten, was sich nicht wie ein Lauf liest:** in der Verwaltung sucht ein Knopf Triathlons, Wanderungen und Ähnliches nach dem Namen, zum Entscheiden in einem Zug. Ein Lauf mit Walking daneben bleibt aus der Liste, denn er ist ein Lauf.

---

## [1.67.0] - 2026-09-17

### Hinzugefügt

- **Mehrere Rennen auf einmal aus dem Katalog nehmen:** Zeilen auswählen, einen Grund angeben, und alle gehen. Mit einem Knopf, der den ganzen Durchgang zurücknimmt, falls er zu weit ging.

---

## [1.66.0] - 2026-09-17

### Behoben

- **Ein Rennen aus dem Katalog zu nehmen fragt nur nach dem Grund:** keine Distanzen, keine Quelle, und niemand muss mehr behaupten, es sei geprüft worden. Ein als Lauf gelesener Triathlon hat keine Distanz, die zu erfinden lohnt.

---

## [1.65.0] - 2026-09-17

### Hinzugefügt

- **Ein parkrun-Ergebnis aus der gedruckten Seite übernehmen:** parkrun lässt keine automatische Suche zu, wohl aber das Drucken der Ergebnisse als PDF. Öffne diese Datei im Ergebnis-Editor, und die App entnimmt ihr deine Zeit, deine Platzierung und die Feldgröße. Beide Fassungen der Seite, die kompakte und die ausführliche, werden gelesen. Die Datei wird auf deinem Gerät gelesen und nirgendwohin gesendet.

### Behoben

- **Ein abgekürzter Name trifft nicht mehr die falsche Person:** wer den Familiennamen zurückhält, erscheint in den Ergebnissen als „Jonas S“. Die App behandelte diese Initiale als losen Textschnipsel, womit sie fast jeden Namen traf. Jetzt muss sie der Anfang eines Namens sein.

---

## [1.64.0] - 2026-09-17

### Hinzugefügt

- **Das Ergebnis aus dem offiziellen PDF übernehmen:** wo der Zeitnehmer die Wertung veröffentlicht, die Suche aber sperrt, wie bei MaxFunSports, lade das PDF herunter und öffne es im Ergebnis-Editor. Die App findet dich in der Tabelle und trägt Zeit und Platzierung ein. Die Datei wird auf deinem Gerät gelesen und nirgendwohin gesendet.

---

## [1.63.0] - 2026-09-17

### Behoben

- **Ein Ergebnis von Hand zu korrigieren ist nicht mehr verdeckt:** der Knopf für die erneute Suche lag über dem Bearbeiten-Stift. Jetzt stehen beide nebeneinander.
- **Ein Ergebnis einzutragen führt nicht mehr ins Leere:** die Stoppuhr-Verknüpfung führte auf eine Seite, die es nicht mehr gibt, und ein bereits gelaufenes Rennen bot das Formular erst nach dem Abschließen an.

### Geändert

- **Die automatische MaxFunSports-Suche ist abgeschaltet:** die Website blockiert jedes automatisierte Lesen. Die Zeit wird von Hand eingetragen.

---

## [1.62.0] - 2026-09-14

### Hinzugefügt

- **Der Kalender eines zweiten Zeitmessers:** die Suche liest jetzt 32 Rennen im Rheinland, jedes mit der eigenen Seite des Rennens, und alle führen zu einer Ergebnisplattform, die die App importiert. Bleibt aus, bis du sie einschaltest.

---

## [1.61.0] - 2026-09-14

### Geändert

- **Eine Anmeldung als erledigt zu markieren fragt jetzt nach dem Preis:** nur wenn der Katalog keinen hat, und nie blockierend. Kein Kalender veröffentlicht Gebühren, also ist der Zahlende die einzige Quelle. Die Währung ist jetzt eine Liste, damit ein Preis nicht an drei Buchstaben scheitert.

---

## [1.60.0] - 2026-09-14

### Behoben

- **Die offizielle Platzierung wird nicht mehr neu berechnet:** schrieb eine RaceResult-Veranstaltung ihre Gesamtrang-Spalte als `GesPl.p`, erkannte der Import sie nicht und sortierte das Feld nach Zeiten neu. Die Zahl lag nah dran, war aber falsch, und nichts wies darauf hin.
- **Eine Seite, die RaceResult nur einbettet, wird jetzt erkannt:** die Adresse, die eine Läuferin kopiert, trägt gar kein Fragment, und der Import lehnte sie ab. Die Seite wird nun gelesen, und die Veranstaltung kommt aus der Einbettung selbst.

---

## [1.59.0] - 2026-09-14

### Hinzugefügt

- **Ein Rennen feiert jetzt, was es verändert hat:** beim Speichern eines Ergebnisses erscheint ein Panel mit Konfetti für eine neue persönliche Bestzeit, ein erreichtes Jahresziel, ein Leistungsziel, die Premiere über eine Distanz, eine Streckenbestzeit und runde Zahlen, statt des schlichten Hinweises, dass das Ergebnis gespeichert wurde. Was das Rennen gesetzt hat, bleibt für immer auf seiner Seite, auch nachdem es überboten wurde, und wer weniger Bewegung möchte, bekommt kein Konfetti.

### Geändert

- **Die persönliche Bestzeit wird aus der Zeit gelesen, nicht aus dem gerundeten Tempo:** zwei Rennen, die beide 5:20 anzeigen, konnten drei Sekunden auseinanderliegen, und der Gleichstand wurde auf der Startseite, in der Analyse und bei den Zielen unterschiedlich aufgelöst. Alle drei folgen jetzt derselben Regel.

---

## [1.58.0] - 2026-09-13

### Behoben

- **Eine Platzierung nennt jetzt das Feld, in dem sie erreicht wurde:** bei RaceResult meldete eine Veranstaltung mit Altersklassenliste die Größe der Altersklasse als Feld und blieb den Gesamtrang schuldig. Bei mika:timing meldeten Läufe mit getrennter Wertung für Frauen und Männer gar kein Feld. Platz und Feld stammen jetzt immer aus derselben Liste.

---

## [1.57.0] - 2026-09-13

### Behoben

- **Ein unvollständiger Ergebnis-Link verhindert den Import nicht mehr:** die eigene Ergebnisseite bei RaceResult (`/details1?pid=…`) einzufügen funktioniert jetzt wie das Einfügen der Liste. Bei mika:timing bleiben Veranstaltungen, deren Suche weder Zeit noch Link zeigt, nicht mehr aussen vor: der Lauf wird über die Laufauswahl gefunden, die Zeit kommt von der Seite der Läuferin oder des Läufers.

---

## [1.56.0] - 2026-09-13

### Geändert

- **Der Name eines Rennens wiederholt nicht mehr seinen Ort:** „Paarlauf im Rahmen des Sportabzeichentages - Frankfurt (Oder)“ zeigt nur noch den Namen, mit dem Ort daneben wie immer. Nur wenn der Ort der ganze Schluss des Namens ist und der Rest das Rennen weiter benennt.
- **Bei einem parkrun erscheint die Einladung zur Katalogverknüpfung nicht mehr:** parkruns leben nicht dort, ihre Termine kommen aus dem parkrun-Event selbst. Ein Rennen, das nur „parkrun“ heißt und mit keinem verknüpft ist, bekommt die Einladung weiter.

---

## [1.55.0] - 2026-09-13

### Geändert

- **Rennnamen tragen die Ausgabe nicht mehr:** aus „33. Graz Marathon“ wird „Graz Marathon“, denn das Rennen ist dasselbe und die Zahl ändert sich jedes Jahr. Eine Zahl, die zum Namen gehört („10 Marathon in 10 Tagen“), bleibt.

---

## [1.54.0] - 2026-09-13

### Behoben

- **Ein in der Verwaltung angelegtes Rennen ist jetzt auffindbar:** es wurde ohne die Wörter gespeichert, nach denen die Suche sucht, tauchte also nirgends auf, und seine Kennung blockierte jeden, der es erneut anlegen wollte. Der Fehler „Kennung vergeben“ führt jetzt zu dem Rennen, das sie hat.

---

## [1.53.0] - 2026-09-11

### Hinzugefügt

- **Sagen, warum ein Rennen den Katalog verlässt:** es endete, es ist kein Lauf (Triathlon, Walking, Rad) oder gar kein Wettkampf. Die Begründung wählt immer ein Mensch, und was kein Lauf ist, wird nicht mehr bei jeder Ernte neu geschrieben.

---

## [1.52.0] - 2026-09-11

### Behoben

- **Zwei Rennen zusammenzulegen funktioniert wieder:** fehlte beiden ein Feld (etwa der Anmeldelink), scheiterte das Zusammenlegen mit „konnte nicht gespeichert werden“ und beide blieben, wie sie waren.

---

## [1.51.0] - 2026-09-11

### Geändert

- **Ausgemusterte Rennen lesen sich so leise wie zusammengelegte:** in der Verwaltung ist alles, was der Katalog einem Läufer nicht zeigt, leiser als das, was er zeigt.

---

## [1.50.0] - 2026-09-11

### Geändert

- **Zusammengelegte Rennen sind auf einen Blick zu unterscheiden:** in der Verwaltung bekommt ein Rennen, das auf ein anderes zeigt, einen leiseren Namen und Hintergrund, damit es nicht mit dem verwechselt wird, das der Katalog zeigt.
- **Die Währung einer Gebühr kommt aus einer Liste:** mit Code und Namen in deiner Sprache statt drei getippter Buchstaben, und eine Gebühr ohne Währung lässt sich nicht mehr speichern.
- **Die Zeitzone wird nicht mehr abgefragt:** sie kommt aus dem Land des Rennens und wird nur gewählt, wenn das Land wirklich mehrere hat, aus den Zonen dieses Landes. Vorher war es ein Feld, das sich bei jeder Ausgabe wiederholte.
- **Daten in der Verwaltung mit dem Kalender der App:** geschrieben, wie deine Sprache sie schreibt (11.09.2026), nicht wie das Betriebssystem des Browsers, und eine Frist ist jetzt ein Datum plus optionale Uhrzeit, in der Uhrzeit des Rennens.
- **Die offizielle Seite öffnet sich aus der Liste:** jedes Rennen in der Verwaltung trägt jetzt ein 🔗 zu seiner Quelle, um die nächste Saison ohne Umweg über das Formular zu prüfen.

---

## [1.49.0] - 2026-09-11

### Behoben

- **Zwei Rennen zusammenzulegen behält jetzt, was beide wussten:** das bleibende Rennen übernimmt Ausgaben, Termine, Gebühren, Ergebnislinks, offizielle Seite und Distanzen des anderen. Vorher zeigte es nur darauf, und die Informationen verschwanden aus dem Blick.

---

## [1.48.0] - 2026-09-10

### Hinzugefügt

- **Zwei Katalogrennen von Hand zusammenlegen:** in der Verwaltung das doppelte auswählen, das bleibende suchen, zusammenlegen. Vorher legte nur die Duplikate-Liste Rennen zusammen, und manche Namen kann keine Regel vergleichen.
- **Ein Rennen finden, dessen Name fast nur Zahlen ist:** "S25" oder "S 25" zu tippen findet das Rennen jetzt, das vorher nur unter "Berlin" auftauchte, zwischen hunderten.

---

## [1.47.0] - 2026-09-10

### Behoben

- **Ein fehlerhaftes Datum macht die Seite nicht mehr weiß:** ein Katalogrennen mit einem unmöglichen Datum riss die ganze Event-Seite mit. Jetzt steht dort ein Strich, und die Verwaltung nutzt eine Datumsauswahl, die kein ungültiges Datum annimmt.
- **"Verschiedene Rennen" nimmt das Paar von der Liste:** die Antwort wurde gespeichert, das Paar blieb aber bis zum nächsten Tag im Panel, als täte der Knopf nichts.

---

## [1.46.0] - 2026-09-10

### Behoben

- **Verschiedene Rennen werden nicht mehr wegen eines gemeinsamen Tages zusammengelegt:** denselben Tag, dieselbe Stadt und dieselbe Distanz wie ein schon geprüftes Rennen zu haben macht es nicht zum selben Rennen, es wurde aber als Kopie behandelt. Jetzt legen nur die Namen zwei Einträge zusammen, und ein Rennen im Nachbarort (etwa "Rüdersdorf bei Berlin") zählt nicht mehr als in der großen Stadt.

---

## [1.45.0] - 2026-09-10

### Behoben

- **Ein Rennen vorzuschlagen verknüpft dich damit:** das vorgeschlagene Rennen ist jetzt mit deinem Event verknüpft, mit dem Tag und der Ergebnisseite, die du schon hattest. Vorher entstand der Eintrag und du bliebst außen vor.
- **Weniger doppelte Rennen:** dasselbe Rennen zweimal für verschiedene Jahre gespeichert wird jetzt erkannt, und ein Rennen vorzuschlagen, das der Katalog schon für ein anderes Jahr hat, verknüpft dich damit statt ein zweites anzulegen. Der Ort eines Vorschlags kommt jetzt vom Ende der Angabe (die Stadt) statt vom Anfang (der Park).

---

## [1.44.0] - 2026-09-10

### Hinzugefügt

- **Ein Rennen zu verknüpfen meldet, was du schon gelaufen bist:** die Ausgaben, die du mit geprüftem Ergebnis gelaufen bist, kommen jetzt in den Katalog, nicht nur die kommenden.
- **Die Ergebnisse jeder Ausgabe im Katalog:** beim Import eines geprüften Ergebnisses kommt die Ergebnisseite jenes Jahres in den Katalog, ohne alles, was dich identifiziert (eine Suche nach deinem Namen oder deine Zeile der Tabelle bleiben draußen).
- **Die Ergebnisse, die jemand schon gefunden hat:** bei einem Event ohne Ergebnislink bietet der Katalog die Seite jenes Jahres an, und sie zu nutzen ist dein Klick.

### Geändert

- **Die Zeitzone kommt aus einer Liste:** nach Region und mit der jeweiligen Uhrzeit, statt den IANA-Namen zu tippen.

### Behoben

- **Nach dem Sagen, welches Rennen es ist, verschwindet der Kasten:** vorher fragte er dasselbe weiter, bis die Seite neu geladen wurde.

---

## [1.43.0] - 2026-09-10

### Hinzugefügt

- **Die Namenssuche trifft besser:** sie nutzt jedes Wort, das du tippst, und stellt die treffendsten voran, nicht die nächsten Termine.
- **Ein Rennen vorschlagen sagt, was folgt:** die Meldung macht klar, dass nichts weiter nötig ist, und wer den Katalog pflegt, sieht die wartenden Vorschläge.
- **Schnelleres Katalog-Panel:** es zeigt die Rennen, die Arbeit brauchen, fünfzig auf einmal, statt alle fünftausend zu laden.
- **Das Land kommt aus einer Liste:** mit den Namen in deiner Sprache, statt des zweibuchstabigen Codes.

---

## [1.42.0] - 2026-09-09

### Hinzugefügt

- **Ein Rennen nach Namen finden:** das Suchfeld sucht im ganzen Katalog, nicht nur in den Rennen, die schon auf der Seite waren.
- **Sagen, welches Rennen es ist:** verknüpfe das Rennen deines Events mit dem geteilten Katalog, dann kommen Termine und Gebühr der nächsten Ausgabe ausgefüllt.
- **Ein fehlendes Rennen vorschlagen:** wenn das Rennen, das du läufst, nicht im Katalog ist, kannst du es auf der Event-Seite vorschlagen.

---

## [1.41.0] - 2026-09-09

### Hinzugefügt

- **Doppelte Einträge im Katalog:** jedes Rennen in der Prüfliste hat jetzt einen Link zu seiner Quelle, damit sich die beiden auf den Seiten unterscheiden lassen, von denen sie kommen.
- **Die Anmeldung kommt schon ausgefüllt:** wer ein Rennen plant, das der Katalog kennt, findet Termine, Fristen und Gebühr bereits im Formular, mit der Quelle sichtbar. Solange niemand den Eintrag geprüft hat, bleiben sie ein Vorschlag, und das Datum gilt nicht als bestätigt.
- **Dein offizielles Ergebnis verbessert den Katalog:** mit einem verifizierten Ergebnis sagst du dem Katalog, an welchem Tag das Rennen lief. Ein Jahr, das er nicht hatte, kommt sofort hinein; ein Datum zu korrigieren, das er schon hatte, braucht zwei Läufer, die übereinstimmen. Nur der Tag reist mit, nie der Absender, und es löst weiter keine Erinnerungen aus.
- **Was es gekostet hat, für die Nächsten:** wenn du eine Anmeldung als erledigt markierst, landet die von dir bezahlte Gebühr im Katalog. Keiner der Kalender, die wir lesen, veröffentlicht Gebühren, das gibt es also nur, weil Läufer es sagen. Eine Gebühr zu ändern, die der Katalog schon hat, braucht zwei Läufer, die übereinstimmen.

---

## [1.40.0] - 2026-09-09

### Hinzugefügt

- **Rennen in deiner Nähe:** die Rennsuche bekommt einen Radius, 10 bis 250 km, gemessen von deinem Standort oder von dem Ort, den du eintippst.
- **Doppelt gelistete Rennen:** wenn zwei Zeilen der Suche dasselbe Rennen in zwei Schreibweisen sind, kannst du es uns mit einem Tipp sagen.

### Geändert

- **Suche nach Distanz:** Rennen, deren Kalender die Distanz nur in der Beschreibung nennt, antworten jetzt auf den Filter.

### Behoben

- **Dasselbe Rennen zweimal:** deutlich weniger Wiederholungen in der Liste, wenn Quellen den Ort, das Datum oder die Sprache anders schreiben.

---

## [1.39.0] - 2026-09-04

### Geändert

- **Rennen finden:** die Seite fragt jetzt nach einem Filter, bevor sie eine Liste zeigt, bekommt eine Suche nach Land, und holt die Ergebnisse seitenweise statt den ganzen Katalog in den Browser zu laden.

---

## [1.38.0] - 2026-09-04

### Behoben

- **Rennen doppelt im Katalog:** dasselbe Rennen landet nicht mehr zweimal darin, wenn zwei Quellen es leicht anders nennen, wenn eine keine Distanz veröffentlicht oder wenn der Ortsname im Namen die Stelle wechselt.

---

## [1.37.0] - 2026-09-04

### Hinzugefügt

- **Rennen in 60 Ländern:** die Suche kann jetzt einen weltweiten Kalender mit 2280 Rennen lesen, überwiegend 5 und 10 km, sowie Halbmarathon-Kalender aus 17 Ländern. Sie bleibt aus, bis du sie einschaltest.

---

## [1.36.0] - 2026-09-04

### Behoben

- **Katalogaktualisierung:** eine nur teilweise gelesene Quelle (in Abschnitten, oder von der Seite abgebrochen) gilt nicht mehr als defekt, was ihre Aktualisierung verhinderte.

---

## [1.35.0] - 2026-09-03

### Hinzugefügt

- **Mehr kurze Strecken:** die Suche kann jetzt zwei deutsche Kalender lesen, voll mit 5 km, 10 km und Halbmarathons. Sie bleibt aus, bis du sie einschaltest.

### Geändert

- **Der Katalog wird stückweise aktualisiert:** der Katalog wird jeden Tag aktualisiert, eine Quelle auf einmal, und eine ausgefallene Quelle hält die anderen nicht mehr auf.

### Behoben

- **Self-hosting:** das Deployment der Functions schlug seit dem letzten Abhängigkeits-Update fehl.

---

## [1.34.0] - 2026-09-03

### Hinzugefügt

- **Zwei neue Quellen:** Marathons in 55 Ländern und deutsche Rennen mit der Startgebühr. Sie bleibt aus, bis du sie einschaltest.

---

## [1.33.0] - 2026-09-03

### Hinzugefügt

- **Die Straße der Saison:** das Hero zeigt das letzte Rennen, das nächste und das Zielrennen, jedes mit eigenem Countdown.

### Geändert

- **Planen heißt verschieben:** ein Rennen aus der Bucket List einzuplanen legt es in den Kalender und nimmt es von der Liste.
- **Saisonhinweise:** sie bleiben auf der Seite des Rennens und verschwinden nicht mehr, wenn du es einplanst.

### Behoben

- **Distanzen mit Dezimalstellen:** 42,195 km lassen sich jetzt speichern.
- **Rennen doppelt im Katalog:** dasselbe Rennen steht nicht mehr zweimal unter verschiedenen Namen darin.

---

## [1.32.0] - 2026-09-02

### Hinzugefügt

- **Anmeldeplanung:** die Bucket List ist jetzt danach gruppiert, was noch zu tun ist, und jedes Rennen kann seine Anmeldung tragen: wann sie öffnet, wann sie schließt, die Ziehung, und die Frist, einen gewonnenen Platz zu sichern. Mit Erinnerung vor jeder Frist.
- **Eine Saison um die Ankerrennen:** markiere die Rennen, die dein Jahr festlegen, und die App schlägt vor, wo ein Aufbaurennen passt, warnt, wenn etwas ins Tapering fällt, und zeigt die erwartete Zeit für das Ankerrennen.
- **Wenn es schiefgeht:** ein Rennen, das ohne Ergebnis vorbeigeht, fragt, was passiert ist, statt zu sagen, du hättest es verpasst, ein DNF zählt als gestartetes Rennen, und ein Knopf legt den Versuch der nächsten Saison an.
- **Rennen finden:** eine neue Seite sucht im Katalog nach Monat, Distanz und Ort und fügt ein Rennen mit einem Klick zur Liste hinzu. Die parkruns in deiner Nähe sind dabei.
- **Erste Schritte:** das Dashboard eines neuen Kontos beginnt mit vier Schritten, jeder sagt, was die App damit macht. Es verschwindet, wenn sie erledigt sind.

### Geändert

- **Konten, die auf Freigabe warten:** die Anmeldung wird jetzt mit dem Grund abgelehnt, statt das Konto in eine App zu lassen, in der nichts geschrieben werden konnte.
- **Self-hosting:** zwei neue Quellen für den Katalog, aus, bis du sie einschaltest. Siehe [`docs/discovery-sources.md`](docs/discovery-sources.md).

---

## [1.31.0] - 2026-09-01

### Hinzugefügt

- **Mehr Distanzen:** 1500 m, 3000 m, 15K, 10 Meilen, 30K, 50K, 50 Meilen, 100K und 100 Meilen kommen zu den vier ursprünglichen dazu. Die neuen sind zunächst aus: schalte unter Einstellungen, Disziplinen die ein, die du läufst.
- **Rennkatalog:** die Instanz kennt Rennen jetzt mit Namen, samt Zugang zum Start und den Fristen und Ziehungen jeder Ausgabe. Daraus kommen später die Hinweise, bevor die Anmeldung schließt.
- **Verwaltungsbereich:** Konten freigeben, sperren und löschen und den Katalog pflegen, in der App statt in der Konsole.

### Geändert

- **Disziplinen wählen wurde kompakt:** die 13 Distanzen sind jetzt Chips, gruppiert in Bahn, Straße und Ultra.
- **Self-Hosting:** der Administrator ist jetzt ein so markierter Benutzer statt einer Umgebungsvariablen. Siehe [`docs/self-hosting.md`](docs/self-hosting.md).

---

## [1.30.0] - 2026-09-01

### Entfernt

- **Excel-Import und -Export sind entfernt:** Das vollständige `.zip`-Backup deckt dasselbe genauer ab, inklusive Fotos, Videos, Aktivitätsdateien und Ziele, und stellt alles mit denselben Kennungen wieder her. Eine Tabelle ist kein Weg hinein mehr.

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

- **Aktivitätsdateien bei Events:** lade die GPX- oder TCX-Datei deiner Uhr hoch, und das Rennen bekommt Kilometer-Splits, die Strecke auf der Karte, Tempo, Höhe und Herzfrequenz. Die gemessene Zeit wird zum Ausfüllen angeboten, nie aufgezwungen: es zählt die offizielle Zeitnahme.

---

## [1.26.1] - 2026-08-30

### Geändert

- **Dokumente folgen der App-Sprache:** Changelog, Ergebnishinweis und Datenschutzerklärung haben keine eigene Sprachauswahl mehr, und Arabisch wird von rechts nach links gelesen.

---

## [1.26.0] - 2026-08-30

### Hinzugefügt

- **Wähle die Disziplinen, die du sehen willst:** unter Einstellungen > App kannst du Distanzen abschalten, die du nicht läufst. Sie verschwinden aus Filtern und Auswahllisten. Nichts von dem, was du schon hast, geht verloren.

---

## [1.25.0] - 2026-08-30

### Geändert

- **Aus der Ergebnisseite wird die Analyseseite:** sie beantwortet drei Fragen, mit einem Auswahlfeld oben: wie diese Saison läuft, wie sie gegen die früheren steht und was sich über die ganze Zeit verändert hat. Alte Links funktionieren weiter.
- **Formkurve:** Jedes Rennen wird auf seinen Wert bei deiner meistgelaufenen Distanz umgerechnet, sodass 5K und Marathon auf einer Linie vergleichbar werden. Mit Zeitprognosen für die anderen Distanzen.
- **Neue Auswertungen:** Platzierung im Feld über die Zeit, Entwicklung jedes Rekords, kumulierte Kilometer gegen frühere Saisons, starke und schwache Monate im Jahr und ein Beständigkeitsraster nach Rennen oder Kilometern.
- **Durchschnittstempo des Jahres korrigiert:** Es ist jetzt nach Distanz gewichtet. Bisher zählte ein 5K so viel wie ein Marathon.

---

## [1.24.0] - 2026-08-29

### Geändert

- **Das Ergebnis eines Rennens wird auf der Event-Seite bearbeitet:** Die separate Seite entfällt. Zeit, Platzierung und der Link zu den offiziellen Ergebnissen stehen jetzt zusammen, neben den Zahlen.

---

## [1.23.0] - 2026-08-29

### Geändert

- **Der parkrun-Katalog aktualisiert sich selbst:** neue parkrun-Veranstaltungen erscheinen wenige Tage nach ihrer Eröffnung, ohne auf ein App-Update zu warten.

---

## [1.22.0] - 2026-08-28

### Geändert

- **Der Rest der App zieht mit dem Start nach:** Ziele werden nach Zustand gruppiert, die Filter sehen auf jeder Seite gleich aus, und eine Event-Seite trägt jetzt den Rennnamen als Titel.

---

## [1.21.0] - 2026-08-28

### Geändert

- **Start neu gestaltet:** das nächste Event mit Countdown im Vordergrund, die Zahlen des Jahres in einer einzigen Leiste, jetzt mit gelaufenen Kilometern, und ein eigener Platz für Erfolge, offene Ziele und persönliche Bestzeiten.

---

## [1.20.0] - 2026-08-25

### Hinzugefügt

- **Neue Sprache: Arabisch (erste Version):** die App ist jetzt auf Arabisch verfügbar, mit Layout von rechts nach links. Wähle es unter Einstellungen → Sprache.

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

- **Veranstaltungsstatus:** Eine Veranstaltung mit offiziellem Ergebnis kann nicht mehr als „Verpasst“ markiert werden.

---

## [1.16.0] - 2026-08-03

### Hinzugefügt

- **Backup mit Fotos und Videos:** Die Backup-`.zip` enthält jetzt die Foto- und Videodateien, nicht mehr nur deren Metadaten. Du kannst die Option vor dem Export abwählen; über 300 MB enthält das Backup nur die Daten.
- **Fotos und Videos wiederherstellen:** Liegen die Dateien in der `.zip`, kommen Fotos und Videos auch im Modus „Alles ersetzen“ und beim Wiederherstellen in einem anderen Konto zurück, vorher nur, wenn sie noch im Konto lagen.

---

## [1.15.1] - 2026-08-03

### Behoben

- **Sicherheit:** ein wartendes oder abgelehntes Konto kann sich nicht mehr selbst Vollzugriff geben.
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

- **Self-Hosting:** du kannst neue Konten von Hand freigeben lassen: eine E-Mail an den Administrator zum Freigeben oder Ablehnen und eine Nachricht an den Benutzer. Optional. Siehe [`docs/self-hosting.md`](docs/self-hosting.md).

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
