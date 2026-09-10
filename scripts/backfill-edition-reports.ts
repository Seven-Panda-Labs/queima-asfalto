#!/usr/bin/env npx tsx
/**
 * Reports the editions runners had already run when they linked a race.
 *
 * A verified result reports its day to the catalog, and that only ever
 * happened at the moment the result was saved. The link from a race to a
 * catalog entry is made afterwards, on the event's page, so every result saved
 * before the link contributed nothing: the report path found no
 * `catalogRaceId` and returned. Identifying a race writes these from now on;
 * the links already made do not have them.
 *
 * Same policy as the client, and it has to be: one report per race, year and
 * runner, the earliest day when a year has several, only verified results, the
 * day read off the calendar rather than off `toISOString`, and the results
 * page only through `shareableResultsUrl`, which drops whatever named the
 * runner in it. What lands on
 * the shared edition is still decided by `applyEditionReports` in the daily
 * pass, which takes a year the catalog never had and needs two runners to
 * overrule one it holds.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run backfill:edition-reports -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run backfill:edition-reports -- --dry-run
 *   npm run backfill:edition-reports -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { editionReportId, type EditionReport } from '../shared/raceCatalog/editionReports.js'
import { shareableResultsUrl } from '../shared/officialResults/shareableResultsUrl.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

/** The local day, because the day a race was run is a calendar fact. */
function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()
  const today = toIsoDay(new Date())

  const catalogIdOf = new Map<string, string>()
  for (const document of (await db.collection('races').get()).docs) {
    const catalogRaceId = document.data().catalogRaceId
    if (typeof catalogRaceId === 'string' && catalogRaceId) {
      catalogIdOf.set(document.id, catalogRaceId)
    }
  }

  // One report per race, year and runner, and the earliest day wins.
  const reports = new Map<string, EditionReport>()
  let linked = 0
  for (const document of (await db.collection('events').get()).docs) {
    const event = document.data()
    const catalogRaceId = catalogIdOf.get(event.raceId)
    if (!catalogRaceId) continue
    linked += 1
    if (event.resultsVerified !== true) continue

    const date = event.date?.toDate?.() ?? new Date(event.date)
    if (Number.isNaN(date.getTime())) continue
    const raceDate = toIsoDay(date)
    const year = Number(raceDate.slice(0, 4))
    const id = editionReportId(catalogRaceId, year, event.userId)

    const resultsUrl = shareableResultsUrl(event.resultsUrl)

    const held = reports.get(id)
    if (held?.raceDate && held.raceDate <= raceDate) continue
    reports.set(id, {
      catalogRaceId,
      year,
      uid: event.userId,
      raceDate,
      ...(resultsUrl ? { resultsUrl } : {}),
      reportedAt: today,
    })
  }

  console.log(
    `${catalogIdOf.size} races point at the catalog, ${linked} events on them, ` +
      `${reports.size} editions to report`,
  )
  const withLink = [...reports.values()].filter((report) => report.resultsUrl).length
  console.log(`${withLink} of them carry a results page`)
  for (const [id, report] of [...reports].slice(0, 10)) {
    console.log(`  ${id.replace(/__[^_]+$/, '__<uid>')} -> ${report.raceDate} ${report.resultsUrl ?? ''}`)
  }

  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  const batch = db.batch()
  for (const [id, report] of reports) {
    // Merged, so a report the runner already wrote keeps its fee.
    batch.set(db.collection('raceCatalogEditionReports').doc(id), report, { merge: true })
  }
  await batch.commit()
  console.log(`written ${reports.size}`)
}

await main()
