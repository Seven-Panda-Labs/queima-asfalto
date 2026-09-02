export type {
  EventStatus,
  EventType,
} from '../domain/eventCodes'
export { EVENT_STATUSES, EVENT_TYPES } from '../domain/eventCodes'

import type { EventStatus, EventType } from '../domain/eventCodes'
import type { ResultsPlatform } from '../../shared/officialResults'
import type { OutcomeReason } from '../domain/outcomeReasons'

export type Event = {
  id: string
  userId: string
  name: string
  date: Date
  realDistance: number
  eventType: EventType
  location: string
  locationLat?: number
  locationLng?: number
  locationGeocodedAt?: Date
  locationGeocodeQuery?: string
  status: EventStatus
  emoji?: string
  notes?: string
  time?: string
  pace?: string
  classification?: string
  resultsUrl?: string
  resultsPlatform?: ResultsPlatform
  parkrunEventSlug?: string
  parkrunCountryUrl?: string
  resultsVerified?: boolean
  /**
   * Why the race produced no result.
   *
   * A DNF is `completed` with `outcomeReason: 'dnf'` rather than a status of its
   * own, so every exhaustive map over `EventStatus` stays as it is.
   */
  outcomeReason?: OutcomeReason
  /**
   * Seconds per kilometre the second half of the race was slower than the first,
   * from the uploaded track. Denormalised from `events/{id}/track` on purpose:
   * the analysis page reads events with one query, and fanning out to a
   * subcollection per event would grow with every race ever run.
   */
  trackPacingDriftSeconds?: number
  /** The race this is a running of. Absent on events older than the collection. */
  raceId?: string
  createdAt: Date
  updatedAt: Date
}

export type EventCreate = {
  name: string
  date: Date
  realDistance: number
  eventType: EventType
  location: string
  locationLat?: number
  locationLng?: number
  locationGeocodeQuery?: string
  status: EventStatus
  emoji?: string
  notes?: string
  time?: string
  pace?: string
  classification?: string
  resultsUrl?: string
  resultsPlatform?: ResultsPlatform
  parkrunEventSlug?: string
  parkrunCountryUrl?: string
  outcomeReason?: OutcomeReason
  raceId?: string
}

export type EventFilters = {
  status?: EventStatus | 'all'
  year?: number | 'all'
}
