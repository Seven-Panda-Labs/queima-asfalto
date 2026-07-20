import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { computeDashboardStats } from './stats'

function makeEvent(
  overrides: Partial<Event> & Pick<Event, 'date' | 'status'>,
): Event {
  const now = new Date()
  return {
    id: 'event-1',
    userId: 'user-1',
    name: 'Test Event',
    realDistance: 5,
    eventType: 'km_5',
    location: 'Berlin',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('computeDashboardStats', () => {
  it('computes counts for year excluding Cancelado', () => {
    const events: Event[] = [
      ...Array.from({ length: 12 }, (_, index) =>
        makeEvent({
          id: `c-${index}`,
          status: 'completed',
          date: new Date(2026, index % 12, 1),
        }),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        makeEvent({
          id: `m-${index}`,
          status: 'missed',
          date: new Date(2026, index, 15),
        }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        makeEvent({
          id: `a-${index}`,
          status: 'planned',
          date: new Date(2026, index, 20),
        }),
      ),
      makeEvent({ id: 'cancel', status: 'cancelled', date: new Date(2026, 0, 1) }),
      makeEvent({ id: 'other-year', status: 'completed', date: new Date(2025, 0, 1) }),
    ]

    const stats = computeDashboardStats(events, 2026)
    expect(stats.totalEvents).toBe(19)
    expect(stats.completedCount).toBe(12)
    expect(stats.missedCount).toBe(2)
  })

  it('averages pace from completed events with pace', () => {
    const events: Event[] = [
      makeEvent({
        status: 'completed',
        date: new Date(2026, 0, 1),
        pace: '5:00',
      }),
      makeEvent({
        status: 'completed',
        date: new Date(2026, 1, 1),
        pace: '6:00',
      }),
    ]

    const stats = computeDashboardStats(events, 2026)
    expect(stats.averagePace).toBe('5:30')
  })

  it('returns null averagePace when no completed events have pace', () => {
    const events: Event[] = [
      makeEvent({ status: 'completed', date: new Date(2026, 0, 1), pace: undefined }),
      makeEvent({ status: 'planned', date: new Date(2026, 1, 1) }),
    ]

    const stats = computeDashboardStats(events, 2026)
    expect(stats.averagePace).toBeNull()
  })
})
