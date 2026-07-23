import type { AppLanguage } from './languages'

export const CONTENT_LOCALES = ['pt', 'en', 'es', 'de'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]

export function normalizeAppLanguage(language: string): AppLanguage {
  if (language.startsWith('en')) return 'en'
  if (language.startsWith('es')) return 'es'
  if (language.startsWith('de')) return 'de'
  if (language.startsWith('pt')) return 'pt'
  return 'en'
}

export function resolveIntlLocale(language: string): string {
  if (language.startsWith('en')) return 'en-GB'
  if (language.startsWith('es')) return 'es-ES'
  if (language.startsWith('de')) return 'de-DE'
  if (language.startsWith('pt')) return 'pt-PT'
  return 'en-GB'
}

export function resolveContentLocale(language: string): ContentLocale {
  return normalizeAppLanguage(language)
}
