import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { computeBestPerformances, getPersonalRecordIds } from './bestPerformances'

function makeEvent(overrides: Partial<Event> & Pick<Event, 'eventType' | 'date' | 'status'>): Event {
  const now = new Date()
  return {
    id: '1',
    userId: 'u1',
    name: 'Test',
    realDistance: 5,
    location: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('computeBestPerformances', () => {
  it('picks fastest pace per event type across all years', () => {
    const events: Event[] = [
      makeEvent({
        id: '1',
        name: 'Slow',
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, 0, 1),
        time: '00:30:00',
        pace: '6:00',
      }),
      makeEvent({
        id: '2',
        name: 'Fast',
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, 1, 1),
        time: '00:25:00',
        pace: '5:00',
      }),
    ]

    const best = computeBestPerformances(events)
    expect(best).toHaveLength(1)
    expect(best[0].eventName).toBe('Fast')
    expect(best[0].pace).toBe('5:00')
  })

  it('includes records from previous years', () => {
    const events: Event[] = [
      makeEvent({
        id: '1',
        name: 'Old PR',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2020, 5, 1),
        time: '00:50:00',
        pace: '5:00',
      }),
      makeEvent({
        id: '2',
        name: 'Recent',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 1, 1),
        time: '00:55:00',
        pace: '5:30',
      }),
    ]

    const best = computeBestPerformances(events)
    expect(best).toHaveLength(1)
    expect(best[0].eventName).toBe('Old PR')
  })

  it('prefers faster time when pace and distance match', () => {
    const events: Event[] = [
      makeEvent({
        id: 'older',
        name: 'The Great 10K',
        eventType: 'km_10',
        realDistance: 10,
        status: 'completed',
        date: new Date(2022, 9, 16),
        time: '00:54:32',
        pace: '5:27',
      }),
      makeEvent({
        id: 'faster',
        name: 'adidas Runners City Night',
        eventType: 'km_10',
        realDistance: 10,
        status: 'completed',
        date: new Date(2023, 6, 29),
        time: '00:54:27',
        pace: '5:27',
      }),
    ]

    const best = computeBestPerformances(events)
    expect(best).toHaveLength(1)
    expect(best[0].eventId).toBe('faster')
  })

  it('returns event ids for personal records', () => {
    const events: Event[] = [
      makeEvent({
        id: 'slow',
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, 0, 1),
        time: '00:30:00',
        pace: '6:00',
      }),
      makeEvent({
        id: 'fast',
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, 1, 1),
        time: '00:25:00',
        pace: '5:00',
      }),
    ]

    const ids = getPersonalRecordIds(events)
    expect(ids).toEqual(new Set(['fast']))
  })
})
