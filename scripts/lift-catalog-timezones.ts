#!/usr/bin/env npx tsx
/**
 * Moves a zone off the editions and onto the race, or drops it.
 *
 * The zone was asked for on every edition and is a property of the place: no
 * entry in a real instance had editions that disagreed, and 37 editions of
 * 5327 carried one at all. The country now answers for most races, so what is
 * stored should be only what the country cannot say.
 *
 * Per entry: if the country gives the same zone the editions do, the stored
 * one goes, since it is the same answer written twice. If it gives a different
 * one, or none, the zone moves to the entry and the editions keep theirs,
 * which reads first. Editions that disagree with each other are reported and
 * left alone.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run lift:catalog-timezones -- --confirm
 *
 * Against production, with Application Default Credentials:
 *   npm run lift:catalog-timezones -- --dry-run
 *   npm run lift:catalog-timezones -- --confirm
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { timezoneFor } from '../shared/raceCatalog/timezones.js'
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

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()

  const snapshot = await db.collection('raceCatalog').get()
  const writes: { id: string; data: Record<string, unknown> }[] = []
  let dropped = 0
  let lifted = 0
  let disagreeing = 0

  for (const document of snapshot.docs) {
    const entry = document.data() as RaceCatalogEntry
    const editions = entry.editions ?? []
    const zones = [...new Set(editions.map((edition) => edition.timezone).filter(Boolean))]
    if (zones.length === 0) continue
    if (zones.length > 1) {
      console.log(`  ${document.id}: editions disagree (${zones.join(', ')}), left alone`)
      disagreeing += 1
      continue
    }

    const stored = zones[0]!
    const fromCountry = timezoneFor(entry.country)
    const clean = editions.map((edition) => {
      const { timezone, ...rest } = edition
      return rest as RaceCatalogEdition
    })

    if (fromCountry === stored) {
      dropped += 1
      console.log(`  ${document.id}: ${stored} is what ${entry.country} says, dropped`)
      writes.push({ id: document.id, data: { editions: clean } })
      continue
    }

    lifted += 1
    console.log(`  ${document.id}: ${stored} moves to the race (${entry.country} says ${fromCountry ?? 'nothing'})`)
    writes.push({ id: document.id, data: { editions: clean, timezone: stored } })
  }

  console.log(
    `${snapshot.size} entries: ${dropped} zones dropped as the country's own, ` +
      `${lifted} moved to the race, ${disagreeing} left alone`,
  )
  if (dryRun) {
    console.log('Dry run, nothing written.')
    return
  }

  for (const write of writes) {
    await db.collection('raceCatalog').doc(write.id).update(write.data)
  }
  console.log(`written ${writes.length}`)
}

await main()
