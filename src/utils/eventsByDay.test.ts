import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { dateKey, getEventsForDate, groupEventsByDay } from './eventsByDay'

function makeEvent(overrides: Partial<Event> & Pick<Event, 'id' | 'date'>): Event {
  const now = new Date()
  return {
    userId: 'user-1',
    name: 'Test Event',
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisboa',
    status: 'planned',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('dateKey', () => {
  it('returns YYYY-MM-DD in local timezone', () => {
    expect(dateKey(new Date(2026, 5, 15))).toBe('2026-06-15')
    expect(dateKey(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('groupEventsByDay', () => {
  it('groups events by local date key', () => {
    const events: Event[] = [
      makeEvent({ id: 'a', date: new Date(2026, 5, 15), name: 'Morning' }),
      makeEvent({ id: 'b', date: new Date(2026, 5, 15, 18, 30), name: 'Evening' }),
      makeEvent({ id: 'c', date: new Date(2026, 5, 20), name: 'Other day' }),
    ]

    const grouped = groupEventsByDay(events)

    expect(grouped.get('2026-06-15')).toHaveLength(2)
    expect(grouped.get('2026-06-15')?.map((event) => event.id)).toEqual(['a', 'b'])
    expect(grouped.get('2026-06-20')).toHaveLength(1)
    expect(grouped.has('2026-06-16')).toBe(false)
  })

  it('returns empty map for no events', () => {
    expect(groupEventsByDay([]).size).toBe(0)
  })
})

describe('getEventsForDate', () => {
  it('returns events matching the given local date', () => {
    const events: Event[] = [
      makeEvent({ id: 'a', date: new Date(2026, 5, 15) }),
      makeEvent({ id: 'b', date: new Date(2026, 5, 15, 23, 59) }),
      makeEvent({ id: 'c', date: new Date(2026, 5, 16) }),
    ]

    const result = getEventsForDate(events, new Date(2026, 5, 15))

    expect(result.map((event) => event.id)).toEqual(['a', 'b'])
  })

  it('returns empty array when no events match', () => {
    const events: Event[] = [makeEvent({ id: 'a', date: new Date(2026, 5, 15) })]

    expect(getEventsForDate(events, new Date(2026, 5, 16))).toEqual([])
  })
})
