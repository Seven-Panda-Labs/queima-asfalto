import type { TFunction } from 'i18next'
import type { RaceMilestone } from '../domain/raceMilestones'
import type { Event } from '../types/Event'
import { formatEventTypeLabel } from '../i18n/formatters'
import { formatGoalLabel } from '../types/Goal'
import { formatPerformanceGoalLabel } from '../types/PerformanceGoal'
import { formatDurationSeconds, toAnalysableResult } from './analytics/results'

/**
 * A milestone in the three lines a card shows: what it is, the number that
 * proves it, and the context. The same shape serves the celebration and the
 * band the race keeps afterwards, so both read the same.
 */
export type MilestoneCard = {
  id: string
  emoji: string
  title: string
  value: string
  detail?: string
  /** Set once something has beaten this mark. */
  superseded?: { label: string; eventId: string }
}

const EMOJI: Record<RaceMilestone['kind'], string> = {
  personal_record: '🥇',
  first_at_distance: '🎬',
  course_record: '🏁',
  annual_goal: '🎯',
  performance_goal: '⚡',
  race_count: '📈',
  distance_count: '🔁',
  season_distance: '🛣️',
}

/** The race's own time, however it was recorded. */
function raceTime(event: Event): string {
  if (event.time) return event.time
  const result = toAnalysableResult(event)
  return result ? formatDurationSeconds(result.timeSeconds) : ''
}

/**
 * Seconds per kilometre, rounded for reading.
 *
 * Under half a second prints as zero, and "0 s/km faster" reads as a mistake,
 * so anything that small gets words instead of a number.
 */
function roundedDelta(seconds: number): number {
  return Math.round(seconds)
}

export function toMilestoneCard(
  milestone: RaceMilestone,
  event: Event,
  t: TFunction,
): MilestoneCard {
  const emoji = EMOJI[milestone.kind]
  const base = { id: milestone.id, emoji }

  switch (milestone.kind) {
    case 'personal_record': {
      const delta = milestone.improvementSeconds
      const detail =
        delta === null
          ? t('celebration.personalRecord.first')
          : roundedDelta(delta) < 1
            ? t('celebration.personalRecord.improvementTiny')
            : t('celebration.personalRecord.improvement', { delta: roundedDelta(delta) })

      return {
        ...base,
        title: t('celebration.personalRecord.title', {
          distance: formatEventTypeLabel(milestone.eventType),
        }),
        value: raceTime(event),
        detail,
        superseded: milestone.superseded
          ? {
              label: t('celebration.supersededBy', { name: milestone.superseded.eventName }),
              eventId: milestone.superseded.eventId,
            }
          : undefined,
      }
    }

    case 'first_at_distance':
      return {
        ...base,
        title: t('celebration.firstAtDistance.title', {
          distance: formatEventTypeLabel(milestone.eventType),
        }),
        value: raceTime(event),
        detail: t('celebration.firstAtDistance.detail'),
      }

    case 'course_record': {
      const delta = roundedDelta(milestone.improvementSeconds)
      return {
        ...base,
        title: t('celebration.courseRecord.title'),
        value: raceTime(event),
        detail:
          delta < 1
            ? t('celebration.courseRecord.detailTiny', { runs: milestone.runs })
            : t('celebration.courseRecord.detail', { runs: milestone.runs, delta }),
        superseded: milestone.superseded
          ? {
              label: t('celebration.supersededBy', { name: milestone.superseded.eventName }),
              eventId: milestone.superseded.eventId,
            }
          : undefined,
      }
    }

    case 'annual_goal':
      return {
        ...base,
        title: t('celebration.annualGoal.title'),
        value: formatGoalLabel(milestone.goal),
        detail: t('celebration.annualGoal.detail', { year: milestone.goal.year }),
      }

    case 'performance_goal':
      return {
        ...base,
        title: t('celebration.performanceGoal.title'),
        value: formatPerformanceGoalLabel(milestone.goal),
        detail: t('celebration.performanceGoal.detail', { year: milestone.goal.year }),
      }

    case 'race_count':
      return {
        ...base,
        title: t('celebration.raceCount.title'),
        value: String(milestone.ordinal),
        detail: t('celebration.raceCount.detail'),
      }

    case 'distance_count':
      return {
        ...base,
        title: t('celebration.distanceCount.title', {
          distance: formatEventTypeLabel(milestone.eventType),
        }),
        value: String(milestone.ordinal),
        detail: t('celebration.distanceCount.detail'),
      }

    case 'season_distance':
      return {
        ...base,
        title: t('celebration.seasonDistance.title'),
        value: t('celebration.seasonDistance.value', { km: milestone.markKm }),
        detail: t('celebration.seasonDistance.detail', { year: milestone.year }),
      }
  }
}

export function toMilestoneCards(
  milestones: RaceMilestone[],
  event: Event,
  t: TFunction,
): MilestoneCard[] {
  return milestones.map((milestone) => toMilestoneCard(milestone, event, t))
}
