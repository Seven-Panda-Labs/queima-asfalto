import type { RaceCatalogEdition } from './types.js'

/**
 * The soonest edition still ahead, as an ISO day.
 *
 * Falls back to the latest edition there is, so an entry whose dates are all
 * past still carries a date and sorts predictably rather than vanishing from
 * every query.
 */
export function nextRaceDateOf(
  editions: readonly RaceCatalogEdition[] | undefined,
  today: string,
): string | undefined {
  const dated = (editions ?? [])
    .map((edition) => edition.raceDate)
    .filter((date): date is string => Boolean(date))
    .sort()
  return dated.find((date) => date >= today) ?? dated[dated.length - 1]
}
