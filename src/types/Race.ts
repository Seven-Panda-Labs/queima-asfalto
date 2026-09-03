import type { RaceRole } from '../domain/seasonRules'

/**
 * A race, as an identity that outlives any one running of it.
 *
 * Deliberately thin: what is on a race is what stays true from year to year.
 * Everything else keeps its own home, because they have different lifetimes.
 *
 * | Entity              | Holds                                    | Lifetime      |
 * |---------------------|------------------------------------------|---------------|
 * | `races`             | what the race is                         | forever       |
 * | `bucketListItems`   | that I want to run it                    | until it does |
 * | `events`            | one running: date, result, media, track  | one edition   |
 *
 * `catalogRaceId` points into the shared catalog when the race is one it covers,
 * and is the only identity two accounts can agree on: race documents belong to a
 * user, and nothing is shared between them.
 */
export type Race = {
  id: string
  userId: string
  name: string
  location: string
  locationLat?: number
  locationLng?: number
  locationGeocodedAt?: Date
  locationGeocodeQuery?: string
  catalogRaceId?: string
  officialUrl?: string
  /**
   * The seasons this race was the runner's anchor, ascending.
   *
   * On the race and not on the wish or the event, because an anchor has to be
   * knowable from all three: a wish is gone once it is scheduled, and a runner
   * who never used the bucket list has only events. And by year, because being
   * an anchor is a fact about a season: Berlin can be the anchor in 2026 and a
   * build-up in 2027.
   */
  anchorYears?: number[]
  /**
   * What this race is for, when it is not an anchor, and which anchor it
   * prepares.
   *
   * Here for the same reason as `anchorYears`: a wish is gone once it is
   * scheduled, and the season rules are about the calendar. On the wish, a
   * build-up lost its role the moment it became a real race.
   */
  role?: RaceRole
  servesRaceId?: string
  createdAt: Date
  updatedAt: Date
}

export type RaceCreate = {
  name: string
  location: string
  locationLat?: number
  locationLng?: number
  locationGeocodeQuery?: string
  catalogRaceId?: string
  officialUrl?: string
  anchorYears?: number[]
  role?: RaceRole
  servesRaceId?: string
}
