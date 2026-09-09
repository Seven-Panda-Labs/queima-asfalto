/**
 * What a runner said about a pair the harvest could not decide.
 *
 * The automatic rule merges what it can prove and leaves the rest to a person,
 * and one admin was the only person who could answer. A runner reading two rows
 * that are plainly one race knows it faster than anybody, and the search page
 * already has both entries in front of them.
 *
 * A vote is not authority. It never merges anything: the merge points one id at
 * another and `races.catalogRaceId` may already reference either, so that stays
 * a decision an admin takes. What a vote does is order the queue, so the pairs
 * runners recognise reach the top and the rest stop hiding behind them.
 */

export const DUPLICATE_VOTES_COLLECTION = 'raceCatalogDuplicateVotes'

export type DuplicateVote = {
  /** The two catalog ids, `aId` always the smaller, so a pair has one key. */
  aId: string
  bId: string
  uid: string
  /** True for "the same race", false for "two different races". */
  same: boolean
  /** ISO instant, for an admin wondering how old an answer is. */
  votedAt: string
}

/**
 * One key per pair, whichever side the page showed first.
 *
 * The search page orders by date and the two rows land next to each other in
 * whatever order the query returned them. Sorting the ids here is what stops
 * two runners answering the same question into two different documents.
 */
export function duplicateVotePairId(left: string, right: string): string {
  return left < right ? `${left}__${right}` : `${right}__${left}`
}

/** One vote per runner per pair, so a second answer replaces the first. */
export function duplicateVoteId(pairId: string, uid: string): string {
  return `${pairId}__${uid}`
}

export type DuplicateVoteTally = {
  same: number
  different: number
}

/** Votes by pair, for the admin queue to sort by. */
export function tallyDuplicateVotes(
  votes: readonly DuplicateVote[],
): Map<string, DuplicateVoteTally> {
  const byPair = new Map<string, DuplicateVoteTally>()
  for (const vote of votes) {
    const pairId = duplicateVotePairId(vote.aId, vote.bId)
    const tally = byPair.get(pairId) ?? { same: 0, different: 0 }
    if (vote.same) tally.same += 1
    else tally.different += 1
    byPair.set(pairId, tally)
  }
  return byPair
}
