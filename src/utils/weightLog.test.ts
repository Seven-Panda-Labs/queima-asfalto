import { describe, expect, it } from 'vitest'
import { parseWeightKg, summarizeWeights } from './weightLog'

describe('parseWeightKg', () => {
  it('reads a dot or a comma, to one decimal', () => {
    expect(parseWeightKg('94.1')).toBe(94.1)
    expect(parseWeightKg('94,15')).toBe(94.2)
    expect(parseWeightKg(' 80 ')).toBe(80)
  })

  it('rejects blank, malformed and implausible weights', () => {
    expect(parseWeightKg('')).toBeNull()
    expect(parseWeightKg('9x')).toBeNull()
    expect(parseWeightKg('-80')).toBeNull()
    expect(parseWeightKg('19.9')).toBeNull()
    expect(parseWeightKg('401')).toBeNull()
  })
})

describe('summarizeWeights', () => {
  it('is null without entries', () => {
    expect(summarizeWeights([])).toBeNull()
  })

  it('shows only the current weight for a single entry', () => {
    expect(summarizeWeights([{ date: '2026-09-27', weightKg: 94.1 }])).toEqual({
      latestKg: 94.1,
      last7DaysKg: null,
      last30DaysKg: null,
      totalKg: null,
    })
  })

  it('compares the latest weigh-in with the earliest in each window, whatever the input order', () => {
    const summary = summarizeWeights([
      { date: '2026-09-27', weightKg: 94.1 },
      { date: '2026-08-01', weightKg: 96.3 },
      { date: '2026-09-20', weightKg: 95.0 },
      { date: '2026-09-16', weightKg: 94.6 },
    ])
    expect(summary).toEqual({ latestKg: 94.1, last7DaysKg: -0.9, last30DaysKg: -0.5, totalKg: -2.2 })
  })

  it('leaves a window empty when the only earlier weigh-in is older than it', () => {
    const summary = summarizeWeights([
      { date: '2026-09-01', weightKg: 93 },
      { date: '2026-09-27', weightKg: 94.1 },
    ])
    expect(summary?.last7DaysKg).toBeNull()
    expect(summary?.last30DaysKg).toBe(1.1)
  })
})
