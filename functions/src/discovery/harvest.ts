import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { RACE_CATALOG_COLLECTION } from '../shared/raceCatalog/collection.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'
import { dedupeRaces } from '../shared/eventDiscovery/dedup.js'
import { isHarvestCollapse, isHarvestable } from '../shared/eventDiscovery/guards.js'
import { readRacesFromHtml } from '../shared/eventDiscovery/schemaOrg.js'
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

async function harvestSource(
  source: DiscoverySource,
  now: Date,
): Promise<DiscoveredRace[]> {
  const sitemap = await fetchPage(source.sitemapUrl)
  if (!sitemap) {
    throw new Error(`${source.id}: sitemap unavailable`)
  }

  const urls = selectEventUrls(parseSitemap(sitemap), {
    pathPrefix: source.pathPrefix,
    limit: source.pageLimit,
  })

  const races: DiscoveredRace[] = []
  for (const url of urls) {
    await delay(DELAY_BETWEEN_PAGES_MS)
    let html: string | null = null
    try {
      html = await fetchPage(url)
    } catch (error) {
      // One page timing out says nothing about the other hundred.
      console.warn(`${source.id}: ${url} failed`, error)
      continue
    }
    if (!html) continue

    for (const race of readRacesFromHtml(html)) {
      if (isHarvestable(race, now)) races.push(race)
    }
  }

  return races
}

export type HarvestResult = {
  written: number
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
  for (const source of sources) {
    discovered.push(...(await harvestSource(source, now)))
  }

  const races = dedupeRaces(discovered)
  const provenance = { source: sources.map((source) => source.id).join(','), harvestedAt: isoDay(now) }

  const storedSnap = await db
    .collection(RACE_CATALOG_COLLECTION)
    .where('producer', '==', 'harvest')
    .get()

  if (isHarvestCollapse(storedSnap.size, races.length)) {
    // Keeping a stale catalog beats publishing a gutted one: these are scrapes,
    // so a template change upstream must cost a run and not the feature.
    const reason = `collapse: ${races.length} harvested against ${storedSnap.size} stored`
    console.error(`discovery harvest rejected, ${reason}`)
    return {
      written: 0,
      harvested: races.length,
      skipped: 0,
      sources: provenance.source.split(','),
      reason,
    }
  }

  let written = 0
  let skipped = 0

  for (const race of races) {
    const entry = toCatalogEntry(race, { source: sourceOf(race, sources), harvestedAt: provenance.harvestedAt })
    const ref = db.collection(RACE_CATALOG_COLLECTION).doc(entry.id)
    const existingSnap = await ref.get()
    const existing = existingSnap.exists
      ? (existingSnap.data() as RaceCatalogEntry)
      : undefined

    const merged = mergeIntoCatalog(existing, entry)
    if (!merged) {
      skipped += 1
      continue
    }

    await ref.set(merged, { merge: false })
    written += 1
  }

  await db
    .collection(HARVEST_STATUS_COLLECTION)
    .doc(HARVEST_STATUS_DOC_ID)
    .set({
      syncedAt: Timestamp.fromDate(now),
      harvested: races.length,
      written,
      skipped,
      sources: sources.map((source) => source.id),
    })

  return { written, harvested: races.length, skipped, sources: sources.map((source) => source.id) }
}

/** Which source a race came from, so a reviewer knows what to check against. */
function sourceOf(race: DiscoveredRace, sources: readonly DiscoverySource[]): string {
  const host = (() => {
    try {
      return new URL(race.sourceUrl).host.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()
  return sources.find((source) => source.id === host)?.id ?? (host || sources[0]!.id)
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
      `discovery harvest: ${result.written} written, ${result.skipped} left alone, from ${result.sources.join(', ')}`,
    )
  },
)
