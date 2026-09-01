import { describe, expect, it } from 'vitest'
import seed from '../../src/data/race-catalog.json'
import { EVENT_TYPES } from '../../src/domain/eventCodes.js'
import {
  CATALOG_REVIEW_STATES,
  RACE_ENTRY_METHODS,
  type RaceCatalog,
} from './types.js'
import {
  canAssertDates,
  editionForYear,
  editionReviewQueue,
  findCatalogRace,
  needsEditionReview,
  searchCatalogRaces,
} from './catalog.js'

const catalog = seed as RaceCatalog

describe('the committed seed', () => {
  it('is a catalog with a date and races in it', () => {
    expect(catalog.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(catalog.races.length).toBeGreaterThan(0)
  })

  it('gives every entry a unique id', () => {
    const ids = catalog.races.map((race) => race.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('keeps every field inside what the type allows', () => {
    for (const race of catalog.races) {
      expect(race.name.length).toBeGreaterThan(0)
      expect(race.city.length).toBeGreaterThan(0)
      expect(race.country).toMatch(/^[A-Z]{2}$/)
      expect(race.disciplines.length).toBeGreaterThan(0)
      for (const discipline of race.disciplines) {
        expect(EVENT_TYPES).toContain(discipline)
      }
      expect(RACE_ENTRY_METHODS).toContain(race.entryMethod)
      expect(CATALOG_REVIEW_STATES).toContain(race.review)
      expect(race.source.length).toBeGreaterThan(0)
      if (race.typicalRaceMonth !== undefined) {
        expect(race.typicalRaceMonth).toBeGreaterThanOrEqual(1)
        expect(race.typicalRaceMonth).toBeLessThanOrEqual(12)
      }
      for (const url of [race.officialUrl, race.registrationUrl]) {
        if (url !== undefined) expect(url).toMatch(/^https:\/\//)
      }
      for (const edition of race.editions ?? []) {
        expect(edition.year).toBeGreaterThan(2000)
        if (edition.raceDate !== undefined) expect(edition.raceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        if (edition.typicalFee !== undefined) {
          expect(edition.typicalFee).toBeGreaterThan(0)
          // A number with no currency is not a price.
          expect(edition.feeCurrency).toMatch(/^[A-Z]{3}$/)
        }
        // Provenance per edition, not inherited from the entry.
        expect(edition.source.length).toBeGreaterThan(0)
        expect(edition.confirmedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        for (const gate of [
          edition.registrationOpensAt,
          edition.registrationClosesAt,
          edition.lotteryDrawAt,
        ]) {
          // A day when only the day is published, an instant when the hour is.
          if (gate !== undefined) expect(gate).toMatch(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}Z)?$/)
        }
      }
    }
  })

  it('claims nothing that has not been reviewed', () => {
    // The rule the review state exists for: an entry nobody checked has no dates
    // for anything to act on. Promoting one to reviewed is a deliberate PR.
    for (const race of catalog.races) {
      if (race.review === 'unreviewed') {
        expect(race.editions ?? []).toHaveLength(0)
      }
    }
  })
})

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
    expect(searchCatalogRaces(catalog.races, 'cape town').map((race) => race.id)).toContain(
      'two-oceans-half-marathon',
    )
  })

  it('returns nothing for an empty query, rather than everything', () => {
    expect(searchCatalogRaces(catalog.races, '   ')).toEqual([])
  })

  it('honours the limit', () => {
    expect(searchCatalogRaces(catalog.races, 'marathon', 3)).toHaveLength(3)
  })
})

describe('canAssertDates', () => {
  it('is false for an entry nobody has checked', () => {
    const unreviewed = catalog.races.find((race) => race.review === 'unreviewed')!
    expect(canAssertDates(unreviewed)).toBe(false)
  })

  it('is true once an entry is reviewed', () => {
    expect(canAssertDates({ ...catalog.races[0]!, review: 'reviewed' })).toBe(true)
  })
})

describe('needsEditionReview', () => {
  const entry = {
    ...catalog.races[0]!,
    review: 'reviewed' as const,
    editions: [
      {
        year: 2027,
        raceDate: '2027-03-07',
        source: 'test',
        confirmedAt: '2026-09-01',
      },
    ],
  }

  it('is false while an edition is still ahead', () => {
    expect(needsEditionReview(entry, new Date('2026-09-01'))).toBe(false)
  })

  it('turns true the day after the last edition ran', () => {
    expect(needsEditionReview(entry, new Date('2027-03-08'))).toBe(true)
  })

  it('is true for an entry with no editions at all', () => {
    expect(needsEditionReview({ ...entry, editions: [] }, new Date('2026-09-01'))).toBe(true)
  })
})

describe('editionReviewQueue', () => {
  it('puts the races whose month comes round soonest first', () => {
    const queue = editionReviewQueue(catalog.races, new Date('2026-09-01'))
    const months = queue.map((race) => race.typicalRaceMonth)
    expect(months[0]).toBe(9)
    expect(queue.every((race) => needsEditionReview(race, new Date('2026-09-01')))).toBe(true)
  })

  it('leaves out what has an edition ahead of it', () => {
    const queue = editionReviewQueue(catalog.races, new Date('2026-09-01'))
    expect(queue.map((race) => race.id)).not.toContain('tokyo-marathon')
  })
})

describe('editionForYear', () => {
  it('finds the year, or null', () => {
    const race = {
      ...catalog.races[0]!,
      editions: [
        { year: 2027, raceDate: '2027-03-07', source: 'test', confirmedAt: '2026-09-01' },
      ],
    }
    expect(editionForYear(race, 2027)?.raceDate).toBe('2027-03-07')
    expect(editionForYear(race, 2028)).toBeNull()
    expect(editionForYear({ ...catalog.races[0]!, editions: [] }, 2027)).toBeNull()
  })
})
