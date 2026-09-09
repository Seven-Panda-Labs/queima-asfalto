import { describe, expect, it } from 'vitest'
import {
  duplicateVoteId,
  duplicateVotePairId,
  tallyDuplicateVotes,
  type DuplicateVote,
} from './duplicateVotes'

function vote(aId: string, bId: string, uid: string, same: boolean): DuplicateVote {
  return { aId, bId, uid, same, votedAt: '2026-09-09T10:00:00.000Z' }
}

describe('duplicateVotePairId', () => {
  it('is the same key whichever side the page showed first', () => {
    expect(duplicateVotePairId('de-b-two', 'de-a-one')).toBe(
      duplicateVotePairId('de-a-one', 'de-b-two'),
    )
    expect(duplicateVotePairId('de-a-one', 'de-b-two')).toBe('de-a-one__de-b-two')
  })
})

describe('duplicateVoteId', () => {
  it('carries the voter, so one runner has one answer per pair', () => {
    const pairId = duplicateVotePairId('de-a-one', 'de-b-two')
    expect(duplicateVoteId(pairId, 'u1')).toBe('de-a-one__de-b-two__u1')
    expect(duplicateVoteId(pairId, 'u1')).not.toBe(duplicateVoteId(pairId, 'u2'))
  })
})

describe('tallyDuplicateVotes', () => {
  it('counts both answers per pair', () => {
    const tallies = tallyDuplicateVotes([
      vote('de-a-one', 'de-b-two', 'u1', true),
      vote('de-a-one', 'de-b-two', 'u2', true),
      vote('de-a-one', 'de-b-two', 'u3', false),
      vote('de-c-three', 'de-d-four', 'u1', false),
    ])

    expect(tallies.get('de-a-one__de-b-two')).toEqual({ same: 2, different: 1 })
    expect(tallies.get('de-c-three__de-d-four')).toEqual({ same: 0, different: 1 })
  })

  it('puts a pair stored the other way round on the same count', () => {
    const tallies = tallyDuplicateVotes([
      vote('de-a-one', 'de-b-two', 'u1', true),
      // Written before the ids were sorted, which is what the key protects.
      vote('de-b-two', 'de-a-one', 'u2', true),
    ])

    expect(tallies.size).toBe(1)
    expect(tallies.get('de-a-one__de-b-two')).toEqual({ same: 2, different: 0 })
  })

  it('has nothing to say about a pair nobody answered', () => {
    expect(tallyDuplicateVotes([]).size).toBe(0)
  })
})
