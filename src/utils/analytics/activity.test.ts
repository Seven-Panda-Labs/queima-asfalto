import { describe, expect, it } from 'vitest'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import { buildActivityCalendar, computeActivityRhythm, computeCareerTotals } from './activity'

const results = toAnalysableResults([
  makeEvent({ id: '1', date: new Date(2025, 0, 10), eventType: 'km_10', time: '00:55:00', location: 'Lisboa' }),
  makeEvent({ id: '2', date: new Date(2025, 1, 10), eventType: 'km_10', time: '00:54:00', location: 'lisboa ' }),
  makeEvent({ id: '3', date: new Date(2026, 2, 10), eventType: 'km_10', time: '00:50:00', location: 'Porto' }),
])

describe('computeCareerTotals', () => {
  it('sums the career and counts distinct locations case-insensitively', () => {
    const totals = computeCareerTotals(results)!

    expect(totals.races).toBe(3)
    expect(totals.distanceKm).toBe(30)
    expect(totals.seasons).toBe(2)
    expect(totals.locations).toBe(2)
    expect(totals.firstRace.event.id).toBe('1')
    expect(totals.lastRace.event.id).toBe('3')
  })

  it('returns null without results', () => {
    expect(computeCareerTotals([])).toBeNull()
  })
})

describe('buildActivityCalendar', () => {
  it('fills every month of every season, newest year first', () => {
    const calendar = buildActivityCalendar(results)

    expect(calendar.years).toEqual([2026, 2025])
    expect(calendar.cells).toHaveLength(24)
    expect(calendar.maxRaces).toBe(1)
    expect(calendar.maxDistanceKm).toBe(10)
    expect(calendar.cells.filter((cell) => cell.races > 0)).toHaveLength(3)
  })

  it('aggregates several races in the same month', () => {
    const calendar = buildActivityCalendar(
      toAnalysableResults([
        makeEvent({ id: '1', date: new Date(2026, 3, 1), eventType: 'km_10', time: '00:50:00' }),
        makeEvent({ id: '2', date: new Date(2026, 3, 20), eventType: 'km_10', time: '00:51:00' }),
      ]),
    )

    const april = calendar.cells.find((cell) => cell.month === 3)!
    expect(april.races).toBe(2)
    expect(april.distanceKm).toBe(20)
    expect(calendar.maxRaces).toBe(2)
    expect(calendar.maxDistanceKm).toBe(20)
  })

  it('handles an empty history', () => {
    expect(buildActivityCalendar([])).toEqual({
      years: [],
      cells: [],
      maxRaces: 0,
      maxDistanceKm: 0,
    })
  })
})

describe('computeActivityRhythm', () => {
  it('measures the longest gap, the drought and the run of active months', () => {
    const rhythm = computeActivityRhythm(results, new Date(2026, 2, 20))!

    // February 2025 to March 2026 is the longest gap.
    expect(rhythm.longestGapDays).toBe(393)
    expect(rhythm.daysSinceLastRace).toBe(10)
    expect(rhythm.activeMonths).toBe(3)
    // March 2026 only: February 2026 was empty.
    expect(rhythm.currentMonthStreak).toBe(1)
  })

  it('counts consecutive months back from the last race', () => {
    const rhythm = computeActivityRhythm(
      toAnalysableResults([
        makeEvent({ id: '1', date: new Date(2025, 11, 1), eventType: 'km_10', time: '00:50:00' }),
        makeEvent({ id: '2', date: new Date(2026, 0, 1), eventType: 'km_10', time: '00:50:00' }),
        makeEvent({ id: '3', date: new Date(2026, 1, 1), eventType: 'km_10', time: '00:50:00' }),
      ]),
      new Date(2026, 1, 2),
    )!

    expect(rhythm.currentMonthStreak).toBe(3)
  })

  it('has no gap with a single race', () => {
    const rhythm = computeActivityRhythm([results[0]!], new Date(2025, 0, 11))!
    expect(rhythm.longestGapDays).toBeNull()
  })
})
