import type { Race } from '../types/Race'
import type { RaceEntry } from '../types/RaceEntry'

/**
 * How many days before a closing date the app starts calling it urgent.
 *
 * Two weeks is long enough to decide and pay, and short enough that "action
 * needed" does not fill up with things that are months away.
 */
export const CLOSING_SOON_DAYS = 14

export const FUNNEL_GROUPS = [
  'action_needed',
  'applied',
  'watching',
  'in',
  'dream',
  'missed',
] as const

export type FunnelGroupKey = (typeof FUNNEL_GROUPS)[number]

/**
 * One race and the attempt being made at it this year.
 *
 * Keyed on the race and not on a wish. An entry is something an operator asks
 * for, on a race that is already in the calendar, so there is always one: a
 * race nobody is chasing a place for has no row here, it has a calendar entry
 * like every other race.
 */
export type FunnelRow = {
  race: Race
  entry: RaceEntry
}

export type FunnelGroup = {
  key: FunnelGroupKey
  rows: FunnelRow[]
}

function daysUntil(date: Date, today: Date): number {
  const start = (value: Date) =>
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  return Math.round((start(date) - start(today)) / 86_400_000)
}

/**
 * Which group one row belongs to.
 *
 * Derived from the dates and the status rather than stored, because a gate opens
 * and closes on its own: an entry left untouched moves from watching to action
 * needed to missed as the calendar passes it, and nothing has to write to it.
 */
export function funnelGroupFor(entry: RaceEntry, today: Date = new Date()): FunnelGroupKey {
  switch (entry.entryStatus) {
    case 'registered':
      return 'in'
    case 'rejected':
    case 'declined':
    case 'missed':
      return 'missed'
    case 'accepted':
      // A place won and not yet secured is the most urgent thing in the app.
      return 'action_needed'
    case 'applied':
      return 'applied'
    case 'watching':
      break
  }

  const opens = entry.registrationOpensAt
  const closes = entry.registrationClosesAt

  // Closed without registering: the year is gone, whatever the status still says.
  if (closes && daysUntil(closes, today) < 0) return 'missed'

  if (closes && daysUntil(closes, today) <= CLOSING_SOON_DAYS) return 'action_needed'
  if (opens && daysUntil(opens, today) <= 0) return 'action_needed'
  if (opens && daysUntil(opens, today) > 0) return 'watching'

  // Watching with no dates at all: somebody is following a race whose gates
  // have not been published, and there is nothing to act on yet.
  return 'dream'
}

/**
 * The places being chased, grouped by what each one is waiting for.
 *
 * Rows are races, because that is what an entry is an attempt at, and because
 * a wish is no longer in this story: a runner puts a race in the calendar and
 * only then says it has a lottery or a deadline. Built from the entries, so a
 * race nobody is chasing a place for simply has no row.
 *
 * Within a group, anchors first and then the nearest date, because an anchor is
 * what fixes the rest of the calendar.
 */
export function buildRaceEntryFunnel(
  races: readonly Race[],
  entries: readonly RaceEntry[],
  today: Date = new Date(),
  /** The races that are anchors, by identity: the flag lives on the race. */
  anchorRaceIds: ReadonlySet<string> = new Set(),
): FunnelGroup[] {
  const byId = new Map(races.map((race) => [race.id, race]))
  const currentByRace = new Map<string, RaceEntry>()
  for (const entry of entries) {
    const known = currentByRace.get(entry.raceId)
    // The latest year wins: an old attempt is history, not the current state.
    if (!known || entry.year > known.year) currentByRace.set(entry.raceId, entry)
  }

  const rows: FunnelRow[] = []
  for (const [raceId, entry] of currentByRace) {
    const race = byId.get(raceId)
    // An attempt at a race this account does not hold is a bug in the writer,
    // not something to render.
    if (race) rows.push({ race, entry })
  }

  const grouped = new Map<FunnelGroupKey, FunnelRow[]>(
    FUNNEL_GROUPS.map((key) => [key, [] as FunnelRow[]]),
  )
  for (const row of rows) grouped.get(funnelGroupFor(row.entry, today))!.push(row)

  for (const group of grouped.values()) {
    group.sort((left, right) => compareRows(left, right, today, anchorRaceIds))
  }

  return FUNNEL_GROUPS.map((key) => ({ key, rows: grouped.get(key)! }))
}

/**
 * The next date this row is waiting on, or null when it is waiting on nothing.
 *
 * The soonest one still ahead. A gate that opened last week is not what the row
 * waits for, and counting it would sort a race whose window is closing behind a
 * race whose window merely started.
 */
export function nextDateFor(entry: RaceEntry | null, today: Date = new Date()): Date | null {
  if (!entry) return null

  const candidates = [
    entry.placeConfirmByAt,
    entry.registrationClosesAt,
    entry.registrationOpensAt,
    entry.lotteryDrawAt,
    entry.raceDate,
  ].filter((date): date is Date => date instanceof Date)
  if (candidates.length === 0) return null

  const soonest = (dates: Date[]) =>
    dates.reduce((best, date) => (date < best ? date : best))
  const ahead = candidates.filter((date) => date.getTime() >= today.getTime())

  // Everything behind us: the latest of them is the most recent thing that
  // happened, which is the useful one to show.
  return ahead.length > 0
    ? soonest(ahead)
    : candidates.reduce((latest, date) => (date > latest ? date : latest))
}

function compareRows(
  left: FunnelRow,
  right: FunnelRow,
  today: Date,
  anchorRaceIds: ReadonlySet<string>,
): number {
  const anchor = (row: FunnelRow) => (anchorRaceIds.has(row.race.id) ? 0 : 1)
  if (anchor(left) !== anchor(right)) return anchor(left) - anchor(right)

  const leftDate = nextDateFor(left.entry, today)
  const rightDate = nextDateFor(right.entry, today)
  if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime()
  if (leftDate) return -1
  if (rightDate) return 1

  return left.race.name.localeCompare(right.race.name)
}
