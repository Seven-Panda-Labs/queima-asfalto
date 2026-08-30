import {
  countryUrlFromParkrunHost,
  type ParkrunCatalog,
  type ParkrunCatalogEvent,
} from './catalog.js'

/** Upstream feed published by parkrun for its own event map. */
export const PARKRUN_EVENTS_URL = 'https://images.parkrun.com/events.json'

export type RawParkrunEventsJson = {
  countries?: Record<string, { url?: string } | null>
  events?: {
    features?: Array<{
      id?: number
      properties?: {
        eventname?: string
        EventLongName?: string
        EventShortName?: string
        countrycode?: number
        seriesid?: number
        EventLocation?: string
      }
      geometry?: { coordinates?: [number, number] }
    }>
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Normalize the upstream feed into the catalog shape the app searches.
 *
 * Events are dropped rather than guessed at when a required field is missing,
 * so a partially broken upstream shrinks the catalog instead of poisoning it.
 * `isAcceptableRefresh` is what turns that shrinkage into a refusal to publish.
 */
export function normalizeParkrunCatalog(
  raw: RawParkrunEventsJson,
  syncedAt: string,
): ParkrunCatalog {
  const countryHosts = new Map<number, string>()

  for (const [code, country] of Object.entries(raw.countries ?? {})) {
    if (!country?.url) continue
    countryHosts.set(Number(code), country.url)
  }

  const events: ParkrunCatalogEvent[] = (raw.events?.features ?? [])
    .map((feature): ParkrunCatalogEvent | null => {
      const props = feature.properties
      if (!props?.eventname || !isFiniteNumber(props.countrycode)) return null

      const host = countryHosts.get(props.countrycode)
      if (!host) return null

      const [lng, lat] = feature.geometry?.coordinates ?? []
      if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null
      if (!isFiniteNumber(feature.id)) return null

      return {
        id: feature.id,
        slug: props.eventname,
        shortName: props.EventShortName ?? props.eventname,
        longName: props.EventLongName ?? props.eventname,
        location: props.EventLocation ?? '',
        countryCode: props.countrycode,
        countryUrl: countryUrlFromParkrunHost(host),
        seriesId: props.seriesid ?? 1,
        lng,
        lat,
      }
    })
    .filter((event): event is ParkrunCatalogEvent => event != null)
    .sort((left, right) => left.longName.localeCompare(right.longName, 'en'))

  return { syncedAt, events }
}

/**
 * Fraction of the previous catalog a refresh must keep to be published.
 *
 * parkrun events are retired occasionally, so some shrinkage is normal; a
 * collapse means the upstream feed, not the world, changed.
 */
export const MIN_CATALOG_RETENTION = 0.8

export type CatalogRefreshDecision =
  | { accepted: true }
  | { accepted: false; reason: string }

/**
 * Guard a refresh before it overwrites a good catalog with a degraded one.
 *
 * Without a previous catalog any non-empty result is accepted, so a fresh
 * project can bootstrap.
 */
export function isAcceptableRefresh(
  nextCount: number,
  previousCount: number | null,
): CatalogRefreshDecision {
  if (nextCount === 0) {
    return { accepted: false, reason: 'upstream returned no usable events' }
  }

  if (previousCount == null || previousCount === 0) return { accepted: true }

  const retained = nextCount / previousCount
  if (retained < MIN_CATALOG_RETENTION) {
    return {
      accepted: false,
      reason:
        `upstream returned ${nextCount} events, ` +
        `under ${Math.round(MIN_CATALOG_RETENTION * 100)}% of the stored ${previousCount}`,
    }
  }

  return { accepted: true }
}

/** UTC calendar day, matching the `syncedAt` format the catalog already uses. */
export function catalogSyncDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/**
 * How stale a synced catalog may be before the client stops trusting it.
 *
 * Comfortably over the weekly schedule, so a single missed run is not treated
 * as a failure, but short enough that a function stuck erroring for a month
 * hands over to the bundled seed.
 */
export const MAX_SYNCED_CATALOG_AGE_DAYS = 45

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Whether a synced catalog can be used without consulting the bundled seed.
 *
 * A `false` here is not "the catalog is bad", only "check the seed too". The
 * caller compares `syncedAt` and takes the newer one.
 */
export function isSyncedCatalogFresh(
  syncedAt: string | undefined,
  eventCount: number,
  now: Date,
): boolean {
  if (!syncedAt || eventCount === 0) return false

  const synced = Date.parse(`${syncedAt}T00:00:00Z`)
  if (Number.isNaN(synced)) return false

  const ageDays = (now.getTime() - synced) / MS_PER_DAY
  return ageDays >= 0 && ageDays <= MAX_SYNCED_CATALOG_AGE_DAYS
}

/** Pick the newer of a synced catalog and the bundled seed. */
export function newerCatalog(
  synced: ParkrunCatalog | null,
  seed: ParkrunCatalog,
): ParkrunCatalog {
  if (!synced || synced.events.length === 0) return seed
  return synced.syncedAt >= seed.syncedAt ? synced : seed
}
