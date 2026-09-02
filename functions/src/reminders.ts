import { initializeApp, getApps } from 'firebase-admin/app'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import {
  computeDeadlineReminders,
  computeReminders,
  formatDeadlineBody,
  formatReminderBody,
  formatReminderTitle,
  parseNotificationPrefs,
  parseReminderLocale,
  type ReminderDeadlineEntry,
  type ReminderEvent,
} from './shared/reminders/index.js'

/**
 * The gate's own local hour, when the organiser published one.
 *
 * A window that opens at 11:00 in Tokyo opens at 03:00 in Lisbon, and printing
 * the runner's hour for somebody else's clock is how a reminder becomes a trap.
 */
function formatLocalTime(at: Date, timezone: string | undefined): string | undefined {
  if (!timezone) return undefined
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    }).format(at)
  } catch {
    // An unknown zone is data somebody typed. Say nothing rather than guess.
    return undefined
  }
}
import { scheduleFunctionOptions } from './functionOptions.js'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()
const messaging = getMessaging()

function parseTimezoneOffsetMinutes(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function parseFcmTokens(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((token): token is string => typeof token === 'string' && token.length > 0)
}

function isInvalidTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: string }).code) : ''
  return (
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/registration-token-not-registered'
  )
}

function parseReminderEvent(id: string, data: FirebaseFirestore.DocumentData): ReminderEvent | null {
  const date = data.date instanceof Timestamp ? data.date.toDate() : null
  if (!date) return null

  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Evento',
    date,
    status: typeof data.status === 'string' ? data.status : 'planned',
  }
}

function parseDeadlineEntry(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ReminderDeadlineEntry | null {
  const raceName = typeof data.raceName === 'string' ? data.raceName : ''
  const status = typeof data.entryStatus === 'string' ? data.entryStatus : ''
  if (!status) return null

  const asDate = (value: unknown): Date | undefined =>
    value instanceof Timestamp ? value.toDate() : undefined

  return {
    id,
    // The entry has no name of its own: the race it points at does, and the
    // dispatcher fills it in below.
    raceName,
    entryStatus: status,
    registrationOpensAt: asDate(data.registrationOpensAt),
    registrationClosesAt: asDate(data.registrationClosesAt),
    lotteryDrawAt: asDate(data.lotteryDrawAt),
    placeConfirmByAt: asDate(data.placeConfirmByAt),
    timezone:
      typeof data.registrationOpensTimezone === 'string'
        ? data.registrationOpensTimezone
        : undefined,
  }
}

/**
 * The names of the races an account's entries point at.
 *
 * One read per race rather than one per entry: several years of the same race
 * share a document, and a notification with no name in it is useless.
 */
async function readRaceNames(raceIds: Set<string>): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  await Promise.all(
    [...raceIds].map(async (raceId) => {
      const snapshot = await db.doc(`races/${raceId}`).get()
      const name = snapshot.data()?.name
      if (typeof name === 'string' && name.length > 0) names.set(raceId, name)
    }),
  )
  return names
}

async function pruneReminderDispatches(userId: string, currentReminderIds: Set<string>): Promise<void> {
  const dispatches = await db.collection(`users/${userId}/reminderDispatches`).get()
  const batch = db.batch()
  let pending = 0

  for (const docSnap of dispatches.docs) {
    if (!currentReminderIds.has(docSnap.id)) {
      batch.delete(docSnap.ref)
      pending += 1
    }
  }

  if (pending > 0) {
    await batch.commit()
  }
}

async function dispatchRemindersForUser(
  userId: string,
  userData: FirebaseFirestore.DocumentData,
  now: Date,
): Promise<void> {
  const prefs = parseNotificationPrefs(userData)
  if (!prefs.notificationsEnabled) return

  const tokens = parseFcmTokens(userData.fcmTokens)
  if (tokens.length === 0) return

  const locale = parseReminderLocale(userData.appLanguage)
  const timezoneOffsetMinutes = parseTimezoneOffsetMinutes(userData.timezoneOffsetMinutes)

  const eventsSnap = await db.collection('events').where('userId', '==', userId).get()
  const events = eventsSnap.docs
    .map((docSnap) => parseReminderEvent(docSnap.id, docSnap.data()))
    .filter((event): event is ReminderEvent => event !== null)

  const reminders = computeReminders(events, prefs, now, timezoneOffsetMinutes)

  const entriesSnap = await db.collection('raceEntries').where('userId', '==', userId).get()
  const raceIds = new Set(
    entriesSnap.docs
      .map((docSnap) => docSnap.data().raceId)
      .filter((raceId): raceId is string => typeof raceId === 'string'),
  )
  const raceNames = await readRaceNames(raceIds)
  const deadlineEntries = entriesSnap.docs
    .map((docSnap) => {
      const parsed = parseDeadlineEntry(docSnap.id, docSnap.data())
      if (!parsed) return null
      const raceId = docSnap.data().raceId
      const name = typeof raceId === 'string' ? raceNames.get(raceId) : undefined
      return name ? { ...parsed, raceName: name } : null
    })
    .filter((entry): entry is ReminderDeadlineEntry => entry !== null)

  const deadlineReminders = computeDeadlineReminders(
    deadlineEntries,
    prefs,
    now,
    timezoneOffsetMinutes,
  )

  const currentReminderIds = new Set([
    ...reminders.map((reminder) => reminder.id),
    ...deadlineReminders.map((reminder) => reminder.id),
  ])
  await pruneReminderDispatches(userId, currentReminderIds)

  const dueReminders = reminders.filter((reminder) => reminder.isMissed)
  if (dueReminders.length === 0 && deadlineReminders.length === 0) return

  const invalidTokens = new Set<string>()

  for (const reminder of dueReminders) {
    const dispatchRef = db.doc(`users/${userId}/reminderDispatches/${reminder.id}`)
    const existing = await dispatchRef.get()
    if (existing.exists) continue

    const title = formatReminderTitle(locale)
    const body = formatReminderBody(reminder.eventName, prefs.reminderDaysBefore, locale)
    const url = `/eventos/${reminder.eventId}/editar`
    let delivered = false

    for (const token of tokens) {
      if (invalidTokens.has(token)) continue

      try {
        await messaging.send({
          token,
          data: {
            title,
            body,
            url,
            tag: reminder.id,
          },
        })
        delivered = true
      } catch (error) {
        if (isInvalidTokenError(error)) {
          invalidTokens.add(token)
        } else {
          console.error(`Failed to send reminder ${reminder.id} to ${userId}:`, error)
        }
      }
    }

    if (delivered) {
      await dispatchRef.set({
        reminderId: reminder.id,
        sentAt: Timestamp.now(),
      })
    }
  }

  for (const reminder of deadlineReminders) {
    const dispatchRef = db.doc(`users/${userId}/reminderDispatches/${reminder.id}`)
    const existing = await dispatchRef.get()
    if (existing.exists) continue

    const title = formatReminderTitle(locale)
    const body = formatDeadlineBody(
      reminder.raceName,
      reminder.kind,
      reminder.daysBefore,
      locale,
      // The hour the organiser publishes, printed in their zone, because
      // "opens today at 11:00 JST" is the only version a runner can act on.
      reminder.daysBefore === 0 ? formatLocalTime(reminder.at, reminder.timezone) : undefined,
    )
    const url = '/bucket-list'
    let delivered = false

    for (const token of tokens) {
      if (invalidTokens.has(token)) continue
      try {
        await messaging.send({ token, data: { title, body, url, tag: reminder.id } })
        delivered = true
      } catch (error) {
        if (isInvalidTokenError(error)) {
          invalidTokens.add(token)
        } else {
          console.error(`Failed to send deadline ${reminder.id} to ${userId}:`, error)
        }
      }
    }

    if (delivered) {
      await dispatchRef.set({ reminderId: reminder.id, sentAt: Timestamp.now() })
    }
  }

  if (invalidTokens.size > 0) {
    const remainingTokens = tokens.filter((token) => !invalidTokens.has(token))
    await db.doc(`users/${userId}`).set({ fcmTokens: remainingTokens }, { merge: true })
  }
}

export const dispatchReminders = onSchedule(
  scheduleFunctionOptions('every 60 minutes'),
  async () => {
    const now = new Date()
    const usersSnap = await db.collection('users').where('notificationsEnabled', '==', true).get()

    await Promise.all(
      usersSnap.docs.map((userDoc) =>
        dispatchRemindersForUser(userDoc.id, userDoc.data(), now).catch((error) => {
          console.error(`Failed to dispatch reminders for ${userDoc.id}:`, error)
        }),
      ),
    )
  },
)
