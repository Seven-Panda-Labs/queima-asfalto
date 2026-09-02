import type { EventType } from './Event'
import type { RaceRole } from '../domain/seasonRules'

export type BucketListItem = {
  id: string
  userId: string
  name: string
  location: string
  locationLat?: number
  locationLng?: number
  locationGeocodedAt?: Date
  locationGeocodeQuery?: string
  realDistance: number
  disciplines: EventType[]
  targetMonth?: string
  /**
   * The year the runner is aiming at, next to the month.
   *
   * Absent means any year, which is what a dream race actually is. The month
   * stays a month name because the documents already hold them that way.
   */
  targetYear?: number
  /**
   * The race that fixes the season.
   *
   * Every runner interviewed has one to three of them a year, and booking those
   * is what places everything else. Anchors sort first inside every group.
   */
  isAnchor?: boolean
  /** "I try this one every year", which is what makes a rollover worth offering. */
  recurring?: boolean
  /**
   * What this race is for, when it is not an anchor.
   *
   * There is no `anchor` role: an anchor is `isAnchor`, and a role is what a race
   * that serves one is doing. Two fields saying the same thing would drift.
   */
  role?: RaceRole
  /**
   * The `races` identity of the anchor this one prepares for.
   *
   * A race and not an event, because the anchor is often still an entry with no
   * event yet. An item with no identity cannot be pointed at, which is one more
   * reason #249 exists.
   */
  servesRaceId?: string
  link?: string
  emoji?: string
  notes?: string
  /** The race this is a wish for. Absent on items older than the collection. */
  raceId?: string
  createdAt: Date
  updatedAt: Date
}

export type BucketListItemCreate = {
  name: string
  location: string
  locationLat?: number
  locationLng?: number
  locationGeocodeQuery?: string
  realDistance: number
  disciplines: EventType[]
  targetMonth?: string
  targetYear?: number
  isAnchor?: boolean
  recurring?: boolean
  role?: RaceRole
  servesRaceId?: string
  link?: string
  emoji?: string
  notes?: string
  raceId?: string
}
