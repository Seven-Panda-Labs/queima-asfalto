import type { BucketListItem } from '../types/BucketListItem'
import type { Event } from '../types/Event'

export type WishInCalendar = { kind: 'scheduled' | 'ran'; event: Event }

/**
 * Where a wish's race already is in the calendar.
 *
 * A running ahead, planned or confirmed, makes the wish a date, and one run to
 * the finish makes it done. A running missed, cancelled or not finished leaves
 * the wish as it was: that is the "try again next season" wish, still to do.
 */
export function wishInCalendar(
  item: Pick<BucketListItem, 'raceId'>,
  events: readonly Event[],
  today: Date,
): WishInCalendar | null {
  if (!item.raceId) return null
  const runnings = events.filter((event) => event.raceId === item.raceId)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const ahead = runnings
    .filter((event) => (event.status === 'planned' || event.status === 'confirmed') && event.date >= startOfToday)
    .sort((left, right) => left.date.getTime() - right.date.getTime())[0]
  if (ahead) return { kind: 'scheduled', event: ahead }

  const ran = runnings
    .filter((event) => event.status === 'completed' && event.outcomeReason !== 'dnf')
    .sort((left, right) => right.date.getTime() - left.date.getTime())[0]
  return ran ? { kind: 'ran', event: ran } : null
}
