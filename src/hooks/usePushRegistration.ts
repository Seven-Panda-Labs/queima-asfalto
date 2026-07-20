import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getNotificationPermissionState } from '../services/notificationPermission'
import { useNotificationPrefs } from './useNotificationPrefs'

export function usePushRegistration() {
  const { user } = useAuth()
  const { prefs, loading } = useNotificationPrefs()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!user || loading) return
    if (getNotificationPermissionState() !== 'granted') return
    if (syncingRef.current) return

    syncingRef.current = true
    void import('../services/pushNotifications')
      .then(({ syncPushNotifications }) => syncPushNotifications(user.uid, prefs.notificationsEnabled))
      .finally(() => {
        syncingRef.current = false
      })
  }, [user, prefs.notificationsEnabled, loading])
}
