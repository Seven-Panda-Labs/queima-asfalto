import type { EventType } from '../../types/Event'
import { EVENT_TYPES } from '../../types/Event'
import type { AnalysableResult } from './results'

/**
 * Measured by pace, matching `bestPerformances` on the Dashboard. Riegel
 * compares disciplines against each other; using it within one would give the
 * app a second, contradictory definition of "personal record".
 */
export type RecordMark = {
  result: AnalysableResult
  /** Seconds per km taken off the previous record; `null` for the first. */
  improvementSeconds: number | null
  /** Position within the discipline, starting at 1. */
  ordinal: number
}

export type RecordProgression = {
  eventType: EventType
  /** Only the races that beat the standing record, oldest first. */
  marks: RecordMark[]
  current: RecordMark
}

/** Races that beat the discipline record at the time they happened. */
export function recordMarksFor(
  results: AnalysableResult[],
  eventType: EventType,
): RecordMark[] {
  const marks: RecordMark[] = []
  let best: AnalysableResult | null = null

  for (const result of results) {
    if (result.eventType !== eventType) continue
    if (best !== null && result.paceSeconds >= best.paceSeconds) continue

    marks.push({
      result,
      improvementSeconds: best === null ? null : best.paceSeconds - result.paceSeconds,
      ordinal: marks.length + 1,
    })
    best = result
  }

  return marks
}

/** Expects `results` in chronological order. */
export function buildRecordProgressions(results: AnalysableResult[]): RecordProgression[] {
  return EVENT_TYPES.map((eventType) => {
    const marks = recordMarksFor(results, eventType)
    if (marks.length === 0) return null
    return { eventType, marks, current: marks[marks.length - 1]! }
  }).filter((progression): progression is RecordProgression => progression !== null)
}

/** Ids of races that ever held a record. */
export function recordResultIds(results: AnalysableResult[]): Set<string> {
  return new Set(
    buildRecordProgressions(results).flatMap((progression) =>
      progression.marks.map((mark) => mark.result.event.id),
    ),
  )
}

/** Records that fell in a year, counting each discipline's first. */
export function recordsSetIn(results: AnalysableResult[], year: number): number {
  return buildRecordProgressions(results).reduce(
    (count, progression) =>
      count + progression.marks.filter((mark) => mark.result.year === year).length,
    0,
  )
}
