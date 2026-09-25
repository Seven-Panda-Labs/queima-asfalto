import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'
import { wishesWithADate } from './wishesWithADate'

const TODAY = new Date('2026-09-25')

function wish(id: string, raceId?: string): BucketListItem {
  return { id, userId: 'u1', raceId, createdAt: TODAY, updatedAt: TODAY }
}

function race(id: string, catalogRaceId?: string): Race {
  return { id, userId: 'u1', name: id, location: 'x', catalogRaceId, createdAt: TODAY, updatedAt: TODAY }
}

function entry(id: string, editions: { year: number; raceDate?: string }[]): RaceCatalogEntry {
  return {
    id,
    name: id,
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_42_2'],
    entryMethod: 'lottery',
    review: 'unreviewed',
    source: 'x',
    editions: editions.map((edition) => ({ ...edition, source: 'x', confirmedAt: '2026-09-01' })),
  }
}

describe('wishesWithADate', () => {
  it('finds the wish whose edition has just been published', () => {
    const dated = wishesWithADate(
      [wish('w1', 'race-1')],
      [race('race-1', 'de-berlin-marathon')],
      [entry('de-berlin-marathon', [{ year: 2027, raceDate: '2027-09-26' }])],
      2027,
      TODAY,
    )

    expect(dated.map((row) => row.raceDate)).toEqual(['2027-09-26'])
  })

  it('says nothing about a season that is not being planned', () => {
    const dated = wishesWithADate(
      [wish('w1', 'race-1')],
      [race('race-1', 'de-berlin-marathon')],
      [entry('de-berlin-marathon', [{ year: 2028, raceDate: '2028-09-24' }])],
      2027,
      TODAY,
    )

    expect(dated).toEqual([])
  })

  it('says nothing about an edition with no date, or one already run', () => {
    const noDate = wishesWithADate(
      [wish('w1', 'race-1')],
      [race('race-1', 'de-berlin-marathon')],
      [entry('de-berlin-marathon', [{ year: 2027 }])],
      2027,
      TODAY,
    )
    const past = wishesWithADate(
      [wish('w1', 'race-1')],
      [race('race-1', 'de-berlin-marathon')],
      [entry('de-berlin-marathon', [{ year: 2026, raceDate: '2026-09-20' }])],
      2026,
      TODAY,
    )

    expect(noDate).toEqual([])
    expect(past).toEqual([])
  })

  it('leaves alone a wish with no catalog race behind it', () => {
    expect(wishesWithADate([wish('w1')], [], [], 2027, TODAY)).toEqual([])
    expect(wishesWithADate([wish('w1', 'race-1')], [race('race-1')], [], 2027, TODAY)).toEqual([])
  })

  it('puts the soonest first, because that is the one to decide about', () => {
    const dated = wishesWithADate(
      [wish('w1', 'race-1'), wish('w2', 'race-2')],
      [race('race-1', 'later'), race('race-2', 'sooner')],
      [
        entry('later', [{ year: 2027, raceDate: '2027-10-10' }]),
        entry('sooner', [{ year: 2027, raceDate: '2027-04-11' }]),
      ],
      2027,
      TODAY,
    )

    expect(dated.map((row) => row.item.id)).toEqual(['w2', 'w1'])
  })
})
