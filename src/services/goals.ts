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
import type { Goal, GoalCreate } from '../types/Goal'

const GOALS_COLLECTION = 'goals'
const MAX_TARGET_COUNT = 99

function withoutUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

function docToGoal(id: string, data: Record<string, unknown>): Goal {
  return {
    id,
    userId: data.userId as string,
    eventType: data.eventType as EventType,
    targetCount: data.targetCount as number,
    year: data.year as number,
    emoji: data.emoji as string | undefined,
    notes: data.notes as string | undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  }
}

export class DuplicateGoalError extends Error {
  constructor() {
    super(i18n.t('errors.goalDuplicate'))
    this.name = 'DuplicateGoalError'
  }
}

function validateTargetCount(targetCount: number): void {
  if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > MAX_TARGET_COUNT) {
    throw new Error(i18n.t('errors.goalTargetCountRange', { max: MAX_TARGET_COUNT }))
  }
}

async function assertNoDuplicate(
  userId: string,
  eventType: EventType,
  year: number,
  excludeGoalId?: string,
): Promise<void> {
  const goals = await listGoals(userId, year)
  const duplicate = goals.find(
    (goal) => goal.eventType === eventType && goal.id !== excludeGoalId,
  )
  if (duplicate) {
    throw new DuplicateGoalError()
  }
}

export async function createGoal(userId: string, data: GoalCreate): Promise<string> {
  validateTargetCount(data.targetCount)
  await assertNoDuplicate(userId, data.eventType, data.year)

  const ref = await addDoc(collection(db, GOALS_COLLECTION), {
    userId,
    eventType: data.eventType,
    targetCount: data.targetCount,
    year: data.year,
    emoji: data.emoji ?? null,
    notes: data.notes ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateGoal(
  goalId: string,
  data: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  if (data.targetCount !== undefined) {
    validateTargetCount(data.targetCount)
  }

  const existing = await getGoal(goalId)
  if (!existing) {
    throw new Error(i18n.t('errors.goalNotFound'))
  }

  const nextEventType = data.eventType ?? existing.eventType
  const nextYear = data.year ?? existing.year
  await assertNoDuplicate(existing.userId, nextEventType, nextYear, goalId)

  const ref = doc(db, GOALS_COLLECTION, goalId)
  await updateDoc(ref, {
    ...withoutUndefined(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db, GOALS_COLLECTION, goalId))
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const snapshot = await getDoc(doc(db, GOALS_COLLECTION, goalId))
  if (!snapshot.exists()) return null
  return docToGoal(snapshot.id, snapshot.data())
}

export async function listGoals(userId: string, year?: number): Promise<Goal[]> {
  const snapshot = await getDocs(
    query(collection(db, GOALS_COLLECTION), where('userId', '==', userId)),
  )
  const goals = snapshot.docs.map((document) => docToGoal(document.id, document.data()))

  if (year === undefined) return goals
  return goals.filter((goal) => goal.year === year)
}

export function goalsCollectionQuery(userId: string) {
  return query(collection(db, GOALS_COLLECTION), where('userId', '==', userId))
}

export { docToGoal }
