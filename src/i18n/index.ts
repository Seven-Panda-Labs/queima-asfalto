import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { buildEmojiLocaleResources } from '../constants/emojis'
import { guestStorageKey } from '../config/app'
import { scopedStorageKey } from '../utils/userStorage'
import { normalizeAppLanguage } from './locale'
import { SUPPORTED_LANGUAGES, type AppLanguage } from './languages'

export { SUPPORTED_LANGUAGES, type AppLanguage } from './languages'

const emojiLocales = buildEmojiLocaleResources()

const LOCALE_LOADERS: Record<
  AppLanguage,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  pt: () => import('./locales/pt.json'),
  en: () => import('./locales/en.json'),
  es: () => import('./locales/es.json'),
  de: () => import('./locales/de.json'),
}

const loadedLocales = new Set<AppLanguage>()

const GUEST_LANGUAGE_KEY = guestStorageKey('language-guest')

let initPromise: Promise<typeof i18n> | null = null

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'pt' || value === 'en' || value === 'es' || value === 'de'
}

export function resolveBrowserLanguage(): AppLanguage {
  return normalizeAppLanguage(navigator.language)
}

export function getStoredLanguage(userId?: string | null): AppLanguage | null {
  const key = userId ? scopedStorageKey(userId, 'language') : GUEST_LANGUAGE_KEY
  const stored = localStorage.getItem(key)
  if (isAppLanguage(stored)) return stored
  return null
}

export function setStoredLanguage(language: AppLanguage, userId?: string | null): void {
  const key = userId ? scopedStorageKey(userId, 'language') : GUEST_LANGUAGE_KEY
  localStorage.setItem(key, language)
}

export function detectInitialLanguage(userId?: string | null): AppLanguage {
  return getStoredLanguage(userId) ?? resolveBrowserLanguage()
}

export async function ensureLocaleLoaded(language: AppLanguage): Promise<void> {
  if (loadedLocales.has(language)) return

  const mod = await LOCALE_LOADERS[language]()
  i18n.addResourceBundle(
    language,
    'translation',
    { ...mod.default, emojis: emojiLocales[language] },
    true,
    true,
  )
  loadedLocales.add(language)
}

async function loadLanguageBundles(language: AppLanguage): Promise<void> {
  const languages = new Set<AppLanguage>([language])
  if (language !== 'en') languages.add('en')

  await Promise.all([...languages].map((lng) => ensureLocaleLoaded(lng)))
}

export async function initI18n(userId?: string | null): Promise<typeof i18n> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const initialLanguage = detectInitialLanguage(userId)

    await i18n.use(initReactI18next).init({
      lng: initialLanguage,
      fallbackLng: 'en',
      supportedLngs: [...SUPPORTED_LANGUAGES],
      interpolation: { escapeValue: false },
    })

    await loadLanguageBundles(initialLanguage)
    return i18n
  })()

  return initPromise
}

export async function applyLanguage(language: AppLanguage, userId?: string | null): Promise<void> {
  await loadLanguageBundles(language)
  setStoredLanguage(language, userId)
  await i18n.changeLanguage(language)
}

export async function syncLanguageForUser(userId?: string | null): Promise<void> {
  await initI18n(userId)
  const language = detectInitialLanguage(userId)
  if (i18n.language !== language) {
    await applyLanguage(language, userId)
  }
}

export default i18n
