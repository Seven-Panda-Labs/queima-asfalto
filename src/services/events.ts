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
import i18n from '../i18n'
import { db } from './firebase'
import { deleteAllEventMedia } from './eventMedia'
import type { Event, EventCreate, EventFilters } from '../types/Event'
import { normalizeEventStatus, normalizeEventType } from '../domain/eventCodes'
import { calculatePace } from '../utils/pace'
import { normalizeTime } from '../utils/time'

const EVENTS_COLLECTION = 'events'

function withoutUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

function docToEvent(id: string, data: Record<string, unknown>): Event {
  return {
    id,
    userId: data.userId as string,
    name: data.name as string,
    date: timestampToDate(data.date as Timestamp | undefined),
    realDistance: data.realDistance as number,
    eventType: normalizeEventType(data.eventType as string),
    location: (data.location as string) ?? '',
    locationLat: typeof data.locationLat === 'number' ? data.locationLat : undefined,
    locationLng: typeof data.locationLng === 'number' ? data.locationLng : undefined,
    locationGeocodedAt: data.locationGeocodedAt
      ? timestampToDate(data.locationGeocodedAt as Timestamp)
      : undefined,
    locationGeocodeQuery:
      typeof data.locationGeocodeQuery === 'string' ? data.locationGeocodeQuery : undefined,
    status: normalizeEventStatus(data.status as string),
    emoji: data.emoji as string | undefined,
    notes: data.notes as string | undefined,
    time: data.time as string | undefined,
    pace: data.pace as string | undefined,
    classification: data.classification as string | undefined,
    resultsUrl: typeof data.resultsUrl === 'string' ? data.resultsUrl : undefined,
    resultsPlatform:
      data.resultsPlatform === 'parkrun' ||
      data.resultsPlatform === 'davengo' ||
      data.resultsPlatform === 'sporthive' ||
      data.resultsPlatform === 'myraceresult' ||
      data.resultsPlatform === 'sccevents' ||
      data.resultsPlatform === 'maxfunsports' ||
      data.resultsPlatform === 'myracepartner' ||
      data.resultsPlatform === 'strassenlauf' ||
      data.resultsPlatform === 'zielzeit' ||
      data.resultsPlatform === 'eqtiming' ||
      data.resultsPlatform === 'nsfberlin' ||
      data.resultsPlatform === 'runczech' ||
      data.resultsPlatform === 'ultimate' ||
      data.resultsPlatform === 'vcrunning' ||
      data.resultsPlatform === 'wiclax' ||
      data.resultsPlatform === 'timataka' ||
      data.resultsPlatform === 'mikatiming'
        ? data.resultsPlatform
        : undefined,
    resultsVerified: data.resultsVerified === true,
    parkrunEventSlug:
      typeof data.parkrunEventSlug === 'string' ? data.parkrunEventSlug : undefined,
    parkrunCountryUrl:
      typeof data.parkrunCountryUrl === 'string' ? data.parkrunCountryUrl : undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

function applyFilters(events: Event[], filters?: EventFilters): Event[] {
  if (!filters) return events

  return events.filter((event) => {
    if (filters.status && filters.status !== 'all' && event.status !== filters.status) {
      return false
    }
    if (filters.year && filters.year !== 'all' && event.date.getFullYear() !== filters.year) {
      return false
    }
    return true
  })
}

export async function createEvent(userId: string, data: EventCreate): Promise<string> {
  const ref = await addDoc(collection(db, EVENTS_COLLECTION), {
    userId,
    name: data.name,
    date: data.date,
    realDistance: data.realDistance,
    eventType: data.eventType,
    location: data.location,
    locationLat: data.locationLat ?? null,
    locationLng: data.locationLng ?? null,
    locationGeocodeQuery: data.locationGeocodeQuery ?? null,
    locationGeocodedAt: data.locationLat != null && data.locationLng != null ? serverTimestamp() : null,
    status: data.status,
    emoji: data.emoji ?? null,
    notes: data.notes ?? null,
    time: data.time ?? null,
    pace: data.pace ?? null,
    classification: data.classification ?? null,
    resultsUrl: data.resultsUrl ?? null,
    resultsPlatform: data.resultsPlatform ?? null,
    parkrunEventSlug: data.parkrunEventSlug ?? null,
    parkrunCountryUrl: data.parkrunCountryUrl ?? null,
    resultsVerified: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateEvent(
  eventId: string,
  data: Partial<Omit<Event, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  const ref = doc(db, EVENTS_COLLECTION, eventId)
  await updateDoc(ref, {
    ...withoutUndefined(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteEvent(eventId: string): Promise<void> {
  await deleteAllEventMedia(eventId)
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId))
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const snapshot = await getDoc(doc(db, EVENTS_COLLECTION, eventId))
  if (!snapshot.exists()) return null
  return docToEvent(snapshot.id, snapshot.data())
}

export async function listEvents(userId: string, filters?: EventFilters): Promise<Event[]> {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('date', 'asc'),
  )
  const snapshot = await getDocs(q)
  const events = snapshot.docs.map((document) => docToEvent(document.id, document.data()))
  return applyFilters(events, filters)
}

export function eventsCollectionQuery(userId: string) {
  return query(
    collection(db, EVENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('date', 'asc'),
  )
}

export type SaveResultsInput = {
  time: string
  classification?: string
  notes?: string
  verified?: boolean
}

export async function saveResults(eventId: string, data: SaveResultsInput): Promise<void> {
  const event = await getEvent(eventId)
  if (!event) {
    throw new Error(i18n.t('eventDetail.notFound'))
  }

  if (event.status !== 'confirmed' && event.status !== 'completed') {
    throw new Error(i18n.t('validation.resultsNotAllowed'))
  }

  const normalizedTime = normalizeTime(data.time)
  if (!normalizedTime) {
    throw new Error('Tempo inválido.')
  }

  const pace = calculatePace(normalizedTime, event.realDistance)

  await updateEvent(eventId, {
    name: event.name,
    date: event.date,
    realDistance: event.realDistance,
    eventType: event.eventType,
    location: event.location,
    emoji: event.emoji,
    time: normalizedTime,
    pace: pace ?? undefined,
    classification: data.classification?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    resultsVerified: data.verified === true,
    status: 'completed',
  })
}

export { docToEvent }
