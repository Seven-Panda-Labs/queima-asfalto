import { arrayRemove, arrayUnion, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { detectInitialLanguage } from '../i18n'
import { getBrowserTimezoneOffsetMinutes } from '../../shared/reminders/reminderScheduler'
import { db } from './firebase'

function requireVapidKey(): string {
  const value = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!value) {
    throw new Error(
      'Missing VITE_FIREBASE_VAPID_KEY. Generate a Web Push certificate in Firebase Console → Project settings → Cloud Messaging.',
    )
  }
  return value
}

async function getMessagingApi() {
  const [{ getMessaging, getToken, deleteToken, isSupported }, { app: messagingApp }] =
    await Promise.all([import('firebase/messaging'), import('./firebase')])

  if (!(await isSupported())) {
    return null
  }

  return {
    messaging: getMessaging(messagingApp),
    getToken,
    deleteToken,
  }
}

export async function registerPushNotifications(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  const messagingApi = await getMessagingApi()
  if (!messagingApi) return false

  const registration = await navigator.serviceWorker.ready
  const token = await messagingApi.getToken(messagingApi.messaging, {
    vapidKey: requireVapidKey(),
    serviceWorkerRegistration: registration,
  })

  if (!token) return false

  const language = detectInitialLanguage(userId)
  await setDoc(
    doc(db, 'users', userId),
    {
      fcmTokens: arrayUnion(token),
      appLanguage: language,
      timezoneOffsetMinutes: getBrowserTimezoneOffsetMinutes(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return true
}

export async function unregisterPushNotifications(
  userId: string,
  tokenToRemove?: string,
): Promise<void> {
  let token = tokenToRemove

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const messagingApi = await getMessagingApi()

    if (messagingApi) {
      if (!token) {
        try {
          const registration = await navigator.serviceWorker.ready
          token =
            (await messagingApi.getToken(messagingApi.messaging, {
              vapidKey: requireVapidKey(),
              serviceWorkerRegistration: registration,
            })) || undefined
        } catch {
          token = undefined
        }
      }

      if (token) {
        try {
          await messagingApi.deleteToken(messagingApi.messaging)
        } catch {
          // Token may already be invalid on this device.
        }
      }
    }
  }

  if (token) {
    await setDoc(
      doc(db, 'users', userId),
      {
        fcmTokens: arrayRemove(token),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }
}

export async function syncPushNotifications(
  userId: string,
  notificationsEnabled: boolean,
): Promise<void> {
  if (!notificationsEnabled || Notification.permission !== 'granted') {
    await unregisterPushNotifications(userId)
    return
  }

  try {
    await registerPushNotifications(userId)
  } catch (error) {
    console.error('Failed to sync push notifications:', error)
  }
}
