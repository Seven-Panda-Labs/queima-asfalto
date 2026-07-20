import type { Event } from '../types/Event'
import { toDateInputValue } from './date'

export function dateKey(date: Date): string {
  return toDateInputValue(date)
}

export function groupEventsByDay(events: Event[]): Map<string, Event[]> {
  const grouped = new Map<string, Event[]>()

  for (const event of events) {
    const key = dateKey(event.date)
    const dayEvents = grouped.get(key)

    if (dayEvents) {
      dayEvents.push(event)
    } else {
      grouped.set(key, [event])
    }
  }

  return grouped
}

export function getEventsForDate(events: Event[], date: Date): Event[] {
  const key = dateKey(date)
  return events.filter((event) => dateKey(event.date) === key)
}
