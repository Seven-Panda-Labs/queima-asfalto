import type { Event, EventType } from '../types/Event'
import type { Goal } from '../types/Goal'
import type { PerformanceGoal } from '../types/PerformanceGoal'
import { buildCourseComparison } from '../utils/analytics/course'
import { isAnalysableResult } from '../utils/analytics/results'
import { computePerformanceGoalProgress } from '../utils/performanceGoalProgress'
import { beatsRecordPace, pickFastestEvent, recordPaceSeconds } from './personalRecord'

/** Races that round a number worth stopping at. */
export const RACE_COUNT_MARKS = [10, 25, 50, 100]
export const DISTANCE_COUNT_MARKS = [5, 10, 25]
export const SEASON_DISTANCE_MARKS_KM = [100, 250, 500]

/** The race that later took the mark away. */
export type MilestoneSuperseded = {
  eventId: string
  eventName: string
  date: Date
}

type Base = {
  /** Unique within one race, and stable across sessions: it is the seen marker's key. */
  id: string
  /** Higher goes first. Anything superseded sorts after everything that still stands. */
  weight: number
}

export type RaceMilestone =
  | (Base & {
      kind: 'personal_record'
      eventType: EventType
      /** Seconds per km taken off the previous record. Null when it was the first. */
      improvementSeconds: number | null
      superseded: MilestoneSuperseded | null
    })
  | (Base & { kind: 'first_at_distance'; eventType: EventType })
  | (Base & {
      kind: 'course_record'
      /** Runnings of this course, this one included. */
      runs: number
      improvementSeconds: number
      superseded: MilestoneSuperseded | null
    })
  | (Base & { kind: 'annual_goal'; goal: Goal })
  | (Base & { kind: 'performance_goal'; goal: PerformanceGoal })
  | (Base & { kind: 'race_count'; ordinal: number })
  | (Base & { kind: 'distance_count'; eventType: EventType; ordinal: number })
  | (Base & { kind: 'season_distance'; year: number; markKm: number; totalKm: number })

export type RaceMilestoneInput = {
  event: Event
  /** The whole history, in any order. Later races decide what has since fallen. */
  events: Event[]
  goals: Goal[]
  performanceGoals: PerformanceGoal[]
}

/**
 * Completed races oldest first, with a total order.
 *
 * Two races on the same day have to fall on one side of each other for good, or
 * the tenth race of a runner's life changes with the order Firestore answers in.
 */
function inOrder(events: Event[]): Event[] {
  return events
    .filter((event) => event.status === 'completed')
    .slice()
    .sort((left, right) => {
      const byDate = left.date.getTime() - right.date.getTime()
      if (byDate !== 0) return byDate
      const byCreated = left.createdAt.getTime() - right.createdAt.getTime()
      if (byCreated !== 0) return byCreated
      return left.id.localeCompare(right.id)
    })
}

/** The first race after this one to beat the pace, among a set already in order. */
function firstToBeat(paceSeconds: number, later: Event[]): MilestoneSuperseded | null {
  for (const candidate of later) {
    const candidatePace = recordPaceSeconds(candidate)
    if (candidatePace === null) continue
    if (beatsRecordPace(candidatePace, paceSeconds)) {
      return { eventId: candidate.id, eventName: candidate.name, date: candidate.date }
    }
  }
  return null
}

function personalRecord(
  event: Event,
  before: Event[],
  after: Event[],
): RaceMilestone | null {
  const pace = recordPaceSeconds(event)
  if (pace === null) return null

  const sameDiscipline = (candidate: Event) => candidate.eventType === event.eventType
  const previous = pickFastestEvent(before.filter(sameDiscipline))
  const previousPace = previous ? recordPaceSeconds(previous) : null

  if (previousPace !== null && !beatsRecordPace(pace, previousPace)) return null

  return {
    kind: 'personal_record',
    id: 'record',
    weight: 100,
    eventType: event.eventType,
    improvementSeconds: previousPace === null ? null : previousPace - pace,
    superseded: firstToBeat(pace, after.filter(sameDiscipline)),
  }
}

/**
 * The fastest running of this course at the time.
 *
 * `buildCourseComparison` already knows what counts as the same course, and
 * needs a second running to have an opinion at all: one running is not a
 * history, and calling it a course record would be flattery.
 */
function courseRecord(event: Event, upTo: Event[], events: Event[]): RaceMilestone | null {
  const atTheTime = buildCourseComparison(event, upTo)
  if (!atTheTime || atTheTime.kind !== 'ran' || atTheTime.current.rank !== 1) return null

  const others = atTheTime.runs.filter((run) => run.result.event.id !== event.id)
  if (others.length === 0) return null
  const beaten = Math.min(...others.map((run) => run.result.paceSeconds))

  const since = buildCourseComparison(event, events)
  const runs = since?.kind === 'ran' ? since.runs : atTheTime.runs
  const currentIndex = runs.findIndex((run) => run.result.event.id === event.id)
  const superseded = firstToBeat(
    atTheTime.current.result.paceSeconds,
    runs.slice(currentIndex + 1).map((run) => run.result.event),
  )

  return {
    kind: 'course_record',
    id: 'course-record',
    weight: 70,
    runs: atTheTime.runs.length,
    improvementSeconds: beaten - atTheTime.current.result.paceSeconds,
    superseded,
  }
}

/**
 * A yearly goal this race was the last one needed for.
 *
 * Counted the way the goals page counts, races rather than results, so the
 * celebration fires on exactly the race that flips the card over there.
 */
function annualGoals(event: Event, upTo: Event[], goals: Goal[]): RaceMilestone[] {
  const year = event.date.getFullYear()

  return goals
    .filter((goal) => goal.eventType === event.eventType && goal.year === year)
    .filter((goal) => {
      const count = upTo.filter(
        (candidate) =>
          candidate.eventType === goal.eventType && candidate.date.getFullYear() === goal.year,
      ).length
      return count >= goal.targetCount && count - 1 < goal.targetCount
    })
    .map((goal) => ({
      kind: 'annual_goal' as const,
      id: `goal-${goal.id}`,
      weight: 90,
      goal,
    }))
}

/** A performance goal that was out of reach before this race and is met after it. */
function performanceGoals(
  event: Event,
  upTo: Event[],
  before: Event[],
  goals: PerformanceGoal[],
): RaceMilestone[] {
  const year = event.date.getFullYear()

  return goals
    .filter((goal) => goal.eventType === event.eventType && goal.year === year)
    .filter(
      (goal) =>
        computePerformanceGoalProgress(goal, upTo).status === 'achieved' &&
        computePerformanceGoalProgress(goal, before).status !== 'achieved',
    )
    .map((goal) => ({
      kind: 'performance_goal' as const,
      id: `performance-goal-${goal.id}`,
      weight: 85,
      goal,
    }))
}

function counts(event: Event, upTo: Event[], before: Event[]): RaceMilestone[] {
  const milestones: RaceMilestone[] = []

  // Only finishes with a time: a race started and given up on is not the
  // hundredth race anybody wants to be told about.
  const finished = upTo.filter(isAnalysableResult)
  const ordinal = finished.length

  if (RACE_COUNT_MARKS.includes(ordinal)) {
    milestones.push({ kind: 'race_count', id: `race-count-${ordinal}`, weight: 40, ordinal })
  }

  const atDistance = finished.filter((candidate) => candidate.eventType === event.eventType).length
  if (DISTANCE_COUNT_MARKS.includes(atDistance)) {
    milestones.push({
      kind: 'distance_count',
      id: `distance-count-${atDistance}`,
      weight: 45,
      eventType: event.eventType,
      ordinal: atDistance,
    })
  }

  const year = event.date.getFullYear()
  const inSeason = (races: Event[]) =>
    races
      .filter(isAnalysableResult)
      .filter((candidate) => candidate.date.getFullYear() === year)
      .reduce((total, candidate) => total + candidate.realDistance, 0)

  const totalKm = inSeason(upTo)
  const previousKm = inSeason(before)
  const crossed = SEASON_DISTANCE_MARKS_KM.filter(
    (mark) => totalKm >= mark && previousKm < mark,
  )
  const markKm = crossed[crossed.length - 1]
  if (markKm !== undefined) {
    milestones.push({
      kind: 'season_distance',
      id: `season-distance-${markKm}`,
      weight: 35,
      year,
      markKm,
      totalKm,
    })
  }

  return milestones
}

/**
 * What this race changed, read in the order things happened.
 *
 * A race entered years later is judged against the history it had then, not
 * against today's: it was a record when it was run, and `superseded` says so
 * when something has beaten it since. That is the only reading where entering
 * an old race tells the truth twice, in the moment it is saved and forever
 * after on the race's own page.
 */
export function computeRaceMilestones({
  event,
  events,
  goals,
  performanceGoals: performanceGoalList,
}: RaceMilestoneInput): RaceMilestone[] {
  if (event.status !== 'completed') return []

  const ordered = inOrder(events.some((candidate) => candidate.id === event.id)
    ? events.map((candidate) => (candidate.id === event.id ? event : candidate))
    : [...events, event])

  const index = ordered.findIndex((candidate) => candidate.id === event.id)
  if (index === -1) return []

  const before = ordered.slice(0, index)
  const upTo = ordered.slice(0, index + 1)
  const after = ordered.slice(index + 1)

  const milestones: RaceMilestone[] = []

  const record = personalRecord(event, before, after)
  if (record) milestones.push(record)

  if (
    isAnalysableResult(event) &&
    !before.some((candidate) => candidate.eventType === event.eventType)
  ) {
    milestones.push({
      kind: 'first_at_distance',
      id: 'first-at-distance',
      weight: 60,
      eventType: event.eventType,
    })
  }

  const course = courseRecord(event, upTo, ordered)
  if (course) milestones.push(course)

  milestones.push(...annualGoals(event, upTo, goals))
  milestones.push(...performanceGoals(event, upTo, before, performanceGoalList))
  milestones.push(...counts(event, upTo, before))

  return milestones.sort((left, right) => {
    const leftStands = isStanding(left) ? 0 : 1
    const rightStands = isStanding(right) ? 0 : 1
    if (leftStands !== rightStands) return leftStands - rightStands
    return right.weight - left.weight
  })
}

/** Whether the mark still holds today. Only records can be taken away. */
export function isStanding(milestone: RaceMilestone): boolean {
  if (milestone.kind === 'personal_record' || milestone.kind === 'course_record') {
    return milestone.superseded === null
  }
  return true
}

/** The marks a race keeps on its own page for good, superseded or not. */
export function durableMilestones(milestones: RaceMilestone[]): RaceMilestone[] {
  return milestones.filter(
    (milestone) =>
      milestone.kind === 'personal_record' || milestone.kind === 'course_record',
  )
}
