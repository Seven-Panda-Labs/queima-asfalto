import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'
import {
  rankByName,
  RACE_CATALOG_COLLECTION,
  type RaceCatalogEntry,
} from '../../shared/raceCatalog'
import { NOMINAL_DISTANCE_KM, type EventType } from '../domain/eventCodes'
import { TARGET_MONTHS } from '../utils/targetMonth'
import type { BucketListItemCreate } from '../types/BucketListItem'
import { db } from './firebase'
import { findRaceByName } from '../domain/raceMatching'
import { createRace, listRaces } from './races'

/** What one search asks the catalog for. Everything optional except the cap. */
export type CatalogQuery = {
  /** ISO 3166-1 alpha-2. */
  country?: string
  /** One discipline: Firestore allows a single array-contains per query. */
  discipline?: EventType
  /**
   * What was typed, as words, already normalised.
   *
   * Firestore allows one `array-contains` per query, so each word is a query
   * of its own and the results are merged: one word was not enough, and
   * "Meia Maratona de Lisboa" is why, because `maratona` alone returns
   * hundreds of entries ordered by date. The array-contains slot means the
   * discipline is left to the page filter.
   */
  nameTokens?: string[]
  /** Inclusive ISO days. `from` defaults to today: a past race is not a find. */
  from?: string
  to?: string
  limit: number
}

/**
 * A page of the catalog, filtered by the server.
 *
 * The catalog was read whole and filtered in the browser, which was honest at
 * ninety entries and is not at five thousand: every visit to the discovery page
 * was five thousand document reads and five megabytes to sort through for
 * twenty rows.
 *
 * `nextRaceDate` exists for this query, because Firestore cannot filter or
 * order by a date inside the `editions` array, and `nameTokens` exists for the
 * same reason: Firestore cannot search inside a string.
 *
 * Retired entries and copies are dropped after the query rather than in it: a
 * second inequality is not allowed beside the date range, and both are rare
 * enough that overfetching a little covers them.
 */
export async function searchRaceCatalog(
  criteria: CatalogQuery,
  today = new Date(),
): Promise<RaceCatalogEntry[]> {
  const words = criteria.nameTokens ?? []
  if (words.length <= 1) return onePage(criteria, words[0], today)

  // Only the most selective few are worth a query, and every word is worth
  // scoring: "meia" is on hundreds of entries and is still the only thing
  // between the Meia Maratona de Lisboa and the Maratona de Lisboa.
  const asked = words.slice(0, MAX_QUERIES)

  // A query per word, because Firestore matches one array element at a time,
  // and then every candidate is ranked against everything that was typed. The
  // word that returns least is what makes this work: "lisboa" brings a handful
  // and the right entry is in it, where "maratona" brings hundreds and it is
  // not.
  const pools = await Promise.all(
    asked.map((word) => onePage(criteria, word, today, { keepCopies: true })),
  )
  const byId = new Map<string, RaceCatalogEntry>()
  for (const pool of pools) {
    for (const race of pool) byId.set(race.id, race)
  }

  return resolveCopies(rankByName([...byId.values()], words.join(' ')), byId, criteria.limit)
}

/**
 * A copy is an alias, which is the whole reason one is kept rather than
 * deleted.
 *
 * The Berlin half is in the catalog twice: "Berlin Half Marathon", which a
 * person checked and which survives, and "GENERALI BERLINER HALBMARATHON",
 * which is pointed at it. Typing what the organiser calls it matches only the
 * copy, and dropping copies from the search made the race unfindable by its
 * own name. So they are searched and then followed.
 */
async function resolveCopies(
  ranked: readonly RaceCatalogEntry[],
  fetched: Map<string, RaceCatalogEntry>,
  limit: number,
): Promise<RaceCatalogEntry[]> {
  const out: RaceCatalogEntry[] = []
  const seen = new Set<string>()

  for (const race of ranked) {
    if (out.length >= limit) break
    const survivingId = race.duplicateOfCatalogRaceId ?? race.id
    if (seen.has(survivingId)) continue
    seen.add(survivingId)

    const survivor = race.duplicateOfCatalogRaceId
      ? (fetched.get(survivingId) ?? (await loadCatalogRace(survivingId)))
      : race
    // A copy pointing at nothing, or at something retired, is not an answer.
    if (!survivor || survivor.retired === true) continue
    out.push(survivor)
  }

  return out
}

async function onePage(
  criteria: CatalogQuery,
  word: string | undefined,
  today: Date,
  options: { keepCopies?: boolean } = {},
): Promise<RaceCatalogEntry[]> {
  const from = criteria.from ?? today.toISOString().slice(0, 10)
  const constraints = [
    where('nextRaceDate', '>=', from),
    ...(criteria.to ? [where('nextRaceDate', '<=', criteria.to)] : []),
    ...(criteria.country ? [where('country', '==', criteria.country.toUpperCase())] : []),
    // One array-contains per query, and the name wins: the discipline narrows
    // a page of twenty and a name narrows five thousand entries to a handful.
    ...(word
      ? [where('nameTokens', 'array-contains', word)]
      : criteria.discipline
        ? [where('disciplines', 'array-contains', criteria.discipline)]
        : []),
    orderBy('nextRaceDate'),
    // Room for the retired and the copies, which the query cannot exclude.
    limitTo(criteria.limit + OVERFETCH),
  ]

  const snapshot = await getDocs(query(collection(db, RACE_CATALOG_COLLECTION), ...constraints))
  return snapshot.docs
    .map((document) => document.data() as RaceCatalogEntry)
    .filter(
      (race) =>
        race.retired !== true && (options.keepCopies || !race.duplicateOfCatalogRaceId),
    )
}

/** Slack for the two things the query cannot filter out. */
const OVERFETCH = 20

/**
 * How many words get a query of their own.
 *
 * Firestore takes one `array-contains` per query, so matching every word means
 * one query per word, and three is where that stops paying: the words are
 * ordered by how much they narrow, and by the third the pool is already small.
 */
const MAX_QUERIES = 3

/**
 * One entry, by the id a race points at.
 *
 * For the planner: a runner filling in an entry should not retype dates the
 * catalog already holds. Read by id rather than through the search, because
 * `races.catalogRaceId` is exactly this id and the search cannot find a race
 * whose next edition has already passed.
 */
export async function loadCatalogRace(id: string): Promise<RaceCatalogEntry | null> {
  try {
    const snapshot = await getDoc(doc(db, RACE_CATALOG_COLLECTION, id))
    return snapshot.exists() ? (snapshot.data() as RaceCatalogEntry) : null
  } catch {
    // An instance with no catalog, or a denied read. The form opens empty,
    // which is what it did before this existed.
    return null
  }
}

/**
 * When the harvest last ran, or `null` on an instance that never harvests.
 *
 * The page shows it rather than implying live data: a catalog refreshed weekly
 * is honest about being a catalog.
 */
export type HarvestStatus = {
  syncedAt: Date | null
  /** Every country the catalog holds, for the discovery filter. */
  countries: string[]
}

export async function loadHarvestStatus(): Promise<HarvestStatus> {
  try {
    const snapshot = await getDoc(doc(db, 'raceCatalogHarvest', 'status'))
    if (!snapshot.exists()) return { syncedAt: null, countries: [] }
    const syncedAt = snapshot.get('syncedAt') as Timestamp | undefined
    const countries = snapshot.get('countries') as string[] | undefined
    return { syncedAt: syncedAt?.toDate() ?? null, countries: countries ?? [] }
  } catch {
    // A missing document is the normal case, and a denied read means the
    // instance does not harvest. Neither is worth an error on the page.
    return { syncedAt: null, countries: [] }
  }
}

/** The bucket list cap. A catalog entry can name more distances than that. */
const MAX_DISCIPLINES = 6

/**
 * A catalog race as a wish, keeping the identity.
 *
 * The race document carries `catalogRaceId`, which is what lets the entry
 * planner pull this race's published deadlines later instead of asking the
 * runner to type them.
 */
export function catalogRaceToBucketListItem(
  race: RaceCatalogEntry,
  raceId: string | null,
  options: {
    /** The anchor the search was for, when it was for one. */
    servesRaceId?: string
    /**
     * What the runner said the distance is.
     *
     * Required for a race whose distance no source published: the catalog would
     * rather hold nothing than a number nobody checked, so the answer comes
     * from the person adding it.
     */
    discipline?: EventType
  } = {},
): BucketListItemCreate {
  const { servesRaceId, discipline } = options
  const disciplines = (
    discipline ? [discipline] : race.disciplines
  ).slice(0, MAX_DISCIPLINES)
  const longest = disciplines.reduce(
    (best, value) => Math.max(best, NOMINAL_DISTANCE_KM[value]),
    0,
  )
  const upcoming = (race.editions ?? []).find((edition) => edition.raceDate)

  return {
    name: race.name,
    location: [race.city, race.country].filter(Boolean).join(', '),
    // The distance a wish carries is the longest on offer: scheduling is where
    // one of them becomes the event. A wish with no distance at all cannot be
    // saved, so the caller has to have asked.
    realDistance: longest,
    disciplines,
    targetMonth: race.typicalRaceMonth
      ? TARGET_MONTHS[race.typicalRaceMonth - 1]
      : undefined,
    targetYear: upcoming?.raceDate ? Number(upcoming.raceDate.slice(0, 4)) : undefined,
    link: race.registrationUrl ?? race.officialUrl,
    ...(raceId ? { raceId } : {}),
    // Searching for an anchor is the runner saying what this race is for. The
    // role stays theirs to pick: build-up and test are different intentions.
    ...(servesRaceId ? { servesRaceId } : {}),
  }
}

/**
 * The race identity for a catalog entry, minted once.
 *
 * Named like the catalog so a second add from discovery, or a wish the runner
 * had already typed by hand, lands on the same race rather than a duplicate.
 */
export async function findOrCreateCatalogRaceId(
  userId: string,
  race: RaceCatalogEntry,
): Promise<string | null> {
  try {
    const races = await listRaces(userId)
    const existing =
      races.find((candidate) => candidate.catalogRaceId === race.id) ??
      findRaceByName(races, race.name)
    if (existing) return existing.id

    return await createRace(userId, {
      name: race.name,
      location: [race.city, race.country].filter(Boolean).join(', '),
      catalogRaceId: race.id,
      officialUrl: race.officialUrl,
    })
  } catch {
    return null
  }
}
