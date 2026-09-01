import { describe, expect, it } from 'vitest'
import { EVENT_TYPES } from '../../src/domain/eventCodes.js'
import {
  CATALOG_REVIEW_STATES,
  RACE_ENTRY_METHODS,
} from '../../shared/raceCatalog/types.js'
import { SEED_RACES } from './raceCatalogSeed.js'

/**
 * The bootstrap list is data, and data written by hand needs a guard. This is the
 * schema test that used to sit on the committed catalog, moved to where the data
 * moved: a malformed entry breaks CI rather than being written into an instance.
 */
describe('the bootstrap race list', () => {
  it('gives every entry a unique kebab-case id', () => {
    const ids = SEED_RACES.map((race) => race.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('keeps every field inside what the type allows', () => {
    for (const race of SEED_RACES) {
      expect(race.name.length).toBeGreaterThan(0)
      expect(race.city.length).toBeGreaterThan(0)
      expect(race.country).toMatch(/^[A-Z]{2}$/)
      expect(race.disciplines.length).toBeGreaterThan(0)
      for (const discipline of race.disciplines) expect(EVENT_TYPES).toContain(discipline)
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
    }
  })

  it('gives every edition its own provenance and plausible dates', () => {
    for (const race of SEED_RACES) {
      for (const edition of race.editions ?? []) {
        expect(edition.year).toBeGreaterThan(2000)
        expect(edition.source.length).toBeGreaterThan(0)
        expect(edition.confirmedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        if (edition.raceDate !== undefined) expect(edition.raceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        for (const gate of [
          edition.registrationOpensAt,
          edition.registrationClosesAt,
          edition.lotteryDrawAt,
        ]) {
          if (gate !== undefined) expect(gate).toMatch(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}Z)?$/)
        }
        if (edition.typicalFee !== undefined) {
          expect(edition.typicalFee).toBeGreaterThan(0)
          expect(edition.feeCurrency).toMatch(/^[A-Z]{3}$/)
        }
      }
    }
  })

  it('claims nothing that has not been reviewed', () => {
    for (const race of SEED_RACES) {
      if (race.review === 'unreviewed') expect(race.editions ?? []).toHaveLength(0)
    }
  })

  it('carries the fourteen races reviewed against their organisers', () => {
    expect(SEED_RACES).toHaveLength(14)
    expect(SEED_RACES.every((race) => race.review === 'reviewed')).toBe(true)
  })
})
