import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import type { Goal } from '../types/Goal'
import {
  computeAllGoalsProgress,
  computeGoalProgress,
  countCompletedEvents,
  isGoalComplete,
} from './goalProgress'

function makeEvent(overrides: Partial<Event> & Pick<Event, 'eventType' | 'date' | 'status'>): Event {
  const now = new Date()
  return {
    id: 'event-1',
    userId: 'user-1',
    name: 'Test Event',
    realDistance: 5,
    location: 'Berlin',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    userId: 'user-1',
    eventType: 'km_5',
    targetCount: 5,
    year: 2026,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('countCompletedEvents', () => {
  const events: Event[] = [
    makeEvent({ id: '1', eventType: 'km_5', status: 'completed', date: new Date(2026, 2, 1) }),
    makeEvent({ id: '2', eventType: 'km_5', status: 'completed', date: new Date(2026, 5, 1) }),
    makeEvent({ id: '3', eventType: 'km_5', status: 'confirmed', date: new Date(2026, 6, 1) }),
    makeEvent({ id: '4', eventType: 'km_10', status: 'completed', date: new Date(2026, 1, 1) }),
    makeEvent({ id: '5', eventType: 'km_5', status: 'completed', date: new Date(2025, 11, 1) }),
  ]

  it('counts only Concluído events matching type and year', () => {
    expect(countCompletedEvents(events, 'km_5', 2026)).toBe(2)
  })

  it('returns zero when no matches', () => {
    expect(countCompletedEvents(events, 'km_21_1', 2026)).toBe(0)
  })
})

describe('computeGoalProgress', () => {
  it('derives currentCount and percent from events', () => {
    const goal = makeGoal({ targetCount: 4 })
    const events = [
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 0, 1) }),
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 1, 1) }),
    ]

    const progress = computeGoalProgress(goal, events)
    expect(progress.currentCount).toBe(2)
    expect(progress.percent).toBe(50)
  })

  it('caps percent at 100 when target is exceeded', () => {
    const goal = makeGoal({ targetCount: 2 })
    const events = [
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 0, 1) }),
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 1, 1) }),
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 2, 1) }),
    ]

    const progress = computeGoalProgress(goal, events)
    expect(progress.currentCount).toBe(3)
    expect(progress.percent).toBe(100)
    expect(progress.outcome).toBe('exceeded')
  })

  it('marks past unmet goals as failed', () => {
    const goal = makeGoal({ targetCount: 5, year: 2024 })
    const events = [
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2024, 0, 1) }),
    ]

    expect(computeGoalProgress(goal, events).outcome).toBe('failed')
  })

  it('marks large overachievement as crushed', () => {
    const goal = makeGoal({ targetCount: 2, year: 2026 })
    const events = Array.from({ length: 4 }, (_, index) =>
      makeEvent({
        id: `event-${index}`,
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, index, 1),
      }),
    )

    expect(computeGoalProgress(goal, events).outcome).toBe('crushed')
  })
})

describe('computeAllGoalsProgress', () => {
  it('maps each goal to progress', () => {
    const goals = [
      makeGoal({ id: 'g1', eventType: 'km_5', targetCount: 3 }),
      makeGoal({ id: 'g2', eventType: 'km_10', targetCount: 2, year: 2026 }),
    ]
    const events = [
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 0, 1) }),
      makeEvent({ eventType: 'km_10', status: 'completed', date: new Date(2026, 0, 1) }),
    ]

    const result = computeAllGoalsProgress(goals, events)
    expect(result).toHaveLength(2)
    expect(result[0].currentCount).toBe(1)
    expect(result[1].currentCount).toBe(1)
  })
})

describe('isGoalComplete', () => {
  it('returns true when count meets or exceeds target', () => {
    const goal = makeGoal({ targetCount: 2 })
    const events = [
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 0, 1) }),
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 1, 1) }),
    ]

    expect(isGoalComplete(goal, events)).toBe(true)
  })

  it('returns false when below target', () => {
    const goal = makeGoal({ targetCount: 3 })
    const events = [
      makeEvent({ eventType: 'km_5', status: 'completed', date: new Date(2026, 0, 1) }),
    ]

    expect(isGoalComplete(goal, events)).toBe(false)
  })
})
