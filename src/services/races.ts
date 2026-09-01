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
import type { Race, RaceCreate } from '../types/Race'

const RACES_COLLECTION = 'races'

function withoutUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

export function docToRace(id: string, data: Record<string, unknown>): Race {
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
    catalogRaceId: (data.catalogRaceId as string | null) ?? undefined,
    officialUrl: (data.officialUrl as string | null) ?? undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

export async function createRace(userId: string, data: RaceCreate): Promise<string> {
  const ref = await addDoc(collection(db, RACES_COLLECTION), {
    userId,
    name: data.name.trim(),
    location: data.location.trim(),
    locationLat: data.locationLat ?? null,
    locationLng: data.locationLng ?? null,
    locationGeocodeQuery: data.locationGeocodeQuery ?? null,
    locationGeocodedAt:
      data.locationLat != null && data.locationLng != null ? serverTimestamp() : null,
    catalogRaceId: data.catalogRaceId?.trim() || null,
    officialUrl: data.officialUrl?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRace(
  raceId: string,
  data: Partial<Omit<Race, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  const payload: Record<string, unknown> = withoutUndefined(data as Record<string, unknown>)
  if (typeof payload.name === 'string') payload.name = payload.name.trim()
  if (typeof payload.location === 'string') payload.location = payload.location.trim()
  if (typeof payload.officialUrl === 'string') payload.officialUrl = payload.officialUrl.trim() || null
  if ('locationLat' in payload && 'locationLng' in payload) {
    payload.locationGeocodedAt =
      payload.locationLat != null && payload.locationLng != null ? serverTimestamp() : null
  }
  await updateDoc(doc(db, RACES_COLLECTION, raceId), { ...payload, updatedAt: serverTimestamp() })
}

export async function deleteRace(raceId: string): Promise<void> {
  await deleteDoc(doc(db, RACES_COLLECTION, raceId))
}

export async function getRace(raceId: string): Promise<Race | null> {
  const snapshot = await getDoc(doc(db, RACES_COLLECTION, raceId))
  if (!snapshot.exists()) return null
  return docToRace(snapshot.id, snapshot.data())
}

export async function listRaces(userId: string): Promise<Race[]> {
  const snapshot = await getDocs(racesCollectionQuery(userId))
  return snapshot.docs.map((document) => docToRace(document.id, document.data()))
}

export function racesCollectionQuery(userId: string) {
  return query(
    collection(db, RACES_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
}
