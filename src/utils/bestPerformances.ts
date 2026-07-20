import type { Event, EventType } from '../types/Event'
import { EVENT_TYPES } from '../types/Event'
import { formatEventTypeLabel } from '../types/Goal'
import { formatRelativeTimePt } from './date'
import { parseTime } from './time'

const PACE_PATTERN = /^(\d{1,2}):(\d{2})$/

function parsePaceSeconds(pace: string): number | null {
  const match = PACE_PATTERN.exec(pace.trim())
  if (!match) return null
  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (seconds > 59) return null
  return minutes * 60 + seconds
}

/** Negative when candidate is better than current best. */
function comparePerformanceCandidates(currentBest: Event, candidate: Event): number {
  const bestPace = parsePaceSeconds(currentBest.pace!)
  const candidatePace = parsePaceSeconds(candidate.pace!)
  if (bestPace === null) return -1
  if (candidatePace === null) return 1
  if (candidatePace !== bestPace) return candidatePace - bestPace

  if (candidate.realDistance === currentBest.realDistance) {
    const bestTime = parseTime(currentBest.time!)
    const candidateTime = parseTime(candidate.time!)
    if (bestTime !== null && candidateTime !== null) {
      return candidateTime - bestTime
    }
  }

  return 0
}

export type BestPerformance = {
  eventId: string
  eventType: EventType
  label: string
  eventName: string
  date: Date
  time: string
  pace: string
  recordAge: string
}

export function computeBestPerformances(events: Event[]): BestPerformance[] {
  const completed = events.filter(
    (event) => event.status === 'completed' && event.pace && event.time,
  )

  const results: BestPerformance[] = []

  for (const eventType of EVENT_TYPES) {
    const candidates = completed.filter((event) => event.eventType === eventType)
    if (candidates.length === 0) continue

    const best = candidates.reduce((currentBest, candidate) =>
      comparePerformanceCandidates(currentBest, candidate) < 0 ? candidate : currentBest,
    )

    results.push({
      eventId: best.id,
      eventType,
      label: formatEventTypeLabel(eventType),
      eventName: best.name,
      date: best.date,
      time: best.time!,
      pace: best.pace!,
      recordAge: formatRelativeTimePt(best.date),
    })
  }

  return results
}

export function getPersonalRecordIds(events: Event[]): Set<string> {
  return new Set(computeBestPerformances(events).map((performance) => performance.eventId))
}
