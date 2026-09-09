import type { EventType } from '../domain/eventCodes.js'

/**
 * A race somebody ran that the catalog does not hold.
 *
 * The catalog is fed by nine sources and by an operator, so a race no calendar
 * publishes has no way in, however many people run it. This is that way in,
 * and it is the last gap in the chain: a runner can now say which catalog
 * entry their race is, and this is what happens when the answer is none.
 *
 * A proposal is not an entry. It is written by the runner and turned into an
 * entry by the scheduled job, which is the only thing with the standing to
 * write the shared catalog, and which applies the same floor and the same
 * duplicate rule the harvest does.
 */

export const CATALOG_PROPOSALS_COLLECTION = 'raceCatalogProposals'

export type CatalogProposal = {
  uid: string
  name: string
  city: string
  /** ISO 3166-1 alpha-2, upper case. */
  country: string
  /** ISO day, `YYYY-MM-DD`: the edition the runner ran. */
  raceDate: string
  disciplines: EventType[]
  /** ISO day the proposal was written. */
  proposedAt: string
  /**
   * The entry it became, once the job created one.
   *
   * Written by the job and never by the runner, so it is also the guard that
   * keeps a proposal from being applied twice.
   */
  catalogRaceId?: string
  /**
   * Why it was not applied, when it was not.
   *
   * A proposal that turns out to be a race the catalog already holds is not a
   * failure and not worth telling anybody about: it is answered.
   */
  refusedReason?: 'already_in_catalog' | 'not_enough'
}

/**
 * Whether there is enough here to be a shared race.
 *
 * The same floor the harvest applies, and for the same reason: the catalog
 * stores `XX` for a missing country, dedup compares the country before
 * anything else, and two `XX` races in a town called Porto would merge into
 * one. A race with no day cannot be deduplicated at all.
 */
export function isProposalComplete(proposal: CatalogProposal): boolean {
  return Boolean(
    proposal.name.trim() &&
      proposal.city.trim() &&
      /^[A-Z]{2}$/.test(proposal.country) &&
      /^\d{4}-\d{2}-\d{2}$/.test(proposal.raceDate),
  )
}
