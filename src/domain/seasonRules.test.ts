import { describe, expect, it } from 'vitest'
import {
  MAX_RACES_PER_MONTH,
  racesServing,
  seasonWarnings,
  tuneUpFit,
  tuneUpWindowFor,
  type SeasonRace,
} from './seasonRules'

const TODAY = new Date('2026-09-02')
const DAY = 24 * 60 * 60 * 1000

function race(overrides: Partial<SeasonRace> & Pick<SeasonRace, 'id'>): SeasonRace {
  return {
    name: overrides.id,
    date: new Date('2027-04-24'),
    distanceKm: 42.195,
    isAnchor: false,
    ...overrides,
  }
}

const anchor = race({ id: 'london', isAnchor: true, date: new Date('2027-04-24') })
const daysBefore = (count: number) => new Date(anchor.date.getTime() - count * DAY)

describe('tuneUpWindowFor', () => {
  it('is three to four weeks out, at about half the distance', () => {
    const window = tuneUpWindowFor(anchor)
    expect(window.to.toISOString().slice(0, 10)).toBe('2027-04-03')
    expect(window.from.toISOString().slice(0, 10)).toBe('2027-03-27')
    expect(window.targetDistanceKm).toBe(21)
  })

  it('halves whatever the anchor is', () => {
    expect(tuneUpWindowFor(race({ id: 'half', isAnchor: true, distanceKm: 21.0975 })).targetDistanceKm).toBe(
      11,
    )
  })
})

describe('tuneUpFit', () => {
  it('fits a half marathon three and a half weeks before a marathon', () => {
    const fit = tuneUpFit(anchor, { date: daysBefore(24), distanceKm: 21.0975 })
    expect(fit.fits).toBe(true)
    expect(fit.weeksBefore).toBeCloseTo(3.43, 1)
  })

  it('does not fit two weeks out, however right the distance', () => {
    expect(tuneUpFit(anchor, { date: daysBefore(14), distanceKm: 21.0975 }).fits).toBe(false)
  })

  it('does not fit two months out either', () => {
    expect(tuneUpFit(anchor, { date: daysBefore(60), distanceKm: 21.0975 }).fits).toBe(false)
  })

  it('does not fit a 5K before a marathon, at the right moment', () => {
    // A tune-up says something about race fitness, and 5 km before 42 says very
    // little.
    expect(tuneUpFit(anchor, { date: daysBefore(24), distanceKm: 5 }).fits).toBe(false)
  })

  it('does not fit another marathon three weeks out', () => {
    expect(tuneUpFit(anchor, { date: daysBefore(22), distanceKm: 42.195 }).fits).toBe(false)
  })
})

describe('seasonWarnings', () => {
  it('warns about a race inside the taper', () => {
    const warnings = seasonWarnings(
      [anchor, race({ id: 'parkrun', date: daysBefore(6), distanceKm: 5 })],
      TODAY,
    )
    expect(warnings).toEqual([{ rule: 'taper_clash', raceId: 'parkrun', anchorId: 'london' }])
  })

  it('warns when a declared tune-up sits outside the window', () => {
    const warnings = seasonWarnings(
      [
        anchor,
        race({
          id: 'too-early',
          date: daysBefore(70),
          distanceKm: 21.0975,
          role: 'build_up',
          servesRaceId: 'london',
        }),
      ],
      TODAY,
    )
    expect(warnings).toEqual([
      { rule: 'tune_up_window', raceId: 'too-early', anchorId: 'london' },
    ])
  })

  it('says nothing about a tune-up that lands right', () => {
    const warnings = seasonWarnings(
      [
        anchor,
        race({
          id: 'good',
          date: daysBefore(24),
          distanceKm: 21.0975,
          role: 'test',
          servesRaceId: 'london',
        }),
      ],
      TODAY,
    )
    expect(warnings).toEqual([])
  })

  it('warns about the races that made a month crowded, not about all of them', () => {
    const warnings = seasonWarnings(
      [
        race({ id: 'first', date: new Date('2026-11-01'), distanceKm: 10 }),
        race({ id: 'second', date: new Date('2026-11-10'), distanceKm: 10 }),
        race({ id: 'third', date: new Date('2026-11-20'), distanceKm: 10 }),
        race({ id: 'fourth', date: new Date('2026-11-28'), distanceKm: 10 }),
      ],
      TODAY,
    )
    expect(warnings.map((warning) => warning.raceId)).toEqual(['third', 'fourth'])
    expect(warnings[0]).toMatchObject({ rule: 'crowded_month', count: 4 })
  })

  it('allows a month at the limit', () => {
    const races = Array.from({ length: MAX_RACES_PER_MONTH }, (_, index) =>
      race({ id: `r${index}`, date: new Date(`2026-11-0${index + 1}`), distanceKm: 10 }),
    )
    expect(seasonWarnings(races, TODAY)).toEqual([])
  })

  it('says nothing about a season that has already happened', () => {
    const warnings = seasonWarnings(
      [
        race({ id: 'past-anchor', isAnchor: true, date: new Date('2026-04-26') }),
        race({ id: 'past-clash', date: new Date('2026-04-20'), distanceKm: 5 }),
      ],
      TODAY,
    )
    expect(warnings).toEqual([])
  })
})

describe('racesServing', () => {
  it('lists what an anchor is being prepared for, soonest first', () => {
    const races = [
      race({ id: 'late', date: daysBefore(20), servesRaceId: 'london' }),
      race({ id: 'early', date: daysBefore(80), servesRaceId: 'london' }),
      race({ id: 'other', date: daysBefore(30), servesRaceId: 'berlin' }),
    ]
    expect(racesServing('london', races).map((race) => race.id)).toEqual(['early', 'late'])
  })
})
