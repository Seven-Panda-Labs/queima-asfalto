import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { gapBetween, seasonTimeline, seasonYears, spanBetween } from './seasonTimeline'

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

describe('seasonTimeline', () => {
  it('is one leg per anchor, with what leads to it in date order', () => {
    const legs = seasonTimeline(
      [
        event({ id: 'b', date: new Date('2027-03-23') }),
        event({ id: 'anchor-1', date: new Date('2027-04-30'), raceId: 'race-hm' }),
        event({ id: 'a', date: new Date('2027-01-10') }),
      ],
      2027,
      new Set(['race-hm']),
    )

    expect(legs).toHaveLength(1)
    expect(legs[0]!.anchor?.id).toBe('anchor-1')
    expect(legs[0]!.leadUp.map((race) => race.id)).toEqual(['a', 'b'])
  })

  it('starts a new leg after each anchor', () => {
    const legs = seasonTimeline(
      [
        event({ id: 'spring', date: new Date('2027-03-23') }),
        event({ id: 'first', date: new Date('2027-04-30'), raceId: 'race-one' }),
        event({ id: 'summer', date: new Date('2027-07-20') }),
        event({ id: 'second', date: new Date('2027-10-25'), raceId: 'race-two' }),
      ],
      2027,
      new Set(['race-one', 'race-two']),
    )

    expect(legs.map((leg) => leg.anchor?.id)).toEqual(['first', 'second'])
    expect(legs[1]!.leadUp.map((race) => race.id)).toEqual(['summer'])
  })

  it('keeps what comes after the last anchor, because a gap there is also news', () => {
    const legs = seasonTimeline(
      [
        event({ id: 'anchor', date: new Date('2027-04-30'), raceId: 'race-hm' }),
        event({ id: 'after', date: new Date('2027-09-12') }),
      ],
      2027,
      new Set(['race-hm']),
    )

    expect(legs).toHaveLength(2)
    expect(legs[1]!.anchor).toBeNull()
    expect(legs[1]!.leadUp.map((race) => race.id)).toEqual(['after'])
  })

  it('is one legless leg while nothing has been called an anchor', () => {
    const legs = seasonTimeline([event({ id: 'only', date: new Date('2027-05-05') })], 2027)

    expect(legs).toEqual([
      { anchor: null, leadUp: [expect.objectContaining({ id: 'only' })] },
    ])
  })

  it('says so even for an empty year, so the page has something to answer', () => {
    expect(seasonTimeline([], 2027)).toEqual([{ anchor: null, leadUp: [] }])
  })

  it('leaves a cancelled race out and keeps one that was run', () => {
    const legs = seasonTimeline(
      [
        event({ id: 'off', date: new Date('2027-02-14'), status: 'cancelled' }),
        event({ id: 'ran', date: new Date('2027-03-14'), status: 'completed' }),
      ],
      2027,
    )

    expect(legs[0]!.leadUp.map((race) => race.id)).toEqual(['ran'])
  })

  it('keeps the year asked for and nothing else', () => {
    const legs = seasonTimeline(
      [
        event({ id: 'this-year', date: new Date('2027-04-11') }),
        event({ id: 'next-year', date: new Date('2028-04-09') }),
      ],
      2027,
    )

    expect(legs.flatMap((leg) => leg.leadUp).map((race) => race.id)).toEqual(['this-year'])
  })
})

describe('gapBetween', () => {
  const race = (id: string, date: string) => ({
    id,
    name: id,
    date: new Date(`${date}T12:00:00`),
    eventType: 'km_10' as const,
    status: 'planned' as const,
    isAnchor: false,
  })

  it('is the days between the two, not the days of the two', () => {
    expect(gapBetween(race('a', '2027-01-10'), race('b', '2027-03-23'), 2027)).toEqual({
      from: '2027-01-11',
      to: '2027-03-22',
    })
  })

  it('opens at the year when there is nothing before, and closes at it when nothing after', () => {
    expect(gapBetween(null, race('b', '2027-03-23'), 2027)).toEqual({
      from: '2027-01-01',
      to: '2027-03-22',
    })
    expect(gapBetween(race('a', '2027-10-25'), null, 2027)).toEqual({
      from: '2027-10-26',
      to: '2027-12-31',
    })
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

describe('spanBetween', () => {
  const race = (date: string) => ({
    id: date,
    name: date,
    date: new Date(`${date}T12:00:00`),
    eventType: 'km_10' as const,
    status: 'planned' as const,
    isAnchor: false,
  })

  it('is weeks, because that is how a season is planned', () => {
    // "A test four to eight weeks before the anchor", never thirty-eight days.
    expect(spanBetween(race('2027-03-23'), race('2027-04-30'))).toEqual({
      unit: 'weeks',
      count: 5,
    })
  })

  it('is days when there is barely a fortnight, which is where a clash starts', () => {
    expect(spanBetween(race('2027-04-24'), race('2027-04-30'))).toEqual({ unit: 'days', count: 6 })
    expect(spanBetween(race('2027-04-16'), race('2027-04-30'))).toEqual({ unit: 'weeks', count: 2 })
  })

  it('is nothing at all on the same day', () => {
    expect(spanBetween(race('2027-04-30'), race('2027-04-30'))).toEqual({ unit: 'days', count: 0 })
  })
})
