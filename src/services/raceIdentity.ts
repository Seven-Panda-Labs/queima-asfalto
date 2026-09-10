import type { Event } from '../types/Event'
import { reportEditionDates } from './editionReports'
import { listEvents, updateEvent } from './events'
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

  await reportPastEditions(userId, raceId, catalogRaceId)
}

/**
 * What this runner's verified results already say about the race they just
 * identified.
 *
 * The link is not only about the next edition. Somebody who has run a race
 * five times has five days the catalog does not hold, and the harvest never
 * will: it only ever writes the edition still ahead. A year the catalog never
 * had is taken from a single runner, so this fills the history in on the next
 * pass.
 *
 * Only verified results, which is the same floor as saving one: the
 * organiser's own results page listed somebody finishing that day.
 *
 * Best effort. It is a side effect of the link, and the link is what the
 * runner asked for.
 */
async function reportPastEditions(
  userId: string,
  raceId: string,
  catalogRaceId: string,
): Promise<void> {
  try {
    const events = await listEvents(userId)
    const days = events
      .filter((event) => event.raceId === raceId && event.resultsVerified === true)
      .map((event) => event.date)
    if (days.length > 0) await reportEditionDates(userId, catalogRaceId, days)
  } catch {
    // Nothing to tell the runner: the link they asked for is already written.
  }
}
