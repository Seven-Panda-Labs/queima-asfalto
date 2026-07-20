import { describe, expect, it } from 'vitest'
import {
  detectInitialThemePreference,
  getStoredThemePreference,
  resolveEffectiveTheme,
  setStoredThemePreference,
} from './theme'

describe('resolveEffectiveTheme', () => {
  it('uses explicit light and dark preferences', () => {
    expect(resolveEffectiveTheme('light')).toBe('light')
    expect(resolveEffectiveTheme('dark')).toBe('dark')
  })
})

describe('theme storage', () => {
  it('defaults to system when nothing is stored', () => {
    localStorage.clear()
    expect(detectInitialThemePreference()).toBe('system')
    expect(getStoredThemePreference()).toBeNull()
  })

  it('persists preference per user and guest cache', () => {
    localStorage.clear()
    setStoredThemePreference('dark', 'user-1')

    expect(getStoredThemePreference('user-1')).toBe('dark')
    expect(getStoredThemePreference()).toBe('dark')
    expect(detectInitialThemePreference('user-1')).toBe('dark')
  })
})
