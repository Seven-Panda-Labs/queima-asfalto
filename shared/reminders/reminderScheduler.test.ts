import { describe, expect, it } from 'vitest'
import { zoneOffsetMinutes } from '../raceCatalog/gates'
import { formatReminderBody, formatReminderTitle } from './reminderBody'
import {
  buildReminderFireAt,
  buildReminderId,
  computeReminders,
  isReminderEligibleEvent,
  isReminderSchedulable,
  partitionReminders,
  type ReminderEvent,
} from './reminderScheduler'

const LISBON = (date: Date) => zoneOffsetMinutes('Europe/Lisbon', date)

function makeEvent(overrides: Partial<ReminderEvent> & Pick<ReminderEvent, 'id' | 'date'>): ReminderEvent {
  return {
    name: 'Maratona de Lisboa',
    status: 'confirmed',
    ...overrides,
  }
}

describe('buildReminderFireAt', () => {
  it('fires at reminder time N days before the event in user timezone', () => {
    const eventDate = new Date(Date.UTC(2026, 5, 20, 0, 0))
    const fireAt = buildReminderFireAt(eventDate, 1, '08:00', LISBON)

    expect(fireAt?.toISOString()).toBe('2026-06-19T07:00:00.000Z')
  })

  it('takes each date at its own offset when the clocks change in between', () => {
    // 30 March 00:00 in Lisbon, summer time; two days earlier is still winter time.
    const eventDate = new Date(Date.UTC(2026, 2, 29, 23, 0))
    const fireAt = buildReminderFireAt(eventDate, 2, '08:00', LISBON)

    expect(fireAt?.toISOString()).toBe('2026-03-28T08:00:00.000Z')
  })

  it('returns null for invalid reminder time', () => {
    expect(buildReminderFireAt(new Date(2026, 5, 20), 1, '8:00', LISBON)).toBeNull()
  })
})

describe('isReminderEligibleEvent', () => {
  it('accepts future planned and confirmed events', () => {
    const now = new Date(Date.UTC(2026, 5, 15, 12, 0))
    expect(
      isReminderEligibleEvent(
        makeEvent({ id: 'a', date: new Date(Date.UTC(2026, 5, 20)), status: 'planned' }),
        now,
        LISBON,
      ),
    ).toBe(true)
    expect(
      isReminderEligibleEvent(
        makeEvent({ id: 'b', date: new Date(Date.UTC(2026, 5, 20)), status: 'confirmed' }),
        now,
        LISBON,
      ),
    ).toBe(true)
  })

  it('rejects past and non-eligible statuses', () => {
    const now = new Date(Date.UTC(2026, 5, 20, 12, 0))
    expect(
      isReminderEligibleEvent(
        makeEvent({ id: 'a', date: new Date(Date.UTC(2026, 5, 10)), status: 'confirmed' }),
        now,
        LISBON,
      ),
    ).toBe(false)
    expect(
      isReminderEligibleEvent(
        makeEvent({ id: 'b', date: new Date(Date.UTC(2026, 5, 25)), status: 'completed' }),
        now,
        LISBON,
      ),
    ).toBe(false)
  })
})

describe('computeReminders', () => {
  it('returns sorted reminders for eligible events', () => {
    const now = new Date(Date.UTC(2026, 5, 15, 12, 0))
    const reminders = computeReminders(
      [
        makeEvent({ id: 'later', date: new Date(Date.UTC(2026, 5, 25)) }),
        makeEvent({ id: 'sooner', date: new Date(Date.UTC(2026, 5, 20)) }),
      ],
      {
        notificationsEnabled: true,
        reminderDaysBefore: 1,
        reminderTime: '08:00',
        deadlineRemindersEnabled: true,
      },
      now,
      LISBON,
    )

    expect(reminders.map((reminder) => reminder.eventId)).toEqual(['sooner', 'later'])
    expect(reminders[0]?.id).toBe(buildReminderId('sooner', 1))
  })
})

describe('partitionReminders', () => {
  it('splits missed and upcoming reminders', () => {
    const missed = {
      id: 'a-1',
      eventId: 'a',
      eventName: 'A',
      eventDate: new Date(),
      fireAt: new Date(Date.UTC(2026, 5, 14, 7, 0)),
      isMissed: true,
    }
    const upcoming = {
      ...missed,
      id: 'b-1',
      eventId: 'b',
      fireAt: new Date(Date.UTC(2026, 5, 18, 7, 0)),
      isMissed: false,
    }

    expect(partitionReminders([missed, upcoming])).toEqual({
      missed: [missed],
      upcoming: [upcoming],
    })
  })
})

describe('isReminderSchedulable', () => {
  it('accepts reminders within setTimeout range', () => {
    const now = new Date(Date.UTC(2026, 5, 15, 12, 0))
    const reminder = {
      id: 'a-1',
      eventId: 'a',
      eventName: 'A',
      eventDate: new Date(),
      fireAt: new Date(now.getTime() + 60_000),
      isMissed: false,
    }

    expect(isReminderSchedulable(reminder, now)).toBe(true)
  })
})

describe('reminderBody', () => {
  it('formats pt and en bodies', () => {
    expect(formatReminderTitle('pt')).toContain('Lembrete')
    expect(formatReminderBody('Maratona', 2, 'pt')).toBe('Maratona, daqui a 2 dias')
    expect(formatReminderBody('Marathon', 1, 'en')).toBe('Marathon, tomorrow')
  })
})
