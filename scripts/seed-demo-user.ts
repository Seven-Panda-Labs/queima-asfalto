/**
 * Seed fictional demo data for README screenshots and marketing.
 *
 * Usage:
 *   npm run seed:demo-user -- --dry-run
 *   npm run seed:demo-user -- --confirm
 *
 * Requires Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS
 * with access to the queima-asfalto Firestore project.
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
  type SeedGoal,
  type SeedPerformanceGoal,
} from './demo-user-data.js'
import { paceFromTime } from './demo-user-pace.js'

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

function eventToFirestore(userId: string, event: SeedEvent, now: Timestamp) {
  const date = Timestamp.fromDate(new Date(`${event.date}T09:00:00+00:00`))
  const pace = event.time ? paceFromTime(event.time, event.realDistance) : null

  return {
    userId,
    name: event.name,
    date,
    realDistance: event.realDistance,
    eventType: event.eventType,
    location: event.location,
    locationLat: event.locationLat ?? null,
    locationLng: event.locationLng ?? null,
    locationGeocodeQuery: event.locationLat != null ? `${event.location}, Portugal` : null,
    locationGeocodedAt: event.locationLat != null ? now : null,
    status: event.status,
    emoji: event.emoji ?? null,
    notes: event.notes ?? null,
    time: event.time ?? null,
    pace,
    classification: event.classification ?? null,
    resultsUrl: null,
    resultsPlatform: event.resultsPlatform ?? null,
    parkrunEventSlug: event.parkrunEventSlug ?? null,
    parkrunCountryUrl: event.parkrunCountryUrl ?? null,
    resultsVerified: event.resultsVerified ?? null,
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

function bucketListToFirestore(userId: string, item: SeedBucketListItem, now: Timestamp) {
  return {
    userId,
    name: item.name,
    location: item.location,
    realDistance: item.realDistance,
    disciplines: item.disciplines,
    targetMonth: item.targetMonth ?? null,
    link: item.link ?? null,
    emoji: item.emoji ?? null,
    notes: item.notes ?? null,
    locationLat: item.locationLat ?? null,
    locationLng: item.locationLng ?? null,
    locationGeocodeQuery: item.locationLat != null ? item.location : null,
    locationGeocodedAt: item.locationLat != null ? now : null,
    createdAt: now,
    updatedAt: now,
  }
}

async function seedUserData(db: Firestore, userId: string, dryRun: boolean): Promise<void> {
  const now = Timestamp.now()
  const writes: Array<{ collection: string; data: Record<string, unknown> }> = []

  for (const event of DEMO_EVENTS) {
    writes.push({ collection: 'events', data: eventToFirestore(userId, event, now) })
  }
  for (const goal of DEMO_GOALS) {
    writes.push({ collection: 'goals', data: goalToFirestore(userId, goal, now) })
  }
  for (const goal of DEMO_PERFORMANCE_GOALS) {
    writes.push({
      collection: 'performanceGoals',
      data: performanceGoalToFirestore(userId, goal, now),
    })
  }
  for (const item of DEMO_BUCKET_LIST) {
    writes.push({
      collection: 'bucketListItems',
      data: bucketListToFirestore(userId, item, now),
    })
  }

  console.log(
    `Seeding ${writes.filter((w) => w.collection === 'events').length} events, ` +
      `${writes.filter((w) => w.collection === 'goals').length} goals, ` +
      `${writes.filter((w) => w.collection === 'performanceGoals').length} performance goals, ` +
      `${writes.filter((w) => w.collection === 'bucketListItems').length} bucket list items`,
  )

  if (dryRun) return

  let batch = db.batch()
  let batchSize = 0

  for (const write of writes) {
    const ref = db.collection(write.collection).doc()
    batch.set(ref, write.data)
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
    console.warn(`User document users/${userId} does not exist — creating profile shell.`)
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

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST is set. Unset it to seed production demo data, or use the emulator project explicitly.',
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
