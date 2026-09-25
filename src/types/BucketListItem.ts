import type { EventType } from './Event'
import type { RaceRole } from '../domain/seasonRules'

/**
 * A race somebody wants to run one day: a marker on a race, and a note.
 *
 * Everything a wish used to carry is said better somewhere else. The name, the
 * place and the coordinates are the race's (`races/{raceId}`), the distances
 * are the catalog's, and being an anchor or preparing one is a fact about a
 * season, on the race identity. A wish that repeated all of that could
 * disagree with it, and did.
 *
 * The fields below `raceId` are read as a fallback, for a wish with no race to
 * point at: one written before the marker, or one for a race the catalog does
 * not hold. Only one path still writes them, a parkrun watched from discovery,
 * which has no entry in this catalog and no race identity on purpose (see
 * `docs/race-catalog.md`), so its wish is all there is to hold its name.
 */
export type BucketListItem = {
  id: string
  userId: string
  /** The race this is a wish for. */
  raceId?: string
  /** Why they want it, which is the only part that was ever the runner's own. */
  notes?: string
  /** "I try this one every year", which is what makes a rollover worth offering. */
  recurring?: boolean
  createdAt: Date
  updatedAt: Date

  /** Legacy, from before a wish was a marker. Read as a fallback, never written. */
  name?: string
  location?: string
  locationLat?: number
  locationLng?: number
  locationGeocodedAt?: Date
  locationGeocodeQuery?: string
  realDistance?: number
  disciplines?: EventType[]
  targetMonth?: string
  targetYear?: number
  link?: string
  emoji?: string
  /**
   * The season fields, still read by the migration that moves them onto the
   * race identity, which is where being an anchor and preparing one live.
   */
  isAnchor?: boolean
  role?: RaceRole
  servesRaceId?: string
}

export type BucketListItemCreate = {
  raceId?: string
  notes?: string
  recurring?: boolean
  /** Only for a watched parkrun, which has no race to point at. */
  name?: string
  location?: string
  realDistance?: number
  disciplines?: EventType[]
  link?: string
}
