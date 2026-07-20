import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import type { PerformanceGoal } from '../types/PerformanceGoal'
import {
  computeAllPerformanceGoalsProgress,
  computePerformanceGoalProgress,
} from './performanceGoalProgress'

function makeEvent(overrides: Partial<Event> & Pick<Event, 'eventType' | 'date' | 'status'>): Event {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    name: 'Prova',
    realDistance: 10,
    location: 'Porto',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeGoal(overrides: Partial<PerformanceGoal> = {}): PerformanceGoal {
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    type: 'pr_target',
    eventType: 'km_10',
    year: 2026,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('performance goal progress integration', () => {
  it('handles all three goal types against the same event set', () => {
    const events: Event[] = [
      makeEvent({
        id: 'hist',
        name: 'Histórico',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2024, 8, 1),
        time: '00:50:00',
        pace: '5:00',
      }),
      makeEvent({
        id: 'year',
        name: 'Época 2026',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 2, 15),
        time: '00:48:30',
        pace: '4:51',
      }),
      makeEvent({
        id: 'other-type',
        name: 'km_5',
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, 3, 1),
        time: '00:24:00',
        pace: '4:48',
      }),
    ]

    const goals = [
      makeGoal({ id: 'pr', type: 'pr_target', eventType: 'km_10' }),
      makeGoal({
        id: 'pace',
        type: 'pace_target',
        eventType: 'km_10',
        targetPace: '5:00',
      }),
      makeGoal({
        id: 'time',
        type: 'time_target',
        eventType: 'km_10',
        targetTime: '00:49:00',
      }),
    ]

    const results = computeAllPerformanceGoalsProgress(goals, events)
    const byId = Object.fromEntries(results.map((goal) => [goal.id, goal]))

    expect(byId.pr.status).toBe('achieved')
    expect(byId.pace.status).toBe('achieved')
    expect(byId.time.status).toBe('achieved')
  })

  it('returns no_data when there are no completed events in the goal year', () => {
    const goal = makeGoal({ type: 'pace_target', targetPace: '5:00' })
    const events = [
      makeEvent({
        eventType: 'km_10',
        status: 'confirmed',
        date: new Date(2026, 5, 1),
      }),
      makeEvent({
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2025, 5, 1),
        time: '00:45:00',
        pace: '4:30',
      }),
    ]

    expect(computePerformanceGoalProgress(goal, events).status).toBe('no_data')
  })

  it('does not count events from the wrong year for time_target', () => {
    const goal = makeGoal({
      type: 'time_target',
      eventType: 'km_21_1',
      year: 2026,
      targetTime: '01:40:00',
    })
    const events = [
      makeEvent({
        eventType: 'km_21_1',
        status: 'completed',
        date: new Date(2025, 10, 1),
        time: '01:35:00',
        pace: '4:30',
      }),
    ]

    expect(computePerformanceGoalProgress(goal, events).status).toBe('no_data')
  })

  it('treats tied pace as not beating historical PR', () => {
    const goal = makeGoal({ type: 'pr_target', eventType: 'km_5', year: 2026 })
    const events = [
      makeEvent({
        id: 'old',
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2023, 0, 1),
        time: '00:25:00',
        pace: '5:00',
      }),
      makeEvent({
        id: 'tie',
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, 0, 1),
        time: '00:25:00',
        pace: '5:00',
      }),
    ]

    const progress = computePerformanceGoalProgress(goal, events)
    expect(progress.status).toBe('in_progress')
    expect(progress.percent).toBe(0)
  })

  it('picks the best event in the year when multiple completions exist', () => {
    const goal = makeGoal({
      type: 'time_target',
      eventType: 'km_10',
      year: 2026,
      targetTime: '00:52:00',
    })
    const events = [
      makeEvent({
        id: 'slow',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 0, 1),
        time: '00:55:00',
        pace: '5:30',
      }),
      makeEvent({
        id: 'fast',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 4, 1),
        time: '00:50:00',
        pace: '5:00',
      }),
    ]

    const progress = computePerformanceGoalProgress(goal, events)
    expect(progress.status).toBe('achieved')
    expect(progress.currentTime).toBe('00:50:00')
  })

  it('ignores completed events missing pace or time', () => {
    const goal = makeGoal({ type: 'pr_target', eventType: 'km_10', year: 2026 })
    const events = [
      makeEvent({
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 1, 1),
        time: '00:50:00',
      }),
    ]

    expect(computePerformanceGoalProgress(goal, events).status).toBe('no_data')
  })
})
