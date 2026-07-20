import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NOTIFICATION_PREFS,
  isValidReminderTime,
  parseNotificationPrefs,
} from './NotificationPrefs'

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
    })
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
