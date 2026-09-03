import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { BucketListItem, BucketListItemCreate } from '../types/BucketListItem'
import { normalizeBucketListDisciplines } from '../utils/bucketListDisciplines'
import { isRaceRole, type RaceRole } from '../domain/seasonRules'
import { findOrCreateRaceId } from './races'

const BUCKET_LIST_COLLECTION = 'bucketListItems'

function withoutUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

export function docToBucketListItem(id: string, data: Record<string, unknown>): BucketListItem {
  return {
    id,
    userId: data.userId as string,
    name: data.name as string,
    location: (data.location as string) ?? '',
    locationLat: typeof data.locationLat === 'number' ? data.locationLat : undefined,
    locationLng: typeof data.locationLng === 'number' ? data.locationLng : undefined,
    locationGeocodedAt: data.locationGeocodedAt
      ? timestampToDate(data.locationGeocodedAt as Timestamp)
      : undefined,
    locationGeocodeQuery:
      typeof data.locationGeocodeQuery === 'string' ? data.locationGeocodeQuery : undefined,
    realDistance: data.realDistance as number,
    disciplines: normalizeBucketListDisciplines(data),
    targetMonth: (data.targetMonth as string | null) ?? undefined,
    targetYear: typeof data.targetYear === 'number' ? data.targetYear : undefined,
    isAnchor: data.isAnchor === true,
    recurring: data.recurring === true,
    role: typeof data.role === 'string' && isRaceRole(data.role) ? data.role : undefined,
    servesRaceId: (data.servesRaceId as string | null) ?? undefined,
    link: (data.link as string | null) ?? undefined,
    emoji: (data.emoji as string | null) ?? undefined,
    notes: (data.notes as string | null) ?? undefined,
    raceId: (data.raceId as string | null) ?? undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

export async function createBucketListItem(
  userId: string,
  data: BucketListItemCreate,
): Promise<string> {
  const raceId =
    data.raceId ??
    (await findOrCreateRaceId(userId, {
      name: data.name,
      location: data.location,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      locationGeocodeQuery: data.locationGeocodeQuery,
    }))

  const ref = await addDoc(collection(db, BUCKET_LIST_COLLECTION), {
    userId,
    name: data.name.trim(),
    location: data.location.trim(),
    locationLat: data.locationLat ?? null,
    locationLng: data.locationLng ?? null,
    locationGeocodeQuery: data.locationGeocodeQuery ?? null,
    locationGeocodedAt:
      data.locationLat != null && data.locationLng != null ? serverTimestamp() : null,
    realDistance: data.realDistance,
    disciplines: data.disciplines,
    targetMonth: data.targetMonth?.trim() || null,
    targetYear: data.targetYear ?? null,
    isAnchor: data.isAnchor === true,
    recurring: data.recurring === true,
    role: data.role ?? null,
    servesRaceId: data.servesRaceId ?? null,
    link: data.link?.trim() || null,
    emoji: data.emoji ?? null,
    notes: data.notes?.trim() || null,
    raceId: raceId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBucketListItem(
  itemId: string,
  data: Omit<
    Partial<Omit<BucketListItem, 'id' | 'userId' | 'createdAt'>>,
    'role' | 'servesRaceId'
  > & {
    /**
     * `null` clears them, and clearing is what the migration onto the race
     * needs: `undefined` is filtered out below, so it would leave the wish
     * still saying what the race now says.
     */
    role?: RaceRole | null
    servesRaceId?: string | null
  },
): Promise<void> {
  const ref = doc(db, BUCKET_LIST_COLLECTION, itemId)
  const payload: Record<string, unknown> = { ...withoutUndefined(data as Record<string, unknown>) }
  if (typeof payload.name === 'string') payload.name = payload.name.trim()
  if (typeof payload.location === 'string') payload.location = payload.location.trim()
  if (typeof payload.targetMonth === 'string') payload.targetMonth = payload.targetMonth.trim() || null
  if (typeof payload.link === 'string') payload.link = payload.link.trim() || null
  if (typeof payload.notes === 'string') payload.notes = payload.notes.trim() || null
  if ('locationLat' in payload && 'locationLng' in payload) {
    if (payload.locationLat != null && payload.locationLng != null) {
      payload.locationGeocodedAt = serverTimestamp()
    } else {
      payload.locationGeocodedAt = null
    }
  }
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() })
}

export async function deleteBucketListItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, BUCKET_LIST_COLLECTION, itemId))
}

export async function getBucketListItem(itemId: string): Promise<BucketListItem | null> {
  const snapshot = await getDoc(doc(db, BUCKET_LIST_COLLECTION, itemId))
  if (!snapshot.exists()) return null
  return docToBucketListItem(snapshot.id, snapshot.data())
}

export async function listBucketListItems(userId: string): Promise<BucketListItem[]> {
  const snapshot = await getDocs(
    query(
      collection(db, BUCKET_LIST_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ),
  )
  return snapshot.docs.map((document) => docToBucketListItem(document.id, document.data()))
}

export function bucketListCollectionQuery(userId: string) {
  return query(
    collection(db, BUCKET_LIST_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
}
