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
})
