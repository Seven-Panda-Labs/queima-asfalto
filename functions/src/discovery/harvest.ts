import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { RACE_CATALOG_COLLECTION } from '../shared/raceCatalog/collection.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'
import { dedupeRaces } from '../shared/eventDiscovery/dedup.js'
import { isHarvestCollapse, isHarvestable } from '../shared/eventDiscovery/guards.js'
import { readRacesFromHtml } from '../shared/eventDiscovery/schemaOrg.js'
import { findCatalogDuplicate } from '../shared/eventDiscovery/duplicates.js'
import { readPlanetMarathonCalendar } from '../shared/eventDiscovery/planetMarathon.js'
import { readSccCalendar } from '../shared/eventDiscovery/sccEvents.js'
import {
  davengoStarterUrl,
  readDavengoSearch,
  withDavengoDistances,
  type DavengoSearchResponse,
} from '../shared/eventDiscovery/davengo.js'
import { parseSitemap, selectEventUrls } from '../shared/eventDiscovery/sitemap.js'
import { mergeIntoCatalog, toCatalogEntry } from '../shared/eventDiscovery/toCatalogEntry.js'
import type { DiscoveredRace } from '../shared/eventDiscovery/types.js'
import { scheduleFunctionOptions } from '../functionOptions.js'
import { DELAY_BETWEEN_PAGES_MS, delay, fetchPage } from './fetchPage.js'
import { enabledSources, type DiscoverySource } from './sources.js'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

/** Race calendars change by the week, not by the hour. */
const HARVEST_SCHEDULE = 'every monday 05:00'

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
  await delay(DELAY_BETWEEN_PAGES_MS)
  try {
    return await fetchPage(url)
  } catch (error) {
    // One page timing out says nothing about the other hundred.
    console.warn(`${source.id}: ${url} failed`, error)
    return null
  }
}

/** A sitemap of event pages, each carrying its own `schema.org` node. */
async function harvestSitemap(source: DiscoverySource): Promise<DiscoveredRace[]> {
  if (!source.sitemapUrl || !source.pathPrefix) return []

  const sitemap = await fetchPage(source.sitemapUrl)
  if (!sitemap) throw new Error(`${source.id}: sitemap unavailable`)

  const urls = selectEventUrls(parseSitemap(sitemap), {
    pathPrefix: source.pathPrefix,
    limit: source.pageLimit,
  })

  const races: DiscoveredRace[] = []
  for (const url of urls) {
    const html = await page(source, url)
    if (html) races.push(...readRacesFromHtml(html))
  }
  return races
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
async function harvestListing(source: DiscoverySource): Promise<DiscoveredRace[]> {
  const pages = source.listingUrls ?? (source.listingUrl ? [source.listingUrl] : [])
  const races: DiscoveredRace[] = []

  for (const url of pages.slice(0, source.pageLimit)) {
    const html = await fetchPage(url, source.charset)
    if (!html) throw new Error(`${source.id}: calendar unavailable`)

    races.push(
      ...(source.listingReader === 'planet-marathon'
        ? readPlanetMarathonCalendar(html, { sourceUrl: url, country: source.country })
        : readSccCalendar(html, {
            city: source.city ?? '',
            country: source.country ?? 'XX',
            baseUrl: source.baseUrl ?? url,
          })),
    )
    if (url !== pages[pages.length - 1]) await delay(DELAY_BETWEEN_PAGES_MS)
  }

  return races
}

async function harvestSource(
  source: DiscoverySource,
  now: Date,
): Promise<DiscoveredRace[]> {
  const races =
    source.kind === 'search'
      ? await harvestSearch(source)
      : source.kind === 'listing'
        ? await harvestListing(source)
        : await harvestSitemap(source)

  return races.filter((race) => isHarvestable(race, now))
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
  for (const source of sources) {
    for (const race of await harvestSource(source, now)) {
      discovered.push(race)
      sourceByUrl.set(race.sourceUrl, source.id)
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
  const harvestedCount = catalog.filter((entry) => entry.producer === 'harvest').length

  if (isHarvestCollapse(harvestedCount, races.length)) {
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

  await db
    .collection(HARVEST_STATUS_COLLECTION)
    .doc(HARVEST_STATUS_DOC_ID)
    .set({
      syncedAt: Timestamp.fromDate(now),
      harvested: races.length,
      written,
      skipped,
      deduplicated,
      sources: sources.map((source) => source.id),
    })

  return {
    written,
    harvested: races.length,
    skipped,
    deduplicated,
    sources: sources.map((source) => source.id),
  }
}

export const harvestRaceCatalog = onSchedule(
  scheduleFunctionOptions(HARVEST_SCHEDULE, { memory: '512MiB', timeoutSeconds: 540 }),
  async () => {
    const result = await refreshDiscoveryCatalog(new Date())

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
