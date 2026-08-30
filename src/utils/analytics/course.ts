import type { Event } from '../../types/Event'
import { toAnalysableResults, type AnalysableResult } from './results'

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
  /** Every running of the course, oldest first. */
  runs: CourseRun[]
  current: CourseRun
  best: CourseRun
  /** The running immediately before this one. Null when this is the first. */
  previous: CourseRun | null
}

/** Names are typed by hand year after year, so casing and spacing drift. */
export function normalizeCourseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function sameCourse(candidate: AnalysableResult, reference: Event): boolean {
  if (normalizeCourseName(candidate.event.name) !== normalizeCourseName(reference.name)) {
    return false
  }
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
export function buildCourseHistory(
  event: Event,
  allEvents: Event[],
): CourseHistory | null {
  const matching = toAnalysableResults(allEvents).filter((result) => sameCourse(result, event))
  if (matching.length < 2) return null

  const byPace = [...matching].sort((left, right) => left.paceSeconds - right.paceSeconds)
  const rankOf = new Map(byPace.map((result, index) => [result.event.id, index + 1]))

  const runs: CourseRun[] = matching.map((result) => ({
    result,
    rank: rankOf.get(result.event.id) ?? matching.length,
  }))

  const currentIndex = runs.findIndex((run) => run.result.event.id === event.id)
  if (currentIndex === -1) return null

  return {
    runs,
    current: runs[currentIndex],
    best: runs.find((run) => run.rank === 1) ?? runs[0],
    previous: currentIndex > 0 ? runs[currentIndex - 1] : null,
  }
}
