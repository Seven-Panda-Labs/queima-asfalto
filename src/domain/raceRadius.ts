import { haversineKm } from '../../shared/parkrun/resolveCatalogEvent'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'

/** Where a radius is measured from. */
export type Centre = { lat: number; lng: number }

/**
 * The distances a radius search offers, in km.
 *
 * A town, a region, a weekend's drive. Anything finer than ten kilometres is
 * noise given the coordinates are the organiser's own marker for the event.
 */
export const RADIUS_OPTIONS = [10, 25, 50, 100, 250] as const

export type Radius = (typeof RADIUS_OPTIONS)[number]

/**
 * The centre a typed place names, taken from the catalog itself.
 *
 * No geocoder: if a race in that town carries coordinates, that town has
 * coordinates. It improves as the harvest fills them in, and a place nothing
 * matches simply has no centre, which the page says rather than pretending the
 * radius applied.
 */
export function centreFromEntries(
  entries: readonly RaceCatalogEntry[],
  place: string,
): Centre | null {
  const wanted = normalise(place)
  if (!wanted) return null

  for (const entry of entries) {
    if (entry.latitude === undefined || entry.longitude === undefined) continue
    if (!normalise(entry.city).includes(wanted)) continue
    return { lat: entry.latitude, lng: entry.longitude }
  }
  return null
}

function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export type WithinRadius = {
  /** The entries inside the circle, nearest first. */
  entries: RaceCatalogEntry[]
  /** Entries the filter could not place, because the source published no point. */
  unplaced: number
}

/**
 * The entries within `km` of a centre, nearest first.
 *
 * An entry with no coordinates is not "far": it is unknown, and dropping it
 * silently would hide races the runner may well live next to. So the count
 * comes back with the results and the page says it.
 */
export function withinRadius(
  entries: readonly RaceCatalogEntry[],
  centre: Centre,
  km: number,
): WithinRadius {
  const inside: { entry: RaceCatalogEntry; distance: number }[] = []
  let unplaced = 0

  for (const entry of entries) {
    if (entry.latitude === undefined || entry.longitude === undefined) {
      unplaced += 1
      continue
    }
    const distance = haversineKm(centre.lat, centre.lng, entry.latitude, entry.longitude)
    if (distance <= km) inside.push({ entry, distance })
  }

  return {
    entries: inside.sort((left, right) => left.distance - right.distance).map((hit) => hit.entry),
    unplaced,
  }
}
