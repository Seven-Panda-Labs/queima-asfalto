import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../raceCatalog/types'
import { catalogDuplicateCandidates, findCatalogDuplicate } from './duplicates'

function entry(overrides: Partial<RaceCatalogEntry> & Pick<RaceCatalogEntry, 'id' | 'name'>): RaceCatalogEntry {
  return {
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_42_2'],
    entryMethod: 'unknown',
    review: 'unreviewed',
    source: 'scc-events.com',
    producer: 'harvest',
    editions: [{ year: 2026, raceDate: '2026-09-27', source: 's', confirmedAt: '2026-09-02' }],
    ...overrides,
  }
}

/** What a person wrote, sponsor free and in English. */
const curatedMarathon = entry({
  id: 'berlin-marathon',
  name: 'Berlin Marathon',
  review: 'reviewed',
  producer: 'curated',
  source: 'organiser',
})

const curatedHalf = entry({
  id: 'berlin-half-marathon',
  name: 'Berlin Half Marathon',
  review: 'reviewed',
  producer: 'curated',
  source: 'organiser',
  disciplines: ['km_21_1'],
  editions: [{ year: 2027, raceDate: '2027-04-04', source: 'organiser', confirmedAt: '2026-08-01' }],
})

describe('findCatalogDuplicate', () => {
  it('finds the curated entry a sponsored name belongs to', () => {
    const harvested = entry({ id: 'de-berlin-bmw-berlin-marathon', name: 'BMW BERLIN-MARATHON' })
    expect(findCatalogDuplicate(harvested, [curatedMarathon])?.id).toBe('berlin-marathon')
  })

  it('finds it across languages, where no name comparison could', () => {
    // "Berlin Half Marathon" and "GENERALI BERLINER HALBMARATHON" are one race.
    const harvested = entry({
      id: 'de-berlin-generali-berliner-halbmarathon',
      name: 'GENERALI BERLINER HALBMARATHON',
      disciplines: ['km_21_1'],
      editions: [{ year: 2027, raceDate: '2027-04-04', source: 's', confirmedAt: '2026-09-02' }],
    })
    expect(findCatalogDuplicate(harvested, [curatedHalf])?.id).toBe('berlin-half-marathon')
  })

  it('matches two harvested entries when the names plainly agree', () => {
    const withCity = entry({
      id: 'de-berlin-adidas-runners-city-night-berlin',
      name: 'adidas Runners City Night Berlin',
      disciplines: ['km_5', 'km_10'],
      editions: [{ year: 2027, raceDate: '2027-07-31', source: 's', confirmedAt: '2026-09-02' }],
    })
    const without = entry({
      id: 'de-berlin-runners-city-night',
      name: 'adidas Runners City Night',
      disciplines: ['km_5', 'km_10'],
      editions: [{ year: 2027, raceDate: '2027-07-31', source: 'x', confirmedAt: '2026-09-02' }],
    })
    expect(findCatalogDuplicate(without, [withCity])?.id).toBe(
      'de-berlin-adidas-runners-city-night-berlin',
    )
  })

  it('keeps two different races that share a day, a city and a distance', () => {
    // The Berlin marathon weekend, which kills every simpler rule: both 5 km,
    // both in Berlin, both on the 26th, and two separate races.
    const generali = entry({
      id: 'de-berlin-generali-5k',
      name: 'GENERALI 5K im Rahmen des BMW BERLIN-MARATHON',
      disciplines: ['km_5'],
      editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    const r5k = entry({
      id: 'de-berlin-r5k-tour-finale',
      name: 'R5K Tour Finale',
      disciplines: ['km_5'],
      editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    expect(findCatalogDuplicate(r5k, [generali])).toBeNull()
  })

  it('keeps the marathon and the 5K that runs beside it apart', () => {
    const generali5k = entry({
      id: 'de-berlin-generali-5k',
      name: 'GENERALI 5K im Rahmen des BMW BERLIN-MARATHON',
      disciplines: ['km_5'],
      editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    expect(findCatalogDuplicate(generali5k, [curatedMarathon])).toBeNull()
  })

  it('needs the same day', () => {
    const harvested = entry({
      id: 'other-day',
      name: 'BMW BERLIN-MARATHON',
      editions: [{ year: 2027, raceDate: '2027-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    expect(findCatalogDuplicate(harvested, [curatedMarathon])).toBeNull()
  })

  it('needs the same city, and a race with no city matches nothing', () => {
    expect(
      findCatalogDuplicate(entry({ id: 'x', name: 'BMW BERLIN-MARATHON', city: 'Hamburg' }), [
        curatedMarathon,
      ]),
    ).toBeNull()
    expect(
      findCatalogDuplicate(entry({ id: 'y', name: 'BMW BERLIN-MARATHON', city: '' }), [
        entry({ id: 'z', name: 'Berlin Marathon', city: '' }),
      ]),
    ).toBeNull()
  })

  it('leaves a retired entry out of it', () => {
    expect(
      findCatalogDuplicate(entry({ id: 'new', name: 'BMW BERLIN-MARATHON' }), [
        { ...curatedMarathon, retired: true },
      ]),
    ).toBeNull()
  })

  it('does not let a scrape claim another scrape by review alone', () => {
    // Neither is reviewed, and the names share nothing: two races.
    const one = entry({ id: 'a', name: 'Volkslauf Prenzlauer Berg', disciplines: ['km_10'] })
    const two = entry({ id: 'b', name: 'Sparkassen Firmenlauf', disciplines: ['km_10'] })
    expect(findCatalogDuplicate(two, [one])).toBeNull()
  })
})

describe('findCatalogDuplicate, once an operator has answered', () => {
  it('never relinks a pair that was said to be two races', () => {
    const generali = entry({
      id: 'de-berlin-generali-5k',
      name: 'GENERALI 5K',
      disciplines: ['km_5'],
      notDuplicateOf: ['de-berlin-r5k-tour-finale'],
      editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    // Same name shape as the reviewed side, which would otherwise match.
    const r5k = entry({
      id: 'de-berlin-r5k-tour-finale',
      name: 'GENERALI 5K',
      review: 'reviewed',
      disciplines: ['km_5'],
      editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    expect(findCatalogDuplicate(generali, [r5k])).toBeNull()
  })

  it('does not point a copy at another copy', () => {
    const copy = { ...curatedMarathon, duplicateOfCatalogRaceId: 'somewhere-else' }
    expect(findCatalogDuplicate(entry({ id: 'new', name: 'BMW BERLIN-MARATHON' }), [copy])).toBeNull()
  })
})

describe('catalogDuplicateCandidates', () => {
  const one = entry({ id: 'a', name: 'Volkslauf Prenzlauer Berg', disciplines: ['km_10'] })
  const two = entry({ id: 'b', name: 'Sparkassen Firmenlauf', disciplines: ['km_10'] })

  it('asks about the pair no rule will merge on its own', () => {
    expect(catalogDuplicateCandidates([one, two])).toHaveLength(1)
  })

  it('says nothing about a pair the harvest already merges', () => {
    // A curated entry and its sponsored name: findCatalogDuplicate handles it,
    // so asking a person would be asking twice.
    const harvested = entry({ id: 'de-berlin-bmw-berlin-marathon', name: 'BMW BERLIN-MARATHON' })
    expect(catalogDuplicateCandidates([curatedMarathon, harvested])).toEqual([])
  })

  it('offers the entry a person stands behind as the survivor', () => {
    const withFee = entry({
      id: 'b',
      name: 'Sparkassen Firmenlauf',
      disciplines: ['km_10'],
      editions: [
        {
          year: 2026,
          raceDate: '2026-09-27',
          typicalFee: 25,
          feeCurrency: 'EUR',
          source: 's',
          confirmedAt: '2026-09-02',
        },
      ],
    })
    const [candidate] = catalogDuplicateCandidates([one, withFee])
    expect(candidate.keep.id).toBe('b')
    expect(candidate.drop.id).toBe('a')
  })

  it('drops a pair once it has been answered, either way', () => {
    expect(catalogDuplicateCandidates([one, { ...two, notDuplicateOf: ['a'] }])).toEqual([])
    expect(
      catalogDuplicateCandidates([one, { ...two, duplicateOfCatalogRaceId: 'a' }]),
    ).toEqual([])
  })

  it('asks about the two 5 km of the Berlin weekend, which is the point', () => {
    // No rule can tell these apart, so a person has to, and the queue is where
    // the question gets asked.
    const generali = entry({
      id: 'de-berlin-generali-5k',
      name: 'GENERALI 5K im Rahmen des BMW BERLIN-MARATHON',
      disciplines: ['km_5'],
      editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    const r5k = entry({
      id: 'de-berlin-r5k-tour-finale',
      name: 'R5K Tour Finale',
      disciplines: ['km_5'],
      editions: [{ year: 2026, raceDate: '2026-09-26', source: 's', confirmedAt: '2026-09-02' }],
    })
    expect(catalogDuplicateCandidates([generali, r5k])).toHaveLength(1)
  })

  it('reports each pair once', () => {
    const three = entry({ id: 'c', name: 'Lauf der Sympathie', disciplines: ['km_10'] })
    expect(catalogDuplicateCandidates([one, two, three])).toHaveLength(3)
  })
})
