import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { RACE_CATALOG_COLLECTION } from '../shared/raceCatalog/collection.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'
import { dedupeRaces } from '../shared/eventDiscovery/dedup.js'
import {
  isHarvestCollapse,
  isHarvestable,
  storedForSources,
} from '../shared/eventDiscovery/guards.js'
import { readRacesFromHtml } from '../shared/eventDiscovery/schemaOrg.js'
import { findCatalogDuplicate } from '../shared/eventDiscovery/duplicates.js'
import { readPlanetMarathonCalendar } from '../shared/eventDiscovery/planetMarathon.js'
import { readKilometerliebeCalendar } from '../shared/eventDiscovery/kilometerliebe.js'
import { readMarathonDePage } from '../shared/eventDiscovery/marathonDe.js'
import { readSccCalendar } from '../shared/eventDiscovery/sccEvents.js'
import {
  davengoStarterUrl,
  readDavengoSearch,
  withDavengoDistances,
  type DavengoSearchResponse,
} from '../shared/eventDiscovery/davengo.js'
import { parseSitemap, rotatePages, selectEventUrls } from '../shared/eventDiscovery/sitemap.js'
import { mergeIntoCatalog, toCatalogEntry } from '../shared/eventDiscovery/toCatalogEntry.js'
import { sourceForRun } from '../shared/eventDiscovery/sources.js'
import type { DiscoveredRace } from '../shared/eventDiscovery/types.js'
import { scheduleFunctionOptions } from '../functionOptions.js'
import { DELAY_BETWEEN_PAGES_MS, delay, fetchPage } from './fetchPage.js'
import { enabledSources, type DiscoverySource } from './sources.js'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

/**
 * Daily, because a run reads one source.
 *
 * Seven enabled sources are each refreshed weekly, the same as when one run
 * read them all, with a seventh of the work in any one invocation.
 */
const HARVEST_SCHEDULE = 'every day 05:00'

/**
 * Where the client reads how current the catalog is.
 *
 * Its own document because the catalog is a collection: there is no entry to
 * hang "when did the harvest last run" on, and the page has to be able to say
 * so rather than implying live data.
 */
export const HARVEST_STATUS_COLLECTION = 'raceCatalogHarvest'
export const HARVEST_STATUS_DOC_ID = 'status'

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** One page, fetched politely, with a failure that costs the page and not the run. */
async function page(source: DiscoverySource, url: string): Promise<string | null> {
  await delay(source.delayMs ?? DELAY_BETWEEN_PAGES_MS)
  try {
    return await fetchPage(url, source.charset)
  } catch (error) {
    // One page timing out says nothing about the other hundred.
    console.warn(`${source.id}: ${url} failed`, error)
    return null
  }
}

/** Which week's slice a rotating source reads, from the run date alone. */
function weekIndex(now: Date): number {
  return Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))
}

/**
 * What one source gave up, and whether that was all of it.
 *
 * `partial` is what lets the collapse floor stay strict for a source read whole
 * and silent about one read in part.
 */
type SourceHarvest = { races: DiscoveredRace[]; partial: boolean }

/** A sitemap of event pages, each read by the source's own reader. */
async function harvestSitemap(source: DiscoverySource, now: Date): Promise<SourceHarvest> {
  if (!source.sitemapUrl || !source.pathPrefix) return { races: [], partial: false }

  const sitemap = await fetchPage(source.sitemapUrl, source.charset)
  if (!sitemap) throw new Error(`${source.id}: sitemap unavailable`)

  const all = selectEventUrls(parseSitemap(sitemap), {
    pathPrefix: source.pathPrefix,
    // Rotation needs the whole list before it can pick this week's slice.
    limit: source.rotatePages ? Number.MAX_SAFE_INTEGER : source.pageLimit,
  })
  const urls = source.rotatePages
    ? rotatePages(all, source.pageLimit, weekIndex(now) * source.pageLimit)
    : all

  const races: DiscoveredRace[] = []
  let missed = 0
  for (const url of urls) {
    const html = await page(source, url)
    if (!html) {
      missed += 1
      continue
    }

    if (source.pageReader === 'marathon-de') {
      const race = readMarathonDePage(html, { sourceUrl: url })
      if (race) races.push(race)
    } else {
      races.push(...readRacesFromHtml(html))
    }
  }

  // A slice by design, or a page that never arrived: either way this is not the
  // whole source, so a count below what it stored proves nothing.
  return { races, partial: Boolean(source.rotatePages) || missed > 0 }
}

/**
 * A JSON calendar, plus one page per race for the distances.
 *
 * davengo's search endpoint answers with everything except how long the race
 * is, and its starter list is where the competitions are named. Two requests a
 * race is affordable once a week and unthinkable per query, which is the whole
 * reason the harvest is scheduled.
 */
async function harvestSearch(source: DiscoverySource): Promise<DiscoveredRace[]> {
  if (!source.searchUrl) return []

  const races: DiscoveredRace[] = []
  let pages = 1

  for (let index = 0; index < Math.min(pages, source.pageLimit); index += 1) {
    const body = await page(source, `${source.searchUrl}${index}`)
    if (!body) break

    let response: DavengoSearchResponse
    try {
      response = JSON.parse(body) as DavengoSearchResponse
    } catch {
      console.warn(`${source.id}: page ${index} was not json`)
      break
    }

    pages = Math.max(pages, (response.futurePages ?? 0) + 1)

    for (const race of readDavengoSearch(response)) {
      if (race.distancesKm.length > 0) {
        races.push(race)
        continue
      }
      const starter = davengoStarterUrl(
        (response.eventEntries ?? []).find((entry) => entry.name === race.name) ?? {},
      )
      const html = starter ? await page(source, starter) : null
      races.push(html ? withDavengoDistances(race, html) : race)
    }
  }

  return races
}

/** The whole calendar on one page, which is one request for every race on it. */
/** One calendar page, by whichever reader understands that site's markup. */
function readListing(source: DiscoverySource, url: string, html: string): DiscoveredRace[] {
  switch (source.listingReader) {
    case 'planet-marathon':
      return readPlanetMarathonCalendar(html, { sourceUrl: url, country: source.country })
    case 'kilometerliebe':
      return readKilometerliebeCalendar(html, { baseUrl: source.baseUrl ?? url })
    case 'schema-org':
      // The calendar describes every race on it, so the page is the data and
      // no event page needs fetching.
      return readRacesFromHtml(html)
    default:
      return readSccCalendar(html, {
        city: source.city ?? '',
        country: source.country ?? 'XX',
        baseUrl: source.baseUrl ?? url,
      })
  }
}

/**
 * Every calendar a listing source has, each read page by page.
 *
 * A source with `listingCalendars` has one per country; the older shapes are a
 * single calendar, paged or not. `pageLimit` is pages per calendar, so a source
 * that splits by country reads the nearest races of each rather than all of one.
 */
function calendarsOf(source: DiscoverySource): string[] {
  if (source.listingCalendars) return source.listingCalendars
  if (source.listingUrlTemplate) return [source.listingUrlTemplate]
  return source.listingUrls ?? (source.listingUrl ? [source.listingUrl] : [])
}

async function harvestListing(source: DiscoverySource): Promise<SourceHarvest> {
  const calendars = calendarsOf(source)
  const paged = calendars.some((url) => url.includes('{page}'))
  const races: DiscoveredRace[] = []
  let partial = false
  let read = 0

  const pace = source.delayMs ?? DELAY_BETWEEN_PAGES_MS
  for (const calendar of calendars) {
    for (let page = 1; page <= (paged ? source.pageLimit : 1); page += 1) {
      const url = calendar.replace('{page}', String(page))
      if (read > 0) await delay(pace)
      const html = await fetchPage(url, source.charset)
      read += 1

      if (!html) {
        // Nothing read at all means the source is unavailable and the run
        // should say so. Otherwise the site is asking us to stop: what was read
        // is worth keeping, and the next calendar is somebody else's server.
        if (races.length === 0 && calendar === calendars[0] && page === 1) {
          throw new Error(`${source.id}: calendar unavailable`)
        }
        console.warn(`${source.id}: stopped at ${url}, keeping ${races.length} races`)
        partial = true
        break
      }

      const found = readListing(source, url, html)
      // A page past the end answers 200 with an empty calendar, which is how a
      // calendar says how long it is without us hardcoding a page count.
      if (found.length === 0) break
      races.push(...found)
    }
  }

  return { races, partial }
}

async function harvestSource(source: DiscoverySource, now: Date): Promise<SourceHarvest> {
  const harvest =
    source.kind === 'search'
      ? { races: await harvestSearch(source), partial: false }
      : source.kind === 'listing'
        ? await harvestListing(source)
        : await harvestSitemap(source, now)

  return {
    races: harvest.races.filter((race) => isHarvestable(race, now)),
    partial: harvest.partial,
  }
}

export type HarvestResult = {
  written: number
  /** Copies pointed at a race the catalog already held. */
  deduplicated?: number
  /** Races read, after dropping the past and the cancelled. */
  harvested: number
  skipped: number
  sources: string[]
  reason?: string
}

/**
 * Refresh the harvested half of the race catalog.
 *
 * Exported for the emulator and for tests; the schedule below is the only
 * production caller.
 */
export async function refreshDiscoveryCatalog(
  now: Date,
  sources = enabledSources(),
): Promise<HarvestResult> {
  if (sources.length === 0) {
    return { written: 0, harvested: 0, skipped: 0, sources: [], reason: 'no_sources_enabled' }
  }

  const discovered: DiscoveredRace[] = []
  /** Which source each race came from, which is what a reviewer needs. */
  const sourceByUrl = new Map<string, string>()
  const failed: string[] = []
  let partial = false
  for (const source of sources) {
    try {
      const harvest = await harvestSource(source, now)
      partial = partial || harvest.partial
      for (const race of harvest.races) {
        discovered.push(race)
        sourceByUrl.set(race.sourceUrl, source.id)
      }
    } catch (error) {
      // A source being down is news for the operator, not an exception that
      // costs the rest of the run.
      console.error(`${source.id}: harvest failed`, error)
      failed.push(source.id)
    }
  }

  if (discovered.length === 0) {
    const reason = failed.length > 0 ? `sources unavailable: ${failed.join(',')}` : 'nothing_found'
    console.error(`discovery harvest rejected, ${reason}`)
    return {
      written: 0,
      harvested: 0,
      skipped: 0,
      sources: sources.map((source) => source.id),
      reason,
    }
  }

  const races = dedupeRaces(discovered)
  const provenance = { source: sources.map((source) => source.id).join(','), harvestedAt: isoDay(now) }

  /**
   * The whole catalog, not only what previous harvests wrote.
   *
   * The curated entries are the ones a harvest is most likely to duplicate:
   * they were written sponsor free and sometimes in another language, so
   * "BMW BERLIN-MARATHON" and "Berlin Half Marathon" never matched by id. Tens
   * of documents, read once per run.
   */
  const catalogSnap = await db.collection(RACE_CATALOG_COLLECTION).get()
  const catalog = catalogSnap.docs.map((document) => document.data() as RaceCatalogEntry)
  const sourceIds = sources.map((source) => source.id)
  const harvestedCount = storedForSources(catalog, sourceIds)

  if (isHarvestCollapse(harvestedCount, races.length, { partial })) {
    // Keeping a stale catalog beats publishing a gutted one: these are scrapes,
    // so a template change upstream must cost a run and not the feature.
    const reason = `collapse: ${races.length} harvested against ${harvestedCount} stored`
    console.error(`discovery harvest rejected, ${reason}`)
    return {
      written: 0,
      harvested: races.length,
      skipped: 0,
      sources: provenance.source.split(','),
      reason,
    }
  }

  const byId = new Map(catalog.map((entry) => [entry.id, entry]))
  let written = 0
  let skipped = 0
  let deduplicated = 0

  for (const race of races) {
    const entry = toCatalogEntry(race, {
      source: sourceByUrl.get(race.sourceUrl) ?? provenance.source,
      harvestedAt: provenance.harvestedAt,
    })

    /**
     * The race the catalog already holds under another name.
     *
     * When there is one, the edition goes to it and this id is not used: the
     * survivor keeps whatever a person checked, and a copy written by an
     * earlier run is pointed at it rather than deleted.
     */
    const twin = findCatalogDuplicate(entry, catalog)
    const targetId = twin?.id ?? entry.id
    const existing = byId.get(targetId)

    const merged = mergeIntoCatalog(existing, twin ? { ...entry, id: targetId } : entry)
    if (merged) {
      await db.collection(RACE_CATALOG_COLLECTION).doc(targetId).set(merged, { merge: false })
      written += 1
    } else {
      skipped += 1
    }

    if (twin && byId.has(entry.id)) {
      await db
        .collection(RACE_CATALOG_COLLECTION)
        .doc(entry.id)
        .set({ duplicateOfCatalogRaceId: twin.id, updatedAt: provenance.harvestedAt }, { merge: true })
      deduplicated += 1
    }
  }

  // Merged rather than replaced: a run speaks for the source it read, and the
  // other six keep the line their own last run wrote.
  await db
    .collection(HARVEST_STATUS_COLLECTION)
    .doc(HARVEST_STATUS_DOC_ID)
    .set(
      {
        syncedAt: Timestamp.fromDate(now),
        harvested: races.length,
        written,
        skipped,
        deduplicated,
        sources: sourceIds,
        bySource: Object.fromEntries(
          sourceIds.map((id) => [
            id,
            { syncedAt: Timestamp.fromDate(now), harvested: races.length, written, partial },
          ]),
        ),
      },
      { merge: true },
    )

  return { written, harvested: races.length, skipped, deduplicated, sources: sourceIds }
}

export const harvestRaceCatalog = onSchedule(
  scheduleFunctionOptions(HARVEST_SCHEDULE, { memory: '512MiB', timeoutSeconds: 540 }),
  async () => {
    const now = new Date()
    const source = sourceForRun(enabledSources(), now)
    if (!source) {
      console.log('discovery harvest did not publish: no_sources_enabled')
      return
    }

    const result = await refreshDiscoveryCatalog(now, [source])

    if (result.reason) {
      console.log(`discovery harvest did not publish: ${result.reason}`)
      return
    }
    console.log(
      `discovery harvest: ${result.written} written, ${result.skipped} left alone, ` +
        `${result.deduplicated ?? 0} recognised as copies, from ${result.sources.join(', ')}`,
    )
  },
)
