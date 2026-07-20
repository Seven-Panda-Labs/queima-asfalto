import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pt from './locales/pt.json'
import en from './locales/en.json'
import { buildEmojiLocaleResources } from '../constants/emojis'
import { guestStorageKey } from '../config/app'
import { scopedStorageKey } from '../utils/userStorage'

const emojiLocales = buildEmojiLocaleResources()

export const SUPPORTED_LANGUAGES = ['pt', 'en'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const GUEST_LANGUAGE_KEY = guestStorageKey('language-guest')

export function resolveBrowserLanguage(): AppLanguage {
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('en')) return 'en'
  return 'pt'
}

export function getStoredLanguage(userId?: string | null): AppLanguage | null {
  const key = userId ? scopedStorageKey(userId, 'language') : GUEST_LANGUAGE_KEY
  const stored = localStorage.getItem(key)
  if (stored === 'pt' || stored === 'en') return stored
  return null
}

export function setStoredLanguage(language: AppLanguage, userId?: string | null): void {
  const key = userId ? scopedStorageKey(userId, 'language') : GUEST_LANGUAGE_KEY
  localStorage.setItem(key, language)
}

export function detectInitialLanguage(userId?: string | null): AppLanguage {
  return getStoredLanguage(userId) ?? resolveBrowserLanguage()
}

export async function applyLanguage(language: AppLanguage, userId?: string | null): Promise<void> {
  setStoredLanguage(language, userId)
  await i18n.changeLanguage(language)
}

export async function syncLanguageForUser(userId?: string | null): Promise<void> {
  const language = detectInitialLanguage(userId)
  if (i18n.language !== language) {
    await i18n.changeLanguage(language)
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: { ...pt, emojis: emojiLocales.pt } },
    en: { translation: { ...en, emojis: emojiLocales.en } },
  },
  lng: resolveBrowserLanguage(),
  fallbackLng: 'pt',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
})

export default i18n
