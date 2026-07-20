import type { Event } from '../types/Event'
import type { BucketListItemCreate } from '../types/BucketListItem'

export function eventToBucketListItem(event: Event): BucketListItemCreate {
  const eventType = event.eventType === 'km_10' ? 'km_10' : event.eventType
  return {
    name: event.name,
    location: event.location,
    locationLat: event.locationLat,
    locationLng: event.locationLng,
    locationGeocodeQuery: event.locationGeocodeQuery,
    realDistance: event.realDistance,
    disciplines: [eventType],
    emoji: event.emoji,
    notes: event.notes,
  }
}

export function canRecoverEventToBucketList(status: Event['status']): boolean {
  return status === 'cancelled' || status === 'missed'
}
