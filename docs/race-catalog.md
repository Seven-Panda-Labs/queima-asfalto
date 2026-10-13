# Race catalog

The races the app knows by name. It lives in the instance, in the Firestore `raceCatalog` collection, one document per race; types and pure functions are in [`shared/raceCatalog/`](../shared/raceCatalog/). It prefills races and, once dates are reviewed, feeds registration deadlines.

There is no catalog in the repo. Each instance keeps its own, edited in the admin area. An empty catalog is a normal state. To bootstrap, `npm run seed:race-catalog -- --confirm` writes 14 reviewed races from [`scripts/data/raceCatalogSeed.ts`](../scripts/data/raceCatalogSeed.ts) and never overwrites (`--dry-run` to preview).

## Producers

| `producer` | Written by |
|---|---|
| `curated` | the admin area (default for entries older than the field) |
| `harvest` | the daily job, see [discovery-sources.md](./discovery-sources.md) |
| `runner` | a runner's proposal (`raceCatalogProposals`), applied by the daily job |

One collection, so "what needs a human" is one query and a harvest can see what a person checked. One document per race, so concurrent edits do not overwrite each other.

## The review rule

- **`unreviewed`**: assembled from listings or runners. It may **suggest** (prefill a field the runner sees and can correct), never **assert** (no deadline reminder, no countdown).
- **`reviewed`**: checked against the official source.

`canAssertDates()` enforces it. A wrong registration date is worse than none.

## Editions

An edition is one year of an annual race: `raceDate`, the gates (`registrationOpensAt`, `registrationClosesAt`, `lotteryDrawAt`), `typicalFee` with `feeCurrency`, and `resultsUrl`. An event links to its edition by the year of its date; there is no pointer field.

**A recurring event has no editions.** A parkrun's occurrences follow from a rule and its details from its slug, so parkruns are not in this catalog: the two models diverge. Calendars that list parkrun venues are dropped at harvest and retired with reason `parkrun` (`npm run retire:parkruns`).

## What runners give back

Only facts about the race, never the runner: no time, pace, notes or whether they got in. One report per (race, year, user) in `raceCatalogEditionReports`, applied by the daily job (`applyEditionReports`):

- **Day**: from a verified result (`resultsVerified` only comes from the official import). A year the catalog lacks goes in on one runner; a different day needs two runners agreeing and is marked `runnerConfirmedAt`, which the harvest then keeps. Linking an event to the catalog also reports past verified editions (`npm run backfill:edition-reports` for links made before).
- **Results page**: travels with the day, through `shareableResultsUrl`, which drops anything naming the runner. The result editor offers it back to other runners for that year.
- **Fee**: written when an entry becomes `registered`. One runner fills a missing fee; changing one needs two agreeing on amount and currency.
- **Gates**: not built; they need a person ([#328](https://github.com/Seven-Panda-Labs/queima-asfalto/issues/328)).

A runner can **propose** a race the catalog lacks from the event page. The proposal carries their race and results page; the job creates an entry (or answers with an existing one through the duplicate rule) and links the runner's race to it.

## Merging

A merge points the copy at the survivor (`duplicateOfCatalogRaceId`) and folds what the copy knew into it: editions with their days, gates, fee and results page, plus official site, entry method, typical month, distances and name words. The survivor wins every conflict. Entries that were copies of the dropped one are re-pointed at the survivor, so there are no chains. Admins can also join two entries by hand from the catalog search. `npm run fold:catalog-copies` folds and flattens merges made before folding existed.

Duplicate rules: see [discovery-sources.md](./discovery-sources.md#duplicates).

## URLs

`officialUrl` is the organiser's site; `sourceUrl` is the page the race was read from. Equal values mean the organiser link is not resolved yet. `readOrganiserLink` reads only marked anchors (running.life `data-out="website"`, runme.de `class="referer-link"`). The daily job resolves 100 a run; `npm run resolve:organiser-links -- --confirm [--limit N]` clears a backlog.

## Stored names

`nameWithoutEdition` ([`shared/eventDiscovery/identity.ts`](../shared/eventDiscovery/identity.ts)) drops:

- a leading ordinal with a dot or bracket, Arabic or Roman ("33. Graz Marathon", "XXXIV. ..."),
- a leading Portuguese ordinal ("3ª", "5.º"),
- a trailing year near now ("Hermannslauf 2027", but not "Mattmark Memorial 1965").

It keeps a bare leading number ("10 Marathon in 10 Tagen") and English or German suffixes ("1st Day 5K", "38er Run") on purpose. `nameWithoutTown` drops a trailing town when it is the whole appendix after a spaced separator and what is left still names a race.

Sponsors are never stripped automatically: `NOISE_WORDS` is used for comparing names only. `name` should be the race without its sponsor ("Berlin Marathon"), fixed by hand.

`npm run clean:catalog-names -- --dry-run`, then `--confirm`, applies both to stored names.

## Retiring

Nothing is deleted: `races.catalogRaceId` may point at an entry, and the harvest would write it again. `retired: true` hides an entry from discovery, name search, the duplicate rule and the admin queue. `retiredReason`:

| Reason | Meaning | Harvest |
|---|---|---|
| `over` | race no longer held | keeps writing new editions |
| `other_sport` | triathlon, walk or ride read as a race | tombstone, never written again |
| `not_a_race` | expo or listing page | tombstone |
| `parkrun` | parkrun venue listed as an event | tombstone |

The admin panel lists likely other sports (`readsAsAnotherSport`) for a person to decide; "yes, it is a race" is stored as `notAnotherSport` so it is not asked again. Never a rule: many running races have a walk beside them. `npm run set:retired-reason -- --confirm --set <id>=<reason>` fills reasons on old retirements.

## Gates and timezones

A gate is a day, or an instant when the organiser publishes an hour. The form edits a day and an hour in the race's zone (`splitGate`/`joinGate`); without a zone, no hour is offered.

The timezone belongs to the race (`RaceCatalogEntry.timezone`), stored only when the country cannot answer (`timezoneFor` returns a zone for single-zone countries). `raceTimezone` reads the legacy edition field, then the race, then the country. `npm run lift:catalog-timezones` moved old edition zones onto the race.

## Reviewing an entry

`npm run catalog:review` lists entries never checked and entries checked but out of editions, ordered by typical month. Per entry, one at a time:

1. Open the `officialUrl`.
2. Confirm name, city, country, disciplines, entry method and typical month.
3. Add editions when dates are published. `typicalFee` is what a visiting runner pays at entry level; other prices go in the note.
4. Set `review: 'reviewed'` and update `source` to say where it was confirmed.

What belongs: races with a gate (lottery, early sell-out, qualifying time). A race open until the day before has nothing to warn about.

**The `id` never changes.** `races.catalogRaceId` references it; fix the `name` instead.

## Maintenance scripts

All take `--dry-run` and `--confirm`, and need credentials (or `FIRESTORE_EMULATOR_HOST` and `GCLOUD_PROJECT`).

| Script | Does |
|---|---|
| `backfill:catalog-dates` | fills `nextRaceDate` and the country list |
| `backfill:catalog-name-tokens` | fills `nameTokens` for name search |
| `backfill:catalog-duplicates` | applies the current duplicate rule to stored entries |
| `fix:catalog-days` | repairs malformed stored days |
