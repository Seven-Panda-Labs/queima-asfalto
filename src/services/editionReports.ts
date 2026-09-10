import { doc, setDoc } from 'firebase/firestore'
import {
  EDITION_REPORTS_COLLECTION,
  editionReportId,
  type EditionReport,
} from '../../shared/raceCatalog'
import { getRace } from './races'
import { db } from './firebase'

/**
 * Tells the catalog which day this race was actually run.
 *
 * Called when a runner's result comes back verified from the official import,
 * which is the only thing that makes this trustworthy without a person
 * checking it: the organiser's own results page listed somebody finishing that
 * day. The scheduled harvest folds it into the shared entry.
 *
 * Silent, and never in the way. It is a side effect of saving a result, so a
 * catalog that cannot be written, or a race the catalog does not cover, has to
 * cost the runner nothing.
 */
export async function reportEditionDate(
  uid: string,
  raceId: string,
  date: Date,
): Promise<void> {
  const race = await safely(() => getRace(raceId))
  if (!race?.catalogRaceId) return

  const raceDate = toIsoDay(date)
  await write(race.catalogRaceId, Number(raceDate.slice(0, 4)), uid, { raceDate })
}

/**
 * Tells the catalog the days of every edition this runner already has a
 * verified result for.
 *
 * Reporting a day only happened at the moment a result was saved, and until
 * then `race.catalogRaceId` was almost never set: the link is made afterwards,
 * on the event's page, and years of verified results were already sitting
 * there when it was. So a runner who identified a race the catalog knew only
 * one edition of contributed nothing, and the edition they ran stayed missing.
 * Measured on a real instance: thirteen editions across nine races, and the
 * reports collection empty.
 *
 * One report per year, keeping the earliest day, because the document id holds
 * one report per race, year and runner, and the earliest is what the policy
 * takes when several are reported for one year anyway.
 */
export async function reportEditionDates(
  uid: string,
  catalogRaceId: string,
  dates: readonly Date[],
): Promise<number> {
  const earliest = new Map<number, string>()
  for (const date of dates) {
    const day = toIsoDay(date)
    const year = Number(day.slice(0, 4))
    const held = earliest.get(year)
    if (!held || day < held) earliest.set(year, day)
  }

  for (const [year, raceDate] of earliest) {
    await write(catalogRaceId, year, uid, { raceDate })
  }
  return earliest.size
}

/**
 * Tells the catalog what entering this edition cost.
 *
 * From an entry the runner marked `registered`, which is them saying they got
 * in: a fee they were quoted and never paid is not a fee. No source we read
 * publishes one at all, so the runners are the only source there is.
 *
 * The caller passes the catalog id because it already has the entry in hand,
 * which saves a read on the path that saves an entry.
 */
export async function reportEditionFee(
  uid: string,
  catalogRaceId: string,
  year: number,
  fee: number,
  feeCurrency: string,
): Promise<void> {
  if (!Number.isFinite(fee) || fee <= 0 || !feeCurrency.trim()) return
  await write(catalogRaceId, year, uid, {
    fee,
    feeCurrency: feeCurrency.trim().toUpperCase(),
  })
}

/**
 * One document per race, year and runner, merged rather than replaced.
 *
 * A runner registers months before they run, so the fee and the day arrive
 * separately and both belong to the same report.
 */
async function write(
  catalogRaceId: string,
  year: number,
  uid: string,
  what: Partial<EditionReport>,
): Promise<void> {
  const report: EditionReport = {
    catalogRaceId,
    year,
    uid,
    reportedAt: toIsoDay(new Date()),
    ...what,
  }

  await safely(() =>
    setDoc(
      doc(db, EDITION_REPORTS_COLLECTION, editionReportId(catalogRaceId, year, uid)),
      report,
      { merge: true },
    ),
  )
}

/**
 * Never in the way.
 *
 * These are side effects of saving something the runner asked for, and an
 * instance whose catalog cannot be written has to cost them nothing.
 */
async function safely<T>(action: () => Promise<T>): Promise<T | null> {
  try {
    return await action()
  } catch {
    return null
  }
}

/**
 * The local day, not the UTC one.
 *
 * A race at 09:00 in Lisbon on the 11th is stored as an instant, and
 * `toISOString()` on a runner east of Greenwich can turn that into the 10th.
 * The day the race was run is a calendar fact, so it is read off the calendar.
 */
function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
