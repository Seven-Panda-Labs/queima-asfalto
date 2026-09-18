import type { RaceCatalogEntry } from './types.js'

/**
 * The day an entry is next worth an operator's eye.
 *
 * The work queue used to be "the last date we know has passed", which is the
 * right question and the wrong queue: nine hundred entries, most of them a
 * race that simply has not published next season yet, and no way to say "not
 * this one, ask me in a month". Reading the same forty rows before reaching a
 * new one is how a queue stops being worked.
 *
 * So the queue asks this field instead. It is the race's own date until
 * somebody puts it off, and a retired entry or a copy has none at all, which
 * is what makes the count above the list the number of races actually waiting
 * rather than the number of rows the query happens to match.
 */
export function reviewDueDateFor(entry: {
  nextRaceDate?: string
  reviewDueDate?: string
  retired?: boolean
  duplicateOfCatalogRaceId?: string
}): string | undefined {
  if (entry.retired === true || entry.duplicateOfCatalogRaceId) return undefined
  const putOff = entry.reviewDueDate ?? ''
  const raceDay = entry.nextRaceDate ?? ''
  // The later of the two: a new season answers the question a snooze only
  // postponed, and a snooze outlives a harvest that rewrites the entry whole.
  return (putOff > raceDay ? putOff : raceDay) || undefined
}

/** `YYYY-MM-DD`, the day a snooze of this many days lands on. */
export function snoozedUntil(days: number, today: Date): string {
  const until = new Date(today)
  until.setUTCDate(until.getUTCDate() + days)
  return until.toISOString().slice(0, 10)
}

/** What an operator may choose, in days. A season is the longest useful wait. */
export const SNOOZE_DAYS = [7, 30, 90] as const

export type SnoozeDays = (typeof SNOOZE_DAYS)[number]

export function isRaceCatalogEntryDue(entry: RaceCatalogEntry, today: string): boolean {
  const due = reviewDueDateFor(entry)
  return due !== undefined && due < today
}
