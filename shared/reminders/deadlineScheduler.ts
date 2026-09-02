import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from './notificationPrefs.js'
import { buildReminderFireAt, getBrowserTimezoneOffsetMinutes } from './reminderScheduler.js'

/**
 * The four gates worth waking somebody for.
 *
 * Ordered by how much it costs to miss one: losing a place already won is worse
 * than missing a window that was open for six weeks.
 */
export const DEADLINE_KINDS = [
  'place_confirm',
  'registration_closes',
  'lottery_draw',
  'registration_opens',
] as const

export type DeadlineKind = (typeof DEADLINE_KINDS)[number]

/**
 * How many days before each gate to send something.
 *
 * Fixed, not configurable. A runner cannot know in advance how much warning a
 * lottery needs, and every extra switch in Settings is a decision nobody wants to
 * make. An opening is a single nudge on the day, because there is nothing to
 * prepare; a closing gets three, because the last one is the one that works.
 */
export const DEADLINE_OFFSETS: Record<DeadlineKind, number[]> = {
  place_confirm: [7, 3, 1, 0],
  registration_closes: [30, 7, 1],
  lottery_draw: [0],
  registration_opens: [0],
}

/** What the dispatcher needs to know about one attempt. */
export type ReminderDeadlineEntry = {
  id: string
  raceName: string
  entryStatus: string
  registrationOpensAt?: Date
  registrationClosesAt?: Date
  lotteryDrawAt?: Date
  placeConfirmByAt?: Date
  timezone?: string
}

export type DeadlineReminder = {
  id: string
  entryId: string
  raceName: string
  kind: DeadlineKind
  /** The gate itself, not when to send. */
  at: Date
  daysBefore: number
  fireAt: Date
  timezone?: string
}

export function buildDeadlineReminderId(
  entryId: string,
  kind: DeadlineKind,
  daysBefore: number,
): string {
  return `deadline:${entryId}:${kind}:${daysBefore}`
}

/**
 * Whether a gate is still worth mentioning for an attempt in this state.
 *
 * A registered runner does not need to hear that registration closes, and a
 * rejected one needs nothing at all. Getting this wrong is not a missing
 * notification, it is a notification that makes the app look like it has not been
 * paying attention.
 */
export function isDeadlineRelevant(entryStatus: string, kind: DeadlineKind): boolean {
  if (entryStatus === 'rejected' || entryStatus === 'declined' || entryStatus === 'missed') {
    return false
  }
  if (entryStatus === 'registered') return false

  switch (kind) {
    case 'place_confirm':
      return entryStatus === 'accepted'
    case 'lottery_draw':
      return entryStatus === 'applied'
    case 'registration_closes':
    case 'registration_opens':
      return entryStatus === 'watching'
  }
}

function dateFor(entry: ReminderDeadlineEntry, kind: DeadlineKind): Date | undefined {
  switch (kind) {
    case 'place_confirm':
      return entry.placeConfirmByAt
    case 'registration_closes':
      return entry.registrationClosesAt
    case 'lottery_draw':
      return entry.lotteryDrawAt
    case 'registration_opens':
      return entry.registrationOpensAt
  }
}

function startOfDay(date: Date, timezoneOffsetMinutes: number): number {
  const shifted = new Date(date.getTime() + timezoneOffsetMinutes * 60_000)
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
}

/**
 * Every deadline reminder that is due now and has not been sent.
 *
 * A gate whose day has passed produces nothing, which is what keeps a runner who
 * turns notifications on in September from being told about six windows that shut
 * in March. The dispatcher's idempotency record does the rest.
 */
export function computeDeadlineReminders(
  entries: readonly ReminderDeadlineEntry[],
  prefs: NotificationPrefs = DEFAULT_NOTIFICATION_PREFS,
  now: Date = new Date(),
  timezoneOffsetMinutes: number = getBrowserTimezoneOffsetMinutes(now),
): DeadlineReminder[] {
  if (!prefs.notificationsEnabled || !prefs.deadlineRemindersEnabled) return []

  const today = startOfDay(now, timezoneOffsetMinutes)
  const reminders: DeadlineReminder[] = []

  for (const entry of entries) {
    for (const kind of DEADLINE_KINDS) {
      if (!isDeadlineRelevant(entry.entryStatus, kind)) continue

      const at = dateFor(entry, kind)
      if (!at) continue
      // The gate has already passed: nothing to warn about.
      if (startOfDay(at, timezoneOffsetMinutes) < today) continue

      for (const daysBefore of DEADLINE_OFFSETS[kind]) {
        const fireAt = buildReminderFireAt(at, daysBefore, prefs.reminderTime, timezoneOffsetMinutes)
        if (!fireAt || fireAt.getTime() > now.getTime()) continue

        reminders.push({
          id: buildDeadlineReminderId(entry.id, kind, daysBefore),
          entryId: entry.id,
          raceName: entry.raceName,
          kind,
          at,
          daysBefore,
          fireAt,
          timezone: entry.timezone,
        })
      }
    }
  }

  // Soonest gate first, so the most urgent thing is sent first when several are
  // due in the same run.
  return reminders.sort((left, right) => left.at.getTime() - right.at.getTime())
}
