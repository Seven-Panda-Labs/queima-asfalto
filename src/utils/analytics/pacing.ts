import type { AnalysableResult } from './results'

/**
 * Inside this band a race counts as evenly run. Watches and timing mats disagree
 * by a few seconds a kilometre anyway, so a tighter line would report noise as
 * a pacing decision.
 */
export const EVEN_PACING_BAND_SECONDS = 5

/** Below this the chart is drawing a habit through too few races to have one. */
export const MIN_PACING_RACES = 5

export type PacingPoint = {
  result: AnalysableResult
  date: Date
  /** Seconds per kilometre the second half was slower. Negative finished faster. */
  driftSeconds: number
}

export type PacingSummary = {
  points: PacingPoint[]
  faded: number
  even: number
  negative: number
  medianDriftSeconds: number
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

/**
 * The season's races carrying a drift, oldest first.
 *
 * Takes analysable results rather than raw events so it inherits the page's
 * discipline filter, and is scoped to one season because it sits among the
 * season blocks: a career-long chart under a heading that says 2026 reads as a
 * mistake, whichever way round it is.
 */
export function buildPacingSummary(
  results: readonly AnalysableResult[],
  season: number,
): PacingSummary {
  const points: PacingPoint[] = results
    .filter((result) => result.year === season)
    .filter(
      (result) =>
        typeof result.event.trackPacingDriftSeconds === 'number' &&
        Number.isFinite(result.event.trackPacingDriftSeconds),
    )
    .map((result) => ({
      result,
      date: result.date,
      driftSeconds: result.event.trackPacingDriftSeconds as number,
    }))
    .sort((left, right) => left.date.getTime() - right.date.getTime())

  if (points.length === 0) {
    return { points, faded: 0, even: 0, negative: 0, medianDriftSeconds: 0 }
  }

  return {
    points,
    faded: points.filter((point) => point.driftSeconds > EVEN_PACING_BAND_SECONDS).length,
    even: points.filter(
      (point) => Math.abs(point.driftSeconds) <= EVEN_PACING_BAND_SECONDS,
    ).length,
    negative: points.filter((point) => point.driftSeconds < -EVEN_PACING_BAND_SECONDS).length,
    medianDriftSeconds: median(points.map((point) => point.driftSeconds)),
  }
}
