import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NOTIFICATION_PREFS,
  isValidReminderTime,
  parseNotificationPrefs,
} from './notificationPrefs'

describe('parseNotificationPrefs', () => {
  it('returns defaults when data is undefined', () => {
    expect(parseNotificationPrefs(undefined)).toEqual(DEFAULT_NOTIFICATION_PREFS)
  })

  it('parses valid prefs from Firestore data', () => {
    expect(
      parseNotificationPrefs({
        notificationsEnabled: true,
        reminderDaysBefore: 3,
        reminderTime: '09:30',
      }),
    ).toEqual({
      notificationsEnabled: true,
      reminderDaysBefore: 3,
      reminderTime: '09:30',
      // Absent in the document, and on: an account that predates the field gets
      // the deadlines it never had a chance to ask for.
      deadlineRemindersEnabled: true,
    })
  })

  it('reads an explicit no as a no, and anything else as a yes', () => {
    expect(
      parseNotificationPrefs({ notificationsEnabled: true, deadlineRemindersEnabled: false })
        .deadlineRemindersEnabled,
    ).toBe(false)
    expect(
      parseNotificationPrefs({ notificationsEnabled: true }).deadlineRemindersEnabled,
    ).toBe(true)
  })

  it('falls back to defaults for invalid values', () => {
    expect(
      parseNotificationPrefs({
        notificationsEnabled: 'yes',
        reminderDaysBefore: 5,
        reminderTime: '25:99',
      }),
    ).toEqual(DEFAULT_NOTIFICATION_PREFS)
  })
})

describe('isValidReminderTime', () => {
  it('accepts HH:mm between 00:00 and 23:59', () => {
    expect(isValidReminderTime('08:00')).toBe(true)
    expect(isValidReminderTime('23:59')).toBe(true)
  })

  it('rejects invalid times', () => {
    expect(isValidReminderTime('8:00')).toBe(false)
    expect(isValidReminderTime('24:00')).toBe(false)
  })
})
