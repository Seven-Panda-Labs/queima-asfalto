import type { Event } from '../types/Event'
import { updateEvent } from './events'
import { findOrCreateRaceId, updateRace } from './races'

/**
 * Says that this event is a running of a race the shared catalog holds.
 *
 * Three links in one action, because in practice all three are missing at
 * once. Measured on a real instance: of 133 events, 7 carried a `raceId` at
 * all and not one race carried a `catalogRaceId`, so the whole chain from an
 * event to the shared entry was empty and everything built on it, the prefill
 * and the contributions back, could never fire.
 *
 * `catalogRaceId` is only ever written when somebody adds a race through the
 * discovery page, and a runner who typed their races in by hand, or imported
 * them, has none. This is the way to say so afterwards.
 *
 * Deliberately the runner's own confirmation and not a match we apply. A wrong
 * link attaches their history to somebody else's race, and no name comparison
 * is worth that.
 */
export async function identifyRaceInCatalog(
  userId: string,
  event: Event,
  catalogRaceId: string,
): Promise<void> {
  // An event from before the races collection has no identity yet, and there
  // is nothing to hang a catalog id on until it does.
  const raceId =
    event.raceId ??
    (await findOrCreateRaceId(userId, {
      name: event.name,
      location: event.location,
      locationLat: event.locationLat,
      locationLng: event.locationLng,
    }))
  if (!raceId) throw new Error('no race')

  await updateRace(raceId, { catalogRaceId })
  if (!event.raceId) await updateEvent(event.id, { raceId })
}
