#!/usr/bin/env npx tsx
/**
 * Fills in `nextRaceDate` on catalog entries that predate the field.
 *
 * The discovery page asks Firestore for "a 10K in Germany from July", which
 * needs a date it can filter and order by. `editions[].raceDate` is inside an
 * array, so Firestore cannot, and `nextRaceDate` is the flattened copy. Every
 * write path fills it in now; the entries already stored do not have it, and
 * without it they answer no query at all.
 *
 * Derived, never invented: it is the soonest edition still ahead, and the
 * latest one there is when they are all past. An entry with no dated edition
 * gets nothing, which is what the query should do with it anyway.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run backfill:catalog-dates -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run backfill:catalog-dates -- --dry-run
 *   npm run backfill:catalog-dates -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { nextRaceDateOf } from '../shared/raceCatalog/schedule.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'

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

/** Firestore takes 500 writes per batch, and this is one field per document. */
const BATCH_SIZE = 400

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()
  const today = new Date().toISOString().slice(0, 10)

  const snapshot = await db.collection('raceCatalog').get()
  const pending: { id: string; nextRaceDate: string }[] = []
  let already = 0
  let dateless = 0

  for (const document of snapshot.docs) {
    const entry = document.data() as RaceCatalogEntry
    const next = nextRaceDateOf(entry.editions, today)
    if (!next) {
      dateless += 1
      continue
    }
    if (entry.nextRaceDate === next) {
      already += 1
      continue
    }
    pending.push({ id: document.id, nextRaceDate: next })
  }

  console.log(
    `${snapshot.size} entries: ${pending.length} to write, ${already} already right, ` +
      `${dateless} with no dated edition`,
  )
  for (const entry of pending.slice(0, 5)) {
    console.log(`  ${entry.id} -> ${entry.nextRaceDate}`)
  }

  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  for (let at = 0; at < pending.length; at += BATCH_SIZE) {
    const batch = db.batch()
    for (const entry of pending.slice(at, at + BATCH_SIZE)) {
      batch.update(db.collection('raceCatalog').doc(entry.id), {
        nextRaceDate: entry.nextRaceDate,
      })
    }
    await batch.commit()
    console.log(`written ${Math.min(at + BATCH_SIZE, pending.length)}/${pending.length}`)
  }
}

await main()
