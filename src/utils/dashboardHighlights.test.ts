import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import type { GoalWithProgress } from '../types/Goal'
import type { PerformanceGoalWithProgress } from '../types/PerformanceGoal'
import type { BestPerformance } from './bestPerformances'
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

function makeRecord(overrides: Partial<BestPerformance> = {}): BestPerformance {
  return {
    eventId: 'event-1',
    eventType: 'km_10',
    label: '10Km',
    eventName: 'City Night',
    date: now,
    time: '00:54:27',
    pace: '5:27',
    recordAge: 'há 3 anos',
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
      [],
    )

    expect(highlights.achievements.map((item) => item.id)).toEqual(['goal-done'])
    expect(highlights.achievements[0].detail).toBe('8/5')
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
      [],
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
      [],
    )

    expect(highlights.achievements.map((item) => item.id)).toEqual(['performance-hit'])
    expect(highlights.achievements[0].detail).toBe(i18n.t('goals.outcomeAchieved'))
    expect(highlights.targets.map((item) => item.id)).toEqual(['performance-blank'])
    expect(highlights.targets[0].progressText).toBe('0%')
    expect(highlights.targets[0].hint).toBe('Melhor em 2026: 5:14 min/Km')
  })

  it('adds personal records as achievements without an emoji so the medal is used', () => {
    const highlights = computeDashboardHighlights([], [], [makeRecord()])

    expect(highlights.achievements).toEqual([
      { id: 'record-event-1', tone: 'record', title: '10Km', detail: '00:54:27' },
    ])
    expect(highlights.targets).toEqual([])
  })

  it('picks the voice line of the most impressive outcome', () => {
    const highlights = computeDashboardHighlights(
      [
        makeGoal({ id: 'a', outcome: 'achieved' }),
        makeGoal({ id: 'b', eventType: 'km_10', outcome: 'crushed' }),
      ],
      [],
      [],
    )

    expect(highlights.voiceLine).toBe(i18n.t('voice.success.goalCrushed'))
  })

  it('has no voice line when nothing was achieved', () => {
    const highlights = computeDashboardHighlights([makeGoal()], [], [])

    expect(highlights.voiceLine).toBeNull()
    expect(highlights.achievements).toEqual([])
  })
})
