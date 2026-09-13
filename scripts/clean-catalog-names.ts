#!/usr/bin/env npx tsx
/**
 * Takes the edition out of the names already stored.
 *
 * A catalog entry is a race and its editions are the years, so "33. Graz
 * Marathon" names the race wrong: next year the same race is the 34th and
 * every list showing it carries a number that is out of date. The harvest
 * writes names without the edition now; these are the ones written before.
 *
 * Only what is plainly the edition goes, which is what `nameWithoutEdition`
 * decides: an ordinal with its dot at the front, and a year at the end near
 * enough to now to be an edition. A bare leading number stays, because in
 * almost every one of those the number is the race: "10 Marathon in 10 Tagen".
 *
 * The words the search uses are rewritten with the name, and the id is not:
 * `races.catalogRaceId` points at it and ids never change.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run clean:catalog-names -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run clean:catalog-names -- --dry-run
 *   npm run clean:catalog-names -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { nameWithoutEdition } from '../shared/eventDiscovery/identity.js'
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

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()
  const now = new Date()

  const snapshot = await db.collection('raceCatalog').get()
  const writes: { id: string; name: string; nameTokens: string[] }[] = []

  for (const document of snapshot.docs) {
    const entry = document.data() as RaceCatalogEntry
    const cleaned = nameWithoutEdition(entry.name, now)
    if (cleaned === entry.name) continue
    writes.push({
      id: document.id,
      name: cleaned,
      nameTokens: nameTokensOf(cleaned, entry.city ?? ''),
    })
  }

  console.log(`${snapshot.size} entries, ${writes.length} names carrying an edition`)
  for (const write of writes.slice(0, 15)) console.log(`  ${write.id}: -> "${write.name}"`)

  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  for (let at = 0; at < writes.length; at += 400) {
    const batch = db.batch()
    for (const write of writes.slice(at, at + 400)) {
      batch.update(db.collection('raceCatalog').doc(write.id), {
        name: write.name,
        nameTokens: write.nameTokens,
      })
    }
    await batch.commit()
    console.log(`written ${Math.min(at + 400, writes.length)}/${writes.length}`)
  }
}

await main()
