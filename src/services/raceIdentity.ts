import { shareableResultsUrl } from '../../shared/officialResults'
import type { Event } from '../types/Event'
import { proposeCatalogRace } from './catalogProposals'
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
    const ran = events
      .filter((event) => event.raceId === raceId && event.resultsVerified === true)
      .map((event) => ({ date: event.date, resultsUrl: event.resultsUrl }))
    if (ran.length > 0) await reportEditionDates(userId, catalogRaceId, ran)
  } catch {
    // Nothing to tell the runner: the link they asked for is already written.
  }
}

/**
 * Proposes this event's race to the catalog, with a way back to the runner.
 *
 * The proposal used to be a name, a town and a day, and the entry the job
 * created had nobody attached to it: the runner who asked for it stayed
 * unlinked, so nothing they knew reached it and their own event went on
 * offering to say which race it was. Measured after the first five proposals
 * were applied: five entries created, no race pointing at any of them and not
 * one report.
 *
 * So it carries the race, which the job links, and the results page of the
 * edition they ran, which nothing else can carry: a report cannot name an
 * entry that does not exist yet.
 */
export async function proposeRaceForEvent(
  userId: string,
  event: Event,
  where: { city: string; country: string },
): Promise<void> {
  // Same as identifying: an event from before the races collection has no
  // identity, and the job needs one to link.
  const raceId =
    event.raceId ??
    (await findOrCreateRaceId(userId, {
      name: event.name,
      location: event.location,
      locationLat: event.locationLat,
      locationLng: event.locationLng,
    }))

  await proposeCatalogRace(userId, {
    name: event.name,
    city: where.city,
    country: where.country,
    raceDate: toIsoDay(event.date),
    disciplines: [event.eventType],
    ...(raceId ? { raceId } : {}),
    // Only from a verified result, the same floor a report has: the day and
    // the page both come from the organiser's own results.
    ...(event.resultsVerified === true
      ? { resultsUrl: shareableResultsUrl(event.resultsUrl) }
      : {}),
  })

  if (raceId && !event.raceId) await updateEvent(event.id, { raceId })
}

/** The local day, because the day a race was run is a calendar fact. */
function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
