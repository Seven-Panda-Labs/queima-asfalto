import type { RaceMilestone } from '../domain/raceMilestones'
import { scopedStorageKey } from './userStorage'

/**
 * Which of a race's marks have already had their moment.
 *
 * Per mark rather than per race: correcting a time re-runs the whole reading,
 * and a record that was already celebrated must not throw confetti twice while
 * a goal completed by the correction still gets its turn.
 *
 * This browser only. Losing it costs one repeated celebration, and the price of
 * doing better is a field on the event, a rule to guard it and a backup format
 * that has to carry it.
 */
function storageKey(userId: string, eventId: string): string {
  return scopedStorageKey(userId, `celebrated:${eventId}`)
}

function readSeen(userId: string, eventId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId, eventId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    // A browser with site data blocked reads as a runner who has seen nothing.
    return []
  }
}

export function unseenMilestones(
  userId: string,
  eventId: string,
  milestones: RaceMilestone[],
): RaceMilestone[] {
  const seen = new Set(readSeen(userId, eventId))
  return milestones.filter((milestone) => !seen.has(milestone.id))
}

export function markMilestonesSeen(
  userId: string,
  eventId: string,
  milestones: RaceMilestone[],
): void {
  if (milestones.length === 0) return

  const seen = new Set(readSeen(userId, eventId))
  for (const milestone of milestones) seen.add(milestone.id)

  try {
    localStorage.setItem(storageKey(userId, eventId), JSON.stringify([...seen]))
  } catch {
    // Nothing to do: the celebration has already happened, and repeating it once
    // beats failing the save it came from.
  }
}
