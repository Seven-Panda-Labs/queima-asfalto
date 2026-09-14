import type { TFunction } from 'i18next'
import type { RaceMilestone } from '../domain/raceMilestones'
import { isStanding } from '../domain/raceMilestones'
import { pickRandomLine } from '../utils/pickVoiceLine'

export type CelebrationVoiceSection = 'record' | 'goal' | 'generic' | 'past'

/**
 * Which voice the day deserves.
 *
 * A record that still stands leads, then a goal that closed. A race whose marks
 * have all been beaten since gets its own register: it was big at the time, and
 * saying otherwise would be lying to somebody typing in their own history.
 */
export function celebrationVoiceSection(milestones: RaceMilestone[]): CelebrationVoiceSection {
  const standing = milestones.filter(isStanding)
  if (standing.some((milestone) => milestone.kind === 'personal_record')) return 'record'
  if (
    standing.some(
      (milestone) => milestone.kind === 'annual_goal' || milestone.kind === 'performance_goal',
    )
  ) {
    return 'goal'
  }
  if (standing.length === 0) return 'past'
  return 'generic'
}

function readLinePool(t: TFunction, key: string): string[] {
  const value = t(key, { returnObjects: true })
  if (!Array.isArray(value)) return []
  return value.filter((line): line is string => typeof line === 'string' && line.length > 0)
}

/**
 * A stable number for a race, so the line does not change on every render. The
 * same race says the same thing every time it is opened.
 */
export function voiceSeed(eventId: string): number {
  let seed = 0
  for (let index = 0; index < eventId.length; index += 1) {
    seed = (seed * 31 + eventId.charCodeAt(index)) % 100000
  }
  return seed
}

export function pickCelebrationVoice(
  t: TFunction,
  section: CelebrationVoiceSection,
  seed: number,
): { primary: string; secondary: string } {
  const primary = readLinePool(t, `voice.celebration.${section}.primary`)
  const secondary = readLinePool(t, `voice.celebration.${section}.secondary`)

  return {
    primary: pickRandomLine(primary, seed),
    secondary: pickRandomLine(secondary, seed + 1),
  }
}
