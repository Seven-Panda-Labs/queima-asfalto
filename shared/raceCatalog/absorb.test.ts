import { describe, expect, it } from 'vitest'
import { absorb } from './absorb'
import type { RaceCatalogEntry } from './types'

const TODAY = '2026-09-11'

function entry(overrides: Partial<RaceCatalogEntry> & Pick<RaceCatalogEntry, 'id' | 'name'>): RaceCatalogEntry {
  return {
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_10'],
    entryMethod: 'unknown',
    review: 'unreviewed',
    source: 'runners',
    ...overrides,
  }
}

/** The real four, reduced to the two that matter. */
const thin = entry({
  id: 'de-berlin-s25-berlin',
  name: 'S25 Berlin',
  producer: 'runner',
  editions: [
    {
      year: 2023,
      raceDate: '2023-05-14',
      resultsUrl: 'https://timing.example/2023',
      source: 'runners',
      confirmedAt: '2026-09-10',
    },
  ],
  nextRaceDate: '2023-05-14',
})

const rich = entry({
  id: 'de-berlin-olympiastadion-s-25-berlin',
  name: 'S 25 Berlin',
  review: 'reviewed',
  entryMethod: 'first_come',
  disciplines: ['km_5', 'km_10', 'km_21_1'],
  officialUrl: 'https://berlin-laeuft.de/s25berlin/',
  typicalRaceMonth: 4,
  nameTokens: ['s25', 'berlin', 'olympiastadion'],
  editions: [
    {
      year: 2026,
      raceDate: '2026-04-19',
      resultsUrl: 'https://timing.example/2026',
      source: 'runners',
      confirmedAt: '2026-09-10',
    },
    {
      year: 2027,
      raceDate: '2027-04-18',
      typicalFee: 40,
      feeCurrency: 'EUR',
      timezone: 'Europe/Berlin',
      source: 'berlin-laeuft.de',
      confirmedAt: '2026-09-10',
    },
  ],
  nextRaceDate: '2027-04-18',
})

describe('absorb', () => {
  it('keeps every edition both entries knew', () => {
    const merged = absorb(thin, rich, TODAY)

    expect(merged.editions?.map((edition) => edition.year)).toEqual([2023, 2026, 2027])
    // And what each edition carried travels with it.
    expect(merged.editions?.[2]).toMatchObject({ typicalFee: 40, feeCurrency: 'EUR', timezone: 'Europe/Berlin' })
    expect(merged.editions?.[1]?.resultsUrl).toBe('https://timing.example/2026')
  })

  it('moves the next date to the soonest edition still ahead', () => {
    // The visible entry said 2023 while the 2027 date sat inside a copy, so
    // the race was invisible to a search that orders by when it is next run.
    expect(absorb(thin, rich, TODAY).nextRaceDate).toBe('2027-04-18')
  })

  it('takes the official site, the month and the entry method it did not have', () => {
    const merged = absorb(thin, rich, TODAY)

    expect(merged.officialUrl).toBe('https://berlin-laeuft.de/s25berlin/')
    expect(merged.typicalRaceMonth).toBe(4)
    expect(merged.entryMethod).toBe('first_come')
  })

  it('offers every distance either of them offered', () => {
    expect(absorb(thin, rich, TODAY).disciplines).toEqual(['km_10', 'km_5', 'km_21_1'])
  })

  it('can be found by the words of the other name', () => {
    // "S 25 Halbmarathon Berlin" folded in means halbmarathon finds this race.
    const half = entry({
      id: 'de-berlin-s-25-halbmarathon-berlin',
      name: 'S 25 Halbmarathon Berlin',
      nameTokens: ['s25', 'halbmarathon', 'berlin'],
    })

    expect(absorb(thin, half, TODAY).nameTokens).toContain('halbmarathon')
    expect(absorb(thin, half, TODAY).nameTokens).toContain('s25')
  })

  it('leaves the survivor its own identity', () => {
    const merged = absorb(thin, rich, TODAY)

    // It was chosen: the name, the id and what a person checked stay its own.
    expect(merged.id).toBe('de-berlin-s25-berlin')
    expect(merged.name).toBe('S25 Berlin')
    expect(merged.review).toBe('unreviewed')
  })

  it('does not overwrite a value the survivor already has', () => {
    const dated = entry({
      id: 'de-berlin-other',
      name: 'S 25',
      officialUrl: 'https://other.example',
      editions: [{ year: 2023, raceDate: '2023-05-21', source: 'x', confirmedAt: 'x' }],
    })
    const merged = absorb({ ...thin, officialUrl: 'https://mine.example' }, dated, TODAY)

    expect(merged.officialUrl).toBe('https://mine.example')
    expect(merged.editions?.[0]?.raceDate).toBe('2023-05-14')
  })

  it('never splits a fee from its currency', () => {
    const priced = entry({
      id: 'de-berlin-priced',
      name: 'S 25',
      editions: [{ year: 2023, typicalFee: 30, feeCurrency: 'EUR', source: 'x', confirmedAt: 'x' }],
    })
    const merged = absorb(thin, priced, TODAY)

    expect(merged.editions?.[0]).toMatchObject({ typicalFee: 30, feeCurrency: 'EUR' })
  })

  it('keeps both sides answers about other races', () => {
    const merged = absorb(
      { ...thin, notDuplicateOf: ['de-berlin-one'] },
      { ...rich, notDuplicateOf: ['de-berlin-two'] },
      TODAY,
    )

    expect(merged.notDuplicateOf).toEqual(['de-berlin-one', 'de-berlin-two'])
  })
})
