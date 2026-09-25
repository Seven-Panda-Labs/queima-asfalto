import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { seasonShape, seasonYears } from './seasonShape'

function event(overrides: Partial<Event> & Pick<Event, 'id' | 'date'>): Event {
  return {
    userId: 'u1',
    name: overrides.id,
    realDistance: 42.195,
    eventType: 'km_42_2',
    location: 'Lisboa',
    status: 'planned',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as Event
}

describe('seasonShape', () => {
  it('has a row for every month, so the gaps are as visible as the races', () => {
    const shape = seasonShape([event({ id: 'a', date: new Date('2027-04-11') })], 2027)

    expect(shape).toHaveLength(12)
    expect(shape[3]!.races.map((race) => race.id)).toEqual(['a'])
    expect(shape[2]!.races).toEqual([])
  })

  it('keeps the year asked for and nothing else', () => {
    const shape = seasonShape(
      [
        event({ id: 'this-year', date: new Date('2027-04-11') }),
        event({ id: 'next-year', date: new Date('2028-04-09') }),
      ],
      2027,
    )

    expect(shape.flatMap((month) => month.races).map((race) => race.id)).toEqual(['this-year'])
  })

  it('leaves a cancelled race out: it is not part of the season', () => {
    const shape = seasonShape(
      [event({ id: 'off', date: new Date('2027-04-11'), status: 'cancelled' })],
      2027,
    )
    expect(shape.flatMap((month) => month.races)).toEqual([])
  })

  it('keeps what has already been run, because the rest is arranged around it', () => {
    const shape = seasonShape(
      [event({ id: 'ran', date: new Date('2027-02-14'), status: 'completed' })],
      2027,
    )
    expect(shape[1]!.races.map((race) => race.id)).toEqual(['ran'])
  })

  it('orders a busy month by day and marks the anchor', () => {
    const shape = seasonShape(
      [
        event({ id: 'later', date: new Date('2027-09-26'), raceId: 'race-anchor' }),
        event({ id: 'earlier', date: new Date('2027-09-05') }),
      ],
      2027,
      new Set(['race-anchor']),
    )

    expect(shape[8]!.races.map((race) => race.id)).toEqual(['earlier', 'later'])
    expect(shape[8]!.races[1]!.isAnchor).toBe(true)
  })
})

describe('seasonYears', () => {
  it('offers this year and the two ahead, because an anchor is booked that far out', () => {
    expect(seasonYears([], new Date('2026-09-25'))).toEqual([2026, 2027, 2028])
  })

  it('adds a year the runner already has races in', () => {
    expect(
      seasonYears([event({ id: 'old', date: new Date('2025-05-04') })], new Date('2026-09-25')),
    ).toEqual([2025, 2026, 2027, 2028])
  })
})
