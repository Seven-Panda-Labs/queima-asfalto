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
  // A pair that shares a word without the names agreeing: "rathaus" and
  // "center" in both, and neither name inside the other.
  const one = entry({ id: 'a', name: 'Dessauer Rathaus-Center City RUN', disciplines: ['km_10'] })
  const two = entry({ id: 'b', name: '27. Rathaus-Center CityRUN', disciplines: ['km_10'] })

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
      name: '27. Rathaus-Center CityRUN',
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

  it('does not ask about the two 5 km of the Berlin weekend', () => {
    // It used to, and with a hundred entries that was a fair question. At
    // catalog scale it is noise: they share a Saturday and a town and nothing
    // else, and the answer was always "two races".
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
    expect(catalogDuplicateCandidates([generali, r5k])).toEqual([])
  })

  it('reports each pair once', () => {
    const three = entry({ id: 'c', name: 'Rathaus-Center Lauf', disciplines: ['km_10'] })
    expect(catalogDuplicateCandidates([one, two, three])).toHaveLength(3)
  })
})

describe('the pairs a runner found in the catalog', () => {
  function real(
    name: string,
    city: string,
    day: string,
    disciplines: string[],
  ): RaceCatalogEntry {
    return entry({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      city,
      disciplines: disciplines as RaceCatalogEntry['disciplines'],
      editions: [{ year: 2026, raceDate: day, source: 'x', confirmedAt: '2026-09-04' }],
    })
  }

  it('merges a race whose distance one source leaves out', () => {
    // Side by side in production: running.life publishes no distance for it,
    // runme.de publishes the 5 km. Not knowing a distance is not knowing a
    // different one.
    const bare = real('Birkenfelder Firmenlauf', 'Birkenfeld', '2026-09-05', [])
    const full = real(
      'Birkenfelder Firmenlauf - Die Wirtschaft läuft',
      'Birkenfeld',
      '2026-09-05',
      ['km_5'],
    )
    expect(findCatalogDuplicate(full, [bare])?.id).toBe(bare.id)
    expect(findCatalogDuplicate(bare, [full])?.id).toBe(full.id)
  })

  it('merges the pairs whose names carry a suffix', () => {
    const pairs: [RaceCatalogEntry, RaceCatalogEntry][] = [
      [
        real('WILDMAN Harz', 'Wildemann', '2026-09-05', ['km_50']),
        real('Wildman Harz - Ultra 55k', 'Wildemann', '2026-09-05', ['km_50']),
      ],
      [
        real('Tannen-Cross-Lauf Demmin', 'Demmin', '2026-09-05', ['km_10']),
        real('Tannen-Cross-Lauf der Hansestadt Demmin', 'Demmin', '2026-09-05', ['km_5', 'km_10']),
      ],
      [
        real('Neckarsteiglauf', 'Heidelberg', '2026-09-11', ['km_50', 'km_100']),
        real('Neckarsteiglauf 126K', 'Heidelberg', '2026-09-11', ['km_50', 'km_100']),
      ],
    ]
    for (const [left, right] of pairs) {
      expect(findCatalogDuplicate(right, [left])).not.toBeNull()
    }
  })

  it('leaves two races that share a town and a day alone', () => {
    // A half plus an hour run, and a quarter of an hour run. Two races.
    const half = real('Zwickauer Halb- und Stundenlauf', 'Zwickau', '2026-09-09', [])
    const quarter = real('Zwickauer Viertelstundenlauf', 'Zwickau', '2026-09-09', [])
    expect(findCatalogDuplicate(quarter, [half])).toBeNull()
  })

  it('leaves the doubtful pair to a person', () => {
    // Same day, and a town written two ways: "Dessau" and "Dessau-Roßlau".
    // The queue in the admin area is where this gets decided.
    const one = real('Dessauer Rathaus-Center City RUN', 'Dessau', '2026-09-13', ['km_5'])
    const two = real('27. Rathaus-Center CityRUN', 'Dessau-Roßlau', '2026-09-13', ['km_5'])
    expect(findCatalogDuplicate(two, [one])).toBeNull()
  })
})

describe('catalogDuplicateCandidates at catalog scale', () => {
  function berlin(name: string, disciplines: string[] = ['km_10']) {
    return entry({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      city: 'Berlin',
      disciplines: disciplines as RaceCatalogEntry['disciplines'],
      editions: [{ year: 2026, raceDate: '2026-09-05', source: 'x', confirmedAt: '2026-09-04' }],
    })
  }

  it('stops asking about races that only share a town and a day', () => {
    // Real pairs from a 3000 entry catalog: one Saturday in Berlin holds a
    // dozen unrelated races, and every combination of them was a question.
    const pairs = catalogDuplicateCandidates([
      berlin('Bierpaarlauf'),
      berlin('Gravel Run Berlin'),
      berlin('Hohenschönhausener Gartenlauf'),
    ])
    expect(pairs).toEqual([])
  })

  it('still asks when the names share a word of their own', () => {
    const pairs = catalogDuplicateCandidates([
      berlin('Dessauer Rathaus-Center City RUN'),
      berlin('27. Rathaus-Center CityRUN'),
    ])
    expect(pairs).toHaveLength(1)
  })

  it('does not count the town as that word', () => {
    expect(
      catalogDuplicateCandidates([berlin('Berliner Volkslauf'), berlin('Berlin Gravel Run')]),
    ).toEqual([])
  })
})

describe('the town inside the name', () => {
  function named(name: string, city: string) {
    return entry({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      city,
      disciplines: ['km_10'],
      editions: [{ year: 2026, raceDate: '2026-09-05', source: 'x', confirmedAt: '2026-09-04' }],
    })
  }

  it('merges a race whose town moved to the front, as an adjective', () => {
    // Real pairs from the catalog, three of them at once.
    for (const [left, right, city] of [
      ['28. Erfurter Zooparklauf', 'Zooparklauf Erfurt', 'Erfurt'],
      ['Hochheimer Weinbergslauf', '22. Weinbergslauf Hochheim', 'Hochheim am Main'],
      ['Ippesheimer Weinparadieslauf', 'Weinparadieslauf Ippesheim', 'Ippesheim'],
    ] as const) {
      expect(findCatalogDuplicate(named(right, city), [named(left, city)])).not.toBeNull()
    }
  })

  it('keeps the half and the full marathon of one organiser apart', () => {
    // "Haspa Halbmarathon Hamburg" and "Haspa Marathon Hamburg" are two races,
    // and dropping the town does not make them one.
    const half = named('Haspa Halbmarathon Hamburg', 'Hamburg')
    const full = named('Haspa Marathon Hamburg', 'Hamburg')
    expect(findCatalogDuplicate(full, [half])).toBeNull()
  })

  it('keeps two parkruns in one city apart', () => {
    const one = named('Alstervorland parkrun Hamburg', 'Hamburg')
    const two = named('Krupunder See parkrun Hamburg', 'Hamburg')
    expect(findCatalogDuplicate(two, [one])).toBeNull()
  })
})

describe('the same name written differently', () => {
  function named(name: string, city: string) {
    return entry({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      city,
      disciplines: ['km_10'],
      editions: [{ year: 2026, raceDate: '2026-09-05', source: 'x', confirmedAt: '2026-09-04' }],
    })
  }

  it('merges a name whose words were split or joined', () => {
    for (const [left, right, city] of [
      ['Meppener Sparkassen Citylauf', '39. Sparkassen-City-Lauf Meppen', 'Meppen'],
      ['Dessauer Rathaus-Center City RUN', '27. Rathaus-Center CityRUN', 'Dessau'],
      ['Phoenix-InWest-Neujahrslauf Dortmund', '15. PhoenixInWest Neujahrslauf', 'Dortmund'],
    ] as const) {
      expect(findCatalogDuplicate(named(right, city), [named(left, city)])).not.toBeNull()
    }
  })

  it('does not merge a word that merely contains another', () => {
    // The Zwickau pair again, from the other direction: same letters in the
    // middle, different races.
    const hour = named('Stundenlauf', 'Zwickau')
    const quarter = named('Viertelstundenlauf', 'Zwickau')
    expect(findCatalogDuplicate(quarter, [hour])).toBeNull()
  })
})

describe('what counts as evidence for the queue', () => {
  function named(name: string, city: string) {
    return entry({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      city,
      disciplines: ['km_5'],
      editions: [{ year: 2026, raceDate: '2026-09-05', source: 'x', confirmedAt: '2026-09-04' }],
    })
  }

  it('does not ask about races that share only a word every race has', () => {
    // Real pairs from the American half of the catalog.
    for (const [left, right, city] of [
      ['Turkey Trails OKC', 'Veterans Voyage OKC', 'Oklahoma City'],
      ['Hunger Run', 'Huff and Cuff Fitness Run/Walk', 'Toledo'],
      ['Bay Ridge Half Marathon', 'Brooklyn Greenway Half', 'New York'],
      ['Dempsey Dash 5K and 1k Fun Run', "Joey's Wings 5K & Kids Obstacle Run", 'Ashburn'],
    ] as const) {
      expect(catalogDuplicateCandidates([named(left, city), named(right, city)])).toEqual([])
    }
  })

  it('still merges the pair whose shared word is the race', () => {
    // The generic list is the queue's business only: the merge rule must keep
    // reading every word, or "Haspa Halbmarathon" and "Haspa Marathon" become
    // one race.
    const half = named('Haspa Halbmarathon Hamburg', 'Hamburg')
    const full = named('Haspa Marathon Hamburg', 'Hamburg')
    expect(findCatalogDuplicate(full, [half])).toBeNull()
  })
})
