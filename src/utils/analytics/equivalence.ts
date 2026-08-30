import type { EventType } from '../../types/Event'
import { EVENT_TYPES } from '../../types/Event'
import { NOMINAL_DISTANCE_KM, type AnalysableResult } from './results'

/**
 * Riegel's classic exponent. Fine between neighbouring distances; long
 * extrapolations (5K to marathon) run optimistic without an endurance base,
 * so these values are always labelled as estimates.
 */
export const RIEGEL_EXPONENT = 1.06

/** T2 = T1 × (D2 / D1) ^ 1.06 */
export function equivalentTimeSeconds(
  timeSeconds: number,
  fromKm: number,
  toKm: number,
): number | null {
  if (!(timeSeconds > 0) || !(fromKm > 0) || !(toKm > 0)) return null
  return timeSeconds * Math.pow(toKm / fromKm, RIEGEL_EXPONENT)
}

export type EquivalentPoint = {
  result: AnalysableResult
  /** What this result is worth at the reference distance. */
  equivalentSeconds: number
  /** 100 is the best result ever; 95 is 5% slower in equivalent time. */
  index: number
}

/**
 * The most-raced discipline, longest distance breaking ties. The choice does
 * not move the index or the curve: the reference factor cancels in the ratio
 * between two equivalent times. It only changes the unit the times read in.
 */
export function pickReferenceEventType(results: AnalysableResult[]): EventType | null {
  if (results.length === 0) return null

  const counts = new Map<EventType, number>()
  for (const result of results) {
    counts.set(result.eventType, (counts.get(result.eventType) ?? 0) + 1)
  }

  let best: EventType | null = null
  let bestCount = 0
  for (const eventType of EVENT_TYPES) {
    const count = counts.get(eventType) ?? 0
    if (count === 0) continue
    // EVENT_TYPES runs shortest to longest, so `>=` lets the longer win ties.
    if (count >= bestCount) {
      best = eventType
      bestCount = count
    }
  }

  return best
}

/** Every result on one axis, whatever the distance. Comparing paces could not do this across disciplines. */
export function buildEquivalentSeries(
  results: AnalysableResult[],
  referenceKm: number,
): EquivalentPoint[] {
  const equivalents = results
    .map((result) => ({
      result,
      equivalentSeconds: equivalentTimeSeconds(
        result.timeSeconds,
        result.distanceKm,
        referenceKm,
      ),
    }))
    .filter(
      (point): point is { result: AnalysableResult; equivalentSeconds: number } =>
        point.equivalentSeconds !== null,
    )

  if (equivalents.length === 0) return []

  const best = Math.min(...equivalents.map((point) => point.equivalentSeconds))

  return equivalents.map((point) => ({
    ...point,
    index: (best / point.equivalentSeconds) * 100,
  }))
}

export type RacePrediction = {
  eventType: EventType
  distanceKm: number
  predictedSeconds: number
}

export type RaceForecast = {
  predictions: RacePrediction[]
  /** The race the estimates came from, so the page can say so. */
  basedOn: AnalysableResult
  /** `false` when the window was empty and we reached further back. */
  fromRecentForm: boolean
}

/** Twelve months still describes current form. */
export const FORM_WINDOW_DAYS = 365

/** How far back to reach when the window is empty. */
const MIN_FALLBACK_RESULTS = 3

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Estimates from current form, not the all-time best: a four-year-old mark
 * predicts times nobody recognises as theirs. Within the window the strongest
 * race wins, not the latest, so one bad day does not drag every distance down.
 */
export function predictRaceTimes(
  results: AnalysableResult[],
  referenceKm: number,
  today: Date = new Date(),
): RaceForecast | null {
  if (results.length === 0) return null

  const cutoff = today.getTime() - FORM_WINDOW_DAYS * MS_PER_DAY
  const recent = results.filter((result) => result.date.getTime() >= cutoff)
  const fromRecentForm = recent.length > 0
  const candidates = fromRecentForm ? recent : results.slice(-MIN_FALLBACK_RESULTS)

  // The index is always measured against the all-time best, so the series
  // spans the whole history. Only the choice of base looks at the window.
  const series = buildEquivalentSeries(results, referenceKm)
  const inScope = new Set(candidates.map((result) => result.event.id))
  const scoped = series.filter((point) => inScope.has(point.result.event.id))
  if (scoped.length === 0) return null

  const base = scoped.reduce((best, point) =>
    point.equivalentSeconds < best.equivalentSeconds ? point : best,
  )

  const predictions = EVENT_TYPES.map((eventType) => {
    const distanceKm = NOMINAL_DISTANCE_KM[eventType]
    const predictedSeconds = equivalentTimeSeconds(
      base.result.timeSeconds,
      base.result.distanceKm,
      distanceKm,
    )
    if (predictedSeconds === null) return null
    return { eventType, distanceKm, predictedSeconds }
  }).filter((prediction): prediction is RacePrediction => prediction !== null)

  return { predictions, basedOn: base.result, fromRecentForm }
}
