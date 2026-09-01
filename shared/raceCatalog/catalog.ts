import type { RaceCatalogEntry } from './types.js'

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function findCatalogRace(
  races: readonly RaceCatalogEntry[],
  id: string,
): RaceCatalogEntry | null {
  return races.find((race) => race.id === id) ?? null
}

/** Name or city, accent and case insensitive. Ordered as the catalog is. */
export function searchCatalogRaces(
  races: readonly RaceCatalogEntry[],
  query: string,
  limit = 20,
): RaceCatalogEntry[] {
  const needle = normalizeSearchText(query)
  if (!needle) return []

  return races
    .filter((race) => {
      const haystack = normalizeSearchText(`${race.name} ${race.city} ${race.country}`)
      return haystack.includes(needle)
    })
    .slice(0, limit)
}

/**
 * Whether anything may act on this entry's dates without a human in the loop.
 *
 * The one rule the review state exists for: an unreviewed entry can fill a field
 * the runner is looking at, and can never fire a reminder or state a deadline.
 */
export function canAssertDates(race: RaceCatalogEntry): boolean {
  return race.review === 'reviewed'
}

export function editionForYear(race: RaceCatalogEntry, year: number) {
  return race.editions?.find((edition) => edition.year === year) ?? null
}
