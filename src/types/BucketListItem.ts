import type { EventType } from './Event'

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
  link?: string
  emoji?: string
  notes?: string
  raceId?: string
}
