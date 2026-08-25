export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'de', 'fr', 'ar'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const RTL_LANGUAGES: readonly AppLanguage[] = ['ar']

export function isRtlLanguage(language: string): boolean {
  return (RTL_LANGUAGES as readonly string[]).includes(language)
}

export function resolveTextDirection(language: string): 'ltr' | 'rtl' {
  return isRtlLanguage(language) ? 'rtl' : 'ltr'
}
