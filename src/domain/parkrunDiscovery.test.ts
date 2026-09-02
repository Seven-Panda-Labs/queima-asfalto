import { describe, expect, it } from 'vitest'
import type { ParkrunCatalogEvent } from '../../shared/parkrun/catalog'
import {
  nearbyParkruns,
  nextParkrunDate,
  referencePoints,
} from './parkrunDiscovery'

function event(overrides: Partial<ParkrunCatalogEvent> & Pick<ParkrunCatalogEvent, 'slug'>): ParkrunCatalogEvent {
  return {
    id: 1,
    shortName: overrides.slug,
    longName: `${overrides.slug} parkrun`,
    location: 'Lisboa',
    countryCode: 174,
    countryUrl: 'www.parkrun.com.pt',
    seriesId: 1,
    lat: 38.7,
    lng: -9.14,
    ...overrides,
  }
}

/** Lisbon, Oeiras, and one in London. */
const catalog = [
  event({ slug: 'lisboa', lat: 38.7223, lng: -9.1393 }),
  event({ slug: 'oeiras', lat: 38.6866, lng: -9.3106, location: 'Oeiras' }),
  event({ slug: 'bushy', lat: 51.4106, lng: -0.3357, location: 'London', longName: 'Bushy parkrun' }),
]

describe('nextParkrunDate', () => {
  it('is the coming Saturday, at nine', () => {
    const date = nextParkrunDate(new Date(2026, 8, 2, 15, 30))
    expect(date.getDay()).toBe(6)
    expect([date.getDate(), date.getMonth(), date.getHours()]).toEqual([5, 8, 9])
  })

  it('is today when today is Saturday', () => {
    const date = nextParkrunDate(new Date(2026, 8, 5, 7, 0))
    expect(date.getDate()).toBe(5)
  })

  it('crosses a month without help', () => {
    expect(nextParkrunDate(new Date(2026, 8, 29)).getMonth()).toBe(9)
  })
})

describe('referencePoints', () => {
  it('takes the coordinates of the runner s own parkruns', () => {
    expect(referencePoints(catalog, ['oeiras'])).toEqual([{ lat: 38.6866, lng: -9.3106 }])
  })

  it('ignores a slug the catalog does not know', () => {
    expect(referencePoints(catalog, ['gone', ''])).toEqual([])
  })
})

describe('nearbyParkruns', () => {
  const fromLisbon = [{ lat: 38.7223, lng: -9.1393 }]

  it('is nearest first, with the distance', () => {
    const found = nearbyParkruns(catalog, fromLisbon)

    expect(found.slice(0, 2).map((candidate) => candidate.event.slug)).toEqual([
      'lisboa',
      'oeiras',
    ])
    expect(found[0]!.distanceKm).toBeCloseTo(0, 1)
    expect(found[1]!.distanceKm).toBeGreaterThan(10)
    // London is last from Lisbon, not hidden: parkrun does not operate
    // everywhere, and the nearest one to Lisbon really is 441 km away.
    expect(found.at(-1)!.event.slug).toBe('bushy')
    expect(found.at(-1)!.distanceKm).toBeGreaterThan(1500)
  })

  it('leaves out the junior parkruns, which are 2 km for children', () => {
    const withJunior = [
      ...catalog,
      event({ slug: 'oeiras-junior', seriesId: 2, lat: 38.6866, lng: -9.3106 }),
    ]
    const found = nearbyParkruns(withJunior, fromLisbon)
    expect(found.map((candidate) => candidate.event.slug)).not.toContain('oeiras-junior')
  })

  it('measures from whichever home is closest, for somebody with two', () => {
    const found = nearbyParkruns(catalog, [
      { lat: 38.7223, lng: -9.1393 },
      { lat: 51.4106, lng: -0.3357 },
    ])
    expect(found.map((candidate) => candidate.event.slug)).toContain('bushy')
    expect(found.find((candidate) => candidate.event.slug === 'bushy')!.distanceKm).toBeCloseTo(0, 1)
  })

  it('lets a typed place win over the radius', () => {
    const found = nearbyParkruns(catalog, fromLisbon, { place: 'bushy' })
    expect(found.map((candidate) => candidate.event.slug)).toEqual(['bushy'])
  })

  it('searches by town as well as by name', () => {
    expect(nearbyParkruns(catalog, fromLisbon, { place: 'london' })[0]!.event.slug).toBe('bushy')
  })

  it('offers nothing with no reference and no search: two thousand events is not an answer', () => {
    expect(nearbyParkruns(catalog, [])).toEqual([])
    expect(nearbyParkruns(catalog, [], { place: 'oeiras' })).toHaveLength(1)
  })

  it('caps the list', () => {
    const many = Array.from({ length: 20 }, (_, index) =>
      event({ slug: `p${index}`, lat: 38.7 + index / 1000, lng: -9.14 }),
    )
    expect(nearbyParkruns(many, fromLisbon, { limit: 3 })).toHaveLength(3)
  })
})
