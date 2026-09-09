import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import {
  DUPLICATE_VOTES_COLLECTION,
  duplicateVoteId,
  duplicateVotePairId,
  tallyDuplicateVotes,
  type DuplicateVote,
  type DuplicateVoteTally,
} from '../../shared/raceCatalog'
import { db } from './firebase'

/**
 * A runner's answer about a pair, stored under the pair and the voter.
 *
 * `setDoc` and not `addDoc`: a second answer to the same question replaces the
 * first rather than counting twice.
 */
export async function recordDuplicateVote(
  uid: string,
  left: string,
  right: string,
  same: boolean,
): Promise<void> {
  const [aId, bId] = left < right ? [left, right] : [right, left]
  const pairId = duplicateVotePairId(aId, bId)
  const vote: DuplicateVote = {
    aId,
    bId,
    uid,
    same,
    votedAt: new Date().toISOString(),
  }
  await setDoc(doc(db, DUPLICATE_VOTES_COLLECTION, duplicateVoteId(pairId, uid)), vote)
}

/**
 * The pairs this runner has already answered.
 *
 * Read so the page can stop asking. A question answered and asked again reads
 * as the answer having been thrown away.
 */
export async function loadMyAnsweredPairs(uid: string): Promise<Set<string>> {
  try {
    const snapshot = await getDocs(
      query(collection(db, DUPLICATE_VOTES_COLLECTION), where('uid', '==', uid)),
    )
    return new Set(
      snapshot.docs.map((document) => {
        const vote = document.data() as DuplicateVote
        return duplicateVotePairId(vote.aId, vote.bId)
      }),
    )
  } catch {
    // A denied read means this instance does not collect votes. Asking a
    // question whose answer cannot be stored is worse than not asking.
    return new Set()
  }
}

/** Every vote, tallied by pair. Admin only: the rules allow nobody else. */
export async function loadDuplicateVoteTallies(): Promise<Map<string, DuplicateVoteTally>> {
  try {
    const snapshot = await getDocs(collection(db, DUPLICATE_VOTES_COLLECTION))
    return tallyDuplicateVotes(snapshot.docs.map((document) => document.data() as DuplicateVote))
  } catch {
    return new Map()
  }
}
