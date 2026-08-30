import type { PerformanceGoal } from '../../types/PerformanceGoal'
import { parsePaceSeconds } from '../pace'
import { parseTime } from '../time'
import { equivalentTimeSeconds, type EquivalentPoint } from './equivalence'
import { NOMINAL_DISTANCE_KM } from './results'

/** Below this a line is noise dressed as a trend. */
export const MIN_TREND_POINTS = 4

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type IndexTrend = {
  /** Index points gained per day. */
  slopePerDay: number
  interceptAtEpoch: number
  epochMs: number
  points: number
  /** Index gained over 12 months at the current rate. */
  yearlyChange: number
}

/** Least-squares fit of the form index against time. */
export function computeIndexTrend(series: EquivalentPoint[]): IndexTrend | null {
  if (series.length < MIN_TREND_POINTS) return null

  const epochMs = series[0]!.result.date.getTime()
  const xs = series.map((point) => (point.result.date.getTime() - epochMs) / MS_PER_DAY)
  const ys = series.map((point) => point.index)

  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length

  let numerator = 0
  let denominator = 0
  for (let index = 0; index < xs.length; index += 1) {
    const dx = xs[index]! - meanX
    numerator += dx * (ys[index]! - meanY)
    denominator += dx * dx
  }

  // Every race on the same day leaves no x axis to fit.
  if (denominator === 0) return null

  const slopePerDay = numerator / denominator

  return {
    slopePerDay,
    interceptAtEpoch: meanY - slopePerDay * meanX,
    epochMs,
    points: series.length,
    yearlyChange: slopePerDay * 365,
  }
}

export function projectIndexAt(trend: IndexTrend, date: Date): number {
  const days = (date.getTime() - trend.epochMs) / MS_PER_DAY
  return trend.interceptAtEpoch + trend.slopePerDay * days
}

/** The index a pace or time goal represents. A `pr_target` has no fixed number, so it is left out. */
export function goalTargetIndex(
  goal: PerformanceGoal,
  referenceKm: number,
  bestEquivalentSeconds: number,
): number | null {
  const distanceKm = NOMINAL_DISTANCE_KM[goal.eventType]

  let targetSeconds: number | null = null
  if (goal.type === 'pace_target' && goal.targetPace) {
    const pace = parsePaceSeconds(goal.targetPace)
    targetSeconds = pace === null ? null : pace * distanceKm
  } else if (goal.type === 'time_target' && goal.targetTime) {
    targetSeconds = parseTime(goal.targetTime)
  }

  if (targetSeconds === null || targetSeconds <= 0) return null

  const equivalent = equivalentTimeSeconds(targetSeconds, distanceKm, referenceKm)
  if (equivalent === null || equivalent <= 0) return null

  return (bestEquivalentSeconds / equivalent) * 100
}

export type GoalProjection = {
  goal: PerformanceGoal
  targetIndex: number
  /** Index the trend projects for today. */
  currentIndex: number
  /** `null` when already there, or when the trend never gets there. */
  reachedOn: Date | null
  alreadyThere: boolean
}

/** When the trend crosses the goal. A flat or falling trend returns no date, since extrapolating one is absurd either way. */
export function projectGoal(
  goal: PerformanceGoal,
  trend: IndexTrend,
  targetIndex: number,
  today: Date = new Date(),
): GoalProjection {
  const currentIndex = projectIndexAt(trend, today)

  if (currentIndex >= targetIndex) {
    return { goal, targetIndex, currentIndex, reachedOn: null, alreadyThere: true }
  }

  if (trend.slopePerDay <= 0) {
    return { goal, targetIndex, currentIndex, reachedOn: null, alreadyThere: false }
  }

  const days = (targetIndex - currentIndex) / trend.slopePerDay
  return {
    goal,
    targetIndex,
    currentIndex,
    reachedOn: new Date(today.getTime() + days * MS_PER_DAY),
    alreadyThere: false,
  }
}
