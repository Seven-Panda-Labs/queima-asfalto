import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { RaceEntry, RaceEntryCreate } from '../types/RaceEntry'
import { isEntryMethod, isEntryStatus } from '../types/RaceEntry'
import { isEventType } from '../domain/eventCodes'

const RACE_ENTRIES_COLLECTION = 'raceEntries'

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

function optionalDate(value: unknown): Date | undefined {
  const timestamp = value as Timestamp | null | undefined
  return timestamp?.toDate ? timestamp.toDate() : undefined
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function docToRaceEntry(id: string, data: Record<string, unknown>): RaceEntry {
  const method = typeof data.entryMethod === 'string' ? data.entryMethod : ''
  const status = typeof data.entryStatus === 'string' ? data.entryStatus : ''
  const discipline = typeof data.discipline === 'string' ? data.discipline : ''

  return {
    id,
    userId: data.userId as string,
    raceId: data.raceId as string,
    bucketListItemId: optionalString(data.bucketListItemId),
    year: typeof data.year === 'number' ? data.year : new Date().getFullYear(),
    discipline: isEventType(discipline) ? discipline : undefined,
    raceDate: optionalDate(data.raceDate),
    raceDateConfirmed: data.raceDateConfirmed === true,
    // An unknown value reads as unknown rather than throwing: a document written
    // by a newer version must not break an older client.
    entryMethod: isEntryMethod(method) ? method : 'unknown',
    entryStatus: isEntryStatus(status) ? status : 'watching',
    registrationOpensAt: optionalDate(data.registrationOpensAt),
    registrationOpensTimezone: optionalString(data.registrationOpensTimezone),
    registrationClosesAt: optionalDate(data.registrationClosesAt),
    lotteryDrawAt: optionalDate(data.lotteryDrawAt),
    placeConfirmByAt: optionalDate(data.placeConfirmByAt),
    registrationUrl: optionalString(data.registrationUrl),
    fee: typeof data.fee === 'number' ? data.fee : undefined,
    feeCurrency: optionalString(data.feeCurrency),
    checklist: Array.isArray(data.checklist)
      ? data.checklist
          .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
          .map((entry) => ({
            label: typeof entry.label === 'string' ? entry.label : '',
            done: entry.done === true,
          }))
      : undefined,
    rolledOverFrom: optionalString(data.rolledOverFrom),
    eventId: optionalString(data.eventId),
    notes: optionalString(data.notes),
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

/** Firestore rejects `undefined`, and a cleared field has to become `null`. */
function toDocument(data: Partial<RaceEntryCreate>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  const keys: (keyof RaceEntryCreate)[] = [
    'raceId',
    'bucketListItemId',
    'year',
    'discipline',
    'raceDate',
    'entryMethod',
    'entryStatus',
    'registrationOpensAt',
    'registrationOpensTimezone',
    'registrationClosesAt',
    'lotteryDrawAt',
    'placeConfirmByAt',
    'registrationUrl',
    'fee',
    'feeCurrency',
    'checklist',
    'rolledOverFrom',
    'eventId',
    'notes',
  ]

  for (const key of keys) {
    if (!(key in data)) continue
    const value = data[key]
    payload[key] = value === undefined ? null : value
  }
  if ('raceDateConfirmed' in data) {
    payload.raceDateConfirmed = data.raceDateConfirmed === true
  }

  return payload
}

export async function createRaceEntry(userId: string, data: RaceEntryCreate): Promise<string> {
  const ref = await addDoc(collection(db, RACE_ENTRIES_COLLECTION), {
    userId,
    raceDateConfirmed: data.raceDateConfirmed === true,
    ...toDocument(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRaceEntry(
  entryId: string,
  data: Partial<RaceEntryCreate>,
): Promise<void> {
  await updateDoc(doc(db, RACE_ENTRIES_COLLECTION, entryId), {
    ...toDocument(data),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteRaceEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, RACE_ENTRIES_COLLECTION, entryId))
}

export async function listRaceEntries(userId: string): Promise<RaceEntry[]> {
  const snapshot = await getDocs(raceEntriesCollectionQuery(userId))
  return snapshot.docs.map((document) => docToRaceEntry(document.id, document.data()))
}

/**
 * Every attempt the account owns, in no order.
 *
 * The funnel groups and sorts in memory anyway: every group is derived from
 * dates that pass on their own, so a Firestore order could not express it. It
 * used to ask for one by year regardless, and a filter plus an order needs a
 * composite index, which is a thing that can be missing or still building while
 * the page shows nothing.
 */
export function raceEntriesCollectionQuery(userId: string) {
  return query(collection(db, RACE_ENTRIES_COLLECTION), where('userId', '==', userId))
}
