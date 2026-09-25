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

/**
 * A key that puts the wishes in the order they will happen.
 *
 * Alphabetical is no order at all for a list of dates: the eye reads down it
 * looking for what is next and finds Egypt in January under a race in October.
 *
 * A typical month sorts at the end of the month it names, and at its next
 * occurrence rather than in the past: "usually November" read in December is
 * about next November. A wish the catalog says nothing about goes last, where
 * a race with no date belongs.
 */
export function wishSortKey(next: WishNextDate, today: Date = new Date()): string {
  if (!next) return '9999-99'
  if (next.kind === 'day') return next.day

  const year = next.month >= today.getMonth() + 1 ? today.getFullYear() : today.getFullYear() + 1
  return `${year}-${String(next.month).padStart(2, '0')}-99`
}
