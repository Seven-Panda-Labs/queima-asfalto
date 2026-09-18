import { describe, expect, it } from 'vitest'
import { reviewDueDateFor, snoozedUntil } from './reviewDue'

describe('reviewDueDateFor', () => {
  it('is the race own next date, which is what puts it in the queue', () => {
    expect(reviewDueDateFor({ nextRaceDate: '2026-05-10' })).toBe('2026-05-10')
  })

  it('is the day it was put off to, while that is still ahead of the race', () => {
    expect(reviewDueDateFor({ nextRaceDate: '2026-05-10', reviewDueDate: '2026-10-18' })).toBe(
      '2026-10-18',
    )
  })

  it('is the new season once one arrives, which answers the question anyway', () => {
    expect(reviewDueDateFor({ nextRaceDate: '2027-05-09', reviewDueDate: '2026-10-18' })).toBe(
      '2027-05-09',
    )
  })

  it('is nothing for an entry that is not work', () => {
    // Retired entries and copies are what made the count on screen wrong: the
    // query matched 1046 rows where 933 races were waiting.
    expect(reviewDueDateFor({ nextRaceDate: '2026-05-10', retired: true })).toBeUndefined()
    expect(
      reviewDueDateFor({ nextRaceDate: '2026-05-10', duplicateOfCatalogRaceId: 'de-berlin-x' }),
    ).toBeUndefined()
  })

  it('is nothing at all when there is no date to go on', () => {
    expect(reviewDueDateFor({})).toBeUndefined()
  })
})

describe('snoozedUntil', () => {
  it('counts days from today, and stays a day', () => {
    const today = new Date('2026-09-18T22:40:00Z')
    expect(snoozedUntil(7, today)).toBe('2026-09-25')
    expect(snoozedUntil(30, today)).toBe('2026-10-18')
    expect(snoozedUntil(90, today)).toBe('2026-12-17')
  })
})
