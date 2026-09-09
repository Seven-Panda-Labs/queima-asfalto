import { getFirestore } from 'firebase-admin/firestore'
import {
  CATALOG_PROPOSALS_COLLECTION,
  isProposalComplete,
  nameTokensOf,
  RACE_CATALOG_COLLECTION,
  type CatalogProposal,
  type RaceCatalogEntry,
} from '../shared/raceCatalog/index.js'
import { findCatalogDuplicate } from '../shared/eventDiscovery/duplicates.js'
import { catalogId } from '../shared/eventDiscovery/identity.js'

/**
 * Turns what runners proposed into catalog entries.
 *
 * A race no calendar publishes had no way into the catalog, however many
 * people ran it. This is that way, and it is deliberately the same way a
 * harvested race takes: the same floor, the same duplicate rule, `unreviewed`,
 * and into the same queue an operator already works through. A person who ran
 * the race is at least as good a witness as a listing.
 *
 * Only this writes the catalog. A runner writes a proposal, and nothing a
 * runner writes lands on a shared entry without passing through here.
 */
export async function applyPendingProposals(
  now: Date,
): Promise<{ pending: number; created: number; refused: number }> {
  const db = getFirestore()
  const today = now.toISOString().slice(0, 10)

  const snapshot = await db.collection(CATALOG_PROPOSALS_COLLECTION).get()
  const pending = snapshot.docs.filter((document) => {
    const proposal = document.data() as CatalogProposal
    return !proposal.catalogRaceId && !proposal.refusedReason
  })
  if (pending.length === 0) return { pending: 0, created: 0, refused: 0 }

  // The whole catalog, because the duplicate rule compares against all of it
  // and a proposal is rare enough to be worth one read of it.
  const catalog = (await db.collection(RACE_CATALOG_COLLECTION).get()).docs.map(
    (document) => document.data() as RaceCatalogEntry,
  )

  let created = 0
  let refused = 0

  for (const document of pending) {
    const proposal = document.data() as CatalogProposal

    if (!isProposalComplete(proposal)) {
      await document.ref.update({ refusedReason: 'not_enough' })
      refused += 1
      continue
    }

    const entry = toEntry(proposal, today)

    // A race the catalog already holds under another name is answered, not
    // created: the runner searched by one word and the rule reads day, town
    // and name together.
    const twin = findCatalogDuplicate(entry, catalog)
    if (twin) {
      await document.ref.update({ catalogRaceId: twin.id, refusedReason: 'already_in_catalog' })
      refused += 1
      continue
    }

    // Two runners proposing the same race on the same day would otherwise
    // write the same id twice, and the second would silently replace the
    // first: the id is derived from the country, the town and the name.
    const existing = await db.collection(RACE_CATALOG_COLLECTION).doc(entry.id).get()
    if (existing.exists) {
      await document.ref.update({ catalogRaceId: entry.id, refusedReason: 'already_in_catalog' })
      refused += 1
      continue
    }

    await db.collection(RACE_CATALOG_COLLECTION).doc(entry.id).set(entry)
    catalog.push(entry)
    await document.ref.update({ catalogRaceId: entry.id })
    created += 1
  }

  return { pending: pending.length, created, refused }
}

/**
 * The entry a proposal becomes.
 *
 * Nothing is asserted that the runner did not say: no fee, no gates, no entry
 * method, and `unreviewed`, so `canAssertDates()` keeps it from firing
 * anything. The edition it carries is the one they ran.
 */
function toEntry(proposal: CatalogProposal, today: string): RaceCatalogEntry {
  const year = Number(proposal.raceDate.slice(0, 4))
  return {
    id: catalogId({
      name: proposal.name,
      city: proposal.city,
      country: proposal.country,
    } as never),
    name: proposal.name.trim(),
    country: proposal.country.toUpperCase(),
    city: proposal.city.trim(),
    disciplines: proposal.disciplines ?? [],
    nameTokens: nameTokensOf(proposal.name, proposal.city),
    entryMethod: 'unknown',
    typicalRaceMonth: Number(proposal.raceDate.slice(5, 7)),
    editions: [{ year, raceDate: proposal.raceDate, source: 'runners', confirmedAt: today }],
    nextRaceDate: proposal.raceDate,
    review: 'unreviewed',
    source: 'runners',
    producer: 'runner',
    updatedAt: today,
    updatedBy: 'proposals',
  }
}
