import { collection, getDocs } from 'firebase/firestore'
import { RACE_CATALOG_COLLECTION, type RaceCatalogEntry } from '../../shared/raceCatalog'
import { db } from './firebase'

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
