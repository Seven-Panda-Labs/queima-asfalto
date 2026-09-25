import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'
import { wishNextDate } from './wishNextDate'

const TODAY = new Date('2026-09-25')

const wish: BucketListItem = {
  id: 'w1',
  userId: 'u1',
  raceId: 'race-1',
  createdAt: TODAY,
  updatedAt: TODAY,
}

const race: Race = {
  id: 'race-1',
  userId: 'u1',
  name: 'Maratona do Porto',
  location: 'Porto',
  catalogRaceId: 'pt-porto-maratona',
  createdAt: TODAY,
  updatedAt: TODAY,
}

function entry(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'pt-porto-maratona',
    name: 'Maratona do Porto',
    country: 'PT',
    city: 'Porto',
    disciplines: ['km_42_2'],
    entryMethod: 'first_come',
    review: 'unreviewed',
    source: 'x',
    ...overrides,
  }
}

function edition(year: number, raceDate?: string) {
  return { year, raceDate, source: 'x', confirmedAt: '2026-01-01' }
}

describe('wishNextDate', () => {
  it('is the soonest edition still ahead', () => {
    const next = wishNextDate(
      wish,
      [race],
      [entry({ editions: [edition(2027, '2027-11-07'), edition(2026, '2026-11-08')] })],
      TODAY,
    )

    expect(next).toEqual({ kind: 'day', day: '2026-11-08' })
  })

  it('is the typical month while no edition has been published', () => {
    // The catalog's answer for a race nobody has dated yet. It is not a date
    // and is a different shape so that nothing can treat it as one.
    const next = wishNextDate(wish, [race], [entry({ typicalRaceMonth: 11 })], TODAY)

    expect(next).toEqual({ kind: 'month', month: 11 })
  })

  it('ignores an edition that has been run', () => {
    const next = wishNextDate(
      wish,
      [race],
      [entry({ editions: [edition(2026, '2026-05-10')], typicalRaceMonth: 5 })],
      TODAY,
    )

    expect(next).toEqual({ kind: 'month', month: 5 })
  })

  it('is nothing at all for a race the catalog does not describe', () => {
    expect(wishNextDate(wish, [race], [], TODAY)).toBeNull()
    expect(wishNextDate({ ...wish, raceId: undefined }, [race], [entry()], TODAY)).toBeNull()
    expect(wishNextDate(wish, [race], [entry()], TODAY)).toBeNull()
  })
})
