import type { EventStatus, EventType } from '../domain/eventCodes'
import type { GoalOutcome } from '../types/Goal'
import { EMOJI_OPTIONS } from '../constants/emojis'
import { normalizeImportSkipReason } from '../types/importSkipReasons'
import i18n from './index'

export function formatEventStatusLabel(status: EventStatus): string {
  return i18n.t(`eventStatus.${status}`)
}

export function formatEventTypeLabel(eventType: EventType): string {
  return i18n.t(`eventType.${eventType}`)
}

const GOAL_OUTCOME_KEYS: Record<Exclude<GoalOutcome, 'in_progress'>, string> = {
  achieved: 'voice.success.goalAchieved',
  exceeded: 'voice.success.goalExceeded',
  crushed: 'voice.success.goalCrushed',
  failed: 'goals.outcomeFailed',
}

export function formatGoalOutcomeLabel(outcome: GoalOutcome): string {
  if (outcome === 'in_progress') return ''
  return i18n.t(GOAL_OUTCOME_KEYS[outcome])
}

export function isEnglishLocale(): boolean {
  return i18n.language === 'en'
}

export function formatEmojiLabel(labelKey: string): string {
  return i18n.t(`emojis.${labelKey}`)
}

export function getEmojiLabel(emoji: string): string | undefined {
  const option = EMOJI_OPTIONS.find((item) => item.emoji === emoji)
  if (!option) return undefined
  return formatEmojiLabel(option.labelKey)
}

export function formatImportSkipReason(reason: string): string {
  const normalized = normalizeImportSkipReason(reason)
  const key = `import.skipReasons.${normalized}`
  if (i18n.exists(key)) return i18n.t(key)
  return reason
}
