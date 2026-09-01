import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, type Firestore, type Query } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { callableFunctionOptions } from './functionOptions.js'

const USERS_COLLECTION = 'users'
const BATCH_SIZE = 400

/**
 * Collections a document belongs to its owner through a `userId` field.
 *
 * The list is deliberately explicit rather than derived: a collection added to
 * the app and forgotten here would leave data behind after a deletion, and a
 * silent leftover is worse than a compile error. `docs/architecture.md` lists the
 * same set.
 */
const OWNED_COLLECTIONS = [
  'events',
  'goals',
  'performanceGoals',
  'bucketListItems',
  'races',
] as const

/** Subcollections under `events/{id}` that belong to the same owner. */
const EVENT_SUBCOLLECTIONS = ['media', 'track'] as const

/** Subcollections under `users/{uid}`. `fcmTokens` is a field, so the profile carries it. */
const USER_SUBCOLLECTIONS = ['reminderDispatches', 'rateLimits'] as const

const callableOptions = callableFunctionOptions()

/**
 * The bucket the app actually writes to.
 *
 * `getStorage().bucket()` uses the project default, which on a project created
 * after the `firebasestorage.app` change is not the legacy `appspot.com` name. An
 * explicit `STORAGE_BUCKET` lets an operator pin it, and the mismatch check below
 * catches the case where it is still wrong.
 */
function storageBucketName(): string | undefined {
  const explicit = process.env.STORAGE_BUCKET?.trim()
  return explicit && explicit.length > 0 ? explicit : undefined
}

export type DeleteAccountReport = {
  uid: string
  documents: Record<string, number>
  storageFiles: number
  authUserDeleted: boolean
  /**
   * True when the account had media or track documents and the bucket held no
   * files for it.
   *
   * Deleting nothing must not look like deleting everything. The usual cause is a
   * bucket mismatch: `getStorage().bucket()` resolves the project default, which
   * is not necessarily the bucket the app was configured to write to, and reading
   * the wrong bucket succeeds with an empty list rather than failing.
   */
  storageUnreachable: boolean
}

async function requireAdmin(
  request: { auth?: { uid?: string } },
  db: Firestore,
): Promise<string> {
  const uid = request.auth?.uid
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication required.')
  }
  const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get()
  if (snapshot.data()?.admin !== true) {
    throw new HttpsError('permission-denied', 'Administrator access required.')
  }
  return uid
}

/** Deletes a query in batches, returning how many documents went. */
async function deleteQuery(db: Firestore, query: Query): Promise<number> {
  let deleted = 0

  for (;;) {
    const snapshot = await query.limit(BATCH_SIZE).get()
    if (snapshot.empty) return deleted

    const batch = db.batch()
    for (const document of snapshot.docs) batch.delete(document.ref)
    await batch.commit()
    deleted += snapshot.size

    // A page smaller than the batch means that was the last one.
    if (snapshot.size < BATCH_SIZE) return deleted
  }
}

/**
 * Everything one account owns, in an order that never leaves an orphan.
 *
 * Subcollections first, because deleting a parent document in Firestore leaves
 * its subcollections behind as unreachable data. Auth last, so a failure halfway
 * leaves an account that can still sign in and be deleted again rather than a
 * ghost with data and no way back in.
 */
export const adminDeleteAccount = onCall(callableOptions, async (request) => {
  const db = getFirestore()
  const callerUid = await requireAdmin(request, db)

  const targetUid = (request.data as { uid?: unknown })?.uid
  if (typeof targetUid !== 'string' || targetUid.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'A user id is required.')
  }
  const uid = targetUid.trim()

  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', 'An administrator cannot delete their own account.')
  }

  const documents: Record<string, number> = {}

  // Event subcollections before the events themselves.
  const events = await db.collection('events').where('userId', '==', uid).get()
  for (const name of EVENT_SUBCOLLECTIONS) {
    let count = 0
    for (const event of events.docs) {
      count += await deleteQuery(db, event.ref.collection(name) as unknown as Query)
    }
    documents[`events/${name}`] = count
  }

  for (const name of OWNED_COLLECTIONS) {
    documents[name] = await deleteQuery(db, db.collection(name).where('userId', '==', uid))
  }

  for (const name of USER_SUBCOLLECTIONS) {
    documents[`users/${name}`] = await deleteQuery(
      db,
      db.collection(USERS_COLLECTION).doc(uid).collection(name) as unknown as Query,
    )
  }

  // Shares reach in from both sides, and a pending invite is addressed by email
  // rather than by uid, so it needs the profile before the profile goes.
  const profile = await db.collection(USERS_COLLECTION).doc(uid).get()
  const email = typeof profile.data()?.email === 'string' ? profile.data()!.email : ''
  let shares = 0
  shares += await deleteQuery(db, db.collection('shares').where('ownerId', '==', uid))
  shares += await deleteQuery(db, db.collection('shares').where('granteeId', '==', uid))
  if (email) {
    shares += await deleteQuery(
      db,
      db.collection('shares').where('granteeEmail', '==', email.trim().toLowerCase()),
    )
  }
  documents.shares = shares

  await db.collection(USERS_COLLECTION).doc(uid).delete()
  documents[USERS_COLLECTION] = 1

  // Every media file and activity file lives under one prefix, so one call takes
  // the lot rather than walking the documents that just went.
  let storageFiles = 0
  let storageRead = false
  try {
    const name = storageBucketName()
    const bucket = name ? getStorage().bucket(name) : getStorage().bucket()
    const [files] = await bucket.getFiles({ prefix: `users/${uid}/` })
    storageFiles = files.length
    storageRead = true
    await bucket.deleteFiles({ prefix: `users/${uid}/`, force: true })
  } catch (error) {
    console.error('Failed to delete storage objects for account:', error)
  }

  // Media and track documents are the receipts for the files. If they existed and
  // the bucket held nothing, the files are somewhere this function cannot see, and
  // saying so is the whole point: an account whose photos survive its deletion is
  // the failure that must never be silent.
  const expectedFiles = (documents['events/media'] ?? 0) + (documents['events/track'] ?? 0)
  const storageUnreachable = expectedFiles > 0 && storageFiles === 0
  if (storageUnreachable) {
    console.error(
      `Account ${uid} had ${expectedFiles} media or track documents and the bucket held no files. ` +
        `Check STORAGE_BUCKET: read ${storageRead ? 'succeeded' : 'failed'}.`,
    )
  }

  let authUserDeleted = false
  try {
    await getAuth().deleteUser(uid)
    authUserDeleted = true
  } catch (error) {
    // Already gone is success; anything else is worth surfacing, because the
    // account could otherwise sign in again with no data.
    const code = (error as { code?: string }).code
    if (code === 'auth/user-not-found') {
      authUserDeleted = true
    } else {
      console.error('Failed to delete auth user:', error)
    }
  }

  const report: DeleteAccountReport = {
    uid,
    documents,
    storageFiles,
    authUserDeleted,
    storageUnreachable,
  }
  console.log('Account deleted by admin', { callerUid, report })
  return report
})
