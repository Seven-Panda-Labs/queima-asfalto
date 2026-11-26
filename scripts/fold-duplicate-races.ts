#!/usr/bin/env npx tsx
/**
 * Folds the races of one account that are the same catalog entry.
 *
 * Linking an event or a wish to the catalog used to stamp the entry on the
 * document's own race even when another race of the runner already carried
 * it, so one race became two: on the first account checked, six entries had
 * two races each, and an anchor set on one never reached the wish on the
 * other. Linking folds from now on; this does it for what is already split.
 *
 * Which race stays is `raceToKeep`, and the dry run says which.
 *
 * Needs the functions build (`npm --prefix functions run build`), which copies
 * the shared rule the fold uses.
 *
 * Scoped to one account. Pass --all-users to sweep every account on the
 * instance, which is a deliberate choice rather than the default.
 *
 * Against the emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run fold:races -- --confirm --user-id <uid>
 *
 * Against production, with Application Default Credentials:
 *   npm run fold:races -- --dry-run --all-users
 *   npm run fold:races -- --confirm --all-users
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { raceToKeep } from '../shared/domain/raceFold.js'
import { RACE_CATALOG_COLLECTION } from '../shared/raceCatalog/collection.js'
import { foldRaceInto } from '../functions/src/raceFold.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

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

type Snapshot = { docs: Array<{ id: string; data: () => Record<string, unknown> }> }
type LinkedRace = { id: string; userId: string; name: string; catalogRaceId: string; createdAt: Date }

async function read(collectionName: string): Promise<Snapshot> {
  const collection = db.collection(collectionName)
  return (userId ? collection.where('userId', '==', userId) : collection).get()
}

const [races, events, wishes, entries] = await Promise.all([
  read('races'),
  read('events'),
  read('bucketListItems'),
  read('raceEntries'),
])

function countByRace(snapshot: Snapshot): Map<string, number> {
  const counts = new Map<string, number>()
  for (const document of snapshot.docs) {
    const raceId = document.data().raceId
    if (typeof raceId === 'string') counts.set(raceId, (counts.get(raceId) ?? 0) + 1)
  }
  return counts
}

const eventCount = countByRace(events)
const wishCount = countByRace(wishes)
const entryCount = countByRace(entries)
const pointingAt = (race: LinkedRace) =>
  (eventCount.get(race.id) ?? 0) + (wishCount.get(race.id) ?? 0) + (entryCount.get(race.id) ?? 0)
const describe = (race: LinkedRace) =>
  `${race.id} "${race.name}": ${eventCount.get(race.id) ?? 0} events, ${wishCount.get(race.id) ?? 0} wishes, ${entryCount.get(race.id) ?? 0} entries`

/** Per account, because a race document belongs to one. */
const byEntry = new Map<string, LinkedRace[]>()
for (const document of races.docs) {
  const data = document.data()
  if (typeof data.catalogRaceId !== 'string' || !data.catalogRaceId) continue
  const race: LinkedRace = {
    id: document.id,
    userId: String(data.userId),
    name: String(data.name ?? ''),
    catalogRaceId: data.catalogRaceId,
    createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(0),
  }
  const key = `${race.userId}::${race.catalogRaceId}`
  byEntry.set(key, [...(byEntry.get(key) ?? []), race])
}

let folded = 0
for (const group of byEntry.values()) {
  if (group.length < 2) continue

  const entry = (await db.collection(RACE_CATALOG_COLLECTION).doc(group[0]!.catalogRaceId).get()).data()
  const keep = raceToKeep(group, entry?.name, pointingAt)
  console.log(`\n${group[0]!.catalogRaceId}, catalog name "${entry?.name ?? 'not found'}"`)
  console.log(`  keep ${describe(keep)}`)

  for (const race of group) {
    if (race === keep) continue
    console.log(`  fold ${describe(race)}`)
    // Both kept: a wish holds the runner's own notes, and deleting one is theirs to decide.
    if ((wishCount.get(race.id) ?? 0) > 0 && (wishCount.get(keep.id) ?? 0) > 0) {
      console.log('    both have a wish: the list will show the race twice until one is deleted')
    }
    if (!dryRun) await foldRaceInto(db, race.userId, race.id, keep.id)
    folded += 1
  }
}

console.log(`\nraces ${dryRun ? 'that would be folded' : 'folded'}: ${folded}`)
