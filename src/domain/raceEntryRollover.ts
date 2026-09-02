import type { BucketListItem } from '../types/BucketListItem'
import type { RaceEntry, RaceEntryCreate } from '../types/RaceEntry'

/**
 * An attempt that is over, one way or another.
 *
 * A registered entry is only finished once its race has been run: being in is not
 * a terminal state until the race day passes, or the app would offer next year's
 * ballot to somebody who has not run this year's race yet.
 */
export function isAttemptFinished(entry: RaceEntry, today: Date): boolean {
  if (entry.entryStatus === 'rejected' || entry.entryStatus === 'declined') return true
  if (entry.entryStatus === 'missed') return true
  if (entry.entryStatus === 'registered') {
    return entry.raceDate ? entry.raceDate.getTime() < today.getTime() : false
  }
  return false
}

/**
 * Next year's attempts, for the races the runner said they try every year.
 *
 * The point is the Majors case from the interview: losing a ballot should roll to
 * the next year rather than end the item, and "3rd year in the London ballot" is
 * only sayable because each attempt is its own document.
 *
 * `rolledOverFrom` is what makes this idempotent. It runs on every load, and the
 * entry it would create already exists after the first one.
 */
export function rolloversToCreate(
  items: readonly BucketListItem[],
  entries: readonly RaceEntry[],
  today: Date = new Date(),
): RaceEntryCreate[] {
  const byItem = new Map<string, RaceEntry[]>()
  for (const entry of entries) {
    if (!entry.bucketListItemId) continue
    const list = byItem.get(entry.bucketListItemId) ?? []
    list.push(entry)
    byItem.set(entry.bucketListItemId, list)
  }

  const rolled = new Set(
    entries.map((entry) => entry.rolledOverFrom).filter((id): id is string => Boolean(id)),
  )

  const created: RaceEntryCreate[] = []

  for (const item of items) {
    if (item.recurring !== true) continue

    const attempts = byItem.get(item.id) ?? []
    if (attempts.length === 0) continue

    const latest = attempts.reduce((best, entry) => (entry.year > best.year ? entry : best))
    if (!isAttemptFinished(latest, today)) continue
    // Already rolled once: the next year's entry exists and points back at this one.
    if (rolled.has(latest.id)) continue

    const nextYear = nextAttemptYear(latest.year, today)
    if (attempts.some((entry) => entry.year === nextYear)) continue

    created.push(nextSeasonAttempt(item.id, nextYear, latest))
  }

  return created
}

/**
 * The season a next attempt belongs to.
 *
 * Never a year in the past: an attempt that ended two seasons ago rolls to the
 * season the runner can still enter.
 */
export function nextAttemptYear(latestYear: number, today: Date = new Date()): number {
  return Math.max(latestYear + 1, today.getFullYear() + 1)
}

/**
 * Next season's attempt at the same race.
 *
 * Everything about the gate is a fact about last year, so only the shape of the
 * gate carries over. The dates do not.
 */
export function nextSeasonAttempt(
  bucketListItemId: string,
  year: number,
  previous: Pick<
    RaceEntry,
    'id' | 'raceId' | 'discipline' | 'entryMethod' | 'registrationUrl'
  >,
): RaceEntryCreate {
  return {
    raceId: previous.raceId,
    bucketListItemId,
    year,
    discipline: previous.discipline,
    entryMethod: previous.entryMethod,
    entryStatus: 'watching',
    raceDateConfirmed: false,
    registrationUrl: previous.registrationUrl,
    // A race that failed with no entry ever recorded has nothing to point back at.
    rolledOverFrom: previous.id || undefined,
  }
}

/** How many years running this race has been attempted, including the one in hand. */
export function attemptCountFor(
  itemId: string,
  entries: readonly RaceEntry[],
): number {
  return entries.filter((entry) => entry.bucketListItemId === itemId).length
}
