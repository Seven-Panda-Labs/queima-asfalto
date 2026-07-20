import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from '../types/NotificationPrefs'
import { getNotificationPrefs, updateNotificationPrefs } from '../services/users'

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
        setError(loadError instanceof Error ? loadError.message : i18n.t('errors.loadPrefs'))
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
        setError(saveError instanceof Error ? saveError.message : i18n.t('errors.savePrefsHook'))
        throw saveError
      } finally {
        setSaving(false)
      }
    },
    [user, prefs],
  )

  return { prefs, loading, saving, error, savePrefs }
}
