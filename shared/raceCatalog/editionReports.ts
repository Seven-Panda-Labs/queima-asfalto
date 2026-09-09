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
 * How many runners have to agree on a day the catalog disagrees with.
 *
 * One is not enough against a published listing: the runner's own event may
 * have taken its date from that very listing, and a typo would otherwise be
 * defended against the source correcting itself.
 */
const CORROBORATION = 2

/** Reported days for one year, and how many different runners said each. */
function votesByDay(reports: readonly EditionReport[], id: string) {
  const years = new Map<number, Map<string, Set<string>>>()
  for (const report of reports) {
    if (report.catalogRaceId !== id || !report.raceDate) continue
    const days = years.get(report.year) ?? new Map<string, Set<string>>()
    const voters = days.get(report.raceDate) ?? new Set<string>()
    voters.add(report.uid)
    days.set(report.raceDate, voters)
    years.set(report.year, days)
  }
  return years
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
  const years = votesByDay(reports, entry.id)
  if (years.size === 0) return null

  const editions = [...(entry.editions ?? [])]
  let changed = false

  for (const [year, days] of years) {
    const at = editions.findIndex((edition) => edition.year === year)
    const reported = [...days.keys()].sort()

    if (at < 0) {
      // A year the catalog never had, and the harvest never will: it only ever
      // writes the edition still ahead. One runner is enough, because the
      // alternative is no date, and it stays unmarked so that a source
      // publishing this year later is free to overwrite it.
      editions.push({
        year,
        raceDate: reported[0]!,
        source: RUNNER_SOURCE,
        confirmedAt: today,
      })
      changed = true
      continue
    }

    const edition = editions[at]!
    // Agreement is not news, and marking it would only launder the listing's
    // own date into something that then outlives the listing.
    const disagreeing = reported.filter((day) => day !== edition.raceDate)
    const corroborated = disagreeing.find(
      (day) => (days.get(day)?.size ?? 0) >= CORROBORATION,
    )
    if (!corroborated || edition.raceDate === corroborated) continue

    editions[at] = { ...edition, raceDate: corroborated, runnerConfirmedAt: today }
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
