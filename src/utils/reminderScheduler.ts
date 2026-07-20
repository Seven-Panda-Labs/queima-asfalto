import i18n from '../i18n'
import {
  formatReminderBody as formatReminderBodyForLocale,
  parseReminderLocale,
} from '../../shared/reminders/reminderBody'
import type { Reminder } from '../../shared/reminders/reminderScheduler'

export {
  MAX_SET_TIMEOUT_MS,
  buildReminderFireAt,
  buildReminderId,
  computeReminders,
  getReminderDelayMs,
  isReminderEligibleEvent,
  isReminderSchedulable,
  parseReminderTime,
  partitionReminders,
  type Reminder,
} from '../../shared/reminders/reminderScheduler'

export function formatReminderBody(reminder: Reminder, daysBefore: number): string {
  return formatReminderBodyForLocale(
    reminder.eventName,
    daysBefore,
    parseReminderLocale(i18n.language),
  )
}
