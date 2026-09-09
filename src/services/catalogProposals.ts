import { addDoc, collection } from 'firebase/firestore'
import {
  CATALOG_PROPOSALS_COLLECTION,
  type CatalogProposal,
} from '../../shared/raceCatalog'
import type { EventType } from '../types/Event'
import { db } from './firebase'

/**
 * Proposes a race the catalog does not hold.
 *
 * Written by the runner and turned into an entry by the scheduled job, which
 * is the only thing that writes the shared catalog. So this returns once the
 * proposal is stored, not once the race exists: the answer comes on the next
 * run, and the entry arrives `unreviewed` like every harvested one.
 *
 * An auto-id rather than one derived from the race, because two runners
 * proposing the same race is normal and the job answers the second with the
 * entry the first created.
 */
export async function proposeCatalogRace(
  uid: string,
  race: { name: string; city: string; country: string; raceDate: string; disciplines: EventType[] },
): Promise<void> {
  const proposal: CatalogProposal = {
    uid,
    name: race.name.trim(),
    city: race.city.trim(),
    country: race.country.trim().toUpperCase(),
    raceDate: race.raceDate,
    disciplines: race.disciplines,
    proposedAt: new Date().toISOString().slice(0, 10),
  }
  await addDoc(collection(db, CATALOG_PROPOSALS_COLLECTION), proposal)
}
