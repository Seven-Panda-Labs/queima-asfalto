import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { findNextEvent, formatDaysUntil } from './nextEvent'

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

describe('findNextEvent', () => {
  const today = new Date(2026, 5, 15)

  it('returns nearest future Confirmado or Planeado event', () => {
    const events: Event[] = [
      makeEvent({
        id: 'past',
        status: 'confirmed',
        date: new Date(2026, 5, 10),
      }),
      makeEvent({
        id: 'far',
        status: 'planned',
        date: new Date(2026, 8, 1),
      }),
      makeEvent({
        id: 'next',
        status: 'confirmed',
        date: new Date(2026, 5, 20),
      }),
    ]

    const next = findNextEvent(events, today)
    expect(next?.id).toBe('next')
  })

  it('ignores Concluído and Faltou', () => {
    const events: Event[] = [
      makeEvent({
        id: 'done',
        status: 'completed',
        date: new Date(2026, 6, 1),
      }),
      makeEvent({
        id: 'missed',
        status: 'missed',
        date: new Date(2026, 6, 2),
      }),
    ]

    expect(findNextEvent(events, today)).toBeNull()
  })

  it('returns null when only past events remain', () => {
    const events: Event[] = [
      makeEvent({
        status: 'planned',
        date: new Date(2026, 5, 1),
      }),
      makeEvent({
        status: 'confirmed',
        date: new Date(2026, 5, 10),
      }),
    ]

    expect(findNextEvent(events, today)).toBeNull()
  })
})

describe('formatDaysUntil', () => {
  const today = new Date(2026, 5, 15)

  it('formats today, tomorrow and future days', () => {
    const labels = {
      today: 'Hoje',
      tomorrow: 'Amanhã',
      other: (n: number) => `Daqui a ${n} dias`,
    }
    expect(formatDaysUntil(new Date(2026, 5, 15), today, labels)).toBe('Hoje')
    expect(formatDaysUntil(new Date(2026, 5, 16), today, labels)).toBe('Amanhã')
    expect(formatDaysUntil(new Date(2026, 5, 20), today, labels)).toBe('Daqui a 5 dias')
  })
})
