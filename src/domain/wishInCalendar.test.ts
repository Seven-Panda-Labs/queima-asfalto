import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { wishInCalendar } from './wishInCalendar'

const today = new Date('2026-11-26T15:00:00')

function running(id: string, date: string, status: Event['status'], overrides: Partial<Event> = {}): Event {
  return { id, raceId: 'race-warsaw', date: new Date(`${date}T09:00:00`), status, ...overrides } as Event
}

describe('wishInCalendar', () => {
  it('is the next running ahead, even with one already run', () => {
    const events = [
      running('ran', '2025-03-30', 'completed'),
      running('later', '2031-03-30', 'planned'),
      running('next', '2030-03-09', 'confirmed'),
    ]

    expect(wishInCalendar({ raceId: 'race-warsaw' }, events, today)).toEqual({
      kind: 'scheduled',
      event: events[2],
    })
  })

  it('counts a running later today as ahead', () => {
    const events = [running('today', '2026-11-26', 'planned')]

    expect(wishInCalendar({ raceId: 'race-warsaw' }, events, today)?.kind).toBe('scheduled')
  })

  it('is the latest running finished when none is ahead', () => {
    const events = [running('old', '2023-03-26', 'completed'), running('recent', '2025-03-30', 'completed')]

    expect(wishInCalendar({ raceId: 'race-warsaw' }, events, today)).toEqual({ kind: 'ran', event: events[1] })
  })

  it('leaves a wish to try again: missed, cancelled, not finished or never updated', () => {
    const events = [
      running('missed', '2026-06-27', 'missed'),
      running('cancelled', '2025-06-28', 'cancelled'),
      running('dnf', '2024-06-29', 'completed', { outcomeReason: 'dnf' }),
      running('stale', '2026-03-01', 'planned'),
    ]

    expect(wishInCalendar({ raceId: 'race-warsaw' }, events, today)).toBeNull()
  })

  it('reads only the wish s own race', () => {
    const events = [running('other', '2030-03-09', 'planned', { raceId: 'race-napoli' })]

    expect(wishInCalendar({ raceId: 'race-warsaw' }, events, today)).toBeNull()
    expect(wishInCalendar({}, events, today)).toBeNull()
  })
})
