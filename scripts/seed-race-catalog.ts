#!/usr/bin/env npx tsx
/**
 * Writes the bootstrap races into an instance's `raceCatalog` collection.
 *
 * The catalog is no longer part of the app: each instance owns its own, edited in
 * the admin area. This script exists so an operator starting out does not have to
 * retype the fourteen races that were reviewed against their organisers, and it is
 * meant to be run once.
 *
 * It never overwrites. An id that already exists is left alone, because the
 * instance's copy is the real one and this list is only a starting point.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run seed:race-catalog -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run seed:race-catalog -- --dry-run
 *   npm run seed:race-catalog -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { RACE_CATALOG_COLLECTION } from '../shared/raceCatalog/collection.js'
import { SEED_RACES } from './data/raceCatalogSeed.js'

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

initializeApp({ projectId: PROJECT_ID })
const db = getFirestore()

console.log(`Target project: ${PROJECT_ID}`)
console.log(`Races in the bootstrap list: ${SEED_RACES.length}`)
console.log(`Mode: ${dryRun ? 'dry run' : 'write'}\n`)

let written = 0
let kept = 0

for (const race of SEED_RACES) {
  const ref = db.collection(RACE_CATALOG_COLLECTION).doc(race.id)
  if ((await ref.get()).exists) {
    console.log(`  keeping  ${race.id} (already in this instance)`)
    kept += 1
    continue
  }

  if (dryRun) {
    console.log(`  would write ${race.id}`)
  } else {
    await ref.set({
      ...race,
      producer: 'curated',
      updatedAt: new Date().toISOString(),
      updatedBy: 'seed:race-catalog',
    })
  }
  written += 1
}

console.log(
  `\n${dryRun ? 'would write' : 'written'}: ${written}\nleft alone: ${kept}`,
)
