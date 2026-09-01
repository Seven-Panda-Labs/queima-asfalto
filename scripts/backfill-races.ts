#!/usr/bin/env npx tsx
/**
 * Gives existing events and bucket list items a `raceId`, minting one race per
 * course.
 *
 * Grouping is `courseKey`, the same rule the analysis already uses to gather the
 * runnings of one course: names are typed by hand every year, and the key is
 * deliberately not fuzzy. A document whose name matches nothing keeps a race of
 * its own, which is the honest outcome rather than a guess.
 *
 * Races are per user, so grouping never crosses accounts.
 *
 * Scoped to one account. Pass --all-users to sweep every account on the
 * instance, which is a deliberate choice rather than the default: an admin
 * script reaching other people's documents should have to say so.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run backfill:races -- --confirm --user-id <uid>
 *
 * Against production, with Application Default Credentials:
 *   npm run backfill:races -- --dry-run --all-users
 *   npm run backfill:races -- --confirm --all-users
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { courseKey } from '../src/domain/courseKey.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'

const dryRun = process.argv.includes('--dry-run')
const confirm = process.argv.includes('--confirm')
const allUsers = process.argv.includes('--all-users')
const userIdIndex = process.argv.indexOf('--user-id')
const userId = userIdIndex === -1 ? null : process.argv[userIdIndex + 1]

if (!dryRun && !confirm) {
  console.error('Refusing to run. Pass --dry-run to preview, or --confirm to write.')
  process.exit(1)
}

if (!userId && !allUsers) {
  console.error('Refusing to run. Pass --user-id <uid>, or --all-users to sweep the instance.')
  process.exit(1)
}

initializeApp({ projectId: PROJECT_ID })
const db = getFirestore()

console.log(`Target project: ${PROJECT_ID}`)
console.log(`Target user: ${userId ?? 'every account on this instance'}`)
console.log(`Mode: ${dryRun ? 'dry run' : 'write'}`)

type Doc = {
  id: string
  ref: { update: (data: Record<string, unknown>) => Promise<unknown> }
  data: () => Record<string, unknown>
}

async function read(collectionName: string): Promise<Doc[]> {
  const query = userId
    ? db.collection(collectionName).where('userId', '==', userId)
    : db.collection(collectionName)
  return (await query.get()).docs as Doc[]
}

const [events, items, existingRaces] = await Promise.all([
  read('events'),
  read('bucketListItems'),
  read('races'),
])

/** Per user, because a race document belongs to one account. */
const raceIdByUserAndKey = new Map<string, string>()
for (const race of existingRaces) {
  const data = race.data()
  const key = courseKey(String(data.name ?? ''))
  if (!key) continue
  raceIdByUserAndKey.set(`${String(data.userId)}::${key}`, race.id)
}

let minted = 0
let linked = 0
let alreadyLinked = 0
let noName = 0

async function raceIdFor(
  ownerId: string,
  name: string,
  seed: Record<string, unknown>,
): Promise<string | null> {
  const key = courseKey(name)
  if (!key) return null

  const cacheKey = `${ownerId}::${key}`
  const known = raceIdByUserAndKey.get(cacheKey)
  if (known) return known

  if (dryRun) {
    // Reserve a placeholder so the preview counts one race per course, not one
    // per document.
    raceIdByUserAndKey.set(cacheKey, `would-create:${cacheKey}`)
    minted += 1
    return raceIdByUserAndKey.get(cacheKey)!
  }

  const created = await db.collection('races').add({
    userId: ownerId,
    name: name.trim(),
    location: String(seed.location ?? ''),
    locationLat: seed.locationLat ?? null,
    locationLng: seed.locationLng ?? null,
    locationGeocodeQuery: seed.locationGeocodeQuery ?? null,
    locationGeocodedAt: seed.locationGeocodedAt ?? null,
    catalogRaceId: null,
    officialUrl: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  raceIdByUserAndKey.set(cacheKey, created.id)
  minted += 1
  return created.id
}

/** Events first: they carry coordinates more often, so they seed a better race. */
for (const collectionDocs of [events, items]) {
  for (const document of collectionDocs) {
    const data = document.data()
    if (typeof data.raceId === 'string' && data.raceId) {
      alreadyLinked += 1
      continue
    }

    const name = String(data.name ?? '')
    const raceId = await raceIdFor(String(data.userId), name, data)
    if (!raceId) {
      noName += 1
      continue
    }

    if (dryRun) {
      console.log(`  would link ${document.id} -> ${raceId}`)
    } else {
      await document.ref.update({ raceId })
    }
    linked += 1
  }
}

console.log(
  `\nevents: ${events.length}, bucket list items: ${items.length}\n` +
    `  races ${dryRun ? 'that would be created' : 'created'}: ${minted}\n` +
    `  documents ${dryRun ? 'that would be linked' : 'linked'}: ${linked}\n` +
    `  already linked: ${alreadyLinked}\n` +
    `  skipped, no usable name: ${noName}`,
)
