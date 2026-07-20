import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import {
  DEFAULT_NOTIFICATION_PREFS,
  parseNotificationPrefs,
  type NotificationPrefs,
} from '../types/NotificationPrefs'
import type { UserResultsProfile } from '../types/UserResultsProfile'
import { formatParkrunnerId } from '../../shared/officialResults/parkrunnerId'
import { db } from './firebase'

function parseUserResultsProfile(data: Record<string, unknown>): UserResultsProfile {
  return {
    resultFirstName:
      typeof data.resultFirstName === 'string' ? data.resultFirstName : undefined,
    resultLastName: typeof data.resultLastName === 'string' ? data.resultLastName : undefined,
    resultNameAliases: Array.isArray(data.resultNameAliases)
      ? data.resultNameAliases.filter(
          (alias): alias is string => typeof alias === 'string' && alias.trim().length > 0,
        )
      : undefined,
    parkrunnerId:
      typeof data.parkrunnerId === 'string'
        ? formatParkrunnerId(data.parkrunnerId) || undefined
        : undefined,
    favoriteParkrunSlugs: Array.isArray(data.favoriteParkrunSlugs)
      ? data.favoriteParkrunSlugs.filter(
          (slug): slug is string => typeof slug === 'string' && slug.trim().length > 0,
        )
      : undefined,
  }
}

export async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    await setDoc(ref, {
      name: user.displayName ?? '',
      email: user.email ?? '',
      ...DEFAULT_NOTIFICATION_PREFS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function updateUserAppLanguage(userId: string, language: 'pt' | 'en'): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      appLanguage: language,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const snapshot = await getDoc(doc(db, 'users', userId))
  if (!snapshot.exists()) {
    return { ...DEFAULT_NOTIFICATION_PREFS }
  }
  return parseNotificationPrefs(snapshot.data())
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: Partial<NotificationPrefs>,
): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      ...prefs,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getUserResultsProfile(userId: string): Promise<UserResultsProfile> {
  const snapshot = await getDoc(doc(db, 'users', userId))
  if (!snapshot.exists()) return {}
  return parseUserResultsProfile(snapshot.data())
}

export async function updateUserResultsProfile(
  userId: string,
  profile: Partial<UserResultsProfile>,
): Promise<void> {
  const payload: Record<string, string | string[] | null> = {}

  if ('resultFirstName' in profile) {
    payload.resultFirstName = profile.resultFirstName?.trim() || null
  }
  if ('resultLastName' in profile) {
    payload.resultLastName = profile.resultLastName?.trim() || null
  }
  if ('resultNameAliases' in profile) {
    const aliases = profile.resultNameAliases?.map((alias) => alias.trim()).filter(Boolean) ?? []
    payload.resultNameAliases = aliases.length > 0 ? aliases : null
  }
  if ('parkrunnerId' in profile) {
    const trimmed = profile.parkrunnerId?.trim()
    payload.parkrunnerId = trimmed ? formatParkrunnerId(trimmed) || null : null
  }
  if ('favoriteParkrunSlugs' in profile) {
    const slugs =
      profile.favoriteParkrunSlugs
        ?.map((slug) => slug.trim().toLowerCase())
        .filter(Boolean) ?? []
    payload.favoriteParkrunSlugs = slugs.length > 0 ? [...new Set(slugs)] : null
  }

  await setDoc(
    doc(db, 'users', userId),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
