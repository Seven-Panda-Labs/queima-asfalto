# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.80.0] - 2026-09-18

### Fixed

- **Undoing a sweep of retired races works again:** the reason was written as null rather than deleted, and the rules refused the whole write.

---

## [1.79.0] - 2026-09-18

### Fixed

- **parkruns leave the annual race calendar:** German calendars listed the venues as events with a date and an entry, beside the same venue in the app's own parkrun catalog. Annual races named "park run", like the Brescia Park Run, stay.

---

## [1.78.0] - 2026-09-18

### Fixed

- **The daily harvest has room to finish:** its last step, the possible-duplicates list, risked being cut off whenever the day's source was a big one.

---

## [1.77.0] - 2026-09-18

### Fixed

- **"Show more" now knows when it is done:** in the list of confirmed races with no future edition, the button repeated the last page forever and the count at the top grew with it. It also no longer skips races that share a date.

---

## [1.76.0] - 2026-09-18

### Changed

- **Races found on kilometerliebe.de too:** their link becomes the organiser's site, as it already was on the other two platforms. 267 races, resolved over a few nights.

---

## [1.75.0] - 2026-09-18

### Changed

- **The duplicates list says why it is asking:** when both races point at the same organiser page, the list shows it under the pair.

---

## [1.74.0] - 2026-09-18

### Added

- **Repeated races that share a site:** the possible-duplicates list now pairs two races pointing at the same organiser page, even when each calendar filed them under a different village.

---

## [1.73.0] - 2026-09-18

### Added

- **The organiser's site on new races too:** each night the app reads up to a hundred calendar pages and swaps the platform's link for the race's own site.

---

## [1.72.0] - 2026-09-18

### Fixed

- **What is decided in the catalog survives the harvest:** the organiser's site, the reason a race was taken out and "this is a race" were wiped by the next night's run.

---

## [1.71.0] - 2026-09-18

### Changed

- **A race's link is now the organiser's own site:** until now it was the calendar page the race was found on, which meant a second click to reach the real one. The page it came from is kept separately.

---

## [1.70.0] - 2026-09-17

### Added

- **Say "these are races" and stop seeing them:** in the list of what reads as another sport, the ones that really are races are marked as such and drop out of it. With an undo, in case the yes was too quick.

---

## [1.69.0] - 2026-09-17

### Added

- **STGK results:** races timed by STGK, in northern Germany, now import your result automatically. Paste the event's results link and the app finds the right ranking among the day's several distances.

---

## [1.68.0] - 2026-09-17

### Added

- **List what does not read as a running race:** in the admin area, a button finds triathlons, walks and the like by name, to decide in one go. A race with a walk beside it stays out of the list, because it is a race.

---

## [1.67.0] - 2026-09-17

### Added

- **Take several races out of the catalog at once:** pick the rows, give one reason, and they all go. With a button to undo the whole sweep, in case it went too wide.

---

## [1.66.0] - 2026-09-17

### Fixed

- **Taking a race out of the catalog asks only for the reason:** no distances, no source, and no need to claim somebody checked it first. A triathlon read as a race has no distance worth inventing.

---

## [1.65.0] - 2026-09-17

### Added

- **Import a parkrun result from the printed page:** parkrun allows no automatic search, but it does let you print the results to PDF. Open that file in the result editor and the app takes your time, your placing and the size of the field from it. Both versions of the page, compact and detailed, are read. The file is read on your device and is never sent anywhere.

### Fixed

- **A shortened name no longer matches the wrong person:** when somebody withholds their family name, results show something like “Jonas S”. The app treated that initial as a loose piece of text, which made it match almost any name. It now has to be the start of one.

---

## [1.64.0] - 2026-09-17

### Added

- **Import your result from the official PDF:** where the timer publishes the ranking but blocks the search, as MaxFunSports does, download the PDF and open it in the result editor. The app finds you in the table and fills in time and placing. The file is read on your device and is never sent anywhere.

---

## [1.63.0] - 2026-09-17

### Fixed

- **Correcting a result by hand is no longer hidden:** the search-again button covered the edit pencil. They now sit side by side.
- **Recording a result no longer leads nowhere:** the stopwatch shortcut led to a page that no longer exists, and a race already run only offered the form once marked completed.

### Changed

- **Automatic MaxFunSports lookup is off:** the site blocks all automated reading. The time is recorded by hand.

---

## [1.62.0] - 2026-09-14

### Added

- **A second timing operator's calendar:** discovery can now read 32 races in the Rhineland, each one linking the race's own site, and all of them already resolve to a results platform the app imports. It stays off until you enable it.

---

## [1.61.0] - 2026-09-14

### Changed

- **Marking an entry as done now asks what it cost:** only when the catalog has no fee, and never blocking. No calendar publishes fees, so whoever paid is the only source. The currency is a list now, so a price is not lost over three letters.

---

## [1.60.0] - 2026-09-14

### Fixed

- **The official placing is no longer recomputed:** when a RaceResult event spelled its overall rank column `GesPl.p`, the import did not recognise it and re-ranked the field by sorting times. The number came out close but wrong, with nothing to give it away.
- **A page that only embeds RaceResult is now recognised:** the address a runner copies carries no fragment at all, and the import refused it. The page is now read, and the event comes from the embed itself.

---

## [1.59.0] - 2026-09-14

### Added

- **A race now celebrates what it changed:** saving a result brings up a panel with confetti for a new personal best, a yearly goal completed, a performance goal met, a first at a distance, a course best and round numbers, instead of the plain result saved notice. What the race marked stays on its page for good, even after something beats it, and anyone who prefers less movement gets no confetti.

### Changed

- **A personal best is read from the time, not from the rounded pace:** two races both printing 5:20 could be three seconds apart, and the tie-break differed between the dashboard, the analysis and the goals. All three now follow the same rule.

---

## [1.58.0] - 2026-09-13

### Fixed

- **A placing now names the field it was won in:** on RaceResult, an event that publishes an age-group list reported the age group’s size as the field, and left the overall place blank. On mika:timing, events that rank men and women separately reported no field at all. Place and field now always come from the same list.

---

## [1.57.0] - 2026-09-13

### Fixed

- **An imperfect results link no longer blocks the import:** pasting your own result page on RaceResult (`/details1?pid=…`) now works like pasting the list. On mika:timing, events that publish the search with no time and no link are no longer left out: the race is found through the race picker and the time comes from the runner’s own page.

---

## [1.56.0] - 2026-09-13

### Changed

- **A race’s name no longer repeats its town:** "Paarlauf im Rahmen des Sportabzeichentages - Frankfurt (Oder)" shows just the name, with the town beside it as it always was. Only when the town is the whole tail of the name and what remains still names the race.
- **A parkrun no longer offers to be linked to the catalog:** parkruns do not live there, their occurrences come from the parkrun event itself. A race merely named "parkrun", linked to none, still gets the offer.

---

## [1.55.0] - 2026-09-13

### Changed

- **Race names no longer carry the edition:** "33. Graz Marathon" becomes "Graz Marathon", because the race is the same and the number changes every year. A number that is part of the name ("10 Marathon in 10 Tagen") stays.

---

## [1.54.0] - 2026-09-13

### Fixed

- **A race created in the admin area can now be found:** it was saved without the words the search looks for, so it appeared nowhere and the id it held blocked anyone creating it again. The "id already taken" error now links to the race that holds it.

---

## [1.53.0] - 2026-09-11

### Added

- **Say why a race leaves the catalog:** it ended, it is not a running race (triathlon, walk, bike), or it is not a race at all. The reason is always a person’s call, and what is not a race stops being rewritten on every harvest.

---

## [1.52.0] - 2026-09-11

### Fixed

- **Merging two races works again:** when both were missing a field (the registration link, say), the merge failed with "could not save" and left the two as they were.

---

## [1.51.0] - 2026-09-11

### Changed

- **Retired races read as quietly as merged ones:** in the admin area, anything the catalog does not show a runner is quieter than what it does.

---

## [1.50.0] - 2026-09-11

### Changed

- **Merged races are told apart at a glance:** in the admin area, a race that points at another gets a quieter name and background, so it is not mistaken for the one the catalog shows.
- **A fee's currency comes from a list:** with the code and the name in your language, instead of three letters typed by hand, and a fee with no currency can no longer be saved.
- **The time zone is no longer asked for:** it comes from the race's country, and is only picked when the country really has several, from that country's zones alone. It used to be a field repeated on every edition.
- **Dates in the admin area use the app's own calendar:** written the way your language writes them (11/09/2026) rather than the browser's operating system, and a deadline is now a date plus an optional hour, in the race's own clock.
- **The official page opens from the list:** every race in the admin area now carries a 🔗 to its source, so the next season can be checked without opening the form.

---

## [1.49.0] - 2026-09-11

### Fixed

- **Merging two races now keeps what both knew:** the race that stays takes the other's editions, dates, fees, results links, official site and distances. Before it only pointed, and the information went out of sight.

---

## [1.48.0] - 2026-09-10

### Added

- **Join two catalog races by hand:** in the admin area, pick the repeated one, search for the one that stays, and join them. Before, only the duplicates queue could merge races, and some names no rule can compare.
- **Find a race whose name is mostly numbers:** typing "S25" or "S 25" now finds the race, which before only turned up if you searched "Berlin", among hundreds.

---

## [1.47.0] - 2026-09-10

### Fixed

- **A malformed date no longer blanks the page:** a catalog race with an impossible date took the whole event page down. Now it shows a dash, and the admin form uses a date picker that will not take an invalid one.
- **Answering "different races" takes the pair off the list:** the answer was saved but the pair stayed in the panel until the next day, as though the button did nothing.

---

## [1.46.0] - 2026-09-10

### Fixed

- **Different races are no longer merged for sharing a day:** sharing a day, a city and a distance with an already checked race did not make it the same race, yet it was treated as a copy. Now only the names merge two entries, and a race in a neighbouring town (say "Rüdersdorf bei Berlin") no longer counts as being in the big city.

---

## [1.45.0] - 2026-09-10

### Fixed

- **Proposing a race links you to it:** the race you propose now ends up linked to your event, with the day and the results page you already had. Before, the entry was created and you were left out of it.
- **Fewer repeated races:** the same race stored twice for different years is now recognised, and proposing a race the catalog already has under another year links you to that one instead of creating a second. A proposal's town now comes from the end of the location (the city) rather than the start (the park).

---

## [1.44.0] - 2026-09-10

### Added

- **Linking a race to the catalog reports what you already ran:** the editions you ran with a verified result now reach the catalog, not only the ones still to come.
- **Each edition's results in the catalog:** importing a verified result now puts that year's results page in the catalog, with nothing that identifies you (a search for your name, or your row of the table, is left out).
- **The results somebody else already found:** on an event with no results link, the catalog offers that year's page, and using it is your click.

### Changed

- **The time zone comes from a list:** by region, with each one's current time, instead of typing the IANA name.

### Fixed

- **After saying which race it is, the box goes away:** it used to keep asking the same thing until the page was reloaded.

---

## [1.43.0] - 2026-09-10

### Added

- **Sharper search by name:** it uses every word you type and puts the closest matches first, not the soonest races.
- **Proposing a race says what happens next:** the message makes clear that nothing else is needed, and whoever maintains the catalog now sees the proposals waiting.
- **A faster catalog panel:** it shows the races that need work, fifty at a time, instead of downloading all five thousand.
- **The country comes from a list:** names in your own language, instead of the two-letter code.

---

## [1.42.0] - 2026-09-09

### Added

- **Find a race by name:** the search field searches the whole catalog, not only the races already on the page.
- **Say which race it is:** link your event's race to the shared catalog, and the next edition's dates and fee arrive filled in.
- **Propose a race that is missing:** if the race you ran is not in the catalog, you can propose it from the event's page.

---

## [1.41.0] - 2026-09-09

### Added

- **Duplicates in the catalog:** each race in the review queue now carries a link to its source, so the two can be told apart on the pages they came from.
- **Your entry arrives filled in:** planning a race the catalog knows brings its dates, gates and fee already in the form, with the source in plain sight. Until somebody has checked the entry they stay a suggestion, and the date does not count as confirmed.
- **Your official result improves the catalog:** importing a verified result tells the catalog which day the race was run. A year it did not have goes in at once; correcting a date it already had takes two runners agreeing. Only the day travels, never who sent it, and it still fires no reminders.
- **What it cost, for whoever comes next:** marking an entry as done puts the fee you paid into the catalog. None of the calendars we read publish fees, so this only exists because runners say so. Changing a fee the catalog already holds takes two runners agreeing.

---

## [1.40.0] - 2026-09-09

### Added

- **Races near you:** the race search gains a radius, 10 to 250 km, measured from your location or from a town you type.
- **Races listed twice:** when two rows in the search are one race written two ways, you can tell us with one tap.

### Changed

- **Distance search:** races whose calendar only names the distance in a description now answer the filter.

### Fixed

- **The same race listed twice:** far fewer repeats in the list, where sources write the town, the date or the language differently.

---

## [1.39.0] - 2026-09-04

### Changed

- **Find races:** the page now asks for a filter before it shows a list, gains a country search, and brings results a page at a time instead of downloading the whole catalog into the browser.

---

## [1.38.0] - 2026-09-04

### Fixed

- **Races twice in the catalog:** the same race no longer enters twice when two sources name it slightly differently, when one of them publishes no distance, or when the town's name moves around in the name.

---

## [1.37.0] - 2026-09-04

### Added

- **Races in 60 countries:** discovery can now read a worldwide calendar of 2280 races, mostly 5K and 10K, and half marathon calendars for 17 countries. It stays off until you enable them.

---

## [1.36.0] - 2026-09-04

### Fixed

- **Catalog updates:** a source read only in part (a slice at a time, or cut short by the site) is no longer taken for broken, which was blocking its update.

---

## [1.35.0] - 2026-09-03

### Added

- **More short races:** discovery can now read two German calendars full of 5K, 10K and half marathons. It stays off until you enable them.

### Changed

- **The catalog updates a source at a time:** the catalog is updated every day, one source at a time, and a source that is down no longer holds up the others.

### Fixed

- **Self-hosting:** deploying the functions failed after the last dependency update.

---

## [1.34.0] - 2026-09-03

### Added

- **Two new discovery sources:** marathons in 55 countries, and German races with the entry fee. It stays off until you enable them.

---

## [1.33.0] - 2026-09-03

### Added

- **The season's road:** the hero shows your last race, the next one and the target race, each with its countdown.

### Changed

- **Planning is moving:** scheduling a race from the bucket list puts it on the calendar and takes it off the list.
- **Season warnings:** they stay on the race's page and no longer vanish once you schedule it.

### Fixed

- **Distances with decimals:** 42.195 km can be saved now.
- **Races twice in the catalog:** the same race no longer shows up twice under different names.

---

## [1.32.0] - 2026-09-02

### Added

- **Entry planning:** the bucket list is now grouped by what is left to do, and each race can carry its entry: when it opens, when it closes, the draw, and the deadline to secure a place you have already won. With a reminder before each deadline.
- **A season around the anchor races:** mark the races that fix your year and the app suggests where a tune-up fits, warns when something lands in the taper, and shows the time it expects for the anchor.
- **When it fails:** a race that passes with no result asks what happened instead of saying you missed it, a DNF counts as a race started, and one button creates next season's attempt.
- **Find races:** a new page searches the catalog by month, distance and place, and adds a race to your list in one click. It includes the parkruns near you.
- **Getting started:** a new account's dashboard opens with four steps, each saying what the app does with it. It goes when they are done.

### Changed

- **Accounts waiting for approval:** sign-in is now refused with the reason, instead of letting the account into an app where nothing could be written.
- **Self-hosting:** two new sources for the catalog, off until you turn them on. See [`docs/discovery-sources.md`](docs/discovery-sources.md).

---

## [1.31.0] - 2026-09-01

### Added

- **More distances:** 1500 m, 3000 m, 15K, 10 miles, 30K, 50K, 50 miles, 100K and 100 miles join the original four. The new ones arrive switched off: turn on the ones you race in Settings, Disciplines.
- **Race catalog:** the instance now knows races by name, with how you get in and each edition's deadlines and draw. This is what will warn you before entries close.
- **Admin area:** approving, blocking and deleting accounts, and keeping the catalog, inside the app rather than in the console.

### Changed

- **Picking disciplines got compact:** the 13 distances are now pills grouped into track, road and ultra.
- **Self-hosting:** the admin is now a user marked as one, instead of an environment variable. See [`docs/self-hosting.md`](docs/self-hosting.md).

---

## [1.30.0] - 2026-09-01

### Removed

- **Excel import and export are gone:** the full `.zip` backup covers the same ground more precisely, photos, videos, activity files and goals included, and restores everything under the same identifiers. A spreadsheet is no longer a way in.

---

## [1.29.1] - 2026-08-31

### Changed

- **A more readable pacing chart:** losing up to 10 s/km in the second half now counts as holding pace, and red is kept for fades past 25 s/km. The chart appears from a single race instead of requiring five.
- **Counts read properly in the singular:** "1 time here" instead of "1 times here", wherever a course's run count is shown.

---

## [1.29.0] - 2026-08-31

### Added

- **A time to beat on races ahead:** open an upcoming race on a course you have run before and see your best pace there, and what it gives over this distance.
- **The time to beat on the home page too:** the next race card shows the time and pace to beat when you have run that course before.

### Changed

- **Upload only once the race has happened:** the GPX and TCX upload no longer appears on future races, so a training run on the course does not end up filed as the race.

---

## [1.28.0] - 2026-08-30

### Added

- **Pacing:** the analysis page shows, race by race, how much you slowed in the second half, and how often it happens.
- **Same course comparison:** open a race you have run before and see where it sits among all your runnings of it, with the best and the previous one.

---

## [1.27.0] - 2026-08-30

### Added

- **Activity files on events:** upload the GPX or TCX from your watch and the race gains kilometre splits, the route on a map, pace, elevation and heart rate. The measured time is offered to fill the result in, never imposed: the official timing is the one that counts.

---

## [1.26.1] - 2026-08-30

### Changed

- **Documents follow the app language:** the changelog, results notice and privacy policy lost their own language picker, and Arabic now reads right to left.

---

## [1.26.0] - 2026-08-30

### Added

- **Pick the disciplines you want to see:** in Settings > App you can turn off the distances you do not race. They stop showing in filters and pickers. Nothing you already have is lost.

---

## [1.25.0] - 2026-08-30

### Changed

- **The Results page is now the Analysis page:** it answers three questions, with a selector at the top: how this season is going, how it compares with the ones before, and what has changed over all time. Old links still work.
- **Form curve:** every race is converted to its equivalent at your most-raced distance, so a 5K and a marathon compare on one line. With predicted times for the other distances.
- **New readings:** placing in the field over time, how each record fell, cumulative km against previous seasons, the strong and weak months of the year, and a consistency grid by races or by kilometres.
- **Average pace for the year fixed:** it is now weighted by distance. A 5K used to count as much as a marathon.

---

## [1.24.0] - 2026-08-29

### Changed

- **A race result is edited on the event page:** the separate page is gone. Time, position and the official results link now sit together, next to the numbers.

---

## [1.23.0] - 2026-08-29

### Changed

- **The parkrun catalog now updates itself:** new parkrun events show up within days of opening, without waiting for an app release.

---

## [1.22.0] - 2026-08-28

### Changed

- **The rest of the app catches up with Home:** goals are grouped by state, the filters look the same on every page, and an event page now carries the race name as its title.

---

## [1.21.0] - 2026-08-28

### Changed

- **Home redesigned:** the next event up front with its countdown, the year's numbers in a single strip, now including kilometres covered, and a place of its own for achievements, goals still open, and personal bests.

---

## [1.20.0] - 2026-08-25

### Added

- **New language, Arabic (first version):** the app is now available in Arabic, with a right to left layout. Pick it in Settings → Language.

---

## [1.19.0] - 2026-08-25

### Added

- **New language, French:** the app, release notes, official-results notice, privacy policy, account emails and push reminders are now available in French. Pick it in Settings → Language.

---

## [1.18.0] - 2026-08-17

### Changed

- **Official results:** automatic Parkrun result search temporarily disabled: Parkrun blocks automated requests from known cloud infrastructure. Results can still be recorded manually.

---

## [1.17.0] - 2026-08-13

### Added

- **New emoji picker:** search and access every Unicode emoji, replacing the previous curated list.

---

## [1.16.1] - 2026-08-13

### Added

- **More emojis:** added over 50 new options to the event and goal emoji picker: animals, flowers, food, Halloween-themed picks, and flags from Asia, South America, and North Africa.

### Fixed

- **Event status:** an event with an official result can no longer end up marked as “Missed.” There was a race condition between the automatic transition to “Missed” and saving the result.

---

## [1.16.0] - 2026-08-03

### Added

- **Backup with photos and videos:** the backup `.zip` now includes the photo and video files, not just their metadata. You can turn the option off before exporting; above 300 MB the backup keeps data only.
- **Restoring photos and videos:** with the files in the `.zip`, photos and videos come back even in “replace everything” mode and when restoring into another account. Previously they survived only if still in the account.

---

## [1.15.1] - 2026-08-03

### Fixed

- **Security:** a pending or rejected account can no longer give itself full access.
- **Settings:** on instances with account approval enabled, saving language, notification preferences and results profile works again. Every write was denied once the account had been approved.

---

## [1.15.0] - 2026-08-03

### Added

- **Full backup:** export all your data as JSON inside a `.zip` file (events, goals, performance goals, bucket list, photo and video metadata, preferences and shares).
- **Restore backup:** upload a backup `.zip` to put your data back, keeping the original document ids. You can merge into your current data or replace everything.

---

## [1.14.2] - 2026-08-02

### Fixed

- **Official results:** MikaTiming picks the correct overall rank column (layout varies by event).
- **Official results:** MikaTiming finisher count without sex filter (list header).

---

## [1.14.1] - 2026-08-01

### Fixed

- **Official results:** MikaTiming connector (multi-event search and Netto times); more memory for lookup callable.

---

## [1.14.0] - 2026-07-30

### Added

- **Self-hosting:** you can require new accounts to be approved by hand: an email to the admin to approve or reject, and a notice to the user. Optional. See [`docs/self-hosting.md`](docs/self-hosting.md).

---

## [1.13.0] - 2026-07-23

### Added

- **Memories:** lightbox to view photos and videos fullscreen, with arrow, keyboard, and mobile swipe navigation.

---

## [1.12.1] - 2026-07-23

### Changed

- Several performance and security updates.

---

## [1.12.0] - 2026-07-23

### Added

- **Languages:** Spanish (es-ES) and German support: UI, emoji labels, push reminders, changelog, privacy policy, and official results notice.
- **Settings:** language selector with Português, English, Español, and Deutsch.

### Changed

- Missing translation keys fall back to English; browser language detection for `pt`, `en`, `es`, and `de`.

---

## [1.11.0] - 2026-07-20

### Added

- **Privacy:** link to the privacy policy in the app footer.

### Fixed

- **Privacy:** page uses the same layout, theme, and navigation as the rest of the app.

### Changed

- Minimum interval between official result lookups increased to **10 seconds**, with countdown on the button.

---

## [1.10.0] - 2026-07-19

### Added

- **Parkrun:** dedicated event creation with global catalog search, favourites, and country in autocomplete.
- **Parkrun:** favourites in the results profile; chosen events are added to favourites automatically.

### Fixed

- **Parkrun:** changing the autocomplete selection updates location and map again.

### Changed

- **Parkrun:** more reliable result import with the correct event stored on the record.

---

## [1.9.2] - 2026-07-19

### Added

- **Google Analytics** integrated into the app.

### Fixed

- **Parkrun:** official result import failing in some environments.

### Changed

- Minimum interval between official result lookups reduced to **5 seconds**, with countdown on the button.

---

## [1.9.1] - 2026-07-19

### Fixed

- **MyRaceResult:** lookup in events with multiple categories (e.g. Mittsommerlauf).

### Changed

- **MyRaceResult:** support for results embedded in event pages and overall ranking by time.

---

## [1.9.0] - 2026-07-09

### Added

- **mika:timing** connector (Chicago Marathon, London Marathon, etc.).

### Changed

- Supported platforms list in Settings sorted alphabetically.

---

## [1.8.0] - 2026-07-09

### Added

- **Tímataka** connector (timataka.net / timataka.is).

---

## [1.7.0] - 2026-07-09

### Added

- **Push notifications** with reminders even when the app is closed.

### Changed

- Notification settings updated; app language used for remote messages.

---

## [1.6.0] - 2026-07-08

### Added

- **Wiclax** connector (live race results).

---

## [1.5.1] - 2026-07-08

### Added

- **What's New** page (`/novidades`) with version history; link from footer version.
- **Seven Panda Labs** credit in the footer.

---

## [1.5.0] - 2026-07-08

### Added

- **VCRunning** connector (Valencia Ciudad del Running).
- Versioned changelog in Portuguese and English.

---

## [1.4.0] - 2026-07-08

### Added

- UX improvements for **Parkrun** events: Parkrunner ID setup and simplified form.

---

## [1.3.2] - 2026-07-07

### Added

- More loading messages in the brand voice.

---

## [1.3.1] - 2026-07-07

### Added

- Brand voice in empty states, loading, and success messages.
- Voice documentation at [docs/voice.md](docs/voice.md).

### Fixed

- Personal record tie-breaking by time when pace and distance match.

---

## [1.3.0] - 2026-07-06

### Changed

- Settings reorganised; sharing moved into Settings.

---

## [1.2.0] - 2026-07-06

### Added

- Shared results on the Results page, with separators per friend.

### Fixed

- Dates in shared data received from friends.

---

## [1.1.0] - 2026-07-06

### Added

- Shared views in Events and Goals sections.

---

## [1.0.2] - 2026-07-06

### Fixed

- Owner email visible on received sharing invitations.

---

## [1.0.1] - 2026-07-06

### Added

- Editing sharing permissions and pending invitation notice.

---

## [1.0.0] - 2026-07-06

Milestone: data sharing between friends.

### Added

- Sharing events, goals, and results with email invitations.
- Configurable permissions per area (events, goals, results, performance targets).

---

## [0.22.0] - 2026-07-06

### Added

- Foundation for sharing with friends.

---

## [0.21.0] - 2026-07-06

### Added

- Dark mode with system preference.

---

## [0.20.0] - 2026-07-05

### Added

- **Ultimate Sport Service** connector.

---

## [0.19.1] - 2026-07-05

### Fixed

- **RunCzech:** chip time instead of gun time.

---

## [0.19.0] - 2026-07-05

### Added

- **RunCzech** connector.

---

## [0.18.1] - 2026-07-05

### Fixed

- **NSF Berlin:** tables with variable columns.

---

## [0.18.0] - 2026-07-05

### Added

- **NSF Berlin** connector.

---

## [0.17.2] - 2026-07-05

### Fixed

- **ZielZeit:** net time instead of gross time.

---

## [0.17.1] - 2026-07-05

### Fixed

- **EQ Timing:** overall position based on stage finishers.

---

## [0.17.0] - 2026-07-05

### Added

- **EQ Timing** connector.

---

## [0.16.0] - 2026-07-05

### Added

- **ZielZeit** connector.

---

## [0.15.0] - 2026-07-05

### Added

- **Strassenlauf.org** connector.

---

## [0.14.1] - 2026-07-05

### Fixed

- **MyRacePartner:** more robust lookup.

---

## [0.14.0] - 2026-07-05

### Added

- **MyRacePartner** connector.

---

## [0.13.1] - 2026-07-05

### Fixed

- **MaxFunSports:** finisher count in embedded URLs.

---

## [0.13.0] - 2026-07-05

### Added

- **MaxFunSports** connector.

---

## [0.12.2] - 2026-07-05

### Fixed

- **SCC Events:** SCC Läufer competition included in lookup.

---

## [0.12.1] - 2026-07-05

### Fixed

- **SCC Events:** broader URL detection.

---

## [0.12.0] - 2026-07-05

### Added

- **SCC Events** connector.

---

## [0.11.1] - 2026-07-05

### Fixed

- **MyRaceResult:** lookup in categories excluded from the main list.

---

## [0.11.0] - 2026-07-05

### Added

- **MyRaceResult** connector.

### Fixed

- **Parkrun**, **Davengo**, and **Sporthive:** various result import improvements.

---

## [0.9.0] - 2026-07-04

Milestone: automatic official results.

### Added

- Official result import for **Sporthive**, **Davengo**, and **Parkrun**.
- Verified results icon in lists.
- Finisher count for Parkrun and Davengo.

### Fixed

- Parkrun results table parsing.

---

## [0.8.0] - 2026-07-04

### Fixed

- Map no longer overlays dialogs.

### Changed

- Main navigation item order.

---

## [0.7.0] - 2026-07-04

### Added

- Map on bucket list and Results page.
- More emojis available.

---

## [0.6.2] - 2026-07-02

### Added

- State legend in map view.

---

## [0.6.1] - 2026-07-02

### Fixed

- Dependency security alerts.

---

## [0.6.0] - 2026-06-30

### Added

- Location autocomplete and map on bucket list.

---

## [0.5.4] - 2026-06-30

### Added

- Map preview in event form.

---

## [0.5.3] - 2026-06-30

### Fixed

- Marker clustering on the map.

---

## [0.5.2] - 2026-06-30

### Fixed

- Redundant location search after selecting a suggestion.

---

## [0.5.1] - 2026-06-30

### Added

- Location autocomplete and geocoding.
- Map on event detail.

---

## [0.5.0] - 2026-06-29

Milestone: map mode.

### Added

- Coordinates on events and **List | Map** view on Events page.
- Panel for events without a set location.

---

## [0.4.3] - 2026-06-29

### Fixed

- Event photos and videos in production.

---

## [0.4.2] - 2026-06-29

### Fixed

- Photo and video access permissions.

---

## [0.4.1] - 2026-06-29

### Fixed

- Memory (photo/video) loading.

---

## [0.4.0] - 2026-06-29

Milestone: event photos and videos.

### Added

- Photo and video upload on event detail (up to 10 files; video max 2 min).
- Memory gallery per event.

### Fixed

- Gallery updates immediately after upload.

---

## [0.2.0] - 2026-06-28

Milestone: internationalisation.

### Added

- **pt-PT** and **en-GB** support.
- Multiple disciplines per bucket list item.
- Event detail view and recovery to bucket list.
- Failed, Surpassed, and Destroyed states for performance targets.
- Days until next event on Dashboard.
- App version in footer.

### Changed

- «Scheduled» state renamed to «Planned».
- Sign out moved to Settings.

### Fixed

- Contrast and state filters; legend and table in Results.
- Data isolation per user.

---

## [0.1.0] - 2026-06-26

Milestone: **MVP**, Excel spreadsheet replacement as PWA.

### Added

- Web app with Google login, cloud data, and offline mode.
- Event, result, and annual goal management; dashboard with charts.
- Excel import and export.
- **Bucket list**, calendar, performance targets, and local notifications.
- Settings, personal records, and PWA installation.

### Fixed

- Login and offline sync across multiple tabs.
