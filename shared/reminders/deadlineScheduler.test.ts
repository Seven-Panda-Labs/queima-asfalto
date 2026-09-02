import { describe, expect, it } from 'vitest'
import type { NotificationPrefs } from './notificationPrefs.js'
import {
  buildDeadlineReminderId,
  computeDeadlineReminders,
  isDeadlineRelevant,
  type ReminderDeadlineEntry,
} from './deadlineScheduler.js'

const LISBON_SUMMER_OFFSET = 60
const NOW = new Date(Date.UTC(2026, 8, 2, 9, 0))

const prefs: NotificationPrefs = {
  notificationsEnabled: true,
  reminderDaysBefore: 1,
  reminderTime: '08:00',
  deadlineRemindersEnabled: true,
}

const day = 24 * 60 * 60 * 1000
const inDays = (count: number) => new Date(NOW.getTime() + count * day)

function entry(overrides: Partial<ReminderDeadlineEntry> = {}): ReminderDeadlineEntry {
  return {
    id: 'entry-1',
    raceName: 'Berlin Marathon',
    entryStatus: 'watching',
    ...overrides,
  }
}

function compute(entries: ReminderDeadlineEntry[], overrides: Partial<NotificationPrefs> = {}) {
  return computeDeadlineReminders(
    entries,
    { ...prefs, ...overrides },
    NOW,
    LISBON_SUMMER_OFFSET,
  )
}

describe('isDeadlineRelevant', () => {
  it('says nothing to somebody who is already in', () => {
    expect(isDeadlineRelevant('registered', 'registration_closes')).toBe(false)
  })

  it('says nothing about a race that is over for this year', () => {
    for (const status of ['rejected', 'declined', 'missed']) {
      expect(isDeadlineRelevant(status, 'registration_opens')).toBe(false)
    }
  })

  it('matches each gate to the state that is waiting for it', () => {
    expect(isDeadlineRelevant('watching', 'registration_opens')).toBe(true)
    expect(isDeadlineRelevant('watching', 'registration_closes')).toBe(true)
    expect(isDeadlineRelevant('applied', 'lottery_draw')).toBe(true)
    expect(isDeadlineRelevant('accepted', 'place_confirm')).toBe(true)
    // A runner waiting for a draw does not need to hear about the window that
    // already took their application.
    expect(isDeadlineRelevant('applied', 'registration_closes')).toBe(false)
  })
})

describe('computeDeadlineReminders', () => {
  it('sends nothing when notifications are off', () => {
    expect(compute([entry({ registrationOpensAt: NOW })], { notificationsEnabled: false })).toEqual([])
  })

  it('sends nothing when deadlines are switched off on their own', () => {
    expect(compute([entry({ registrationOpensAt: NOW })], { deadlineRemindersEnabled: false })).toEqual(
      [],
    )
  })

  it('nudges once on the day a window opens', () => {
    const reminders = compute([entry({ registrationOpensAt: NOW })])
    expect(reminders).toHaveLength(1)
    expect(reminders[0]!.kind).toBe('registration_opens')
    expect(reminders[0]!.daysBefore).toBe(0)
    expect(reminders[0]!.id).toBe(buildDeadlineReminderId('entry-1', 'registration_opens', 0))
  })

  it('says nothing before the day a window opens', () => {
    expect(compute([entry({ registrationOpensAt: inDays(3) })])).toEqual([])
  })

  it('warns about a closing at thirty days, seven, and one, cumulatively', () => {
    // Seven days out, the thirty and seven day reminders are both due, and the
    // dispatcher's record is what stops the thirty day one being sent twice.
    const reminders = compute([entry({ registrationClosesAt: inDays(7) })])
    expect(reminders.map((reminder) => reminder.daysBefore).sort((a, b) => b - a)).toEqual([30, 7])
  })

  it('goes quiet once the gate has passed', () => {
    expect(compute([entry({ registrationClosesAt: inDays(-1) })])).toEqual([])
    expect(compute([entry({ registrationOpensAt: inDays(-5) })])).toEqual([])
  })

  it('warns four times about a place that has to be secured', () => {
    const reminders = compute([
      entry({ entryStatus: 'accepted', placeConfirmByAt: NOW }),
    ])
    expect(reminders.map((reminder) => reminder.daysBefore).sort((a, b) => b - a)).toEqual([
      7, 3, 1, 0,
    ])
  })

  it('puts the soonest gate first when several are due at once', () => {
    const reminders = compute([
      entry({ id: 'far', raceName: 'Far', registrationClosesAt: inDays(20) }),
      entry({ id: 'near', raceName: 'Near', registrationClosesAt: inDays(2) }),
    ])
    expect(reminders[0]!.entryId).toBe('near')
  })

  it('carries the race name and the organiser time zone through', () => {
    const reminders = compute([
      entry({ registrationOpensAt: NOW, timezone: 'Asia/Tokyo', raceName: 'Tokyo Marathon' }),
    ])
    expect(reminders[0]!.raceName).toBe('Tokyo Marathon')
    expect(reminders[0]!.timezone).toBe('Asia/Tokyo')
  })
})
