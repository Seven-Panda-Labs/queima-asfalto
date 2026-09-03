import { isAnchorFor } from '../domain/seasonAnchors'
import type { Event } from '../types/Event'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function upcomingEvents(events: Event[], today: Date): Event[] {
  const todayStart = startOfDay(today).getTime()

  return events
    .filter(
      (event) =>
        (event.status === 'planned' || event.status === 'confirmed') &&
        startOfDay(event.date).getTime() >= todayStart,
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function findNextEvent(events: Event[], today: Date = new Date()): Event | null {
  return upcomingEvents(events, today)[0] ?? null
}

type AnchorRace = { id: string; anchorYears?: number[] }

export type SeasonHorizon = {
  /** The last race that was run, which is where the road starts. */
  last: Event | null
  /** The race the countdown is about. */
  next: Event
  /** The season's target, when it is further out than the next race. */
  anchor: Event | null
  /** The next race is the target itself, which is the season's last stretch. */
  nextIsAnchor: boolean
}

/**
 * The next race and what it is leading to.
 *
 * Three stops and no more: the last race, the next one, the season's target. A
 * 10K in ten days means something different when the marathon it prepares is a
 * month behind it, and that is the whole reason anchors exist. Every race in
 * between is left out on purpose: a runner with a busy September would get a
 * road nobody can read.
 *
 * An anchor with no scheduled event is not in here: without a date there is
 * nothing to count down to.
 */
export function seasonHorizon(
  events: Event[],
  races: readonly AnchorRace[],
  today: Date = new Date(),
): SeasonHorizon | null {
  const upcoming = upcomingEvents(events, today)
  const next = upcoming[0]
  if (!next) return null

  const byId = new Map(races.map((race) => [race.id, race]))
  const isAnchor = (event: Event) => {
    const race = event.raceId ? byId.get(event.raceId) : undefined
    return Boolean(race && isAnchorFor(race, event.date.getFullYear()))
  }

  const last =
    events
      .filter((event) => event.status === 'completed' && event.date.getTime() < next.date.getTime())
      .sort((left, right) => right.date.getTime() - left.date.getTime())[0] ?? null

  const anchor = upcoming.find(isAnchor) ?? null
  return {
    last,
    next,
    anchor: anchor && anchor.id !== next.id ? anchor : null,
    nextIsAnchor: Boolean(anchor && anchor.id === next.id),
  }
}

export function daysUntilEvent(eventDate: Date, today: Date = new Date()): number {
  const todayStart = startOfDay(today).getTime()
  const eventStart = startOfDay(eventDate).getTime()
  return Math.round((eventStart - todayStart) / 86_400_000)
}

export function formatDaysUntil(
  eventDate: Date,
  today: Date,
  labels: { today: string; tomorrow: string; other: (n: number) => string },
): string {
  const days = daysUntilEvent(eventDate, today)
  if (days === 0) return labels.today
  if (days === 1) return labels.tomorrow
  return labels.other(days)
}
