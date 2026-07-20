import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import i18n from '../i18n'
import type { EventType } from '../types/Event'
import type { PerformanceGoal, PerformanceGoalCreate, PerformanceGoalType } from '../types/PerformanceGoal'
import {
  normalizePerformanceGoalCreate,
  parsePerformanceGoalCreate,
} from '../types/PerformanceGoal'

const PERFORMANCE_GOALS_COLLECTION = 'performanceGoals'

function withoutUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

export function docToPerformanceGoal(id: string, data: Record<string, unknown>): PerformanceGoal {
  return {
    id,
    userId: data.userId as string,
    type: data.type as PerformanceGoalType,
    eventType: data.eventType as EventType,
    year: data.year as number,
    targetPace: (data.targetPace as string | null) ?? undefined,
    targetTime: (data.targetTime as string | null) ?? undefined,
    emoji: (data.emoji as string | null) ?? undefined,
    notes: (data.notes as string | null) ?? undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

export class DuplicatePerformanceGoalError extends Error {
  constructor() {
    super(i18n.t('errors.performanceGoalDuplicate'))
    this.name = 'DuplicatePerformanceGoalError'
  }
}

async function assertNoDuplicate(
  userId: string,
  type: PerformanceGoalType,
  eventType: EventType,
  year: number,
  excludeGoalId?: string,
): Promise<void> {
  const goals = await listPerformanceGoals(userId, year)
  const duplicate = goals.find(
    (goal) =>
      goal.type === type && goal.eventType === eventType && goal.id !== excludeGoalId,
  )
  if (duplicate) {
    throw new DuplicatePerformanceGoalError()
  }
}

export async function createPerformanceGoal(
  userId: string,
  data: PerformanceGoalCreate,
): Promise<string> {
  const parsed = parsePerformanceGoalCreate(data)
  if (!parsed) {
    throw new Error(i18n.t('errors.performanceGoalInvalidData'))
  }

  await assertNoDuplicate(userId, parsed.type, parsed.eventType, parsed.year)

  const ref = await addDoc(collection(db, PERFORMANCE_GOALS_COLLECTION), {
    userId,
    type: parsed.type,
    eventType: parsed.eventType,
    year: parsed.year,
    targetPace: parsed.targetPace ?? null,
    targetTime: parsed.targetTime ?? null,
    emoji: parsed.emoji ?? null,
    notes: parsed.notes ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePerformanceGoal(
  goalId: string,
  data: Partial<Omit<PerformanceGoal, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  const existing = await getPerformanceGoal(goalId)
  if (!existing) {
    throw new Error(i18n.t('errors.performanceGoalNotFound'))
  }

  const merged: PerformanceGoalCreate = {
    type: data.type ?? existing.type,
    eventType: data.eventType ?? existing.eventType,
    year: data.year ?? existing.year,
    targetPace: data.targetPace ?? existing.targetPace,
    targetTime: data.targetTime ?? existing.targetTime,
    emoji: data.emoji ?? existing.emoji,
    notes: data.notes ?? existing.notes,
  }

  const parsed = parsePerformanceGoalCreate(merged)
  if (!parsed) {
    throw new Error(i18n.t('errors.performanceGoalInvalidData'))
  }

  await assertNoDuplicate(
    existing.userId,
    parsed.type,
    parsed.eventType,
    parsed.year,
    goalId,
  )

  const payload = normalizePerformanceGoalCreate(parsed)
  const ref = doc(db, PERFORMANCE_GOALS_COLLECTION, goalId)
  await updateDoc(ref, {
    ...withoutUndefined(payload as Record<string, unknown>),
    targetPace: payload.targetPace ?? null,
    targetTime: payload.targetTime ?? null,
    emoji: payload.emoji ?? null,
    notes: payload.notes ?? null,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePerformanceGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db, PERFORMANCE_GOALS_COLLECTION, goalId))
}

export async function getPerformanceGoal(goalId: string): Promise<PerformanceGoal | null> {
  const snapshot = await getDoc(doc(db, PERFORMANCE_GOALS_COLLECTION, goalId))
  if (!snapshot.exists()) return null
  return docToPerformanceGoal(snapshot.id, snapshot.data())
}

export async function listPerformanceGoals(
  userId: string,
  year?: number,
): Promise<PerformanceGoal[]> {
  const snapshot = await getDocs(
    query(collection(db, PERFORMANCE_GOALS_COLLECTION), where('userId', '==', userId)),
  )
  const goals = snapshot.docs.map((document) =>
    docToPerformanceGoal(document.id, document.data()),
  )

  if (year === undefined) return goals
  return goals.filter((goal) => goal.year === year)
}

export function performanceGoalsCollectionQuery(userId: string) {
  return query(collection(db, PERFORMANCE_GOALS_COLLECTION), where('userId', '==', userId))
}
