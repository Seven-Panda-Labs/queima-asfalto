import { describe, expect, it } from 'vitest'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import { computeSeasonality } from './seasonality'

describe('computeSeasonality', () => {
  const results = toAnalysableResults([
    // Duas provas em Julho, ambas lentas; duas em Outubro, ambas rápidas.
    makeEvent({ id: '1', date: new Date(2025, 6, 5), eventType: 'km_10', time: '01:00:00' }),
    makeEvent({ id: '2', date: new Date(2026, 6, 5), eventType: 'km_10', time: '00:58:00' }),
    makeEvent({ id: '3', date: new Date(2025, 9, 5), eventType: 'km_10', time: '00:50:00' }),
    makeEvent({ id: '4', date: new Date(2026, 9, 5), eventType: 'km_10', time: '00:52:00' }),
  ])

  it('always returns twelve months, empty ones included', () => {
    const seasonality = computeSeasonality(results, 10)

    expect(seasonality.months).toHaveLength(12)
    expect(seasonality.months[0]!.races).toBe(0)
    expect(seasonality.months[0]!.averageIndex).toBeNull()
    expect(seasonality.coveredMonths).toBe(2)
  })

  it('aggregates across years and ranks the months', () => {
    const seasonality = computeSeasonality(results, 10)

    expect(seasonality.months[6]!.races).toBe(2)
    expect(seasonality.bestMonth!.month).toBe(9)
    expect(seasonality.worstMonth!.month).toBe(6)
    expect(seasonality.bestMonth!.averageIndex!).toBeGreaterThan(
      seasonality.worstMonth!.averageIndex!,
    )
  })

  it('has no ranking without results', () => {
    const seasonality = computeSeasonality([], 10)

    expect(seasonality.bestMonth).toBeNull()
    expect(seasonality.coveredMonths).toBe(0)
  })
})
