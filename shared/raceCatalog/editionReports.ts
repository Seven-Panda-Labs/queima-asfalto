import { nextRaceDateOf } from './schedule.js'
import type { RaceCatalogEdition, RaceCatalogEntry } from './types.js'

/**
 * A runner saying which day they ran an edition.
 *
 * The catalog's dates are read off listings, and the runners who were there
 * know better. What makes this worth trusting without a person in the loop is
 * where it comes from: an event with `resultsVerified`, which only ever comes
 * from the official results import. If the organiser's own results page lists
 * somebody finishing that day, the date is a fact.
 *
 * The boundary is the past. A day already run can be confirmed like this; when
 * entries open or close cannot, because that is what fires reminders and a
 * wrong deadline is wrong in silence. Those go to a person.
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
  raceDate: string
  /** ISO day the report was written. */
  reportedAt: string
}

export function editionReportId(catalogRaceId: string, year: number, uid: string): string {
  return `${catalogRaceId}__${year}__${uid}`
}

/** What the catalog records as the source of a date its own sources did not give. */
export const RUNNER_SOURCE = 'runners'

/**
 * The entry with what the runners reported folded in, or null if it already
 * said the same thing.
 *
 * Null rather than an unchanged copy so the caller can skip the write: this
 * runs over every race that has a report, every day, and most of them will
 * already be right.
 *
 * Two runners can disagree when an event runs over a weekend, and the earliest
 * day wins, which is how the harvest already reads a date range.
 */
export function applyEditionReports(
  entry: RaceCatalogEntry,
  reports: readonly EditionReport[],
  today: string,
): RaceCatalogEntry | null {
  const byYear = new Map<number, string>()
  for (const report of reports) {
    if (report.catalogRaceId !== entry.id) continue
    const known = byYear.get(report.year)
    if (!known || report.raceDate < known) byYear.set(report.year, report.raceDate)
  }
  if (byYear.size === 0) return null

  const editions = [...(entry.editions ?? [])]
  let changed = false

  for (const [year, raceDate] of byYear) {
    const at = editions.findIndex((edition) => edition.year === year)
    if (at < 0) {
      // A year the catalog never had. Runners are how it gains a history: the
      // harvest only ever writes the edition that is still ahead.
      editions.push({ year, raceDate, source: RUNNER_SOURCE, confirmedAt: today, runnerConfirmedAt: today })
      changed = true
      continue
    }

    const edition = editions[at]!
    if (edition.raceDate === raceDate && edition.runnerConfirmedAt) continue
    editions[at] = { ...edition, raceDate, runnerConfirmedAt: today }
    changed = true
  }

  if (!changed) return null

  const sorted = editions.sort((left, right) => left.year - right.year)
  return { ...entry, editions: sorted, nextRaceDate: nextRaceDateOf(sorted, today) }
}

/**
 * The edition to keep when a harvest brings a fresh one for the same year.
 *
 * The harvest replaces an edition whole, which is what would undo a runner's
 * date on the next run of that source. So the date and its marker are carried
 * across, and everything else is the listing's: a fee or a deadline published
 * since is news, and the day is not.
 */
export function keepRunnerDate(
  incoming: RaceCatalogEdition,
  existing: RaceCatalogEdition | undefined,
): RaceCatalogEdition {
  if (!existing?.runnerConfirmedAt || !existing.raceDate) return incoming
  return { ...incoming, raceDate: existing.raceDate, runnerConfirmedAt: existing.runnerConfirmedAt }
}
