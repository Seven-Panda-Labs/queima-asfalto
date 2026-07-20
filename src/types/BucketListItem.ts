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
  link?: string
  emoji?: string
  notes?: string
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
  link?: string
  emoji?: string
  notes?: string
}
