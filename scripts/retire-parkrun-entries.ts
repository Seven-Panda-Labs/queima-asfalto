#!/usr/bin/env npx tsx
/**
 * Takes the parkruns out of the annual catalog.
 *
 * Three German calendars list parkrun venues as events, so the harvest wrote
 * them as annual races: a weekly free 5 km with a date, an edition and a place
 * in the runner's search, beside the same venue in the parkrun catalog the app
 * syncs from parkrun itself.
 *
 * The harvest refuses them now. This is for the ones already stored, and it
 * retires rather than deletes, because `races.catalogRaceId` may point at one
 * and because deleting would only have the next harvest of an older source
 * write it back.
 *
 * It decides nothing a rule cannot: the name carries the word spelled as one,
 * or the link is parkrun's own site. "Brescia Park Run" and "Burns Park Run"
 * are annual races and stay.
 *
 *   npm run retire:parkruns -- --dry-run
 *   npm run retire:parkruns -- --confirm
 *
 * Against the emulator, prefix with
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { isParkrunListing } from '../shared/eventDiscovery/parkrunListing.js'
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

  const snapshot = await db.collection('raceCatalog').get()
  const found = snapshot.docs
    .map((document: { id: string; data: () => unknown }) => ({
      ...(document.data() as RaceCatalogEntry),
      id: document.id,
    }))
    .filter((entry: RaceCatalogEntry) => entry.retired !== true && isParkrunListing(entry))

  console.log(`${snapshot.size} entries, ${found.length} of them a parkrun`)
  for (const entry of found) {
    console.log(`  ${entry.id}  ${entry.name} (${entry.city}) ${entry.officialUrl ?? ''}`)
  }

  if (dryRun) {
    console.log('\nDry run, nothing written.')
    return
  }

  const updatedAt = new Date().toISOString()
  for (const entry of found) {
    await db
      .collection('raceCatalog')
      .doc(entry.id)
      .set(
        { retired: true, retiredReason: 'parkrun', updatedAt, updatedBy: 'script' },
        { merge: true },
      )
  }
  console.log(`\n${found.length} retired.`)
}

await main()
