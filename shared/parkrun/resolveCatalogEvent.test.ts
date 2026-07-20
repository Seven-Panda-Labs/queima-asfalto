import { describe, expect, it } from 'vitest'
import type { ParkrunCatalog } from './catalog'
import { resolveParkrunCatalogEvent } from './resolveCatalogEvent'

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
      slug: 'centenary',
      shortName: 'Centenary',
      longName: 'Centenary parkrun',
      location: 'Centenary Park',
      countryCode: 3,
      countryUrl: 'https://www.parkrun.com.au',
      seriesId: 1,
      lat: -27.55,
      lng: 153.02,
    },
    {
      id: 3,
      slug: 'centennial',
      shortName: 'Centennial',
      longName: 'Centennial parkrun',
      location: 'Centennial Park',
      countryCode: 3,
      countryUrl: 'https://www.parkrun.com.au',
      seriesId: 1,
      lat: -33.89,
      lng: 151.23,
    },
  ],
}

describe('resolveParkrunCatalogEvent', () => {
  it('resolves by slug derived from event name', () => {
    const result = resolveParkrunCatalogEvent(catalog, { name: 'Hasenheide parkrun' })
    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.event.slug).toBe('hasenheide')
      expect(result.method).toBe('slug')
    }
  })

  it('resolves by results url slug', () => {
    const result = resolveParkrunCatalogEvent(catalog, {
      name: 'Wrong label',
      resultsUrl: 'https://www.parkrun.com.de/hasenheide/results/latestresults/',
    })
    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.event.slug).toBe('hasenheide')
    }
  })

  it('disambiguates by proximity when search has multiple matches', () => {
    const result = resolveParkrunCatalogEvent(catalog, {
      name: 'Cent parkrun',
      locationLat: -27.55,
      locationLng: 153.02,
    })
    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.event.slug).toBe('centenary')
      expect(result.method).toBe('proximity')
    }
  })

  it('resolves parkrun from numbered VR combo titles', () => {
    const result = resolveParkrunCatalogEvent(catalog, {
      name: '1. ParkRun Hasenheide\n2. VR: North America Challenge',
      locationLat: 52.48,
      locationLng: 13.41,
    })
    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.event.slug).toBe('hasenheide')
    }
  })

  it('resolves parkrun when milestone note is in the name', () => {
    const result = resolveParkrunCatalogEvent(catalog, {
      name: 'Parkrun Hasenheide *25th*',
    })
    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.event.slug).toBe('hasenheide')
    }
  })
})
