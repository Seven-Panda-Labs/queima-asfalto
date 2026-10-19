import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  where,
  deleteField,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { WeightDay, WeightEntry } from '../types/WeightEntry'

export const WEIGHT_ENTRIES_COLLECTION = 'weightEntries'

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

export function docToWeightEntry(id: string, data: Record<string, unknown>): WeightEntry {
  return {
    id,
    userId: data.userId as string,
    date: data.date as string,
    weightKg: typeof data.weightKg === 'number' ? data.weightKg : undefined,
    note: typeof data.note === 'string' ? data.note : undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

export function weightEntriesQuery(userId: string) {
  return query(collection(db, WEIGHT_ENTRIES_COLLECTION), where('userId', '==', userId))
}

export async function createWeightEntry(userId: string, date: string, day: WeightDay): Promise<string> {
  const ref = await addDoc(collection(db, WEIGHT_ENTRIES_COLLECTION), {
    userId,
    date,
    ...(day.weightKg !== undefined ? { weightKg: day.weightKg } : {}),
    ...(day.note !== undefined ? { note: day.note } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** Writes the day exactly as given: a field left out is removed. */
export async function updateWeightEntry(entryId: string, day: WeightDay): Promise<void> {
  await updateDoc(doc(db, WEIGHT_ENTRIES_COLLECTION, entryId), {
    weightKg: day.weightKg ?? deleteField(),
    note: day.note ?? deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteWeightEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, WEIGHT_ENTRIES_COLLECTION, entryId))
}
