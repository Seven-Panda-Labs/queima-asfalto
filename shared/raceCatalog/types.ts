import type { EventType } from '../../src/domain/eventCodes.js'

/** How a place in the race is obtained. The scarce thing, not the race itself. */
export const RACE_ENTRY_METHODS = [
  'lottery',
  'first_come',
  'qualifying',
  'charity',
  'invite',
  'unknown',
] as const

export type RaceEntryMethod = (typeof RACE_ENTRY_METHODS)[number]

/**
 * Curation state of one entry.
 *
 * `unreviewed` means the entry was assembled from public listings and no human
 * has checked it against the organiser. Such an entry may **suggest**: prefill a
 * form the runner can see and correct. It may never **assert**: no deadline
 * reminder, no countdown, nothing that would be wrong in silence.
 *
 * Every entry starts unreviewed and is promoted one at a time, by PR.
 */
export const CATALOG_REVIEW_STATES = ['unreviewed', 'reviewed'] as const

export type CatalogReviewState = (typeof CATALOG_REVIEW_STATES)[number]

/** One edition. Absent until someone has the dates from the organiser. */
export type RaceCatalogEdition = {
  year: number
  /** ISO date, `YYYY-MM-DD`. */
  raceDate?: string
  /** ISO instant, because an opening time is a moment, not a day. */
  registrationOpensAt?: string
  registrationClosesAt?: string
  lotteryDrawAt?: string
  /** IANA zone, so a reminder can print the local opening time. */
  timezone?: string
}

export type RaceCatalogEntry = {
  /** Stable slug. Referenced by `races.catalogRaceId`, so it never changes. */
  id: string
  name: string
  /** ISO 3166-1 alpha-2. */
  country: string
  city: string
  disciplines: EventType[]
  entryMethod: RaceEntryMethod
  officialUrl?: string
  registrationUrl?: string
  /** 1 to 12. What month the race usually falls in, not a promise about a year. */
  typicalRaceMonth?: number
  typicalWindowNote?: string
  editions?: RaceCatalogEdition[]
  review: CatalogReviewState
  /** Where the entry came from, so a reviewer knows what to check against. */
  source: string
}

export type RaceCatalog = {
  /** When the committed seed was last edited, `YYYY-MM-DD`. */
  updatedAt: string
  races: RaceCatalogEntry[]
}
