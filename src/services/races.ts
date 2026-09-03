import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Race, RaceCreate } from '../types/Race'
import { findRaceByName } from '../domain/raceMatching'
import { parseAnchorYears, toggleAnchorYear } from '../domain/seasonAnchors'
import { isRaceRole, type RaceRole } from '../domain/seasonRules'

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
    anchorYears: parseAnchorYears(data.anchorYears),
    role: typeof data.role === 'string' && isRaceRole(data.role) ? data.role : undefined,
    servesRaceId: (data.servesRaceId as string | null) ?? undefined,
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

/**
 * The id of the race this name belongs to, creating one if it does not exist yet.
 *
 * Best effort on purpose: nothing reads `raceId` yet, so a race that cannot be
 * written must not stop an event or a bucket list item being saved. The backfill
 * script picks up whatever this misses.
 */
export async function findOrCreateRaceId(
  userId: string,
  data: RaceCreate,
): Promise<string | null> {
  try {
    const existing = findRaceByName(await listRaces(userId), data.name)
    if (existing) return existing.id
    return await createRace(userId, data)
  } catch {
    return null
  }
}

/**
 * Mark or unmark a race as the anchor of one season.
 *
 * A transaction because the same race can be toggled from the event page and
 * from the bucket list, and the stored value is a list: a read-modify-write
 * would lose whichever click landed second.
 */
export async function setRaceAnchorYear(
  raceId: string,
  year: number,
  anchor: boolean,
): Promise<void> {
  const ref = doc(db, RACES_COLLECTION, raceId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    if (!snapshot.exists()) return

    const years = toggleAnchorYear(parseAnchorYears(snapshot.data().anchorYears), year, anchor)
    transaction.update(ref, {
      anchorYears: years.length > 0 ? years : null,
      updatedAt: serverTimestamp(),
    })
  })
}

/**
 * Every race the account owns, in no order.
 *
 * No `orderBy`: a filter plus an order needs a composite index, and a race
 * collection nobody paginates has nothing to gain from one. Callers that care
 * about order sort in memory, which costs nothing at this size and cannot fail
 * while an index builds.
 */
/**
 * What a race is for in the season, and which anchor it prepares.
 *
 * `null` clears a field: a race that stops being a build-up says nothing rather
 * than keeping an old answer.
 */
export async function setRaceSeasonRole(
  raceId: string,
  season: { role?: RaceRole | null; servesRaceId?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if ('role' in season) payload.role = season.role ?? null
  if ('servesRaceId' in season) payload.servesRaceId = season.servesRaceId ?? null
  await updateDoc(doc(db, RACES_COLLECTION, raceId), payload)
}

export function racesCollectionQuery(userId: string) {
  return query(collection(db, RACES_COLLECTION), where('userId', '==', userId))
}
