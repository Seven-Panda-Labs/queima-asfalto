import { describe, expect, it, beforeEach } from 'vitest'
import type { Reminder } from '../utils/reminderScheduler'
import {
  filterUnshownReminders,
  getShownReminderIds,
  markReminderShown,
  pruneShownReminderIds,
} from './reminderQueue'

function makeReminder(id: string): Reminder {
  return {
    id,
    eventId: id.split('-')[0] ?? id,
    eventName: 'Test',
    eventDate: new Date(2026, 5, 20),
    fireAt: new Date(2026, 5, 19, 8, 0),
    isMissed: false,
  }
}

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

describe('reminderQueue', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('starts empty', () => {
    expect(getShownReminderIds(storage).size).toBe(0)
  })

  it('marks reminders as shown', () => {
    markReminderShown('event-1', storage)
    expect(getShownReminderIds(storage).has('event-1')).toBe(true)
  })

  it('filters out already shown reminders', () => {
    markReminderShown('a-1', storage)
    const reminders = [makeReminder('a-1'), makeReminder('b-1')]

    expect(filterUnshownReminders(reminders, storage).map((reminder) => reminder.id)).toEqual(['b-1'])
  })

  it('prunes stale shown ids', () => {
    markReminderShown('a-1', storage)
    markReminderShown('b-1', storage)

    pruneShownReminderIds(new Set(['a-1']), storage)

    expect([...getShownReminderIds(storage)]).toEqual(['a-1'])
  })
})
