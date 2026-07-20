import type { Reminder } from '../utils/reminderScheduler'
import { scopedStorageKey } from '../utils/userStorage'

const LEGACY_STORAGE_KEY = 'queima-asfalto-shown-reminders'

export function reminderQueueStorageKey(userId?: string): string {
  if (!userId) return LEGACY_STORAGE_KEY
  return scopedStorageKey(userId, 'shown-reminders')
}

function readIds(storage: Storage, key: string): string[] {
  try {
    const raw = storage.getItem(key)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

function writeIds(storage: Storage, key: string, ids: string[]): void {
  storage.setItem(key, JSON.stringify(ids))
}

export function getShownReminderIds(
  storage: Storage = localStorage,
  key: string = LEGACY_STORAGE_KEY,
): Set<string> {
  return new Set(readIds(storage, key))
}

export function markReminderShown(
  id: string,
  storage: Storage = localStorage,
  key: string = LEGACY_STORAGE_KEY,
): void {
  const shown = getShownReminderIds(storage, key)
  shown.add(id)
  writeIds(storage, key, [...shown])
}

export function filterUnshownReminders(
  reminders: Reminder[],
  storage: Storage = localStorage,
  key: string = LEGACY_STORAGE_KEY,
): Reminder[] {
  const shown = getShownReminderIds(storage, key)
  return reminders.filter((reminder) => !shown.has(reminder.id))
}

export function pruneShownReminderIds(
  validIds: Iterable<string>,
  storage: Storage = localStorage,
  key: string = LEGACY_STORAGE_KEY,
): void {
  const valid = new Set(validIds)
  const pruned = [...getShownReminderIds(storage, key)].filter((id) => valid.has(id))
  writeIds(storage, key, pruned)
}
