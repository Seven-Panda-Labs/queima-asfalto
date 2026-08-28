import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import type { GoalWithProgress } from '../types/Goal'
import type { PerformanceGoalWithProgress } from '../types/PerformanceGoal'
import { computeGoalsBoard } from './goalsBoard'

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

describe('computeGoalsBoard', () => {
  it('splits both kinds by state rather than by type', () => {
    const board = computeGoalsBoard(
      [
        makeGoal({ id: 'done', outcome: 'crushed', currentCount: 8, percent: 100 }),
        makeGoal({ id: 'going', eventType: 'km_10', currentCount: 2, targetCount: 3, percent: 67 }),
      ],
      [
        makePerformanceGoal({ id: 'hit', status: 'achieved', percent: 100 }),
        makePerformanceGoal({ id: 'close', percent: 99 }),
      ],
    )

    expect(board.pending.map((entry) => entry.id)).toEqual(['performance-close', 'annual-going'])
    expect(board.done.map((entry) => entry.id).sort()).toEqual(['annual-done', 'performance-hit'])
  })

  it('sorts what is pending by how close it is to done', () => {
    const board = computeGoalsBoard(
      [
        makeGoal({ id: 'far', percent: 10 }),
        makeGoal({ id: 'close', eventType: 'km_10', percent: 90 }),
      ],
      [makePerformanceGoal({ id: 'middle', percent: 50 })],
    )

    expect(board.pending.map((entry) => entry.id)).toEqual([
      'annual-close',
      'performance-middle',
      'annual-far',
    ])
  })

  it('marks a PR target as unmeasurable, since it can only be beaten or not', () => {
    const board = computeGoalsBoard([], [makePerformanceGoal({ id: 'pr', type: 'pr_target', percent: 0 })])

    const entry = board.pending[0]
    expect(entry.measurable).toBe(false)
    expect(entry.progressText).toBe(i18n.t('goals.performanceInProgress'))
  })

  it('marks a goal with no completed races as unmeasurable too', () => {
    const board = computeGoalsBoard([], [makePerformanceGoal({ id: 'blank', status: 'no_data', percent: 0 })])

    expect(board.pending[0].measurable).toBe(false)
    expect(board.pending[0].progressText).toBe(i18n.t('goals.performanceNoData'))
  })

  it('pushes what cannot be measured below what can', () => {
    const board = computeGoalsBoard(
      [makeGoal({ id: 'low', percent: 5 })],
      [makePerformanceGoal({ id: 'pr', type: 'pr_target', percent: 0 })],
    )

    expect(board.pending.map((entry) => entry.id)).toEqual(['annual-low', 'performance-pr'])
  })

  it('carries the edit route for each kind', () => {
    const board = computeGoalsBoard([makeGoal({ id: 'a' })], [makePerformanceGoal({ id: 'b' })])

    expect(board.pending.map((entry) => entry.editPath).sort()).toEqual([
      '/objetivos/a/editar',
      '/objetivos/performance/b/editar',
    ])
  })
})
