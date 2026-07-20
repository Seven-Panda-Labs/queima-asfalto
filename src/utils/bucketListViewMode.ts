import { scopedStorageKey } from './userStorage'

const BASE_KEY = 'bucket-list-view-mode'

export type BucketListViewMode = 'lista' | 'mapa'

function storageKey(userId?: string): string {
  if (!userId) return BASE_KEY
  return scopedStorageKey(userId, BASE_KEY)
}

function isBucketListViewMode(value: string | null): value is BucketListViewMode {
  return value === 'lista' || value === 'mapa'
}

export function getBucketListViewMode(userId?: string): BucketListViewMode {
  try {
    const stored = localStorage.getItem(storageKey(userId))
    return isBucketListViewMode(stored) ? stored : 'lista'
  } catch {
    return 'lista'
  }
}

export function setBucketListViewMode(mode: BucketListViewMode, userId?: string): void {
  try {
    localStorage.setItem(storageKey(userId), mode)
  } catch {
    // ignore quota or private mode errors
  }
}
