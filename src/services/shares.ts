import { httpsCallable } from 'firebase/functions'
import { parseSharePermissions } from '../../shared/shares/permissions'
import type { BucketListItemCreate } from '../types/BucketListItem'
import type { Event } from '../types/Event'
import type { Goal } from '../types/Goal'
import type { PerformanceGoal, PerformanceGoalType } from '../types/PerformanceGoal'
import type { Share, ShareList, SharePermissions, SharedDataSection } from '../types/Share'
import { normalizeEventStatus, normalizeEventType } from '../domain/eventCodes'
import { normalizeBucketListDisciplines } from '../utils/bucketListDisciplines'
import { parseFirestoreTimestamp } from '../utils/firestoreTimestamp'
import { functions } from './firebase'

type SerializedShare = Omit<Share, 'createdAt' | 'updatedAt' | 'revokedAt'> & {
  createdAt: string
  updatedAt: string
  revokedAt?: string
}

type ShareListResponse = {
  sent: SerializedShare[]
  received: SerializedShare[]
}

type SharedSnapshotResponse = {
  ownerId: string
  ownerDisplayName: string
  permissions: SharePermissions
  events?: Record<string, unknown>[]
  bucketList?: Record<string, unknown>[]
  goals?: Record<string, unknown>[]
  performanceGoals?: Record<string, unknown>[]
}

function parseShare(data: SerializedShare): Share {
  return {
    ...data,
    permissions: parseSharePermissions(data.permissions),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    revokedAt: data.revokedAt ? new Date(data.revokedAt) : undefined,
  }
}

function parseTimestamp(value: unknown): Date {
  return parseFirestoreTimestamp(value)
}

function parseSharedGoal(data: Record<string, unknown>): Goal {
  return {
    id: String(data.id),
    userId: String(data.userId),
    eventType: normalizeEventType(String(data.eventType)),
    targetCount: Number(data.targetCount),
    year: Number(data.year),
    emoji: typeof data.emoji === 'string' ? data.emoji : undefined,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  }
}

function parseSharedPerformanceGoal(data: Record<string, unknown>): PerformanceGoal {
  return {
    id: String(data.id),
    userId: String(data.userId),
    type: data.type as PerformanceGoalType,
    eventType: normalizeEventType(String(data.eventType)),
    year: Number(data.year),
    targetPace: typeof data.targetPace === 'string' ? data.targetPace : undefined,
    targetTime: typeof data.targetTime === 'string' ? data.targetTime : undefined,
    emoji: typeof data.emoji === 'string' ? data.emoji : undefined,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  }
}

function parseSharedEvent(data: Record<string, unknown>): Event {
  const dateValue = data.date
  const date = parseTimestamp(dateValue)

  return {
    id: String(data.id),
    userId: String(data.userId),
    name: String(data.name),
    date,
    realDistance: Number(data.realDistance),
    eventType: normalizeEventType(String(data.eventType)),
    location: String(data.location ?? ''),
    locationLat: typeof data.locationLat === 'number' ? data.locationLat : undefined,
    locationLng: typeof data.locationLng === 'number' ? data.locationLng : undefined,
    status: normalizeEventStatus(String(data.status)),
    emoji: typeof data.emoji === 'string' ? data.emoji : undefined,
    time: typeof data.time === 'string' ? data.time : undefined,
    pace: typeof data.pace === 'string' ? data.pace : undefined,
    classification: typeof data.classification === 'string' ? data.classification : undefined,
    resultsVerified: data.resultsVerified === true,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  }
}

function parseSharedBucketListItem(data: Record<string, unknown>) {
  const createdAt = parseTimestamp(data.createdAt)
  const updatedAt = parseTimestamp(data.updatedAt)

  return {
    id: String(data.id),
    userId: String(data.userId),
    name: String(data.name),
    location: String(data.location ?? ''),
    locationLat: typeof data.locationLat === 'number' ? data.locationLat : undefined,
    locationLng: typeof data.locationLng === 'number' ? data.locationLng : undefined,
    realDistance: Number(data.realDistance),
    disciplines: normalizeBucketListDisciplines(data),
    targetMonth: typeof data.targetMonth === 'string' ? data.targetMonth : undefined,
    link: typeof data.link === 'string' ? data.link : undefined,
    emoji: typeof data.emoji === 'string' ? data.emoji : undefined,
    createdAt,
    updatedAt,
  }
}

export async function inviteShare(
  granteeEmail: string,
  permissions: SharePermissions,
): Promise<Share> {
  const callable = httpsCallable<
    { granteeEmail: string; permissions: SharePermissions },
    SerializedShare
  >(functions, 'inviteShare')
  const result = await callable({ granteeEmail, permissions })
  return parseShare(result.data)
}

export async function acceptShare(shareId: string): Promise<Share> {
  const callable = httpsCallable<{ shareId: string }, SerializedShare>(functions, 'acceptShare')
  const result = await callable({ shareId })
  return parseShare(result.data)
}

export async function declineShare(shareId: string): Promise<void> {
  const callable = httpsCallable<{ shareId: string }, { success: boolean }>(functions, 'declineShare')
  await callable({ shareId })
}

export async function revokeShare(shareId: string): Promise<void> {
  const callable = httpsCallable<{ shareId: string }, { success: boolean }>(functions, 'revokeShare')
  await callable({ shareId })
}

export async function updateSharePermissions(
  shareId: string,
  permissions: SharePermissions,
): Promise<Share> {
  const callable = httpsCallable<
    { shareId: string; permissions: SharePermissions },
    SerializedShare
  >(functions, 'updateSharePermissions')
  const result = await callable({ shareId, permissions })
  return parseShare(result.data)
}

export async function listShares(): Promise<ShareList> {
  const callable = httpsCallable<Record<string, never>, ShareListResponse>(functions, 'listShares')
  const result = await callable({})
  return {
    sent: result.data.sent.map(parseShare),
    received: result.data.received.map(parseShare),
  }
}

export async function fetchSharedSnapshot(
  ownerId: string,
  sections: SharedDataSection[],
): Promise<{
  ownerId: string
  ownerDisplayName: string
  permissions: SharePermissions
  events: Event[]
  bucketList: ReturnType<typeof parseSharedBucketListItem>[]
  goals: Goal[]
  performanceGoals: PerformanceGoal[]
}> {
  const callable = httpsCallable<
    { ownerId: string; sections: SharedDataSection[] },
    SharedSnapshotResponse
  >(functions, 'getSharedSnapshot')
  const result = await callable({ ownerId, sections })
  return {
    ownerId: result.data.ownerId,
    ownerDisplayName: result.data.ownerDisplayName,
    permissions: parseSharePermissions(result.data.permissions),
    events: (result.data.events ?? []).map(parseSharedEvent),
    bucketList: (result.data.bucketList ?? []).map(parseSharedBucketListItem),
    goals: (result.data.goals ?? []).map(parseSharedGoal),
    performanceGoals: (result.data.performanceGoals ?? []).map(parseSharedPerformanceGoal),
  }
}

export async function createSharedBucketListItem(
  ownerId: string,
  item: BucketListItemCreate,
): Promise<ReturnType<typeof parseSharedBucketListItem>> {
  const callable = httpsCallable<
    { ownerId: string; item: BucketListItemCreate },
    Record<string, unknown>
  >(functions, 'createSharedBucketListItem')
  const result = await callable({ ownerId, item })
  return parseSharedBucketListItem(result.data)
}

export async function updateSharedBucketListItem(
  ownerId: string,
  itemId: string,
  patch: Partial<BucketListItemCreate>,
): Promise<ReturnType<typeof parseSharedBucketListItem>> {
  const callable = httpsCallable<
    { ownerId: string; itemId: string; patch: Partial<BucketListItemCreate> },
    Record<string, unknown>
  >(functions, 'updateSharedBucketListItem')
  const result = await callable({ ownerId, itemId, patch })
  return parseSharedBucketListItem(result.data)
}

export async function deleteSharedBucketListItem(ownerId: string, itemId: string): Promise<void> {
  const callable = httpsCallable<{ ownerId: string; itemId: string }, { success: boolean }>(
    functions,
    'deleteSharedBucketListItem',
  )
  await callable({ ownerId, itemId })
}
