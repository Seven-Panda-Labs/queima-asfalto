import { describe, expect, it } from 'vitest'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import {
  availableSeasons,
  buildCumulativeSeasons,
  buildSeasonEnvelope,
  compareSeasons,
  computeSeasonSummary,
  cumulativeKmAt,
  dayOfYear,
} from './season'

const results = toAnalysableResults([
  // 2025: one in February, one in November.
  makeEvent({ id: '25a', date: new Date(2025, 1, 10), eventType: 'km_10', time: '00:55:00' }),
  makeEvent({ id: '25b', date: new Date(2025, 10, 10), eventType: 'km_10', time: '00:54:00' }),
  // 2026: one in March.
  makeEvent({ id: '26a', date: new Date(2026, 2, 10), eventType: 'km_10', time: '00:50:00' }),
])

describe('dayOfYear', () => {
  it('counts from 1 and ignores the time of day', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1)
    expect(dayOfYear(new Date(2026, 0, 1, 23, 59))).toBe(1)
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365)
    expect(dayOfYear(new Date(2024, 11, 31))).toBe(366)
  })
})

describe('computeSeasonSummary', () => {
  it('aggregates a season with a distance-weighted pace', () => {
    const summary = computeSeasonSummary(results, 2025)

    expect(summary.races).toBe(2)
    expect(summary.distanceKm).toBe(20)
    expect(summary.timeSeconds).toBe(3300 + 3240)
    expect(summary.averagePaceSeconds).toBeCloseTo((3300 + 3240) / 20, 6)
  })

  it('counts a record in the season it fell, using the whole history', () => {
    // 55:00 is the first 10K and 54:00 beats it: two records in 2025, one in 2026.
    expect(computeSeasonSummary(results, 2025).recordsSet).toBe(2)
    expect(computeSeasonSummary(results, 2026).recordsSet).toBe(1)
  })
})

describe('compareSeasons', () => {
  it('truncates the previous season to the same day of the year', () => {
    const comparison = compareSeasons(results, 2026, new Date(2026, 3, 1))

    expect(comparison.current.races).toBe(1)
    // November 2025 is out: in April it had not happened yet.
    expect(comparison.previous!.races).toBe(1)
    expect(comparison.delta!.races).toBe(0)
    // 50:00 against 55:00 over 10 km is 30 s/km faster.
    expect(comparison.delta!.averagePaceSeconds).toBeCloseTo(-30, 6)
  })

  it('uses the full previous season once the season is closed', () => {
    const comparison = compareSeasons(results, 2025, new Date(2027, 0, 1))

    expect(comparison.throughDayOfYear).toBeNull()
    expect(comparison.previous).toBeNull()
    expect(comparison.delta).toBeNull()
  })

  it('reports no delta when the previous season has no races', () => {
    const comparison = compareSeasons(results, 2030, new Date(2030, 6, 1))

    expect(comparison.current.races).toBe(0)
    expect(comparison.previous).toBeNull()
  })
})

describe('buildCumulativeSeasons', () => {
  const today = new Date(2026, 7, 30)

  it('builds one running total per season, starting at zero', () => {
    const seasons = buildCumulativeSeasons(results, today)

    expect(seasons.map((season) => season.year)).toEqual([2025, 2026])
    expect(seasons[0]!.points[0]).toEqual({ dayOfYear: 0, distanceKm: 0 })
    expect(seasons[0]!.totalKm).toBe(20)
  })

  it('carries a closed season flat to the end of the year', () => {
    // The last 2025 race was 10 November. A total never falls, so the line
    // carries to December instead of stopping mid-chart.
    const closed = buildCumulativeSeasons(results, today)[0]!

    expect(closed.points.at(-1)).toEqual({ dayOfYear: 366, distanceKm: 20 })
  })

  it('stops the running season at today, not at the end of the year', () => {
    const running = buildCumulativeSeasons(results, today)[1]!

    // Running to December would claim races not yet run.
    expect(running.points.at(-1)).toEqual({ dayOfYear: dayOfYear(today), distanceKm: 10 })
  })
})

describe('availableSeasons', () => {
  it('lists seasons newest first', () => {
    expect(availableSeasons(results)).toEqual([2026, 2025])
  })
})

describe('buildSeasonEnvelope', () => {
  const seasons = buildCumulativeSeasons(results, new Date(2026, 7, 30))

  it('reads a season as a step function', () => {
    const y2025 = seasons.find((season) => season.year === 2025)!

    expect(cumulativeKmAt(y2025, 1)).toBe(0)
    // Race on 10 February; by 1 March only that one counts.
    expect(cumulativeKmAt(y2025, 60)).toBe(10)
    expect(cumulativeKmAt(y2025, 366)).toBe(20)
  })

  it('collapses several seasons into a min-max band over the year', () => {
    const envelope = buildSeasonEnvelope(seasons)

    expect(envelope[0]).toEqual({ dayOfYear: 0, minKm: 0, maxKm: 0 })
    envelope.forEach((point) => expect(point.maxKm).toBeGreaterThanOrEqual(point.minKm))

    const december = envelope.at(-1)!
    // 2025 ran 20 km and 2026 ran 10, so the band spans the two.
    expect(december.minKm).toBe(10)
    expect(december.maxKm).toBe(20)
  })

  it('has no band without seasons', () => {
    expect(buildSeasonEnvelope([])).toEqual([])
  })
})
