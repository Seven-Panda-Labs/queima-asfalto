import { describe, expect, it } from 'vitest'
import type { BucketListItem } from '../types/BucketListItem'
import type { RaceEntry } from '../types/RaceEntry'
import { anchorClaimsToWrite } from './anchorMigration'

const TODAY = new Date('2026-09-02')

function item(overrides: Partial<BucketListItem> & Pick<BucketListItem, 'id'>): BucketListItem {
  return {
    userId: 'u1',
    name: 'Maratona de Lisboa',
    location: 'Lisboa',
    realDistance: 42.195,
    disciplines: ['km_42_2'],
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

function entry(overrides: Partial<RaceEntry> & Pick<RaceEntry, 'id' | 'year'>): RaceEntry {
  return {
    userId: 'u1',
    raceId: 'race-lisboa',
    raceDateConfirmed: false,
    entryMethod: 'unknown',
    entryStatus: 'watching',
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

describe('anchorClaimsToWrite', () => {
  const races = [{ id: 'race-lisboa' }]

  it('takes the season from the latest attempt at the race', () => {
    const claims = anchorClaimsToWrite(
      [item({ id: 'wish', isAnchor: true, raceId: 'race-lisboa' })],
      [
        entry({ id: 'e1', year: 2026, bucketListItemId: 'wish' }),
        entry({ id: 'e2', year: 2027, bucketListItemId: 'wish' }),
      ],
      races,
      TODAY,
    )
    expect(claims).toEqual([{ raceId: 'race-lisboa', year: 2027 }])
  })

  it('falls back to the year the runner typed, then to this one', () => {
    expect(
      anchorClaimsToWrite(
        [item({ id: 'wish', isAnchor: true, raceId: 'race-lisboa', targetYear: 2028 })],
        [],
        races,
        TODAY,
      ),
    ).toEqual([{ raceId: 'race-lisboa', year: 2028 }])

    expect(
      anchorClaimsToWrite(
        [item({ id: 'wish', isAnchor: true, raceId: 'race-lisboa' })],
        [],
        races,
        TODAY,
      ),
    ).toEqual([{ raceId: 'race-lisboa', year: 2026 }])
  })

  it('writes nothing when the race already carries that season', () => {
    expect(
      anchorClaimsToWrite(
        [item({ id: 'wish', isAnchor: true, raceId: 'race-lisboa' })],
        [],
        [{ id: 'race-lisboa', anchorYears: [2026] }],
        TODAY,
      ),
    ).toEqual([])
  })

  it('leaves alone a wish that is not an anchor, or has no race identity', () => {
    expect(
      anchorClaimsToWrite(
        [
          item({ id: 'plain', raceId: 'race-lisboa' }),
          item({ id: 'no-race', isAnchor: true }),
        ],
        [],
        races,
        TODAY,
      ),
    ).toEqual([])
  })

  it('says nothing about a race document it cannot see', () => {
    expect(
      anchorClaimsToWrite(
        [item({ id: 'wish', isAnchor: true, raceId: 'race-gone' })],
        [],
        races,
        TODAY,
      ),
    ).toEqual([])
  })
})
