import { describe, expect, it } from 'vitest'
import type { RaceCatalog, RaceCatalogEntry } from './types.js'
import {
  canAssertDates,
  editionForYear,
  editionReviewQueue,
  findCatalogRace,
  needsEditionReview,
  searchCatalogRaces,
} from './catalog.js'

function entry(overrides: Partial<RaceCatalogEntry> & Pick<RaceCatalogEntry, 'id'>): RaceCatalogEntry {
  return {
    name: 'Maratona do Porto',
    country: 'PT',
    city: 'Porto',
    disciplines: ['km_42_2'],
    entryMethod: 'lottery',
    review: 'reviewed',
    source: 'test',
    ...overrides,
  }
}

const catalog: RaceCatalog = {
  updatedAt: '2026-09-01',
  races: [
    entry({
      id: 'berlin-marathon',
      name: 'Berlin Marathon',
      country: 'DE',
      city: 'Berlin',
      typicalRaceMonth: 9,
      editions: [
        { year: 2026, raceDate: '2026-09-27', source: 'test', confirmedAt: '2026-09-01' },
      ],
    }),
    entry({
      id: 'copenhagen-half-marathon',
      name: 'Copenhagen Half Marathon',
      country: 'DK',
      city: 'Copenhagen',
      disciplines: ['km_21_1'],
      entryMethod: 'unknown',
      typicalRaceMonth: 9,
    }),
    entry({
      id: 'lisbon-half-marathon',
      name: 'Lisbon Half Marathon',
      city: 'Lisbon',
      disciplines: ['km_21_1'],
      entryMethod: 'first_come',
      typicalRaceMonth: 3,
      editions: [
        { year: 2027, raceDate: '2027-03-07', source: 'test', confirmedAt: '2026-09-01' },
      ],
    }),
  ],
}

describe('findCatalogRace', () => {
  it('finds by id and returns null for anything else', () => {
    expect(findCatalogRace(catalog.races, 'berlin-marathon')?.city).toBe('Berlin')
    expect(findCatalogRace(catalog.races, 'nope')).toBeNull()
  })
})

describe('searchCatalogRaces', () => {
  it('matches the name whatever the case and accents', () => {
    expect(searchCatalogRaces(catalog.races, 'BERLIN').map((race) => race.id)).toContain(
      'berlin-marathon',
    )
    expect(searchCatalogRaces(catalog.races, 'lisbon').map((race) => race.id)).toContain(
      'lisbon-half-marathon',
    )
  })

  it('matches the city as well as the name', () => {
    expect(searchCatalogRaces(catalog.races, 'copenhagen').map((race) => race.id)).toContain(
      'copenhagen-half-marathon',
    )
  })

  it('returns nothing for an empty query, rather than everything', () => {
    expect(searchCatalogRaces(catalog.races, '   ')).toEqual([])
  })

  it('honours the limit', () => {
    expect(searchCatalogRaces(catalog.races, 'marathon', 2)).toHaveLength(2)
  })
})

describe('canAssertDates', () => {
  it('is false for an entry nobody has checked', () => {
    expect(canAssertDates(entry({ id: 'x', review: 'unreviewed' }))).toBe(false)
  })

  it('is true once an entry is reviewed', () => {
    expect(canAssertDates(catalog.races[0]!)).toBe(true)
  })
})

describe('needsEditionReview', () => {
  it('is false while an edition is still ahead', () => {
    const lisbon = findCatalogRace(catalog.races, 'lisbon-half-marathon')!
    expect(needsEditionReview(lisbon, new Date('2026-09-01'))).toBe(false)
  })

  it('turns true the day after the last edition ran', () => {
    const lisbon = findCatalogRace(catalog.races, 'lisbon-half-marathon')!
    expect(needsEditionReview(lisbon, new Date('2027-03-08'))).toBe(true)
  })

  it('is true for an entry with no editions at all', () => {
    const copenhagen = findCatalogRace(catalog.races, 'copenhagen-half-marathon')!
    expect(needsEditionReview(copenhagen, new Date('2026-09-01'))).toBe(true)
  })
})

describe('editionReviewQueue', () => {
  it('holds only what has no edition ahead of it', () => {
    const queue = editionReviewQueue(catalog.races, new Date('2026-09-01'))
    expect(queue.map((race) => race.id)).toEqual(['copenhagen-half-marathon'])
  })

  it('takes a race in the day after it runs', () => {
    // Berlin ran on the 27th, so on the 28th it needs next year's dates. Lisbon
    // is still ahead and stays out.
    const queue = editionReviewQueue(catalog.races, new Date('2026-09-28'))
    expect(queue.map((race) => race.id)).toEqual([
      'berlin-marathon',
      'copenhagen-half-marathon',
    ])
  })

  it('orders by the month that comes round soonest, not by how long ago it ran', () => {
    // In April: September is five months away, March is eleven. Lisbon ran most
    // recently and is still last, because the queue is a calendar.
    const queue = editionReviewQueue(catalog.races, new Date('2027-04-01'))
    expect(queue.map((race) => race.id)).toEqual([
      'berlin-marathon',
      'copenhagen-half-marathon',
      'lisbon-half-marathon',
    ])
  })

  it('leaves out what has an edition ahead of it', () => {
    const queue = editionReviewQueue(catalog.races, new Date('2026-09-01'))
    expect(queue.map((race) => race.id)).not.toContain('lisbon-half-marathon')
  })
})

describe('editionForYear', () => {
  it('finds the year, or null', () => {
    const berlin = findCatalogRace(catalog.races, 'berlin-marathon')!
    expect(editionForYear(berlin, 2026)?.raceDate).toBe('2026-09-27')
    expect(editionForYear(berlin, 2028)).toBeNull()
    expect(editionForYear(entry({ id: 'x' }), 2026)).toBeNull()
  })
})
