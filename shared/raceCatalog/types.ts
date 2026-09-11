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
  /**
   * IANA zone, when the race's own country does not answer.
   *
   * Kept because entries written before the zone was derived carry one, and an
   * operator can still correct a race the country gets wrong. What reads it is
   * `raceTimezone`, which asks this, then the entry, then the country.
   */
  timezone?: string
  /**
   * The headline entry fee, in major units. `typical` because a race usually has
   * several: early bird, international, charity, club.
   */
  typicalFee?: number
  /** ISO 4217, required whenever `typicalFee` is set. */
  feeCurrency?: string
  /**
   * The edition's own results page.
   *
   * Per edition and not per entry, because that is where it lives: a results
   * page is one year's finishers, and the link a runner has for 2024 says
   * nothing about 2026. It arrives from runners who imported a verified
   * result, stripped of anything that named them, and the harvest never writes
   * it: none of the nine calendars publishes one.
   */
  resultsUrl?: string
  /** Where these dates came from. */
  source: string
  /** `YYYY-MM-DD`, the day someone last read them off that source. */
  confirmedAt: string
  /**
   * The day a runner who ran this edition confirmed its date, `YYYY-MM-DD`.
   *
   * Written from an event with a verified official result, which only ever
   * comes from the official import: if the organiser's own results page lists
   * somebody finishing that day, the date is not a scrape any more.
   *
   * It says nothing about the gates, and it does not make the entry
   * `reviewed`: `canAssertDates()` is still what decides whether anything may
   * fire on a date, and a runner cannot vouch for a deadline that has not
   * happened yet. What it does buy is that the next harvest keeps this date
   * instead of overwriting it with the listing's.
   */
  runnerConfirmedAt?: string
}

/**
 * Who wrote an entry.
 *
 * Curated and harvested entries share one collection, so the queue that asks
 * "what needs a human" is one query, and a harvest never has to guess whether it
 * is about to overwrite something a person checked.
 *
 * `runner` is a race somebody ran and the catalog did not hold. It enters
 * exactly as a harvested one does, `unreviewed` and through the same duplicate
 * rule, because a person who was there is at least as good a witness as a
 * listing, and lands in the same review queue an operator already works.
 */
export const CATALOG_PRODUCERS = ['curated', 'harvest', 'runner'] as const

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
  /**
   * The zone this race's deadlines are published in.
   *
   * On the race and not on each edition, because it is a property of the place
   * and nothing moves between years: no entry in a real instance had editions
   * that disagreed, and it was asked again on every one of them. Only stored
   * when the country cannot answer for itself, which is the United States,
   * Canada, Brazil and the like.
   */
  timezone?: string
  editions?: RaceCatalogEdition[]
  /**
   * The soonest edition that had not happened when this was written.
   *
   * A copy of what `editions` already says, and the only reason it exists is
   * that Firestore cannot filter or order by a field inside an array. Without
   * it, finding "a 10K in Germany in July" means reading the whole catalog into
   * the browser, which at five thousand entries is five thousand reads per
   * visit.
   *
   * Written at harvest time, so it goes stale in one case: an entry whose next
   * edition passes while a later one is still stored drops out of the query
   * until its source is harvested again, which happens weekly. The alternative
   * was a field that lies less often and a query that cannot order by date.
   */
  nextRaceDate?: string
  /**
   * The words the entry can be found by, from its name and its town.
   *
   * Firestore cannot search inside a string, so a search by name is only
   * possible as `array-contains` over this. Written by whatever writes the
   * entry; an entry from before the field answers no name search until the
   * backfill or the next harvest of its source.
   */
  nameTokens?: string[]
  /**
   * Where the race is, for a search by radius.
   *
   * Present only where a source published it. A missing pair means the entry
   * cannot answer "within 40 km of here", which is why the filter says how many
   * of its results it could place.
   */
  latitude?: number
  longitude?: number
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
  /**
   * Entries an operator said this one is not a copy of.
   *
   * The day, the city and the distance are the same for the two 5 km of the
   * Berlin marathon weekend, so the queue that asks about pairs like that has to
   * be able to take no for an answer and not ask again after the next harvest.
   */
  notDuplicateOf?: string[]
  /** Set by the writer, so an operator can see how stale an entry is. */
  updatedAt?: string
  updatedBy?: string
}

export type RaceCatalog = {
  /** When the committed seed was last edited, `YYYY-MM-DD`. */
  updatedAt: string
  races: RaceCatalogEntry[]
}

/**
 * A day the catalog can store, `YYYY-MM-DD`.
 *
 * The shape and not just the parse, because `new Date('2026-08.-23')` is
 * invalid while `new Date('2026-8-3')` is not, and a day stored in a shape
 * nothing else reads is the same problem one step later. Every day in an entry
 * goes through here: they are compared as strings by the duplicate rule and
 * formatted by `Intl`, which throws on an invalid one.
 */
export function isIsoDay(value: string | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const at = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(at.getTime())) return false
  // The 31st of February parses, as the 3rd of March. The round trip is what
  // catches a day that does not exist.
  return at.toISOString().slice(0, 10) === value
}

/**
 * A day, or the instant a gate opens or closes.
 *
 * The gates take an instant when the organiser publishes a time and a plain
 * day when only the day is known, so both shapes are legal here.
 */
export function isIsoDayOrInstant(value: string | undefined): boolean {
  if (!value) return false
  if (isIsoDay(value)) return true
  return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(new Date(value).getTime())
}
