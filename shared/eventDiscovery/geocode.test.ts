import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../raceCatalog/types'
import { placeQueryFor, racesNeedingPlace, readPlace } from './geocode'

function entry(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'de-berlin-run',
    name: 'Berlin Run',
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_10'],
    entryMethod: 'first_come',
    review: 'unreviewed',
    source: 'runme.de',
    producer: 'harvest',
    ...overrides,
  }
}

describe('placeQueryFor', () => {
  it('asks about the town and the country, which is all the catalog has', () => {
    expect(placeQueryFor(entry())).toEqual({ text: 'Berlin', country: 'de' })
  })

  it('asks nothing without a town, or with the country the catalog uses for none', () => {
    expect(placeQueryFor(entry({ city: '' }))).toBeNull()
    expect(placeQueryFor(entry({ country: 'XX' }))).toBeNull()
  })
})

describe('readPlace', () => {
  it('takes the first answer', () => {
    expect(readPlace({ results: [{ lat: 52.52, lon: 13.4 }, { lat: 0, lon: 0 }] })).toEqual({
      latitude: 52.52,
      longitude: 13.4,
    })
  })

  it('refuses an answer that is not a place', () => {
    expect(readPlace({ results: [] })).toBeNull()
    expect(readPlace({ results: [{ lat: 'x', lon: 13.4 }] })).toBeNull()
    expect(readPlace({ results: [{ lat: 91, lon: 13.4 }] })).toBeNull()
    expect(readPlace(undefined)).toBeNull()
  })
})

describe('racesNeedingPlace', () => {
  it('takes the live entries with no coordinates', () => {
    const found = racesNeedingPlace(
      [
        entry({ id: 'has-one', latitude: 52.5, longitude: 13.4 }),
        entry({ id: 'retired', retired: true }),
        entry({ id: 'a-copy', duplicateOfCatalogRaceId: 'de-berlin-run' }),
        entry({ id: 'wanted' }),
      ],
      10,
    )

    expect(found.map((race) => race.id)).toEqual(['wanted'])
  })

  it('asks about the ones never asked about before the ones that answered nothing', () => {
    const found = racesNeedingPlace(
      [
        entry({ id: 'asked-yesterday', placeReadAt: '2026-09-24' }),
        entry({ id: 'never-asked' }),
        entry({ id: 'asked-in-june', placeReadAt: '2026-06-01' }),
      ],
      2,
    )

    expect(found.map((race) => race.id)).toEqual(['never-asked', 'asked-in-june'])
  })
})
