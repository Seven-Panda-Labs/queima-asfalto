import type { TrackSplit } from '../domain/activityTrack'

export type SplitExtremes = {
  fastestIndex: number | null
  slowestIndex: number | null
}

/**
 * Which splits to mark as the fastest and the slowest.
 *
 * Only full kilometres take part. A trailing partial split is timed over a shorter
 * distance, so its extrapolated pace is the least reliable number in the table and
 * would win or lose the comparison for the wrong reason.
 */
export function splitExtremes(splits: TrackSplit[]): SplitExtremes {
  const full = splits.filter((split) => !split.partial)
  if (full.length < 2) return { fastestIndex: null, slowestIndex: null }

  let fastest = full[0]
  let slowest = full[0]
  for (const split of full) {
    if (split.paceSecondsPerKm < fastest.paceSecondsPerKm) fastest = split
    if (split.paceSecondsPerKm > slowest.paceSecondsPerKm) slowest = split
  }

  if (fastest.index === slowest.index) return { fastestIndex: null, slowestIndex: null }
  return { fastestIndex: fastest.index, slowestIndex: slowest.index }
}
