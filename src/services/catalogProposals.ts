import { addDoc, collection, getDocs } from 'firebase/firestore'
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

/**
 * The proposals still waiting for the job that turns them into entries.
 *
 * Admin only, and it exists because a proposal was invisible between being
 * written and the next daily run: the runner was told it was saved and nobody,
 * the operator included, could see it anywhere.
 */
export async function loadPendingProposals(): Promise<CatalogProposal[]> {
  try {
    // The whole collection, filtered here. `where('catalogRaceId', '==', null)`
    // would look right and match nothing: Firestore's null only finds a field
    // that exists and is null, and an unanswered proposal has no such field.
    const snapshot = await getDocs(collection(db, CATALOG_PROPOSALS_COLLECTION))
    return snapshot.docs
      .map((document) => document.data() as CatalogProposal)
      .filter((proposal) => !proposal.catalogRaceId && !proposal.refusedReason)
  } catch {
    return []
  }
}
