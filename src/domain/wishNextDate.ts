import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'

/**
 * When a wish could next be run: a day, a month, or nothing yet.
 *
 * A race with no published date cannot be scheduled, so it waits as a wish
 * until the organiser publishes and the harvest brings the edition. Knowing
 * which of the two a wish is in is the difference between "this is a decision
 * now" and "this is still a dream", and it belongs beside the race rather than
 * in a panel of its own: most of them are neither urgent nor for this season.
 *
 * The typical month is the catalog's answer for a race whose next edition has
 * not been published. It is not a date and must never be treated as one, which
 * is why it is a different shape and not a guessed day.
 */
export type WishNextDate =
  | { kind: 'day'; day: string }
  | { kind: 'month'; month: number }
  | null

export function wishNextDate(
  item: BucketListItem,
  races: readonly Race[],
  entries: readonly RaceCatalogEntry[],
  today: Date = new Date(),
): WishNextDate {
  const catalogRaceId = item.raceId
    ? races.find((race) => race.id === item.raceId)?.catalogRaceId
    : undefined
  const entry = catalogRaceId ? entries.find((candidate) => candidate.id === catalogRaceId) : null
  if (!entry) return null

  const from = today.toISOString().slice(0, 10)
  const next = (entry.editions ?? [])
    .map((edition) => edition.raceDate)
    .filter((day): day is string => Boolean(day) && day! >= from)
    .sort()[0]
  if (next) return { kind: 'day', day: next }

  return entry.typicalRaceMonth ? { kind: 'month', month: entry.typicalRaceMonth } : null
}
