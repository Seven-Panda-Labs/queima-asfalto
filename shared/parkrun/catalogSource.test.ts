import { describe, expect, it } from 'vitest'
import {
  catalogSyncDate,
  isAcceptableRefresh,
  isSyncedCatalogFresh,
  newerCatalog,
  normalizeParkrunCatalog,
  type RawParkrunEventsJson,
} from './catalogSource'
import type { ParkrunCatalog } from './catalog'

function rawFeed(
  overrides: Partial<RawParkrunEventsJson> = {},
): RawParkrunEventsJson {
  return {
    countries: {
      32: { url: 'www.parkrun.com.de' },
      97: { url: 'www.parkrun.org.uk' },
      // parkrun ships country entries with no url for territories that have no
      // site yet; their events must not land in the catalog.
      3: { url: undefined },
    },
    events: {
      features: [
        {
          id: 2,
          properties: {
            eventname: 'bushy',
            EventLongName: 'Bushy Park parkrun',
            EventShortName: 'Bushy Park',
            EventLocation: 'Teddington',
            countrycode: 97,
            seriesid: 1,
          },
          geometry: { coordinates: [-0.335, 51.41] },
        },
        {
          id: 1,
          properties: {
            eventname: 'hasenheide',
            EventLongName: 'Aa Hasenheide parkrun',
            EventShortName: 'Hasenheide',
            EventLocation: 'Berlin',
            countrycode: 32,
            seriesid: 1,
          },
          geometry: { coordinates: [13.41, 52.48] },
        },
      ],
    },
    ...overrides,
  }
}

describe('normalizeParkrunCatalog', () => {
  it('maps the upstream feed onto the catalog shape', () => {
    const catalog = normalizeParkrunCatalog(rawFeed(), '2026-08-29')

    expect(catalog.syncedAt).toBe('2026-08-29')
    expect(catalog.events).toHaveLength(2)
    expect(catalog.events[1]).toEqual({
      id: 2,
      slug: 'bushy',
      shortName: 'Bushy Park',
      longName: 'Bushy Park parkrun',
      location: 'Teddington',
      countryCode: 97,
      countryUrl: 'https://www.parkrun.org.uk',
      seriesId: 1,
      lat: 51.41,
      lng: -0.335,
    })
  })

  it('sorts by long name so the committed catalog diffs stay readable', () => {
    const catalog = normalizeParkrunCatalog(rawFeed(), '2026-08-29')

    expect(catalog.events.map((event) => event.slug)).toEqual(['hasenheide', 'bushy'])
  })

  it('drops events whose country has no parkrun site', () => {
    const feed = rawFeed()
    feed.events!.features!.push({
      id: 3,
      properties: {
        eventname: 'nowhere',
        EventLongName: 'Nowhere parkrun',
        EventShortName: 'Nowhere',
        EventLocation: 'Nowhere',
        countrycode: 3,
        seriesid: 1,
      },
      geometry: { coordinates: [0, 0] },
    })

    const catalog = normalizeParkrunCatalog(feed, '2026-08-29')

    expect(catalog.events.map((event) => event.slug)).not.toContain('nowhere')
  })

  it('drops events missing coordinates instead of emitting NaN', () => {
    const feed = rawFeed()
    feed.events!.features!.push({
      id: 4,
      properties: {
        eventname: 'noplace',
        EventLongName: 'No Place parkrun',
        EventShortName: 'No Place',
        EventLocation: 'Somewhere',
        countrycode: 97,
        seriesid: 1,
      },
      geometry: {},
    })

    const catalog = normalizeParkrunCatalog(feed, '2026-08-29')

    expect(catalog.events.map((event) => event.slug)).not.toContain('noplace')
  })

  it('returns an empty catalog for an empty feed rather than throwing', () => {
    expect(normalizeParkrunCatalog({}, '2026-08-29')).toEqual({
      syncedAt: '2026-08-29',
      events: [],
    })
  })
})

describe('isAcceptableRefresh', () => {
  it('accepts a normal refresh', () => {
    expect(isAcceptableRefresh(2968, 2965)).toEqual({ accepted: true })
  })

  it('accepts the first sync of an empty project', () => {
    expect(isAcceptableRefresh(2968, null)).toEqual({ accepted: true })
    expect(isAcceptableRefresh(2968, 0)).toEqual({ accepted: true })
  })

  it('accepts modest shrinkage, since parkrun retires events', () => {
    expect(isAcceptableRefresh(2900, 2965)).toEqual({ accepted: true })
  })

  it('refuses a collapse that would gut a good catalog', () => {
    const decision = isAcceptableRefresh(100, 2965)

    expect(decision.accepted).toBe(false)
    expect(decision).toMatchObject({ reason: expect.stringContaining('2965') })
  })

  it('refuses an empty result even with nothing stored', () => {
    expect(isAcceptableRefresh(0, null).accepted).toBe(false)
  })
})

describe('catalogSyncDate', () => {
  it('formats as a UTC calendar day', () => {
    expect(catalogSyncDate(new Date('2026-08-29T23:30:00Z'))).toBe('2026-08-29')
  })
})

function catalogOn(syncedAt: string, eventCount = 2): ParkrunCatalog {
  return {
    syncedAt,
    events: Array.from({ length: eventCount }, (_unused, index) => ({
      id: index,
      slug: `event-${index}`,
      shortName: `Event ${index}`,
      longName: `Event ${index} parkrun`,
      location: 'Somewhere',
      countryCode: 97,
      countryUrl: 'https://www.parkrun.org.uk',
      seriesId: 1,
      lat: 0,
      lng: 0,
    })),
  }
}

describe('isSyncedCatalogFresh', () => {
  const now = new Date('2026-08-29T10:00:00Z')

  it('trusts a catalog synced this week', () => {
    expect(isSyncedCatalogFresh('2026-08-24', 2968, now)).toBe(true)
  })

  it('tolerates a single missed weekly run', () => {
    expect(isSyncedCatalogFresh('2026-08-15', 2968, now)).toBe(true)
  })

  it('gives up on a catalog left stale for months', () => {
    expect(isSyncedCatalogFresh('2026-05-01', 2968, now)).toBe(false)
  })

  it('rejects a missing, unparseable, or empty catalog', () => {
    expect(isSyncedCatalogFresh(undefined, 2968, now)).toBe(false)
    expect(isSyncedCatalogFresh('not-a-date', 2968, now)).toBe(false)
    expect(isSyncedCatalogFresh('2026-08-24', 0, now)).toBe(false)
  })

  it('rejects a future date, which means a clock is wrong somewhere', () => {
    expect(isSyncedCatalogFresh('2026-09-30', 2968, now)).toBe(false)
  })
})

describe('newerCatalog', () => {
  it('prefers the synced catalog when it is at least as new', () => {
    expect(newerCatalog(catalogOn('2026-08-24'), catalogOn('2026-08-01')).syncedAt).toBe(
      '2026-08-24',
    )
  })

  it('falls back to a freshly released seed when the sync has stalled', () => {
    expect(newerCatalog(catalogOn('2026-05-01'), catalogOn('2026-08-28')).syncedAt).toBe(
      '2026-08-28',
    )
  })

  it('uses the seed when nothing has synced', () => {
    expect(newerCatalog(null, catalogOn('2026-08-28')).syncedAt).toBe('2026-08-28')
    expect(newerCatalog(catalogOn('2026-08-29', 0), catalogOn('2026-08-01')).syncedAt).toBe(
      '2026-08-01',
    )
  })
})
