import type { BucketListItemCreate } from '../types/BucketListItem'
import type { Event } from '../types/Event'

/**
 * A race that did not happen, back on the list of ones somebody wants.
 *
 * A marker, like every wish: the event already points at the race identity,
 * which is what carries the name and the place. The note comes along because
 * it is the runner's own words about why they wanted it.
 */
export function eventToBucketListItem(event: Event): BucketListItemCreate {
  return {
    ...(event.raceId ? { raceId: event.raceId } : { name: event.name, location: event.location }),
    notes: event.notes,
  }
}

export function canRecoverEventToBucketList(status: Event['status']): boolean {
  return status === 'cancelled' || status === 'missed'
}
