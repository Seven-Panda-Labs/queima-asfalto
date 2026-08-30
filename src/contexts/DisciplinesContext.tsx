import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_ENABLED_DISCIPLINES } from '../domain/disciplinePreferences'
import type { EventType } from '../domain/eventCodes'
import { getEnabledDisciplines, updateEnabledDisciplines } from '../services/users'
import { reportLoadError } from '../utils/loadError'
import { useAuth } from './AuthContext'

type DisciplinesContextValue = {
  /** Sorted shortest to longest, and never empty. */
  enabledDisciplines: EventType[]
  loading: boolean
  saving: boolean
  error: string | null
  saveEnabledDisciplines: (next: EventType[]) => Promise<void>
}

const DisciplinesContext = createContext<DisciplinesContextValue | null>(null)

/**
 * A context rather than a hook: almost every screen asks which disciplines to
 * offer, and one `getDoc` per page mount would be a fetch storm.
 */
export function DisciplinesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [enabledDisciplines, setEnabledDisciplines] = useState<EventType[]>(
    DEFAULT_ENABLED_DISCIPLINES,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setEnabledDisciplines(DEFAULT_ENABLED_DISCIPLINES)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void getEnabledDisciplines(user.uid)
      .then((disciplines) => {
        if (!cancelled) setEnabledDisciplines(disciplines)
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(reportLoadError(loadError, 'errors.loadPrefs', 'DisciplinesProvider'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const saveEnabledDisciplines = useCallback(
    async (next: EventType[]) => {
      if (!user || next.length === 0) return

      setSaving(true)
      setError(null)
      try {
        await updateEnabledDisciplines(user.uid, next)
        setEnabledDisciplines(next)
      } catch (saveError) {
        setError(reportLoadError(saveError, 'errors.savePrefsHook', 'DisciplinesProvider'))
        throw saveError
      } finally {
        setSaving(false)
      }
    },
    [user],
  )

  const value = useMemo(
    () => ({ enabledDisciplines, loading, saving, error, saveEnabledDisciplines }),
    [enabledDisciplines, loading, saving, error, saveEnabledDisciplines],
  )

  return <DisciplinesContext.Provider value={value}>{children}</DisciplinesContext.Provider>
}

export function useDisciplines(): DisciplinesContextValue {
  const context = useContext(DisciplinesContext)
  if (!context) {
    throw new Error('useDisciplines must be used within DisciplinesProvider')
  }
  return context
}
