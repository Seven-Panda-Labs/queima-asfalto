import type { Event } from '../types/Event'
import type { Race } from '../types/Race'
import type { RaceEntry } from '../types/RaceEntry'

export type UncalendaredEntry = {
  entry: RaceEntry
  race: Race
}

/**
 * The places being chased for a season that has no calendar yet.
 *
 * A lottery is entered a year ahead and a race that did not happen is tried
 * again the season after, both before anybody knows the day. The entry exists,
 * the event does not, and until now that left the entry with nowhere to be:
 * it showed on the deadline card and could not be opened.
 *
 * Once the race is scheduled the event is where it lives, so anything with one
 * is left out of here.
 */
export function entriesWithoutACalendar(
  entries: readonly RaceEntry[],
  events: readonly Event[],
  races: readonly Race[],
  year: number,
): UncalendaredEntry[] {
  const scheduled = new Set(
    events
      .filter((event) => event.status !== 'cancelled' && event.date.getFullYear() === year)
      .map((event) => event.raceId)
      .filter((raceId): raceId is string => Boolean(raceId)),
  )
  const raceById = new Map(races.map((race) => [race.id, race]))

  return entries
    .filter((entry) => entry.year === year && !scheduled.has(entry.raceId))
    .flatMap((entry) => {
      const race = raceById.get(entry.raceId)
      return race ? [{ entry, race }] : []
    })
    .sort((left, right) => left.race.name.localeCompare(right.race.name))
}
