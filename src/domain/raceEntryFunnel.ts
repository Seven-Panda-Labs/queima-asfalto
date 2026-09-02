import type { BucketListItem } from '../types/BucketListItem'
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

/** One race, as the bucket list shows it: the wish, and this year's attempt if there is one. */
export type FunnelRow = {
  item: BucketListItem
  entry: RaceEntry | null
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
export function funnelGroupFor(row: FunnelRow, today: Date = new Date()): FunnelGroupKey {
  const { entry } = row
  if (!entry) return 'dream'

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

  // Watching with no dates at all is still a wish: there is nothing to act on.
  return 'dream'
}

/**
 * The bucket list, grouped by what it is waiting for.
 *
 * Rows are items, because that is what the page shows and what the runner wrote.
 * An entry whose item is gone is not shown: the wish is the spine, and an
 * orphaned attempt is a bug in the writer rather than something to render.
 *
 * Within a group, anchors first and then the nearest date, because an anchor is
 * what fixes the rest of the calendar.
 */
export function buildRaceEntryFunnel(
  items: readonly BucketListItem[],
  entries: readonly RaceEntry[],
  today: Date = new Date(),
): FunnelGroup[] {
  const currentByItem = new Map<string, RaceEntry>()
  for (const entry of entries) {
    if (!entry.bucketListItemId) continue
    const known = currentByItem.get(entry.bucketListItemId)
    // The latest year wins: an old attempt is history, not the current state.
    if (!known || entry.year > known.year) currentByItem.set(entry.bucketListItemId, entry)
  }

  const rows: FunnelRow[] = items.map((item) => ({
    item,
    entry: currentByItem.get(item.id) ?? null,
  }))

  const grouped = new Map<FunnelGroupKey, FunnelRow[]>(
    FUNNEL_GROUPS.map((key) => [key, [] as FunnelRow[]]),
  )
  for (const row of rows) grouped.get(funnelGroupFor(row, today))!.push(row)

  for (const group of grouped.values()) group.sort(compareRows)

  return FUNNEL_GROUPS.map((key) => ({ key, rows: grouped.get(key)! }))
}

/** The next date this row is waiting on, or null when it is waiting on nothing. */
export function nextDateFor(entry: RaceEntry | null): Date | null {
  if (!entry) return null
  const candidates = [
    entry.placeConfirmByAt,
    entry.registrationClosesAt,
    entry.registrationOpensAt,
    entry.lotteryDrawAt,
    entry.raceDate,
  ].filter((date): date is Date => date instanceof Date)
  if (candidates.length === 0) return null
  return candidates.reduce((soonest, date) => (date < soonest ? date : soonest))
}

function compareRows(left: FunnelRow, right: FunnelRow): number {
  const anchor = (row: FunnelRow) => (row.item.isAnchor ? 0 : 1)
  if (anchor(left) !== anchor(right)) return anchor(left) - anchor(right)

  const leftDate = nextDateFor(left.entry)
  const rightDate = nextDateFor(right.entry)
  if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime()
  if (leftDate) return -1
  if (rightDate) return 1

  return left.item.name.localeCompare(right.item.name)
}
