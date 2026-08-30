import { describe, expect, it } from 'vitest'
import type { PerformanceGoal } from '../../types/PerformanceGoal'
import { buildEquivalentSeries } from './equivalence'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import {
  computeIndexTrend,
  goalTargetIndex,
  MIN_TREND_POINTS,
  projectGoal,
  projectIndexAt,
} from './projection'

function improvingSeries() {
  return buildEquivalentSeries(
    toAnalysableResults([
      makeEvent({ id: '1', date: new Date(2026, 0, 1), eventType: 'km_10', time: '01:00:00' }),
      makeEvent({ id: '2', date: new Date(2026, 3, 1), eventType: 'km_10', time: '00:57:00' }),
      makeEvent({ id: '3', date: new Date(2026, 6, 1), eventType: 'km_10', time: '00:54:00' }),
      makeEvent({ id: '4', date: new Date(2026, 9, 1), eventType: 'km_10', time: '00:51:00' }),
    ]),
    10,
  )
}

function goal(overrides: Partial<PerformanceGoal>): PerformanceGoal {
  const now = new Date(2026, 0, 1)
  return {
    id: 'g1',
    userId: 'u1',
    type: 'time_target',
    eventType: 'km_10',
    year: 2026,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('computeIndexTrend', () => {
  it('refuses to draw a line through too few points', () => {
    const series = improvingSeries().slice(0, MIN_TREND_POINTS - 1)
    expect(computeIndexTrend(series)).toBeNull()
  })

  it('finds a rising trend when the runner is improving', () => {
    const trend = computeIndexTrend(improvingSeries())!

    expect(trend.slopePerDay).toBeGreaterThan(0)
    expect(trend.yearlyChange).toBeGreaterThan(0)
    expect(trend.points).toBe(4)
    expect(projectIndexAt(trend, new Date(2026, 9, 1))).toBeGreaterThan(
      projectIndexAt(trend, new Date(2026, 0, 1)),
    )
  })

  it('returns null when every race happened on the same day', () => {
    const sameDay = buildEquivalentSeries(
      toAnalysableResults(
        ['1', '2', '3', '4'].map((id) =>
          makeEvent({ id, date: new Date(2026, 0, 1), eventType: 'km_10', time: `00:5${id}:00` }),
        ),
      ),
      10,
    )

    expect(computeIndexTrend(sameDay)).toBeNull()
  })
})

describe('goalTargetIndex', () => {
  const best = 51 * 60

  it('scores a time target against the standing best', () => {
    const index = goalTargetIndex(goal({ type: 'time_target', targetTime: '00:45:00' }), 10, best)
    // Um alvo mais rápido do que a melhor marca vale mais de 100.
    expect(index).toBeGreaterThan(100)
  })

  it('scores a pace target by turning it into a time', () => {
    const fromPace = goalTargetIndex(
      goal({ type: 'pace_target', targetPace: '4:30' }),
      10,
      best,
    )
    const fromTime = goalTargetIndex(
      goal({ type: 'time_target', targetTime: '00:45:00' }),
      10,
      best,
    )

    expect(fromPace).toBeCloseTo(fromTime!, 6)
  })

  it('has no fixed target for a PR goal or a malformed one', () => {
    expect(goalTargetIndex(goal({ type: 'pr_target' }), 10, best)).toBeNull()
    expect(goalTargetIndex(goal({ type: 'time_target', targetTime: 'x' }), 10, best)).toBeNull()
  })
})

describe('projectGoal', () => {
  const trend = computeIndexTrend(improvingSeries())!

  it('dates the crossing when the trend is heading there', () => {
    const projection = projectGoal(goal({}), trend, 110, new Date(2026, 9, 1))

    expect(projection.alreadyThere).toBe(false)
    expect(projection.reachedOn).toBeInstanceOf(Date)
    expect(projection.reachedOn!.getTime()).toBeGreaterThan(new Date(2026, 9, 1).getTime())
  })

  it('says so when the target is already met', () => {
    const projection = projectGoal(goal({}), trend, 50, new Date(2026, 9, 1))

    expect(projection.alreadyThere).toBe(true)
    expect(projection.reachedOn).toBeNull()
  })

  it('gives no date when the trend is flat or going the wrong way', () => {
    const declining = { ...trend, slopePerDay: -0.01 }
    const projection = projectGoal(goal({}), declining, 110, new Date(2026, 9, 1))

    expect(projection.reachedOn).toBeNull()
    expect(projection.alreadyThere).toBe(false)
  })
})
