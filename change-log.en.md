# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.44.0] - 2026-09-10

### Added

- **Linking a race to the catalog reports what you already ran:** the editions you ran with a verified result now reach the catalog, not only the ones still to come.
- **Each edition's results in the catalog:** importing a verified result now puts that year's results page in the catalog, with nothing that identifies you (a search for your name, or your row of the table, is left out).

### Changed

- **The time zone comes from a list:** by region, with each one's current time, instead of typing the IANA name.

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
