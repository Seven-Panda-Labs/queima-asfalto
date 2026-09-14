import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import type { Goal } from '../types/Goal'
import type { PerformanceGoal } from '../types/PerformanceGoal'
import { computeRaceMilestones, durableMilestones, isStanding } from './raceMilestones'
import { makeEvent } from '../utils/analytics/testFixtures'

function race(
  id: string,
  date: Date,
  time: string,
  overrides: Partial<Event> = {},
): Event {
  return makeEvent({ id, date, eventType: 'km_10', time, pace: '5:20', ...overrides })
}

function goal(overrides: Partial<Goal> = {}): Goal {
  const now = new Date(2026, 0, 1)
  return {
    id: 'g1',
    userId: 'u1',
    eventType: 'km_10',
    targetCount: 3,
    year: 2026,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function performanceGoal(overrides: Partial<PerformanceGoal> = {}): PerformanceGoal {
  const now = new Date(2026, 0, 1)
  return {
    id: 'p1',
    userId: 'u1',
    type: 'time_target',
    eventType: 'km_10',
    year: 2026,
    targetTime: '00:55:00',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function compute(event: Event, events: Event[], extra: Partial<{ goals: Goal[]; performanceGoals: PerformanceGoal[] }> = {}) {
  return computeRaceMilestones({
    event,
    events,
    goals: extra.goals ?? [],
    performanceGoals: extra.performanceGoals ?? [],
  })
}

describe('a race that beat the standing record', () => {
  const slow = race('slow', new Date(2025, 4, 1), '00:56:00')
  const fast = race('fast', new Date(2026, 8, 12), '00:53:22')
  const after = race('after', new Date(2026, 9, 1), '00:54:00')

  it('is a personal record, with the seconds it took off', () => {
    const milestones = compute(fast, [slow, fast, after])
    const record = milestones.find((milestone) => milestone.kind === 'personal_record')

    expect(record).toBeDefined()
    // 5:36,0 down to 5:20,2 per kilometre.
    expect(record!.kind === 'personal_record' && record!.improvementSeconds).toBeCloseTo(15.8, 5)
  })

  it('says nothing about a race that was not one', () => {
    const milestones = compute(after, [slow, fast, after])
    expect(milestones.some((milestone) => milestone.kind === 'personal_record')).toBe(false)
  })

  it('separates two races the stored pace prints the same', () => {
    // Both store 5:20. Three seconds of total time decide it.
    const tie = race('tie', new Date(2026, 9, 2), '00:53:25')
    const milestones = compute(tie, [fast, tie])
    expect(milestones.some((milestone) => milestone.kind === 'personal_record')).toBe(false)
  })
})

describe('the first race at a distance', () => {
  it('is both a first and a record, and the record took nothing off anything', () => {
    const first = race('first', new Date(2026, 2, 1), '00:56:00')
    const milestones = compute(first, [first])

    expect(milestones.map((milestone) => milestone.kind)).toEqual([
      'personal_record',
      'first_at_distance',
    ])
    const record = milestones[0]
    expect(record.kind === 'personal_record' && record.improvementSeconds).toBeNull()
  })

  it('does not fire for the second one', () => {
    const first = race('first', new Date(2026, 2, 1), '00:56:00')
    const second = race('second', new Date(2026, 3, 1), '00:57:00')
    const milestones = compute(second, [first, second])
    expect(milestones.some((milestone) => milestone.kind === 'first_at_distance')).toBe(false)
  })
})

describe('a race entered years after it was run', () => {
  const old = race('old', new Date(2024, 4, 1), '00:55:00')
  const since = race('since', new Date(2026, 1, 1), '00:53:22', { name: 'Outra prova' })

  it('keeps the record it set at the time, and names what took it away', () => {
    const milestones = compute(old, [old, since])
    const record = milestones.find((milestone) => milestone.kind === 'personal_record')

    expect(record).toBeDefined()
    expect(record!.kind === 'personal_record' && record!.superseded?.eventId).toBe('since')
    expect(isStanding(record!)).toBe(false)
  })

  it('sorts a mark that fell after every mark that still stands', () => {
    const milestones = compute(old, [old, since])
    const kinds = milestones.map((milestone) => milestone.kind)
    expect(kinds.indexOf('first_at_distance')).toBeLessThan(kinds.indexOf('personal_record'))
  })
})

describe('a yearly goal', () => {
  const races = [
    race('a', new Date(2026, 1, 1), '00:56:00'),
    race('b', new Date(2026, 3, 1), '00:57:00'),
    race('c', new Date(2026, 5, 1), '00:58:00'),
    race('d', new Date(2026, 7, 1), '00:59:00'),
  ]

  it('is celebrated on the race that completed it', () => {
    const milestones = compute(races[2], races, { goals: [goal()] })
    expect(milestones.some((milestone) => milestone.kind === 'annual_goal')).toBe(true)
  })

  it('is not celebrated again by the next race', () => {
    const milestones = compute(races[3], races, { goals: [goal()] })
    expect(milestones.some((milestone) => milestone.kind === 'annual_goal')).toBe(false)
  })

  it('ignores a goal for another distance', () => {
    const milestones = compute(races[2], races, { goals: [goal({ eventType: 'km_5' })] })
    expect(milestones.some((milestone) => milestone.kind === 'annual_goal')).toBe(false)
  })
})

describe('a performance goal', () => {
  const missed = race('missed', new Date(2026, 1, 1), '00:56:00')
  const met = race('met', new Date(2026, 8, 12), '00:53:22')

  it('fires on the race that first met the target', () => {
    const milestones = compute(met, [missed, met], { performanceGoals: [performanceGoal()] })
    expect(milestones.some((milestone) => milestone.kind === 'performance_goal')).toBe(true)
  })

  it('does not fire on a race that was already inside it', () => {
    const later = race('later', new Date(2026, 9, 1), '00:54:00')
    const milestones = compute(later, [missed, met, later], {
      performanceGoals: [performanceGoal()],
    })
    expect(milestones.some((milestone) => milestone.kind === 'performance_goal')).toBe(false)
  })
})

describe('counting races', () => {
  const history = Array.from({ length: 10 }, (_, index) =>
    race(`r${index}`, new Date(2026, index, 1), '00:56:00'),
  )

  it('marks the tenth race', () => {
    const milestone = compute(history[9], history).find(
      (candidate) => candidate.kind === 'race_count',
    )
    expect(milestone?.kind === 'race_count' && milestone.ordinal).toBe(10)
  })

  it('marks the fifth at a distance', () => {
    const milestone = compute(history[4], history).find(
      (candidate) => candidate.kind === 'distance_count',
    )
    expect(milestone?.kind === 'distance_count' && milestone.ordinal).toBe(5)
  })

  it('leaves an unremarkable race alone', () => {
    const kinds = compute(history[5], history).map((milestone) => milestone.kind)
    expect(kinds).not.toContain('race_count')
    expect(kinds).not.toContain('distance_count')
  })

  it('crosses a season distance mark once', () => {
    const crossing = compute(history[9], history).find(
      (milestone) => milestone.kind === 'season_distance',
    )
    expect(crossing?.kind === 'season_distance' && crossing.markKm).toBe(100)

    // The next race of the same season is past the mark, not crossing it.
    const next = race('next', new Date(2026, 10, 1), '00:56:00')
    expect(
      compute(next, [...history, next]).some(
        (milestone) => milestone.kind === 'season_distance',
      ),
    ).toBe(false)
  })

  it('does not count a race given up on as a finish', () => {
    const dnf = race('dnf', new Date(2026, 1, 15), '', {
      time: undefined,
      pace: undefined,
      outcomeReason: 'dnf',
    })
    const milestone = compute(history[9], [...history, dnf]).find(
      (candidate) => candidate.kind === 'race_count',
    )
    expect(milestone?.kind === 'race_count' && milestone.ordinal).toBe(10)
  })
})

describe('the same course run twice', () => {
  const first = race('first', new Date(2025, 8, 12), '00:56:00', { name: 'Tierparklauf' })
  const second = race('second', new Date(2026, 8, 12), '00:53:22', { name: 'Tierparklauf 2026' })

  it('is a course record for the faster running', () => {
    const milestones = compute(second, [first, second])
    const course = milestones.find((milestone) => milestone.kind === 'course_record')
    expect(course?.kind === 'course_record' && course.runs).toBe(2)
  })

  it('is not one for the slower', () => {
    const milestones = compute(first, [first, second])
    expect(milestones.some((milestone) => milestone.kind === 'course_record')).toBe(false)
  })
})

describe('what a race keeps for good', () => {
  it('is the records, not the counting', () => {
    const first = race('first', new Date(2026, 2, 1), '00:56:00')
    const durable = durableMilestones(compute(first, [first]))
    expect(durable.map((milestone) => milestone.kind)).toEqual(['personal_record'])
  })
})

describe('a race that was not run', () => {
  it('has nothing to celebrate', () => {
    const planned = race('planned', new Date(2026, 11, 1), '', { status: 'planned', time: undefined })
    expect(compute(planned, [planned])).toEqual([])
  })
})
