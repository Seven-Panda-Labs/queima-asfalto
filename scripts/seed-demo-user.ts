/**
 * Seed fictional demo data for README screenshots and marketing.
 *
 * Every race is a catalog entry, read from the target project: the demo user
 * gets a race identity linked to it, the way discovery creates one, so the
 * catalog features (official site, next edition, entry prefill) all show. An
 * entry the target does not hold is skipped with a warning, never invented.
 * Seed the emulator's catalog first (`npm run seed:race-catalog`); it carries
 * only the bootstrap races, so a local demo is a partial one.
 *
 * Usage against production (needs Application Default Credentials or
 * GOOGLE_APPLICATION_CREDENTIALS with access to the queima-asfalto project):
 *   npm run seed:demo-user -- --dry-run
 *   npm run seed:demo-user -- --confirm
 *
 * Usage against the emulator, which needs no credentials:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-queima-asfalto \
 *     npm run seed:demo-user -- --confirm --user-id <uid>
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import {
  DEMO_BUCKET_LIST,
  DEMO_EVENTS,
  DEMO_GOALS,
  DEMO_PERFORMANCE_GOALS,
  DEMO_PROFILE,
  DEMO_USER_ID,
  type SeedBucketListItem,
  type SeedEvent,
  type SeedParkrunEvent,
  type SeedRaceEvent,
  type SeedGoal,
  type SeedPerformanceGoal,
} from './demo-user-data.js'
import { paceFromTime } from './demo-user-pace.js'
import type { RaceCatalogEntry } from '../shared/raceCatalog/types.js'

const require = createRequire(resolve(import.meta.dirname, '../functions/package.json'))
const { initializeApp, getApps } = require('firebase-admin/app')
const {
  FieldValue,
  Timestamp,
  getFirestore,
} = require('firebase-admin/firestore')

type Firestore = ReturnType<typeof getFirestore>
type Query = FirebaseFirestore.Query
type DocumentReference = FirebaseFirestore.DocumentReference
type WriteBatch = FirebaseFirestore.WriteBatch

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'queima-asfalto'
const BATCH_LIMIT = 450

type CliOptions = {
  userId: string
  dryRun: boolean
  confirm: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    userId: DEMO_USER_ID,
    dryRun: false,
    confirm: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--confirm') {
      options.confirm = true
    } else if (arg === '--user-id') {
      const value = argv[index + 1]
      if (!value) throw new Error('--user-id requires a value')
      options.userId = value
      index += 1
    }
  }

  return options
}

function initFirestore(): Firestore {
  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID })
  }
  return getFirestore()
}

async function commitBatch(batch: WriteBatch): Promise<void> {
  await batch.commit()
}

async function deleteCollection(
  db: Firestore,
  collectionPath: string,
  dryRun: boolean,
): Promise<number> {
  let deleted = 0

  while (true) {
    const snapshot = await db.collection(collectionPath).limit(BATCH_LIMIT).get()
    if (snapshot.empty) break

    if (dryRun) {
      deleted += snapshot.size
      if (snapshot.size < BATCH_LIMIT) break
      continue
    }

    const batch = db.batch()
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref)
    }
    await commitBatch(batch)
    deleted += snapshot.size
  }

  return deleted
}

async function deleteQuery(
  db: Firestore,
  query: Query,
  dryRun: boolean,
  beforeDelete?: (ref: DocumentReference) => Promise<void>,
): Promise<number> {
  if (dryRun) {
    const snapshot = await query.get()
    for (const doc of snapshot.docs) {
      if (beforeDelete) await beforeDelete(doc.ref)
    }
    return snapshot.size
  }

  let deleted = 0

  while (true) {
    const snapshot = await query.limit(BATCH_LIMIT).get()
    if (snapshot.empty) break

    const batch = db.batch()
    for (const doc of snapshot.docs) {
      if (beforeDelete) await beforeDelete(doc.ref)
      batch.delete(doc.ref)
    }
    await commitBatch(batch)
    deleted += snapshot.size
  }

  return deleted
}

async function deleteUserData(db: Firestore, userId: string, dryRun: boolean): Promise<void> {
  const counts: Record<string, number> = {}

  counts.events = await deleteQuery(
    db,
    db.collection('events').where('userId', '==', userId),
    dryRun,
    async (eventRef) => {
      await deleteCollection(db, eventRef.collection('media').path, dryRun)
    },
  )

  counts.races = await deleteQuery(
    db,
    db.collection('races').where('userId', '==', userId),
    dryRun,
  )

  counts.goals = await deleteQuery(
    db,
    db.collection('goals').where('userId', '==', userId),
    dryRun,
  )

  counts.performanceGoals = await deleteQuery(
    db,
    db.collection('performanceGoals').where('userId', '==', userId),
    dryRun,
  )

  counts.bucketListItems = await deleteQuery(
    db,
    db.collection('bucketListItems').where('userId', '==', userId),
    dryRun,
  )

  counts.sharesOwned = await deleteQuery(
    db,
    db.collection('shares').where('ownerId', '==', userId),
    dryRun,
  )

  counts.sharesGranted = await deleteQuery(
    db,
    db.collection('shares').where('granteeId', '==', userId),
    dryRun,
  )

  counts.reminderDispatches = await deleteCollection(
    db,
    `users/${userId}/reminderDispatches`,
    dryRun,
  )

  console.log('Deleted documents:', counts)
}

/**
 * The catalog entries the demo names, keyed by the id it names them by.
 *
 * A merged copy is replaced by the entry it was folded into, which holds the
 * site and the editions now, and a retired entry counts as missing.
 */
async function loadCatalogEntries(
  db: Firestore,
  ids: readonly string[],
): Promise<Map<string, RaceCatalogEntry>> {
  const entries = new Map<string, RaceCatalogEntry>()
  for (const id of new Set(ids)) {
    let snapshot = await db.collection('raceCatalog').doc(id).get()
    let entry = snapshot.data() as RaceCatalogEntry | undefined
    if (entry?.duplicateOfCatalogRaceId) {
      snapshot = await db.collection('raceCatalog').doc(entry.duplicateOfCatalogRaceId).get()
      entry = snapshot.data() as RaceCatalogEntry | undefined
    }
    if (entry && entry.retired !== true) entries.set(id, { ...entry, id: snapshot.id })
  }
  return entries
}

/** The same fields `findOrCreateCatalogRaceId` writes when a runner adds a race. */
function raceToFirestore(userId: string, entry: RaceCatalogEntry, now: Timestamp) {
  const hasPlace = entry.latitude != null && entry.longitude != null
  return {
    userId,
    name: entry.name,
    location: [entry.city, entry.country].filter(Boolean).join(', '),
    locationLat: entry.latitude ?? null,
    locationLng: entry.longitude ?? null,
    locationGeocodeQuery: null,
    locationGeocodedAt: hasPlace ? now : null,
    catalogRaceId: entry.id,
    officialUrl: entry.officialUrl ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

function isParkrun(event: SeedEvent): event is SeedParkrunEvent {
  return 'parkrunEventSlug' in event
}

type RaceRef = { id: string; entry: RaceCatalogEntry }

/** Where the event is: the parkrun's own fields, or the race it is a running of. */
function eventPlace(event: SeedEvent, race: RaceRef | undefined) {
  if (isParkrun(event)) {
    return {
      name: event.name,
      location: event.location,
      locationLat: event.locationLat,
      locationLng: event.locationLng,
      raceId: null,
      parkrunEventSlug: event.parkrunEventSlug,
      parkrunCountryUrl: event.parkrunCountryUrl,
    }
  }
  const entry = race!.entry
  return {
    name: entry.name,
    location: [entry.city, entry.country].filter(Boolean).join(', '),
    locationLat: entry.latitude ?? null,
    locationLng: entry.longitude ?? null,
    raceId: race!.id,
    parkrunEventSlug: null,
    parkrunCountryUrl: null,
  }
}

function eventToFirestore(
  userId: string,
  event: SeedEvent,
  race: RaceRef | undefined,
  now: Timestamp,
) {
  const date = Timestamp.fromDate(new Date(`${event.date}T09:00:00+00:00`))
  const pace = event.time ? paceFromTime(event.time, event.realDistance) : null
  const place = eventPlace(event, race)
  const hasPlace = place.locationLat != null && place.locationLng != null

  return {
    userId,
    name: place.name,
    date,
    realDistance: event.realDistance,
    eventType: event.eventType,
    location: place.location,
    locationLat: place.locationLat,
    locationLng: place.locationLng,
    locationGeocodeQuery: null,
    locationGeocodedAt: hasPlace ? now : null,
    status: event.status,
    emoji: event.emoji ?? null,
    notes: event.notes ?? null,
    time: event.time ?? null,
    pace,
    classification: event.classification ?? null,
    resultsUrl: null,
    resultsPlatform: event.resultsPlatform ?? null,
    parkrunEventSlug: place.parkrunEventSlug,
    parkrunCountryUrl: place.parkrunCountryUrl,
    resultsVerified: event.resultsVerified ?? null,
    raceId: place.raceId,
    createdAt: now,
    updatedAt: now,
  }
}

function goalToFirestore(userId: string, goal: SeedGoal, now: Timestamp) {
  return {
    userId,
    eventType: goal.eventType,
    targetCount: goal.targetCount,
    year: goal.year,
    emoji: goal.emoji ?? null,
    notes: goal.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

function performanceGoalToFirestore(userId: string, goal: SeedPerformanceGoal, now: Timestamp) {
  return {
    userId,
    type: goal.type,
    eventType: goal.eventType,
    year: goal.year,
    targetPace: goal.type === 'pace_target' ? (goal.targetPace ?? null) : null,
    targetTime: goal.type === 'time_target' ? (goal.targetTime ?? null) : null,
    emoji: goal.emoji ?? null,
    notes: goal.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

function bucketListToFirestore(
  userId: string,
  item: SeedBucketListItem,
  raceId: string,
  now: Timestamp,
) {
  return {
    userId,
    raceId,
    notes: item.notes ?? null,
    recurring: item.recurring ?? false,
    createdAt: now,
    updatedAt: now,
  }
}

async function seedUserData(db: Firestore, userId: string, dryRun: boolean): Promise<void> {
  const now = Timestamp.now()
  const writes: Array<{ ref: DocumentReference; collection: string; data: Record<string, unknown> }> = []
  const write = (collection: string, data: Record<string, unknown>, ref = db.collection(collection).doc()) =>
    writes.push({ ref, collection, data })

  const raceEvents = DEMO_EVENTS.filter((event): event is SeedRaceEvent => !isParkrun(event))
  const wantedIds = [
    ...raceEvents.map((event) => event.catalogRaceId),
    ...DEMO_BUCKET_LIST.map((item) => item.catalogRaceId),
  ]
  const entries = await loadCatalogEntries(db, wantedIds)
  const missing = [...new Set(wantedIds.filter((id) => !entries.has(id)))]

  // One race per catalog entry, however many ids or runnings point at it.
  const races = new Map<string, RaceRef>()
  function raceFor(catalogRaceId: string): RaceRef | undefined {
    const entry = entries.get(catalogRaceId)
    if (!entry) return undefined
    let race = races.get(entry.id)
    if (!race) {
      const ref = db.collection('races').doc()
      race = { id: ref.id, entry }
      races.set(entry.id, race)
      write('races', raceToFirestore(userId, entry, now), ref)
    }
    return race
  }

  for (const event of DEMO_EVENTS) {
    const race = isParkrun(event) ? undefined : raceFor(event.catalogRaceId)
    if (!isParkrun(event) && !race) continue
    write('events', eventToFirestore(userId, event, race, now))
  }
  for (const goal of DEMO_GOALS) {
    write('goals', goalToFirestore(userId, goal, now))
  }
  for (const goal of DEMO_PERFORMANCE_GOALS) {
    write('performanceGoals', performanceGoalToFirestore(userId, goal, now))
  }
  for (const item of DEMO_BUCKET_LIST) {
    const race = raceFor(item.catalogRaceId)
    if (race) write('bucketListItems', bucketListToFirestore(userId, item, race.id, now))
  }

  if (missing.length > 0) {
    console.warn(
      `Skipped what points at ${missing.length} catalog entries this project does not hold: ` +
        missing.join(', '),
    )
  }

  console.log(
    `Seeding ${writes.filter((w) => w.collection === 'races').length} races, ` +
      `${writes.filter((w) => w.collection === 'events').length} events, ` +
      `${writes.filter((w) => w.collection === 'goals').length} goals, ` +
      `${writes.filter((w) => w.collection === 'performanceGoals').length} performance goals, ` +
      `${writes.filter((w) => w.collection === 'bucketListItems').length} bucket list items`,
  )

  if (dryRun) return

  let batch = db.batch()
  let batchSize = 0

  for (const { ref, data } of writes) {
    batch.set(ref, data)
    batchSize += 1

    if (batchSize >= BATCH_LIMIT) {
      await commitBatch(batch)
      batch = db.batch()
      batchSize = 0
    }
  }

  if (batchSize > 0) {
    await commitBatch(batch)
  }
}

async function updateUserProfile(db: Firestore, userId: string, dryRun: boolean): Promise<void> {
  const userRef = db.collection('users').doc(userId)
  const snapshot = await userRef.get()

  if (!snapshot.exists) {
    console.warn(`User document users/${userId} does not exist, creating profile shell.`)
  }

  const update = {
    ...DEMO_PROFILE,
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (dryRun) {
    console.log('Would update user profile:', update)
    return
  }

  await userRef.set(update, { merge: true })
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))

  // Seeding the emulator is the safe case and the useful one, for screenshots
  // and for looking at a full season locally. Seeding production is the one
  // worth guarding, so the emulator is allowed only for a demo project id,
  // which is the convention Firebase itself uses for emulator-only projects.
  if (process.env.FIRESTORE_EMULATOR_HOST && !PROJECT_ID.startsWith('demo-')) {
    throw new Error(
      `FIRESTORE_EMULATOR_HOST is set but the project is "${PROJECT_ID}". ` +
        'Set GCLOUD_PROJECT to your demo- project to seed the emulator, or unset ' +
        'FIRESTORE_EMULATOR_HOST to seed production.',
    )
  }

  if (!options.dryRun && !options.confirm) {
    console.error('Refusing to modify Firestore without --confirm (or use --dry-run).')
    process.exit(1)
  }

  const db = initFirestore()

  console.log(`Target project: ${PROJECT_ID}`)
  console.log(`Target user: ${options.userId}`)
  console.log(options.dryRun ? 'Mode: dry-run' : 'Mode: write')

  await deleteUserData(db, options.userId, options.dryRun)
  await seedUserData(db, options.userId, options.dryRun)
  await updateUserProfile(db, options.userId, options.dryRun)

  console.log(options.dryRun ? 'Dry-run complete.' : 'Demo user seeded successfully.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
