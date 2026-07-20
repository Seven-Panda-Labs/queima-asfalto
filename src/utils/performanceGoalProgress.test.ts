import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import type { Event } from '../types/Event'
import type { PerformanceGoal } from '../types/PerformanceGoal'
import {
  computeAllPerformanceGoalsProgress,
  computePerformanceGoalProgress,
  isPerformanceGoalAchieved,
} from './performanceGoalProgress'

beforeAll(async () => {
  await i18n.changeLanguage('pt')
})

function makeEvent(overrides: Partial<Event> & Pick<Event, 'eventType' | 'date' | 'status'>): Event {
  const now = new Date()
  return {
    id: 'event-1',
    userId: 'user-1',
    name: 'Test Event',
    realDistance: 10,
    location: 'Lisboa',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeGoal(overrides: Partial<PerformanceGoal> = {}): PerformanceGoal {
  return {
    id: 'pg-1',
    userId: 'user-1',
    type: 'pr_target',
    eventType: 'km_10',
    year: 2026,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('pr_target progress', () => {
  it('marks achieved when year best beats historical PR', () => {
    const goal = makeGoal({ type: 'pr_target', eventType: 'km_10', year: 2026 })
    const events = [
      makeEvent({
        id: 'old',
        name: 'Old PR',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2024, 5, 1),
        time: '00:50:00',
        pace: '5:00',
      }),
      makeEvent({
        id: 'new',
        name: 'New PR',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 3, 1),
        time: '00:48:00',
        pace: '4:48',
      }),
    ]

    const progress = computePerformanceGoalProgress(goal, events)
    expect(progress.status).toBe('achieved')
    expect(progress.percent).toBe(100)
    expect(isPerformanceGoalAchieved(goal, events)).toBe(true)
  })

  it('stays in progress when year best does not beat historical PR', () => {
    const goal = makeGoal({ type: 'pr_target', eventType: 'km_10', year: 2026 })
    const events = [
      makeEvent({
        id: 'old',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2024, 5, 1),
        time: '00:48:00',
        pace: '4:48',
      }),
      makeEvent({
        id: 'recent',
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 3, 1),
        time: '00:50:00',
        pace: '5:00',
      }),
    ]

    const progress = computePerformanceGoalProgress(goal, events)
    expect(progress.status).toBe('in_progress')
    expect(progress.percent).toBe(0)
  })

  it('achieves first-ever PR in the year with no history', () => {
    const goal = makeGoal({ type: 'pr_target', eventType: 'km_5', year: 2026 })
    const events = [
      makeEvent({
        eventType: 'km_5',
        status: 'completed',
        date: new Date(2026, 1, 1),
        time: '00:25:00',
        pace: '5:00',
      }),
    ]

    expect(computePerformanceGoalProgress(goal, events).status).toBe('achieved')
  })
})

describe('pace_target progress', () => {
  it('marks achieved when best year pace meets target', () => {
    const goal = makeGoal({
      type: 'pace_target',
      eventType: 'km_10',
      year: 2026,
      targetPace: '5:00',
    })
    const events = [
      makeEvent({
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 2, 1),
        time: '00:49:00',
        pace: '4:54',
      }),
    ]

    const progress = computePerformanceGoalProgress(goal, events)
    expect(progress.status).toBe('achieved')
    expect(progress.currentPace).toBe('4:54')
  })

  it('reports partial progress when pace is close but not achieved', () => {
    const goal = makeGoal({
      type: 'pace_target',
      eventType: 'km_10',
      year: 2026,
      targetPace: '5:00',
    })
    const events = [
      makeEvent({
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 2, 1),
        time: '00:52:00',
        pace: '5:12',
      }),
    ]

    const progress = computePerformanceGoalProgress(goal, events)
    expect(progress.status).toBe('in_progress')
    expect(progress.percent).toBeGreaterThan(0)
    expect(progress.percent).toBeLessThan(100)
  })
})

describe('time_target progress', () => {
  it('marks achieved when best year time meets target', () => {
    const goal = makeGoal({
      type: 'time_target',
      eventType: 'km_21_1',
      year: 2026,
      targetTime: '01:45:00',
    })
    const events = [
      makeEvent({
        eventType: 'km_21_1',
        status: 'completed',
        date: new Date(2026, 4, 1),
        time: '01:44:30',
        pace: '5:00',
      }),
    ]

    const progress = computePerformanceGoalProgress(goal, events)
    expect(progress.status).toBe('achieved')
    expect(progress.currentTime).toBe('01:44:30')
  })

  it('ignores events from other years', () => {
    const goal = makeGoal({
      type: 'time_target',
      eventType: 'km_10',
      year: 2026,
      targetTime: '00:50:00',
    })
    const events = [
      makeEvent({
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2025, 4, 1),
        time: '00:45:00',
        pace: '4:30',
      }),
    ]

    expect(computePerformanceGoalProgress(goal, events).status).toBe('no_data')
  })

  it('marks unmet past-year goals as failed', () => {
    const goal = makeGoal({
      type: 'pace_target',
      eventType: 'km_10',
      year: 2024,
      targetPace: '4:30',
    })
    const events = [
      makeEvent({
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2024, 4, 1),
        time: '00:50:00',
        pace: '5:00',
      }),
    ]

    expect(computePerformanceGoalProgress(goal, events).status).toBe('failed')
  })
})

describe('computeAllPerformanceGoalsProgress', () => {
  it('maps each goal independently', () => {
    const goals = [
      makeGoal({ id: 'g1', type: 'pr_target' }),
      makeGoal({
        id: 'g2',
        type: 'pace_target',
        targetPace: '5:00',
      }),
    ]
    const events = [
      makeEvent({
        eventType: 'km_10',
        status: 'completed',
        date: new Date(2026, 0, 1),
        time: '00:50:00',
        pace: '5:00',
      }),
    ]

    const result = computeAllPerformanceGoalsProgress(goals, events)
    expect(result).toHaveLength(2)
    expect(result[0].status).toBe('achieved')
    expect(result[1].status).toBe('achieved')
  })
})
