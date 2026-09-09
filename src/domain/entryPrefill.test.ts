import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import { prefillFromCatalog } from './entryPrefill'

const TODAY = new Date('2026-09-09')

function race(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'pt-lisboa-maratona-de-lisboa',
    name: 'Maratona de Lisboa',
    country: 'PT',
    city: 'Lisboa',
    disciplines: ['km_42_2'],
    entryMethod: 'first_come',
    review: 'unreviewed',
    source: 'acorrer.pt',
    producer: 'harvest',
    ...overrides,
  }
}

const edition2027 = {
  year: 2027,
  raceDate: '2027-10-10',
  registrationOpensAt: '2027-01-15T09:00:00Z',
  registrationClosesAt: '2027-09-30',
  timezone: 'Europe/Lisbon',
  typicalFee: 45,
  feeCurrency: 'EUR',
  source: 'acorrer.pt',
  confirmedAt: '2026-09-01',
}

describe('prefillFromCatalog', () => {
  it('offers the soonest edition still ahead', () => {
    const offer = prefillFromCatalog(
      race({
        editions: [
          { ...edition2027, year: 2026, raceDate: '2026-10-11' },
          edition2027,
        ],
      }),
      { today: TODAY },
    )

    // 2026-10-11 is still ahead of 2026-09-09, so that is the one being planned.
    expect(offer).toMatchObject({ year: 2026, raceDate: '2026-10-11' })
  })

  it('leaves a past edition alone', () => {
    const offer = prefillFromCatalog(
      race({ editions: [{ ...edition2027, year: 2025, raceDate: '2025-10-12' }] }),
      { today: TODAY },
    )

    // No date, but the race still says how you get in and where.
    expect(offer?.raceDate).toBeUndefined()
    expect(offer).toMatchObject({ entryMethod: 'first_come' })
  })

  it('takes the year the runner is planning when there is one', () => {
    const offer = prefillFromCatalog(
      race({ editions: [{ ...edition2027, year: 2026, raceDate: '2026-10-11' }, edition2027] }),
      { year: 2027, today: TODAY },
    )

    expect(offer).toMatchObject({ year: 2027, raceDate: '2027-10-10' })
  })

  it('cuts an instant down to the day the form can take', () => {
    const offer = prefillFromCatalog(race({ editions: [edition2027] }), { today: TODAY })

    expect(offer?.registrationOpensAt).toBe('2027-01-15')
    expect(offer?.timezone).toBe('Europe/Lisbon')
  })

  it('carries the fee only with its currency', () => {
    const offer = prefillFromCatalog(race({ editions: [edition2027] }), { today: TODAY })
    expect(offer).toMatchObject({ fee: 45, feeCurrency: 'EUR' })

    const noFee = prefillFromCatalog(
      race({ editions: [{ ...edition2027, typicalFee: undefined, feeCurrency: 'EUR' }] }),
      { today: TODAY },
    )
    expect(noFee?.fee).toBeUndefined()
    expect(noFee?.feeCurrency).toBeUndefined()
  })

  it('never says an unreviewed entry may be asserted', () => {
    expect(prefillFromCatalog(race({ editions: [edition2027] }), { today: TODAY })).toMatchObject({
      assertable: false,
      source: 'acorrer.pt',
    })
    expect(
      prefillFromCatalog(race({ review: 'reviewed', editions: [edition2027] }), { today: TODAY }),
    ).toMatchObject({ assertable: true })
  })

  it('does not offer an entry method nobody knows', () => {
    const offer = prefillFromCatalog(
      race({ entryMethod: 'unknown', editions: [edition2027] }),
      { today: TODAY },
    )

    expect(offer?.entryMethod).toBeUndefined()
  })

  it('has nothing to offer for a race with no dates, gates or link', () => {
    expect(
      prefillFromCatalog(race({ entryMethod: 'unknown', editions: [] }), { today: TODAY }),
    ).toBeNull()
    expect(prefillFromCatalog(null)).toBeNull()
  })
})
