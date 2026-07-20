import type { EventType } from './Event'
import { formatEventTypeLabel } from './Goal'
import i18n from '../i18n'
import { normalizePace, validatePace } from '../utils/pace'
import { normalizeTime, validateTime } from '../utils/time'

export type PerformanceGoalType = 'pr_target' | 'pace_target' | 'time_target'

export const PERFORMANCE_GOAL_TYPES: PerformanceGoalType[] = [
  'pr_target',
  'pace_target',
  'time_target',
]

const PERFORMANCE_GOAL_TYPE_KEYS: Record<PerformanceGoalType, string> = {
  pr_target: 'performanceGoal.typePr',
  pace_target: 'performanceGoal.typePace',
  time_target: 'performanceGoal.typeTime',
}

export type PerformanceGoal = {
  id: string
  userId: string
  type: PerformanceGoalType
  eventType: EventType
  year: number
  targetPace?: string
  targetTime?: string
  emoji?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type PerformanceGoalCreate = {
  type: PerformanceGoalType
  eventType: EventType
  year: number
  targetPace?: string
  targetTime?: string
  emoji?: string
  notes?: string
}

export type PerformanceGoalProgressStatus = 'no_data' | 'in_progress' | 'achieved' | 'failed'

export type PerformanceGoalWithProgress = PerformanceGoal & {
  status: PerformanceGoalProgressStatus
  percent: number
  currentPace?: string
  currentTime?: string
  progressLabel: string
}

export type PerformanceGoalFieldErrors = Partial<
  Record<'type' | 'eventType' | 'year' | 'targetPace' | 'targetTime', string>
>

export function formatPerformanceGoalTypeLabel(type: PerformanceGoalType): string {
  return i18n.t(PERFORMANCE_GOAL_TYPE_KEYS[type])
}

export function formatPerformanceGoalLabel(
  goal: Pick<PerformanceGoal, 'type' | 'eventType' | 'targetPace' | 'targetTime'>,
): string {
  const eventLabel = formatEventTypeLabel(goal.eventType)
  const typeLabel = formatPerformanceGoalTypeLabel(goal.type)

  switch (goal.type) {
    case 'pr_target':
      return `${typeLabel} — ${eventLabel}`
    case 'pace_target':
      return `${typeLabel} ≤ ${goal.targetPace} — ${eventLabel}`
    case 'time_target':
      return `${typeLabel} ≤ ${goal.targetTime} — ${eventLabel}`
  }
}

export function validatePerformanceGoalFields(
  input: PerformanceGoalCreate,
): PerformanceGoalFieldErrors {
  const errors: PerformanceGoalFieldErrors = {}

  if (!PERFORMANCE_GOAL_TYPES.includes(input.type)) {
    errors.type = i18n.t('validation.invalidPerformanceGoalType')
  }

  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 2100) {
    errors.year = i18n.t('validation.invalidYear')
  }

  if (input.type === 'pace_target') {
    if (!input.targetPace?.trim()) {
      errors.targetPace = i18n.t('validation.targetPaceRequired')
    } else if (!validatePace(input.targetPace)) {
      errors.targetPace = i18n.t('validation.invalidPaceFormat')
    }
  } else if (input.targetPace !== undefined) {
    errors.targetPace = i18n.t('validation.targetPaceOnlyForPaceGoal')
  }

  if (input.type === 'time_target') {
    if (!input.targetTime?.trim()) {
      errors.targetTime = i18n.t('validation.targetTimeRequired')
    } else if (!validateTime(input.targetTime)) {
      errors.targetTime = i18n.t('validation.invalidTimeFormat')
    }
  } else if (input.targetTime !== undefined) {
    errors.targetTime = i18n.t('validation.targetTimeOnlyForTimeGoal')
  }

  if (input.type === 'pr_target') {
    if (input.targetPace !== undefined) {
      errors.targetPace = i18n.t('validation.prGoalNoTargetPace')
    }
    if (input.targetTime !== undefined) {
      errors.targetTime = i18n.t('validation.prGoalNoTargetTime')
    }
  }

  return errors
}

export function normalizePerformanceGoalCreate(data: PerformanceGoalCreate): PerformanceGoalCreate {
  const normalized: PerformanceGoalCreate = {
    type: data.type,
    eventType: data.eventType,
    year: data.year,
    emoji: data.emoji?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
  }

  if (data.type === 'pace_target' && data.targetPace) {
    normalized.targetPace = normalizePace(data.targetPace) ?? data.targetPace.trim()
  }

  if (data.type === 'time_target' && data.targetTime) {
    normalized.targetTime = normalizeTime(data.targetTime) ?? data.targetTime.trim()
  }

  return normalized
}

export function parsePerformanceGoalCreate(
  input: PerformanceGoalCreate,
): PerformanceGoalCreate | null {
  const normalized = normalizePerformanceGoalCreate(input)
  const errors = validatePerformanceGoalFields(normalized)
  if (Object.keys(errors).length > 0) return null
  return normalized
}
