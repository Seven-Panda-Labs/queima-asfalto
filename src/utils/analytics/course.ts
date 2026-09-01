import type { Event } from '../../types/Event'
import { courseKey } from '../../domain/courseKey'
import { toAnalysableResults, type AnalysableResult } from './results'

export { courseKey }

/**
 * How far a race's distance may sit from the one being viewed and still count as
 * the same course.
 *
 * The same event is not always measured the same: B2Run Berlin is recorded at
 * 5.8 km one year and 5.7 km another. That is the same course. A race sharing a
 * name across wildly different distances is not, and comparing them would be
 * comparing efforts, not courses.
 */
const SAME_COURSE_DISTANCE_TOLERANCE = 0.2

export type CourseRun = {
  result: AnalysableResult
  /** 1 is the fastest running of this course. */
  rank: number
}

export type CourseHistory = {
  kind: 'ran'
  /** Every running of the course, oldest first. */
  runs: CourseRun[]
  current: CourseRun
  best: CourseRun
  /** The running immediately before this one. Null when this is the first. */
  previous: CourseRun | null
}

/** The same course, seen from a race that has not been run yet. */
export type CourseOutlook = {
  kind: 'upcoming'
  /** Past runnings, oldest first. */
  runs: CourseRun[]
  best: CourseRun
  latest: CourseRun
  /**
   * The best pace held over this event's distance.
   *
   * Derived, not a time anyone has run: the course is not always measured the
   * same, so the target is what that pace would give over the distance ahead.
   */
  targetSeconds: number
}

export type CourseComparison = CourseHistory | CourseOutlook

/** A race still to be run: the block ahead of it is a target, not a ranking. */
function isUpcoming(event: Event): boolean {
  return (event.status === 'planned' || event.status === 'confirmed') && !event.time?.trim()
}

function sameCourse(candidate: AnalysableResult, reference: Event): boolean {
  if (courseKey(candidate.event.name) !== courseKey(reference.name)) return false
  const spread = Math.abs(candidate.distanceKm - reference.realDistance) / reference.realDistance
  return spread <= SAME_COURSE_DISTANCE_TOLERANCE
}

/**
 * Where this running of a course sits among the others.
 *
 * Ranked by pace rather than by time, because the same course is not always
 * measured at the same distance and a time comparison would then reward the
 * year the course came up short.
 *
 * Null when there is nothing to compare against: one running is not a history.
 */
function rankRuns(matching: AnalysableResult[]): CourseRun[] {
  const byPace = [...matching].sort((left, right) => left.paceSeconds - right.paceSeconds)
  const rankOf = new Map(byPace.map((result, index) => [result.event.id, index + 1]))

  return matching.map((result) => ({
    result,
    rank: rankOf.get(result.event.id) ?? matching.length,
  }))
}

/**
 * How this race relates to the other runnings of its course.
 *
 * For a race already run, where it ranks among them. For one still ahead, what
 * there is to beat: the same comparison, minus a result of its own.
 *
 * Ranked by pace rather than by time, because the same course is not always
 * measured at the same distance and a time comparison would then reward the
 * year the course came up short.
 *
 * Null when there is nothing to compare against.
 */
export function buildCourseComparison(
  event: Event,
  allEvents: Event[],
): CourseComparison | null {
  const matching = toAnalysableResults(allEvents).filter((result) => sameCourse(result, event))
  const upcoming = isUpcoming(event)

  // A race ahead needs one previous running to have something to beat. A race
  // already run needs two, because one of them is itself.
  if (matching.length < (upcoming ? 1 : 2)) return null

  const runs = rankRuns(matching)
  const best = runs.find((run) => run.rank === 1) ?? runs[0]

  if (upcoming) {
    return {
      kind: 'upcoming',
      runs,
      best,
      latest: runs[runs.length - 1],
      targetSeconds: best.result.paceSeconds * event.realDistance,
    }
  }

  const currentIndex = runs.findIndex((run) => run.result.event.id === event.id)
  if (currentIndex === -1) return null

  return {
    kind: 'ran',
    runs,
    current: runs[currentIndex],
    best,
    previous: currentIndex > 0 ? runs[currentIndex - 1] : null,
  }
}
