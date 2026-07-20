import { describe, expect, it } from 'vitest'
import {
  getParkrunEventBySlug,
  getParkrunEventsBySlugs,
  searchParkrunEvents,
  type ParkrunCatalog,
} from './catalog'

const catalog: ParkrunCatalog = {
  syncedAt: '2026-07-19',
  events: [
    {
      id: 1,
      slug: 'hasenheide',
      shortName: 'Hasenheide',
      longName: 'Hasenheide parkrun',
      location: 'Hasenheide Park, Berlin',
      countryCode: 32,
      countryUrl: 'https://www.parkrun.com.de',
      seriesId: 1,
      lat: 52.48,
      lng: 13.41,
    },
    {
      id: 2,
      slug: 'bushy',
      shortName: 'Bushy Park',
      longName: 'Bushy Park parkrun',
      location: 'Teddington',
      countryCode: 97,
      countryUrl: 'https://www.parkrun.org.uk',
      seriesId: 1,
      lat: 51.41,
      lng: -0.33,
    },
  ],
}

describe('parkrun catalog', () => {
  it('finds event by slug', () => {
    expect(getParkrunEventBySlug(catalog, 'hasenheide')?.shortName).toBe('Hasenheide')
  })

  it('searches by name and location', () => {
    expect(searchParkrunEvents(catalog, 'berlin hasen')[0]?.slug).toBe('hasenheide')
  })

  it('returns favorites in order', () => {
    expect(getParkrunEventsBySlugs(catalog, ['bushy', 'hasenheide']).map((e) => e.slug)).toEqual([
      'bushy',
      'hasenheide',
    ])
  })
})
