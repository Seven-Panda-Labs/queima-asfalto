import { CATALOG_PROPOSALS_COLLECTION } from './proposals.js'
import { DUPLICATE_VOTES_COLLECTION } from './duplicateVotes.js'
import { EDITION_REPORTS_COLLECTION } from './editionReports.js'

/** What a runner sent towards the shared catalog, keyed by `uid`. */
export const CONTRIBUTION_COLLECTIONS = [
  CATALOG_PROPOSALS_COLLECTION,
  EDITION_REPORTS_COLLECTION,
  DUPLICATE_VOTES_COLLECTION,
] as const

/**
 * A contribution with its author replaced, for when the account is deleted.
 *
 * The catalog keeps what it learned, so the document stays. The stand-in is one
 * random id per deleted account rather than a blank: reports and votes count one
 * voice per `uid`, and two answers from the same person must still be one. Votes
 * and reports carry the uid in their document id too, so the id is rewritten.
 * `raceId` pointed at the runner's own race, which goes with the account.
 */
export function anonymizedContribution(
  id: string,
  data: Record<string, unknown>,
  uid: string,
  standIn: string,
): { id: string; data: Record<string, unknown> } {
  const { raceId: _raceId, ...rest } = data
  const suffix = `__${uid}`
  return {
    id: id.endsWith(suffix) ? `${id.slice(0, -suffix.length)}__${standIn}` : id,
    data: { ...rest, uid: standIn },
  }
}
