import { describe, expect, it } from 'vitest'
import { nextRaceDateOf } from './schedule'

const edition = (raceDate: string) => ({
  year: Number(raceDate.slice(0, 4)),
  raceDate,
  source: 'x',
  confirmedAt: '2026-09-04',
})

describe('nextRaceDateOf', () => {
  it('picks the soonest edition still ahead', () => {
    expect(nextRaceDateOf([edition('2027-04-04'), edition('2026-09-27')], '2026-09-04')).toBe(
      '2026-09-27',
    )
  })

  it('takes today itself', () => {
    expect(nextRaceDateOf([edition('2026-09-04')], '2026-09-04')).toBe('2026-09-04')
  })

  it('falls back to the latest one when every edition is past', () => {
    // Better a date that sorts than an entry that disappears from every query.
    expect(nextRaceDateOf([edition('2025-05-01'), edition('2026-05-01')], '2026-09-04')).toBe(
      '2026-05-01',
    )
  })

  it('has nothing to say about an entry with no dates', () => {
    expect(nextRaceDateOf(undefined, '2026-09-04')).toBeUndefined()
    expect(nextRaceDateOf([{ year: 2027, source: 'x', confirmedAt: '2026-09-04' }], '2026-09-04')).toBeUndefined()
  })
})
