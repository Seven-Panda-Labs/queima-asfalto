import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { syncLanguageForUser } from '../../i18n'

export function I18nSync() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    void syncLanguageForUser(user?.uid ?? null)
  }, [user?.uid, loading])

  return null
}
