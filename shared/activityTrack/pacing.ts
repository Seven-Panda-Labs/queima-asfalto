/**
 * Structural on purpose, with no import.
 *
 * `TrackSplit` satisfies it, and keeping this file free of relative imports is
 * what lets the backfill script reuse it: scripts resolve modules as node16 and
 * would need explicit extensions all the way down the chain.
 */
type PacedSplit = {
  paceSecondsPerKm: number
  partial: boolean
}

/**
 * Below this a comparison is one kilometre against one, which says more about
 * where the start line was than about how the race was run.
 */
const MIN_FULL_SPLITS = 4

/**
 * How much the second half of a race was run slower than the first, in seconds
 * per kilometre. Negative means it finished faster than it started.
 *
 * Only whole kilometres take part. The trailing partial split is timed over a
 * shorter distance and its pace is extrapolated, which is exactly the kind of
 * noise this number cannot afford at the end of the race.
 *
 * With an odd number of splits the middle one is left out of both halves rather
 * than counted twice.
 */
export function computePacingDrift(splits: readonly PacedSplit[]): number | null {
  const full = splits.filter((split) => !split.partial)
  if (full.length < MIN_FULL_SPLITS) return null

  const half = Math.floor(full.length / 2)
  const mean = (values: readonly PacedSplit[]) =>
    values.reduce((sum, split) => sum + split.paceSecondsPerKm, 0) / values.length

  const drift = mean(full.slice(-half)) - mean(full.slice(0, half))
  return Math.round(drift * 10) / 10
}
