import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { WeightEntry } from '../types/WeightEntry'

export const WEIGHT_ENTRIES_COLLECTION = 'weightEntries'

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

export function docToWeightEntry(id: string, data: Record<string, unknown>): WeightEntry {
  return {
    id,
    userId: data.userId as string,
    date: data.date as string,
    weightKg: data.weightKg as number,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

export function weightEntriesQuery(userId: string) {
  return query(collection(db, WEIGHT_ENTRIES_COLLECTION), where('userId', '==', userId))
}

export async function createWeightEntry(userId: string, date: string, weightKg: number): Promise<string> {
  const ref = await addDoc(collection(db, WEIGHT_ENTRIES_COLLECTION), {
    userId,
    date,
    weightKg,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateWeightEntry(entryId: string, weightKg: number): Promise<void> {
  await updateDoc(doc(db, WEIGHT_ENTRIES_COLLECTION, entryId), {
    weightKg,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteWeightEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, WEIGHT_ENTRIES_COLLECTION, entryId))
}
