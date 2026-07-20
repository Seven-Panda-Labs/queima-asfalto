import type { BucketListItem } from '../types/BucketListItem'
import type { Event } from '../types/Event'
import type { Goal } from '../types/Goal'
import type { PerformanceGoal } from '../types/PerformanceGoal'
import type { SharePermissions } from '../types/Share'

export type SharedEventsCache = {
  events: Event[]
  ownerDisplayName: string
  permissions: SharePermissions
}

export type SharedGoalsCache = {
  goals: Goal[]
  performanceGoals: PerformanceGoal[]
  events: Event[]
  ownerDisplayName: string
  permissions: SharePermissions
}

export type SharedBucketListCache = {
  items: BucketListItem[]
  ownerDisplayName: string
  canWrite: boolean
}

const eventsCache = new Map<string, SharedEventsCache>()
const goalsCache = new Map<string, SharedGoalsCache>()
const bucketListCache = new Map<string, SharedBucketListCache>()

export function getSharedEventsCache(ownerId: string): SharedEventsCache | undefined {
  return eventsCache.get(ownerId)
}

export function setSharedEventsCache(ownerId: string, entry: SharedEventsCache): void {
  eventsCache.set(ownerId, entry)
}

export function getSharedGoalsCache(ownerId: string): SharedGoalsCache | undefined {
  return goalsCache.get(ownerId)
}

export function setSharedGoalsCache(ownerId: string, entry: SharedGoalsCache): void {
  goalsCache.set(ownerId, entry)
}

export function getSharedBucketListCache(ownerId: string): SharedBucketListCache | undefined {
  return bucketListCache.get(ownerId)
}

export function setSharedBucketListCache(ownerId: string, entry: SharedBucketListCache): void {
  bucketListCache.set(ownerId, entry)
}

export function clearSharedDataCache(): void {
  eventsCache.clear()
  goalsCache.clear()
  bucketListCache.clear()
}
