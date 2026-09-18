import { keepRunnerFacts } from '../raceCatalog/editionReports.js'
import { nameTokensOf } from '../raceCatalog/nameTokens.js'
import { nextRaceDateOf } from '../raceCatalog/schedule.js'
import type { RaceCatalogEdition, RaceCatalogEntry } from '../raceCatalog/types.js'
import { toDisciplines } from './distances.js'
import { nameWithoutTown } from './duplicates.js'
import { catalogId, nameWithoutEdition } from './identity.js'
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
/** The name as the catalog keeps it, which is neither the edition's nor the town's. */
function storedName(race: DiscoveredRace, provenance: HarvestProvenance): string {
  const withoutEdition = nameWithoutEdition(race.name, new Date(provenance.harvestedAt))
  return nameWithoutTown(withoutEdition, race.city ?? '')
}

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
    // Without the edition or the town: a catalog entry is a race and its
    // editions are the years, so "33. Graz Marathon" is out of date the moment
    // the 34th is announced, and the town is already the field beside it.
    name: storedName(race, provenance),
    country: race.country ?? 'XX',
    city: race.city ?? '',
    latitude: race.latitude,
    longitude: race.longitude,
    disciplines: toDisciplines(race.distancesKm),
    // What a name search matches on, because Firestore cannot look inside a
    // string.
    nameTokens: nameTokensOf(storedName(race, provenance), race.city ?? ''),
    // What a listing never says is how you get in. Guessing `first_come`
    // because there is a price would put a lottery race in the wrong funnel.
    entryMethod: 'unknown',
    // The page it was read from is provenance. It also stands in as the
    // official site until the organiser's own link is resolved off it, so a
    // link that exists today does not disappear while that is pending.
    sourceUrl: race.sourceUrl,
    officialUrl: race.officialUrl ?? race.sourceUrl,
    typicalRaceMonth: Number(day.slice(5, 7)),
    editions: Number.isFinite(year) ? [edition] : undefined,
    nextRaceDate: nextRaceDateOf([edition], provenance.harvestedAt),
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
  // A triathlon or an expo that an operator read and threw out: the source
  // will publish it every week, and writing it every week changes nothing
  // except the day the entry was last touched. A race that simply ended keeps
  // being written, because an edition arriving after it ended is news.
  if (existing.retired && existing.retiredReason && existing.retiredReason !== 'over') return null
  if (existing.producer === 'curated' || existing.review === 'reviewed') {
    const editions = existing.editions ?? []
    const incoming = harvested.editions?.[0]
    if (!incoming || editions.some((edition) => edition.year === incoming.year)) return null
    const merged = [...editions, incoming].sort((left, right) => left.year - right.year)
    return compact({
      ...existing,
      editions: merged,
      nextRaceDate: nextRaceDateOf(merged, harvested.updatedAt ?? ''),
      updatedAt: harvested.updatedAt,
      updatedBy: harvested.updatedBy,
    })
  }

  const editions = [...(existing.editions ?? [])]
  const incoming = harvested.editions?.[0]
  if (incoming) {
    const at = editions.findIndex((edition) => edition.year === incoming.year)
    // A date a runner who was there confirmed outlives the listing's, which is
    // otherwise overwritten whole on the next run of that source.
    if (at >= 0) editions[at] = keepRunnerFacts(incoming, editions[at])
    else editions.push(incoming)
  }

  // The harvest overwrites the entry whole, so anything an operator decided
  // about it has to be carried across by hand or next week undoes it.
  const sorted = editions.sort((left, right) => left.year - right.year)
  return compact({
    ...harvested,
    // A place a person put there outlives a scrape that publishes none.
    latitude: harvested.latitude ?? existing.latitude,
    longitude: harvested.longitude ?? existing.longitude,
    editions: sorted,
    nextRaceDate: nextRaceDateOf(sorted, harvested.updatedAt ?? ''),
    retired: existing.retired,
    duplicateOfCatalogRaceId: existing.duplicateOfCatalogRaceId,
    notDuplicateOf: existing.notDuplicateOf,
  })
}
