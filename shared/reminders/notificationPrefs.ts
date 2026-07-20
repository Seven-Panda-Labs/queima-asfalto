export const REMINDER_DAYS_OPTIONS = [1, 2, 3, 7] as const

export type ReminderDaysBefore = (typeof REMINDER_DAYS_OPTIONS)[number]

export type NotificationPrefs = {
  notificationsEnabled: boolean
  reminderDaysBefore: ReminderDaysBefore
  reminderTime: string
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  notificationsEnabled: false,
  reminderDaysBefore: 1,
  reminderTime: '08:00',
}

const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function isValidReminderTime(value: string): boolean {
  return REMINDER_TIME_PATTERN.test(value)
}

export function isReminderDaysBefore(value: unknown): value is ReminderDaysBefore {
  return typeof value === 'number' && (REMINDER_DAYS_OPTIONS as readonly number[]).includes(value)
}

export function parseNotificationPrefs(
  data: Record<string, unknown> | undefined,
): NotificationPrefs {
  if (!data) {
    return { ...DEFAULT_NOTIFICATION_PREFS }
  }

  const reminderTime =
    typeof data.reminderTime === 'string' && isValidReminderTime(data.reminderTime)
      ? data.reminderTime
      : DEFAULT_NOTIFICATION_PREFS.reminderTime

  return {
    notificationsEnabled: data.notificationsEnabled === true,
    reminderDaysBefore: isReminderDaysBefore(data.reminderDaysBefore)
      ? data.reminderDaysBefore
      : DEFAULT_NOTIFICATION_PREFS.reminderDaysBefore,
    reminderTime,
  }
}
