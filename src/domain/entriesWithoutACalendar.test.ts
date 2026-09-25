import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import type { Race } from '../types/Race'
import type { RaceEntry } from '../types/RaceEntry'
import { entriesWithoutACalendar } from './entriesWithoutACalendar'

const NOW = new Date('2026-09-25')

function entry(raceId: string, year = 2027): RaceEntry {
  return {
    id: `entry-${raceId}`,
    userId: 'u1',
    raceId,
    year,
    raceDateConfirmed: false,
    entryMethod: 'lottery',
    entryStatus: 'applied',
    createdAt: NOW,
    updatedAt: NOW,
  }
}

function race(id: string, name = id): Race {
  return { id, userId: 'u1', name, location: 'x', createdAt: NOW, updatedAt: NOW }
}

function event(raceId: string, date: string, status: Event['status'] = 'planned'): Event {
  return {
    id: `event-${raceId}`,
    userId: 'u1',
    name: raceId,
    date: new Date(date),
    realDistance: 42.195,
    eventType: 'km_42_2',
    location: 'x',
    status,
    raceId,
    createdAt: NOW,
    updatedAt: NOW,
  } as Event
}

describe('entriesWithoutACalendar', () => {
  it('finds a place being chased for a season nobody has dated', () => {
    const found = entriesWithoutACalendar([entry('race-1')], [], [race('race-1')], 2027)

    expect(found.map((row) => row.entry.id)).toEqual(['entry-race-1'])
  })

  it('leaves out a race that is already in the calendar that year', () => {
    const found = entriesWithoutACalendar(
      [entry('race-1')],
      [event('race-1', '2027-04-30')],
      [race('race-1')],
      2027,
    )

    expect(found).toEqual([])
  })

  it('counts a cancelled race as no calendar at all', () => {
    // The race was called off: the place is being chased again, not settled.
    const found = entriesWithoutACalendar(
      [entry('race-1')],
      [event('race-1', '2027-04-30', 'cancelled')],
      [race('race-1')],
      2027,
    )

    expect(found.map((row) => row.entry.id)).toEqual(['entry-race-1'])
  })

  it('keeps to the season being planned', () => {
    expect(entriesWithoutACalendar([entry('race-1', 2028)], [], [race('race-1')], 2027)).toEqual([])
  })

  it('ignores an attempt at a race this account does not hold', () => {
    expect(entriesWithoutACalendar([entry('gone')], [], [], 2027)).toEqual([])
  })
})
