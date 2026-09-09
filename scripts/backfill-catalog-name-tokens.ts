#!/usr/bin/env npx tsx
/**
 * Fills in `nameTokens` on catalog entries that predate the field.
 *
 * A name search is `array-contains` over that list, because Firestore cannot
 * look inside a string. Every write path fills it in now; the five thousand
 * entries already stored do not have it, and without it they answer no name
 * search at all, which would make the field look broken rather than new.
 *
 * Derived, never invented: the words of the name and the town, normalised the
 * same way the search normalises what was typed.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run backfill:catalog-name-tokens -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run backfill:catalog-name-tokens -- --dry-run
 *   npm run backfill:catalog-name-tokens -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { nameTokensOf } from '../shared/raceCatalog/nameTokens.js'
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

const same = (left: readonly string[] = [], right: readonly string[] = []) =>
  left.length === right.length && left.every((token, at) => token === right[at])

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()

  const snapshot = await db.collection('raceCatalog').get()
  const pending: { id: string; nameTokens: string[] }[] = []
  let already = 0
  let nothingToIndex = 0

  for (const document of snapshot.docs) {
    const entry = document.data() as RaceCatalogEntry
    const nameTokens = nameTokensOf(entry.name, entry.city ?? '')
    if (nameTokens.length === 0) {
      // A name of nothing but a distance, which no word can find.
      nothingToIndex += 1
      continue
    }
    if (same(entry.nameTokens, nameTokens)) {
      already += 1
      continue
    }
    pending.push({ id: document.id, nameTokens })
  }

  console.log(
    `${snapshot.size} entries: ${pending.length} to write, ${already} already right, ` +
      `${nothingToIndex} with no word to index`,
  )
  for (const entry of pending.slice(0, 5)) {
    console.log(`  ${entry.id} -> ${entry.nameTokens.join(', ')}`)
  }

  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  for (let at = 0; at < pending.length; at += BATCH_SIZE) {
    const batch = db.batch()
    for (const entry of pending.slice(at, at + BATCH_SIZE)) {
      batch.update(db.collection('raceCatalog').doc(entry.id), { nameTokens: entry.nameTokens })
    }
    await batch.commit()
    console.log(`written ${Math.min(at + BATCH_SIZE, pending.length)}/${pending.length}`)
  }
}

await main()
