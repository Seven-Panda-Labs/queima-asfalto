import type { AnalysableResult } from './results'

/**
 * Inside this a race counts as evenly run. Watches and timing mats disagree by a
 * few seconds a kilometre anyway, and losing a little in the second half is what
 * almost everyone does: a tighter line paints normal racing as a failure.
 */
export const EVEN_PACING_BAND_SECONDS = 10

/**
 * Past this the second half was not a fade but a collapse.
 *
 * The point of a second line is that one colour for everything above 10 s/km
 * says nothing: it puts a race that drifted 13 s/km next to one that lost 67.
 */
export const HEAVY_PACING_FADE_SECONDS = 25

/**
 * The bars stand alone, so one race is worth drawing.
 *
 * The sentence underneath is the part that claims a habit, and that needs more
 * than one race to be a claim at all.
 */
export const MIN_PACING_RACES = 1
export const MIN_PACING_SUMMARY_RACES = 3

export type PacingBand = 'negative' | 'even' | 'fade' | 'heavy'

export function pacingBand(driftSeconds: number): PacingBand {
  if (driftSeconds < -EVEN_PACING_BAND_SECONDS) return 'negative'
  if (driftSeconds <= EVEN_PACING_BAND_SECONDS) return 'even'
  return driftSeconds > HEAVY_PACING_FADE_SECONDS ? 'heavy' : 'fade'
}

export type PacingPoint = {
  result: AnalysableResult
  date: Date
  /** Seconds per kilometre the second half was slower. Negative finished faster. */
  driftSeconds: number
}

export type PacingSummary = {
  points: PacingPoint[]
  /** Every race past the even band, whether it faded or collapsed. */
  faded: number
  even: number
  negative: number
  heavy: number
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
    return { points, faded: 0, even: 0, negative: 0, heavy: 0, medianDriftSeconds: 0 }
  }

  return {
    points,
    faded: points.filter((point) => pacingBand(point.driftSeconds) !== 'even'
      && pacingBand(point.driftSeconds) !== 'negative').length,
    even: points.filter((point) => pacingBand(point.driftSeconds) === 'even').length,
    negative: points.filter((point) => pacingBand(point.driftSeconds) === 'negative').length,
    heavy: points.filter((point) => pacingBand(point.driftSeconds) === 'heavy').length,
    medianDriftSeconds: median(points.map((point) => point.driftSeconds)),
  }
}
