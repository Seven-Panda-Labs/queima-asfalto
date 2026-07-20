import type { Event, EventType } from '../types/Event'
import type {
  PerformanceGoal,
  PerformanceGoalProgressStatus,
  PerformanceGoalWithProgress,
} from '../types/PerformanceGoal'
import i18n from '../i18n'
import { parsePaceSeconds } from './pace'
import { parseTime } from './time'

function completedWithResults(events: Event[]): Event[] {
  return events.filter(
    (event) => event.status === 'completed' && event.pace && event.time,
  )
}

function eventsInYear(events: Event[], eventType: EventType, year: number): Event[] {
  return completedWithResults(events).filter(
    (event) => event.eventType === eventType && event.date.getFullYear() === year,
  )
}

function eventsBeforeYear(events: Event[], eventType: EventType, year: number): Event[] {
  return completedWithResults(events).filter(
    (event) => event.eventType === eventType && event.date.getFullYear() < year,
  )
}

function pickBestByPace(events: Event[]): Event | null {
  if (events.length === 0) return null

  return events.reduce((currentBest, candidate) => {
    const bestPace = parsePaceSeconds(currentBest.pace!)
    const candidatePace = parsePaceSeconds(candidate.pace!)
    if (bestPace === null) return candidate
    if (candidatePace === null) return currentBest
    return candidatePace < bestPace ? candidate : currentBest
  })
}

function pacePercentTowardTarget(currentSeconds: number, targetSeconds: number): number {
  if (currentSeconds <= targetSeconds) return 100
  return Math.min(99, Math.round((targetSeconds / currentSeconds) * 100))
}

function timePercentTowardTarget(currentSeconds: number, targetSeconds: number): number {
  if (currentSeconds <= targetSeconds) return 100
  return Math.min(99, Math.round((targetSeconds / currentSeconds) * 100))
}

function buildResult(
  goal: PerformanceGoal,
  status: PerformanceGoalProgressStatus,
  percent: number,
  progressLabel: string,
  currentPace?: string,
  currentTime?: string,
): PerformanceGoalWithProgress {
  return {
    ...goal,
    status,
    percent,
    progressLabel,
    currentPace,
    currentTime,
  }
}

function computePrTargetProgress(
  goal: PerformanceGoal,
  events: Event[],
): PerformanceGoalWithProgress {
  const yearBest = pickBestByPace(eventsInYear(events, goal.eventType, goal.year))
  if (!yearBest) {
    return buildResult(goal, 'no_data', 0, i18n.t('performanceGoal.noEventsInYear', { year: goal.year }))
  }

  const historicalBest = pickBestByPace(eventsBeforeYear(events, goal.eventType, goal.year))
  const yearPace = parsePaceSeconds(yearBest.pace!)
  const historicalPace = historicalBest ? parsePaceSeconds(historicalBest.pace!) : null

  const achieved =
    historicalPace === null || (yearPace !== null && yearPace < historicalPace)

  if (achieved) {
    return buildResult(
      goal,
      'achieved',
      100,
      i18n.t('performanceGoal.newPr', {
        pace: yearBest.pace,
        name: yearBest.name,
      }),
      yearBest.pace,
      yearBest.time,
    )
  }

  return buildResult(
    goal,
    'in_progress',
    0,
    i18n.t('performanceGoal.bestInYearPacePr', {
      year: goal.year,
      pace: yearBest.pace,
      historicalPace: historicalBest!.pace,
    }),
    yearBest.pace,
    yearBest.time,
  )
}

function computePaceTargetProgress(
  goal: PerformanceGoal,
  events: Event[],
): PerformanceGoalWithProgress {
  const targetPace = goal.targetPace
  if (!targetPace) {
    return buildResult(goal, 'no_data', 0, i18n.t('performanceGoal.missingTargetPace'))
  }

  const yearBest = pickBestByPace(eventsInYear(events, goal.eventType, goal.year))
  if (!yearBest) {
    return buildResult(goal, 'no_data', 0, i18n.t('performanceGoal.noEventsInYear', { year: goal.year }))
  }

  const targetSeconds = parsePaceSeconds(targetPace)
  const currentSeconds = parsePaceSeconds(yearBest.pace!)
  if (targetSeconds === null || currentSeconds === null) {
    return buildResult(goal, 'no_data', 0, i18n.t('performanceGoal.invalidPaceData'))
  }

  const achieved = currentSeconds <= targetSeconds
  const percent = pacePercentTowardTarget(currentSeconds, targetSeconds)

  if (achieved) {
    return buildResult(
      goal,
      'achieved',
      100,
      i18n.t('performanceGoal.bestPaceAchieved', {
        pace: yearBest.pace,
        target: targetPace,
      }),
      yearBest.pace,
      yearBest.time,
    )
  }

  return buildResult(
    goal,
    'in_progress',
    percent,
    i18n.t('performanceGoal.bestInYearPace', {
      year: goal.year,
      pace: yearBest.pace,
      target: targetPace,
    }),
    yearBest.pace,
    yearBest.time,
  )
}

function computeTimeTargetProgress(
  goal: PerformanceGoal,
  events: Event[],
): PerformanceGoalWithProgress {
  const targetTime = goal.targetTime
  if (!targetTime) {
    return buildResult(goal, 'no_data', 0, i18n.t('performanceGoal.missingTargetTime'))
  }

  const yearEvents = eventsInYear(events, goal.eventType, goal.year)
  const yearBest = yearEvents.reduce<Event | null>((currentBest, candidate) => {
    if (!currentBest) return candidate
    const bestTime = parseTime(currentBest.time!)
    const candidateTime = parseTime(candidate.time!)
    if (bestTime === null) return candidate
    if (candidateTime === null) return currentBest
    return candidateTime < bestTime ? candidate : currentBest
  }, null)

  if (!yearBest) {
    return buildResult(goal, 'no_data', 0, i18n.t('performanceGoal.noEventsInYear', { year: goal.year }))
  }

  const targetSeconds = parseTime(targetTime)
  const currentSeconds = parseTime(yearBest.time!)
  if (targetSeconds === null || currentSeconds === null) {
    return buildResult(goal, 'no_data', 0, i18n.t('performanceGoal.invalidTimeData'))
  }

  const achieved = currentSeconds <= targetSeconds
  const percent = timePercentTowardTarget(currentSeconds, targetSeconds)

  if (achieved) {
    return buildResult(
      goal,
      'achieved',
      100,
      i18n.t('performanceGoal.bestTimeAchieved', {
        time: yearBest.time,
        target: targetTime,
      }),
      yearBest.pace,
      yearBest.time,
    )
  }

  return buildResult(
    goal,
    'in_progress',
    percent,
    i18n.t('performanceGoal.bestInYearTime', {
      year: goal.year,
      time: yearBest.time,
      target: targetTime,
    }),
    yearBest.pace,
    yearBest.time,
  )
}

function applyPastYearFailure(
  goal: PerformanceGoal,
  progress: PerformanceGoalWithProgress,
): PerformanceGoalWithProgress {
  const currentYear = new Date().getFullYear()
  if (goal.year >= currentYear || progress.status === 'achieved') {
    return progress
  }

  return {
    ...progress,
    status: 'failed',
    progressLabel: i18n.t('performanceGoal.goalFailed'),
  }
}

export function computePerformanceGoalProgress(
  goal: PerformanceGoal,
  events: Event[],
): PerformanceGoalWithProgress {
  let progress: PerformanceGoalWithProgress
  switch (goal.type) {
    case 'pr_target':
      progress = computePrTargetProgress(goal, events)
      break
    case 'pace_target':
      progress = computePaceTargetProgress(goal, events)
      break
    case 'time_target':
      progress = computeTimeTargetProgress(goal, events)
      break
  }

  return applyPastYearFailure(goal, progress)
}

export function computeAllPerformanceGoalsProgress(
  goals: PerformanceGoal[],
  events: Event[],
): PerformanceGoalWithProgress[] {
  return goals.map((goal) => computePerformanceGoalProgress(goal, events))
}

export function isPerformanceGoalAchieved(goal: PerformanceGoal, events: Event[]): boolean {
  return computePerformanceGoalProgress(goal, events).status === 'achieved'
}
