import type { ParkrunCatalogEvent } from '../../shared/parkrun/catalog'
import { haversineMeters } from './activityTrack/metrics'

/**
 * parkruns as candidates, which no race calendar carries.
 *
 * They are the one kind of race a listing never publishes: free, weekly, and
 * the same 5 km every Saturday in a couple of thousand places. So the query is
 * not "what is on in October", it is "which ones are near me", and the answer
 * comes from the catalog the app already syncs.
 */
export type GeoPoint = { lat: number; lng: number }

export type NearbyParkrun = {
  event: ParkrunCatalogEvent
  /** Straight line, from the nearest reference point. */
  distanceKm: number
}

const SATURDAY = 6

/** parkrun's own series: 1 is the 5 km, 2 is the junior 2 km. */
const PARKRUN_SERIES_ID = 1

/**
 * The next Saturday, or today when today is one.
 *
 * A parkrun is always this Saturday: there is no entry, no deadline and no
 * edition to choose. 09:00 because that is the time nearly every country runs
 * it, and a planned event with no time at all would put it at midnight.
 */
export function nextParkrunDate(today: Date = new Date()): Date {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0, 0)
  const days = (SATURDAY - date.getDay() + 7) % 7
  date.setDate(date.getDate() + days)
  return date
}

/**
 * Where "near me" is measured from.
 *
 * The runner's own parkruns first, because they are evidence rather than a
 * guess: the ones they starred, and the ones they have actually run. Asking the
 * browser for a location is the fallback, not the opening move.
 */
export function referencePoints(
  catalog: readonly ParkrunCatalogEvent[],
  slugs: readonly string[],
): GeoPoint[] {
  const wanted = new Set(slugs.filter(Boolean))
  return catalog
    .filter((event) => wanted.has(event.slug))
    .map((event) => ({ lat: event.lat, lng: event.lng }))
}

function distanceKm(from: GeoPoint, to: GeoPoint): number {
  return haversineMeters({ lat: from.lat, lon: from.lng }, { lat: to.lat, lon: to.lng }) / 1000
}

/** Distance to whichever reference is closest: two cities means two homes. */
function nearestDistanceKm(event: ParkrunCatalogEvent, references: readonly GeoPoint[]): number {
  return references.reduce(
    (best, reference) => Math.min(best, distanceKm(reference, { lat: event.lat, lng: event.lng })),
    Number.POSITIVE_INFINITY,
  )
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export type NearbyOptions = {
  /** Free text over the event's names and its town. */
  place?: string
  limit?: number
}

export const DEFAULT_NEARBY_LIMIT = 6

/**
 * Beyond this it is somewhere you travel to, not a parkrun near you.
 *
 * Not a filter: parkrun does not operate in every country, and the nearest one
 * to Lisbon is 441 km away in Gibraltar. A radius would show a runner there an
 * empty list forever, where the distance shows them the truth and lets them
 * decide.
 */
export const NEARBY_KM = 60

/**
 * The 5 km parkruns worth offering, nearest first.
 *
 * Junior parkruns are left out: they are a 2 km event for children, and the app
 * would file one as a 5 km race.
 */
export function nearbyParkruns(
  catalog: readonly ParkrunCatalogEvent[],
  references: readonly GeoPoint[],
  options: NearbyOptions = {},
): NearbyParkrun[] {
  const place = normalize(options.place ?? '')
  const limit = options.limit ?? DEFAULT_NEARBY_LIMIT

  const adults = catalog.filter((event) => event.seriesId === PARKRUN_SERIES_ID)
  const matches = place
    ? adults.filter((event) =>
        normalize(`${event.longName} ${event.shortName} ${event.location}`).includes(place),
      )
    : adults

  if (references.length === 0) {
    // Nothing to measure from: a text search still works, and without one there
    // is nothing honest to offer out of two thousand events.
    return place ? matches.slice(0, limit).map((event) => ({ event, distanceKm: 0 })) : []
  }

  return matches
    .map((event) => ({ event, distanceKm: nearestDistanceKm(event, references) }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, limit)
}
