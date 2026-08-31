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

/**
 * A key that groups the same race however its name was typed that year.
 *
 * The words are sorted, so "Parkrun Hasenheide" and "Hasenheide Parkrun" land on
 * the same key. Casing, spacing, punctuation and accents are flattened for the
 * same reason: the name is typed by hand every time.
 *
 * Four digit years are dropped, so "Hasenheide Parkrun 2023" joins the rest.
 * Other numbers stay: "S 25 Berlin" without its 25 is a different race.
 *
 * Deliberately not fuzzy. Edit distance would put "Meia Maratona de Lisboa" with
 * "Maratona de Lisboa", and a rule nobody can predict is worse than one that
 * occasionally asks you to fix a name.
 */
export function courseKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !/^(19|20)\d{2}$/.test(token))
    .sort()
    .join(' ')
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
