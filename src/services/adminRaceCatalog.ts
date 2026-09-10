import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore'
import {
  nextRaceDateOf,
  RACE_CATALOG_COLLECTION,
  rankByName,
  searchTokens,
  type RaceCatalogEntry,
} from '../../shared/raceCatalog'
import { pairAlreadyAnswered } from '../../shared/eventDiscovery/duplicates'
import { db } from './firebase'

/**
 * The catalog as an operator sees it: retired entries included, because retiring
 * one has to be reversible and an entry nobody can see cannot be brought back.
 */
/**
 * The entries that need work, a page at a time.
 *
 * `nextRaceDate` is the soonest edition that had not happened when the entry
 * was written, so an entry whose last known date has passed is one nobody has
 * read a new season for: exactly the queue `catalog:review` reports, and now a
 * query rather than five thousand documents sorted in the browser.
 *
 * A retired entry and a copy are not work. Both are rare, so they are dropped
 * from the page rather than excluded in the query, which would cost a second
 * inequality Firestore does not allow beside the date.
 */
export async function listStaleForAdmin(
  pageSize: number,
  after?: string,
  today = new Date(),
): Promise<{ races: RaceCatalogEntry[]; nextCursor?: string }> {
  const snapshot = await getDocs(
    query(
      collection(db, RACE_CATALOG_COLLECTION),
      where('nextRaceDate', '<', today.toISOString().slice(0, 10)),
      orderBy('nextRaceDate'),
      ...(after ? [startAfter(after)] : []),
      limitTo(pageSize + 1),
    ),
  )
  const all = snapshot.docs.map((document) => document.data() as RaceCatalogEntry)
  const page = all.slice(0, pageSize)

  return {
    races: page.filter((race) => race.retired !== true && !race.duplicateOfCatalogRaceId),
    // The cursor is the last row of the page whether or not it survived the
    // filter, or the next page starts by repeating it.
    ...(all.length > pageSize ? { nextCursor: page[page.length - 1]?.nextRaceDate } : {}),
  }
}

/**
 * Any entry, by a word of its name, for fixing one.
 *
 * The other flow: the queue above is the work, and this is for when a specific
 * entry is wrong. It keeps the copies and the retired, which the search a
 * runner sees drops, because those are the entries most likely to need an
 * operator.
 */
export async function searchCatalogForAdmin(
  typed: string,
  pageSize: number,
): Promise<RaceCatalogEntry[]> {
  const words = searchTokens(typed)
  if (words.length === 0) return []

  const pools = await Promise.all(
    words.slice(0, 3).map(async (word) => {
      const snapshot = await getDocs(
        query(
          collection(db, RACE_CATALOG_COLLECTION),
          where('nameTokens', 'array-contains', word),
          limitTo(pageSize + 20),
        ),
      )
      return snapshot.docs.map((document) => document.data() as RaceCatalogEntry)
    }),
  )

  const byId = new Map<string, RaceCatalogEntry>()
  for (const pool of pools) {
    for (const race of pool) byId.set(race.id, race)
  }
  return rankByName([...byId.values()], words.join(' ')).slice(0, pageSize)
}

/**
 * The pairs the rule could not decide, as the daily job left them.
 *
 * One document and then the entries it names. Deciding it in the browser meant
 * loading the whole catalog to compare every pair against every other, which
 * is what made this screen slow.
 */
export async function loadDuplicateQueue(): Promise<[RaceCatalogEntry, RaceCatalogEntry][]> {
  const snapshot = await getDoc(doc(db, 'raceCatalogHarvest', 'duplicates'))
  const pairs = (snapshot.data()?.pairs ?? []) as { keep: string; drop: string }[]
  if (pairs.length === 0) return []

  const ids = [...new Set(pairs.flatMap((pair) => [pair.keep, pair.drop]))]
  const entries = new Map<string, RaceCatalogEntry>()
  await Promise.all(
    ids.map(async (id) => {
      const race = await getCatalogRaceForAdmin(id)
      if (race) entries.set(id, race)
    }),
  )

  const found: [RaceCatalogEntry, RaceCatalogEntry][] = []
  for (const pair of pairs) {
    const keep = entries.get(pair.keep)
    const drop = entries.get(pair.drop)
    if (!keep || !drop) continue
    // The queue is a day old, and an answer is an answer: merged either way
    // round, retired, or kept apart on purpose.
    if (pairAlreadyAnswered(keep, drop)) continue
    found.push([keep, drop])
  }
  return found
}

export async function getCatalogRaceForAdmin(id: string): Promise<RaceCatalogEntry | null> {
  const snapshot = await getDoc(doc(db, RACE_CATALOG_COLLECTION, id))
  return snapshot.exists() ? (snapshot.data() as RaceCatalogEntry) : null
}

/**
 * Writes one entry, whole.
 *
 * A full document write rather than a merge: the form holds every field, so a
 * merge would leave a value the operator just cleared sitting in Firestore.
 */
export async function saveCatalogRaceForAdmin(
  race: RaceCatalogEntry,
  adminUid: string,
): Promise<void> {
  const today = new Date().toISOString()
  await setDoc(doc(db, RACE_CATALOG_COLLECTION, race.id), {
    ...race,
    producer: race.producer ?? 'curated',
    // The field the discovery query filters and orders by. Derived here so a
    // date edited by hand is searchable without waiting for a harvest.
    ...(nextRaceDateOf(race.editions, today.slice(0, 10))
      ? { nextRaceDate: nextRaceDateOf(race.editions, today.slice(0, 10)) }
      : {}),
    updatedAt: today,
    updatedBy: adminUid,
  })
}

export async function catalogRaceIdExists(id: string): Promise<boolean> {
  return (await getDoc(doc(db, RACE_CATALOG_COLLECTION, id))).exists()
}

/**
 * One race, two entries: point the copy at the survivor.
 *
 * A merge and not a delete, and a merge write and not a whole one: the copy
 * keeps every field it had, because `races.catalogRaceId` may already point at
 * it and because being wrong about this has to be undoable.
 */
export async function mergeCatalogRaces(
  keepId: string,
  dropId: string,
  adminUid: string,
): Promise<void> {
  await setDoc(
    doc(db, RACE_CATALOG_COLLECTION, dropId),
    { duplicateOfCatalogRaceId: keepId, updatedAt: new Date().toISOString(), updatedBy: adminUid },
    { merge: true },
  )
}

/** Undo the above. The entry goes back to standing on its own. */
export async function unmergeCatalogRace(id: string, adminUid: string): Promise<void> {
  await setDoc(
    doc(db, RACE_CATALOG_COLLECTION, id),
    { duplicateOfCatalogRaceId: null, updatedAt: new Date().toISOString(), updatedBy: adminUid },
    { merge: true },
  )
}

/**
 * Two races, and the answer written on both.
 *
 * On both because either one can be the harvested side next week, and the point
 * of recording it is that the question is asked once.
 */
export async function separateCatalogRaces(
  leftId: string,
  rightId: string,
  adminUid: string,
): Promise<void> {
  const updatedAt = new Date().toISOString()
  await Promise.all(
    [
      [leftId, rightId],
      [rightId, leftId],
    ].map(([id, other]) =>
      setDoc(
        doc(db, RACE_CATALOG_COLLECTION, id),
        { notDuplicateOf: arrayUnion(other), updatedAt, updatedBy: adminUid },
        { merge: true },
      ),
    ),
  )
}
