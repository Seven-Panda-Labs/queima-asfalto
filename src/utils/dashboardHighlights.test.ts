import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import type { GoalWithProgress } from '../types/Goal'
import type { PerformanceGoalWithProgress } from '../types/PerformanceGoal'
import { computeDashboardHighlights } from './dashboardHighlights'

beforeAll(async () => {
  await i18n.changeLanguage('pt')
})

const now = new Date()

function makeGoal(overrides: Partial<GoalWithProgress> = {}): GoalWithProgress {
  return {
    id: 'goal-1',
    userId: 'user-1',
    eventType: 'km_5',
    targetCount: 5,
    year: 2026,
    createdAt: now,
    updatedAt: now,
    currentCount: 1,
    percent: 20,
    outcome: 'in_progress',
    ...overrides,
  }
}

function makePerformanceGoal(
  overrides: Partial<PerformanceGoalWithProgress> = {},
): PerformanceGoalWithProgress {
  return {
    id: 'perf-1',
    userId: 'user-1',
    type: 'pace_target',
    eventType: 'km_5',
    year: 2026,
    targetPace: '5:10',
    createdAt: now,
    updatedAt: now,
    status: 'in_progress',
    percent: 40,
    progressLabel: 'Melhor em 2026: 5:14 min/Km',
    ...overrides,
  }
}

describe('computeDashboardHighlights', () => {
  it('separates fulfilled goals from the ones still in progress', () => {
    const highlights = computeDashboardHighlights(
      [
        makeGoal({ id: 'done', outcome: 'crushed', currentCount: 8, targetCount: 5, percent: 100 }),
        makeGoal({ id: 'going', outcome: 'in_progress', currentCount: 2, targetCount: 3, percent: 66.6 }),
      ],
      [],
    )

    expect(highlights.achievements.map((item) => item.id)).toEqual(['goal-done'])
    expect(highlights.achievements[0].detail).toBe(i18n.t('goals.outcomeCrushed'))
    expect(highlights.targets.map((item) => item.id)).toEqual(['goal-going'])
    expect(highlights.targets[0].progressText).toBe('2/3')
    expect(highlights.targets[0].percent).toBe(67)
  })

  it('sorts targets by how close they are to done', () => {
    const highlights = computeDashboardHighlights(
      [
        makeGoal({ id: 'far', eventType: 'km_10', percent: 10 }),
        makeGoal({ id: 'close', eventType: 'km_5', percent: 90 }),
        makeGoal({ id: 'middle', eventType: 'km_21_1', percent: 50 }),
      ],
      [makePerformanceGoal({ id: 'nearly', percent: 99 })],
    )

    expect(highlights.targets.map((item) => item.id)).toEqual([
      'performance-nearly',
      'goal-close',
      'goal-middle',
      'goal-far',
    ])
  })

  it('turns achieved performance goals into achievements and keeps the rest as targets', () => {
    const highlights = computeDashboardHighlights(
      [],
      [
        makePerformanceGoal({ id: 'hit', status: 'achieved' }),
        makePerformanceGoal({ id: 'blank', status: 'no_data', percent: 0 }),
      ],
    )

    expect(highlights.achievements.map((item) => item.id)).toEqual(['performance-hit'])
    expect(highlights.achievements[0].detail).toBe(i18n.t('goals.outcomeAchieved'))
    expect(highlights.targets.map((item) => item.id)).toEqual(['performance-blank'])
    expect(highlights.targets[0].progressText).toBe('0%')
    expect(highlights.targets[0].hint).toBe('Melhor em 2026: 5:14 min/Km')
  })

  it('labels each fulfilled goal with its own outcome', () => {
    const highlights = computeDashboardHighlights(
      [
        makeGoal({ id: 'a', outcome: 'achieved', currentCount: 5, targetCount: 5 }),
        makeGoal({ id: 'b', eventType: 'km_10', outcome: 'crushed', currentCount: 8, targetCount: 5 }),
      ],
      [],
    )

    expect(highlights.achievements.map((item) => item.detail)).toEqual([
      i18n.t('goals.outcomeAchieved'),
      i18n.t('goals.outcomeCrushed'),
    ])
  })

  it('has no achievements while nothing is fulfilled', () => {
    const highlights = computeDashboardHighlights([makeGoal()], [])

    expect(highlights.achievements).toEqual([])
    expect(highlights.targets).toHaveLength(1)
  })

})
