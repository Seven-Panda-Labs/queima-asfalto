import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import type { Event } from '../types/Event'
import { DEFAULT_NOTIFICATION_PREFS } from '../types/NotificationPrefs'
import {
  buildReminderFireAt,
  buildReminderId,
  computeReminders,
  formatReminderBody,
  isReminderEligibleEvent,
  isReminderSchedulable,
  partitionReminders,
} from './reminderScheduler'

function makeEvent(overrides: Partial<Event> & Pick<Event, 'id' | 'date'>): Event {
  const now = new Date()
  return {
    userId: 'user-1',
    name: 'Maratona de Lisboa',
    realDistance: 42.2,
    eventType: 'km_42_2',
    location: 'Lisboa',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('buildReminderFireAt', () => {
  it('fires at reminder time N days before the event', () => {
    const eventDate = new Date(2026, 5, 20)
    const fireAt = buildReminderFireAt(eventDate, 1, '08:00')

    expect(fireAt).toEqual(new Date(2026, 5, 19, 8, 0, 0, 0))
  })

  it('returns null for invalid reminder time', () => {
    expect(buildReminderFireAt(new Date(2026, 5, 20), 1, '8:00')).toBeNull()
  })
})

describe('isReminderEligibleEvent', () => {
  it('accepts future Planeado and Confirmado events', () => {
    const today = new Date(2026, 5, 15)
    expect(
      isReminderEligibleEvent(makeEvent({ id: 'a', date: new Date(2026, 5, 20), status: 'planned' }), today),
    ).toBe(true)
    expect(
      isReminderEligibleEvent(
        makeEvent({ id: 'b', date: new Date(2026, 5, 20), status: 'confirmed' }),
        today,
      ),
    ).toBe(true)
  })

  it('rejects past or non-scheduled statuses', () => {
    const today = new Date(2026, 5, 15)
    expect(
      isReminderEligibleEvent(makeEvent({ id: 'a', date: new Date(2026, 5, 10), status: 'confirmed' }), today),
    ).toBe(false)
    expect(
      isReminderEligibleEvent(makeEvent({ id: 'b', date: new Date(2026, 5, 20), status: 'completed' }), today),
    ).toBe(false)
  })
})

describe('computeReminders', () => {
  it('returns empty list when notifications are disabled', () => {
    const now = new Date(2026, 5, 15, 10, 0)
    const events = [makeEvent({ id: 'a', date: new Date(2026, 5, 20) })]

    expect(
      computeReminders(events, { ...DEFAULT_NOTIFICATION_PREFS, notificationsEnabled: false }, now),
    ).toEqual([])
  })

  it('marks reminders in the past as missed', () => {
    const now = new Date(2026, 5, 19, 9, 0)
    const events = [makeEvent({ id: 'a', date: new Date(2026, 5, 20) })]
    const prefs = { ...DEFAULT_NOTIFICATION_PREFS, notificationsEnabled: true, reminderDaysBefore: 1 as const }

    const reminders = computeReminders(events, prefs, now)

    expect(reminders).toHaveLength(1)
    expect(reminders[0].isMissed).toBe(true)
    expect(reminders[0].id).toBe(buildReminderId('a', 1))
  })

  it('marks future reminders as upcoming', () => {
    const now = new Date(2026, 5, 15, 10, 0)
    const events = [makeEvent({ id: 'a', date: new Date(2026, 5, 20) })]
    const prefs = { ...DEFAULT_NOTIFICATION_PREFS, notificationsEnabled: true, reminderDaysBefore: 1 as const }

    const { upcoming, missed } = partitionReminders(computeReminders(events, prefs, now))

    expect(missed).toHaveLength(0)
    expect(upcoming).toHaveLength(1)
    expect(isReminderSchedulable(upcoming[0], now)).toBe(true)
  })
})

describe('formatReminderBody', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('pt')
  })

  it('formats reminder message in Portuguese', () => {
    const reminder = {
      id: 'a-1',
      eventId: 'a',
      eventName: 'Meia de Porto',
      eventDate: new Date(2026, 5, 20),
      fireAt: new Date(2026, 5, 19, 8, 0),
      isMissed: false,
    }

    expect(formatReminderBody(reminder, 1)).toBe('Meia de Porto — amanhã')
    expect(formatReminderBody(reminder, 3)).toBe('Meia de Porto — daqui a 3 dias')
  })
})
