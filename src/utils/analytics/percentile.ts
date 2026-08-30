import { parseClassification } from '../classification'
import type { AnalysableResult } from './results'

/**
 * Placing in the field. Classification is free text and may hold several lines
 * (overall, age group). Nothing says which is which, so line 1 is taken as
 * overall, the same reading `formatClassificationDisplay` already makes.
 */
export type FieldPlacing = {
  position: number
  total: number
  /** 0 is the winner, 1 is last. Lower is better. */
  fraction: number
  /** Rounded percentage of the field finished ahead of. */
  topPercent: number
}

export function parseFieldPlacing(classification?: string | null): FieldPlacing | null {
  if (!classification?.trim()) return null

  const firstLine = classification.split('\n')[0]?.replace(/^\d+\.\s*/, '').trim() ?? ''
  const parsed = parseClassification(firstLine)
  if (!parsed) return null
  if (parsed.position > parsed.total) return null

  const fraction = parsed.position / parsed.total
  return {
    position: parsed.position,
    total: parsed.total,
    fraction,
    topPercent: Math.max(1, Math.round(fraction * 100)),
  }
}

export type PercentilePoint = {
  result: AnalysableResult
  placing: FieldPlacing
}

/** Almost immune to the course, unlike pace: a slow race on a hard course still shows well here. */
export function buildPercentileSeries(results: AnalysableResult[]): PercentilePoint[] {
  return results
    .map((result) => {
      const placing = parseFieldPlacing(result.event.classification)
      return placing ? { result, placing } : null
    })
    .filter((point): point is PercentilePoint => point !== null)
}

export type PercentileSummary = {
  races: number
  bestTopPercent: number
  averageTopPercent: number
  best: PercentilePoint
}

export function summarisePercentiles(points: PercentilePoint[]): PercentileSummary | null {
  if (points.length === 0) return null

  const best = points.reduce((current, point) =>
    point.placing.fraction < current.placing.fraction ? point : current,
  )
  const average =
    points.reduce((sum, point) => sum + point.placing.fraction, 0) / points.length

  return {
    races: points.length,
    bestTopPercent: best.placing.topPercent,
    averageTopPercent: Math.max(1, Math.round(average * 100)),
    best,
  }
}
