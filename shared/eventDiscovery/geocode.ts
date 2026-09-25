import type { RaceCatalogEntry } from '../raceCatalog/types.js'

/**
 * Where a catalog race is, so a map and a radius can see it.
 *
 * Measured on 2026-09-25: 1777 of 5593 live entries publish coordinates and
 * 3816 do not, which is what makes the radius filter in discovery hide two
 * thirds of the catalog from somebody searching near a town.
 *
 * The town and the country are all the catalog has, and all a race needs: a
 * pin on a start line is precision nobody published and nobody asked for.
 */

/** What to ask the geocoder, or nothing when there is nothing to ask about. */
export function placeQueryFor(entry: RaceCatalogEntry): { text: string; country: string } | null {
  const city = entry.city?.trim()
  const country = entry.country?.trim().toLowerCase()
  if (!city || !country || country === 'xx') return null
  return { text: city, country }
}

/** A Geoapify answer, down to the one thing wanted from it. */
export function readPlace(body: unknown): { latitude: number; longitude: number } | null {
  const results = (body as { results?: { lat?: unknown; lon?: unknown }[] })?.results
  const first = Array.isArray(results) ? results[0] : undefined
  const latitude = typeof first?.lat === 'number' ? first.lat : NaN
  const longitude = typeof first?.lon === 'number' ? first.lon : NaN
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

function needsPlace(entry: RaceCatalogEntry): boolean {
  return (
    entry.retired !== true &&
    !entry.duplicateOfCatalogRaceId &&
    typeof entry.latitude !== 'number' &&
    placeQueryFor(entry) !== null
  )
}

/**
 * Which entries to look up next, longest unasked first.
 *
 * `placeReadAt` is written whether or not an answer came back, for the same
 * reason the organiser links have one: a town the geocoder cannot find would
 * otherwise be asked about every night and the rest of the catalog never
 * reached.
 */
export function racesNeedingPlace(
  catalog: readonly RaceCatalogEntry[],
  limit: number,
): RaceCatalogEntry[] {
  return catalog
    .filter(needsPlace)
    .sort(
      (left, right) =>
        (left.placeReadAt ?? '').localeCompare(right.placeReadAt ?? '') ||
        left.id.localeCompare(right.id),
    )
    .slice(0, limit)
}
