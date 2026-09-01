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

/**
 * Whether this entry is out of editions and needs someone to go and read the
 * next season off the organiser again.
 *
 * Derived rather than stored: an entry needs a new edition exactly when it has
 * none whose race day is still ahead. A stored `nextReviewAfter` would be one
 * more field to keep true, and it would say the same thing as the dates.
 *
 * Deliberately not a failing test. Data going stale because a date passed is not
 * a broken build, and CI that breaks on a calendar boundary with no code change
 * teaches people to ignore it. `npm run catalog:review` reports instead.
 */
export function needsEditionReview(
  race: RaceCatalogEntry,
  today: Date = new Date(),
): boolean {
  const editions = race.editions ?? []
  if (editions.length === 0) return true

  const todayIso = today.toISOString().slice(0, 10)
  return !editions.some((edition) => (edition.raceDate ?? '') > todayIso)
}

/** Entries needing a new edition, soonest typical month first, so the queue reads as a calendar. */
export function editionReviewQueue(
  races: readonly RaceCatalogEntry[],
  today: Date = new Date(),
): RaceCatalogEntry[] {
  const currentMonth = today.getUTCMonth() + 1
  const monthsAway = (race: RaceCatalogEntry) => {
    const month = race.typicalRaceMonth ?? 13
    return (month - currentMonth + 12) % 12
  }

  return races
    .filter((race) => needsEditionReview(race, today))
    .sort((left, right) => monthsAway(left) - monthsAway(right))
}
