import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore'
import { RACE_CATALOG_COLLECTION, type RaceCatalogEntry } from '../../shared/raceCatalog'
import { NOMINAL_DISTANCE_KM } from '../domain/eventCodes'
import { TARGET_MONTHS } from '../utils/targetMonth'
import type { BucketListItemCreate } from '../types/BucketListItem'
import { db } from './firebase'
import { findRaceByName } from '../domain/raceMatching'
import { createRace, listRaces } from './races'

/**
 * The instance's catalog.
 *
 * There is no bundled copy any more: an instance that never seeded one has an
 * empty catalog, and the callers offer nothing rather than pretending.
 *
 * Retired entries are filtered here rather than in the query on purpose. A
 * Firestore `!=` filter only matches documents where the field exists, so
 * `where('retired', '!=', true)` would drop every entry that was never retired,
 * which is all of them. The catalog is tens of documents, so reading it whole and
 * filtering in memory is both correct and cheap.
 */
export async function loadRaceCatalog(): Promise<RaceCatalogEntry[]> {
  const snapshot = await getDocs(collection(db, RACE_CATALOG_COLLECTION))
  return snapshot.docs
    .map((document) => document.data() as RaceCatalogEntry)
    .filter((race) => race.retired !== true)
}

/**
 * When the harvest last ran, or `null` on an instance that never harvests.
 *
 * The page shows it rather than implying live data: a catalog refreshed weekly
 * is honest about being a catalog.
 */
export async function loadHarvestSyncedAt(): Promise<Date | null> {
  try {
    const snapshot = await getDoc(doc(db, 'raceCatalogHarvest', 'status'))
    if (!snapshot.exists()) return null
    const syncedAt = snapshot.get('syncedAt') as Timestamp | undefined
    return syncedAt?.toDate() ?? null
  } catch {
    // A missing document is the normal case, and a denied read means the
    // instance does not harvest. Neither is worth an error on the page.
    return null
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
  /** The anchor the search was for, when it was for one. */
  servesRaceId?: string,
): BucketListItemCreate {
  const disciplines = race.disciplines.slice(0, MAX_DISCIPLINES)
  const longest = disciplines.reduce(
    (best, discipline) => Math.max(best, NOMINAL_DISTANCE_KM[discipline]),
    0,
  )
  const upcoming = (race.editions ?? []).find((edition) => edition.raceDate)

  return {
    name: race.name,
    location: [race.city, race.country].filter(Boolean).join(', '),
    // The distance a wish carries is the longest on offer: scheduling is where
    // one of them becomes the event.
    realDistance: longest > 0 ? longest : 10,
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
