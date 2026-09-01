import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { RACE_CATALOG_COLLECTION, type RaceCatalogEntry } from '../../shared/raceCatalog'
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
  await setDoc(doc(db, RACE_CATALOG_COLLECTION, race.id), {
    ...race,
    producer: race.producer ?? 'curated',
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  })
}

export async function catalogRaceIdExists(id: string): Promise<boolean> {
  return (await getDoc(doc(db, RACE_CATALOG_COLLECTION, id))).exists()
}
