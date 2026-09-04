import { arrayUnion, collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import {
  nextRaceDateOf,
  RACE_CATALOG_COLLECTION,
  type RaceCatalogEntry,
} from '../../shared/raceCatalog'
import { db } from './firebase'

/**
 * The catalog as an operator sees it: retired entries included, because retiring
 * one has to be reversible and an entry nobody can see cannot be brought back.
 */
export async function listCatalogForAdmin(): Promise<RaceCatalogEntry[]> {
  const snapshot = await getDocs(collection(db, RACE_CATALOG_COLLECTION))
  return snapshot.docs.map((document) => document.data() as RaceCatalogEntry)
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
