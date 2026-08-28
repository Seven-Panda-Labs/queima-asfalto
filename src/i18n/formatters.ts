import type { EventStatus, EventType } from '../domain/eventCodes'
import type { GoalOutcome } from '../types/Goal'
import { normalizeImportSkipReason } from '../types/importSkipReasons'
import i18n from './index'

export function formatEventStatusLabel(status: EventStatus): string {
  return i18n.t(`eventStatus.${status}`)
}

export function formatEventTypeLabel(eventType: EventType): string {
  return i18n.t(`eventType.${eventType}`)
}

const GOAL_OUTCOME_SHORT_KEYS: Record<Exclude<GoalOutcome, 'in_progress'>, string> = {
  achieved: 'goals.outcomeAchieved',
  exceeded: 'goals.outcomeExceeded',
  crushed: 'goals.outcomeCrushed',
  failed: 'goals.outcomeFailed',
}

/** Desfecho em duas palavras, para caber num chip ou num cartão. */
export function formatGoalOutcomeShortLabel(outcome: GoalOutcome): string {
  if (outcome === 'in_progress') return ''
  return i18n.t(GOAL_OUTCOME_SHORT_KEYS[outcome])
}

export function isEnglishLocale(): boolean {
  return i18n.language === 'en'
}

export function formatImportSkipReason(reason: string): string {
  const normalized = normalizeImportSkipReason(reason)
  const key = `import.skipReasons.${normalized}`
  if (i18n.exists(key)) return i18n.t(key)
  return reason
}

export function formatBackupSectionLabel(section: string): string {
  const key = `backup.sections.${section}`
  if (i18n.exists(key)) return i18n.t(key)
  return section
}

export function formatBackupRejectReason(reason: string): string {
  const key = `backup.rejectReasons.${reason}`
  if (i18n.exists(key)) return i18n.t(key)
  return reason
}

export function formatBackupWarning(warning: string): string {
  const key = `backup.warnings.${warning}`
  if (i18n.exists(key)) return i18n.t(key)
  return warning
}
