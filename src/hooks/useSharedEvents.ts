import { useCallback, useEffect, useState } from 'react'
import i18n from '../i18n'
import type { Event } from '../types/Event'
import type { SharePermissions } from '../types/Share'
import { fetchSharedSnapshot } from '../services/shares'
import { getSharedEventsCache, setSharedEventsCache } from '../utils/sharedDataCache'

export function useSharedEvents(ownerId: string | null) {
  const [events, setEvents] = useState<Event[]>([])
  const [ownerDisplayName, setOwnerDisplayName] = useState('')
  const [permissions, setPermissions] = useState<SharePermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyCache = useCallback((owner: string) => {
    const cached = getSharedEventsCache(owner)
    if (!cached) return false
    setEvents(cached.events)
    setOwnerDisplayName(cached.ownerDisplayName)
    setPermissions(cached.permissions)
    return true
  }, [])

  const refresh = useCallback(async () => {
    if (!ownerId) {
      setEvents([])
      setOwnerDisplayName('')
      setPermissions(null)
      setLoading(false)
      return
    }

    const hasCache = applyCache(ownerId)
    if (!hasCache) setLoading(true)
    setError(null)

    try {
      const snapshot = await fetchSharedSnapshot(ownerId, ['events'])
      const entry = {
        events: snapshot.events,
        ownerDisplayName: snapshot.ownerDisplayName,
        permissions: snapshot.permissions,
      }
      setSharedEventsCache(ownerId, entry)
      setEvents(entry.events)
      setOwnerDisplayName(entry.ownerDisplayName)
      setPermissions(entry.permissions)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : i18n.t('shares.loadError'))
      if (!hasCache) setEvents([])
    } finally {
      setLoading(false)
    }
  }, [ownerId, applyCache])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    events,
    ownerDisplayName,
    permissions,
    loading,
    error,
    refresh,
  }
}
