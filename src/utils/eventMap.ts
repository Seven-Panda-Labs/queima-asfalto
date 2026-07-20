import type { Event } from '../types/Event'
import { eventHasCoordinates } from '../services/eventGeocoding'

export function eventsWithCoordinates(events: Event[]): Event[] {
  return events.filter(eventHasCoordinates)
}

export function eventsWithoutCoordinates(events: Event[]): Event[] {
  return events.filter((event) => !eventHasCoordinates(event) && event.location.trim() && event.location !== '??')
}
