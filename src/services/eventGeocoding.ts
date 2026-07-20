import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { Event } from '../types/Event'
import { db } from './firebase'
import { geocodeLocation, geocodingLanguage } from './geocoding'

const EVENTS_COLLECTION = 'events'

export function eventHasCoordinates(event: Pick<Event, 'locationLat' | 'locationLng'>): boolean {
  return (
    typeof event.locationLat === 'number' &&
    typeof event.locationLng === 'number' &&
    Number.isFinite(event.locationLat) &&
    Number.isFinite(event.locationLng)
  )
}

export function coordinatesMatchLocation(event: Pick<Event, 'location' | 'locationGeocodeQuery'>): boolean {
  if (!event.locationGeocodeQuery) return false
  return event.locationGeocodeQuery.trim().toLowerCase() === event.location.trim().toLowerCase()
}

export function eventNeedsGeocoding(event: Pick<Event, 'location' | 'locationLat' | 'locationLng' | 'locationGeocodeQuery'>): boolean {
  const location = event.location.trim()
  if (!location || location === '??') return false
  if (!eventHasCoordinates(event)) return true
  return !coordinatesMatchLocation(event)
}

export async function geocodeAndUpdateEvent(
  eventId: string,
  location: string,
  language: string,
): Promise<boolean> {
  const trimmed = location.trim()
  if (!trimmed || trimmed === '??') return false

  const result = await geocodeLocation(trimmed, geocodingLanguage(language))
  if (!result) return false

  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    locationLat: result.lat,
    locationLng: result.lng,
    locationGeocodeQuery: trimmed,
    locationGeocodedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return true
}

export async function clearEventCoordinates(eventId: string): Promise<void> {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    locationLat: null,
    locationLng: null,
    locationGeocodeQuery: null,
    locationGeocodedAt: null,
    updatedAt: serverTimestamp(),
  })
}
