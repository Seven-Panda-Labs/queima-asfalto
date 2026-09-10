#!/usr/bin/env npx tsx
/**
 * Repairs a day the catalog stored in a shape nothing can read.
 *
 * The admin form took the race date as free text, and one typed "2026-08.-23".
 * Stored, that day reaches `Intl`, which throws `RangeError: Invalid time
 * value`, and the event page it appeared on went white. The form now uses a
 * date input and refuses a malformed day, the formatter renders a dash rather
 * than throwing, and this fixes what is already stored.
 *
 * The repair is the obvious one and nothing else: the stray punctuation comes
 * out, and the result has to be a real day in the year the edition claims. A
 * day this cannot repair that way is printed and left alone.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run fix:catalog-days -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run fix:catalog-days -- --dry-run
 *   npm run fix:catalog-days -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { isIsoDay } from '../shared/raceCatalog/types.js'
import { nextRaceDateOf } from '../shared/raceCatalog/schedule.js'
import type { RaceCatalogEdition, RaceCatalogEntry } from '../shared/raceCatalog/types.js'

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

/** The same day with the punctuation somebody typed by accident removed. */
function repair(day: string, year: number): string | null {
  const digits = day.replace(/[^0-9]/g, '')
  if (digits.length !== 8) return null
  const fixed = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  if (!isIsoDay(fixed) || Number(fixed.slice(0, 4)) !== year) return null
  return fixed
}

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()
  const today = new Date().toISOString().slice(0, 10)

  const snapshot = await db.collection('raceCatalog').get()
  const pending: { id: string; editions: RaceCatalogEdition[]; nextRaceDate?: string }[] = []
  let refused = 0

  for (const document of snapshot.docs) {
    const entry = document.data() as RaceCatalogEntry
    const editions = entry.editions ?? []
    if (!editions.some((edition) => edition.raceDate && !isIsoDay(edition.raceDate))) continue

    const repaired = editions.map((edition) => {
      if (!edition.raceDate || isIsoDay(edition.raceDate)) return edition
      const fixed = repair(edition.raceDate, edition.year)
      if (!fixed) {
        console.log(`  cannot repair ${document.id} ${edition.year}: ${edition.raceDate}`)
        refused += 1
        return edition
      }
      console.log(`  ${document.id} ${edition.year}: ${edition.raceDate} -> ${fixed}`)
      return { ...edition, raceDate: fixed }
    })

    pending.push({
      id: document.id,
      editions: repaired,
      nextRaceDate: nextRaceDateOf(repaired, today),
    })
  }

  console.log(`${snapshot.size} entries, ${pending.length} to write, ${refused} days left alone`)
  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  for (const entry of pending) {
    await db
      .collection('raceCatalog')
      .doc(entry.id)
      .update({
        editions: entry.editions,
        ...(entry.nextRaceDate ? { nextRaceDate: entry.nextRaceDate } : {}),
      })
  }
  console.log(`written ${pending.length}`)
}

await main()
