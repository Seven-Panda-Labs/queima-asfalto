import { guestStorageKey } from './config/app'
import { scopedStorageKey } from './utils/userStorage'

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type EffectiveTheme = 'light' | 'dark'

const GUEST_THEME_KEY = guestStorageKey('theme-guest')

export function resolveSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  if (preference === 'system') return resolveSystemTheme()
  return preference
}

export function getStoredThemePreference(userId?: string | null): ThemePreference | null {
  const key = userId ? scopedStorageKey(userId, 'theme') : GUEST_THEME_KEY
  const stored = localStorage.getItem(key)
  if (stored === 'system' || stored === 'light' || stored === 'dark') return stored
  return null
}

export function setStoredThemePreference(
  preference: ThemePreference,
  userId?: string | null,
): void {
  if (userId) {
    localStorage.setItem(scopedStorageKey(userId, 'theme'), preference)
  }
  localStorage.setItem(GUEST_THEME_KEY, preference)
}

export function detectInitialThemePreference(userId?: string | null): ThemePreference {
  return getStoredThemePreference(userId) ?? 'system'
}

export function applyThemeToDocument(
  effective: EffectiveTheme,
  preference: ThemePreference,
): void {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle('dark', effective === 'dark')
  document.documentElement.dataset.themePreference = preference
  document.documentElement.style.colorScheme = effective

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', effective === 'dark' ? '#121212' : '#2563EB')
  }
}

export function readCssColor(variableName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback

  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
  return value || fallback
}
