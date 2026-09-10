import { nextRaceDateOf } from './schedule.js'
import type { RaceCatalogEdition, RaceCatalogEntry } from './types.js'

/**
 * A runner saying which day they ran an edition.
 *
 * A report is an observation and this file is the policy, which matters
 * because a verified result proves less than it looks like it does. The
 * official import finds the runner's name and time on the results page for an
 * edition, and the connectors pick that edition **by year**: nothing in a
 * candidate carries a day. So a verified result is evidence that this runner
 * ran this race that year, and no evidence at all about the day.
 *
 * The day in the report comes from the event, and since the entry form began
 * prefilling from the catalog, that day may be the catalog's own scrape coming
 * back around. Marking it confirmed would launder a guess into a fact, and
 * then defend it against the listing correcting itself.
 *
 * Hence three cases, and only the middle one is generous:
 *
 * 1. **A year the catalog never had.** Taken, because the alternative is no
 *    date at all, and left unmarked so a source that publishes one later wins.
 * 2. **A day that disagrees with the catalog, from two runners or more.** Taken
 *    and marked, because two people who were there and did not get the day
 *    from us is the strongest thing available.
 * 3. **A day that agrees, or one runner disagreeing.** Nothing. Agreement adds
 *    no information, and one runner against a published listing is one voice.
 *
 * The boundary is still the past: when entries open or close never comes from
 * here, because that is what fires reminders and a wrong deadline is wrong in
 * silence.
 *
 * One document per race, year and runner, so one person is one voice, and what
 * lands on the shared edition is the date and nothing about who sent it.
 */

export const EDITION_REPORTS_COLLECTION = 'raceCatalogEditionReports'

export type EditionReport = {
  catalogRaceId: string
  year: number
  uid: string
  /** ISO day, `YYYY-MM-DD`, from the event the runner had verified. */
  raceDate?: string
  /**
   * What the runner paid to enter, in major units.
   *
   * From an entry they marked `registered`, which is the runner saying they
   * got in. No source we read publishes a fee at all: runme.de puts it behind
   * a subscription and running.life and kilometerliebe publish none, which is
   * why the catalog holds one for about a hundred of five thousand entries.
   */
  fee?: number
  /** ISO 4217, required whenever `fee` is set. */
  feeCurrency?: string
  /**
   * The edition's results page, from the event the runner had verified.
   *
   * Already through `shareableResultsUrl`, which drops the parts that named
   * the runner: a saved link can be a search for their own surname or one row
   * of a results table. The catalog holds the edition's page, never a person's
   * result.
   */
  resultsUrl?: string
  /** ISO day the report was written. */
  reportedAt: string
}

export function editionReportId(catalogRaceId: string, year: number, uid: string): string {
  return `${catalogRaceId}__${year}__${uid}`
}

/** What the catalog records as the source of a date its own sources did not give. */
export const RUNNER_SOURCE = 'runners'

/**
 * How many runners have to agree on a day the catalog disagrees with.
 *
 * One is not enough against a published listing: the runner's own event may
 * have taken its date from that very listing, and a typo would otherwise be
 * defended against the source correcting itself.
 */
const CORROBORATION = 2

/**
 * Reported values for one year, and which runners said each.
 *
 * By runner and not by report, so nobody corroborates themselves. The document
 * id already holds them to one report per race and year, and this does not
 * depend on that.
 */
function votesByValue(
  reports: readonly EditionReport[],
  id: string,
  valueOf: (report: EditionReport) => string | undefined,
) {
  const years = new Map<number, Map<string, Set<string>>>()
  for (const report of reports) {
    if (report.catalogRaceId !== id) continue
    const value = valueOf(report)
    if (!value) continue
    const values = years.get(report.year) ?? new Map<string, Set<string>>()
    const voters = values.get(value) ?? new Set<string>()
    voters.add(report.uid)
    values.set(value, voters)
    years.set(report.year, values)
  }
  return years
}

/** A fee is a number and a currency, and only agrees when both do. */
function feeOf(report: EditionReport): string | undefined {
  if (report.fee === undefined || !report.feeCurrency) return undefined
  return `${report.fee} ${report.feeCurrency.toUpperCase()}`
}

/** Back into the fields an edition uses, where the fee is `typicalFee`. */
function parseFee(value: string): { typicalFee: number; feeCurrency: string } {
  const [amount, currency] = value.split(' ')
  return { typicalFee: Number(amount), feeCurrency: currency! }
}

/**
 * The value enough runners agree on that the catalog does not already hold.
 *
 * Undefined for agreement, which is not information, and for a single voice
 * against something published.
 */
function corroborated(
  values: Map<string, Set<string>>,
  held: string | undefined,
): string | undefined {
  return [...values.keys()]
    .sort()
    .filter((value) => value !== held)
    .find((value) => (values.get(value)?.size ?? 0) >= CORROBORATION)
}

/**
 * The entry with what the runners reported folded in, or null when there is
 * nothing to write.
 *
 * Null rather than an unchanged copy so the caller can skip the write: this
 * runs over every race that has a report, every day, and most of them will
 * already be right.
 *
 * Where several days are reported for one year, the earliest wins, which is
 * how the harvest already reads a date range: an event over a weekend starts
 * on the first day.
 */
export function applyEditionReports(
  entry: RaceCatalogEntry,
  reports: readonly EditionReport[],
  today: string,
): RaceCatalogEntry | null {
  const days = votesByValue(reports, entry.id, (report) => report.raceDate)
  const fees = votesByValue(reports, entry.id, feeOf)
  const links = votesByValue(reports, entry.id, (report) => report.resultsUrl)
  const years = new Set([...days.keys(), ...fees.keys(), ...links.keys()])
  if (years.size === 0) return null

  const editions = [...(entry.editions ?? [])]
  let changed = false

  for (const year of years) {
    const at = editions.findIndex((edition) => edition.year === year)
    const reportedDays = [...(days.get(year)?.keys() ?? [])].sort()
    const reportedFees = fees.get(year)
    const reportedLinks = links.get(year)

    if (at < 0) {
      // A year the catalog never had, and the harvest never will: it only ever
      // writes the edition still ahead. One runner is enough, because the
      // alternative is nothing, and it stays unmarked so that a source
      // publishing this year later is free to overwrite it.
      const day = reportedDays[0]
      const fee = [...(reportedFees?.keys() ?? [])].sort()[0]
      const link = [...(reportedLinks?.keys() ?? [])].sort()[0]
      if (!day && !fee && !link) continue
      editions.push({
        year,
        ...(day ? { raceDate: day } : {}),
        ...(fee ? parseFee(fee) : {}),
        ...(link ? { resultsUrl: link } : {}),
        source: RUNNER_SOURCE,
        confirmedAt: today,
      })
      changed = true
      continue
    }

    const edition = editions[at]!
    let updated = edition

    const day = days.get(year)
    if (day) {
      const better = corroborated(day, edition.raceDate)
      if (better) updated = { ...updated, raceDate: better, runnerConfirmedAt: today }
    }

    if (reportedFees) {
      const held =
        edition.typicalFee !== undefined && edition.feeCurrency
          ? `${edition.typicalFee} ${edition.feeCurrency.toUpperCase()}`
          : undefined
      // Nothing published to contradict, so one runner who paid it is enough.
      const only = [...reportedFees.keys()].sort()[0]
      const better = held === undefined ? only : corroborated(reportedFees, held)
      if (better && better !== held) updated = { ...updated, ...parseFee(better) }
    }

    if (reportedLinks) {
      // Nothing published to contradict: no source we read gives a results
      // page at all, so the first runner who has one is the only offer there
      // is. Replacing one the catalog holds still takes two.
      const only = [...reportedLinks.keys()].sort()[0]
      const better =
        edition.resultsUrl === undefined ? only : corroborated(reportedLinks, edition.resultsUrl)
      if (better && better !== edition.resultsUrl) updated = { ...updated, resultsUrl: better }
    }

    if (updated === edition) continue
    editions[at] = updated
    changed = true
  }

  if (!changed) return null

  const sorted = editions.sort((left, right) => left.year - right.year)
  return { ...entry, editions: sorted, nextRaceDate: nextRaceDateOf(sorted, today) }
}

/**
 * The edition to keep when a harvest brings a fresh one for the same year.
 *
 * The harvest replaces an edition whole, which is what would undo what a
 * runner gave on the next run of that source. So the corroborated date, its
 * marker and the results page are carried across, and everything else is the
 * listing's: a fee or a deadline published since is news, and the day is not.
 */
export function keepRunnerFacts(
  incoming: RaceCatalogEdition,
  existing: RaceCatalogEdition | undefined,
): RaceCatalogEdition {
  // The results page came from a runner and no source publishes one, so a
  // fresh listing would only ever drop it.
  const withLink = existing?.resultsUrl
    ? { ...incoming, resultsUrl: existing.resultsUrl }
    : incoming
  if (!existing?.runnerConfirmedAt || !existing.raceDate) return withLink
  return {
    ...withLink,
    raceDate: existing.raceDate,
    runnerConfirmedAt: existing.runnerConfirmedAt,
  }
}
