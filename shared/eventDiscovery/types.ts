/**
 * One upcoming race as a source published it.
 *
 * Deliberately not a catalog entry: this is what a parser can honestly say
 * after reading someone else's page, before any judgement about whether the
 * race is the same one another source lists.
 */
export type DiscoveredRace = {
  /** The source page. The identity a harvest can refresh against. */
  sourceUrl: string
  name: string
  /** As published: an instant when the source gives a time, a date when it does not. */
  startDate: string
  city?: string
  region?: string
  /** ISO 3166-1 alpha-2, upper case. */
  country?: string
  /** Every distance the event offers, in km, ascending and deduplicated. */
  distancesKm: number[]
  /** The last moment entries were open, when the source says so. */
  registrationClosesAt?: string
  lowPrice?: number
  highPrice?: number
  /** ISO 4217, only when a price came with it. */
  currency?: string
  /** The source says the race was called off. */
  cancelled: boolean
}
