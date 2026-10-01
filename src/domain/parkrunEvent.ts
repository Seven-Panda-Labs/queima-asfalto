import type { Event } from '../types/Event'

/**
 * Whether the event is linked to a known parkrun. A race merely named like one,
 * with nothing linking it, does not count.
 *
 * A parkrun has no lottery, no entry window and no fee, and it is not in the
 * race catalog: see "the two models diverge" in docs/race-catalog.md.
 */
export function isKnownParkrun(event: Pick<Event, 'parkrunEventSlug' | 'resultsPlatform'>): boolean {
  return Boolean(event.parkrunEventSlug) || event.resultsPlatform === 'parkrun'
}
