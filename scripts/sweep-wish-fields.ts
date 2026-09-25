#!/usr/bin/env npx tsx
/**
 * Takes off a wish everything the race it marks already says.
 *
 * A wish carried a name, a place, coordinates, a distance, disciplines, a
 * target month and year, an anchor flag, a role, the race it serves, a link
 * and an emoji. All of it is the race's, the catalog's or the season's, and a
 * copy is only a chance to disagree. Nothing writes them any more; this clears
 * what is stored.
 *
 * Two are left alone. A wish with no `raceId` has nothing to point at, which
 * is a watched parkrun or a race the catalog does not hold, and clearing its
 * name would leave a row with nothing in it. And `notes` stays, because the
 * note was always the runner's own.
 *
 *   npm run sweep:wish-fields -- --dry-run
 *   npm run sweep:wish-fields -- --confirm
 *
 * Against the emulator, prefix with
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore, Timestamp } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

/** What the race, the catalog or the season says, and the wish no longer does. */
const COPIED = [
  'name',
  'location',
  'locationLat',
  'locationLng',
  'locationGeocodedAt',
  'locationGeocodeQuery',
  'realDistance',
  'disciplines',
  'eventType',
  'targetMonth',
  'targetYear',
  'isAnchor',
  'role',
  'servesRaceId',
  'link',
  'emoji',
] as const

async function main(): Promise<void> {
  initializeApp({ projectId: PROJECT_ID })
  const db = getFirestore()

  const snapshot = await db.collection('bucketListItems').get()
  const wishes = snapshot.docs.map((document: { id: string; data: () => Record<string, unknown> }) => ({
    id: document.id,
    data: document.data(),
  }))

  const markers = wishes.filter((wish: { data: Record<string, unknown> }) => wish.data.raceId)
  const nameless = wishes.length - markers.length
  const toClear = markers.filter((wish: { data: Record<string, unknown> }) =>
    COPIED.some((field) => field in wish.data),
  )

  console.log(`${wishes.length} wishes: ${markers.length} mark a race, ${nameless} do not`)
  console.log(`${toClear.length} still carry fields the race already says`)
  for (const wish of toClear.slice(0, 20)) {
    const held = COPIED.filter((field) => field in wish.data)
    console.log(`  ${wish.id}  ${String(wish.data.name ?? '')}  [${held.join(', ')}]`)
  }

  if (dryRun) {
    console.log('\nDry run, nothing written.')
    return
  }

  let written = 0
  for (const wish of toClear) {
    // A Timestamp, because that is what the field holds everywhere else and
    // what the client calls `toDate()` on. An ISO string here blanked the
    // whole list until the documents were rewritten.
    const patch: Record<string, unknown> = { updatedAt: Timestamp.now() }
    for (const field of COPIED) {
      if (field in wish.data) patch[field] = FieldValue.delete()
    }
    await db.collection('bucketListItems').doc(wish.id).update(patch)
    written += 1
  }
  console.log(`\n${written} wishes swept.`)
}

await main()
