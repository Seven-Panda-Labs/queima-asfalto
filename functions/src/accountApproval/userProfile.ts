import { FieldValue } from 'firebase-admin/firestore'
import type { AccountStatus, AppLanguage } from '../shared/account/types.js'
import { DEFAULT_NOTIFICATION_PREFS } from '../shared/reminders/notificationPrefs.js'

export function normalizeAccountEmail(email: string | undefined): string {
  return email?.trim().toLowerCase() ?? ''
}

export function resolveInitialAccountStatus(
  email: string | undefined,
  adminEmail: string | undefined,
): AccountStatus {
  const normalized = normalizeAccountEmail(email)
  if (!normalized) {
    return 'pending'
  }
  if (adminEmail && normalized === adminEmail) {
    return 'approved'
  }
  return 'pending'
}

export function buildInitialUserProfile(params: {
  uid: string
  displayName?: string
  email?: string
  accountStatus: AccountStatus
  registrationLocale?: AppLanguage
}): Record<string, unknown> {
  const profile: Record<string, unknown> = {
    name: params.displayName?.trim() ?? '',
    email: params.email?.trim() ?? '',
    accountStatus: params.accountStatus,
    notificationsEnabled: DEFAULT_NOTIFICATION_PREFS.notificationsEnabled,
    reminderDaysBefore: DEFAULT_NOTIFICATION_PREFS.reminderDaysBefore,
    reminderTime: DEFAULT_NOTIFICATION_PREFS.reminderTime,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (params.registrationLocale) {
    profile.appLanguage = params.registrationLocale
  }

  return profile
}

export function buildLegacyApprovedUserProfile(params: {
  uid: string
  displayName?: string
  email?: string
}): Record<string, unknown> {
  return buildInitialUserProfile({
    ...params,
    accountStatus: 'approved',
  })
}
