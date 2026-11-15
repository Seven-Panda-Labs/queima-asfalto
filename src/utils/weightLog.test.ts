import { describe, expect, it } from 'vitest'
import { parseNote, parseWeightKg, racesWithin, summarizeWeights } from './weightLog'

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

describe('parseNote', () => {
  it('trims, treats blank as no note and refuses one over the limit', () => {
    expect(parseNote('  Início do plano ')).toBe('Início do plano')
    expect(parseNote('   ')).toBeNull()
    expect(parseNote('x'.repeat(81))).toBeNull()
  })
})

describe('summarizeWeights', () => {
  it('leaves out days with only a note', () => {
    const summary = summarizeWeights([
      { date: '2026-09-20', weightKg: 95 },
      { date: '2026-09-25' },
      { date: '2026-09-27', weightKg: 94.1 },
    ])
    expect(summary).toEqual({ latestKg: 94.1, last7DaysKg: -0.9, last30DaysKg: -0.9, totalKg: -0.9 })
    expect(summarizeWeights([{ date: '2026-09-25' }])).toBeNull()
  })

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

describe('racesWithin', () => {
  const race = (day: string, status: 'completed' | 'confirmed' | 'missed', name = day) => ({
    date: new Date(`${day}T12:00:00`),
    status,
    name,
  })

  it('keeps the races run between the first and the last day logged, ends included', () => {
    const races = racesWithin(
      [
        race('2026-08-31', 'completed'),
        race('2026-09-01', 'completed', 'Corrida do Zé'),
        race('2026-09-14', 'missed'),
        race('2026-09-27', 'completed'),
        race('2026-09-28', 'completed'),
        race('2026-10-04', 'confirmed'),
      ],
      [{ date: '2026-09-20' }, { date: '2026-09-01' }, { date: '2026-09-27' }],
    )
    expect(races).toEqual([
      { date: '2026-09-01', name: 'Corrida do Zé', emoji: undefined },
      { date: '2026-09-27', name: '2026-09-27', emoji: undefined },
    ])
  })
})
