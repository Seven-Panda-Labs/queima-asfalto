import type { Event, EventType } from '../types/Event'
import type { Goal, GoalWithProgress } from '../types/Goal'
import { computeGoalOutcome } from '../types/Goal'

export function countCompletedEvents(
  events: Event[],
  eventType: EventType,
  year: number,
): number {
  return events.filter(
    (event) =>
      event.status === 'completed' &&
      event.eventType === eventType &&
      event.date.getFullYear() === year,
  ).length
}

export function computeGoalProgress(goal: Goal, events: Event[]): GoalWithProgress {
  const currentCount = countCompletedEvents(events, goal.eventType, goal.year)
  const percent = Math.min(100, (currentCount / goal.targetCount) * 100)
  const outcome = computeGoalOutcome(goal, currentCount)

  return {
    ...goal,
    currentCount,
    percent,
    outcome,
  }
}

export function computeAllGoalsProgress(goals: Goal[], events: Event[]): GoalWithProgress[] {
  return goals.map((goal) => computeGoalProgress(goal, events))
}

export function isGoalComplete(goal: Goal, events: Event[]): boolean {
  return countCompletedEvents(events, goal.eventType, goal.year) >= goal.targetCount
}
