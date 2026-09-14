import type { Event } from '../types/Event'
import { toAnalysableResult } from '../utils/analytics/results'

/**
 * Seconds per kilometre, from the time and the distance actually run.
 *
 * The one measure the app ranks records by, and the reason it is not read from
 * `event.pace`: the stored field is rounded to the second per kilometre, and
 * over 10 km that rounding swallows three seconds of total time. Two races that
 * both print 5:20 are not the same race, and the faster one has to win.
 *
 * Distances that differ settle it the same way: a pace is already a time over a
 * distance, so nothing has to compare a 10 Km time against a 10,2 Km one.
 */
export function recordPaceSeconds(event: Event): number | null {
  return toAnalysableResult(event)?.paceSeconds ?? null
}

/**
 * Whether a pace beats the standing one.
 *
 * Strict, so an exact tie leaves the record where it is: the older mark got
 * there first and nothing ran faster.
 */
export function beatsRecordPace(candidateSeconds: number, recordSeconds: number): boolean {
  return candidateSeconds < recordSeconds
}

/** The fastest race of a set, by the measure above. Null when none can be ranked. */
export function pickFastestEvent(events: Event[]): Event | null {
  let best: Event | null = null
  let bestPace: number | null = null

  for (const event of events) {
    const pace = recordPaceSeconds(event)
    if (pace === null) continue
    if (bestPace === null || beatsRecordPace(pace, bestPace)) {
      best = event
      bestPace = pace
    }
  }

  return best
}
