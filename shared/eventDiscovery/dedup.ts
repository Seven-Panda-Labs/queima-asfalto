import { raceKey } from './identity.js'
import type { DiscoveredRace } from './types.js'

/**
 * One race per listing, however many sources list it.
 *
 * Berlin shows up on at least four of the sources probed, so dedup is not a
 * refinement. A scheduled harvest merges once per run rather than once per
 * query, which is what lets this be ordinary pure code.
 *
 * Fields merge rather than the first winning: sources are patchy in different
 * places, and a deadline from one plus a price from another beats either alone.
 */
export function dedupeRaces(races: readonly DiscoveredRace[]): DiscoveredRace[] {
  const merged = new Map<string, DiscoveredRace>()

  for (const race of races) {
    const key = raceKey(race)
    const current = merged.get(key)
    if (!current) {
      merged.set(key, { ...race, distancesKm: [...race.distancesKm] })
      continue
    }

    merged.set(key, {
      ...current,
      // The longer name usually carries the edition and the organiser's wording.
      name: race.name.length > current.name.length ? race.name : current.name,
      city: current.city ?? race.city,
      region: current.region ?? race.region,
      country: current.country ?? race.country,
      distancesKm: [...new Set([...current.distancesKm, ...race.distancesKm])].sort(
        (left, right) => left - right,
      ),
      registrationClosesAt: current.registrationClosesAt ?? race.registrationClosesAt,
      lowPrice: current.lowPrice ?? race.lowPrice,
      highPrice: current.highPrice ?? race.highPrice,
      currency: current.currency ?? race.currency,
      // One source saying it is off is enough to stop suggesting it.
      cancelled: current.cancelled || race.cancelled,
    })
  }

  return [...merged.values()]
}
