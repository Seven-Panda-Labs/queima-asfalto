import type { RaceCatalogEdition, RaceCatalogEntry } from '../raceCatalog/types.js'
import { toDisciplines } from './distances.js'
import { catalogId } from './identity.js'
import type { DiscoveredRace } from './types.js'

/** ISO date, `YYYY-MM-DD`, from whatever precision the source published. */
function isoDay(value: string): string {
  return value.slice(0, 10)
}

/**
 * The same object without the keys that hold nothing.
 *
 * Firestore refuses `undefined` outright, and a harvested race is mostly
 * optional fields: a listing with no price and no deadline would fail the write
 * rather than store what it does know.
 */
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T
}

export type HarvestProvenance = {
  /** Named the way a reviewer would go and check: the source's host. */
  source: string
  /** `YYYY-MM-DD`, the day the harvest read it. */
  harvestedAt: string
}

/**
 * A harvested race as a catalog entry.
 *
 * Always `unreviewed`: nothing here has been checked against the organiser, so
 * it may prefill a form the runner can correct and may never fire a reminder or
 * state a deadline. That rule is the reason the two producers can share one
 * collection at all.
 */
export function toCatalogEntry(
  race: DiscoveredRace,
  provenance: HarvestProvenance,
): RaceCatalogEntry {
  const day = isoDay(race.startDate)
  const year = Number(day.slice(0, 4))

  const edition: RaceCatalogEdition = compact({
    year,
    raceDate: day,
    registrationClosesAt: race.registrationClosesAt,
    typicalFee: race.lowPrice,
    feeCurrency: race.lowPrice !== undefined ? race.currency : undefined,
    source: provenance.source,
    confirmedAt: provenance.harvestedAt,
  })

  return compact({
    id: catalogId(race),
    name: race.name,
    country: race.country ?? 'XX',
    city: race.city ?? '',
    disciplines: toDisciplines(race.distancesKm),
    // What a listing never says is how you get in. Guessing `first_come`
    // because there is a price would put a lottery race in the wrong funnel.
    entryMethod: 'unknown',
    officialUrl: race.sourceUrl,
    typicalRaceMonth: Number(day.slice(5, 7)),
    editions: Number.isFinite(year) ? [edition] : undefined,
    review: 'unreviewed',
    source: provenance.source,
    producer: 'harvest',
    updatedAt: provenance.harvestedAt,
    updatedBy: 'harvest',
  })
}

/**
 * The entry to write, given what the catalog already holds.
 *
 * A harvest never touches a curated entry, and never downgrades a reviewed one:
 * a person checked it, and a scrape has no standing to disagree. What it may do
 * is add an edition nobody had yet, which is the field that goes stale.
 */
export function mergeIntoCatalog(
  existing: RaceCatalogEntry | undefined,
  harvested: RaceCatalogEntry,
): RaceCatalogEntry | null {
  if (!existing) return harvested
  if (existing.producer === 'curated' || existing.review === 'reviewed') {
    const editions = existing.editions ?? []
    const incoming = harvested.editions?.[0]
    if (!incoming || editions.some((edition) => edition.year === incoming.year)) return null
    return compact({
      ...existing,
      editions: [...editions, incoming].sort((left, right) => left.year - right.year),
      updatedAt: harvested.updatedAt,
      updatedBy: harvested.updatedBy,
    })
  }

  const editions = [...(existing.editions ?? [])]
  const incoming = harvested.editions?.[0]
  if (incoming) {
    const at = editions.findIndex((edition) => edition.year === incoming.year)
    if (at >= 0) editions[at] = incoming
    else editions.push(incoming)
  }

  // The harvest overwrites the entry whole, so anything an operator decided
  // about it has to be carried across by hand or next week undoes it.
  return compact({
    ...harvested,
    editions: editions.sort((left, right) => left.year - right.year),
    retired: existing.retired,
    duplicateOfCatalogRaceId: existing.duplicateOfCatalogRaceId,
    notDuplicateOf: existing.notDuplicateOf,
  })
}
