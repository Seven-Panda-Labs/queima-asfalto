import type { BucketListItem } from '../types/BucketListItem'
import type { Event } from '../types/Event'
import type { Race } from '../types/Race'
import type { RaceEntry } from '../types/RaceEntry'
import { NOMINAL_DISTANCE_KM } from './eventCodes'
import { isAnchorFor } from './seasonAnchors'
import {
  racesServing,
  seasonDate,
  seasonWarnings,
  tuneUpFit,
  tuneUpWindowFor,
  type SeasonRace,
  type SeasonRuleId,
  type TuneUpWindow,
} from './seasonRules'

/** What the season rules have to say about one race. */
export type SeasonAnnotation = {
  window?: TuneUpWindow
  /** How many races are declared as preparing this anchor. */
  serving: number
  /** The anchor this race prepares, and how far ahead of it this race sits. */
  serves?: { name: string; weeksBefore: number }
  warnings: { rule: SeasonRuleId; count?: number }[]
}

export type SeasonBoard = {
  /** Keyed by race identity, because that is what every surface has. */
  byRaceId: Map<string, SeasonAnnotation>
  races: SeasonRace[]
}

export type SeasonSource = {
  races: readonly Race[]
  entries: readonly RaceEntry[]
  events: readonly Event[]
  /** Only for a wish nobody has scheduled: the name and the distance it carries. */
  items: readonly BucketListItem[]
  today?: Date
}

/**
 * The season, read off the calendar rather than off the wish list.
 *
 * Built from race identities, because that is the one thing a wish, an entry
 * and an event all point at. It used to be built from bucket list items, which
 * meant the rules went quiet for every race that had been scheduled: the wish
 * is offered for deletion the moment it becomes real, and a runner who plans
 * straight into the calendar never had one.
 */
export function buildSeasonBoard(source: SeasonSource): SeasonBoard {
  const today = source.today ?? new Date()

  const datesByRaceId = new Map<string, Date[]>()
  const add = (raceId: string | undefined, date: Date | undefined) => {
    if (!raceId || !date) return
    datesByRaceId.set(raceId, [...(datesByRaceId.get(raceId) ?? []), date])
  }
  for (const entry of source.entries) add(entry.raceId, entry.raceDate)
  for (const event of source.events) add(event.raceId, event.date)

  /** A race that was run, or should have been, and produced no result. */
  const failed = new Set(
    source.events
      .filter((event) => event.outcomeReason && event.raceId)
      .map((event) => event.raceId!),
  )

  /**
   * How long the race is, from whoever knows best.
   *
   * The nominal distance of an entry's discipline is the weakest answer and
   * often the only one: a race the runner is registered for, with no wish and
   * no event yet, says "half marathon" and nothing more. Then what the runner
   * typed on the wish, and then the event, which is the running that happened
   * at the distance it actually was.
   */
  const distanceByRaceId = new Map<string, number>()
  for (const entry of source.entries) {
    if (entry.raceId && entry.discipline) {
      distanceByRaceId.set(entry.raceId, NOMINAL_DISTANCE_KM[entry.discipline])
    }
  }
  for (const item of source.items) {
    if (item.raceId && item.realDistance > 0) distanceByRaceId.set(item.raceId, item.realDistance)
  }
  for (const event of source.events) {
    if (event.raceId && event.realDistance > 0) {
      distanceByRaceId.set(event.raceId, event.realDistance)
    }
  }

  const races: SeasonRace[] = []
  for (const race of source.races) {
    const date = seasonDate(datesByRaceId.get(race.id) ?? [], today)
    const distanceKm = distanceByRaceId.get(race.id)
    // No date is a race nobody has planned, and no distance is one no rule can
    // measure against an anchor.
    if (!date || !distanceKm) continue

    races.push({
      id: race.id,
      name: race.name,
      date,
      distanceKm,
      // Being an anchor is a fact about a season, so the season asked about is
      // the one this date falls in.
      isAnchor: isAnchorFor(race, date.getFullYear()),
      role: race.role,
      servesRaceId: race.servesRaceId,
      failed: failed.has(race.id),
    })
  }

  const warnings = seasonWarnings(races, today)
  const byId = new Map(races.map((race) => [race.id, race]))
  const byRaceId = new Map<string, SeasonAnnotation>()

  for (const race of races) {
    const anchor = race.servesRaceId ? byId.get(race.servesRaceId) : undefined
    // A window and a count of what is preparing it are planning, so they go
    // once the anchor has been run.
    const anchorAhead = race.isAnchor && race.date.getTime() >= today.getTime()

    byRaceId.set(race.id, {
      window: anchorAhead ? tuneUpWindowFor(race) : undefined,
      serving: anchorAhead ? racesServing(race.id, races).length : 0,
      serves: anchor
        ? { name: anchor.name, weeksBefore: tuneUpFit(anchor, race).weeksBefore }
        : undefined,
      warnings: warnings
        .filter((warning) => warning.raceId === race.id)
        .map(({ rule, count }) => ({ rule, count })),
    })
  }

  return { byRaceId, races }
}
