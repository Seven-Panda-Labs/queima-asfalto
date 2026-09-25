import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'

/** What a wish is a wish for, as the page has to show it. */
export type WishSubject = {
  name: string
  location: string
  locationLat?: number
  locationLng?: number
}

/**
 * The race a wish points at, or what the wish itself still remembers.
 *
 * A wish is a marker on a race now, so the name and the place belong to the
 * race identity and are read from there: renaming a race renames the wish, and
 * the two can no longer disagree, which they could while both held a copy.
 *
 * The fallback is for the wishes written before the marker, which carried
 * their own name and nothing to point at. They keep working and keep showing
 * what the runner typed.
 */
export function wishSubject(item: BucketListItem, races: readonly Race[]): WishSubject {
  const race = item.raceId ? races.find((candidate) => candidate.id === item.raceId) : undefined
  if (!race) {
    return {
      name: item.name,
      location: item.location,
      locationLat: item.locationLat,
      locationLng: item.locationLng,
    }
  }

  return {
    name: race.name,
    location: race.location,
    // A place the race knows beats one the wish cached: the race is what gets
    // geocoded when a runner corrects it.
    locationLat: race.locationLat ?? item.locationLat,
    locationLng: race.locationLng ?? item.locationLng,
  }
}
