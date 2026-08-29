import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { UserResultsProfile } from '../types/UserResultsProfile'
import { getUserResultsProfile, updateUserResultsProfile } from '../services/users'
import { reportLoadError } from '../utils/loadError'

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
        setError(reportLoadError(loadError, 'errors.loadPrefs', 'useUserResultsProfile'))
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
        setError(reportLoadError(saveError, 'errors.savePrefsHook', 'useUserResultsProfile'))
        throw saveError
      } finally {
        setSaving(false)
      }
    },
    [user, profile],
  )

  return { profile, loading, saving, error, saveProfile }
}
