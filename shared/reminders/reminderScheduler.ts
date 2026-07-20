import {
  DEFAULT_NOTIFICATION_PREFS,
  isValidReminderTime,
  type NotificationPrefs,
} from './notificationPrefs.js'

export type ReminderEvent = {
  id: string
  name: string
  date: Date
  status: string
}

export type Reminder = {
  id: string
  eventId: string
  eventName: string
  eventDate: Date
  fireAt: Date
  isMissed: boolean
}

export const MAX_SET_TIMEOUT_MS = 2_147_483_647

export function getBrowserTimezoneOffsetMinutes(date: Date = new Date()): number {
  return -date.getTimezoneOffset()
}

function calendarDateParts(
  date: Date,
  timezoneOffsetMinutes: number,
): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + timezoneOffsetMinutes * 60_000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  }
}

function utcFromLocalDateTime(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timezoneOffsetMinutes: number,
): Date {
  return new Date(
    Date.UTC(year, month, day, hours, minutes) - timezoneOffsetMinutes * 60_000,
  )
}

function startOfCalendarDay(date: Date, timezoneOffsetMinutes: number): Date {
  const { year, month, day } = calendarDateParts(date, timezoneOffsetMinutes)
  return utcFromLocalDateTime(year, month, day, 0, 0, timezoneOffsetMinutes)
}

function subtractCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number,
): { year: number; month: number; day: number } {
  const shifted = new Date(Date.UTC(year, month, day))
  shifted.setUTCDate(shifted.getUTCDate() - days)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  }
}

export function parseReminderTime(reminderTime: string): { hours: number; minutes: number } | null {
  if (!isValidReminderTime(reminderTime)) return null

  const [hours, minutes] = reminderTime.split(':').map(Number)
  return { hours, minutes }
}

export function buildReminderId(eventId: string, daysBefore: number): string {
  return `${eventId}-${daysBefore}`
}

export function buildReminderFireAt(
  eventDate: Date,
  daysBefore: number,
  reminderTime: string,
  timezoneOffsetMinutes: number = getBrowserTimezoneOffsetMinutes(),
): Date | null {
  const timeParts = parseReminderTime(reminderTime)
  if (!timeParts) return null

  const eventDay = calendarDateParts(eventDate, timezoneOffsetMinutes)
  const reminderDay = subtractCalendarDays(
    eventDay.year,
    eventDay.month,
    eventDay.day,
    daysBefore,
  )

  return utcFromLocalDateTime(
    reminderDay.year,
    reminderDay.month,
    reminderDay.day,
    timeParts.hours,
    timeParts.minutes,
    timezoneOffsetMinutes,
  )
}

export function isReminderEligibleEvent(
  event: ReminderEvent,
  now: Date = new Date(),
  timezoneOffsetMinutes: number = getBrowserTimezoneOffsetMinutes(now),
): boolean {
  if (event.status !== 'planned' && event.status !== 'confirmed') {
    return false
  }

  return (
    startOfCalendarDay(event.date, timezoneOffsetMinutes).getTime() >=
    startOfCalendarDay(now, timezoneOffsetMinutes).getTime()
  )
}

export function computeReminders(
  events: ReminderEvent[],
  prefs: NotificationPrefs = DEFAULT_NOTIFICATION_PREFS,
  now: Date = new Date(),
  timezoneOffsetMinutes: number = getBrowserTimezoneOffsetMinutes(now),
): Reminder[] {
  if (!prefs.notificationsEnabled) {
    return []
  }

  const reminders: Reminder[] = []

  for (const event of events) {
    if (!isReminderEligibleEvent(event, now, timezoneOffsetMinutes)) continue

    const fireAt = buildReminderFireAt(
      event.date,
      prefs.reminderDaysBefore,
      prefs.reminderTime,
      timezoneOffsetMinutes,
    )
    if (!fireAt) continue

    reminders.push({
      id: buildReminderId(event.id, prefs.reminderDaysBefore),
      eventId: event.id,
      eventName: event.name,
      eventDate: startOfCalendarDay(event.date, timezoneOffsetMinutes),
      fireAt,
      isMissed: fireAt.getTime() <= now.getTime(),
    })
  }

  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
}

export function partitionReminders(reminders: Reminder[]): {
  missed: Reminder[]
  upcoming: Reminder[]
} {
  return {
    missed: reminders.filter((reminder) => reminder.isMissed),
    upcoming: reminders.filter((reminder) => !reminder.isMissed),
  }
}

export function getReminderDelayMs(reminder: Reminder, now: Date = new Date()): number {
  return reminder.fireAt.getTime() - now.getTime()
}

export function isReminderSchedulable(reminder: Reminder, now: Date = new Date()): boolean {
  const delay = getReminderDelayMs(reminder, now)
  return delay > 0 && delay <= MAX_SET_TIMEOUT_MS
}
