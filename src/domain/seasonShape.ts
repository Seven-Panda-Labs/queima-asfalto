import type { Event } from '../types/Event'
import type { EventStatus, EventType } from './eventCodes'

export type SeasonShapeRace = {
  id: string
  name: string
  date: Date
  eventType: EventType
  status: EventStatus
  isAnchor: boolean
}

/** One month of the season, empty or not. An empty month is the whole point. */
export type SeasonShapeMonth = {
  /** 1 to 12. */
  month: number
  races: SeasonShapeRace[]
}

/**
 * The shape of one year: every month, with what is in it.
 *
 * Twelve rows and not a list of races, because the question somebody is asking
 * while planning is where the gaps are: "I need something a month before the
 * anchor" has no answer in a list that only shows what is already booked.
 *
 * A cancelled race is not in the season. Anything else is, including what has
 * already been run: a season is read forwards in January and backwards in
 * December, and the months already spent are what the rest is arranged around.
 */
export function seasonShape(
  events: readonly Event[],
  year: number,
  anchorRaceIds: ReadonlySet<string> = new Set(),
): SeasonShapeMonth[] {
  const months: SeasonShapeMonth[] = Array.from({ length: 12 }, (_, at) => ({
    month: at + 1,
    races: [],
  }))

  for (const event of events) {
    if (event.status === 'cancelled') continue
    if (event.date.getFullYear() !== year) continue
    months[event.date.getMonth()]!.races.push({
      id: event.id,
      name: event.name,
      date: event.date,
      eventType: event.eventType,
      status: event.status,
      isAnchor: Boolean(event.raceId && anchorRaceIds.has(event.raceId)),
    })
  }

  for (const month of months) {
    month.races.sort((left, right) => left.date.getTime() - right.date.getTime())
  }
  return months
}

/**
 * The years worth offering, soonest first.
 *
 * This year and the next two, because an anchor is booked twelve to eighteen
 * months out, plus any year the runner already has races in so nothing is
 * hidden from them.
 */
export function seasonYears(events: readonly Event[], today: Date = new Date()): number[] {
  const current = today.getFullYear()
  const years = new Set([current, current + 1, current + 2])
  for (const event of events) {
    if (event.status !== 'cancelled') years.add(event.date.getFullYear())
  }
  return [...years].sort((left, right) => left - right).filter((year) => year >= current - 1)
}
