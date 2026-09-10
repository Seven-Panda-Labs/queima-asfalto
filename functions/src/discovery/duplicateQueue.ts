import { getFirestore } from 'firebase-admin/firestore'
import { RACE_CATALOG_COLLECTION, type RaceCatalogEntry } from '../shared/raceCatalog/index.js'
import { catalogDuplicateCandidates } from '../shared/eventDiscovery/duplicates.js'

/**
 * Works out the pairs a person has to decide, once a day, for everybody.
 *
 * The rule compares every pair against every other, so deciding it in the
 * browser meant the admin screen downloading the whole catalog: five thousand
 * documents to find a dozen pairs, on every visit. Here it costs one read of
 * the catalog a day and leaves a document the screen can open.
 *
 * Ids only. The entries move underneath this, and a pair naming an entry that
 * has since been merged or retired is dropped when it is read rather than
 * stored stale.
 */
export async function writeDuplicateQueue(): Promise<{ pairs: number }> {
  const db = getFirestore()

  const catalog = (await db.collection(RACE_CATALOG_COLLECTION).get()).docs
    .map((document) => document.data() as RaceCatalogEntry)
    .filter((entry) => entry.retired !== true && !entry.duplicateOfCatalogRaceId)

  const pairs = catalogDuplicateCandidates(catalog).map((candidate) => ({
    keep: candidate.keep.id,
    drop: candidate.drop.id,
  }))

  await db
    .collection('raceCatalogHarvest')
    .doc('duplicates')
    .set({ pairs, computedAt: new Date().toISOString() })

  return { pairs: pairs.length }
}
