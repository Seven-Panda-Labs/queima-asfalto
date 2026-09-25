import type { Event } from '../types/Event'
import type { EventStatus, EventType } from './eventCodes'

export type SeasonRace = {
  id: string
  name: string
  date: Date
  eventType: EventType
  status: EventStatus
  isAnchor: boolean
  /** False for a race in the leg that belongs to the year before or after. */
  inSeason: boolean
}

/**
 * One run at one anchor: the races that lead to it, and the anchor itself.
 *
 * The last leg of a season has no anchor. It is still worth showing, because
 * what is after the last anchor is either next season's build-up or a gap
 * nobody meant to leave.
 */
export type SeasonLeg = {
  /** The race everything in this leg is preparing, when there is one. */
  anchor: SeasonRace | null
  /** In date order, anchor excluded. */
  leadUp: SeasonRace[]
}

function toSeasonRace(
  event: Event,
  anchorRaceIds: ReadonlySet<string>,
  year: number,
): SeasonRace {
  return {
    id: event.id,
    name: event.name,
    date: event.date,
    eventType: event.eventType,
    status: event.status,
    isAnchor: Boolean(event.raceId && anchorRaceIds.has(event.raceId)),
    inSeason: event.date.getFullYear() === year,
  }
}

/**
 * How far back a build-up can reach and still be one.
 *
 * A cycle around an anchor runs months, not years, and without a limit a leg
 * whose anchor is the first in three seasons would drag every race since.
 */
const LEAD_UP_MONTHS = 12

function withinLeadUp(race: SeasonRace, anchor: SeasonRace | null): boolean {
  if (!anchor) return true
  const earliest = new Date(anchor.date)
  earliest.setMonth(earliest.getMonth() - LEAD_UP_MONTHS)
  return race.date >= earliest
}

/**
 * A season as the paths to its anchors, rather than as twelve months.
 *
 * Every runner interviewed plans the same way: one to three races a year fix
 * the calendar, and the rest are steps towards them. A grid of months asks the
 * wrong question, which is "what is in June"; the question being asked is "what
 * am I doing between now and the anchor in October".
 *
 * A leg runs from the day after the previous anchor to the anchor that closes
 * it, so a race belongs to the anchor it comes before. Two anchors on the same
 * day are two legs, and the second one is empty, which is honest: nothing was
 * preparing it that was not also preparing the first.
 *
 * A cancelled race is not part of the season. A race that has been run is, and
 * so is one nobody got into: what happened is what the rest was arranged
 * around.
 */
export function seasonTimeline(
  events: readonly Event[],
  year: number,
  anchorRaceIds: ReadonlySet<string> = new Set(),
): SeasonLeg[] {
  const races = events
    .filter((event) => event.status !== 'cancelled')
    .map((event) => toSeasonRace(event, anchorRaceIds, year))
    .sort((left, right) => left.date.getTime() - right.date.getTime())

  // Every leg there is, across every year, because a cycle does not stop at
  // the new year: a build-up for an April anchor starts the previous autumn.
  const all: SeasonLeg[] = []
  let leadUp: SeasonRace[] = []
  for (const race of races) {
    if (!race.isAnchor) {
      leadUp.push(race)
      continue
    }
    // A race a year and a half before an anchor is not preparing it. It gets a
    // leg of its own rather than disappearing from the season it is in.
    const preparing = leadUp.filter((earlier) => withinLeadUp(earlier, race))
    const unrelated = leadUp.filter((earlier) => !withinLeadUp(earlier, race))
    if (unrelated.length > 0) all.push({ anchor: null, leadUp: unrelated })
    all.push({ anchor: race, leadUp: preparing })
    leadUp = []
  }
  if (leadUp.length > 0) all.push({ anchor: null, leadUp })

  const legs = all.filter(
    (leg) => leg.anchor?.inSeason || leg.leadUp.some((race) => race.inSeason),
  )

  // A season with nothing in it is still a season somebody is planning.
  return legs.length > 0 ? legs : [{ anchor: null, leadUp: [] }]
}

/**
 * The window between two races, for finding something to put in it.
 *
 * Inclusive ISO days, and it is the gap itself rather than the races: the day
 * after the one before, up to the day before the one after. An open end is an
 * open search.
 */
export function gapBetween(
  before: SeasonRace | null,
  after: SeasonRace | null,
  year: number,
): { from: string; to: string } {
  const day = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
  }
  const shift = (date: Date, days: number) => {
    const moved = new Date(date)
    moved.setDate(moved.getDate() + days)
    return moved
  }

  return {
    from: before ? day(shift(before.date, 1)) : `${year}-01-01`,
    to: after ? day(shift(after.date, -1)) : `${year}-12-31`,
  }
}

/**
 * The years worth offering, soonest first.
 *
 * This year and the next two, because an anchor is booked twelve to eighteen
 * months out, plus any later year the runner already has races in. Never a
 * year that has been run: planning is about what is ahead.
 */
export function seasonYears(events: readonly Event[], today: Date = new Date()): number[] {
  const current = today.getFullYear()
  const years = new Set([current, current + 1, current + 2])
  for (const event of events) {
    // Only ahead: a season that has been run is history, and history is what
    // the events page and the analysis are for.
    if (event.status !== 'cancelled' && event.date.getFullYear() > current) {
      years.add(event.date.getFullYear())
    }
  }
  return [...years].sort((left, right) => left - right)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * How long there is between two races, in the units a runner plans in.
 *
 * Weeks, because that is how every rule about a season is said: a test four to
 * eight weeks before the anchor, never one thirty-eight days before it. Under
 * a fortnight the weeks stop being useful and the days are what matters, which
 * is also where two races start to be a clash rather than a plan.
 */
export function spanBetween(
  before: SeasonRace,
  after: SeasonRace,
): { unit: 'days' | 'weeks'; count: number } {
  const days = Math.max(
    0,
    Math.round((after.date.getTime() - before.date.getTime()) / MS_PER_DAY),
  )
  return days < 14 ? { unit: 'days', count: days } : { unit: 'weeks', count: Math.round(days / 7) }
}
