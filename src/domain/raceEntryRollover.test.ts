import { describe, expect, it } from 'vitest'
import type { BucketListItem } from '../types/BucketListItem'
import type { RaceEntry } from '../types/RaceEntry'
import { attemptCountFor, isAttemptFinished, rolloversToCreate } from './raceEntryRollover'

const TODAY = new Date('2026-09-02')

function item(overrides: Partial<BucketListItem> & Pick<BucketListItem, 'id'>): BucketListItem {
  return {
    userId: 'user-1',
    name: 'London Marathon',
    location: 'London',
    realDistance: 42.195,
    disciplines: ['km_42_2'],
    recurring: true,
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

function entry(overrides: Partial<RaceEntry> = {}): RaceEntry {
  return {
    id: 'entry-2026',
    userId: 'user-1',
    raceId: 'race-london',
    bucketListItemId: 'wish',
    year: 2026,
    raceDateConfirmed: true,
    entryMethod: 'lottery',
    entryStatus: 'rejected',
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  }
}

describe('isAttemptFinished', () => {
  it('is finished when the ballot said no, or the runner said no', () => {
    expect(isAttemptFinished(entry({ entryStatus: 'rejected' }), TODAY)).toBe(true)
    expect(isAttemptFinished(entry({ entryStatus: 'declined' }), TODAY)).toBe(true)
    expect(isAttemptFinished(entry({ entryStatus: 'missed' }), TODAY)).toBe(true)
  })

  it('is not finished while the attempt is still live', () => {
    expect(isAttemptFinished(entry({ entryStatus: 'watching' }), TODAY)).toBe(false)
    expect(isAttemptFinished(entry({ entryStatus: 'applied' }), TODAY)).toBe(false)
    expect(isAttemptFinished(entry({ entryStatus: 'accepted' }), TODAY)).toBe(false)
  })

  it('waits for a registered race to actually be run', () => {
    // Being in is not being done: offering next year's ballot to somebody who
    // has not run this year's race yet reads as a bug.
    expect(
      isAttemptFinished(
        entry({ entryStatus: 'registered', raceDate: new Date('2026-10-11') }),
        TODAY,
      ),
    ).toBe(false)
    expect(
      isAttemptFinished(
        entry({ entryStatus: 'registered', raceDate: new Date('2026-04-26') }),
        TODAY,
      ),
    ).toBe(true)
  })
})

describe('rolloversToCreate', () => {
  it('rolls a lost ballot into the next year, watching', () => {
    const [created] = rolloversToCreate([item({ id: 'wish' })], [entry()], TODAY)

    expect(created?.year).toBe(2027)
    expect(created?.entryStatus).toBe('watching')
    expect(created?.entryMethod).toBe('lottery')
    expect(created?.rolledOverFrom).toBe('entry-2026')
    expect(created?.raceId).toBe('race-london')
  })

  it('carries nothing that was a fact about last year', () => {
    const [created] = rolloversToCreate(
      [item({ id: 'wish' })],
      [
        entry({
          registrationOpensAt: new Date('2025-04-25'),
          registrationClosesAt: new Date('2025-05-02'),
          lotteryDrawAt: new Date('2025-07-10'),
          fee: 75,
        }),
      ],
      TODAY,
    )

    expect(created?.registrationOpensAt).toBeUndefined()
    expect(created?.registrationClosesAt).toBeUndefined()
    expect(created?.lotteryDrawAt).toBeUndefined()
    expect(created?.fee).toBeUndefined()
    expect(created?.raceDateConfirmed).toBe(false)
  })

  it('does nothing twice', () => {
    const rolled = entry({ id: 'entry-2027', year: 2027, entryStatus: 'watching', rolledOverFrom: 'entry-2026' })
    expect(rolloversToCreate([item({ id: 'wish' })], [entry(), rolled], TODAY)).toEqual([])
  })

  it('leaves a race the runner does not repeat alone', () => {
    expect(rolloversToCreate([item({ id: 'wish', recurring: false })], [entry()], TODAY)).toEqual([])
  })

  it('never rolls into a year that has already gone', () => {
    // An attempt abandoned two seasons ago rolls to the season still enterable.
    const [created] = rolloversToCreate(
      [item({ id: 'wish' })],
      [entry({ id: 'old', year: 2024 })],
      TODAY,
    )
    expect(created?.year).toBe(2027)
  })

  it('does not roll a wish that has never been attempted', () => {
    expect(rolloversToCreate([item({ id: 'wish' })], [], TODAY)).toEqual([])
  })

  it('skips the year if an attempt for it already exists', () => {
    const next = entry({ id: 'entry-2027', year: 2027, entryStatus: 'watching' })
    expect(rolloversToCreate([item({ id: 'wish' })], [entry(), next], TODAY)).toEqual([])
  })
})

describe('attemptCountFor', () => {
  it('counts the years this race has been tried', () => {
    const entries = [entry({ id: 'a', year: 2025 }), entry({ id: 'b', year: 2026 })]
    expect(attemptCountFor('wish', entries)).toBe(2)
    expect(attemptCountFor('other', entries)).toBe(0)
  })
})
