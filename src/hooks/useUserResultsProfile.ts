import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import i18n from '../i18n'
import type { UserResultsProfile } from '../types/UserResultsProfile'
import { getUserResultsProfile, updateUserResultsProfile } from '../services/users'

export function useUserResultsProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserResultsProfile>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile({})
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    void getUserResultsProfile(user.uid)
      .then(setProfile)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : i18n.t('errors.loadPrefs'))
      })
      .finally(() => setLoading(false))
  }, [user])

  const saveProfile = useCallback(
    async (nextProfile: Partial<UserResultsProfile>) => {
      if (!user) return

      const merged = { ...profile, ...nextProfile }
      setSaving(true)
      setError(null)

      try {
        await updateUserResultsProfile(user.uid, nextProfile)
        setProfile(merged)
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : i18n.t('errors.savePrefsHook'))
        throw saveError
      } finally {
        setSaving(false)
      }
    },
    [user, profile],
  )

  return { profile, loading, saving, error, saveProfile }
}
