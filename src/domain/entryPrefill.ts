import {
  canAssertDates,
  editionForYear,
  type RaceCatalogEntry,
  type RaceEntryMethod,
} from '../../shared/raceCatalog'

/**
 * What the catalog can offer a runner who is planning an entry.
 *
 * The catalog holds the dates, the gates and sometimes the fee, and until now
 * nothing on the private side read them: the entry form opened empty even for a
 * race whose next edition we already knew. `editionForYear` had no callers at
 * all.
 *
 * Everything here is a suggestion. `assertable` says whether a person has
 * checked the entry against the organiser, and it is the only thing that
 * decides whether a prefilled race date may be marked as confirmed: an
 * unreviewed entry may fill a field the runner can see and correct, and may
 * never state a date as settled.
 */
export type EntryPrefill = {
  /** The year the offer is for, which is the edition's. */
  year?: number
  /** ISO days, `YYYY-MM-DD`, which is what the form's date inputs take. */
  raceDate?: string
  registrationOpensAt?: string
  registrationClosesAt?: string
  lotteryDrawAt?: string
  /** IANA zone, so a reminder can print the local opening time. */
  timezone?: string
  fee?: number
  feeCurrency?: string
  entryMethod?: RaceEntryMethod
  registrationUrl?: string
  /** The host the values came from, so the form can say where they are from. */
  source: string
  /** Whether a person checked this entry. Never true for a harvested one. */
  assertable: boolean
}

/** The form's date inputs take a day, and an edition may carry an instant. */
function day(value: string | undefined): string | undefined {
  return value?.slice(0, 10)
}

/**
 * The edition worth planning: the soonest one that has not happened yet.
 *
 * Not simply the latest, because a catalog that still holds last year's edition
 * would offer a date in the past, and not `nextRaceDate` either, which is a
 * flattened copy for querying and says nothing about the gates.
 */
function upcomingEdition(race: RaceCatalogEntry, today: string) {
  return (race.editions ?? [])
    .filter((edition) => (edition.raceDate ?? '') >= today)
    .sort((left, right) => (left.raceDate ?? '').localeCompare(right.raceDate ?? ''))[0]
}

/**
 * @param year the year being planned, when the runner already picked one.
 *
 * Without it the offer is for the soonest edition still ahead, which is a
 * better guess than the form's own default of next year.
 */
export function prefillFromCatalog(
  race: RaceCatalogEntry | null,
  options: { year?: number; today?: Date } = {},
): EntryPrefill | null {
  if (!race) return null

  const today = (options.today ?? new Date()).toISOString().slice(0, 10)
  const edition =
    options.year !== undefined
      ? editionForYear(race, options.year)
      : upcomingEdition(race, today)

  const offer: EntryPrefill = compact({
    year: edition?.year,
    raceDate: day(edition?.raceDate),
    registrationOpensAt: day(edition?.registrationOpensAt),
    registrationClosesAt: day(edition?.registrationClosesAt),
    lotteryDrawAt: day(edition?.lotteryDrawAt),
    timezone: edition?.timezone,
    fee: edition?.typicalFee,
    feeCurrency: edition?.typicalFee !== undefined ? edition.feeCurrency : undefined,
    // These two are facts about the race rather than about one year of it, so
    // they are worth offering even when no edition is known.
    entryMethod: race.entryMethod === 'unknown' ? undefined : race.entryMethod,
    registrationUrl: race.registrationUrl ?? race.officialUrl,
    source: race.source,
    assertable: canAssertDates(race),
  })

  // Nothing but the provenance is not an offer.
  return Object.keys(offer).length > 2 ? offer : null
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T
}
