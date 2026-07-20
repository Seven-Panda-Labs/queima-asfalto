import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import { applyAutoTransitions, shouldMarkAsFaltou } from './stateTransitions'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: '1',
    userId: 'user-1',
    name: 'ParkRun',
    date: new Date(2026, 0, 1),
    realDistance: 5,
    eventType: 'km_5',
    location: 'Berlin',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('shouldMarkAsFaltou', () => {
  const today = new Date(2026, 5, 26)

  it('marks Confirmado without time after grace period', () => {
    const event = makeEvent({ date: new Date(2026, 5, 20) })
    expect(shouldMarkAsFaltou(event, today)).toBe(true)
  })

  it('marks Planeado without time after grace period', () => {
    const event = makeEvent({ status: 'planned', date: new Date(2026, 5, 20) })
    expect(shouldMarkAsFaltou(event, today)).toBe(true)
  })

  it('keeps Planeado from yesterday', () => {
    const event = makeEvent({ status: 'planned', date: new Date(2026, 5, 25) })
    expect(shouldMarkAsFaltou(event, today)).toBe(false)
  })

  it('keeps Confirmado from yesterday', () => {
    const event = makeEvent({ date: new Date(2026, 5, 25) })
    expect(shouldMarkAsFaltou(event, today)).toBe(false)
  })

  it('does not mark when time is recorded', () => {
    const event = makeEvent({
      date: new Date(2026, 5, 15),
      time: '00:25:30',
      status: 'completed',
    })
    expect(shouldMarkAsFaltou(event, today)).toBe(false)
  })

  it('never transitions Concluído', () => {
    const event = makeEvent({
      date: new Date(2026, 5, 1),
      status: 'completed',
      time: '00:25:30',
    })
    expect(shouldMarkAsFaltou(event, today)).toBe(false)
  })
})

describe('applyAutoTransitions', () => {
  const today = new Date(2026, 5, 26)

  it('returns only events that should transition', () => {
    const events = [
      makeEvent({ id: 'a', date: new Date(2026, 5, 20) }),
      makeEvent({ id: 'b', date: new Date(2026, 5, 25) }),
      makeEvent({ id: 'c', status: 'planned', date: new Date(2026, 5, 1) }),
    ]

    const result = applyAutoTransitions(events, today)
    expect(result).toHaveLength(2)
    expect(result.map((event) => event.id).sort()).toEqual(['a', 'c'])
  })
})
