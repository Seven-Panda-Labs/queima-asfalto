# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md)

---

## [1.13.0] — 2026-07-23

### Added

- **Memories:** lightbox to view photos and videos fullscreen, with arrow, keyboard, and mobile swipe navigation.

---

## [1.12.1] — 2026-07-23

### Changed

- Several performance and security updates.

---

## [1.12.0] — 2026-07-23

### Added

- **Languages:** Spanish (es-ES) and German support — UI, emoji labels, push reminders, changelog, privacy policy, and official results notice.
- **Settings:** language selector with Português, English, Español, and Deutsch.

### Changed

- Missing translation keys fall back to English; browser language detection for `pt`, `en`, `es`, and `de`.

---

## [1.11.0] — 2026-07-20

### Added

- **Privacy:** link to the privacy policy in the app footer.

### Fixed

- **Privacy:** page uses the same layout, theme, and navigation as the rest of the app.

### Changed

- Minimum interval between official result lookups increased to **10 seconds**, with countdown on the button.

---

## [1.10.0] — 2026-07-19

### Added

- **Parkrun:** dedicated event creation with global catalog search, favourites, and country in autocomplete.
- **Parkrun:** favourites in the results profile; chosen events are added to favourites automatically.

### Fixed

- **Parkrun:** changing the autocomplete selection updates location and map again.

### Changed

- **Parkrun:** more reliable result import with the correct event stored on the record.

---

## [1.9.2] — 2026-07-19

### Added

- **Google Analytics** integrated into the app.

### Fixed

- **Parkrun:** official result import failing in some environments.

### Changed

- Minimum interval between official result lookups reduced to **5 seconds**, with countdown on the button.

---

## [1.9.1] — 2026-07-19

### Fixed

- **MyRaceResult:** lookup in events with multiple categories (e.g. Mittsommerlauf).

### Changed

- **MyRaceResult:** support for results embedded in event pages and overall ranking by time.

---

## [1.9.0] — 2026-07-09

### Added

- **mika:timing** connector (Chicago Marathon, London Marathon, etc.).

### Changed

- Supported platforms list in Settings sorted alphabetically.

---

## [1.8.0] — 2026-07-09

### Added

- **Tímataka** connector (timataka.net / timataka.is).

---

## [1.7.0] — 2026-07-09

### Added

- **Push notifications** with reminders even when the app is closed.

### Changed

- Notification settings updated; app language used for remote messages.

---

## [1.6.0] — 2026-07-08

### Added

- **Wiclax** connector (live race results).

---

## [1.5.1] — 2026-07-08

### Added

- **What's New** page (`/novidades`) with version history; link from footer version.
- **Seven Panda Labs** credit in the footer.

---

## [1.5.0] — 2026-07-08

### Added

- **VCRunning** connector (Valencia Ciudad del Running).
- Versioned changelog in Portuguese and English.

---

## [1.4.0] — 2026-07-08

### Added

- UX improvements for **Parkrun** events: Parkrunner ID setup and simplified form.

---

## [1.3.2] — 2026-07-07

### Added

- More loading messages in the brand voice.

---

## [1.3.1] — 2026-07-07

### Added

- Brand voice in empty states, loading, and success messages.
- Voice documentation at [docs/voice.md](docs/voice.md).

### Fixed

- Personal record tie-breaking by time when pace and distance match.

---

## [1.3.0] — 2026-07-06

### Changed

- Settings reorganised; sharing moved into Settings.

---

## [1.2.0] — 2026-07-06

### Added

- Shared results on the Results page, with separators per friend.

### Fixed

- Dates in shared data received from friends.

---

## [1.1.0] — 2026-07-06

### Added

- Shared views in Events and Goals sections.

---

## [1.0.2] — 2026-07-06

### Fixed

- Owner email visible on received sharing invitations.

---

## [1.0.1] — 2026-07-06

### Added

- Editing sharing permissions and pending invitation notice.

---

## [1.0.0] — 2026-07-06

Milestone: data sharing between friends.

### Added

- Sharing events, goals, and results with email invitations.
- Configurable permissions per area (events, goals, results, performance targets).

---

## [0.22.0] — 2026-07-06

### Added

- Foundation for sharing with friends.

---

## [0.21.0] — 2026-07-06

### Added

- Dark mode with system preference.

---

## [0.20.0] — 2026-07-05

### Added

- **Ultimate Sport Service** connector.

---

## [0.19.1] — 2026-07-05

### Fixed

- **RunCzech:** chip time instead of gun time.

---

## [0.19.0] — 2026-07-05

### Added

- **RunCzech** connector.

---

## [0.18.1] — 2026-07-05

### Fixed

- **NSF Berlin:** tables with variable columns.

---

## [0.18.0] — 2026-07-05

### Added

- **NSF Berlin** connector.

---

## [0.17.2] — 2026-07-05

### Fixed

- **ZielZeit:** net time instead of gross time.

---

## [0.17.1] — 2026-07-05

### Fixed

- **EQ Timing:** overall position based on stage finishers.

---

## [0.17.0] — 2026-07-05

### Added

- **EQ Timing** connector.

---

## [0.16.0] — 2026-07-05

### Added

- **ZielZeit** connector.

---

## [0.15.0] — 2026-07-05

### Added

- **Strassenlauf.org** connector.

---

## [0.14.1] — 2026-07-05

### Fixed

- **MyRacePartner:** more robust lookup.

---

## [0.14.0] — 2026-07-05

### Added

- **MyRacePartner** connector.

---

## [0.13.1] — 2026-07-05

### Fixed

- **MaxFunSports:** finisher count in embedded URLs.

---

## [0.13.0] — 2026-07-05

### Added

- **MaxFunSports** connector.

---

## [0.12.2] — 2026-07-05

### Fixed

- **SCC Events:** SCC Läufer competition included in lookup.

---

## [0.12.1] — 2026-07-05

### Fixed

- **SCC Events:** broader URL detection.

---

## [0.12.0] — 2026-07-05

### Added

- **SCC Events** connector.

---

## [0.11.1] — 2026-07-05

### Fixed

- **MyRaceResult:** lookup in categories excluded from the main list.

---

## [0.11.0] — 2026-07-05

### Added

- **MyRaceResult** connector.

### Fixed

- **Parkrun**, **Davengo**, and **Sporthive:** various result import improvements.

---

## [0.9.0] — 2026-07-04

Milestone: automatic official results.

### Added

- Official result import for **Sporthive**, **Davengo**, and **Parkrun**.
- Verified results icon in lists.
- Finisher count for Parkrun and Davengo.

### Fixed

- Parkrun results table parsing.

---

## [0.8.0] — 2026-07-04

### Fixed

- Map no longer overlays dialogs.

### Changed

- Main navigation item order.

---

## [0.7.0] — 2026-07-04

### Added

- Map on bucket list and Results page.
- More emojis available.

---

## [0.6.2] — 2026-07-02

### Added

- State legend in map view.

---

## [0.6.1] — 2026-07-02

### Fixed

- Dependency security alerts.

---

## [0.6.0] — 2026-06-30

### Added

- Location autocomplete and map on bucket list.

---

## [0.5.4] — 2026-06-30

### Added

- Map preview in event form.

---

## [0.5.3] — 2026-06-30

### Fixed

- Marker clustering on the map.

---

## [0.5.2] — 2026-06-30

### Fixed

- Redundant location search after selecting a suggestion.

---

## [0.5.1] — 2026-06-30

### Added

- Location autocomplete and geocoding.
- Map on event detail.

---

## [0.5.0] — 2026-06-29

Milestone: map mode.

### Added

- Coordinates on events and **List | Map** view on Events page.
- Panel for events without a set location.

---

## [0.4.3] — 2026-06-29

### Fixed

- Event photos and videos in production.

---

## [0.4.2] — 2026-06-29

### Fixed

- Photo and video access permissions.

---

## [0.4.1] — 2026-06-29

### Fixed

- Memory (photo/video) loading.

---

## [0.4.0] — 2026-06-29

Milestone: event photos and videos.

### Added

- Photo and video upload on event detail (up to 10 files; video max 2 min).
- Memory gallery per event.

### Fixed

- Gallery updates immediately after upload.

---

## [0.2.0] — 2026-06-28

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

## [0.1.0] — 2026-06-26

Milestone: **MVP** — Excel spreadsheet replacement as PWA.

### Added

- Web app with Google login, cloud data, and offline mode.
- Event, result, and annual goal management; dashboard with charts.
- Excel import and export.
- **Bucket list**, calendar, performance targets, and local notifications.
- Settings, personal records, and PWA installation.

### Fixed

- Login and offline sync across multiple tabs.
