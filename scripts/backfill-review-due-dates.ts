#!/usr/bin/env npx tsx
/**
 * Says, for every entry, when the work queue should ask about it.
 *
 * The queue used to be `nextRaceDate < today`, which matched 1046 documents
 * where 933 races were waiting: the other 113 were retired entries and copies
 * that the browser threw away after downloading them, so the number above the
 * list could never be right and an operator could not put one off.
 *
 * `reviewDueDate` answers both. It is the race's own next date, and nothing
 * at all for an entry that is retired or a copy. Every write path maintains it
 * from here on; this is for what is already stored.
 *
 *   npm run backfill:review-due -- --dry-run
 *   npm run backfill:review-due -- --confirm
 *
 * Against the emulator, prefix with
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { reviewDueDateFor } from '../shared/raceCatalog/reviewDue.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

/** Firestore takes 500 writes in one batch. */
const BATCH = 400

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()

  const snapshot = await db.collection('raceCatalog').get()
  const entries = snapshot.docs.map((document: { id: string; data: () => unknown }) => ({
    ...(document.data() as RaceCatalogEntry),
    id: document.id,
  }))

  const due = entries.filter((entry: RaceCatalogEntry) => reviewDueDateFor(entry) !== undefined)
  const notWork = entries.length - due.length
  const today = new Date().toISOString().slice(0, 10)
  console.log(
    `${entries.length} entries: ${due.length} get a due date, ${notWork} are retired or a copy`,
  )
  console.log(`of those, ${due.filter((e: RaceCatalogEntry) => (reviewDueDateFor(e) ?? '') < today).length} are waiting today`)

  if (dryRun) {
    console.log('\nDry run, nothing written.')
    return
  }

  let written = 0
  for (let at = 0; at < entries.length; at += BATCH) {
    const batch = db.batch()
    for (const entry of entries.slice(at, at + BATCH)) {
      const value = reviewDueDateFor(entry)
      batch.set(
        db.collection('raceCatalog').doc(entry.id),
        { reviewDueDate: value ?? FieldValue.delete() },
        { merge: true },
      )
      written += 1
    }
    await batch.commit()
    console.log(`  ${written}/${entries.length}`)
  }
  console.log(`\n${written} entries answered for.`)
}

await main()
