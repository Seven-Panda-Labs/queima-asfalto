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
  try {
    const race = await getRace(raceId)
    const catalogRaceId = race?.catalogRaceId
    if (!catalogRaceId) return

    const raceDate = toIsoDay(date)
    const year = Number(raceDate.slice(0, 4))
    const report: EditionReport = {
      catalogRaceId,
      year,
      uid,
      raceDate,
      reportedAt: toIsoDay(new Date()),
    }

    await setDoc(
      doc(db, EDITION_REPORTS_COLLECTION, editionReportId(catalogRaceId, year, uid)),
      report,
    )
  } catch {
    // The result is saved either way. Nothing the runner asked for is lost by
    // the catalog not hearing about it, and the next verified result tries
    // again.
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
