import { scopedStorageKey } from './userStorage'

const BASE_KEY = 'events-view-mode'

export type EventsViewMode = 'lista' | 'calendario' | 'mapa'

function storageKey(userId?: string): string {
  if (!userId) return BASE_KEY
  return scopedStorageKey(userId, BASE_KEY)
}

function isEventsViewMode(value: string | null): value is EventsViewMode {
  return value === 'lista' || value === 'calendario' || value === 'mapa'
}

export function getEventsViewMode(userId?: string): EventsViewMode {
  try {
    const stored = localStorage.getItem(storageKey(userId))
    return isEventsViewMode(stored) ? stored : 'lista'
  } catch {
    return 'lista'
  }
}

export function setEventsViewMode(mode: EventsViewMode, userId?: string): void {
  try {
    localStorage.setItem(storageKey(userId), mode)
  } catch {
    // ignore quota or private mode errors
  }
}
