import { describe, expect, it } from 'vitest'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import {
  availableSeasons,
  buildCumulativeSeasons,
  compareSeasons,
  computeSeasonSummary,
  dayOfYear,
} from './season'

const results = toAnalysableResults([
  // 2025: uma em Fevereiro, uma em Novembro.
  makeEvent({ id: '25a', date: new Date(2025, 1, 10), eventType: 'km_10', time: '00:55:00' }),
  makeEvent({ id: '25b', date: new Date(2025, 10, 10), eventType: 'km_10', time: '00:54:00' }),
  // 2026: uma em Março.
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
    // 55:00 é o primeiro 10K, 54:00 bate-o: dois recordes em 2025, um em 2026.
    expect(computeSeasonSummary(results, 2025).recordsSet).toBe(2)
    expect(computeSeasonSummary(results, 2026).recordsSet).toBe(1)
  })
})

describe('compareSeasons', () => {
  it('truncates the previous season to the same day of the year', () => {
    const comparison = compareSeasons(results, 2026, new Date(2026, 3, 1))

    expect(comparison.current.races).toBe(1)
    // Novembro de 2025 fica de fora: em Abril ainda não tinha acontecido.
    expect(comparison.previous!.races).toBe(1)
    expect(comparison.delta!.races).toBe(0)
    // 50:00 contra 55:00 aos 10 km: cinco minutos por dez km, 30s/km mais rápido.
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
  it('builds one running total per season, starting at zero', () => {
    const seasons = buildCumulativeSeasons(results)

    expect(seasons.map((season) => season.year)).toEqual([2025, 2026])
    expect(seasons[0]!.points[0]).toEqual({ dayOfYear: 0, distanceKm: 0 })
    expect(seasons[0]!.totalKm).toBe(20)
    expect(seasons[0]!.points.at(-1)!.distanceKm).toBe(20)
  })
})

describe('availableSeasons', () => {
  it('lists seasons newest first', () => {
    expect(availableSeasons(results)).toEqual([2026, 2025])
  })
})
