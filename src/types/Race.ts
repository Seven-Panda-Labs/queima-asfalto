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
}
