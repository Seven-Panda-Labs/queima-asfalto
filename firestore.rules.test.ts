import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { Timestamp } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { DEFAULT_SHARE_PERMISSIONS } from './shared/shares/types.js'

const PROJECT_ID = 'queima-asfalto-rules-test'
const RULES_PATH = resolve(import.meta.dirname, 'firestore.rules')

function firestoreRulesConfig() {
  const hostEnv = process.env.FIRESTORE_EMULATOR_HOST
  const [host, port] = hostEnv?.split(':') ?? ['127.0.0.1', '8080']

  return {
    rules: readFileSync(RULES_PATH, 'utf8'),
    host,
    port: Number(port),
  }
}

let testEnv: RulesTestEnvironment

function mediaStoragePath(
  userId: string,
  eventId: string,
  mediaId: string,
  extension = 'jpg',
): string {
  return `users/${userId}/events/${eventId}/media/${mediaId}.${extension}`
}

function mediaDownloadUrl(
  userId: string,
  eventId: string,
  mediaId: string,
  extension = 'jpg',
): string {
  const encoded = `users%2F${userId}%2Fevents%2F${eventId}%2Fmedia%2F${mediaId}.${extension}`
  return `https://firebasestorage.googleapis.com/v0/b/demo-test.appspot.com/o/${encoded}?alt=media&token=test-token`
}

function trackStoragePath(
  userId: string,
  eventId: string,
  trackId: string,
  extension = 'gpx',
): string {
  return `users/${userId}/events/${eventId}/track/${trackId}.${extension}`
}

function trackDownloadUrl(
  userId: string,
  eventId: string,
  trackId: string,
  extension = 'gpx',
): string {
  const encoded = `users%2F${userId}%2Fevents%2F${eventId}%2Ftrack%2F${trackId}.${extension}`
  return `https://firebasestorage.googleapis.com/v0/b/demo-test.appspot.com/o/${encoded}?alt=media&token=test-token`
}

function validTrackPayload(
  userId: string,
  eventId: string,
  trackId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    userId,
    format: 'gpx',
    storagePath: trackStoragePath(userId, eventId, trackId),
    downloadUrl: trackDownloadUrl(userId, eventId, trackId),
    sizeBytes: 160734,
    fileName: 'sample-parkrun.GPX',
    startedAt: Timestamp.fromDate(new Date('2026-08-29T07:03:42.086Z')),
    elapsedSeconds: 1580,
    movingSeconds: 1579,
    distanceMeters: 4954,
    distanceSource: 'computed',
    averagePaceSecondsPerKm: 318.9,
    elevationGainMeters: 93,
    elevationLossMeters: 93,
    splits: [{ index: 1, distanceMeters: 1000, durationSeconds: 307, paceSecondsPerKm: 307, partial: false }],
    heartRate: null,
    route: [{ lat: 52.34235667, lon: 12.99992 }],
    profile: [{ distanceMeters: 101, elevationMeters: 40.2, paceSecondsPerKm: 307 }],
    ...overrides,
  }
}

function validMediaPayload(
  userId: string,
  eventId: string,
  mediaId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    userId,
    type: 'photo',
    storagePath: mediaStoragePath(userId, eventId, mediaId),
    downloadUrl: mediaDownloadUrl(userId, eventId, mediaId),
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    ...overrides,
  }
}

function validEventPayload(userId: string, overrides: Record<string, unknown> = {}) {
  return {
    userId,
    name: 'Test Event',
    date: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
    realDistance: 10,
    eventType: 'km_10',
    location: 'Lisbon',
    status: 'planned',
    ...overrides,
  }
}

function validGoalPayload(userId: string, overrides: Record<string, unknown> = {}) {
  return {
    userId,
    eventType: 'km_10',
    targetCount: 3,
    year: 2026,
    ...overrides,
  }
}

function validPerformanceGoalPayload(userId: string, overrides: Record<string, unknown> = {}) {
  return {
    userId,
    type: 'pace_target',
    eventType: 'km_10',
    year: 2026,
    targetPace: '5:00',
    ...overrides,
  }
}

function validRacePayload(userId: string, overrides: Record<string, unknown> = {}) {
  return {
    userId,
    name: 'Maratona do Porto',
    location: 'Porto',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function validBucketListPayload(userId: string, overrides: Record<string, unknown> = {}) {
  return {
    userId,
    name: 'Bucket item',
    location: 'Porto',
    realDistance: 21.1,
    disciplines: ['km_21_1'],
    ...overrides,
  }
}

function validSharePayload(overrides: Record<string, unknown> = {}) {
  const now = Timestamp.fromDate(new Date('2026-06-01T12:00:00Z'))
  return {
    ownerId: 'user-alice',
    granteeEmail: 'bob@example.com',
    status: 'active',
    granteeId: 'user-bob',
    permissions: DEFAULT_SHARE_PERMISSIONS,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

async function seedEvent(userId: string, eventId: string, data: Record<string, unknown> = {}): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .collection('events')
      .doc(eventId)
      .set(validEventPayload(userId, data))
  })
}

async function seedDocument(path: string, data: Record<string, unknown>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(path).set(data)
  })
}

describe('firestore.rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: firestoreRulesConfig(),
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  describe('authentication', () => {
    it('denies unauthenticated reads on events', async () => {
      await seedEvent('user-alice', 'event-1')
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(db.collection('events').doc('event-1').get())
    })
  })

  describe('users', () => {
    it('allows owners to read and write their profile', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db.doc(`users/${userId}`).set({
          displayName: 'Alice',
        }),
      )
      await assertSucceeds(db.doc(`users/${userId}`).get())
    })

    it('denies access to another user profile', async () => {
      await seedDocument('users/user-alice', { displayName: 'Alice' })
      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(db.doc('users/user-alice').get())
      await assertFails(db.doc('users/user-alice').set({ displayName: 'Hacked' }))
    })

    it('denies a client from making itself an admin, on create or on update', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(db.doc(`users/${userId}`).set({ name: 'Alice', admin: true }))

      await assertSucceeds(db.doc(`users/${userId}`).set({ name: 'Alice' }))
      await assertFails(db.doc(`users/${userId}`).update({ admin: true }))
    })

    it('lets an admin keep its flag while editing its own profile', async () => {
      await seedDocument('users/user-admin', { name: 'Admin', admin: true })
      const db = testEnv.authenticatedContext('user-admin').firestore()

      await assertSucceeds(db.doc('users/user-admin').update({ name: 'Operator' }))
      // Taking the flag off is a write to it, and the client cannot make one.
      await assertFails(db.doc('users/user-admin').update({ admin: false }))
    })

    it('denies clients from setting accountStatus on create', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(
        db.doc(`users/${userId}`).set({
          name: 'Alice',
          accountStatus: 'approved',
        }),
      )
    })
  })

  describe('account approval', () => {
    it('denies pending users from creating events', async () => {
      const userId = 'user-pending'
      await seedDocument(`users/${userId}`, {
        name: 'Pending',
        accountStatus: 'pending',
      })

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(db.collection('events').doc('event-1').set(validEventPayload(userId)))
    })

    it('allows approved users to create events', async () => {
      const userId = 'user-approved'
      await seedDocument(`users/${userId}`, {
        name: 'Approved',
        accountStatus: 'approved',
      })

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(db.collection('events').doc('event-1').set(validEventPayload(userId)))
    })

    it('allows pending users to update their profile without accountStatus', async () => {
      const userId = 'user-pending'
      await seedDocument(`users/${userId}`, {
        name: 'Pending',
        accountStatus: 'pending',
      })

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.doc(`users/${userId}`).update({
          appLanguage: 'pt',
        }),
      )
    })

    it('denies stripping accountStatus with a full profile overwrite', async () => {
      const userId = 'user-pending'
      await seedDocument(`users/${userId}`, {
        name: 'Pending',
        email: 'pending@example.com',
        accountStatus: 'pending',
      })

      const db = testEnv.authenticatedContext(userId).firestore()

      // A set() without merge simply omits accountStatus. Allowing it would let
      // the user inherit the "approved" default in userAccountStatus().
      await assertFails(db.doc(`users/${userId}`).set({ name: 'Pending' }))
      await assertFails(db.doc(`users/${userId}`).update({ accountStatus: null }))
      await assertFails(db.collection('events').doc('event-1').set(validEventPayload(userId)))
    })

    it('denies a rejected user from clearing their rejection', async () => {
      const userId = 'user-rejected'
      await seedDocument(`users/${userId}`, {
        name: 'Rejected',
        accountStatus: 'rejected',
        rejectedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      })

      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(db.doc(`users/${userId}`).set({ name: 'Rejected' }))
      await assertFails(db.doc(`users/${userId}`).update({ rejectedAt: null }))
      await assertFails(
        db.doc(`users/${userId}`).update({ accountStatus: 'approved' }),
      )
      await assertFails(db.collection('events').doc('event-1').set(validEventPayload(userId)))
    })

    it('allows profile updates once the server has written the approval fields', async () => {
      const userId = 'user-approved'
      await seedDocument(`users/${userId}`, {
        name: 'Approved',
        accountStatus: 'approved',
        approvedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
        approvedBy: 'admin@example.com',
      })

      const db = testEnv.authenticatedContext(userId).firestore()

      // On an update request.resource.data is the post-merge document, so a
      // presence check on approvedAt would deny every one of these.
      await assertSucceeds(db.doc(`users/${userId}`).set({ appLanguage: 'pt' }, { merge: true }))
      await assertSucceeds(
        db.doc(`users/${userId}`).set(
          { notificationsEnabled: true, reminderDaysBefore: 3, reminderTime: '08:00' },
          { merge: true },
        ),
      )
      await assertSucceeds(
        db.doc(`users/${userId}`).set({ resultFirstName: 'Zé' }, { merge: true }),
      )
      await assertSucceeds(db.doc(`users/${userId}`).update({ appLanguage: 'en' }))
    })

    it('denies changing or forging the approval fields on an approved profile', async () => {
      const userId = 'user-approved'
      await seedDocument(`users/${userId}`, {
        name: 'Approved',
        accountStatus: 'approved',
        approvedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
        approvedBy: 'admin@example.com',
      })

      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(
        db.doc(`users/${userId}`).update({
          approvedAt: Timestamp.fromDate(new Date('2026-02-02T00:00:00Z')),
        }),
      )
      await assertFails(db.doc(`users/${userId}`).update({ approvedBy: 'me@example.com' }))
      await assertFails(db.doc(`users/${userId}`).update({ approvedAt: null }))
      await assertFails(db.doc(`users/${userId}`).set({ name: 'Approved' }))
    })

    it('denies adding approval fields to a profile that has none', async () => {
      const userId = 'user-plain'
      await seedDocument(`users/${userId}`, { name: 'Plain' })

      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(db.doc(`users/${userId}`).set({ appLanguage: 'pt' }, { merge: true }))
      await assertFails(db.doc(`users/${userId}`).update({ accountStatus: 'approved' }))
      await assertFails(
        db.doc(`users/${userId}`).update({
          approvedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
        }),
      )
      await assertFails(db.doc(`users/${userId}`).update({ approvedBy: 'me@example.com' }))
    })
  })

  describe('events', () => {
    it('allows owners to create valid events', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db.collection('events').doc('event-1').set(validEventPayload(userId)),
      )
    })

    it('rejects create when userId does not match auth', async () => {
      const db = testEnv.authenticatedContext('user-alice').firestore()
      await assertFails(
        db.collection('events').doc('event-1').set(validEventPayload('user-bob')),
      )
    })

    it('rejects create with invalid resultsPlatform', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db
          .collection('events')
          .doc('event-1')
          .set(validEventPayload(userId, { resultsPlatform: 'unknown-platform' })),
      )
    })

    it('allows create with a supported resultsPlatform', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('events').doc('event-1').set(
          validEventPayload(userId, {
            resultsPlatform: 'eqtiming',
            resultsUrl: 'https://live.eqtiming.com/62417',
          }),
        ),
      )
    })

    it('denies other users from reading, updating, or deleting events', async () => {
      const ownerId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(ownerId, eventId)

      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(db.collection('events').doc(eventId).get())
      await assertFails(
        db.collection('events').doc(eventId).update({
          name: 'Stolen',
          date: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
          realDistance: 10,
          eventType: 'km_10',
          location: 'Lisbon',
          status: 'planned',
          userId: ownerId,
        }),
      )
      await assertFails(db.collection('events').doc(eventId).delete())
    })

    it('rejects update that changes userId', async () => {
      const ownerId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(ownerId, eventId)

      const db = testEnv.authenticatedContext(ownerId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).update({
          userId: 'user-bob',
          name: 'Test Event',
          date: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
          realDistance: 10,
          eventType: 'km_10',
          location: 'Lisbon',
          status: 'planned',
        }),
      )
    })

    it('allows owners to update results fields', async () => {
      const ownerId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(ownerId, eventId)

      const db = testEnv.authenticatedContext(ownerId).firestore()
      await assertSucceeds(
        db.collection('events').doc(eventId).update({
          userId: ownerId,
          name: 'Test Event',
          date: Timestamp.fromDate(new Date('2026-06-01T09:00:00Z')),
          realDistance: 10,
          eventType: 'km_10',
          location: 'Lisbon',
          status: 'completed',
          time: '00:52:30',
          resultsVerified: true,
        }),
      )
    })
  })

  describe('goals', () => {
    it('allows owners to create and read goals', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(db.collection('goals').doc('goal-1').set(validGoalPayload(userId)))
      await assertSucceeds(db.collection('goals').doc('goal-1').get())
    })

    it('denies other users from reading goals', async () => {
      await seedDocument('goals/goal-1', validGoalPayload('user-alice'))
      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(db.collection('goals').doc('goal-1').get())
    })
  })

  describe('performanceGoals', () => {
    it('allows owners to create a valid pace target goal', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('performanceGoals').doc('pg-1').set(validPerformanceGoalPayload(userId)),
      )
    })

    it('rejects pace_target create without targetPace', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()
      const { targetPace: _targetPace, ...payload } = validPerformanceGoalPayload(userId)
      await assertFails(db.collection('performanceGoals').doc('pg-1').set(payload))
    })

    it('denies other users from reading performance goals', async () => {
      await seedDocument('performanceGoals/pg-1', validPerformanceGoalPayload('user-alice'))
      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(db.collection('performanceGoals').doc('pg-1').get())
    })
  })

  describe('bucketListItems', () => {
    it('accepts a bucket list item with six disciplines and rejects seven', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('bucketListItems')
          .doc('item-six')
          .set(
            validBucketListPayload(userId, {
              disciplines: ['m_1500', 'm_3000', 'km_5', 'km_10', 'km_15', 'mi_10'],
            }),
          ),
      )

      await assertFails(
        db
          .collection('bucketListItems')
          .doc('item-seven')
          .set(
            validBucketListPayload(userId, {
              disciplines: ['m_1500', 'm_3000', 'km_5', 'km_10', 'km_15', 'mi_10', 'km_21_1'],
            }),
          ),
      )
    })

    it('accepts a raceId on an item and rejects one that is not a string', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('bucketListItems')
          .doc('item-linked')
          .set(validBucketListPayload(userId, { raceId: 'race-1' })),
      )
      await assertFails(
        db
          .collection('bucketListItems')
          .doc('item-bad-race')
          .set(validBucketListPayload(userId, { raceId: 42 })),
      )
    })

    it('allows owners to create bucket list items', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('bucketListItems').doc('item-1').set(validBucketListPayload(userId)),
      )
    })

    it('denies other users from reading bucket list items', async () => {
      await seedDocument('bucketListItems/item-1', validBucketListPayload('user-alice'))
      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(db.collection('bucketListItems').doc('item-1').get())
    })
  })

  describe('races', () => {
    it('allows owners to create, update and delete a race', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()
      const ref = db.collection('races').doc('race-1')

      await assertSucceeds(ref.set(validRacePayload(userId)))
      await assertSucceeds(
        ref.set(validRacePayload(userId, { name: 'Maratona do Porto EDP' })),
      )
      await assertSucceeds(ref.delete())
    })

    it('accepts the optional catalog pointer and official url', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('races')
          .doc('race-catalog')
          .set(
            validRacePayload(userId, {
              catalogRaceId: 'berlin-marathon',
              officialUrl: 'https://example.test/berlin',
              locationLat: 52.5,
              locationLng: 13.4,
            }),
          ),
      )
    })

    it('rejects a race with no name', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(
        db.collection('races').doc('race-empty').set(validRacePayload(userId, { name: '' })),
      )
    })

    it('rejects a race written for another user', async () => {
      const db = testEnv.authenticatedContext('user-bob').firestore()

      await assertFails(
        db.collection('races').doc('race-foreign').set(validRacePayload('user-alice')),
      )
    })

    it('denies other users from reading a race', async () => {
      await seedDocument('races/race-1', validRacePayload('user-alice'))
      const db = testEnv.authenticatedContext('user-bob').firestore()

      await assertFails(db.collection('races').doc('race-1').get())
    })

    it('denies a pending account', async () => {
      await seedDocument('users/user-pending', { accountStatus: 'pending' })
      const db = testEnv.authenticatedContext('user-pending').firestore()

      await assertFails(
        db.collection('races').doc('race-pending').set(validRacePayload('user-pending')),
      )
    })
  })

  describe('shares', () => {
    it('allows the owner to read a share document', async () => {
      await seedDocument('shares/share-1', validSharePayload())
      const db = testEnv.authenticatedContext('user-alice').firestore()
      await assertSucceeds(db.collection('shares').doc('share-1').get())
    })

    it('allows the grantee to read an active share', async () => {
      await seedDocument('shares/share-1', validSharePayload())
      const db = testEnv.authenticatedContext('user-bob', { email: 'bob@example.com' }).firestore()
      await assertSucceeds(db.collection('shares').doc('share-1').get())
    })

    it('allows a pending invitee to read when granteeEmail matches auth email', async () => {
      const { granteeId: _granteeId, ...pendingShare } = validSharePayload({
        status: 'pending',
      })
      await seedDocument('shares/share-1', pendingShare)
      const db = testEnv.authenticatedContext('user-bob', { email: 'bob@example.com' }).firestore()
      await assertSucceeds(db.collection('shares').doc('share-1').get())
    })

    it('denies unrelated users from reading shares', async () => {
      await seedDocument('shares/share-1', validSharePayload())
      const db = testEnv.authenticatedContext('user-carol', { email: 'carol@example.com' }).firestore()
      await assertFails(db.collection('shares').doc('share-1').get())
    })

    it('denies client create, update, and delete on shares', async () => {
      const db = testEnv.authenticatedContext('user-alice').firestore()
      await assertFails(db.collection('shares').doc('share-1').set(validSharePayload()))
      await seedDocument('shares/share-1', validSharePayload())
      await assertFails(db.collection('shares').doc('share-1').update({ status: 'revoked' }))
      await assertFails(db.collection('shares').doc('share-1').delete())
    })
  })

  // Cada página da app lê estas coleções com uma query por userId. Só as
  // regras de `shares` tinham cobertura de `list`; as restantes eram testadas
  // apenas com `.doc().get()`, que percorre um caminho diferente das regras.
  describe('list queries the app actually issues', () => {
    const owner = 'user-alice'
    const stranger = 'user-bob'

    const COLLECTIONS: Array<{
      name: string
      payload: (userId: string) => Record<string, unknown>
    }> = [
      { name: 'events', payload: validEventPayload },
      { name: 'goals', payload: validGoalPayload },
      { name: 'performanceGoals', payload: validPerformanceGoalPayload },
      { name: 'bucketListItems', payload: validBucketListPayload },
    ]

    for (const { name, payload } of COLLECTIONS) {
      describe(name, () => {
        it('allows the owner to list their own documents', async () => {
          await seedDocument(`${name}/doc-1`, payload(owner))
          const db = testEnv.authenticatedContext(owner).firestore()

          await assertSucceeds(db.collection(name).where('userId', '==', owner).get())
        })

        it('allows the same query when the collection is empty', async () => {
          const db = testEnv.authenticatedContext(owner).firestore()

          await assertSucceeds(db.collection(name).where('userId', '==', owner).get())
        })

        it('denies an unfiltered listing', async () => {
          await seedDocument(`${name}/doc-1`, payload(owner))
          const db = testEnv.authenticatedContext(owner).firestore()

          await assertFails(db.collection(name).get())
        })

        it('denies listing another user documents', async () => {
          await seedDocument(`${name}/doc-1`, payload(owner))
          const db = testEnv.authenticatedContext(stranger).firestore()

          await assertFails(db.collection(name).where('userId', '==', owner).get())
        })

        it('denies an anonymous listing', async () => {
          const db = testEnv.unauthenticatedContext().firestore()

          await assertFails(db.collection(name).where('userId', '==', owner).get())
        })
      })
    }
  })

  describe('raceCatalog', () => {
    const race = { id: 'berlin-marathon', name: 'Berlin Marathon', country: 'DE', city: 'Berlin' }

    it('lets any signed-in account read it, pending included', async () => {
      await seedDocument('raceCatalog/berlin-marathon', race)
      await seedDocument('users/user-pending', { accountStatus: 'pending' })

      await assertSucceeds(
        testEnv.authenticatedContext('user-alice').firestore()
          .doc('raceCatalog/berlin-marathon').get(),
      )
      // A pending account cannot see its own races yet, and can still see the
      // catalog: it is the same public list on every instance.
      await assertSucceeds(
        testEnv.authenticatedContext('user-pending').firestore()
          .doc('raceCatalog/berlin-marathon').get(),
      )
    })

    it('denies a signed-out reader', async () => {
      await seedDocument('raceCatalog/berlin-marathon', race)
      await assertFails(
        testEnv.unauthenticatedContext().firestore()
          .doc('raceCatalog/berlin-marathon').get(),
      )
    })

    it('lets an admin write and refuses everyone else', async () => {
      await seedDocument('users/user-admin', { name: 'Operator', admin: true })
      await seedDocument('users/user-alice', { name: 'Alice' })

      await assertSucceeds(
        testEnv.authenticatedContext('user-admin').firestore()
          .doc('raceCatalog/berlin-marathon').set(race),
      )
      await assertFails(
        testEnv.authenticatedContext('user-alice').firestore()
          .doc('raceCatalog/london-marathon').set({ ...race, id: 'london-marathon' }),
      )
    })

    it('refuses an entry with no name, even from an admin', async () => {
      await seedDocument('users/user-admin', { name: 'Operator', admin: true })

      await assertFails(
        testEnv.authenticatedContext('user-admin').firestore()
          .doc('raceCatalog/nameless').set({ ...race, name: '' }),
      )
    })

    it('never deletes, so nothing points at a hole', async () => {
      await seedDocument('users/user-admin', { name: 'Operator', admin: true })
      await seedDocument('raceCatalog/berlin-marathon', race)

      await assertFails(
        testEnv.authenticatedContext('user-admin').firestore()
          .doc('raceCatalog/berlin-marathon').delete(),
      )
    })
  })

  describe('parkrunCatalog', () => {
    const catalogPayload = {
      syncedAt: '2026-08-29',
      eventCount: 1,
      events: [{ id: 1, slug: 'bushy', longName: 'Bushy Park parkrun' }],
    }

    it('allows any signed-in user to read the catalog', async () => {
      await seedDocument('parkrunCatalog/global', catalogPayload)
      const db = testEnv.authenticatedContext('user-alice').firestore()
      await assertSucceeds(db.collection('parkrunCatalog').doc('global').get())
    })

    it('allows a pending user to read the catalog, so the picker still works', async () => {
      await seedDocument('users/user-pending', { name: 'Pending', accountStatus: 'pending' })
      await seedDocument('parkrunCatalog/global', catalogPayload)
      const db = testEnv.authenticatedContext('user-pending').firestore()
      await assertSucceeds(db.collection('parkrunCatalog').doc('global').get())
    })

    it('denies anonymous reads', async () => {
      await seedDocument('parkrunCatalog/global', catalogPayload)
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(db.collection('parkrunCatalog').doc('global').get())
    })

    it('denies every client write, including from an approved user', async () => {
      await seedDocument('users/user-alice', { name: 'Alice', accountStatus: 'approved' })
      const db = testEnv.authenticatedContext('user-alice').firestore()
      await assertFails(db.collection('parkrunCatalog').doc('global').set(catalogPayload))

      await seedDocument('parkrunCatalog/global', catalogPayload)
      await assertFails(db.collection('parkrunCatalog').doc('global').update({ eventCount: 0 }))
      await assertFails(db.collection('parkrunCatalog').doc('global').delete())
    })
  })

  describe('reminderDispatches', () => {
    it('allows users to read their own reminder dispatch documents', async () => {
      const userId = 'user-alice'
      await seedDocument(`users/${userId}/reminderDispatches/rem-1`, {
        sentAt: Timestamp.fromDate(new Date('2026-06-01T08:00:00Z')),
      })

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(db.doc(`users/${userId}/reminderDispatches/rem-1`).get())
    })

    it('denies client writes to reminder dispatch documents', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.doc(`users/${userId}/reminderDispatches/rem-1`).set({
          sentAt: Timestamp.fromDate(new Date('2026-06-01T08:00:00Z')),
        }),
      )
    })

    it('denies other users from reading reminder dispatch documents', async () => {
      const userId = 'user-alice'
      await seedDocument(`users/${userId}/reminderDispatches/rem-1`, {
        sentAt: Timestamp.fromDate(new Date('2026-06-01T08:00:00Z')),
      })

      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(db.doc(`users/${userId}/reminderDispatches/rem-1`).get())
    })
  })

  describe('event media', () => {
    it('allows create when storagePath and downloadUrl match the Firebase Storage prefix', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).set(
          validMediaPayload(userId, eventId, mediaId),
        ),
      )
    })

    it('rejects create when downloadUrl points outside Firebase Storage', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).set(
          validMediaPayload(userId, eventId, mediaId, {
            downloadUrl: 'https://evil.example/photo.jpg',
          }),
        ),
      )
    })

    it('rejects create when storagePath does not match user, event, and media id', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).set(
          validMediaPayload(userId, eventId, mediaId, {
            storagePath: mediaStoragePath('other-user', eventId, mediaId),
            downloadUrl: mediaDownloadUrl('other-user', eventId, mediaId),
          }),
        ),
      )
    })

    it('rejects create when storagePath uses a different event id', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).set(
          validMediaPayload(userId, 'event-other', mediaId),
        ),
      )
    })

    it('rejects create when storagePath media id does not match document id', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).set(
          validMediaPayload(userId, eventId, 'media-other'),
        ),
      )
    })

    it('rejects create for an event owned by another user', async () => {
      const ownerId = 'user-alice'
      const attackerId = 'user-bob'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(ownerId, eventId)

      const db = testEnv.authenticatedContext(attackerId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).set(
          validMediaPayload(attackerId, eventId, mediaId),
        ),
      )
    })

    it('accepts firebasestorage.app download URLs', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(userId, eventId)

      const encoded = `users%2F${userId}%2Fevents%2F${eventId}%2Fmedia%2F${mediaId}.jpg`
      const downloadUrl = `https://demo-test.firebasestorage.app/o/${encoded}?alt=media&token=test-token`

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).set(
          validMediaPayload(userId, eventId, mediaId, { downloadUrl }),
        ),
      )
    })

    it('denies media updates', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      const mediaId = 'media-1'
      await seedEvent(userId, eventId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection('events')
          .doc(eventId)
          .collection('media')
          .doc(mediaId)
          .set(validMediaPayload(userId, eventId, mediaId))
      })

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('media').doc(mediaId).update({
          sizeBytes: 2048,
        }),
      )
    })
  })

  describe('event track', () => {
    const trackId = 'current'

    it('allows create when storagePath and downloadUrl match the owner and event', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId),
        ),
      )
    })

    it('allows replacing the track in place, since there is only ever one', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId),
        ),
      )
      await assertSucceeds(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId, {
            format: 'tcx',
            storagePath: trackStoragePath(userId, eventId, trackId, 'tcx'),
            downloadUrl: trackDownloadUrl(userId, eventId, trackId, 'tcx'),
            distanceSource: 'device',
          }),
        ),
      )
    })

    it('rejects a second track document under another id', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc('second').set(
          validTrackPayload(userId, eventId, 'second'),
        ),
      )
    })

    it('rejects create when downloadUrl points outside Firebase Storage', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId, {
            downloadUrl: 'https://evil.example/run.gpx',
          }),
        ),
      )
    })

    it('rejects create when storagePath belongs to another user', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId, {
            storagePath: trackStoragePath('other-user', eventId, trackId),
            downloadUrl: trackDownloadUrl('other-user', eventId, trackId),
          }),
        ),
      )
    })

    it('rejects a format the parser does not support', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId, {
            format: 'fit',
            storagePath: `users/${userId}/events/${eventId}/track/${trackId}.fit`,
          }),
        ),
      )
    })

    it('rejects a file larger than the upload limit', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId, { sizeBytes: 20 * 1024 * 1024 + 1 }),
        ),
      )
    })

    it('rejects an unbounded route, which is the only field that can grow without limit', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const route = Array.from({ length: 201 }, () => ({ lat: 52.3, lon: 13 }))
      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId, { route }),
        ),
      )
    })

    it('rejects an unbounded chart profile', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      const profile = Array.from({ length: 201 }, (_unused, index) => ({
        distanceMeters: index * 100,
        paceSecondsPerKm: 307,
      }))
      const db = testEnv.authenticatedContext(userId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(userId, eventId, trackId, { profile }),
        ),
      )
    })

    it('rejects create for an event owned by another user', async () => {
      const ownerId = 'user-alice'
      const attackerId = 'user-bob'
      const eventId = 'event-1'
      await seedEvent(ownerId, eventId)

      const db = testEnv.authenticatedContext(attackerId).firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).set(
          validTrackPayload(attackerId, eventId, trackId),
        ),
      )
    })

    it('denies another user from reading the track', async () => {
      const ownerId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(ownerId, eventId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection('events')
          .doc(eventId)
          .collection('track')
          .doc(trackId)
          .set(validTrackPayload(ownerId, eventId, trackId))
      })

      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(
        db.collection('events').doc(eventId).collection('track').doc(trackId).get(),
      )
    })

    it('lets the owner delete the track', async () => {
      const userId = 'user-alice'
      const eventId = 'event-1'
      await seedEvent(userId, eventId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection('events')
          .doc(eventId)
          .collection('track')
          .doc(trackId)
          .set(validTrackPayload(userId, eventId, trackId))
      })

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(
        db.collection('events').doc(eventId).collection('track').doc(trackId).delete(),
      )
    })
  })

  describe('official results lookup rate limits', () => {
    it('allows users to read their own rate limit document', async () => {
      const userId = 'user-alice'

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .doc(`users/${userId}/rateLimits/officialResults`)
          .set({ lastLookupAt: new Date() })
      })

      const db = testEnv.authenticatedContext(userId).firestore()
      await assertSucceeds(db.doc(`users/${userId}/rateLimits/officialResults`).get())
    })

    it('denies client writes to rate limit documents', async () => {
      const userId = 'user-alice'
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(
        db.doc(`users/${userId}/rateLimits/officialResults`).set({
          lastLookupAt: new Date(),
        }),
      )
    })

    it('denies other users from reading rate limit documents', async () => {
      const userId = 'user-alice'
      await seedDocument(`users/${userId}/rateLimits/officialResults`, {
        lastLookupAt: Timestamp.fromDate(new Date('2026-06-01T08:00:00Z')),
      })

      const db = testEnv.authenticatedContext('user-bob').firestore()
      await assertFails(db.doc(`users/${userId}/rateLimits/officialResults`).get())
    })
  })

  describe('backup restore', () => {
    const userId = 'user-alice'

    async function seedApproved(): Promise<void> {
      await seedDocument(`users/${userId}`, { name: 'Alice', accountStatus: 'approved' })
    }

    it('allows restoring every collection at explicit document ids', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(db.collection('goals').doc('goal-1').set(validGoalPayload(userId)))
      await assertSucceeds(
        db.collection('performanceGoals').doc('pg-1').set(validPerformanceGoalPayload(userId)),
      )
      await assertSucceeds(
        db.collection('bucketListItems').doc('bucket-1').set(validBucketListPayload(userId)),
      )
    })

    it('accepts a raceId and rejects one that is not a string', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('events')
          .doc('event-linked')
          .set(validEventPayload(userId, { raceId: 'race-1' })),
      )
      await assertSucceeds(
        db
          .collection('events')
          .doc('event-unlinked')
          .set(validEventPayload(userId, { raceId: null })),
      )
      await assertFails(
        db
          .collection('events')
          .doc('event-bad-race')
          .set(validEventPayload(userId, { raceId: 42 })),
      )
    })

    it('accepts a discipline beyond the original four', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('events')
          .doc('event-ultra')
          .set(validEventPayload(userId, { eventType: 'km_100', realDistance: 100 })),
      )
    })

    it('still rejects a discipline that is not in the catalogue', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(
        db
          .collection('events')
          .doc('event-backyard')
          .set(validEventPayload(userId, { eventType: 'backyard' })),
      )
    })

    it('allows restoring an event that kept its legacy portuguese encodings', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('events')
          .doc('event-legacy')
          .set(validEventPayload(userId, { status: 'Concluído', eventType: '21.1Km' })),
      )
    })

    it('allows restoring an event with its original createdAt and updatedAt', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('events')
          .doc('event-1')
          .set(
            validEventPayload(userId, {
              createdAt: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')),
              updatedAt: Timestamp.fromDate(new Date('2024-02-20T11:30:00Z')),
            }),
          ),
      )
    })

    it('allows restoring media metadata verbatim at preserved ids', async () => {
      await seedApproved()
      await seedEvent(userId, 'event-1')
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db
          .collection('events')
          .doc('event-1')
          .collection('media')
          .doc('media-1')
          .set(validMediaPayload(userId, 'event-1', 'media-1')),
      )
    })

    it('denies re-restoring a media document that already exists', async () => {
      await seedApproved()
      await seedEvent(userId, 'event-1')
      await seedDocument(
        'events/event-1/media/media-1',
        validMediaPayload(userId, 'event-1', 'media-1'),
      )
      const db = testEnv.authenticatedContext(userId).firestore()

      // media is `allow update: if false`, so a merge-mode restore must pre-read
      // existing ids and skip them rather than overwriting.
      await assertFails(
        db
          .collection('events')
          .doc('event-1')
          .collection('media')
          .doc('media-1')
          .set(validMediaPayload(userId, 'event-1', 'media-1')),
      )
    })

    it('allows a 500 document batch of explicit-id event creates', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      // Each create costs one get(users/{uid}) for isApprovedUser(). Repeated
      // access calls to the *same* document are counted once, so the batched
      // write stays inside the 20 access call budget at any chunk size.
      const batch = db.batch()
      for (let index = 0; index < 500; index += 1) {
        batch.set(db.collection('events').doc(`event-${index}`), validEventPayload(userId))
      }

      await assertSucceeds(batch.commit())
    })

    it('allows a media batch spanning 19 distinct events but denies 20', async () => {
      await seedApproved()
      for (let index = 0; index < 20; index += 1) {
        await seedEvent(userId, `event-${index}`)
      }
      const db = testEnv.authenticatedContext(userId).firestore()

      function mediaBatch(distinctEvents: number, mediaSuffix: string) {
        const batch = db.batch()
        for (let index = 0; index < distinctEvents; index += 1) {
          const eventId = `event-${index}`
          const mediaId = `media-${mediaSuffix}-${index}`
          batch.set(
            db.collection('events').doc(eventId).collection('media').doc(mediaId),
            validMediaPayload(userId, eventId, mediaId),
          )
        }
        return batch
      }

      // validEventMediaWrite costs get(users/{uid}) plus get(events/{eventId}),
      // and each distinct event is a distinct access call: 1 + 19 = 20 is the
      // ceiling, 1 + 20 exceeds it and rejects the whole batch. This is why
      // media writes are grouped by parent event and chunked.
      await assertSucceeds(mediaBatch(19, 'ok').commit())
      await assertFails(mediaBatch(20, 'over').commit())
    })

    it('allows many media documents in one batch when they share a parent event', async () => {
      await seedApproved()
      await seedEvent(userId, 'event-1')
      const db = testEnv.authenticatedContext(userId).firestore()

      const batch = db.batch()
      for (let index = 0; index < 100; index += 1) {
        const mediaId = `media-${index}`
        batch.set(
          db.collection('events').doc('event-1').collection('media').doc(mediaId),
          validMediaPayload(userId, 'event-1', mediaId),
        )
      }

      await assertSucceeds(batch.commit())
    })

    it('denies a restored profile that carries the server owned approval fields', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertFails(
        db.doc(`users/${userId}`).set(
          { appLanguage: 'pt', accountStatus: 'approved', approvedAt: Timestamp.now() },
          { merge: true },
        ),
      )
    })

    it('allows a profile restore that only carries client owned fields', async () => {
      await seedApproved()
      const db = testEnv.authenticatedContext(userId).firestore()

      await assertSucceeds(
        db.doc(`users/${userId}`).set(
          {
            appLanguage: 'pt',
            notificationsEnabled: true,
            reminderDaysBefore: 3,
            reminderTime: '08:00',
            resultFirstName: 'Zé',
            resultLastName: 'Ninguém',
          },
          { merge: true },
        ),
      )
    })

    it('allows a profile restore on an account the server already approved', async () => {
      await seedDocument(`users/${userId}`, {
        name: 'Alice',
        email: 'alice@example.com',
        accountStatus: 'approved',
        approvedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
        approvedBy: 'admin@example.com',
      })
      const db = testEnv.authenticatedContext(userId).firestore()

      // The exact payload sanitizeProfileForRestore() produces: approval fields
      // and fcmTokens stripped, everything else restored verbatim.
      await assertSucceeds(
        db.doc(`users/${userId}`).set(
          {
            name: 'Zé Ninguém',
            email: 'ze@example.test',
            appLanguage: 'pt',
            notificationsEnabled: true,
            reminderDaysBefore: 3,
            reminderTime: '08:30',
            resultFirstName: 'Zé',
            resultNameAliases: ['Ze Ninguem'],
            createdAt: Timestamp.fromDate(new Date('2025-10-01T10:00:00Z')),
            updatedAt: Timestamp.fromDate(new Date('2026-08-01T10:00:00Z')),
          },
          { merge: true },
        ),
      )
    })

    it('allows exporting shares by ownerId and by granteeId but not unfiltered', async () => {
      await seedDocument(
        'shares/share-revoked',
        validSharePayload({ ownerId: userId, status: 'revoked' }),
      )
      const db = testEnv.authenticatedContext(userId).firestore()

      // The backup reads shares directly rather than through the listShares
      // callable, which filters out revoked and declined invites.
      await assertSucceeds(db.collection('shares').where('ownerId', '==', userId).get())
      await assertSucceeds(db.collection('shares').where('granteeId', '==', userId).get())
      await assertFails(db.collection('shares').get())
    })
  })
})
