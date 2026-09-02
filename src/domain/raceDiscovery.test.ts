import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import { EMPTY_CRITERIA, findCandidates, nextEdition } from './raceDiscovery'
import type { SeasonRace } from './seasonRules'

const TODAY = new Date('2026-09-02')

function entry(overrides: Partial<RaceCatalogEntry> & Pick<RaceCatalogEntry, 'id'>): RaceCatalogEntry {
  return {
    name: overrides.id,
    country: 'PT',
    city: 'Lisboa',
    disciplines: ['km_10'],
    entryMethod: 'unknown',
    review: 'unreviewed',
    source: 'acorrer.pt',
    ...overrides,
  }
}

function dated(id: string, raceDate: string, overrides: Partial<RaceCatalogEntry> = {}) {
  return entry({
    id,
    editions: [{ year: Number(raceDate.slice(0, 4)), raceDate, source: 's', confirmedAt: '2026-09-01' }],
    ...overrides,
  })
}

describe('nextEdition', () => {
  it('is the soonest edition still ahead', () => {
    const race = entry({
      id: 'lisboa',
      editions: [
        { year: 2026, raceDate: '2026-03-08', source: 's', confirmedAt: '2026-01-01' },
        { year: 2027, raceDate: '2027-03-07', source: 's', confirmedAt: '2026-08-01' },
      ],
    })
    expect(nextEdition(race, TODAY)?.year).toBe(2027)
  })

  it('has nothing to offer for a race with no dated edition', () => {
    expect(nextEdition(entry({ id: 'someday', typicalRaceMonth: 9 }), TODAY)).toBeNull()
  })
})

describe('findCandidates', () => {
  const catalog = [
    dated('outubro-10k', '2026-10-18'),
    dated('novembro-meia', '2026-11-08', { disciplines: ['km_21_1'], city: 'Porto' }),
    dated('setembro-10k', '2026-09-20', { city: 'Braga' }),
    dated('madrid-10k', '2026-10-11', { country: 'ES', city: 'Madrid' }),
    entry({ id: 'sem-data' }),
    dated('ja-passou', '2026-05-10'),
  ]

  it('offers the dated, upcoming races, soonest first', () => {
    const found = findCandidates(catalog, EMPTY_CRITERIA, { today: TODAY })
    expect(found.map((candidate) => candidate.entry.id)).toEqual([
      'setembro-10k',
      'madrid-10k',
      'outubro-10k',
      'novembro-meia',
    ])
  })

  it('filters by the month window, which is what an anchor gives you', () => {
    const found = findCandidates(
      catalog,
      { ...EMPTY_CRITERIA, from: '2026-10-01', to: '2026-10-31' },
      { today: TODAY },
    )
    expect(found.map((candidate) => candidate.entry.id)).toEqual(['madrid-10k', 'outubro-10k'])
  })

  it('filters by discipline, country and place', () => {
    expect(
      findCandidates(catalog, { ...EMPTY_CRITERIA, disciplines: ['km_21_1'] }, { today: TODAY }),
    ).toHaveLength(1)
    expect(
      findCandidates(catalog, { ...EMPTY_CRITERIA, country: 'ES' }, { today: TODAY }),
    ).toHaveLength(1)
    // Accent and case insensitive, over city and name.
    expect(
      findCandidates(catalog, { ...EMPTY_CRITERIA, place: 'bragá' }, { today: TODAY }),
    ).toHaveLength(1)
  })

  it('leaves a retired entry out', () => {
    const found = findCandidates(
      [dated('retirada', '2026-10-18', { retired: true })],
      EMPTY_CRITERIA,
      { today: TODAY },
    )
    expect(found).toEqual([])
  })

  describe('with an anchor', () => {
    const anchor: SeasonRace = {
      id: 'race-lisboa',
      name: 'Maratona de Lisboa',
      date: new Date('2026-11-08'),
      distanceKm: 42.195,
      isAnchor: true,
    }

    it('puts what works as a tune-up first, however far off the date sorts', () => {
      const found = findCandidates(
        [dated('meia-3-semanas', '2026-10-18', { disciplines: ['km_21_1'] }), dated('10k-setembro', '2026-09-20')],
        EMPTY_CRITERIA,
        { today: TODAY, anchor },
      )

      expect(found[0]!.entry.id).toBe('meia-3-semanas')
      expect(found[0]!.fitsAnchor).toBe(true)
      expect(found[0]!.weeksBeforeAnchor).toBeCloseTo(3, 1)
      expect(found[1]!.fitsAnchor).toBe(false)
    })

    it('reads a multi distance event as fitting when any of its distances does', () => {
      const found = findCandidates(
        [dated('trail-com-meia', '2026-10-18', { disciplines: ['km_10', 'km_21_1'] })],
        EMPTY_CRITERIA,
        { today: TODAY, anchor },
      )
      expect(found[0]!.fitsAnchor).toBe(true)
    })
  })
})
