import type { AppLanguage } from './languages'

export function normalizeAppLanguage(language: string): AppLanguage {
  if (language.startsWith('en')) return 'en'
  if (language.startsWith('es')) return 'es'
  if (language.startsWith('de')) return 'de'
  if (language.startsWith('fr')) return 'fr'
  if (language.startsWith('ar')) return 'ar'
  if (language.startsWith('pt')) return 'pt'
  return 'en'
}

export function resolveIntlLocale(language: string): string {
  if (language.startsWith('en')) return 'en-GB'
  if (language.startsWith('es')) return 'es-ES'
  if (language.startsWith('de')) return 'de-DE'
  if (language.startsWith('fr')) return 'fr-FR'
  // Latin digits keep times/distances consistent with the app's own number formatting.
  if (language.startsWith('ar')) return 'ar-u-nu-latn'
  if (language.startsWith('pt')) return 'pt-PT'
  return 'en-GB'
}
