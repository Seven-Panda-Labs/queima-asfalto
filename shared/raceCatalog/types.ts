import type { EventType } from '../domain/eventCodes.js'

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

/**
 * One edition. Absent until someone has the dates from the organiser.
 *
 * Carries its own provenance rather than inheriting the entry's, because dates
 * are per year and get added long after the entry was first checked. Without
 * this, confirming an entry today would silently vouch for a 2028 edition
 * somebody adds in 2027.
 *
 * The three gate fields take an instant (`2026-08-14T02:00:00Z`) when the
 * organiser publishes a time, and a plain date (`2026-09-18`) when only the day
 * is known. Inventing midnight would be inventing precision.
 */
export type RaceCatalogEdition = {
  year: number
  /** ISO date, `YYYY-MM-DD`. */
  raceDate?: string
  registrationOpensAt?: string
  registrationClosesAt?: string
  lotteryDrawAt?: string
  /** IANA zone, so a reminder can print the local opening time. */
  timezone?: string
  /**
   * The headline entry fee, in major units. `typical` because a race usually has
   * several: early bird, international, charity, club.
   */
  typicalFee?: number
  /** ISO 4217, required whenever `typicalFee` is set. */
  feeCurrency?: string
  /** Where these dates came from. */
  source: string
  /** `YYYY-MM-DD`, the day someone last read them off that source. */
  confirmedAt: string
}

/**
 * Who wrote an entry.
 *
 * Curated and harvested entries share one collection, so the queue that asks
 * "what needs a human" is one query, and a harvest never has to guess whether it
 * is about to overwrite something a person checked.
 */
export const CATALOG_PRODUCERS = ['curated', 'harvest'] as const

export type CatalogProducer = (typeof CATALOG_PRODUCERS)[number]

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
  /** Defaults to `curated` for anything written before the field existed. */
  producer?: CatalogProducer
  /**
   * Out of the catalog without being gone.
   *
   * `races.catalogRaceId` points at an id, and no Firestore rule can check for
   * references, so a hard delete would orphan whatever already points here.
   */
  retired?: boolean
  /**
   * The entry this one turned out to be a second copy of.
   *
   * Set when a harvest recognises a race the catalog already holds under
   * another name: "BMW BERLIN-MARATHON" is the reviewed "Berlin Marathon". The
   * copy is pointed at the survivor rather than deleted, because an id may
   * already be referenced and because a wrong guess has to be reversible.
   */
  duplicateOfCatalogRaceId?: string
  /** Set by the writer, so an operator can see how stale an entry is. */
  updatedAt?: string
  updatedBy?: string
}

export type RaceCatalog = {
  /** When the committed seed was last edited, `YYYY-MM-DD`. */
  updatedAt: string
  races: RaceCatalogEntry[]
}
