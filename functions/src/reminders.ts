import { initializeApp, getApps } from 'firebase-admin/app'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import {
  computeReminders,
  formatReminderBody,
  formatReminderTitle,
  parseNotificationPrefs,
  parseReminderLocale,
  type ReminderEvent,
} from './shared/reminders/index.js'
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
  const currentReminderIds = new Set(reminders.map((reminder) => reminder.id))
  await pruneReminderDispatches(userId, currentReminderIds)

  const dueReminders = reminders.filter((reminder) => reminder.isMissed)
  if (dueReminders.length === 0) return

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
