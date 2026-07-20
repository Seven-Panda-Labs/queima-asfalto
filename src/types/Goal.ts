import type { EventType } from './Event'
import { formatEventTypeLabel } from '../i18n/formatters'

export type Goal = {
  id: string
  userId: string
  eventType: EventType
  targetCount: number
  year: number
  emoji?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type GoalCreate = {
  eventType: EventType
  targetCount: number
  year: number
  emoji?: string
  notes?: string
}

export type GoalOutcome =
  | 'in_progress'
  | 'achieved'
  | 'exceeded'
  | 'crushed'
  | 'failed'

export type GoalWithProgress = Goal & {
  currentCount: number
  percent: number
  outcome: GoalOutcome
}

export function computeGoalOutcome(
  goal: Pick<Goal, 'targetCount' | 'year'>,
  currentCount: number,
  referenceYear = new Date().getFullYear(),
): GoalOutcome {
  if (goal.year < referenceYear && currentCount < goal.targetCount) {
    return 'failed'
  }

  if (currentCount < goal.targetCount) {
    return 'in_progress'
  }

  if (currentCount > goal.targetCount * 1.5) {
    return 'crushed'
  }

  if (currentCount > goal.targetCount) {
    return 'exceeded'
  }

  return 'achieved'
}

export function formatGoalLabel(goal: Pick<Goal, 'targetCount' | 'eventType'>): string {
  return `${goal.targetCount}x ${formatEventTypeLabel(goal.eventType)}`
}

export { formatEventTypeLabel, formatGoalOutcomeLabel } from '../i18n/formatters'
