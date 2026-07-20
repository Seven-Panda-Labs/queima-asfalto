export type {
  EventStatus,
  EventType,
} from '../domain/eventCodes'
export { EVENT_STATUSES, EVENT_TYPES } from '../domain/eventCodes'

import type { EventStatus, EventType } from '../domain/eventCodes'
import type { ResultsPlatform } from '../../shared/officialResults'

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
}

export type EventFilters = {
  status?: EventStatus | 'all'
  year?: number | 'all'
}
