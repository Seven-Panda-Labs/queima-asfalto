import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'

export type DatedWish = {
  item: BucketListItem
  entry: RaceCatalogEntry
  /** ISO day, `YYYY-MM-DD`: the edition this wish could become. */
  raceDate: string
}

/**
 * The wishes that stopped being dreams.
 *
 * A race with no published date cannot be scheduled, so it waits as a wish
 * until the organiser publishes and the harvest brings the edition. That is
 * the moment it becomes a decision, and nothing was saying so: the runner had
 * to open each wish to find out.
 *
 * Only a date still ahead counts, and only for the season being planned:
 * "Berlin has a date" is news in the year somebody is arranging, and noise in
 * every other.
 */
export function wishesWithADate(
  items: readonly BucketListItem[],
  races: readonly Race[],
  entries: readonly RaceCatalogEntry[],
  year: number,
  today: Date = new Date(),
): DatedWish[] {
  const catalogByRaceId = new Map(
    races.filter((race) => race.catalogRaceId).map((race) => [race.id, race.catalogRaceId!]),
  )
  const entryById = new Map(entries.map((entry) => [entry.id, entry]))
  const from = today.toISOString().slice(0, 10)

  const dated: DatedWish[] = []
  for (const item of items) {
    const catalogRaceId = item.raceId ? catalogByRaceId.get(item.raceId) : undefined
    const entry = catalogRaceId ? entryById.get(catalogRaceId) : undefined
    if (!entry) continue

    const edition = (entry.editions ?? [])
      .filter((candidate) => candidate.raceDate && candidate.year === year)
      .sort((left, right) => (left.raceDate ?? '').localeCompare(right.raceDate ?? ''))[0]
    if (!edition?.raceDate || edition.raceDate < from) continue

    dated.push({ item, entry, raceDate: edition.raceDate })
  }

  return dated.sort((left, right) => left.raceDate.localeCompare(right.raceDate))
}
