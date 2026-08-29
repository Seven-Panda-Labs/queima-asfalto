import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from '../types/NotificationPrefs'
import { getNotificationPrefs, updateNotificationPrefs } from '../services/users'
import { reportLoadError } from '../utils/loadError'

export function useNotificationPrefs() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setPrefs(DEFAULT_NOTIFICATION_PREFS)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    void getNotificationPrefs(user.uid)
      .then(setPrefs)
      .catch((loadError) => {
        setError(reportLoadError(loadError, 'errors.loadPrefs', 'useNotificationPrefs'))
      })
      .finally(() => setLoading(false))
  }, [user])

  const savePrefs = useCallback(
    async (nextPrefs: Partial<NotificationPrefs>) => {
      if (!user) return

      const merged = { ...prefs, ...nextPrefs }
      setSaving(true)
      setError(null)

      try {
        await updateNotificationPrefs(user.uid, nextPrefs)
        setPrefs(merged)
      } catch (saveError) {
        setError(reportLoadError(saveError, 'errors.savePrefsHook', 'useNotificationPrefs'))
        throw saveError
      } finally {
        setSaving(false)
      }
    },
    [user, prefs],
  )

  return { prefs, loading, saving, error, savePrefs }
}
