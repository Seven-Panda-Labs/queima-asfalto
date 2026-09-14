import type { Event, EventType } from '../types/Event'
import { EVENT_TYPES } from '../types/Event'
import { pickFastestEvent } from '../domain/personalRecord'
import { formatEventTypeLabel } from '../types/Goal'
import { formatRelativeTimePt } from './date'

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
  // Both fields are required for the strip to have something to print, even
  // though ranking only ever needs the time.
  const completed = events.filter(
    (event) => event.status === 'completed' && event.pace && event.time,
  )

  const results: BestPerformance[] = []

  for (const eventType of EVENT_TYPES) {
    const best = pickFastestEvent(completed.filter((event) => event.eventType === eventType))
    if (!best) continue

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
