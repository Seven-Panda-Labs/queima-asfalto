import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { updateChartTheme } from '../components/Charts/chartConfig'
import {
  applyThemeToDocument,
  detectInitialThemePreference,
  resolveEffectiveTheme,
  setStoredThemePreference,
  type EffectiveTheme,
  type ThemePreference,
} from '../theme'
import { useAuth } from './AuthContext'

type ThemeContextValue = {
  preference: ThemePreference
  effectiveTheme: EffectiveTheme
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const userId = user?.uid ?? null
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    detectInitialThemePreference(null),
  )

  useEffect(() => {
    if (loading) return
    setPreferenceState(detectInitialThemePreference(userId))
  }, [userId, loading])

  const effectiveTheme = useMemo(() => resolveEffectiveTheme(preference), [preference])

  useEffect(() => {
    applyThemeToDocument(effectiveTheme, preference)
    updateChartTheme()
  }, [effectiveTheme, preference])

  useEffect(() => {
    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const next = resolveEffectiveTheme('system')
      applyThemeToDocument(next, 'system')
      updateChartTheme()
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setStoredThemePreference(next, userId)
      setPreferenceState(next)
    },
    [userId],
  )

  const value = useMemo(
    () => ({ preference, effectiveTheme, setPreference }),
    [preference, effectiveTheme, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
