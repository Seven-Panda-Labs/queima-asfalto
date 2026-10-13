# Discovery sources

How the app finds new races for the [catalog](./race-catalog.md), and what it takes to add a source.

## What counts as a source

A site that publishes upcoming races in a shape a parser can read. Two checks, in order:

1. **Permission.** `robots.txt` allows the path and the terms do not forbid automated reading. A bot challenge (Cloudflare, Turnstile) is a no.
2. **Data shape.** One of three `kind`s ([`shared/eventDiscovery/sources.ts`](../shared/eventDiscovery/sources.ts)):

   | `kind` | Shape | Cost per run |
   |---|---|---|
   | `sitemap` | a page per event, read by a `PAGE_READERS` entry (`schema-org`, `marathon-de`) | one fetch per event |
   | `search` | a JSON calendar, plus a page per event | one fetch per event |
   | `listing` | the calendar on one or a few pages, read by a `LISTING_READERS` entry | one fetch per page |

Anything that needs a browser to run before the data exists (Vaadin, Livewire, a registration widget) is not a source.

We do not write one connector per calendar. Most list the same races, so pick the cheapest to read and deduplicate.

## Sources

Defined in [`functions/src/discovery/sources.ts`](../functions/src/discovery/sources.ts). None runs unless `DISCOVERY_SOURCES` in `functions/.env` names it (see [`self-hosting.md`](./self-hosting.md)).

| id | `kind` | Reader | Notes |
|---|---|---|---|
| `acorrer.pt` | `sitemap` | `schema-org` | Portugal |
| `davengo.com` | `search` | own | Germany; distances from the starter list |
| `scc-events.com` | `listing` | `scc-events` | Berlin timing operator |
| `cologne-timing.de` | `listing` | `cologne-timing` | Rhineland timing operator; no distances, but events resolve to RaceResult and link the organiser |
| `running.life` | `listing` | `schema-org` | Germany, 25 pages of 20; `delayMs: 3000` (429 at default pace) |
| `running.life/half-marathons` | `listing` | `schema-org` | half marathons, 17 country calendars, 6 pages each |
| `runme.de` | `listing` | `runme` | worldwide, one page per month (URLs roll forward) |
| `kilometerliebe.de` | `listing` | `kilometerliebe` | Germany, whole year on one page; only `lauf` and `trail` |
| `marathon.de` | `sitemap` | `marathon-de` | only source with a fee; no `lastmod`, so `rotatePages` reads 150 a week |
| `planet-marathon.de` | `listing` | `planet-marathon` | marathons worldwide; HTTP only, ISO-8859-1, asserts 42.195 km |

Reader quirks (distance parsing from prose, country spellings, postcodes) are documented in each reader in `shared/eventDiscovery/` and pinned by its tests.

## Sources evaluated and not read

| Source | Status | Reason |
|---|---|---|
| raceraves | blocked | refuses automated reading |
| hdsports | blocked | refuses automated reading |
| goandrace | not added | readable, but no Portuguese coverage |
| runme.de fees | not available | fee, deadline and location are paywalled; the calendar itself is read |
| parkrun | not a source | refuses bots by user agent; venues come from the parkrun catalog, and listings of them are dropped (`isParkrunListing`) |

## The daily job

`harvestRaceCatalog` ([`functions/src/discovery/harvest.ts`](../functions/src/discovery/harvest.ts)) runs `every day 05:00` with a 900 s timeout. It reads **one source per run**, picked by the day (`sourceForRun`), so each enabled source is read every N days. With no source enabled it returns before doing anything, including the steps below.

In order, each step failing on its own without stopping the rest:

1. `applyPendingProposals`: runner proposals (`raceCatalogProposals`) become entries.
2. `applyPendingEditionReports`: runner reports (`raceCatalogEditionReports`) update editions.
3. `refreshDiscoveryCatalog`: harvest the day's source (below).
4. `resolveOrganiserLinks`: replace a listing URL with the organiser's site, up to 100 pages a run.
5. `geocodeCatalogRaces`: Geoapify lookups for entries without coordinates, up to 300 a run. Skipped without `GEOAPIFY_API_KEY`.
6. `writeDuplicateQueue`: pairs for a person to decide, written to `raceCatalogHarvest/duplicates`.

## The harvest

1. Fetch the source with its reader, with a delay between pages (`delayMs` per source). A page refused midway keeps what was read and marks the run `partial`.
2. Drop past and cancelled races, races with no readable country, and parkrun listings (`isHarvestable`, `isParkrunListing`). Races with no distance are kept.
3. Deduplicate within the run (`dedupeRaces`).
4. Match each race against the catalog **and against what this run already wrote** (`findCatalogDuplicate`). A match gets the edition; the race's own id, if stored, is pointed at it.
5. Write as `unreviewed`, `producer: 'harvest'`.

Guards:

- **Never over a person.** A `curated` or `reviewed` entry only gains editions it was missing (`mergeIntoCatalog`). An entry retired for any reason other than `over` is not written.
- **Collapse floor.** If a source returns under 80% of what it already has in the catalog, nothing is written (`isHarvestCollapse`). Partial runs are exempt: a harvest never deletes, so a short read only writes less.
- **No country, no race.** A missing country would be stored as `XX` and merge unrelated races.

## Duplicates

All in [`shared/eventDiscovery/duplicates.ts`](../shared/eventDiscovery/duplicates.ts).

**Automatic merge** (`findCatalogDuplicate`): only when the names agree. `couldBeTheSameRace` first requires:

- the same country and town (one town's words may be a subset of the other's, and a word may differ by one added letter at seven letters or more),
- days within two of each other; if they differ, distances that do not conflict (a side with none passes),
- no number that separates the names ("Etappe 1" vs "Etappe 2", "5K" vs "10K"),
- not marked `notDuplicateOf`, not retired, not already a copy.

Then `namesAgree`: once sponsors, edition and town are removed, every word of the shorter name is in the longer one, or they are the same letters without separators. Distance words are folded across languages and German "-lauf" compounds are stemmed. A reviewed entry is a better survivor, not evidence.

**The queue** (`catalogDuplicateCandidates`) asks a person about pairs the rule did not merge:

- `couldBeTheSameRace` pairs whose names share a meaningful word (4+ letters, not the town, not in `GENERIC`),
- `sameAnnualRace`: the same race stored for different years (names and place agree, within 21 days of the same time of year),
- `oneOrganisersPage`: entries sharing an organiser page that stands behind only two or three entries, same country, names agree and share a word. Catches one race filed under neighbouring towns.

The admin answers "same race, keep this one", "keep the other one", or "different races" (written as `notDuplicateOf`). A copy is never deleted, only pointed at the survivor (`duplicateOfCatalogRaceId`), because `races.catalogRaceId` may reference it. Runners can vote on the same pairs from the search page (`raceCatalogDuplicateVotes`); votes order the admin queue and merge nothing.

Hand-checked pairs live in [`fixtures/verified-duplicates.json`](../shared/eventDiscovery/fixtures/verified-duplicates.json), tested by `verifiedDuplicates.test.ts`. Add a pair there rather than describing it here. After changing the rule, `npm run backfill:catalog-duplicates` applies it to stored entries.

## Coordinates

Entries store `latitude`/`longitude` when the source publishes them; the nightly geocoding pass fills the rest. The search page applies a radius in the browser (Firestore has no geo query), over-fetching 10x, and says how many results it could not place. The centre is the browser's location or a typed town resolved from catalog entries in that town.

## Adding a source

1. Check `robots.txt` and the terms. If in doubt, ask.
2. Prefer `schema.org` (`Event` or `SportsEvent`): it needs no reader of its own.
3. Save a sample as a fixture in `shared/eventDiscovery/fixtures/` and write the reader's test against it.
4. Add the source to `DISCOVERY_SOURCES` in `functions/src/discovery/sources.ts` with its `kind`, reader and `pageLimit`.
5. Enable it in `functions/.env`.
