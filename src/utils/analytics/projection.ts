import type { PerformanceGoal } from '../../types/PerformanceGoal'
import { parsePaceSeconds } from '../pace'
import { parseTime } from '../time'
import { equivalentTimeSeconds, type EquivalentPoint } from './equivalence'
import { NOMINAL_DISTANCE_KM } from './results'

/** Abaixo disto uma recta é ruído com ar de tendência. */
export const MIN_TREND_POINTS = 4

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type IndexTrend = {
  /** Pontos de índice por dia (variação do índice por dia). */
  slopePerDay: number
  interceptAtEpoch: number
  epochMs: number
  points: number
  /** Ganho de índice em 12 meses ao ritmo actual. */
  yearlyChange: number
}

/** Regressão linear simples do índice de forma contra o tempo. */
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

  // Todas as provas no mesmo dia: sem eixo x não há recta.
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

/**
 * O índice que um objectivo de ritmo ou de tempo representa. Um `pr_target` não
 * tem número fixo — o alvo é a própria marca actual — por isso fica de fora.
 */
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
  /** Índice projectado para hoje pela tendência. */
  currentIndex: number
  /** `null` quando já se está lá, ou quando a tendência não lá chega. */
  reachedOn: Date | null
  alreadyThere: boolean
}

/**
 * Quando é que a tendência actual cruza o objectivo. Sem tendência a subir não
 * se devolve data nenhuma: extrapolar uma recta plana ou a descer daria uma
 * data no passado ou daqui a trinta anos, e ambas seriam ridículas.
 */
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
