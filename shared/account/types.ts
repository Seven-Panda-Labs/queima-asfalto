export const ACCOUNT_STATUSES = ['pending', 'approved', 'rejected'] as const

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export const APP_LANGUAGES = ['pt', 'en', 'es', 'de'] as const

export type AppLanguage = (typeof APP_LANGUAGES)[number]

export function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === 'string' && (ACCOUNT_STATUSES as readonly string[]).includes(value)
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (APP_LANGUAGES as readonly string[]).includes(value)
}

/** Legacy profiles without `accountStatus` are treated as approved. */
export function resolveEffectiveAccountStatus(
  data: Record<string, unknown> | undefined,
): AccountStatus {
  if (!data || !('accountStatus' in data)) {
    return 'approved'
  }
  return isAccountStatus(data.accountStatus) ? data.accountStatus : 'approved'
}

export function canAccessAppData(status: AccountStatus): boolean {
  return status === 'approved'
}

export function parseRegistrationLocale(locale: string | undefined): AppLanguage | undefined {
  if (!locale?.trim()) {
    return undefined
  }
  const code = locale.trim().split('-')[0]?.toLowerCase()
  return isAppLanguage(code) ? code : undefined
}
