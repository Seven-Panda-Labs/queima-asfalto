import { getFirestore } from 'firebase-admin/firestore'
import {
  applyEditionReports,
  EDITION_REPORTS_COLLECTION,
  RACE_CATALOG_COLLECTION,
  type EditionReport,
  type RaceCatalogEntry,
} from '../shared/raceCatalog/index.js'

/**
 * Folds what runners reported into the shared catalog.
 *
 * The runners write the reports and only this has the standing to write the
 * catalog, which is the same shape the duplicate votes use: a runner can say
 * what they know, and nothing a runner writes lands on a shared entry without
 * passing through here.
 *
 * Runs before the harvest rather than after: the harvest reads the catalog to
 * deduplicate against it, so a date corrected here is the one it compares
 * with. Either order would survive, because `keepRunnerDate` carries a
 * confirmed date across a harvest of that source.
 *
 * Idempotent, and deliberately so. Reports are never deleted, this runs every
 * day over all of them, and `applyEditionReports` returns nothing to write for
 * a race the catalog already agrees with, which is almost all of them.
 */
export async function applyPendingEditionReports(
  now: Date,
): Promise<{ reports: number; races: number }> {
  // Asked for here and not at module load: this file is imported by the
  // harvest before the harvest initialises the app, and a `getFirestore()` at
  // the top of it brings the whole container down at import time. The bundle
  // load test is what caught that.
  const db = getFirestore()

  const today = now.toISOString().slice(0, 10)
  const snapshot = await db.collection(EDITION_REPORTS_COLLECTION).get()
  if (snapshot.empty) return { reports: 0, races: 0 }

  const byRace = new Map<string, EditionReport[]>()
  for (const document of snapshot.docs) {
    const report = document.data() as EditionReport
    if (!report.catalogRaceId || !report.raceDate) continue
    byRace.set(report.catalogRaceId, [...(byRace.get(report.catalogRaceId) ?? []), report])
  }

  let races = 0
  for (const [catalogRaceId, reports] of byRace) {
    const ref = db.collection(RACE_CATALOG_COLLECTION).doc(catalogRaceId)
    const entry = await ref.get()
    if (!entry.exists) continue

    const updated = applyEditionReports(entry.data() as RaceCatalogEntry, reports, today)
    if (!updated) continue

    // Only the two fields this touches. The entry is written by the harvest and
    // by an operator too, and a whole-document write here would undo whatever
    // either of them did in the meantime.
    await ref.update({
      editions: updated.editions,
      ...(updated.nextRaceDate ? { nextRaceDate: updated.nextRaceDate } : {}),
    })
    races += 1
  }

  return { reports: snapshot.size, races }
}
