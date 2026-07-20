import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'
import {
  canWriteBucketList,
  hasAnyPermission,
  hasBucketListAccess,
  hasEventsAccess,
  hasSectionReadAccess,
  normalizeEmail,
  parseSharePermissions,
} from './shared/shares/permissions.js'
import {
  redactBucketListItemForShare,
  redactEventForShare,
  redactGoalForShare,
  redactPerformanceGoalForShare,
} from './shared/shares/redact.js'
import type {
  SharePermissions,
  SharedDataSection,
} from './shared/shares/types.js'
import { DEFAULT_SHARE_PERMISSIONS } from './shared/shares/types.js'
import { callableFunctionOptions } from './functionOptions.js'

const SHARES_COLLECTION = 'shares'
const BUCKET_LIST_COLLECTION = 'bucketListItems'
const EVENTS_COLLECTION = 'events'
const GOALS_COLLECTION = 'goals'
const PERFORMANCE_GOALS_COLLECTION = 'performanceGoals'

const callableOptions = callableFunctionOptions()

type ShareDoc = {
  ownerId: string
  ownerDisplayName?: string
  ownerEmail?: string
  granteeId?: string
  granteeEmail: string
  granteeDisplayName?: string
  status: 'pending' | 'active' | 'revoked'
  permissions: SharePermissions
  createdAt: Timestamp
  updatedAt: Timestamp
  revokedAt?: Timestamp
}

function requireAuthUid(request: { auth?: { uid?: string } }): string {
  const uid = request.auth?.uid
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication required.')
  }
  return uid
}

function parsePermissionsInput(value: unknown): SharePermissions {
  const permissions = parseSharePermissions(value)
  if (!hasAnyPermission(permissions)) {
    throw new HttpsError('invalid-argument', 'At least one section permission is required.')
  }
  return permissions
}

async function getUserDisplayName(db: Firestore, userId: string): Promise<string> {
  const snapshot = await db.collection('users').doc(userId).get()
  const name = snapshot.data()?.name
  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : ''
}

async function getUserEmail(db: Firestore, userId: string): Promise<string> {
  const snapshot = await db.collection('users').doc(userId).get()
  const email = snapshot.data()?.email
  return typeof email === 'string' && email.includes('@') ? normalizeEmail(email) : ''
}

async function buildOwnerEmailMap(
  db: Firestore,
  shares: ShareDoc[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const missing = new Set<string>()

  for (const share of shares) {
    if (share.ownerEmail) {
      map.set(share.ownerId, share.ownerEmail)
    } else {
      missing.add(share.ownerId)
    }
  }

  await Promise.all(
    [...missing].map(async (ownerId) => {
      map.set(ownerId, await getUserEmail(db, ownerId))
    }),
  )

  return map
}

async function findOpenShare(
  db: Firestore,
  ownerId: string,
  granteeEmail: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const snapshot = await db
    .collection(SHARES_COLLECTION)
    .where('ownerId', '==', ownerId)
    .where('granteeEmail', '==', granteeEmail)
    .where('status', 'in', ['pending', 'active'])
    .limit(1)
    .get()
  return snapshot.docs[0] ?? null
}

async function getShareById(db: Firestore, shareId: string): Promise<ShareDoc & { id: string }> {
  const snapshot = await db.collection(SHARES_COLLECTION).doc(shareId).get()
  if (!snapshot.exists) {
    throw new HttpsError('not-found', 'Share not found.')
  }
  const data = snapshot.data() as ShareDoc
  return { id: snapshot.id, ...data }
}

function isGranteeForShare(
  share: ShareDoc,
  uid: string,
  email: string | null | undefined,
): boolean {
  if (share.granteeId === uid) return true
  return share.status === 'pending' && normalizeEmail(share.granteeEmail) === normalizeEmail(email ?? '')
}

async function getActiveShareBetween(
  db: Firestore,
  ownerId: string,
  granteeId: string,
): Promise<(ShareDoc & { id: string }) | null> {
  const snapshot = await db
    .collection(SHARES_COLLECTION)
    .where('ownerId', '==', ownerId)
    .where('granteeId', '==', granteeId)
    .where('status', '==', 'active')
    .limit(1)
    .get()
  const doc = snapshot.docs[0]
  if (!doc) return null
  return { id: doc.id, ...(doc.data() as ShareDoc) }
}

function serializeShare(id: string, data: ShareDoc, ownerEmail = '') {
  return {
    id,
    ownerId: data.ownerId,
    ownerDisplayName: data.ownerDisplayName ?? '',
    ownerEmail: data.ownerEmail ?? ownerEmail,
    granteeId: data.granteeId,
    granteeEmail: data.granteeEmail,
    granteeDisplayName: data.granteeDisplayName ?? '',
    status: data.status,
    permissions: data.permissions,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    revokedAt: data.revokedAt?.toDate().toISOString(),
  }
}

function validateBucketListPatch(patch: unknown): Record<string, unknown> {
  if (!patch || typeof patch !== 'object') {
    throw new HttpsError('invalid-argument', 'patch is required.')
  }
  const data = patch as Record<string, unknown>
  const result: Record<string, unknown> = {}

  if ('name' in data) {
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    if (!name) throw new HttpsError('invalid-argument', 'name cannot be empty.')
    result.name = name
  }
  if ('location' in data) {
    const location = typeof data.location === 'string' ? data.location.trim() : ''
    if (!location) throw new HttpsError('invalid-argument', 'location cannot be empty.')
    result.location = location
  }
  if ('realDistance' in data) {
    if (typeof data.realDistance !== 'number' || data.realDistance <= 0) {
      throw new HttpsError('invalid-argument', 'realDistance must be a positive number.')
    }
    result.realDistance = data.realDistance
  }
  if ('disciplines' in data) {
    if (!Array.isArray(data.disciplines) || data.disciplines.length === 0) {
      throw new HttpsError('invalid-argument', 'disciplines cannot be empty.')
    }
    result.disciplines = data.disciplines
  }
  if ('locationLat' in data) {
    result.locationLat = typeof data.locationLat === 'number' ? data.locationLat : null
  }
  if ('locationLng' in data) {
    result.locationLng = typeof data.locationLng === 'number' ? data.locationLng : null
  }
  if ('locationGeocodeQuery' in data) {
    result.locationGeocodeQuery =
      typeof data.locationGeocodeQuery === 'string' ? data.locationGeocodeQuery.trim() || null : null
  }
  if ('targetMonth' in data) {
    result.targetMonth = typeof data.targetMonth === 'string' ? data.targetMonth.trim() || null : null
  }
  if ('link' in data) {
    result.link = typeof data.link === 'string' ? data.link.trim() || null : null
  }
  if ('emoji' in data) {
    result.emoji = typeof data.emoji === 'string' ? data.emoji || null : null
  }
  if ('notes' in data) {
    result.notes = typeof data.notes === 'string' ? data.notes.trim() || null : null
  }

  if (Object.keys(result).length === 0) {
    throw new HttpsError('invalid-argument', 'patch cannot be empty.')
  }

  return result
}

function validateBucketListItemInput(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== 'object') {
    throw new HttpsError('invalid-argument', 'item is required.')
  }
  const patch = validateBucketListPatch(item)
  const required = ['name', 'location', 'realDistance', 'disciplines'] as const
  for (const key of required) {
    if (!(key in patch)) {
      throw new HttpsError('invalid-argument', `${key} is required.`)
    }
  }
  return patch
}

export const inviteShare = onCall(callableOptions, async (request) => {
  const ownerId = requireAuthUid(request)
  const granteeEmailRaw = (request.data as { granteeEmail?: string })?.granteeEmail
  const permissions = parsePermissionsInput((request.data as { permissions?: unknown })?.permissions)

  if (!granteeEmailRaw || typeof granteeEmailRaw !== 'string') {
    throw new HttpsError('invalid-argument', 'granteeEmail is required.')
  }

  const granteeEmail = normalizeEmail(granteeEmailRaw)
  if (!granteeEmail.includes('@')) {
    throw new HttpsError('invalid-argument', 'granteeEmail is invalid.')
  }

  const ownerEmail = normalizeEmail(request.auth?.token.email ?? '')
  if (ownerEmail && ownerEmail === granteeEmail) {
    throw new HttpsError('invalid-argument', 'You cannot invite yourself.')
  }

  const db = getFirestore()
  const existing = await findOpenShare(db, ownerId, granteeEmail)
  if (existing) {
    throw new HttpsError('already-exists', 'An active or pending share already exists for this email.')
  }

  let granteeId: string | undefined
  let granteeDisplayName = ''
  try {
    const userRecord = await getAuth().getUserByEmail(granteeEmail)
    granteeId = userRecord.uid
    if (granteeId === ownerId) {
      throw new HttpsError('invalid-argument', 'You cannot invite yourself.')
    }
    granteeDisplayName = await getUserDisplayName(db, granteeId)
  } catch (error) {
    if (error instanceof HttpsError) throw error
    // user-not-found: pending invite until they register
  }

  const ownerDisplayName = await getUserDisplayName(db, ownerId)
  const resolvedOwnerEmail =
    ownerEmail || (await getUserEmail(db, ownerId))
  const now = FieldValue.serverTimestamp()
  const ref = await db.collection(SHARES_COLLECTION).add({
    ownerId,
    ownerDisplayName,
    ownerEmail: resolvedOwnerEmail || null,
    granteeId: granteeId ?? null,
    granteeEmail,
    granteeDisplayName,
    status: 'pending',
    permissions,
    createdAt: now,
    updatedAt: now,
  })

  const created = await ref.get()
  return serializeShare(created.id, created.data() as ShareDoc)
})

export const acceptShare = onCall(callableOptions, async (request) => {
  const uid = requireAuthUid(request)
  const shareId = (request.data as { shareId?: string })?.shareId
  if (!shareId) throw new HttpsError('invalid-argument', 'shareId is required.')

  const db = getFirestore()
  const share = await getShareById(db, shareId)
  if (share.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Share is not pending.')
  }
  if (!isGranteeForShare(share, uid, request.auth?.token.email)) {
    throw new HttpsError('permission-denied', 'You cannot accept this share.')
  }

  const granteeDisplayName = await getUserDisplayName(db, uid)
  await db.collection(SHARES_COLLECTION).doc(shareId).update({
    status: 'active',
    granteeId: uid,
    granteeDisplayName,
    updatedAt: FieldValue.serverTimestamp(),
  })

  const updated = await db.collection(SHARES_COLLECTION).doc(shareId).get()
  return serializeShare(updated.id, updated.data() as ShareDoc)
})

export const declineShare = onCall(callableOptions, async (request) => {
  const uid = requireAuthUid(request)
  const shareId = (request.data as { shareId?: string })?.shareId
  if (!shareId) throw new HttpsError('invalid-argument', 'shareId is required.')

  const db = getFirestore()
  const share = await getShareById(db, shareId)
  if (share.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Share is not pending.')
  }
  if (!isGranteeForShare(share, uid, request.auth?.token.email)) {
    throw new HttpsError('permission-denied', 'You cannot decline this share.')
  }

  await db.collection(SHARES_COLLECTION).doc(shareId).update({
    status: 'revoked',
    revokedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { success: true }
})

export const revokeShare = onCall(callableOptions, async (request) => {
  const uid = requireAuthUid(request)
  const shareId = (request.data as { shareId?: string })?.shareId
  if (!shareId) throw new HttpsError('invalid-argument', 'shareId is required.')

  const db = getFirestore()
  const share = await getShareById(db, shareId)
  if (share.status === 'revoked') {
    return { success: true }
  }
  const isOwner = share.ownerId === uid
  const isGrantee = isGranteeForShare(share, uid, request.auth?.token.email)
  if (!isOwner && !isGrantee) {
    throw new HttpsError('permission-denied', 'You cannot revoke this share.')
  }

  await db.collection(SHARES_COLLECTION).doc(shareId).update({
    status: 'revoked',
    revokedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { success: true }
})

export const updateSharePermissions = onCall(callableOptions, async (request) => {
  const uid = requireAuthUid(request)
  const shareId = (request.data as { shareId?: string })?.shareId
  const permissions = parsePermissionsInput((request.data as { permissions?: unknown })?.permissions)
  if (!shareId) throw new HttpsError('invalid-argument', 'shareId is required.')

  const db = getFirestore()
  const share = await getShareById(db, shareId)
  if (share.ownerId !== uid) {
    throw new HttpsError('permission-denied', 'Only the owner can update permissions.')
  }
  if (share.status !== 'active' && share.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Share is not editable.')
  }

  await db.collection(SHARES_COLLECTION).doc(shareId).update({
    permissions,
    updatedAt: FieldValue.serverTimestamp(),
  })

  const updated = await db.collection(SHARES_COLLECTION).doc(shareId).get()
  return serializeShare(updated.id, updated.data() as ShareDoc)
})

export const listShares = onCall(callableOptions, async (request) => {
  const uid = requireAuthUid(request)
  const email = normalizeEmail(request.auth?.token.email ?? '')
  const db = getFirestore()

  const [sentSnapshot, receivedByIdSnapshot, receivedByEmailSnapshot] = await Promise.all([
    db.collection(SHARES_COLLECTION).where('ownerId', '==', uid).where('status', 'in', ['pending', 'active']).get(),
    db.collection(SHARES_COLLECTION).where('granteeId', '==', uid).where('status', 'in', ['pending', 'active']).get(),
    email
      ? db
          .collection(SHARES_COLLECTION)
          .where('granteeEmail', '==', email)
          .where('status', '==', 'pending')
          .get()
      : null,
  ])

  const receivedMap = new Map<string, ShareDoc & { id: string }>()
  for (const doc of receivedByIdSnapshot.docs) {
    receivedMap.set(doc.id, { id: doc.id, ...(doc.data() as ShareDoc) })
  }
  if (receivedByEmailSnapshot) {
    for (const doc of receivedByEmailSnapshot.docs) {
      receivedMap.set(doc.id, { id: doc.id, ...(doc.data() as ShareDoc) })
    }
  }

  const sentShares = sentSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as ShareDoc),
  }))
  const receivedShares = [...receivedMap.values()]
  const ownerEmailMap = await buildOwnerEmailMap(db, [...sentShares, ...receivedShares])

  return {
    sent: sentShares.map((share) =>
      serializeShare(share.id, share, ownerEmailMap.get(share.ownerId) ?? ''),
    ),
    received: receivedShares.map((share) =>
      serializeShare(share.id, share, ownerEmailMap.get(share.ownerId) ?? ''),
    ),
  }
})

export const getSharedSnapshot = onCall(callableOptions, async (request) => {
  const granteeId = requireAuthUid(request)
  const ownerId = (request.data as { ownerId?: string })?.ownerId
  const sections = (request.data as { sections?: SharedDataSection[] })?.sections

  if (!ownerId) throw new HttpsError('invalid-argument', 'ownerId is required.')
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new HttpsError('invalid-argument', 'sections is required.')
  }

  const db = getFirestore()
  const share = await getActiveShareBetween(db, ownerId, granteeId)
  if (!share) {
    throw new HttpsError('permission-denied', 'No active share found.')
  }

  const payload: Record<string, unknown> = {
    ownerId,
    ownerDisplayName: share.ownerDisplayName ?? (await getUserDisplayName(db, ownerId)),
    permissions: share.permissions,
  }

  if (sections.includes('events')) {
    if (!hasEventsAccess(share.permissions.events)) {
      throw new HttpsError('permission-denied', 'Events are not shared.')
    }
    const snapshot = await db
      .collection(EVENTS_COLLECTION)
      .where('userId', '==', ownerId)
      .orderBy('date', 'asc')
      .get()
    payload.events = snapshot.docs.map((doc) =>
      redactEventForShare({ id: doc.id, ...doc.data() }, share.permissions.events),
    )
  }

  if (sections.includes('bucketList')) {
    if (!hasBucketListAccess(share.permissions.bucketList)) {
      throw new HttpsError('permission-denied', 'Bucket list is not shared.')
    }
    const snapshot = await db
      .collection(BUCKET_LIST_COLLECTION)
      .where('userId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get()
    payload.bucketList = snapshot.docs.map((doc) =>
      redactBucketListItemForShare({ id: doc.id, ...doc.data() }),
    )
  }

  if (sections.includes('goals')) {
    if (!hasSectionReadAccess(share.permissions.goals)) {
      throw new HttpsError('permission-denied', 'Goals are not shared.')
    }
    const snapshot = await db.collection(GOALS_COLLECTION).where('userId', '==', ownerId).get()
    payload.goals = snapshot.docs.map((doc) => redactGoalForShare({ id: doc.id, ...doc.data() }))
  }

  if (sections.includes('performanceGoals')) {
    if (!hasSectionReadAccess(share.permissions.performanceGoals)) {
      throw new HttpsError('permission-denied', 'Performance goals are not shared.')
    }
    const snapshot = await db
      .collection(PERFORMANCE_GOALS_COLLECTION)
      .where('userId', '==', ownerId)
      .get()
    payload.performanceGoals = snapshot.docs.map((doc) =>
      redactPerformanceGoalForShare({ id: doc.id, ...doc.data() }),
    )
  }

  return payload
})

async function requireBucketListWrite(
  db: Firestore,
  ownerId: string,
  granteeId: string,
): Promise<ShareDoc & { id: string }> {
  const share = await getActiveShareBetween(db, ownerId, granteeId)
  if (!share || !canWriteBucketList(share.permissions.bucketList)) {
    throw new HttpsError('permission-denied', 'Bucket list write access is required.')
  }
  return share
}

export const createSharedBucketListItem = onCall(callableOptions, async (request) => {
  const granteeId = requireAuthUid(request)
  const ownerId = (request.data as { ownerId?: string })?.ownerId
  const item = validateBucketListItemInput((request.data as { item?: unknown })?.item)
  if (!ownerId) throw new HttpsError('invalid-argument', 'ownerId is required.')

  const db = getFirestore()
  await requireBucketListWrite(db, ownerId, granteeId)

  const now = FieldValue.serverTimestamp()
  const ref = await db.collection(BUCKET_LIST_COLLECTION).add({
    userId: ownerId,
    ...item,
    locationGeocodedAt:
      item.locationLat != null && item.locationLng != null ? now : null,
    lastEditedBy: granteeId,
    createdAt: now,
    updatedAt: now,
  })

  const created = await ref.get()
  return redactBucketListItemForShare({ id: created.id, ...created.data() })
})

export const updateSharedBucketListItem = onCall(callableOptions, async (request) => {
  const granteeId = requireAuthUid(request)
  const ownerId = (request.data as { ownerId?: string })?.ownerId
  const itemId = (request.data as { itemId?: string })?.itemId
  const patch = validateBucketListPatch((request.data as { patch?: unknown })?.patch)
  if (!ownerId || !itemId) {
    throw new HttpsError('invalid-argument', 'ownerId and itemId are required.')
  }

  const db = getFirestore()
  await requireBucketListWrite(db, ownerId, granteeId)

  const ref = db.collection(BUCKET_LIST_COLLECTION).doc(itemId)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.userId !== ownerId) {
    throw new HttpsError('not-found', 'Bucket list item not found.')
  }

  await ref.update({
    ...patch,
    locationGeocodedAt:
      patch.locationLat != null && patch.locationLng != null ? FieldValue.serverTimestamp() : null,
    lastEditedBy: granteeId,
    updatedAt: FieldValue.serverTimestamp(),
  })

  const updated = await ref.get()
  return redactBucketListItemForShare({ id: updated.id, ...updated.data() })
})

export const deleteSharedBucketListItem = onCall(callableOptions, async (request) => {
  const granteeId = requireAuthUid(request)
  const ownerId = (request.data as { ownerId?: string })?.ownerId
  const itemId = (request.data as { itemId?: string })?.itemId
  if (!ownerId || !itemId) {
    throw new HttpsError('invalid-argument', 'ownerId and itemId are required.')
  }

  const db = getFirestore()
  await requireBucketListWrite(db, ownerId, granteeId)

  const ref = db.collection(BUCKET_LIST_COLLECTION).doc(itemId)
  const existing = await ref.get()
  if (!existing.exists || existing.data()?.userId !== ownerId) {
    throw new HttpsError('not-found', 'Bucket list item not found.')
  }

  await ref.delete()
  return { success: true }
})

export { DEFAULT_SHARE_PERMISSIONS }
